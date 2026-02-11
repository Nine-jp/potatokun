import os

# Define the order of parts
parts = [
    "minigame_part1.txt",
    "minigame_part2.txt",
    "minigame_part3.txt",
    "minigame_part4.txt"
]

output_file = "minigame.js"

try:
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for part_name in parts:
            if os.path.exists(part_name):
                print(f"Reading {part_name}...")
                with open(part_name, 'r', encoding='utf-8') as infile:
                    content = infile.read()
                    outfile.write(content)
                    # We do NOT add a newline here because the split script 
                    # likely preserved the exact content structure.
                    # Adding a newline might double-break lines if the split was clean.
                    # Use your best judgement: if parts don't end with newline, adding one might be safer for JS.
                    # But if split was strictly by byte/line count, concatenation should be exact.
                    # Let's assume strict concatenation is best.
            else:
                print(f"Warning: {part_name} not found.")
    
    print(f"✅ Successfully joined parts into {output_file}")

except Exception as e:
    print(f"❌ Error joining files: {e}")
