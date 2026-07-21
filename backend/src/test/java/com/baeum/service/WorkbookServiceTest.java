package com.baeum.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.baeum.entity.Workbook;
import com.baeum.repository.CountryRepository;
import com.baeum.repository.StampRepository;
import com.baeum.repository.WorkbookRepository;
import com.baeum.util.AuthUtil;

@ExtendWith(MockitoExtension.class)
class WorkbookServiceTest {

    @Mock
    private WorkbookRepository workbookRepository;

    @Mock
    private CountryRepository countryRepository;

    @Mock
    private StampRepository stampRepository;

    @Mock
    private AuthUtil authUtil;

    private WorkbookService workbookService;

    @BeforeEach
    void setUp() {
        workbookService = new WorkbookService(workbookRepository, countryRepository, stampRepository, authUtil);
    }

    @Test
    void returnsCompletedCountryIdsForCurrentUser() {
        Workbook japan = workbook(2L);
        Workbook france = workbook(5L);

        when(authUtil.getCurrentUserId()).thenReturn(10L);
        when(workbookRepository.findByUserIdAndCompleted(10L, 1)).thenReturn(List.of(japan, france));

        List<Long> result = workbookService.getCompletedCountryIds();

        assertEquals(List.of(2L, 5L), result);
    }

    private Workbook workbook(Long countryId) {
        Workbook workbook = new Workbook();
        workbook.setCountryId(countryId);
        workbook.setCompleted(1);
        return workbook;
    }
}
