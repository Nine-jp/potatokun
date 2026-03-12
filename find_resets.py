import codecs

file_path = "c:/GeminiProjects/TestProject/potecoin.js"
with codecs.open(file_path, "r", "utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "playerPosition.set(0, 0.6, -25)" in line:
        print(f"L{i+1}: {line.strip()}")
    if "camera.position.set(0, 0.6, -25)" in line:
        print(f"L{i+1}: {line.strip()}")
