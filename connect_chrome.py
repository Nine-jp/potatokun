import urllib.request
import json
import socket

def connect_to_chrome():
    port = 9222
    target_url = "http://localhost:8081"
    base_url = f"http://localhost:{port}"

    print(f"Connecting to Chrome on port {port}...")

    # Check if port is listening
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    if result != 0:
        print(f"Error: Port {port} is not open. Ensure Chrome is running with --remote-debugging-port={port}")
        return

    sock.close()

    try:
        # Get Version
        # This confirms we can talk to the CDP HTTP endpoint
        with urllib.request.urlopen(f"{base_url}/json/version") as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                print("Connection established.")
                print(f"Browser: {data.get('Browser')}")
            else:
                print(f"Failed to connect. Status: {response.status}")
                return

        # Open New Tab with the target URL
        # The /json/new endpoint usually requires PUT method in newer Chrome versions
        print(f"Opening {target_url}...")
        req = urllib.request.Request(f"{base_url}/json/new?{target_url}", method="PUT")
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                tab_info = json.loads(response.read().decode('utf-8'))
                print(f"Successfully opened new tab with ID: {tab_info.get('id')}")
            else:
                print(f"Failed to open tab. Status: {response.status}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    connect_to_chrome()
