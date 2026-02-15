import subprocess
import time

# Define paths
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
# Updated extension path to include version as requested
extension_path = r"C:\Users\ゆうき\AppData\Local\Google\Chrome\User Data\Default\Extensions\eeijfnjmjelapkebgockoeaadonbchdd\1.11.3_0"
# Corrected path assuming missing backslash in user request based on previous file content
user_data_dir = r"C:\Users\ゆうき\.antigravity\browser_profile"
url = "http://localhost:8081"

# Construct command
cmd = [
    chrome_path,
    f"--load-extension={extension_path}",
    f"--user-data-dir={user_data_dir}",
    "--remote-debugging-port=9222",
    "--no-first-run",
    "--no-default-browser-check",
    url
]

print(f"Launching Chrome with command: {cmd}")
print(f"User Data Dir: {user_data_dir}")

try:
    # Launch process
    process = subprocess.Popen(cmd)
    print(f"Chrome launched with PID: {process.pid}")
    
    # Wait a bit to ensure it started
    time.sleep(5)
    
    if process.poll() is None:
        print("Chrome is running.")
    else:
        print(f"Chrome exited immediately with return code: {process.returncode}")

except Exception as e:
    print(f"Failed to launch Chrome: {e}")
