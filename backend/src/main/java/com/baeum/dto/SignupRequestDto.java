package com.baeum.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequestDto {

    @NotNull(message = "학년을 입력해주세요.")
    private Integer grade;

    @NotNull(message = "반을 입력해주세요.")
    @JsonProperty("class_num")
    private Integer classNum;

    @NotNull(message = "번호를 입력해주세요.")
    @JsonProperty("student_num")
    private Integer studentNum;

    @NotNull(message = "성을 입력해주세요.")
    @JsonProperty("last_name")
    private String lastName;

    @NotNull(message = "이름을 입력해주세요.")
    @JsonProperty("first_name")
    private String firstName;

    @NotNull(message = "성별을 입력해주세요.")
    private String gender;

    private String avatar;
}
