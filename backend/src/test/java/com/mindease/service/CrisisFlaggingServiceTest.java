package com.mindease.service;

import com.mindease.model.AdminSettings;
import com.mindease.model.CrisisFlag;
import com.mindease.repository.AdminSettingsRepository;
import com.mindease.repository.CrisisFlagRepository;
import com.mindease.safety.CrisisKeywordDetector;
import com.mindease.safety.RiskScorer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

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
        when(settingsRepo.findByFeatureName("CRISIS_ALERTS_ENABLED"))
                .thenReturn(Optional.of(new AdminSettings(){
                    { setFeatureName("CRISIS_ALERTS_ENABLED"); setEnabled(true); }
                }));
        when(flagRepo.existsByChatIdAndKeywordDetectedIgnoreCase(any(), any())).thenReturn(false);

        service = new CrisisFlaggingService(detector, scorer, flagRepo, settingsRepo, notificationService, emailService);
    }

    @Test
    void flagsAndNotifiesOnCrisis() throws Exception {
        UUID chatId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        service.evaluateAndFlag(chatId, userId, "i feel suicidal and want to die");

        ArgumentCaptor<CrisisFlag> cap = ArgumentCaptor.forClass(CrisisFlag.class);
        verify(flagRepo, atLeastOnce()).save(cap.capture());
        assertThat(cap.getValue().getKeywordDetected()).isIn("suicide", "want-to-die");

        verify(notificationService, atLeastOnce()).notifyAdmins(anyString(), contains("risk"));
        verify(notificationService, atLeastOnce()).emailAdmins(anyString(), contains(userId.toString()), any());
    }

    @Test
    void ignoresWhenNoKeyword() {
        service.evaluateAndFlag(UUID.randomUUID(), UUID.randomUUID(), "nice weather today");
        verify(flagRepo, never()).save(any());
        verify(notificationService, never()).notifyAdmins(any(), any());
    }
}

