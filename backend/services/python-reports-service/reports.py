# backend/services/python-reports-service/reports.py
"""
Report generation service.
Generates HTML and PDF reports for admin dashboard, user insights, and analytics.
"""
import logging
from datetime import datetime, date
from typing import Dict, Optional
from jinja2 import Environment, select_autoescape
import os
import uuid

logger = logging.getLogger(__name__)

# Create Jinja2 environment with auto-escaping enabled
jinja_env = Environment(autoescape=select_autoescape(['html', 'xml']))


def generate_admin_dashboard_report(data: Dict) -> Dict:
    """
    Generate admin dashboard report.
    """
    report_id = str(uuid.uuid4())

    template_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Admin Dashboard Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .metric { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
            .metric-label { font-weight: bold; color: #666; }
            .metric-value { font-size: 24px; color: #2196F3; }
        </style>
    </head>
    <body>
        <h1>Admin Dashboard Report</h1>
        <p>Generated: {{ generated_at }}</p>

        <div class="metric">
            <div class="metric-label">Active Users</div>
            <div class="metric-value">{{ active_users }}</div>
        </div>

        <div class="metric">
            <div class="metric-label">Total Signups</div>
            <div class="metric-value">{{ signups }}</div>
        </div>

        <div class="metric">
            <div class="metric-label">Crisis Flags (24h)</div>
            <div class="metric-value">{{ crisis_flags }}</div>
        </div>

        <div class="metric">
            <div class="metric-label">AI Usage</div>
            <div class="metric-value">{{ ai_usage }}</div>
        </div>
    </body>
    </html>
    """

    try:
        template = jinja_env.from_string(template_content)
        html_content = template.render(
            generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            active_users=data.get("active_users", 0),
            signups=data.get("signups", 0),
            crisis_flags=data.get("crisis_flags", 0),
            ai_usage=data.get("ai_usage", 0)
        )
    except Exception as e:
        logger.error(f"Failed to generate admin dashboard report: {e}")
        return {
            "report_id": report_id,
            "report_type": "admin_dashboard",
            "format": "html",
            "content": "",
            "generated_at": datetime.now(),
            "status": "failed",
            "error": str(e)
        }

    return {
        "report_id": report_id,
        "report_type": "admin_dashboard",
        "format": "html",
        "content": html_content,
        "generated_at": datetime.now(),
        "status": "completed"
    }


def generate_user_insights_report(user_id: str, data: Dict) -> Dict:
    """
    Generate user insights report.
    """
    report_id = str(uuid.uuid4())

    template_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>User Insights Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .insight { margin: 20px 0; padding: 15px; background: #e3f2fd; border-radius: 5px; }
        </style>
    </head>
    <body>
        <h1>User Insights Report</h1>
        <p>User ID: {{ user_id }}</p>
        <p>Generated: {{ generated_at }}</p>

        <div class="insight">
            <h3>Mood Trends</h3>
            <p>{{ mood_trend }}</p>
        </div>

        <div class="insight">
            <h3>Activity Summary</h3>
            <p>{{ activity_summary }}</p>
        </div>
    </body>
    </html>
    """

    try:
        template = jinja_env.from_string(template_content)
        html_content = template.render(
            user_id=user_id,
            generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            mood_trend=data.get("mood_trend", "No data available"),
            activity_summary=data.get("activity_summary", "No data available")
        )
    except Exception as e:
        logger.error(f"Failed to generate user insights report: {e}")
        return {
            "report_id": report_id,
            "report_type": "user_insights",
            "format": "html",
            "content": "",
            "generated_at": datetime.now(),
            "status": "failed",
            "error": str(e)
        }

    return {
        "report_id": report_id,
        "report_type": "user_insights",
        "format": "html",
        "content": html_content,
        "generated_at": datetime.now(),
        "status": "completed"
    }


def generate_analytics_summary_report(data: Dict) -> Dict:
    """
    Generate analytics summary report.
    """
    report_id = str(uuid.uuid4())

    template_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Analytics Summary Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #4CAF50; color: white; }
        </style>
    </head>
    <body>
        <h1>Analytics Summary Report</h1>
        <p>Generated: {{ generated_at }}</p>

        <h2>Key Metrics</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            {% for metric, value in metrics.items() %}
            <tr>
                <td>{{ metric }}</td>
                <td>{{ value }}</td>
            </tr>
            {% endfor %}
        </table>
    </body>
    </html>
    """

    try:
        template = jinja_env.from_string(template_content)
        html_content = template.render(
            generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            metrics=data.get("metrics", {})
        )
    except Exception as e:
        logger.error(f"Failed to generate analytics summary report: {e}")
        return {
            "report_id": report_id,
            "report_type": "analytics_summary",
            "format": "html",
            "content": "",
            "generated_at": datetime.now(),
            "status": "failed",
            "error": str(e)
        }

    return {
        "report_id": report_id,
        "report_type": "analytics_summary",
        "format": "html",
        "content": html_content,
        "generated_at": datetime.now(),
        "status": "completed"
    }
