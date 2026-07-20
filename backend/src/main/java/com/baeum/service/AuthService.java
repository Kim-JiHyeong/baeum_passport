package com.baeum.service;

import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baeum.dto.AuthResponseDto;
import com.baeum.dto.LoginRequestDto;
import com.baeum.dto.SignupRequestDto;
import com.baeum.dto.UserInfoDto;
import com.baeum.entity.User;
import com.baeum.exception.DuplicateResourceException;
import com.baeum.exception.ResourceNotFoundException;
import com.baeum.exception.UnauthorizedException;
import com.baeum.jwt.JwtUtil;
import com.baeum.repository.UserRepository;

@Service
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponseDto signup(SignupRequestDto request) {
        String studentCode = createStudentCode(request.getGrade(), request.getClassNum(), request.getStudentNum());
        String schoolName = normalizeInput(request.getSchoolName());
        String name = normalizeInput(request.getLastName() + request.getFirstName());
        String username = schoolName + studentCode + name;

        if (userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("이미 존재하는 계정입니다.");
        }

        String encodedPassword = passwordEncoder.encode(studentCode);
        User user = new User(
                username,
                encodedPassword,
                name,
                schoolName,
                request.getGrade(),
                request.getClassNum(),
                request.getStudentNum(),
                request.getGender(),
                request.getAvatar());
        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getUsername());

        return new AuthResponseDto(
                token,
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getName(),
                savedUser.getAvatar());
    }

    public AuthResponseDto login(LoginRequestDto request) {
        String username = normalizeInput(request.getUsername());
        String password = normalizeInput(request.getPassword());

        User user = findUserByLoginUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 계정입니다."));

        if (passwordCandidates(password).stream().noneMatch(candidate -> passwordEncoder.matches(candidate, user.getPassword()))) {
            throw new UnauthorizedException("비밀번호가 올바르지 않습니다.");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        return new AuthResponseDto(token, user.getId(), user.getUsername(), user.getName(), user.getAvatar());
    }

    public UserInfoDto getMyInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        return new UserInfoDto(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getSchoolName(),
                user.getGrade(),
                user.getClassNum(),
                user.getStudentNum(),
                user.getGender(),
                user.getAvatar(),
                user.getCreatedAt());
    }

    private String createStudentCode(Integer grade, Integer classNum, Integer studentNum) {
        return String.valueOf(grade) + classNum + String.format("%02d", studentNum);
    }

    private Optional<User> findUserByLoginUsername(String username) {
        for (String candidate : usernameCandidates(username)) {
            Optional<User> user = userRepository.findByUsername(candidate);
            if (user.isPresent()) {
                return user;
            }
        }
        return Optional.empty();
    }

    private Set<String> usernameCandidates(String username) {
        Set<String> candidates = new LinkedHashSet<>();
        candidates.add(username);

        int codeStartIndex = -1;
        for (int i = 0; i < username.length(); i++) {
            if (Character.isDigit(username.charAt(i))) {
                codeStartIndex = i;
                break;
            }
        }

        if (codeStartIndex >= 0) {
            int nameStartIndex = codeStartIndex;
            while (nameStartIndex < username.length() && Character.isDigit(username.charAt(nameStartIndex))) {
                nameStartIndex++;
            }

            String schoolName = username.substring(0, codeStartIndex);
            String studentCode = username.substring(codeStartIndex, nameStartIndex);
            String name = username.substring(nameStartIndex);
            for (String candidateCode : studentCodeCandidates(studentCode)) {
                candidates.add(schoolName + candidateCode + name);
            }
        }

        return candidates;
    }

    private Set<String> passwordCandidates(String password) {
        Set<String> candidates = new LinkedHashSet<>();
        candidates.add(password);
        candidates.addAll(studentCodeCandidates(password));
        return candidates;
    }

    private Set<String> studentCodeCandidates(String studentCode) {
        Set<String> candidates = new LinkedHashSet<>();
        candidates.add(studentCode);

        if (!studentCode.chars().allMatch(Character::isDigit) || studentCode.length() < 3) {
            return candidates;
        }

        String grade = studentCode.substring(0, 1);
        String rest = studentCode.substring(1);
        for (int classLength = 1; classLength <= 2; classLength++) {
            int studentLength = rest.length() - classLength;
            if (studentLength < 1 || studentLength > 2) {
                continue;
            }

            String classPart = rest.substring(0, classLength);
            String studentPart = rest.substring(classLength);
            int classNum = Integer.parseInt(classPart);
            int studentNum = Integer.parseInt(studentPart);
            candidates.add(grade + classNum + studentNum);
            candidates.add(grade + String.valueOf(classNum) + String.format("%02d", studentNum));
            candidates.add(grade + String.format("%02d", classNum) + String.format("%02d", studentNum));
        }

        return candidates;
    }

    private String normalizeInput(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", "");
    }
}
