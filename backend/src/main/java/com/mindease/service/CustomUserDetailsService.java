// backend/src/main/java/com/mindease/service/CustomUserDetailsService.java
package com.mindease.service;

import com.mindease.model.User;
import com.mindease.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

  @Autowired
  private UserRepository userRepository;

  @Override
  public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
    User user = userRepository.findByEmail(email)
      .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

    return new org.springframework.security.core.userdetails.User(
      user.getEmail(),
      user.getPasswordHash() != null ? user.getPasswordHash() : "",
      getAuthorities(user)
    );
  }

  private Collection<? extends GrantedAuthority> getAuthorities(User user) {
    return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
  }
}
