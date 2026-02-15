from playwright.sync_api import sync_playwright
import time
import requests

def run():
    try:
        # Check if debug port is active
        try:
            resp = requests.get('http://localhost:9222/json/version', timeout=2)
            print(f"Debug port active: {resp.status_code}")
        except Exception as e:
            print(f"Debug port not reachable: {e}")
            return

        with sync_playwright() as p:
            # Connect to existing browser instance
            browser = p.chromium.connect_over_cdp("http://localhost:9222")
            context = browser.contexts[0]
            # Find the page with localhost:8081
            target_page = None
            for page in context.pages:
                if "localhost:8081" in page.url:
                    target_page = page
                    break
            
            if not target_page:
                print("Page not found, creating new one...")
                target_page = context.new_page()
                target_page.goto("http://localhost:8081")
            
            print("Page loaded based on URL matching.")
            # Wait for canvas or relevant element
            try:
                target_page.wait_for_selector("canvas", timeout=5000)
            except:
                print("Canvas not found within timeout.")

            target_page.screenshot(path="screenshot_layout.png")
            print("Screenshot saved to screenshot_layout.png")
            
            browser.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run()
