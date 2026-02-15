import subprocess
import os
import sys
import time

# Chrome paths to check
chrome_paths = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    os.path.expanduser(r"~\AppData\Local\Google\Chrome\Application\chrome.exe")
]

chrome_path = None
for path in chrome_paths:
    if os.path.exists(path):
        chrome_path = path
        break

if not chrome_path:
    print("Chrome executable not found.")
    sys.exit(1)

# Arguments based on user request (with typo correction for .antigravity path)
user_data_dir = r"C:\Users\ゆうき\.antigravity\browser_profile"
extension_path = r"C:\Users\ゆうき\AppData\Local\Google\Chrome\User Data\Default\Extensions\eeijfnjmjelapkebgockoeaadonbchdd"
url = "http://localhost:8081"

cmd = [
    chrome_path,
    f'--load-extension={extension_path}',
    f'--user-data-dir={user_data_dir}',
    '--remote-debugging-port=9222',
    '--no-first-run',
    '--no-default-browser-check',
    url
]

print(f"Launching Chrome with command: {cmd}")
print(f"User Data Dir: {user_data_dir}")

try:
    process = subprocess.Popen(cmd)
    print(f"Chrome launched with PID: {process.pid}")
    
    # Wait a bit to ensure it started
    time.sleep(2)
    
    if process.poll() is None:
        print("Chrome is running.")
    else:
        print(f"Chrome exited immediately with return code: {process.returncode}")

except Exception as e:
    print(f"Failed to launch Chrome: {e}")
