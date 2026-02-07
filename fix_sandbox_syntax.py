
import os

file_path = 'minigame.js'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
inserted = False

# Find the end of ASSET_CONFIG specifically after Tuktuk
# We know from view_file that Tuktuk ends near 4890 with ] at 4891.
for i in range(len(lines)):
    line = lines[i]
    if not inserted and '];' in line and i > 4800:
        # Check if the previous line is a closing brace
        prev_line = new_lines[-1] if new_lines else ""
        if '}' in prev_line:
            # Ensure comma at the end of the previous object
            if ',' not in prev_line:
                new_lines[-1] = prev_line.replace('}', '},')
            
            # Insert Sandbox configuration
            new_lines.append("                {\n")
            new_lines.append("                    name: 'Sandbox',\n")
            new_lines.append("                    path: 'models/Sand_set.fbx',\n")
            new_lines.append("                    pos: { x: 10, y: 0, z: 23 },\n")
            new_lines.append("                    rot: { y: 0 },\n")
            new_lines.append("                    scale: 1.0,\n")
            new_lines.append("                    checkCollisions: true,\n")
            new_lines.append("                    onLoad: (obj) => {\n")
            new_lines.append("                        console.log(\"🏖️ Sandbox Set Loaded\");\n")
            new_lines.append("                        obj.traverse(c => {\n")
            new_lines.append("                            if (c.isMesh) {\n")
            new_lines.append("                                c.castShadow = true;\n")
            new_lines.append("                                c.receiveShadow = true;\n")
            new_lines.append("                                // Register walkable mesh\n")
            new_lines.append("                                if (c.name.includes('SandboxMain')) {\n")
            new_lines.append("                                    if (window.sgWalkableMeshes) window.sgWalkableMeshes.push(c);\n")
            new_lines.append("                                }\n")
            new_lines.append("                            }\n")
            new_lines.append("                        });\n")
            new_lines.append("                    }\n")
            new_lines.append("                }\n")
            inserted = True
    new_lines.append(line)

if inserted:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("FIX_SUCCESS: Sandbox moved out of Tuktuk.")
else:
    print("FIX_FAILURE: Target point not found.")
