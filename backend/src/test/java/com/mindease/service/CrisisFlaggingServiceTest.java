package com.mindease.service;

import com.mindease.crisis.model.CrisisFlag;
import com.mindease.crisis.service.CrisisFlaggingService;
import com.mindease.crisis.service.CrisisKeywordDetector;
import com.mindease.crisis.service.RiskScorer;
import com.mindease.admin.model.AdminSettings;
import com.mindease.admin.repository.AdminSettingsRepository;
import com.mindease.crisis.repository.CrisisFlagRepository;
import com.mindease.notification.service.NotificationService;
import com.mindease.notification.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class CrisisFlaggingServiceTest {

    private CrisisFlagRepository flagRepo;
    private AdminSettingsRepository settingsRepo;
    private NotificationService notificationService;
    private EmailService emailService;
    private CrisisFlaggingService service;

    @BeforeEach
    void setUp() {
        flagRepo = mock(CrisisFlagRepository.class);
        settingsRepo = mock(AdminSettingsRepository.class);
        notificationService = mock(NotificationService.class);
        emailService = mock(EmailService.class);

        CrisisKeywordDetector detector = new CrisisKeywordDetector();
        RiskScorer scorer = text -> Optional.of(0.92);
        ApplicationEventPublisher publisher = mock(ApplicationEventPublisher.class);
        when(settingsRepo.findByFeatureName("CRISIS_ALERTS_ENABLED"))
                .thenReturn(Optional.of(new AdminSettings() {
                    {
                        setFeatureName("CRISIS_ALERTS_ENABLED");
                        setEnabled(true);
                    }
                }));
        when(flagRepo.existsByChatIdAndKeywordDetectedIgnoreCase(any(), any())).thenReturn(false);

        service = new CrisisFlaggingService(detector, scorer, flagRepo, settingsRepo, notificationService, emailService,
                publisher);
    }

    @Test
    void flagsAndNotifiesOnCrisis() throws Exception {
        UUID chatId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        service.evaluateAndFlag(chatId, userId, "i feel suicidal and want to die");

        ArgumentCaptor<CrisisFlag> cap = ArgumentCaptor.forClass(CrisisFlag.class);
        verify(flagRepo, atLeastOnce()).save(cap.capture());
        assertThat(cap.getValue().getKeywordDetected()).isIn("suicide", "want-to-die");
        assertThat(cap.getValue().getRiskScore()).isEqualTo(0.92);

        verify(notificationService, atLeastOnce()).notifyAdmins(anyString(), contains("risk"));
        verify(notificationService, atLeastOnce()).emailAdmins(anyString(), contains(userId.toString()));
    }

    @Test
    void ignoresWhenNoKeyword() {
        service.evaluateAndFlag(UUID.randomUUID(), UUID.randomUUID(), "nice weather today");
        verify(flagRepo, never()).save(any());
        verify(notificationService, never()).notifyAdmins(any(), any());
    }

    @Test
    void duplicateFlagIsIgnored() {
        UUID chatId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        // First save ok, second throws unique violation
        when(flagRepo.save(any(CrisisFlag.class)))
                .thenReturn(new CrisisFlag())
                .thenThrow(new DataIntegrityViolationException("dup"));

        service.evaluateAndFlag(chatId, userId, "self-harm");
        service.evaluateAndFlag(chatId, userId, "self harm");

        verify(flagRepo, times(2)).save(any(CrisisFlag.class));
        verify(notificationService, atLeastOnce()).notifyAdmins(anyString(), anyString());
    }
}
