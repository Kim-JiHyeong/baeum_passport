package com.baeum.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_countries")
@Getter
@Setter
@NoArgsConstructor
public class UserCountry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "country_id")
    private Long countryId;

    @Column(name = "added_at")
    private String addedAt;

    @Column(name = "immigration_passed")
    private Integer immigrationPassed;

    @Column(name = "immigration_passed_at")
    private String immigrationPassedAt;

    @Column(name = "immigration_score")
    private Integer immigrationScore;

    @Column(name = "immigration_completed_at")
    private String immigrationCompletedAt;

    @Column(name = "immigration_retry_available_at")
    private String immigrationRetryAvailableAt;
}
