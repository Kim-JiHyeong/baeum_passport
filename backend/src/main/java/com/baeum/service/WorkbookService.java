package com.baeum.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baeum.dto.WorkbookCompleteResponse;
import com.baeum.dto.WorkbookDto;
import com.baeum.dto.WorkbookUpdateRequest;
import com.baeum.entity.Country;
import com.baeum.entity.Stamp;
import com.baeum.entity.Workbook;
import com.baeum.exception.DuplicateResourceException;
import com.baeum.exception.ForbiddenException;
import com.baeum.exception.ResourceNotFoundException;
import com.baeum.repository.CountryRepository;
import com.baeum.repository.StampRepository;
import com.baeum.repository.WorkbookRepository;
import com.baeum.util.AuthUtil;

@Service
@Transactional(readOnly = true)
public class WorkbookService {

    private final WorkbookRepository workbookRepository;
    private final CountryRepository countryRepository;
    private final StampRepository stampRepository;
    private final AuthUtil authUtil;

    public WorkbookService(
            WorkbookRepository workbookRepository,
            CountryRepository countryRepository,
            StampRepository stampRepository,
            AuthUtil authUtil) {
        this.workbookRepository = workbookRepository;
        this.countryRepository = countryRepository;
        this.stampRepository = stampRepository;
        this.authUtil = authUtil;
    }

    @Transactional
    public WorkbookDto getWorkbook(Long countryId) {
        Long userId = authUtil.getCurrentUserId();
        Workbook workbook = workbookRepository.findByUserIdAndCountryId(userId, countryId)
                .orElseGet(() -> createEmptyWorkbook(userId, countryId));
        return toDto(workbook);
    }

    public List<Long> getCompletedCountryIds() {
        Long userId = authUtil.getCurrentUserId();
        return workbookRepository.findByUserIdAndCompleted(userId, 1).stream()
                .map(Workbook::getCountryId)
                .toList();
    }

    @Transactional
    public WorkbookDto createWorkbook(Long countryId) {
        Long userId = authUtil.getCurrentUserId();
        Country country = countryRepository.findById(countryId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 국가를 찾을 수 없습니다."));

        if (!Integer.valueOf(1).equals(country.getIsFeatured())) {
            throw new ForbiddenException("대표 국가만 여행한 국가를 작성할 수 있습니다.");
        }

        if (workbookRepository.findByUserIdAndCountryId(userId, countryId).isPresent()) {
            throw new DuplicateResourceException("이미 여행한 국가가 존재합니다.");
        }

        Workbook workbook = new Workbook();
        workbook.setUserId(userId);
        workbook.setCountryId(countryId);
        workbook.setCompleted(0);

        return toDto(workbookRepository.save(workbook));
    }

    @Transactional
    public WorkbookDto updateWorkbook(Long countryId, WorkbookUpdateRequest request) {
        Long userId = authUtil.getCurrentUserId();
        Workbook workbook = findByUserIdAndCountryId(userId, countryId);

        applyUpdate(workbook, request);

        return toDto(workbookRepository.save(workbook));
    }

    @Transactional
    public WorkbookCompleteResponse completeWorkbook(Long countryId) {
        Long userId = authUtil.getCurrentUserId();
        Workbook workbook = findByUserIdAndCountryId(userId, countryId);

        workbook.setCompleted(1);
        workbook.setCompletedAt(Instant.now().toString());
        Workbook savedWorkbook = workbookRepository.save(workbook);

        boolean stampCreated = false;
        if (!stampRepository.existsByUserIdAndCountryId(userId, countryId)) {
            Stamp stamp = new Stamp();
            stamp.setUserId(userId);
            stamp.setCountryId(countryId);
            stamp.setCreatedAt(Instant.now().toString());
            stampRepository.save(stamp);
            stampCreated = true;
        }

        return new WorkbookCompleteResponse(toDto(savedWorkbook), stampCreated);
    }

    private Workbook createEmptyWorkbook(Long userId, Long countryId) {
        countryRepository.findById(countryId)
                .orElseThrow(() -> new ResourceNotFoundException("Country not found."));

        Workbook workbook = new Workbook();
        workbook.setUserId(userId);
        workbook.setCountryId(countryId);
        workbook.setCompleted(0);
        return workbookRepository.save(workbook);
    }

    private void applyUpdate(Workbook workbook, WorkbookUpdateRequest request) {
        if (request.getCapital() != null) {
            workbook.setCapital(request.getCapital());
        }
        if (request.getLanguage() != null) {
            workbook.setLanguage(request.getLanguage());
        }
        if (request.getPopulation() != null) {
            workbook.setPopulation(request.getPopulation());
        }
        if (request.getArea() != null) {
            workbook.setArea(request.getArea());
        }
        if (request.getPopulationComparison() != null) {
            workbook.setPopulationComparison(request.getPopulationComparison());
        }
        if (request.getAreaComparison() != null) {
            workbook.setAreaComparison(request.getAreaComparison());
        }
        if (request.getFlagImage() != null) {
            workbook.setFlagImage(request.getFlagImage());
        }
        if (request.getMapImage() != null) {
            workbook.setMapImage(request.getMapImage());
        }
        if (request.getFlagObservation() != null) {
            workbook.setFlagObservation(request.getFlagObservation());
        }
        if (request.getContinent() != null) {
            workbook.setContinent(request.getContinent());
        }
        if (request.getMapLocation() != null) {
            workbook.setMapLocation(request.getMapLocation());
        }
        if (request.getGreeting() != null) {
            workbook.setGreeting(request.getGreeting());
        }
        if (request.getResearchTopic() != null) {
            workbook.setResearchTopic(request.getResearchTopic());
        }
        if (request.getSimilarityWithKorea() != null) {
            workbook.setSimilarityWithKorea(request.getSimilarityWithKorea());
        }
        if (request.getDifferenceFromKorea() != null) {
            workbook.setDifferenceFromKorea(request.getDifferenceFromKorea());
        }
        if (request.getQuestion() != null) {
            workbook.setQuestion(request.getQuestion());
        }
        if (request.getSources() != null) {
            workbook.setSources(request.getSources());
        }
    }

    private Workbook findByUserIdAndCountryId(Long userId, Long countryId) {
        return workbookRepository.findByUserIdAndCountryId(userId, countryId)
                .orElseThrow(() -> new ResourceNotFoundException("여행한 국가를 찾을 수 없습니다."));
    }

    private WorkbookDto toDto(Workbook workbook) {
        return new WorkbookDto(
                workbook.getId(),
                workbook.getCountryId(),
                workbook.getCapital(),
                workbook.getLanguage(),
                workbook.getPopulation(),
                workbook.getArea(),
                workbook.getPopulationComparison(),
                workbook.getAreaComparison(),
                workbook.getFlagImage(),
                workbook.getMapImage(),
                workbook.getFlagObservation(),
                workbook.getContinent(),
                workbook.getMapLocation(),
                workbook.getGreeting(),
                workbook.getResearchTopic(),
                workbook.getSimilarityWithKorea(),
                workbook.getDifferenceFromKorea(),
                workbook.getQuestion(),
                workbook.getSources(),
                workbook.getCompleted(),
                workbook.getCompletedAt());
    }
}
