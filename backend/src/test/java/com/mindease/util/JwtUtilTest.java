package com.mindease.util;

import com.mindease.model.Role;
import com.mindease.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for JwtUtil.
 * Tests JWT token generation, validation, and claim extraction.
 */
class JwtUtilTest {

    private JwtUtil jwtUtil;
    private User testUser;
    private static final String TEST_SECRET = "test-secret-key-for-jwt-testing-minimum-32-characters-long";
    private static final Long TEST_EXPIRATION = 3600000L; // 1 hour

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expiration", TEST_EXPIRATION);

        // Create test user
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setRole(Role.USER);
        testUser.setAnonymousMode(false);
    }

    @Test
    void testGenerateToken_Success() {
        String token = jwtUtil.generateToken(testUser);

        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(token.split("\\.").length == 3); // JWT has 3 parts
    }

    @Test
    void testGenerateToken_ContainsCorrectClaims() {
        String token = jwtUtil.generateToken(testUser);

        SecretKey key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes());
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .getBody();

        assertEquals(testUser.getEmail(), claims.getSubject());
        assertEquals(testUser.getRole().name(), claims.get("role"));
        assertEquals(testUser.getId().toString(), claims.get("userId"));
        assertEquals(testUser.getAnonymousMode(), claims.get("anonymousMode"));
    }

    @Test
    void testExtractUsername_Success() {
        String token = jwtUtil.generateToken(testUser);
        String extractedEmail = jwtUtil.extractUsername(token);

        assertEquals(testUser.getEmail(), extractedEmail);
    }

    @Test
    void testExtractExpiration_Success() {
        String token = jwtUtil.generateToken(testUser);
        Date expiration = jwtUtil.extractExpiration(token);

        assertNotNull(expiration);
        assertTrue(expiration.after(new Date()));
    }

    @Test
    void testValidateToken_ValidToken_ReturnsTrue() {
        String token = jwtUtil.generateToken(testUser);

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(testUser.getEmail());

        assertTrue(jwtUtil.validateToken(token, userDetails));
    }

    @Test
    void testValidateToken_WrongUsername_ReturnsFalse() {
        String token = jwtUtil.generateToken(testUser);

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("different@example.com");

        assertFalse(jwtUtil.validateToken(token, userDetails));
    }

    @Test
    void testValidateToken_ExpiredToken_ReturnsFalse() throws InterruptedException {
        // Create JWT util with very short expiration
        JwtUtil shortExpirationJwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(shortExpirationJwtUtil, "secret", TEST_SECRET);
        ReflectionTestUtils.setField(shortExpirationJwtUtil, "expiration", 1L); // 1ms

        String token = shortExpirationJwtUtil.generateToken(testUser);

        // Wait for token to expire
        Thread.sleep(10);

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(testUser.getEmail());

        assertFalse(shortExpirationJwtUtil.validateToken(token, userDetails));
    }

    @Test
    void testValidateToken_WithoutUserDetails_ValidToken_ReturnsTrue() {
        String token = jwtUtil.generateToken(testUser);
        assertTrue(jwtUtil.validateToken(token));
    }

    @Test
    void testValidateToken_WithoutUserDetails_InvalidToken_ReturnsFalse() {
        assertFalse(jwtUtil.validateToken("invalid.token.here"));
    }

    @Test
    void testGenerateToken_ForAdminUser() {
        User adminUser = new User();
        adminUser.setId(UUID.randomUUID());
        adminUser.setEmail("admin@example.com");
        adminUser.setRole(Role.ADMIN);
        adminUser.setAnonymousMode(false);

        String token = jwtUtil.generateToken(adminUser);

        SecretKey key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes());
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .getBody();

        assertEquals("ADMIN", claims.get("role"));
    }

    @Test
    void testGenerateToken_ForAnonymousUser() {
        User anonymousUser = new User();
        anonymousUser.setId(UUID.randomUUID());
        anonymousUser.setEmail("anonymous_123@mindease.com");
        anonymousUser.setRole(Role.USER);
        anonymousUser.setAnonymousMode(true);

        String token = jwtUtil.generateToken(anonymousUser);

        SecretKey key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes());
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .getBody();

        assertEquals(true, claims.get("anonymousMode"));
    }
}
