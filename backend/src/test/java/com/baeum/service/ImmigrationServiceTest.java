package com.baeum.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.baeum.dto.ImmigrationStatusDto;
import com.baeum.entity.Country;
import com.baeum.entity.UserCountry;
import com.baeum.repository.CountryRepository;
import com.baeum.repository.UserCountryRepository;
import com.baeum.util.AuthUtil;

@ExtendWith(MockitoExtension.class)
class ImmigrationServiceTest {

    @Mock
    private UserCountryRepository userCountryRepository;

    @Mock
    private CountryRepository countryRepository;

    @Mock
    private AuthUtil authUtil;

    private ImmigrationService immigrationService;

    @BeforeEach
    void setUp() {
        immigrationService = new ImmigrationService(userCountryRepository, countryRepository, authUtil);
    }

    @Test
    void returnsNotPassedStatusWhenUserCountryDoesNotExist() {
        when(countryRepository.findById(2L)).thenReturn(Optional.of(new Country()));
        when(authUtil.getCurrentUserId()).thenReturn(1L);
        when(userCountryRepository.findByUserIdAndCountryId(1L, 2L)).thenReturn(Optional.empty());

        ImmigrationStatusDto result = immigrationService.getImmigrationStatus(2L);

        assertEquals(2L, result.getCountryId());
        assertNull(result.getUserCountryId());
        assertFalse(result.isImmigrationPassed());
        assertFalse(result.isAlreadyPassed());
    }

    @Test
    void storesFailedScoreWithoutPassingImmigration() {
        UserCountry userCountry = userCountry();
        when(countryRepository.findById(2L)).thenReturn(Optional.of(new Country()));
        when(authUtil.getCurrentUserId()).thenReturn(1L);
        when(userCountryRepository.findByUserIdAndCountryId(1L, 2L)).thenReturn(Optional.of(userCountry));
        when(userCountryRepository.save(userCountry)).thenReturn(userCountry);

        ImmigrationStatusDto result = immigrationService.submitImmigration(2L, 1);

        assertFalse(result.isImmigrationPassed());
        assertEquals(1, result.getImmigrationScore());
        assertNull(result.getImmigrationCompletedAt());
        assertTrue(result.isRetryBlocked());
        assertTrue(result.getRetryRemainingSeconds() > 0);
        assertNotNull(Instant.parse(result.getImmigrationRetryAvailableAt()));
    }

    @Test
    void blocksSubmitWhileRetryDelayIsActive() {
        UserCountry userCountry = userCountry();
        userCountry.setImmigrationScore(1);
        userCountry.setImmigrationRetryAvailableAt(Instant.now().plusSeconds(300).toString());
        when(countryRepository.findById(2L)).thenReturn(Optional.of(new Country()));
        when(authUtil.getCurrentUserId()).thenReturn(1L);
        when(userCountryRepository.findByUserIdAndCountryId(1L, 2L)).thenReturn(Optional.of(userCountry));

        ImmigrationStatusDto result = immigrationService.submitImmigration(2L, 2);

        assertFalse(result.isImmigrationPassed());
        assertTrue(result.isRetryBlocked());
        assertTrue(result.getRetryRemainingSeconds() > 0);
        verify(userCountryRepository, never()).save(any(UserCountry.class));
    }

    @Test
    void allowsSubmitAfterRetryDelayExpires() {
        UserCountry userCountry = userCountry();
        userCountry.setImmigrationRetryAvailableAt(Instant.now().minusSeconds(1).toString());
        when(countryRepository.findById(2L)).thenReturn(Optional.of(new Country()));
        when(authUtil.getCurrentUserId()).thenReturn(1L);
        when(userCountryRepository.findByUserIdAndCountryId(1L, 2L)).thenReturn(Optional.of(userCountry));
        when(userCountryRepository.save(userCountry)).thenReturn(userCountry);

        ImmigrationStatusDto result = immigrationService.submitImmigration(2L, 2);

        assertTrue(result.isImmigrationPassed());
        assertFalse(result.isRetryBlocked());
        assertEquals(0, result.getRetryRemainingSeconds());
    }

    @Test
    void storesPassingScoreAndCompletedAt() {
        UserCountry userCountry = userCountry();
        when(countryRepository.findById(2L)).thenReturn(Optional.of(new Country()));
        when(authUtil.getCurrentUserId()).thenReturn(1L);
        when(userCountryRepository.findByUserIdAndCountryId(1L, 2L)).thenReturn(Optional.of(userCountry));
        when(userCountryRepository.save(userCountry)).thenReturn(userCountry);

        ImmigrationStatusDto result = immigrationService.submitImmigration(2L, 2);

        assertTrue(result.isImmigrationPassed());
        assertEquals(2, result.getImmigrationScore());
        assertNotNull(Instant.parse(result.getImmigrationCompletedAt()));
        assertEquals(result.getImmigrationCompletedAt(), userCountry.getImmigrationPassedAt());
    }

    @Test
    void doesNotOverwriteAlreadyPassedImmigration() {
        UserCountry userCountry = userCountry();
        userCountry.setImmigrationPassed(1);
        userCountry.setImmigrationScore(3);
        userCountry.setImmigrationPassedAt("2026-06-29T00:00:00Z");
        userCountry.setImmigrationCompletedAt("2026-06-29T00:00:00Z");
        when(countryRepository.findById(2L)).thenReturn(Optional.of(new Country()));
        when(authUtil.getCurrentUserId()).thenReturn(1L);
        when(userCountryRepository.findByUserIdAndCountryId(1L, 2L)).thenReturn(Optional.of(userCountry));

        ImmigrationStatusDto result = immigrationService.submitImmigration(2L, 2);

        assertTrue(result.isImmigrationPassed());
        assertTrue(result.isAlreadyPassed());
        assertEquals("2026-06-29T00:00:00Z", result.getImmigrationCompletedAt());
        verify(userCountryRepository, never()).save(any(UserCountry.class));
    }

    @Test
    void retryClearsFailedScoreOnlyWhenNotPassed() {
        UserCountry userCountry = userCountry();
        userCountry.setImmigrationScore(1);
        when(countryRepository.findById(2L)).thenReturn(Optional.of(new Country()));
        when(authUtil.getCurrentUserId()).thenReturn(1L);
        when(userCountryRepository.findByUserIdAndCountryId(1L, 2L)).thenReturn(Optional.of(userCountry));
        when(userCountryRepository.save(userCountry)).thenReturn(userCountry);

        ImmigrationStatusDto result = immigrationService.retryImmigration(2L);

        assertFalse(result.isImmigrationPassed());
        assertNull(result.getImmigrationScore());
        assertNull(result.getImmigrationCompletedAt());
        assertNull(userCountry.getImmigrationRetryAvailableAt());
    }

    private UserCountry userCountry() {
        UserCountry userCountry = new UserCountry();
        userCountry.setId(10L);
        userCountry.setUserId(1L);
        userCountry.setCountryId(2L);
        userCountry.setImmigrationPassed(0);
        userCountry.setAddedAt("2026-06-29T00:00:00Z");
        return userCountry;
    }
}
