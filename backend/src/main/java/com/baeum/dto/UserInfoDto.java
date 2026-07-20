package com.baeum.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserInfoDto {

    private Long id;
    private String username;
    private String name;

    @JsonProperty("school_name")
    private String schoolName;

    private Integer grade;

    @JsonProperty("class_num")
    private Integer classNum;

    @JsonProperty("student_num")
    private Integer studentNum;

    private String gender;
    private String avatar;

    @JsonProperty("created_at")
    private String createdAt;
}
