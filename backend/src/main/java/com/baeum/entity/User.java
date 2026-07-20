package com.baeum.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String password;
    private String name;

    @Column(name = "school_name")
    private String schoolName;

    private Integer grade;

    @Column(name = "class_num")
    private Integer classNum;

    @Column(name = "student_num")
    private Integer studentNum;

    private String gender;

    private String avatar;

    @Column(name = "created_at")
    private String createdAt;

    public User(
            String username,
            String password,
            String name,
            String schoolName,
            Integer grade,
            Integer classNum,
            Integer studentNum,
            String gender,
            String avatar) {
        this.username = username;
        this.password = password;
        this.name = name;
        this.schoolName = schoolName;
        this.grade = grade;
        this.classNum = classNum;
        this.studentNum = studentNum;
        this.gender = gender;
        this.avatar = avatar;
        this.createdAt = Instant.now().toString();
    }

    public User(
            String username,
            String password,
            String name,
            Integer grade,
            Integer classNum,
            Integer studentNum,
            String gender,
            String avatar) {
        this(username, password, name, null, grade, classNum, studentNum, gender, avatar);
    }
}
