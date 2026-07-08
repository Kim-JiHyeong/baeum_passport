package com.baeum.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.baeum.dto.AuthResponseDto;
import com.baeum.dto.LoginRequestDto;
import com.baeum.dto.SignupRequestDto;
import com.baeum.entity.User;
import com.baeum.jwt.JwtUtil;
import com.baeum.repository.UserRepository;

import org.mockito.Mockito;

class AuthServiceTest {

    private UserRepository userRepository;
    private JwtUtil jwtUtil;
    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "baeumyeokwonSecretKey1234567890abcdef");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 86_400_000L);
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(userRepository, jwtUtil, passwordEncoder);
    }

    @Test
    void signupCreatesUsernameAndPasswordFromStudentInfo() {
        SignupRequestDto request = new SignupRequestDto(
                3,
                1,
                1,
                "홍",
                "길동",
                "남",
                "male1.png");
        AtomicReference<User> savedUser = new AtomicReference<>();

        when(userRepository.existsByUsername("311홍길동")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            ReflectionTestUtils.setField(user, "id", 1L);
            savedUser.set(user);
            return user;
        });

        AuthResponseDto response = authService.signup(request);
        User user = savedUser.get();

        assertEquals("311홍길동", user.getUsername());
        assertFalse("311".equals(user.getPassword()));
        assertTrue(passwordEncoder.matches("311", user.getPassword()));
        assertEquals("311홍길동", response.getUsername());
        assertTrue(jwtUtil.validateToken(response.getToken()));
        assertEquals("311홍길동", jwtUtil.getUsernameFromToken(response.getToken()));
    }

    @Test
    void loginAcceptsGeneratedUsernameAndPassword() {
        User user = new User(
                "311홍길동",
                passwordEncoder.encode("311"),
                "홍길동",
                3,
                1,
                1,
                "남",
                "male1.png");
        ReflectionTestUtils.setField(user, "id", 1L);

        when(userRepository.findByUsername("311홍길동")).thenReturn(Optional.of(user));

        AuthResponseDto response = authService.login(new LoginRequestDto("311홍길동", "311"));

        assertEquals("311홍길동", response.getUsername());
        assertTrue(jwtUtil.validateToken(response.getToken()));
        assertEquals(1L, jwtUtil.getUserIdFromToken(response.getToken()));
    }
}
