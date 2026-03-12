import codecs

file_path = "c:/GeminiProjects/TestProject/potecoin.js"
with codecs.open(file_path, "r", "utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "window.camera =" in line:
        print(f"L{i+1}: {line.strip()}")
