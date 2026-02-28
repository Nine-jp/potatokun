import argparse
import os
import subprocess
import sys
import json
from playwright.sync_api import sync_playwright

DEBUG_PORT = 9222
CDP_URL = f"http://localhost:{DEBUG_PORT}"
DEFAULT_TARGET = "localhost:8081"

def get_page(context, target_url=DEFAULT_TARGET):
    # Try finding the exact target URL first
    for page in context.pages:
        if target_url in page.url:
            return page
    # Fallback to the first available page if it exists
    if context.pages:
        return context.pages[0]
    return context.new_page()

def connect_and_execute(callback):
    try:
        with sync_playwright() as p:
            browser = p.chromium.connect_over_cdp(CDP_URL)
            context = browser.contexts[0]
            target_page = get_page(context)
            result = callback(target_page)
            browser.close()
            return result
    except Exception as e:
        print(f"Error connecting to browser: {e}", file=sys.stderr)
        sys.exit(1)

def cmd_launch(args):
    # Using paths provided by the user previously
    extension_path = r"C:\Users\ゆうき\AppData\Local\Google\Chrome\User Data\Default\Extensions\eeijfnjmjelapkebgockoeaadonbchdd\1.11.3_0"
    user_data_dir = r"C:\Users\ゆうき\.antigravity\browser_profile"
    target_url = "http://localhost:8081"
    
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    ]
    
    chrome_exe = next((p for p in chrome_paths if os.path.exists(p)), None)
    if not chrome_exe:
        print("Error: Chrome executable not found in common locations.")
        sys.exit(1)

    cmd = [
        chrome_exe,
        f"--load-extension={extension_path}",
        f"--user-data-dir={user_data_dir}",
        f"--remote-debugging-port={DEBUG_PORT}",
        "--no-first-run",
        "--no-default-browser-check",
        target_url
    ]
    
    print(f"Launching Chrome via {chrome_exe}")
    subprocess.Popen(cmd)
    print("Chrome launched successfully.")

def cmd_screenshot(args):
    def action(page):
        path = os.path.abspath(args.output_path)
        page.screenshot(path=path)
        print(f"Screenshot saved to: {path}")
    connect_and_execute(action)

def cmd_dom(args):
    def action(page):
        content = page.content()
        path = os.path.abspath(args.output_path)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"DOM content saved to: {path}")
    connect_and_execute(action)

def cmd_click(args):
    def action(page):
        page.locator(args.selector).click()
        print(f"Clicked element matching: {args.selector}")
    connect_and_execute(action)

def cmd_type(args):
    def action(page):
        page.locator(args.selector).fill(args.text)
        print(f"Typed '{args.text}' into element matching: {args.selector}")
    connect_and_execute(action)

def cmd_eval(args):
    def action(page):
        res = page.evaluate(args.expression)
        print(json.dumps({"result": res}))
    connect_and_execute(action)

def cmd_goto(args):
    def action(page):
        page.goto(args.url)
        print(f"Navigated to: {args.url}")
    connect_and_execute(action)

def main():
    parser = argparse.ArgumentParser(description="AntiGravity Python Browser Controller via CDP")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # launch
    parser_launch = subparsers.add_parser("launch", help="Launch Chrome in debug mode")

    # screenshot
    parser_screenshot = subparsers.add_parser("screenshot", help="Take a screenshot")
    parser_screenshot.add_argument("output_path", help="Path to save the generated image")

    # dom
    parser_dom = subparsers.add_parser("dom", help="Dump current DOM HTML to file")
    parser_dom.add_argument("output_path", help="Path to save the HTML output")

    # click
    parser_click = subparsers.add_parser("click", help="Click an element on the page")
    parser_click.add_argument("selector", help="CSS Selector for the target element")

    # type
    parser_type = subparsers.add_parser("type", help="Type text into an input element")
    parser_type.add_argument("selector", help="CSS Selector for the target element")
    parser_type.add_argument("text", help="Text to fill into the input")

    # eval
    parser_eval = subparsers.add_parser("eval", help="Evaluate JavaScript expression on the page")
    parser_eval.add_argument("expression", help="JavaScript code to evaluate")

    # goto
    parser_goto = subparsers.add_parser("goto", help="Navigate the active page to a new URL")
    parser_goto.add_argument("url", help="Target URL")

    args = parser.parse_args()

    commands = {
        "launch": cmd_launch,
        "screenshot": cmd_screenshot,
        "dom": cmd_dom,
        "click": cmd_click,
        "type": cmd_type,
        "eval": cmd_eval,
        "goto": cmd_goto
    }
    
    commands[args.command](args)

if __name__ == "__main__":
    main()
