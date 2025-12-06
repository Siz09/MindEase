package com.mindease.crisis.service;

import com.mindease.crisis.model.CrisisFlag;
import com.mindease.admin.model.AdminSettings;
import com.mindease.notification.service.NotificationService;
import com.mindease.admin.repository.AdminSettingsRepository;
import com.mindease.crisis.repository.CrisisFlagRepository;
import com.mindease.notification.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
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
    private final ApplicationEventPublisher events;

    public CrisisFlaggingService(CrisisKeywordDetector detector,
            RiskScorer riskScorer,
            CrisisFlagRepository flagRepo,
            AdminSettingsRepository settingsRepo,
            NotificationService notificationService,
            EmailService emailService,
            ApplicationEventPublisher events) {
        this.detector = detector;
        this.riskScorer = riskScorer;
        this.flagRepo = flagRepo;
        this.settingsRepo = settingsRepo;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.events = events;
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
        if (chatId == null || userId == null || messageText == null) {
            log.warn("Crisis evaluation skipped due to null parameter(s): chatId={}, userId={}, textNull={}",
                    chatId, userId, messageText == null);
            return;
        }
        if (!alertsEnabled())
            return;

        try {
            String keyword = detector.detectKeyword(messageText);
            if (keyword == null)
                return;

            Optional<Double> risk = riskScorer.score(messageText);

            if (flagRepo.existsByChatIdAndKeywordDetectedIgnoreCase(chatId, keyword)) {
                log.debug("Crisis flag already exists for chatId={}, keyword={}", chatId, keyword);
                return;
            }

            try {
                CrisisFlag flag = new CrisisFlag();
                flag.setChatId(chatId);
                flag.setUserId(userId);
                flag.setKeywordDetected(keyword);
                risk.ifPresent(flag::setRiskScore);

                CrisisFlag saved = flagRepo.save(flag);

                log.info("Crisis flag created: chatId={}, userId={}, keyword={}, riskScore={}",
                        chatId, userId, keyword, risk.orElse(null));

                try {
                    events.publishEvent(new com.mindease.shared.events.CrisisFlagCreatedEvent(saved));
                } catch (Exception pubEx) {
                    log.debug("CrisisFlag event publish failed: {}", pubEx.getMessage());
                }
            } catch (DataIntegrityViolationException e) {
                log.debug("Duplicate crisis flag detected (race condition) for chatId={}, keyword={}", chatId, keyword);
                return;
            }

            String title = "Crisis alert";
            String body = risk.map(r -> "A potential crisis was detected (risk=" + String.format("%.2f", r) + ").")
                    .orElse("A potential crisis was detected.");
            notificationService.notifyAdmins(title, body);

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
