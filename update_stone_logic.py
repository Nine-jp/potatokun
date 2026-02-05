import re

file_path = 'c:/GeminiProjects/TestProject/minigame.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Start marker: // Traverse and collect markers first
# End marker: if (stoneCount > 0) {

start_str = "// Traverse and collect markers first"
end_str = "if (stoneCount > 0) {"

if content.find(start_str) == -1:
    # Maybe logic changed or restored, try finding unique pattern of Nearest Neighbor
    start_str = "// Traverse and collect markers first"
    # Actually, the start string is still the same as previous Python script injection.

# New Code Logic (Manual Control - Direct Copy)
new_code = """
                // Traverse and place stones directly based on markers (Manual Control)
                const stoneGroup = new THREE.Group();
                stoneGroup.name = 'PondStoneWall';
                let stoneCount = 0;

                pondModel.traverse((child) => {
                    if (child.name.includes("StonePoint")) {
                        const stone = stoneModel.clone();
                        
                        // Copy transform exactly from marker (Position & Rotation)
                        const worldPos = new THREE.Vector3();
                        const worldQuat = new THREE.Quaternion();
                        
                        child.getWorldPosition(worldPos);
                        child.getWorldQuaternion(worldQuat);
                        
                        stone.position.copy(worldPos);
                        stone.quaternion.copy(worldQuat);
                        
                        // Adjust Y slightly to prevent z-fighting with water if necessary
                        // But keep user control. Setting to 0.05 just to be safe.
                        stone.position.y = 0.05;

                        // Variation in scale only
                        const scaleVar = 0.8 + Math.random() * 0.4;
                        stone.scale.setScalar(finalScale * scaleVar);
                        
                        stone.castShadow = true;
                        stone.receiveShadow = true;
                        stoneGroup.add(stone);
                        stoneCount++;
                    }
                });
                
                """

# Regex Replacement
pattern = re.compile(re.escape(start_str) + r".*?" + re.escape(end_str), re.DOTALL)
replacement = new_code + end_str

new_content = pattern.sub(replacement, content)

if new_content == content:
    print("No changes made! Regex failed.")
else:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully reverted to Manual Logic.")
