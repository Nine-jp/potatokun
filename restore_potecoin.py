import codecs

parts = [
    "c:/GeminiProjects/TestProject/potecoin_part1.txt",
    "c:/GeminiProjects/TestProject/potecoin_part2.txt",
    "c:/GeminiProjects/TestProject/potecoin_part3.txt",
    "c:/GeminiProjects/TestProject/potecoin_part4.txt"
]

output_file = "c:/GeminiProjects/TestProject/potecoin.js"

full_text = ""
for part in parts:
    with codecs.open(part, "r", "utf-8") as f:
        full_text += f.read()

with codecs.open(output_file, "w", "utf-8") as f:
    f.write(full_text)

print(f"Restored {output_file} from {len(parts)} parts.")
print(f"Total size: {len(full_text)} characters.")
