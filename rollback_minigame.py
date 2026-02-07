
import os

file_path = 'minigame.js'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_mode = False
spawn_pond_fixed = False

for line in lines:
    # 1. Logic to remove Debug Sphere Block
    if '// ★ DEBUG: Red Sphere at Pond Center' in line:
        skip_mode = True
    
    if skip_mode:
        if 'console.log("🌊 [System] Procedural Water Generated.");' in line:
            skip_mode = False
            continue # Skip the end marker too
        continue # Skip this line

    # 2. Logic to Fix spawnPond
    # Search for the "forcing Procedural Placement" warning and replace the block
    if 'Skipping fallback and forcing Procedural Placement' in line:
        # We want to replace this whole block with the simple return
        # The block in file looks like:
        # if (markers.length === 0) {
        #      console.warn("...");
        #      placeStonesProcedurally(...);
        #      return;
        # }
        
        # We are currently at the console.warn line.
        # We need to change this line and the next few lines.
        # Simplest way: just change the current line to the new warning,
        # and ignore the next line (placeStonesProcedurally).
        
        new_lines.append('                     console.warn("⚠️ [POND] No markers found in ParkGroup (mat.fbx). Stone placement skipped.");\n')
        # We need to skip the next line which is placeStonesProcedurally
        spawn_pond_fixed = True
        continue
    
    if spawn_pond_fixed:
        if 'placeStonesProcedurally' in line:
            continue # Skip the function call
        if 'return;' in line:
            new_lines.append(line) # Keep the return
            spawn_pond_fixed = False # Done fixing
            continue

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Rollback script executed.")
