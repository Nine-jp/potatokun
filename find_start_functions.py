import codecs

file_path = "c:/GeminiProjects/TestProject/potecoin.js"
with codecs.open(file_path, "r", "utf-8") as f:
    lines = f.readlines()

in_search_game = False
for i, line in enumerate(lines):
    if "const SearchGame =" in line:
        in_search_game = True
    if i+1 > 6912:
        in_search_game = False

    if in_search_game:
        # Look for function definitions or assignments
        cleaned = line.strip()
        if cleaned.startswith("function start(") or cleaned.startswith("const start ="):
            print(f"L{i+1}: {cleaned}")
        if "start: function" in cleaned:
             print(f"L{i+1}: {cleaned}")
        if cleaned.startswith("function init("):
             print(f"L{i+1}: {cleaned}")
