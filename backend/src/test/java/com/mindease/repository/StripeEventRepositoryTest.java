package com.mindease.repository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assumptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class StripeEventRepositoryTest {

  @Autowired
  StripeEventRepository repo;

  @Autowired
  DataSource dataSource;

  @Test
  void insertIfNotExists_insertsOnceAndReturnsZeroOnDuplicate() throws Exception {
    try (var conn = dataSource.getConnection()) {
      String product = conn.getMetaData().getDatabaseProductName();
      Assumptions.assumeFalse("H2".equalsIgnoreCase(product), "H2 lacks PostgreSQL ON CONFLICT; skipping test.");
    }

    int first = repo.insertIfNotExists("evt_123", "PROCESSING");
    int dup = repo.insertIfNotExists("evt_123", "PROCESSING");
    assertThat(first).isEqualTo(1);
    assertThat(dup).isEqualTo(0);

    String status = repo.getStatus("evt_123");
    assertThat(status).isEqualTo("PROCESSING");
  }
}
