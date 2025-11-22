# MindEase Testing & Rollout Strategy

## Overview

This document outlines the comprehensive testing strategy and rollout plan for the newly implemented high-impact features in MindEase.

## Testing Pyramid

```
           /\
          /  \
         / E2E \
        /--------\
       /Integration\
      /--------------\
     /  Unit Tests    \
    /------------------\
```

## 1. Backend Unit Tests

### 1.1 Safety & Crisis Detection Tests

#### SafetyClassificationServiceTest.java

```java
@SpringBootTest
class SafetyClassificationServiceTest {

    @Autowired
    private SafetyClassificationService safetyService;

    @Test
    void testClassifyLowRiskMessage() {
        String message = "I'm feeling a bit stressed today";
        RiskLevel risk = safetyService.classifyMessage(message, "user123", Collections.emptyList());
        assertEquals(RiskLevel.LOW, risk);
    }

    @Test
    void testClassifyHighRiskMessage() {
        String message = "I don't want to live anymore";
        RiskLevel risk = safetyService.classifyMessage(message, "user123", Collections.emptyList());
        assertTrue(risk.ordinal() >= RiskLevel.HIGH.ordinal());
    }

    @Test
    void testClassifyCriticalRiskMessage() {
        String message = "I'm going to hurt myself tonight";
        RiskLevel risk = safetyService.classifyMessage(message, "user123", Collections.emptyList());
        assertEquals(RiskLevel.CRITICAL, risk);
    }

    @Test
    void testHistoricalContextInfluencesClassification() {
        List<Message> history = Arrays.asList(
            createMessage("I've been feeling really down", RiskLevel.MEDIUM),
            createMessage("Nothing seems to matter anymore", RiskLevel.HIGH)
        );

        String message = "I'm tired";
        RiskLevel risk = safetyService.classifyMessage(message, "user123", history);
        assertTrue(risk.ordinal() >= RiskLevel.MEDIUM.ordinal());
    }
}
```

#### GuardrailServiceTest.java

```java
@SpringBootTest
class GuardrailServiceTest {

    @Autowired
    private GuardrailService guardrailService;

    @Test
    void testDetectProhibitedContent() {
        String response = "You should try these medications: [specific drug names]";
        GuardrailService.ModerationResult result = guardrailService.moderateResponse(response);
        assertEquals(ModerationAction.BLOCKED, result.getAction());
    }

    @Test
    void testAllowSafeContent() {
        String response = "I understand you're feeling stressed. Let's explore some coping strategies.";
        GuardrailService.ModerationResult result = guardrailService.moderateResponse(response);
        assertEquals(ModerationAction.NONE, result.getAction());
    }

    @Test
    void testRewriteInappropriateAdvice() {
        String response = "Just ignore your problems and they'll go away";
        GuardrailService.ModerationResult result = guardrailService.moderateResponse(response);
        assertTrue(result.getAction() == ModerationAction.REWRITTEN ||
                   result.getAction() == ModerationAction.FLAGGED);
    }
}
```

### 1.2 Mood Tracking Tests

#### MoodTrackingServiceTest.java

```java
@SpringBootTest
@Transactional
class MoodTrackingServiceTest {

    @Autowired
    private MoodTrackingService moodService;

    @Autowired
    private UserRepository userRepository;

    @Test
    void testCreateMoodCheckIn() {
        User user = createTestUser();
        MoodCheckIn checkIn = moodService.createCheckIn(user, 4, Arrays.asList("happy", "calm"), "Feeling good today");

        assertNotNull(checkIn.getId());
        assertEquals(4, checkIn.getScore());
        assertEquals(user.getId(), checkIn.getUser().getId());
    }

    @Test
    void testGetMoodTrends() {
        User user = createTestUser();

        // Create check-ins over 7 days
        for (int i = 0; i < 7; i++) {
            moodService.createCheckIn(user, 3 + (i % 3), Collections.emptyList(), "Day " + i);
        }

        List<MoodCheckIn> trends = moodService.getMoodTrends(user, 7);
        assertEquals(7, trends.size());
    }

    @Test
    void testCalculateAverageMood() {
        User user = createTestUser();
        moodService.createCheckIn(user, 3, Collections.emptyList(), "");
        moodService.createCheckIn(user, 4, Collections.emptyList(), "");
        moodService.createCheckIn(user, 5, Collections.emptyList(), "");

        double avg = moodService.getAverageMood(user, 30);
        assertEquals(4.0, avg, 0.1);
    }
}
```

### 1.3 Guided Programs Tests

#### GuidedProgramServiceTest.java

```java
@SpringBootTest
@Transactional
class GuidedProgramServiceTest {

    @Autowired
    private GuidedProgramService programService;

    @Test
    void testStartGuildedProgram() {
        User user = createTestUser();
        GuidedProgram program = createTestProgram();

        GuidedSession session = programService.startProgram(user, program.getId());

        assertNotNull(session.getId());
        assertEquals("in_progress", session.getStatus());
        assertNotNull(session.getCurrentStepId());
    }

    @Test
    void testProgressThroughSteps() {
        User user = createTestUser();
        GuildedProgram program = createTestProgram();
        GuildedSession session = programService.startProgram(user, program.getId());

        // Submit response to first step
        GuildedStep nextStep = programService.submitStepResponse(
            session.getId(),
            "My response to step 1"
        );

        assertNotNull(nextStep);
        assertEquals(2, nextStep.getStepOrder());
    }

    @Test
    void testCompleteProgram() {
        User user = createTestUser();
        GuildedProgram program = createTestProgram();
        GuildedSession session = programService.startProgram(user, program.getId());

        // Progress through all steps
        for (GuildedStep step : program.getSteps()) {
            programService.submitStepResponse(session.getId(), "Response");
        }

        GuildedSession completedSession = programService.getSession(session.getId());
        assertEquals("completed", completedSession.getStatus());
        assertNotNull(completedSession.getCompletedAt());
    }
}
```

## 2. Backend Integration Tests

### 2.1 REST API Tests

#### MoodTrackingControllerTest.java

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class MoodTrackingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser
    void testCreateMoodCheckIn() throws Exception {
        MoodCheckInRequest request = new MoodCheckInRequest(4, Arrays.asList("happy"), "Good day");

        mockMvc.perform(post("/api/mood/checkin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(4));
    }

    @Test
    @WithMockUser
    void testGetMoodTrends() throws Exception {
        mockMvc.perform(get("/api/mood/trends")
                .param("days", "30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void testUnauthorizedAccess() throws Exception {
        mockMvc.perform(get("/api/mood/trends"))
                .andExpect(status().isUnauthorized());
    }
}
```

### 2.2 WebSocket Tests

#### ChatWebSocketTest.java

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ChatWebSocketTest {

    @LocalServerPort
    private int port;

    private WebSocketStompClient stompClient;

    @Test
    void testWebSocketConnection() throws Exception {
        String token = getTestUserToken();

        StompSession session = stompClient
            .connect("ws://localhost:" + port + "/ws",
                     new StompHeaders() {{ set("Authorization", "Bearer " + token); }})
            .get(5, TimeUnit.SECONDS);

        assertTrue(session.isConnected());
    }

    @Test
    void testReceiveMessage() throws Exception {
        String token = getTestUserToken();
        CompletableFuture<String> messageReceived = new CompletableFuture<>();

        StompSession session = connectWithToken(token);
        session.subscribe("/topic/user/testuser", new StompFrameHandler() {
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                messageReceived.complete((String) payload);
            }
        });

        // Send message via REST API
        sendChatMessage("Hello");

        String received = messageReceived.get(5, TimeUnit.SECONDS);
        assertNotNull(received);
    }
}
```

## 3. Frontend Unit Tests

### 3.1 Component Tests

#### SafetyBanner.test.jsx

```javascript
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import SafetyBanner from '../components/ui/SafetyBanner';
import i18n from '../i18n';

describe('SafetyBanner', () => {
  test('renders nothing for NONE risk level', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <SafetyBanner riskLevel="NONE" />
      </I18nextProvider>
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders low risk banner with correct styling', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SafetyBanner riskLevel="LOW" />
      </I18nextProvider>
    );
    const banner = screen.getByText(/support you/i).closest('div');
    expect(banner).toHaveClass('safety-banner-low');
  });

  test('renders crisis resources for high risk', () => {
    const resources = [
      { name: 'Crisis Hotline', phoneNumber: '988', website: 'https://example.com' },
    ];

    render(
      <I18nextProvider i18n={i18n}>
        <SafetyBanner riskLevel="HIGH" crisisResources={resources} />
      </I18nextProvider>
    );

    expect(screen.getByText('Crisis Hotline')).toBeInTheDocument();
    expect(screen.getByText('988')).toBeInTheDocument();
  });
});
```

#### MoodPrompt.test.jsx

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import MoodPrompt from '../components/ui/MoodPrompt';
import i18n from '../i18n';

describe('MoodPrompt', () => {
  test('renders all mood options', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MoodPrompt onSubmit={jest.fn()} onDismiss={jest.fn()} />
      </I18nextProvider>
    );

    // Should have 5 mood buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(5);
  });

  test('calls onSubmit with selected mood', () => {
    const onSubmit = jest.fn();

    render(
      <I18nextProvider i18n={i18n}>
        <MoodPrompt onSubmit={onSubmit} onDismiss={jest.fn()} />
      </I18nextProvider>
    );

    // Click mood 4
    const moodButtons = screen.getAllByRole('button');
    fireEvent.click(moodButtons[3]); // 4th mood button

    // Click submit
    const submitButton = screen.getByText(/submit/i);
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith(4);
  });

  test('calls onDismiss when X is clicked', () => {
    const onDismiss = jest.fn();

    render(
      <I18nextProvider i18n={i18n}>
        <MoodPrompt onSubmit={jest.fn()} onDismiss={onDismiss} />
      </I18nextProvider>
    );

    const closeButton = screen.getByLabelText(/cancel/i);
    fireEvent.click(closeButton);

    expect(onDismiss).toHaveBeenCalled();
  });
});
```

### 3.2 Page Tests

#### Chat.test.jsx

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import Chat from '../pages/Chat';
import { AuthContext } from '../contexts/AuthContext';
import i18n from '../i18n';

const mockAuthContext = {
  token: 'test-token',
  currentUser: { id: 'user123', email: 'test@example.com' },
};

describe('Chat Page', () => {
  test('renders chat interface', () => {
    render(
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          <AuthContext.Provider value={mockAuthContext}>
            <Chat />
          </AuthContext.Provider>
        </I18nextProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/AI Chat Support/i)).toBeInTheDocument();
  });

  test('shows empty state when no messages', () => {
    render(
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          <AuthContext.Provider value={mockAuthContext}>
            <Chat />
          </AuthContext.Provider>
        </I18nextProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Start a conversation/i)).toBeInTheDocument();
  });

  test('displays connection status', async () => {
    render(
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          <AuthContext.Provider value={mockAuthContext}>
            <Chat />
          </AuthContext.Provider>
        </I18nextProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/connected|disconnected/i)).toBeInTheDocument();
    });
  });
});
```

## 4. E2E Tests (Playwright/Cypress)

### 4.1 Chat Flow Test

```javascript
// tests/e2e/chat.spec.js
describe('Chat Flow', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password');
    cy.visit('/chat');
  });

  it('should send and receive messages', () => {
    cy.get('input[placeholder*="Type your message"]').type('Hello, I need help{enter}');

    cy.contains('Hello, I need help').should('be.visible');

    // Wait for bot response
    cy.contains(/I'm here to support/i, { timeout: 10000 }).should('be.visible');
  });

  it('should show mood prompt after 3 messages', () => {
    // Send 3 messages
    for (let i = 0; i < 3; i++) {
      cy.get('input').type(`Message ${i + 1}{enter}`);
      cy.wait(2000);
    }

    cy.contains(/How are you feeling/i).should('be.visible');
  });

  it('should display safety banner for high-risk message', () => {
    cy.get('input').type('I want to hurt myself{enter}');

    cy.contains(/concerned about you/i, { timeout: 10000 }).should('be.visible');
    cy.contains(/Crisis Support Resources/i).should('be.visible');
  });
});
```

### 4.2 Mood Tracking Test

```javascript
// tests/e2e/mood-tracking.spec.js
describe('Mood Tracking', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password');
  });

  it('should submit mood check-in from chat', () => {
    cy.visit('/chat');
    cy.contains('How are you feeling').click();

    // Select mood 4
    cy.get('[data-testid="mood-4"]').click();
    cy.contains('Submit').click();

    cy.contains(/saved/i).should('be.visible');
  });

  it('should display mood trends in insights', () => {
    cy.visit('/insights');

    cy.contains('Mood Trend').should('be.visible');
    cy.get('canvas').should('exist'); // Chart canvas
  });
});
```

### 4.3 Guided Programs Test

```javascript
// tests/e2e/guided-programs.spec.js
describe('Guided Programs', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password');
    cy.visit('/chat');
  });

  it('should load guided programs', () => {
    cy.contains('Guided Exercises').click();

    cy.contains('CBT', { timeout: 5000 }).should('be.visible');
    cy.contains('Breathing').should('be.visible');
  });

  it('should start a guided program', () => {
    cy.contains('Guided Exercises').click();
    cy.contains('Start Exercise').first().click();

    cy.contains(/Started:/i).should('be.visible');
  });

  it('should show program history in insights', () => {
    cy.visit('/insights');

    cy.contains('Guided Program History').should('be.visible');
  });
});
```

## 5. Feature Flags Implementation

### 5.1 Backend Feature Flags

```java
// backend/src/main/java/com/mindease/config/FeatureFlags.java
@Configuration
public class FeatureFlags {

    @Value("${features.safety-pipeline.enabled:true}")
    private boolean safetyPipelineEnabled;

    @Value("${features.mood-tracking.enabled:true}")
    private boolean moodTrackingEnabled;

    @Value("${features.guided-programs.enabled:true}")
    private boolean guidedProgramsEnabled;

    @Value("${features.session-summaries.enabled:false}")
    private boolean sessionSummariesEnabled;

    public boolean isSafetyPipelineEnabled() {
        return safetyPipelineEnabled;
    }

    public boolean isMoodTrackingEnabled() {
        return moodTrackingEnabled;
    }

    public boolean isGuildedProgramsEnabled() {
        return guidedProgramsEnabled;
    }

    public boolean isSessionSummariesEnabled() {
        return sessionSummariesEnabled;
    }
}
```

### 5.2 Frontend Feature Flags

```javascript
// apps/webapp/src/config/featureFlags.js
export const featureFlags = {
  safetyBanners: import.meta.env.VITE_FEATURE_SAFETY_BANNERS !== 'false',
  moodPrompts: import.meta.env.VITE_FEATURE_MOOD_PROMPTS !== 'false',
  guidedPrograms: import.meta.env.VITE_FEATURE_GUIDED_PROGRAMS !== 'false',
  sessionSummaries: import.meta.env.VITE_FEATURE_SESSION_SUMMARIES === 'true',
  voiceFeatures: import.meta.env.VITE_FEATURE_VOICE === 'true',
};

export const isFeatureEnabled = (feature) => {
  return featureFlags[feature] === true;
};
```

## 6. Monitoring & Metrics

### 6.1 Backend Metrics (Spring Boot Actuator)

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
  metrics:
    tags:
      application: mindease
    export:
      prometheus:
        enabled: true
```

### 6.2 Custom Metrics

```java
// backend/src/main/java/com/mindease/metrics/SafetyMetrics.java
@Component
public class SafetyMetrics {

    private final Counter highRiskMessagesCounter;
    private final Counter criticalRiskMessagesCounter;
    private final Counter crisisResourcesDisplayedCounter;

    public SafetyMetrics(MeterRegistry registry) {
        this.highRiskMessagesCounter = Counter.builder("mindease.safety.high_risk_messages")
            .description("Number of high-risk messages detected")
            .register(registry);

        this.criticalRiskMessagesCounter = Counter.builder("mindease.safety.critical_risk_messages")
            .description("Number of critical-risk messages detected")
            .register(registry);

        this.crisisResourcesDisplayedCounter = Counter.builder("mindease.safety.crisis_resources_displayed")
            .description("Number of times crisis resources were displayed")
            .register(registry);
    }

    public void recordHighRiskMessage() {
        highRiskMessagesCounter.increment();
    }

    public void recordCriticalRiskMessage() {
        criticalRiskMessagesCounter.increment();
    }

    public void recordCrisisResourcesDisplayed() {
        crisisResourcesDisplayedCounter.increment();
    }
}
```

### 6.3 Frontend Analytics

```javascript
// apps/webapp/src/utils/analytics.js
export const trackEvent = (category, action, label, value) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

export const trackMoodCheckIn = (score) => {
  trackEvent('Mood', 'check_in', `score_${score}`, score);
};

export const trackGuildedProgramStart = (programName) => {
  trackEvent('Guided Programs', 'start', programName);
};

export const trackSafetyBannerDisplay = (riskLevel) => {
  trackEvent('Safety', 'banner_displayed', riskLevel);
};
```

## 7. Deployment Strategy

### 7.1 Phased Rollout

**Phase 1: Internal Testing (Week 1)**

- Deploy to staging environment
- Internal team testing
- Fix critical bugs

**Phase 2: Beta Testing (Week 2-3)**

- Deploy to production with feature flags OFF
- Enable features for 10% of users
- Monitor metrics and feedback
- Gradually increase to 50%

**Phase 3: Full Rollout (Week 4)**

- Enable features for 100% of users
- Continue monitoring
- Collect user feedback

### 7.2 Rollback Plan

```bash
# If issues detected, disable features via environment variables
# Backend
FEATURES_SAFETY_PIPELINE_ENABLED=false
FEATURES_MOOD_TRACKING_ENABLED=false
FEATURES_GUIDED_PROGRAMS_ENABLED=false

# Frontend
VITE_FEATURE_SAFETY_BANNERS=false
VITE_FEATURE_MOOD_PROMPTS=false
VITE_FEATURE_GUIDED_PROGRAMS=false
```

## 8. Success Metrics

### 8.1 Safety Metrics

- ✅ High-risk messages detected: Track count
- ✅ Crisis resources displayed: Track count
- ✅ Response time for safety classification: < 100ms
- ✅ False positive rate: < 5%

### 8.2 Engagement Metrics

- ✅ Mood check-in completion rate: > 60%
- ✅ Guided program start rate: > 30%
- ✅ Guided program completion rate: > 40%
- ✅ Session summary views: Track count

### 8.3 Technical Metrics

- ✅ API response time: < 200ms (p95)
- ✅ WebSocket latency: < 50ms
- ✅ Frontend load time: < 3s
- ✅ Error rate: < 1%

## 9. Testing Checklist

### Backend

- [ ] Unit tests for SafetyClassificationService
- [ ] Unit tests for GuardrailService
- [ ] Unit tests for MoodTrackingService
- [ ] Unit tests for GuildedProgramService
- [ ] Integration tests for REST APIs
- [ ] Integration tests for WebSocket
- [ ] Database migration tests

### Frontend

- [ ] Component tests for SafetyBanner
- [ ] Component tests for MoodPrompt
- [ ] Component tests for GuildedProgramCard
- [ ] Component tests for ChatMessage
- [ ] Page tests for Chat
- [ ] Page tests for Insights
- [ ] i18n tests (EN/NE)

### E2E

- [ ] Complete chat flow
- [ ] Mood tracking flow
- [ ] Guided programs flow
- [ ] Safety banner display
- [ ] Dark mode toggle
- [ ] Language switching
- [ ] Mobile responsiveness

### Performance

- [ ] Load testing (100 concurrent users)
- [ ] Stress testing (500 concurrent users)
- [ ] WebSocket connection stability
- [ ] Database query optimization

## 10. Next Steps

1. **Implement Unit Tests** (Priority: High)
2. **Implement Integration Tests** (Priority: High)
3. **Set Up Feature Flags** (Priority: High)
4. **Configure Monitoring** (Priority: Medium)
5. **Implement E2E Tests** (Priority: Medium)
6. **Deploy to Staging** (Priority: High)
7. **Beta Testing** (Priority: High)
8. **Full Rollout** (Priority: Medium)

---

**Document Version**: 1.0
**Last Updated**: November 21, 2025
**Status**: Ready for Implementation
