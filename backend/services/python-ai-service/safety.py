# backend/services/python-ai-service/safety.py
from fastapi import APIRouter, HTTPException
from typing import List
import re
import logging

from models import (
    SafetyClassificationRequest,
    SafetyClassificationResponse,
    RiskLevel,
    Message
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Risk classification keywords by level (matching Java SafetyClassificationService)
RISK_KEYWORDS = {
    RiskLevel.CRITICAL: [
        "kill myself", "suicide plan", "end my life", "going to die",
        "goodbye forever", "final message", "overdose", "jump off",
        "hanging myself", "cutting deep", "want to die today"
    ],
    RiskLevel.HIGH: [
        "suicid", "kill me", "end it all", "better off dead",
        "no reason to live", "wish i was dead", "want to die",
        "self harm", "cut myself", "hurt myself badly"
    ],
    RiskLevel.MEDIUM: [
        "harm myself", "hurt myself", "cutting", "self injur",
        "thoughts of dying", "life isn't worth", "feel worthless",
        "everyone would be better", "nothing matters", "no point"
    ],
    RiskLevel.LOW: [
        "hopeless", "helpless", "empty inside", "numb",
        "can't cope", "breaking down", "falling apart",
        "exhausted", "burned out", "can't take it"
    ]
}


def contains_keywords(text: str, keywords: List[str]) -> bool:
    """
    Check if text contains any keywords from list, with negation handling.
    Matches Java SafetyClassificationService.containsKeywords() logic.
    """
    if not keywords:
        return False

    # Common negation patterns
    negation_pattern = r"\b(don't|dont|do not|never|not|no|wont|won't|will not)\s+\w*\s*"

    for keyword in keywords:
        # Use word boundaries for precise matching
        pattern = re.compile(r"\b" + re.escape(keyword) + r"\b", re.IGNORECASE)
        matches = pattern.finditer(text)

        for match in matches:
            # Check if match is preceded by negation (within ~20 chars)
            start = max(0, match.start() - 20)
            context = text[start:match.start()]

            if not re.search(negation_pattern + "$", context):
                return True

    return False


def analyze_historical_pattern(history: List[Message]) -> RiskLevel:
    """
    Analyze recent message history for escalating distress patterns.
    Matches Java SafetyClassificationService.analyzeHistoricalPattern() logic.
    """
    if len(history) < 3:
        return RiskLevel.NONE

    # Get last 5 user messages
    user_messages = [
        msg for msg in history
        if msg.is_user_message
    ][-5:]

    low_risk_count = 0
    medium_plus_risk_count = 0

    for msg in user_messages:
        # Note: In real implementation, we'd need risk_level from Message
        # For now, we'll classify each message
        risk = classify_message_content(msg.content, [])

        if risk in [RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]:
            medium_plus_risk_count += 1
        elif risk == RiskLevel.LOW:
            low_risk_count += 1

    # Escalate if seeing pattern of distress
    if medium_plus_risk_count >= 2:
        return RiskLevel.HIGH
    elif medium_plus_risk_count >= 1 and low_risk_count >= 2:
        return RiskLevel.MEDIUM
    elif low_risk_count >= 3:
        return RiskLevel.LOW

    return RiskLevel.NONE


def classify_message_content(content: str, recent_history: List[Message]) -> RiskLevel:
    """
    Classify a message's risk level based on content and context.
    Matches Java SafetyClassificationService.classifyMessage() logic.
    """
    if not content or not content.strip():
        return RiskLevel.NONE

    normalized = content.lower()

    # Check from highest risk to lowest
    if contains_keywords(normalized, RISK_KEYWORDS[RiskLevel.CRITICAL]):
        logger.warn("CRITICAL risk detected in message")
        return RiskLevel.CRITICAL

    if contains_keywords(normalized, RISK_KEYWORDS[RiskLevel.HIGH]):
        logger.warn("HIGH risk detected in message")
        return RiskLevel.HIGH

    if contains_keywords(normalized, RISK_KEYWORDS[RiskLevel.MEDIUM]):
        logger.info("MEDIUM risk detected in message")
        return RiskLevel.MEDIUM

    if contains_keywords(normalized, RISK_KEYWORDS[RiskLevel.LOW]):
        logger.debug("LOW risk detected in message")
        return RiskLevel.LOW

    # Check history for escalating distress patterns
    if recent_history:
        historical_risk = analyze_historical_pattern(recent_history)
        if historical_risk != RiskLevel.NONE:
            return historical_risk

    return RiskLevel.NONE


@router.post("/safety/classify", response_model=SafetyClassificationResponse)
async def classify_safety(request: SafetyClassificationRequest):
    """
    Classify message safety and risk level.
    Replaces SafetyClassificationService.classifyMessage()
    """
    try:
        risk_level = classify_message_content(request.content, request.recent_history)

        # Extract detected keywords for response
        detected_keywords = []
        normalized = request.content.lower()
        for level, keywords in RISK_KEYWORDS.items():
            if level == risk_level:
                for keyword in keywords:
                    if keyword.lower() in normalized:
                        detected_keywords.append(keyword)
                break

        return SafetyClassificationResponse(
            risk_level=risk_level,
            confidence=0.85,  # Could be enhanced with ML model
            detected_keywords=detected_keywords[:5]  # Limit to 5 keywords
        )
    except Exception as e:
        logger.error(f"Error classifying safety: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Safety classification failed: {str(e)}")


def get_safety_prompt(risk_level: RiskLevel) -> str:
    """
    Generate a safety prompt adjustment based on risk level.
    Matches Java SafetyClassificationService.getSafetyPrompt() logic.
    """
    prompts = {
        RiskLevel.CRITICAL: (
            "CRISIS MODE: The user is in immediate danger. Acknowledge their pain with deep empathy. "
            "Strongly encourage them to reach out to emergency services or a crisis helpline immediately. "
            "Be calm, direct, and supportive. Do not try to solve complex issues—focus on immediate safety."
        ),
        RiskLevel.HIGH: (
            "HIGH RISK: The user is expressing serious distress and may be considering self-harm. "
            "Respond with compassion and validation. Gently suggest professional help and crisis resources. "
            "Avoid judgmental language. Focus on hope and connection."
        ),
        RiskLevel.MEDIUM: (
            "MODERATE CONCERN: The user is experiencing significant distress. "
            "Be extra supportive and validate their feelings. Explore coping strategies and suggest "
            "professional support if appropriate. Monitor for escalation."
        ),
        RiskLevel.LOW: (
            "MILD CONCERN: The user is experiencing some distress. "
            "Provide empathetic support and gentle encouragement. Ask clarifying questions."
        )
    }

    return prompts.get(risk_level, "")
