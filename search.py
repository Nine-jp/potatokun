import sys

def main():
    try:
        with open('c:/GeminiProjects/TestProject/potecoin.js', 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        start_line = 0
        end_line = 0
        
        # Searching for "const OPENING_LINES =" or "openingTimers.push"
        for i, line in enumerate(lines):
            if 'const OPENING_LINES' in line or 'openingTimers.push' in line or 'function start(' in line and 'openingInterval' in line or 'function playOpening' in line:
                start_line = i - 50
                break
                
        if start_line < 0: start_line = 0
        
        # We also want to find where the opening sequence is played
        with open('output.txt', 'w', encoding='utf-8') as out:
            for i in range(max(0, start_line - 20), min(len(lines), start_line + 400)):
                out.write(f"{i+1}: {lines[i]}")
            
    except Exception as e:
        with open('output.txt', 'w', encoding='utf-8') as out:
            out.write(str(e))

if __name__ == '__main__':
    main()
