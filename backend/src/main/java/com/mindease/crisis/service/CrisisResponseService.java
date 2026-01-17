package com.mindease.crisis.service;

import com.mindease.chat.service.SafetyClassificationService;
import com.mindease.crisis.model.CrisisResource;
import com.mindease.crisis.model.RiskLevel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service for generating localized and contextual crisis response messages.
 */
@Service
public class CrisisResponseService {

    @Autowired
    private SafetyClassificationService safetyClassificationService;

    /**
     * Get a localized crisis response message based on user's language.
     *
     * @param language User's preferred language (e.g., "en", "ne")
     * @return Localized crisis response message
     */
    public String getCrisisResponseMessage(String language) {
        String effectiveLanguage = (language != null && !language.isEmpty()) ? language : "en";

        return switch (effectiveLanguage.toLowerCase()) {
            case "ne", "nep" -> getNepaliCrisisMessage();
            default -> getEnglishCrisisMessage();
        };
    }

    /**
     * Get crisis resources for the user based on their language and region.
     *
     * @param language User's preferred language
     * @param region   User's region
     * @return List of crisis resources
     */
    public List<CrisisResource> getCrisisResources(String language, String region) {
        // Use HIGH risk level to get crisis resources (CRITICAL would also work)
        return safetyClassificationService.getCrisisResources(
                RiskLevel.HIGH,
                language != null ? language : "en",
                region != null ? region : "global");
    }

    /**
     * Enhanced English crisis message with improved tone and actionable guidance.
     */
    private String getEnglishCrisisMessage() {
        return "I'm deeply concerned about what you're sharing. Your wellbeing matters, and there are people who want to help you right now.\n\n"
                +
                "Please know that you don't have to face this alone. Help is available immediately through crisis support services. "
                +
                "I've included some resources below that you can reach out to right now.\n\n" +
                "If you're in immediate danger, please call your local emergency services. " +
                "You deserve support, and there are trained professionals ready to listen and help you through this.";
    }

    /**
     * Nepali crisis message with culturally appropriate tone.
     */
    private String getNepaliCrisisMessage() {
        return "म तपाईंले साझेदारी गरेको कुराहरूबाट धेरै चिन्तित छु। तपाईंको भलाइ महत्वपूर्ण छ, र अहिले तपाईंलाई मद्दत गर्न चाहने मानिसहरू छन्।\n\n"
                +
                "कृपया जान्नुहोस् कि तपाईंले यो अकेले सामना गर्नुपर्दैन। संकट सहयोग सेवाहरू मार्फत तुरुन्तै मद्दत उपलब्ध छ। "
                +
                "मैले तल केही स्रोतहरू समावेश गरेको छु जसलाई तपाईंले अहिले सम्पर्क गर्न सक्नुहुन्छ।\n\n" +
                "यदि तपाईं तत्काल खतरामा हुनुहुन्छ भने, कृपया आफ्नो स्थानीय आपतकालीन सेवाहरूलाई कल गर्नुहोस्। " +
                "तपाईंले सहयोगको हकदार हुनुहुन्छ, र तपाईंलाई यस मार्फत सुन्न र मद्दत गर्न तयार प्रशिक्षित व्यावसायिकहरू छन्।";
    }
}
