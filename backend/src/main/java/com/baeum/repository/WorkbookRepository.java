package com.baeum.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baeum.entity.Workbook;

public interface WorkbookRepository extends JpaRepository<Workbook, Long> {

    Optional<Workbook> findByUserIdAndCountryId(Long userId, Long countryId);

    List<Workbook> findByUserIdAndCompleted(Long userId, Integer completed);
}
