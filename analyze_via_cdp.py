import asyncio
from playwright.async_api import async_playwright
import os

async def analyze():
    async with async_playwright() as p:
        try:
            # Connect to the browser launched on port 9222
            print("Connecting to browser on port 9222...")
            browser = await p.chromium.connect_over_cdp("http://localhost:9222")
            
            # Find the correct page
            context = browser.contexts[0]
            target_page = None
            
            for page in context.pages:
                if "localhost:8081" in page.url:
                    target_page = page
                    break
            
            if not target_page:
                print("Target page not found. Using the first available page if any.")
                if context.pages:
                    target_page = context.pages[0]
                else:
                    print("No pages found.")
                    return

            print(f"Analyzing page: {target_page.url}")
            
            # Ensure output directory exists (make absolute path)
            output_dir = os.path.abspath("analysis_artifacts")
            os.makedirs(output_dir, exist_ok=True)
            
            # Take screenshot
            screenshot_path = os.path.join(output_dir, "screenshot.png")
            await target_page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to: {screenshot_path}")
            
            # Get Page Title and URL
            title = await target_page.title()
            print(f"Page Title: {title}")
            print(f"Page URL: {target_page.url}")

            # Dump DOM content
            content = await target_page.content()
            dom_path = os.path.join(output_dir, "dom.html")
            with open(dom_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"DOM content saved to: {dom_path}")
            
            # Keep browser connection open for a bit if needed, but here we close CDP connection
            # Note: browser.close() via CDP might close the actual browser if it was launched by playwright,
            # but usually connect_over_cdp just disconnects. 
            # However, to be safe, we just disconnect.
            # actually Playwright's browser.close() when connected over CDP closes the connection, not necessarily the browser.
            await browser.close()
            print("Analysis complete.")
            
        except Exception as e:
            print(f"Analysis failed: {e}")

if __name__ == "__main__":
    asyncio.run(analyze())
