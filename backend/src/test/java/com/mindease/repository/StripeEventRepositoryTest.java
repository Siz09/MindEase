package com.mindease.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class StripeEventRepositoryTest {

  @Autowired
  StripeEventRepository repo;

  @Test
  void insertIfNotExists_insertsOnceAndReturnsZeroOnDuplicate() {
    int first = repo.insertIfNotExists("evt_123", "PROCESSING");
    int dup = repo.insertIfNotExists("evt_123", "PROCESSING");
    assertThat(first).isEqualTo(1);
    assertThat(dup).isEqualTo(0);

    String status = repo.getStatus("evt_123");
    assertThat(status).isEqualTo("PROCESSING");
  }
}

