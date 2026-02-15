import subprocess
import os

# Chromeのパス (標準的なインストール先を想定)
chrome_path = "C:/Program Files/Google/Chrome/Application/chrome.exe"

# 指定された引数
extension_path = "C:/Users/ゆうき/AppData/Local/Google/Chrome/User Data/Default/Extensions/eeijfnjmjelapkebgockoeaadonbchdd/1.11.3_0"
user_data_dir = "C:/Users/ゆうき/.antigravity/browser_profile"
remote_debugging_port = "9222"
url = "http://localhost:8081"

# Chrome実行コマンドの構築 (引数リストとして指定)
# --load-extension と --user-data-dir にダブルクオートを付けない (subprocessが適切に処理するため)
# 文字列の結合時に意図しないエスケープを避けるため、パス指定はユーザーの要望通りスラッシュ形式を使用
cmd = [
    chrome_path,
    f'--load-extension={extension_path}',
    f'--user-data-dir={user_data_dir}',
    f'--remote-debugging-port={remote_debugging_port}',
    url
]

print("Launching Chrome with command:")
for arg in cmd:
    print(arg)

try:
    # subprocess.Popen で非同期に実行
    process = subprocess.Popen(cmd)
    print(f"Chrome launched successfully with PID: {process.pid}")
except FileNotFoundError:
    print(f"Error: Chrome executable not found at {chrome_path}")
except Exception as e:
    print(f"Error launching Chrome: {e}")
