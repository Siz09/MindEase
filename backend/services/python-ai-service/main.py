# backend/services/python-ai-service/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os
import re
import logging
from typing import Optional, Dict, List
from datetime import datetime

from dotenv import load_dotenv
from models import (
    ChatRequest,
    ChatResponse,
    Message,
    RiskLevel
)
from crisis_detector import detect_crisis_simple
from safety import classify_message_content, get_safety_prompt
from journal import router as journal_router
from safety import router as safety_router

load_dotenv()

app = FastAPI(title="MindEase Python AI Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(journal_router)
app.include_router(safety_router)

# Initialize OpenAI client
openai_client = None
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def sanitize_context_value(value: str) -> str:
    """
    Sanitizes context values to prevent prompt injection attacks.
    Matches Java OpenAIChatBotService.sanitizeContextValue() logic.
    """
    if not value:
        return ""

    # Remove potential injection patterns (case-insensitive)
    sanitized = re.sub(
        r"(?i)(ignore|disregard).*(previous|prior|above).*(instruction|prompt|rule)",
        "[filtered]",
        value
    )
    # Normalize newlines to spaces
    sanitized = re.sub(r"\n+", " ", sanitized)
    # Limit length to prevent excessive token usage
    if len(sanitized) > 200:
        sanitized = sanitized[:200]
    return sanitized


def detect_language_from_text(text: str) -> str:
    """
    Detect language from text content.
    Returns 'ne' if text contains Nepali/Devanagari characters, 'en' otherwise.
    """
    if not text:
        return "en"

    # Check for Nepali/Devanagari script characters (Unicode range: U+0900 to U+097F)
    nepali_char_pattern = re.compile(r'[\u0900-\u097F]')
    if nepali_char_pattern.search(text):
        return "ne"

    return "en"


def build_system_prompt(user_context: Optional[Dict[str, str]] = None, message: Optional[str] = None) -> str:
    """
    Build system prompt with persona and context.
    Matches Java OpenAIChatBotService persona logic.
    """
    persona = (
        "You are Mindease — a compassionate, emotionally intelligent mental health companion.\n"
        "You are not a therapist or medical professional. Do not diagnose or give medical advice.\n"
        "Goals: help users explore emotions, validate feelings, gently guide reflection and resilience, and ensure safety.\n"
        "Tone: Calm • Warm • Empathetic • Respectful • Grounded.\n"
        "Behavioral rules:\n"
        "- Empathy first: respond to the emotion, not just the content.\n"
        "- Ask before going deeper; never pressure.\n"
        "- Short to medium, conversational responses (avoid long monologues).\n"
        "- Use grounding or reflection when overwhelmed; be hope-oriented.\n"
        "- If crisis indicators appear, acknowledge pain and encourage immediate human help.\n"
        "Response format: 1) Acknowledge emotion 2) One reflective/grounding prompt 3) Encouraging close."
    )

    # Determine response language: prefer message language, then user preference, then default to English
    detected_language = None
    if message:
        detected_language = detect_language_from_text(message)

    preferred_language = None
    if user_context and "preferredLanguage" in user_context:
        preferred_language = user_context.get("preferredLanguage", "en")

    # Use detected language from message if available, otherwise use preferred language
    response_language = detected_language or preferred_language or "en"

    if response_language:
        language_map = {
            "ne": "Nepali (नेपाली)",
            "en": "English"
        }
        language_name = language_map.get(response_language.lower(), "English")
        persona += f"\n\nIMPORTANT: You MUST respond in {language_name}. The user is communicating in {language_name}, so you must respond in {language_name} as well. Do not respond in a different language. Always match the language of the user's message."

    if user_context:
        context_str = "\nUser Context:\n"
        # Filter sensitive data (same as Java)
        sensitive_keys = {
            "email", "userid", "user_id", "id", "phone",
            "phonenumber", "ssn", "address", "personalinfo", "pii"
        }

        for key, value in user_context.items():
            if key.lower() not in sensitive_keys and value:
                sanitized = sanitize_context_value(value)
                context_str += f"- {key}: {sanitized}\n"

        persona += context_str

    return persona


def map_behavior_tag(message: str) -> str:
    """
    Map message to behavior tag.
    Matches Java OpenAIChatBotService.mapBehaviorTag() logic.
    """
    m = message.lower() if message else ""

    if any(word in m for word in ["overwhelm", "panic", "anxi", "stres"]):
        return "[grounding][reflective]"
    if any(word in m for word in ["sad", "lonely", "alone", "hopeless", "empty"]):
        return "[empathetic][supportive]"
    if any(word in m for word in ["angry", "mad", "frustrat", "irritat"]):
        return "[reflective][encouraging]"
    if any(word in m for word in ["numb", "pointless", "don't care"]):
        return "[empathetic][encouraging]"
    if any(word in m for word in ["good", "better", "grateful", "happy"]):
        return "[encouraging][reflective]"

    return "[empathetic]"


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "openai_configured": openai_client is not None,
        "service": "python-ai-service"
    }


@app.post("/chat/generate", response_model=ChatResponse)
async def generate_chat_response(request: ChatRequest):
    """
    Generate chat response using OpenAI.
    Replaces OpenAIChatBotService.generateResponse()
    """
    if not openai_client:
        logger.warn("OpenAI API key missing; returning fallback response")
        fallback_content = (
            "I'm here to listen and support you. "
            "Could you tell me more about what you're experiencing?"
        )
        is_crisis = detect_crisis_simple(request.message)
        return ChatResponse(
            content=fallback_content,
            is_crisis=is_crisis,
            provider="fallback:no_api_key",
            timestamp=datetime.now()
        )

    try:
        # Build system prompt (pass message for language detection)
        system_persona = build_system_prompt(request.user_context, request.message)
        behavior_tag = map_behavior_tag(request.message)
        is_crisis = detect_crisis_simple(request.message)

        system_behavior = f"Behavior tags: {behavior_tag}"
        if is_crisis:
            system_behavior += " [safety-check]"

        # Build conversation messages
        messages = [
            {"role": "system", "content": system_persona},
            {"role": "system", "content": system_behavior}
        ]

        # Add history (limit to 20 messages)
        max_history = 20
        bounded_history = (
            request.history[-max_history:]
            if len(request.history) > max_history
            else request.history
        )

        # Check if current message already in history
        has_current = False
        if bounded_history:
            for msg in reversed(bounded_history):
                if msg.is_user_message and msg.content == request.message:
                    has_current = True
                    break

        # Add history messages
        for msg in bounded_history:
            if msg.content and msg.content.strip():
                role = "user" if msg.is_user_message else "assistant"
                messages.append({"role": role, "content": msg.content})

        # Add current message if not already present
        if not has_current:
            messages.append({"role": "user", "content": request.message})

        # Call OpenAI
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        temperature = float(os.getenv("OPENAI_TEMPERATURE", "0.8"))
        max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "160"))

        response = openai_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            top_p=0.9,
            max_tokens=max_tokens
        )

        if not response.choices or not response.choices[0].message:
            raise HTTPException(status_code=500, detail="OpenAI returned no choices")

        content = (
            response.choices[0].message.content.strip()
            if response.choices[0].message.content
            else ""
        )

        # Classify risk level
        risk_level = classify_message_content(request.message, request.history)

        return ChatResponse(
            content=content,
            is_crisis=is_crisis,
            provider="openai:mindease",
            timestamp=datetime.now(),
            risk_level=risk_level
        )

    except Exception as e:
        error_msg = str(e).lower()
        if "quota" in error_msg or "exceeded" in error_msg:
            logger.error("=== OPENAI QUOTA EXCEEDED ===")
            logger.error("Your OpenAI API key has exceeded its current quota.")

        logger.error(f"OpenAI chat completion failed: {str(e)}", exc_info=True)

        fallback_content = (
            "I'm here to listen and support you. "
            "Could you tell me more about what you're experiencing?"
        )
        is_crisis = detect_crisis_simple(request.message)
        return ChatResponse(
            content=fallback_content,
            is_crisis=is_crisis,
            provider="fallback:error",
            timestamp=datetime.now()
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
