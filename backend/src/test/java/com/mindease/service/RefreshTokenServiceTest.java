package com.mindease.service;

import com.mindease.auth.model.RefreshToken;
import com.mindease.auth.model.Role;
import com.mindease.auth.model.User;
import com.mindease.auth.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for RefreshTokenService.
 * Tests refresh token creation, validation, and revocation.
 */
@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    private User testUser;

    @BeforeEach
    void setUp() {
        // Set refresh token duration (7 days in milliseconds)
        ReflectionTestUtils.setField(refreshTokenService, "refreshTokenDuration", 604800000L);

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setRole(Role.USER);
    }

    @Test
    void testCreateRefreshToken_Success() {
        RefreshToken savedToken = new RefreshToken();
        savedToken.setId(UUID.randomUUID());
        savedToken.setToken(UUID.randomUUID().toString());
        savedToken.setUser(testUser);
        savedToken.setExpiresAt(LocalDateTime.now().plusDays(7));

        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(savedToken);

        RefreshToken result = refreshTokenService.createRefreshToken(testUser);

        assertNotNull(result);
        assertNotNull(result.getToken());
        assertEquals(testUser, result.getUser());
        assertTrue(result.getExpiresAt().isAfter(LocalDateTime.now()));
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    void testFindByToken_Success() {
        String tokenString = UUID.randomUUID().toString();
        RefreshToken token = new RefreshToken();
        token.setToken(tokenString);
        token.setUser(testUser);
        token.setExpiresAt(LocalDateTime.now().plusDays(7));

        when(refreshTokenRepository.findByToken(tokenString)).thenReturn(Optional.of(token));

        Optional<RefreshToken> result = refreshTokenService.findByToken(tokenString);

        assertTrue(result.isPresent());
        assertEquals(tokenString, result.get().getToken());
        verify(refreshTokenRepository, times(1)).findByToken(tokenString);
    }

    @Test
    void testVerifyRefreshToken_ValidToken_Success() {
        String tokenString = UUID.randomUUID().toString();
        RefreshToken token = new RefreshToken();
        token.setToken(tokenString);
        token.setUser(testUser);
        token.setExpiresAt(LocalDateTime.now().plusDays(7));
        token.setRevoked(false);

        when(refreshTokenRepository.findByToken(tokenString)).thenReturn(Optional.of(token));

        RefreshToken result = refreshTokenService.verifyRefreshToken(tokenString);

        assertNotNull(result);
        assertEquals(tokenString, result.getToken());
        assertFalse(result.isRevoked());
    }

    @Test
    void testVerifyRefreshToken_TokenNotFound_ThrowsException() {
        String tokenString = "non-existent-token";

        when(refreshTokenRepository.findByToken(tokenString)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            refreshTokenService.verifyRefreshToken(tokenString);
        });

        assertTrue(exception.getMessage().contains("not found"));
    }

    @Test
    void testVerifyRefreshToken_RevokedToken_ThrowsException() {
        String tokenString = UUID.randomUUID().toString();
        RefreshToken token = new RefreshToken();
        token.setToken(tokenString);
        token.setUser(testUser);
        token.setExpiresAt(LocalDateTime.now().plusDays(7));
        token.setRevoked(true);

        when(refreshTokenRepository.findByToken(tokenString)).thenReturn(Optional.of(token));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            refreshTokenService.verifyRefreshToken(tokenString);
        });

        assertTrue(exception.getMessage().contains("revoked"));
    }

    @Test
    void testVerifyRefreshToken_ExpiredToken_ThrowsException() {
        String tokenString = UUID.randomUUID().toString();
        RefreshToken token = new RefreshToken();
        token.setToken(tokenString);
        token.setUser(testUser);
        token.setExpiresAt(LocalDateTime.now().minusDays(1)); // Expired
        token.setRevoked(false);

        when(refreshTokenRepository.findByToken(tokenString)).thenReturn(Optional.of(token));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            refreshTokenService.verifyRefreshToken(tokenString);
        });

        assertTrue(exception.getMessage().contains("expired"));
        verify(refreshTokenRepository, times(1)).delete(token);
    }

    @Test
    void testRevokeToken_Success() {
        RefreshToken token = new RefreshToken();
        token.setToken(UUID.randomUUID().toString());
        token.setUser(testUser);
        token.setRevoked(false);

        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(token);

        refreshTokenService.revokeToken(token);

        assertTrue(token.isRevoked());
        verify(refreshTokenRepository, times(1)).save(token);
    }

    @Test
    void testRevokeAllUserTokens_Success() {
        when(refreshTokenRepository.revokeAllTokensForUser(eq(testUser), any(LocalDateTime.class)))
            .thenReturn(3);

        int count = refreshTokenService.revokeAllUserTokens(testUser);

        assertEquals(3, count);
        verify(refreshTokenRepository, times(1)).revokeAllTokensForUser(eq(testUser), any(LocalDateTime.class));
    }

    @Test
    void testDeleteAllUserTokens_Success() {
        doNothing().when(refreshTokenRepository).deleteByUser(testUser);

        refreshTokenService.deleteAllUserTokens(testUser);

        verify(refreshTokenRepository, times(1)).deleteByUser(testUser);
    }
}
