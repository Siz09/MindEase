# backend/services/python-ai-service/crisis_detector.py
import re
from typing import Optional


class CrisisDetector:
    """
    Crisis keyword detector matching Java CrisisKeywordDetector.
    Detects sensitive keywords in user messages.
    """

    SENSITIVE_PATTERN = re.compile(
        r'\b(suicid(e|al)|self[\s-]?harm|kill(ing)?[\s-]?(my[\s-]?)?self|'
        r'end(ing)?[\s-]?(my[\s-]?)?life|want[\s-]?to[\s-]?die)\b',
        re.IGNORECASE
    )

    def detect_keyword(self, text: str) -> Optional[str]:
        """
        Detect crisis keyword in text.
        Returns normalized keyword label or None if no match.

        Args:
            text: Message text to analyze

        Returns:
            Normalized keyword string or None
        """
        if not text:
            return None

        match = self.SENSITIVE_PATTERN.search(text)
        if match:
            return self._normalize(match.group())
        return None

    def _normalize(self, matched: str) -> str:
        """
        Normalize matched keyword to standard label.
        Matches Java CrisisKeywordDetector.normalize() logic.
        """
        s = matched.lower().replace(" ", "").replace("-", "")
        if "suicid" in s:
            return "suicide"
        if "selfharm" in s:
            return "self-harm"
        if "kill" in s and "self" in s:
            return "kill-self"
        if "end" in s and "life" in s:
            return "end-life"
        if "wanttodie" in s:
            return "want-to-die"
        return "crisis"


def detect_crisis_simple(message: str) -> bool:
    """
    Simple crisis detection using keyword matching.
    Matches OpenAIChatBotService.isCrisisMessage() logic.
    """
    if not message:
        return False

    crisis_keywords = [
        "suicide", "kill myself", "want to die", "end it all",
        "harm myself", "self harm", "no reason to live",
        "depressed", "hopeless", "helpless", "can't go on",
        "better off without me"
    ]

    message_lower = message.lower()
    return any(keyword in message_lower for keyword in crisis_keywords)
