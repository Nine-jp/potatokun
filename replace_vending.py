import os
import re

targets = ['vendingMachine', 'VendingMachine', 'Vending_Machine', 'vending_Machine']

def replace_in_file(path):
    # skip backup folder
    if 'backup' in path: return 0
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return 0

    original = content
    count = 0
    for target in targets:
        # User requested to change any occurrence of target to vending_machine
        # Exception: targetType === 'vending' is fine since target is just the word 'vending'
        # The prompt says replace the above 4 words exactly.
        if target in content:
            # count occurrences
            count += content.count(target)
            content = content.replace(target, 'vending_machine')
    
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return count
    return 0

total_replacements = 0
files_modified = []
for root, _, files in os.walk(r'c:\GeminiProjects\TestProject'):
    for file in files:
        if file.endswith(('.js', '.html', '.css', '.txt', '.md', '.json')):
            path = os.path.join(root, file)
            count = replace_in_file(path)
            if count > 0:
                files_modified.append(f"{file}: {count}")
                total_replacements += count

print(f"Total Replacements: {total_replacements}")
print("Files Modified:")
for fm in files_modified:
    print(fm)
