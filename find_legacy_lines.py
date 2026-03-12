import codecs

file_path = "c:/GeminiProjects/TestProject/potecoin.js"
with codecs.open(file_path, "r", "utf-8") as f:
    lines = f.readlines()

targets = ["camera.position.set(0, 0.6, -25)", "playerPosition.set(0, 0.6, -25)"]

for i, line in enumerate(lines):
    for target in targets:
        if target in line:
            print(f"L{i+1}: {line.strip()}")
