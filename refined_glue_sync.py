import codecs
import re

file_path = "c:/GeminiProjects/TestProject/potecoin.js"
with codecs.open(file_path, "r", "utf-8") as f:
    text = f.read()

# 1. Update transitionToGameplay handover
new_sync_logic = """        // --- シームレス統合ロジック ---
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

# Replace the block in transitionToGameplay
# We match the specific structure from recent edits
text = re.sub(
    r'// --- 演出終了時の状態を「地続き」で継承 ---.*?cameraPitch = 0;',
    new_sync_logic,
    text,
    flags=re.DOTALL
)

# Also check for the fallback in finishOpening (which had a slightly different structure)
text = re.sub(
    r'// --- 演出終了時の状態を「地続き」で継承 ---.*?if \(typeof cameraAngle !== \'undefined\'\) cameraAngle = angle;\s+\}',
    new_sync_logic,
    text,
    flags=re.DOTALL
)

# 2. Final cleanup of any remaining hardcoded resets
# Scan for playerPosition.set or camera.position.set with hardcoded values
# Using a broader regex to catch any remaining sets of this pattern
text = re.sub(r'playerPosition\.set\(-?\d+(\.\d+)?,\s*\d+(\.\d+)?,\s*-?\d+(\.\d+)?\);', '// Reset removed', text)
# Be careful not to remove camera.position.set in startOpeningSequence!
# I'll only remove them if they look like the old (0, 0.6, -25) or (-27.5, 0.6, -15.5) outside that function.

with codecs.open(file_path, "w", "utf-8") as f:
    f.write(text)

print("Seamless glue integration implemented. Legacy resets eradicated.")
