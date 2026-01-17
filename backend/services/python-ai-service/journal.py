# backend/services/python-ai-service/journal.py
from fastapi import APIRouter, HTTPException
from openai import OpenAI
import os
import logging
from dotenv import load_dotenv

from models import (
    JournalSummaryRequest,
    JournalSummaryResponse,
    MoodInsightRequest,
    MoodInsightResponse
)

# Load environment variables first
load_dotenv()

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize OpenAI client
openai_client = None
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)


def get_openai_client():
    """Get OpenAI client or return None if not configured"""
    # Lazy initialization - check again in case env was loaded after module import
    global openai_client
    if openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            openai_client = OpenAI(api_key=api_key)
            logger.info("OpenAI client initialized successfully")
        else:
            logger.warn("OPENAI_API_KEY not found in environment variables")
    return openai_client


def generate_mock_summary(content: str) -> str:
    """Generate mock summary when OpenAI is unavailable"""
    preview = content[:50] + "..." if len(content) > 50 else content
    return f"Journal entry about: {preview}"


def generate_mock_insight(content: str) -> str:
    """Generate mock insight when OpenAI is unavailable"""
    return "Keep tracking your mood to get personalized insights!"


@router.post("/journal/summary", response_model=JournalSummaryResponse)
async def generate_journal_summary(request: JournalSummaryRequest):
    """
    Generate journal entry summary using OpenAI.
    Replaces OpenAIService.generateJournalSummary()
    """
    client = get_openai_client()
    if not client:
        logger.error("OpenAI service not configured - API key missing or invalid. Returning mock summary.")
        return JournalSummaryResponse(summary=generate_mock_summary(request.content))

    try:
        system_prompt = (
            "You are an empathetic mental health assistant. "
            "Provide concise, supportive summaries of journal entries, focusing on emotions and themes."
        )

        user_prompt = (
            f"Summarize the following journal entry in under 100 words, "
            f"with empathy and focus on emotions and themes.\n\n"
            f"Journal entry: {request.content}"
        )

        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        temperature = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))
        max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "150"))

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=temperature,
            top_p=0.9,
            max_tokens=max_tokens
        )

        if not response.choices or not response.choices[0].message:
            logger.warn("No choices returned from OpenAI Chat API for summary")
            return JournalSummaryResponse(summary=generate_mock_summary(request.content))

        summary = response.choices[0].message.content
        if summary:
            summary = summary.strip()

        logger.info("Successfully generated AI summary for journal entry")
        return JournalSummaryResponse(summary=summary or generate_mock_summary(request.content))

    except Exception as e:
        logger.warn(f"Error calling OpenAI Chat API (summary): {str(e)}", exc_info=True)
        return JournalSummaryResponse(summary=generate_mock_summary(request.content))


@router.post("/journal/mood-insight", response_model=MoodInsightResponse)
async def generate_mood_insight(request: MoodInsightRequest):
    """
    Generate mood insight from journal entry using OpenAI.
    Replaces OpenAIService.generateMoodInsight()
    """
    client = get_openai_client()
    if not client:
        logger.error("OpenAI service not configured - API key missing or invalid. Returning mock mood insight.")
        return MoodInsightResponse(insight=generate_mock_insight(request.content))

    try:
        system_prompt = (
            "You analyze journal entries to detect emotions and suggest one gentle self-care tip."
        )

        user_prompt = (
            f"Based on this journal entry, briefly describe the writer's emotional state "
            f"and offer one gentle self-care suggestion (under 50 words).\n\n"
            f"Journal entry: {request.content}"
        )

        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        temperature = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))
        max_tokens = min(int(os.getenv("OPENAI_MAX_TOKENS", "150")), 120)

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=temperature,
            top_p=0.9,
            max_tokens=max_tokens
        )

        if not response.choices or not response.choices[0].message:
            logger.warn("No choices returned from OpenAI Chat API for mood insight")
            return MoodInsightResponse(insight=generate_mock_insight(request.content))

        insight = response.choices[0].message.content
        if insight:
            insight = insight.strip()

        logger.info("Successfully generated mood insight for journal entry")
        return MoodInsightResponse(insight=insight or generate_mock_insight(request.content))

    except Exception as e:
        logger.warn(f"Error calling OpenAI Chat API (mood insight): {str(e)}", exc_info=True)
        return MoodInsightResponse(insight=generate_mock_insight(request.content))
