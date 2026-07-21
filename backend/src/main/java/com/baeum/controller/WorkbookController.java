package com.baeum.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baeum.dto.WorkbookCompleteResponse;
import com.baeum.dto.WorkbookDto;
import com.baeum.dto.WorkbookUpdateRequest;
import com.baeum.service.WorkbookService;

@RestController
@RequestMapping("/api/workbooks")
public class WorkbookController {

    private final WorkbookService workbookService;

    public WorkbookController(WorkbookService workbookService) {
        this.workbookService = workbookService;
    }

    @GetMapping("/completed-country-ids")
    public ResponseEntity<List<Long>> getCompletedCountryIds() {
        return ResponseEntity.ok(workbookService.getCompletedCountryIds());
    }

    @GetMapping("/{countryId}")
    public ResponseEntity<WorkbookDto> getWorkbook(@PathVariable Long countryId) {
        return ResponseEntity.ok(workbookService.getWorkbook(countryId));
    }

    @PostMapping("/{countryId}")
    public ResponseEntity<WorkbookDto> createWorkbook(@PathVariable Long countryId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workbookService.createWorkbook(countryId));
    }

    @PatchMapping("/{countryId}")
    public ResponseEntity<WorkbookDto> updateWorkbook(
            @PathVariable Long countryId,
            @RequestBody WorkbookUpdateRequest request) {
        return ResponseEntity.ok(workbookService.updateWorkbook(countryId, request));
    }

    @PatchMapping("/{countryId}/complete")
    public ResponseEntity<WorkbookCompleteResponse> completeWorkbook(@PathVariable Long countryId) {
        return ResponseEntity.ok(workbookService.completeWorkbook(countryId));
    }
}
