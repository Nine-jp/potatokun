import sys

def main():
    try:
        with open('c:/GeminiProjects/TestProject/potecoin.js', 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        start_line = 0
        for i, line in enumerate(lines):
            if 'function startOpeningSequence' in line:
                start_line = i
                break
                
        if start_line == 0:
            print("Not found startOpeningSequence")
            return
            
        with open('output2.txt', 'w', encoding='utf-8') as out:
            for i in range(max(0, start_line - 10), min(len(lines), start_line + 400)):
                out.write(f"{i+1}: {lines[i]}")
            
    except Exception as e:
        with open('output2.txt', 'w', encoding='utf-8') as out:
            out.write(str(e))

if __name__ == '__main__':
    main()
