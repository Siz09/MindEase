from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Capture console logs, errors, and page errors
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("pageerror", lambda err: print(f"PAGEERROR: {err}"))
    page.on("weberror", lambda web_error: print(f"WEBERROR: {web_error.error}"))

    try:
        page.goto("http://localhost:5173", wait_until="networkidle")

        # Save the HTML content to a file for debugging
        os.makedirs("jules-scratch/verification", exist_ok=True)
        with open("jules-scratch/verification/page_source.html", "w", encoding="utf-8") as f:
            f.write(page.content())

        # Add a delay to see if any async errors are logged
        page.wait_for_timeout(2000)

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
