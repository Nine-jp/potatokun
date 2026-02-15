import subprocess
import os
import sys

def launch_chrome():
    # User-specific paths
    user_home = os.path.expanduser("~")
    # Using the exact path provided in the prompt, assuming user is 'ゆうき'
    # However, create a dynamic check just in case.
    # The user provided: C:\Users\ゆうき\... which implies the user folder name is 'ゆうき'
    
    # Paths provided by user
    extension_path = r"C:\Users\ゆうき\AppData\Local\Google\Chrome\User Data\Default\Extensions\eeijfnjmjelapkebgockoeaadonbchdd\1.11.3_0"
    user_data_dir = r"C:\Users\ゆうき\.antigravity\browser_profile"
    target_url = "http://localhost:8081"
    
    # Common Chrome executable locations on Windows
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.join(user_home, r"AppData\Local\Google\Chrome\Application\chrome.exe")
    ]
    
    chrome_exe = None
    for path in chrome_paths:
        if os.path.exists(path):
            chrome_exe = path
            break
            
    if not chrome_exe:
        print("Error: Google Chrome executable not found in common locations.")
        print("Checked paths:")
        for path in chrome_paths:
            print(f" - {path}")
        return

    # Use subprocess to launch Chrome
    cmd = [
        chrome_exe,
        f"--load-extension={extension_path}",
        f"--user-data-dir={user_data_dir}",
        "--remote-debugging-port=9222",
        "--no-first-run",
        "--no-default-browser-check",
        target_url
    ]
    
    print(f"Launching Chrome from: {chrome_exe}")
    print(f"Extension Path: {extension_path}")
    print(f"User Data Dir: {user_data_dir}")
    print(f"Target URL: {target_url}")
    
    try:
        # Popen allows the script to finish while Chrome keeps running
        subprocess.Popen(cmd)
        print("Chrome launched successfully.")
    except Exception as e:
        print(f"Failed to launch Chrome: {e}")

if __name__ == "__main__":
    launch_chrome()
