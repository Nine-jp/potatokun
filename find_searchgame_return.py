import codecs

file_path = "c:/GeminiProjects/TestProject/potecoin.js"
with codecs.open(file_path, "r", "utf-8") as f:
    lines = f.readlines()

in_search_game = False
for i, line in enumerate(lines):
    if "const SearchGame =" in line:
        in_search_game = True
        print(f"L{i+1}: Start SearchGame")
    if in_search_game and "return {" in line:
        # Check if it has init/start
        next_lines = "".join(lines[i:i+10])
        if "init" in next_lines and "start" in next_lines:
            print(f"L{i+1}: Found potential return block")
            print(next_lines)
