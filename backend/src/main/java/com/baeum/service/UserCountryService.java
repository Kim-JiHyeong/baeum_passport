package com.baeum.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baeum.dto.UserCountryDto;
import com.baeum.dto.UserCountryResponseDto;
import com.baeum.entity.Continent;
import com.baeum.entity.Country;
import com.baeum.entity.UserCountry;
import com.baeum.exception.DuplicateResourceException;
import com.baeum.exception.ForbiddenException;
import com.baeum.exception.ResourceNotFoundException;
import com.baeum.repository.ContinentRepository;
import com.baeum.repository.CountryRepository;
import com.baeum.repository.UserCountryRepository;
import com.baeum.util.AuthUtil;

@Service
@Transactional(readOnly = true)
public class UserCountryService {

    private final UserCountryRepository userCountryRepository;
    private final CountryRepository countryRepository;
    private final ContinentRepository continentRepository;
    private final AuthUtil authUtil;

    public UserCountryService(
            UserCountryRepository userCountryRepository,
            CountryRepository countryRepository,
            ContinentRepository continentRepository,
            AuthUtil authUtil) {
        this.userCountryRepository = userCountryRepository;
        this.countryRepository = countryRepository;
        this.continentRepository = continentRepository;
        this.authUtil = authUtil;
    }

    public List<UserCountryDto> getAllUserCountries() {
        Long userId = authUtil.getCurrentUserId();

        return userCountryRepository.findByUserId(userId).stream()
                .map(this::toUserCountryDto)
                .toList();
    }

    @Transactional
    public UserCountryResponseDto addUserCountry(Long countryId) {
        Long userId = authUtil.getCurrentUserId();
        countryRepository.findById(countryId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 국가를 찾을 수 없습니다."));

        if (userCountryRepository.existsByUserIdAndCountryId(userId, countryId)) {
            throw new DuplicateResourceException("이미 추가된 국가입니다.");
        }

        UserCountry userCountry = new UserCountry();
        userCountry.setUserId(userId);
        userCountry.setCountryId(countryId);
        userCountry.setImmigrationPassed(0);
        userCountry.setImmigrationScore(null);
        userCountry.setAddedAt(Instant.now().toString());

        return toResponseDto(userCountryRepository.save(userCountry));
    }

    @Transactional
    public void deleteUserCountry(Long id) {
        Long userId = authUtil.getCurrentUserId();
        UserCountry userCountry = getOwnedUserCountry(id, userId);
        userCountryRepository.delete(userCountry);
    }

    @Transactional
    public UserCountryResponseDto passImmigration(Long id) {
        Long userId = authUtil.getCurrentUserId();
        UserCountry userCountry = getOwnedUserCountry(id, userId);

        if (isImmigrationPassed(userCountry)) {
            return toResponseDto(userCountry, true, "이미 입국심사를 통과한 국가입니다.");
        }

        String completedAt = Instant.now().toString();
        userCountry.setImmigrationPassed(1);
        userCountry.setImmigrationScore(3);
        userCountry.setImmigrationPassedAt(completedAt);
        userCountry.setImmigrationCompletedAt(completedAt);
        userCountry.setImmigrationRetryAvailableAt(null);

        return toResponseDto(userCountryRepository.save(userCountry), false, "입국심사를 통과했습니다.");
    }

    private UserCountryDto toUserCountryDto(UserCountry userCountry) {
        Country country = countryRepository.findById(userCountry.getCountryId())
                .orElseThrow(() -> new ResourceNotFoundException("해당 국가를 찾을 수 없습니다."));
        Continent continent = continentRepository.findById(country.getContinentId())
                .orElseThrow(() -> new ResourceNotFoundException("해당 대륙을 찾을 수 없습니다."));

        return new UserCountryDto(
                userCountry.getId(),
                country.getId(),
                country.getName(),
                country.getFlagImageUrl(),
                country.getCapital(),
                continent.getName(),
                isImmigrationPassed(userCountry),
                userCountry.getImmigrationPassedAt(),
                userCountry.getImmigrationScore(),
                userCountry.getImmigrationCompletedAt(),
                userCountry.getAddedAt());
    }

    private UserCountry getOwnedUserCountry(Long id, Long userId) {
        UserCountry userCountry = userCountryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("해당 항목을 찾을 수 없습니다."));

        if (!userId.equals(userCountry.getUserId())) {
            throw new ForbiddenException("권한이 없습니다.");
        }

        return userCountry;
    }

    private UserCountryResponseDto toResponseDto(UserCountry userCountry) {
        return toResponseDto(userCountry, false, null);
    }

    private UserCountryResponseDto toResponseDto(UserCountry userCountry, boolean alreadyPassed, String message) {
        return new UserCountryResponseDto(
                userCountry.getId(),
                userCountry.getCountryId(),
                isImmigrationPassed(userCountry),
                userCountry.getImmigrationPassedAt(),
                userCountry.getImmigrationScore(),
                userCountry.getImmigrationCompletedAt(),
                alreadyPassed,
                message,
                userCountry.getAddedAt());
    }

    private boolean isImmigrationPassed(UserCountry userCountry) {
        return Integer.valueOf(1).equals(userCountry.getImmigrationPassed());
    }
}
