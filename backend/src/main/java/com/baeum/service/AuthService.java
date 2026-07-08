package com.baeum.service;

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
        String name = request.getLastName() + request.getFirstName();
        String username = studentCode + name;

        if (userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("이미 존재하는 계정입니다.");
        }

        String encodedPassword = passwordEncoder.encode(studentCode);
        User user = new User(
                username,
                encodedPassword,
                name,
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
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 계정입니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
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
                user.getGrade(),
                user.getClassNum(),
                user.getStudentNum(),
                user.getGender(),
                user.getAvatar(),
                user.getCreatedAt());
    }

    private String createStudentCode(Integer grade, Integer classNum, Integer studentNum) {
        return String.valueOf(grade) + classNum + studentNum;
    }
}
