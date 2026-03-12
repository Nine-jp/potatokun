import codecs
import re

file_path = "c:/GeminiProjects/TestProject/potecoin.js"
with codecs.open(file_path, "r", "utf-8") as f:
    text = f.read()

# 1. Redefine Variable Declarations (Lines 962-964)
# Change let playerPosition = new THREE.Vector3(0, 0.6, 31.0); -> new THREE.Vector3();
text = re.sub(r'let playerPosition = new THREE\.Vector3\(0, 0\.6, 31\.0\);', 'let playerPosition = new THREE.Vector3();', text)

# 2. Update camPoints and lookPoints final targets (Lines 1883-1896)
# camPoints final: (-27.5, 0.6, -15.5)
# lookPoints final: (0, 0.6, 31)
cam_points_target = r'new THREE\.Vector3\(-27\.5, 0\.6, -15\.5\)\s+// 11s: 到着'
look_points_target = r'new THREE\.Vector3\(0, 0\.6, 31\)\s+// 最終'

# The camPoints final point in code currently is: new THREE.Vector3(-27.5, 0.6, -15.5) // 11s: 到着
# It seems it was already mostly there, but let's ensure it's exact.
# In the provided snippet, camPoints was:
# [-25.0, 15.0, -8.0], [-25.5, 0.6, -12.5], [-25.5, 0.6, -12.5], [-29.5, 0.6, -16.5], [-27.5, 0.6, -15.5]
# My current code uses these exact camPoints.

# 3. Implement getWorldDirection in transitionToGameplay (Lines 1730-1781)
# We need to replace the sync logic block.

new_handover_logic = """        // --- 演出終了時の状態を「地続き」で継承 ---
        if (typeof playerPosition !== 'undefined') {
            // 1. 位置のコピー
            playerPosition.copy(camera.position);

            // 2. 向き（水平回転角）の抽出
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            const currentAngle = Math.atan2(direction.x, direction.z);

            // 3. プレイヤーとカメラの角度を同期
            if (typeof playerFacing !== 'undefined') playerFacing = currentAngle;
            if (typeof cameraAngle !== 'undefined') cameraAngle = currentAngle;
        }"""

# Target the search block for the handover
text = re.sub(
    r'// ★ 根本同期：カメラ位置からプレイヤー位置を継承.*?if \(typeof cameraAngle !== \'undefined\'\) cameraAngle = angle;\s+\}',
    new_handover_logic,
    text,
    flags=re.DOTALL
)

# 4. Remove start() setTimeout camera resets (Lines 1222-1225)
# Search: if (!GameConfig.debugMode) { ... camera.position.set(-25.0, 15.0, -8.0); ... }
text = re.sub(
    r'if \(!GameConfig\.debugMode\) \{\s+camera\.position\.set\(-25\.0, 15\.0, -8\.0\);\s+camera\.lookAt\(-26\.5, 0\.5, -14\.0\);\s+\}',
    '// 演出連動のため初期リセットを廃止',
    text
)

# 5. Eliminate any playerPosition.set or camera.position.set in start() skip logic (Lines 1294-1300)
# This was also using the sync_logic from previous script.
# We'll update it to use the new_handover_logic (getWorldDirection) as well.
text = re.sub(
    r'// ★ 根本同期：カメラ位置からプレイヤー位置を継承.*?if \(typeof cameraAngle !== \'undefined\'\) cameraAngle = angle;\s+\}',
    new_handover_logic,
    text,
    flags=re.DOTALL
)

# 6. Global cleanup of "warping" sets (Lines 2659, 2795)
# initThreeJS initial position: camera.position.set(0, 0.6, -25);
text = re.sub(r'camera\.position\.set\(0, 0\.6, -25\); // Old: 25\. Inverted: -25\. \(North Entrance\?\)', '// 初期位置は演出または前フレームを維持', text)
# orbit camera setup position: playerPosition.set(0, 0.6, -25);
text = re.sub(r'playerPosition\.set\(0, 0\.6, -25\); // Old: 25\. Inverted: -25\.', '// 初期位置は動的に設定', text)

with codecs.open(file_path, "w", "utf-8") as f:
    f.write(text)

print("Seamless integration with getWorldDirection implemented. Hardcoded resets eliminated.")
