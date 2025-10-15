package com.mindease;

import com.mindease.model.FeatureFlag;
import com.mindease.model.Subscription;
import com.mindease.model.Role;
import com.mindease.model.User;
import com.mindease.model.PlanType;
import com.mindease.model.SubscriptionStatus;
import com.mindease.repository.FeatureFlagRepository;
import com.mindease.repository.SubscriptionRepository;
import com.mindease.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class MonetizationRepositoryTests {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private SubscriptionRepository subscriptionRepository;

  @Autowired
  private FeatureFlagRepository featureFlagRepository;

  @Test
  void subscription_and_feature_flag_crud_sanity() {
    // Create a user
    User user = new User();
    user.setEmail("test-user@example.com");
    user.setPasswordHash("noop");
    user.setRole(Role.USER);
    user = userRepository.save(user);

    // Create a feature flag
    FeatureFlag flag = new FeatureFlag("beta-chat", true);
    flag = featureFlagRepository.save(flag);

    Optional<FeatureFlag> fetchedFlag = featureFlagRepository.findByFeatureName("beta-chat");
    assertThat(fetchedFlag).isPresent();
    assertThat(fetchedFlag.get().getEnabledForPremium()).isTrue();

    // Create a subscription
    Subscription sub = new Subscription(user, "sub_123", PlanType.PREMIUM, SubscriptionStatus.ACTIVE);
    sub = subscriptionRepository.save(sub);

    List<Subscription> byUser = subscriptionRepository.findByUser(user);
    assertThat(byUser).isNotEmpty();
    assertThat(byUser.get(0).getStripeSubscriptionId()).isEqualTo("sub_123");
  }
}
