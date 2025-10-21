package com.mindease.security;

import com.mindease.aop.PremiumGuardAspect;
import com.mindease.exception.PremiumRequiredException;
import com.mindease.model.Role;
import com.mindease.model.User;
import com.mindease.service.CustomUserDetails;
import com.mindease.service.PremiumAccessService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class PremiumGatingTest {

  @AfterEach
  void clearContext() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void requiresPremium_blocksWhenNotPremium() throws Throwable {
    PremiumAccessService premium = mock(PremiumAccessService.class);
    PremiumGuardAspect aspect = new PremiumGuardAspect(premium);

    // Simulate authenticated user in SecurityContext
    UUID uid = UUID.randomUUID();
    User u = new User();
    u.setId(uid);
    u.setEmail("test@example.com");
    u.setRole(Role.USER);
    CustomUserDetails cud = new CustomUserDetails(u);
    var auth = new UsernamePasswordAuthenticationToken(
        cud,
        null,
        List.of(new SimpleGrantedAuthority("ROLE_USER"))
    );
    SecurityContextHolder.getContext().setAuthentication(auth);

    when(premium.isPremium(uid)).thenReturn(false);

    ProceedingJoinPoint pjp = Mockito.mock(ProceedingJoinPoint.class);

    assertThatThrownBy(() -> aspect.requirePremium(pjp))
      .isInstanceOf(PremiumRequiredException.class);
  }
}

