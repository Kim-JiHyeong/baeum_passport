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
import org.mockito.Mockito;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.baeum.dto.AuthResponseDto;
import com.baeum.dto.LoginRequestDto;
import com.baeum.dto.SignupRequestDto;
import com.baeum.entity.User;
import com.baeum.jwt.JwtUtil;
import com.baeum.repository.UserRepository;

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
    void signupCreatesUsernameAndPasswordFromSchoolAndStudentInfo() {
        SignupRequestDto request = new SignupRequestDto(
                "Dongsan",
                6,
                2,
                1,
                "Lim",
                "Ducktae",
                "male",
                "male1.png");
        AtomicReference<User> savedUser = new AtomicReference<>();

        when(userRepository.existsByUsername("Dongsan6201LimDucktae")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            ReflectionTestUtils.setField(user, "id", 1L);
            savedUser.set(user);
            return user;
        });

        AuthResponseDto response = authService.signup(request);
        User user = savedUser.get();

        assertEquals("Dongsan6201LimDucktae", user.getUsername());
        assertEquals("Dongsan", user.getSchoolName());
        assertFalse("6201".equals(user.getPassword()));
        assertTrue(passwordEncoder.matches("6201", user.getPassword()));
        assertEquals("Dongsan6201LimDucktae", response.getUsername());
        assertTrue(jwtUtil.validateToken(response.getToken()));
        assertEquals("Dongsan6201LimDucktae", jwtUtil.getUsernameFromToken(response.getToken()));
    }

    @Test
    void loginAcceptsGeneratedUsernameAndPassword() {
        User user = new User(
                "Dongsan6201LimDucktae",
                passwordEncoder.encode("6201"),
                "LimDucktae",
                "Dongsan",
                6,
                2,
                1,
                "male",
                "male1.png");
        ReflectionTestUtils.setField(user, "id", 1L);

        when(userRepository.findByUsername("Dongsan6201LimDucktae")).thenReturn(Optional.of(user));

        AuthResponseDto response = authService.login(new LoginRequestDto("Dongsan6201LimDucktae", "6201"));

        assertEquals("Dongsan6201LimDucktae", response.getUsername());
        assertTrue(jwtUtil.validateToken(response.getToken()));
        assertEquals(1L, jwtUtil.getUserIdFromToken(response.getToken()));
    }

    @Test
    void loginAcceptsUnpaddedStudentCodeForExistingPaddedAccount() {
        User user = new User(
                "Dongsan6201LimDucktae",
                passwordEncoder.encode("6201"),
                "LimDucktae",
                "Dongsan",
                6,
                2,
                1,
                "male",
                "male1.png");
        ReflectionTestUtils.setField(user, "id", 2L);

        when(userRepository.findByUsername("Dongsan621LimDucktae")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("Dongsan6201LimDucktae")).thenReturn(Optional.of(user));

        AuthResponseDto response = authService.login(new LoginRequestDto("Dongsan621LimDucktae", "621"));

        assertEquals("Dongsan6201LimDucktae", response.getUsername());
        assertTrue(jwtUtil.validateToken(response.getToken()));
        assertEquals(2L, jwtUtil.getUserIdFromToken(response.getToken()));
    }
}
