import codecs
import re

file_path = "c:/GeminiProjects/TestProject/potecoin.js"
with codecs.open(file_path, "r", "utf-8") as f:
    text = f.read()

# 1. Update playerPosition declaration
# Target: let playerPosition = new THREE.Vector3(); // Zを31.0に変更
text = re.sub(r'let playerPosition = new THREE\.Vector3\(\); // Zを31\.0に変更', 'let playerPosition = new THREE.Vector3();', text)

# 2. Start Function cleanup (Around line 1222)
# Remove the initial cinematic setup from start()
# Search for: // 演出連動のため初期リセットを廃止
text = re.sub(r'// ★ 初期フレームバグ修正: レンダリング開始時から即座にオープニング初期位置（空）へカメラを配置\s+// 演出連動のため初期リセットを廃止\s+', '', text)

# 3. startOpeningSequence initialization
# Add explicit camera.position.set and camera.lookAt at the start of startOpeningSequence
cinematic_init = """    function startOpeningSequence() {
        console.log("Starting Opening Sequence...");
        
        // ★ 演出開始時のカメラ初期化 (start()から移動)
        camera.position.set(-25.0, 15.0, -8.0);
        camera.lookAt(-26.5, 0.5, -14.0);
"""
text = re.sub(r'    function startOpeningSequence\(\) \{\s+console\.log\("Starting Opening Sequence\.\.\."\);', cinematic_init, text)

# 4. Final sweep for (0, 0.6, -25) sets
# These were already commented out in a previous step, but user wants them GONE.
# camera.position.set(0, 0.6, -25);
# playerPosition.set(0, 0.6, -25);
text = re.sub(r'// 初期位置は演出または前フレームを維持', '', text)
text = re.sub(r'// 初期位置は動的に設定', '', text)

# Also check if there are any other unintended remants
# Search for any line containing position.set(0, 0.6, -25)
text = re.sub(r'.*?position\.set\(0, 0\.6, -25\);.*?\n', '', text)

with codecs.open(file_path, "w", "utf-8") as f:
    f.write(text)

print("Final cleanup of legacy coordinates completed. Cinematic init moved to startOpeningSequence.")
