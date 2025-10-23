package com.mindease.service;

import com.mindease.model.AdminSettings;
import com.mindease.model.CrisisFlag;
import com.mindease.repository.AdminSettingsRepository;
import com.mindease.repository.CrisisFlagRepository;
import com.mindease.safety.CrisisKeywordDetector;
import com.mindease.safety.RiskScorer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class CrisisFlaggingService {
    private static final Logger log = LoggerFactory.getLogger(CrisisFlaggingService.class);
    public static final String SETTINGS_KEY = "CRISIS_ALERTS_ENABLED";

    private final CrisisKeywordDetector detector;
    private final RiskScorer riskScorer;
    private final CrisisFlagRepository flagRepo;
    private final AdminSettingsRepository settingsRepo;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public CrisisFlaggingService(CrisisKeywordDetector detector,
                                 RiskScorer riskScorer,
                                 CrisisFlagRepository flagRepo,
                                 AdminSettingsRepository settingsRepo,
                                 NotificationService notificationService,
                                 EmailService emailService) {
        this.detector = detector;
        this.riskScorer = riskScorer;
        this.flagRepo = flagRepo;
        this.settingsRepo = settingsRepo;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    private boolean alertsEnabled() {
        Optional<AdminSettings> s = settingsRepo.findByFeatureName(SETTINGS_KEY);
        return s.map(AdminSettings::isEnabled).orElse(true); // default ON if missing
    }

    /**
     * Asynchronous, idempotent crisis check. Safe to call in the chat save path.
     */
    @Async
    @Transactional
    public void evaluateAndFlag(UUID chatId, UUID userId, String messageText) {
        // Basic parameter validation to avoid NPE chains
        if (chatId == null || userId == null || messageText == null) {
            log.warn("Crisis evaluation skipped due to null parameter(s): chatId={}, userId={}, textNull={}",
                    chatId, userId, messageText == null);
            return;
        }
        if (!alertsEnabled()) return;

        try {
            String keyword = detector.detectKeyword(messageText);
            if (keyword == null) return;

            // Optional ML scorer
            Optional<Double> risk = riskScorer.score(messageText);

            // Idempotency via DB unique constraint, handle race safely
            try {
                CrisisFlag flag = new CrisisFlag();
                flag.setChatId(chatId);
                flag.setUserId(userId);
                flag.setKeywordDetected(keyword);
                risk.ifPresent(flag::setRiskScore);
                flagRepo.save(flag);
            } catch (DataIntegrityViolationException e) {
                // Already flagged by a concurrent request; preserve idempotency
                log.debug("Duplicate crisis flag ignored for chatId={}, keyword={}", chatId, keyword);
                return;
            }

            // Notify ADMIN users in-app
            String title = "Crisis alert";
            String body = risk.map(r -> "A potential crisis was detected (risk=" + String.format("%.2f", r) + ").")
                              .orElse("A potential crisis was detected.");
            notificationService.notifyAdmins(title, body);

            // Optional email (best-effort)
            try {
                notificationService.emailAdmins(title, "User " + userId + " flagged: " + keyword);
            } catch (Exception mailEx) {
                log.warn("Failed sending crisis alert email for userId={}, chatId={}", userId, chatId, mailEx);
            }
        } catch (Exception e) {
            log.error("Crisis evaluation failed for chatId={}, userId={}", chatId, userId, e);
        }
    }
}
