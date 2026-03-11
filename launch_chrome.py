import subprocess
import os
import sys

chrome_paths = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Users\ゆうき\AppData\Local\Google\Chrome\Application\chrome.exe"
]

chrome_exe = None
for path in chrome_paths:
    if os.path.exists(path):
        chrome_exe = path
        break

if not chrome_exe:
    print("Error: Chrome executable not found.")
    sys.exit(1)

cmd_str = f'"{chrome_exe}" --load-extension="C:/Users/ゆうき/AppData/Local/Google/Chrome/User Data/Default/Extensions/eeijfnjmjelapkebgockoeaadonbchdd/1.11.3_0" --user-data-dir="C:/Users/ゆうき/.antigravity/browser_profile" --remote-debugging-port=9222 http://localhost:8081'

print("Launching Chrome with command:")
print(cmd_str)

subprocess.Popen(cmd_str)
print("Done.")
