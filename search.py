import os

def search_files(directory, terms):
    path = os.path.join(directory, 'potecoin.js')
    try:
        with open(path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
    except UnicodeDecodeError:
        with open(path, 'r', encoding='shift_jis') as file:
            lines = file.readlines()

    with open('search_results.txt', 'w', encoding='utf-8') as out:
        out.write(f"=== SEARCHING IN {path} ===\n")
        for i, line in enumerate(lines):
            line_lower = line.lower()
            for term in terms:
                if term.lower() in line_lower:
                    out.write(f"L{i+1}: {line.strip()}\n")
                    break

search_files(r'c:\GeminiProjects\TestProject', [
    'vendingMachine', 'vending', 'openingPotato', 'banzaiNPC', 'juiceModel'
])
