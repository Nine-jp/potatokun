import codecs
import re

file_path = "c:/GeminiProjects/TestProject/potecoin.js"
with codecs.open(file_path, "r", "utf-8") as f:
    text = f.read()

# 1. playerPosition declaration (Initialize as empty)
text = re.sub(r'let playerPosition = new THREE\.Vector3\(.*?\);', 'let playerPosition = new THREE.Vector3();', text)

# 2. startOpeningSequence (Add camera init)
cinematic_init_code = """    function startOpeningSequence() {
        console.log("Starting Opening Sequence...");
        
        // ★ 演出開始時のカメラ初期化
        camera.position.set(-25.0, 15.0, -8.0);
        camera.lookAt(-26.5, 0.5, -14.0);
"""
text = re.sub(r'    function startOpeningSequence\(\) \{\s+console\.log\("Starting Opening Sequence\.\.\."\);', cinematic_init_code, text)

# 3. Refined Seamless Integration Logic (The "Glue")
sync_logic_replacement = """        // --- シームレス統合ロジック ---
        // 1. 演出が終わった瞬間の「本物のカメラ位置」をプレイヤー位置として確定させる
        if (typeof playerPosition !== 'undefined') {
            playerPosition.copy(camera.position);

            // 2. カメラの現在の向き（クォータニオン）から水平角度を逆算し、移動ロジックに渡す
            const dirVec = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            const finalYaw = Math.atan2(dirVec.x, dirVec.z);
            if (typeof cameraAngle !== 'undefined') cameraAngle = finalYaw;
            if (typeof playerFacing !== 'undefined') playerFacing = finalYaw;

            // 3. 物理演算の playerModel がある場合は、即座にその位置へ瞬間移動させておく
            if (typeof playerModel !== 'undefined' && playerModel) {
                playerModel.position.copy(playerPosition);
                playerModel.rotation.y = -playerFacing + Math.PI;
            }
        }
        cameraPitch = 0;
        camera.updateMatrixWorld();"""

# Replace in transitionToGameplay
text = re.sub(
    r'// ★ 根本同期：カメラ位置からプレイヤー位置を継承.*?cameraPitch = 0;',
    sync_logic_replacement,
    text,
    flags=re.DOTALL
)

# Replace in fallback/skip logic if it exists (using previous regex markers)
text = re.sub(
    r'// --- 演出終了時の状態を「地続き」で継承 ---.*?if \(typeof cameraAngle !== \'undefined\'\) cameraAngle = angle;\s+\}',
    sync_logic_replacement,
    text,
    flags=re.DOTALL
)

# 4. Remove start() setTimeout resets and other legacy sets
# Legacy camera.position.set(0, 0.6, -25) and playerPosition.set(0, 0.6, -25)
# Using more specific matching to avoid accidental deletions
text = re.sub(r'\s+camera\.position\.set\(0,\s*0\.6,\s*-25\);.*', '', text)
text = re.sub(r'\s+playerPosition\.set\(0,\s*0\.6,\s*-25\);.*', '', text)

# Remove the old start() opening init (since it's now in startOpeningSequence)
text = re.sub(r'if \(!GameConfig\.debugMode\) \{\s+camera\.position\.set\(-25\.0, 15\.0, -8\.0\);\s+camera\.lookAt\(-26\.5, 0\.5, -14\.0\);\s+\}', '// 演出開始時に動設定', text)

with codecs.open(file_path, "w", "utf-8") as f:
    f.write(text)

print("Final Glue Integration implementation complete. SAFER regex used.")
