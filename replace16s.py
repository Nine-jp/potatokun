import codecs

file_path = "c:/GeminiProjects/TestProject/potecoin.js"
with codecs.open(file_path, "r", "utf-8") as f:
    text = f.read()

# 1. kfPos
old_pos = """        const kfPos = [
            { t: 0.0, p: new THREE.Vector3(-25, 15, -10) },
            { t: 3.0, p: new THREE.Vector3(-26.5, 0.6, -16.5) },
            { t: 11.0, p: new THREE.Vector3(-26.5, 0.6, -16.5) },
            // ▼ ここからUターン軌道を追加
            { t: 11.8, p: new THREE.Vector3(-28.0, 0.8, -17.5) }, // 自販機正面へグッと踏み込む
            { t: 12.4, p: new THREE.Vector3(-30.0, 1.1, -15.0) }, // 左へ大きく回り込む
            { t: 13.0, p: new THREE.Vector3(-26.5, 1.3, -12.0) }  // ポテトくんを正面に捉える着地点
        ];"""
        
new_pos = """        const kfPos = [
            { t: 0.0, p: new THREE.Vector3(-25, 15, -10) },
            { t: 3.0, p: new THREE.Vector3(-26.5, 0.6, -16.5) },
            { t: 11.0, p: new THREE.Vector3(-26.5, 0.6, -16.5) },
            { t: 12.5, p: new THREE.Vector3(-28.5, 0.8, -18.5) }, // 自販機正面へグッと踏み込む
            { t: 14.5, p: new THREE.Vector3(-31.0, 1.1, -16.0) }, // 左へ大きく回り込む
            { t: 16.5, p: new THREE.Vector3(-26.5, 1.3, -13.0) }  // ポテトくん正面へ着地（最終地点）
        ];"""
text = text.replace(old_pos, new_pos)

# 2. kfLook
old_look = """        const kfLook = [
            { t: 0.0, l: new THREE.Vector3(-26.5, 0.6, -18.0) },
            { t: 3.0, l: new THREE.Vector3(-26.5, 0.6, -18.0) },
            { t: 11.0, l: new THREE.Vector3(-26.5, 0.6, -18.0) },
            { t: 11.8, l: new THREE.Vector3(-28.0, 1.0, -18.0) }, // 自販機のボタン付近を凝視
            { t: 13.0, l: new THREE.Vector3(-26.5, 0.6, -18.0) }  // 最後はポテトくんをしっかり見る
        ];"""

new_look = """        const kfLook = [
            { t: 0.0, l: new THREE.Vector3(-26.5, 0.6, -18.0) },
            { t: 11.0, l: new THREE.Vector3(-26.5, 0.6, -18.0) },
            { t: 12.5, l: new THREE.Vector3(-28.5, 1.0, -18.0) }, // 自販機のボタンを見る
            { t: 16.5, l: new THREE.Vector3(-26.5, 0.6, -18.0) }  // 最後はポテトくんを正面に捉える
        ];"""
text = text.replace(old_look, new_look)

# 3. and 4. UI Transition Timing and Finish Opening Timing
old_timing_finish = """            // 11.0s 〜 13.0s: ダイアログ消去 (トランジション開始)
            else if (elapsed >= 11.0 && elapsed < 13.0) {
                if (timelineState === 5) {
                    const tapContainers = document.querySelectorAll('.sg-tap-text');
                    tapContainers.forEach(el => el.remove());
                    timelineState = 6;
                }
            }
            // 13.0s以降: 操作解禁・START
            else if (elapsed >= 13.0) {"""

new_timing_finish = """            // 11.0s 〜 : ダイアログ消去 (トランジション開始)
            else if (elapsed >= 11.0 && elapsed < kfPos[kfPos.length - 1].t) {
                if (timelineState === 5) {
                    const tapContainers = document.querySelectorAll('.sg-tap-text');
                    tapContainers.forEach(el => el.remove());
                    timelineState = 6;
                }
            }
            // 最終キーフレーム到達以降: 操作解禁・START
            else if (elapsed >= kfPos[kfPos.length - 1].t) {"""
text = text.replace(old_timing_finish, new_timing_finish)

# 5. RawT normalizer
old_raw_t = """                // 時間を0.0 ~ 1.0に正規化し、イーズ関数を適用
                const rawT = Math.max(0, Math.min(1, (elapsed - 11.0) / 2.0));"""
                
new_raw_t = """                // 時間を0.0 ~ 1.0に正規化し、イーズ関数を適用
                const turnDuration = kfPos[kfPos.length - 1].t - 11.0;
                const rawT = Math.max(0, Math.min(1, (elapsed - 11.0) / turnDuration));"""
text = text.replace(old_raw_t, new_raw_t)

# 6. Base / Skip Coordinates
old_spawn_1 = """                if (typeof playerPosition !== 'undefined') {
                    // ★修正: ダイナミックターン後の着地点（ポテト正面）へ
                    playerPosition.set(-26.5, 1.3, -12.0);

                    // 初期視点: -26.5, 0.6, -18.0 (最後のkfLook注視点)
                    if (typeof playerFacing !== 'undefined') playerFacing = Math.atan2(-26.5 - (-26.5), -18.0 - (-12.0));

                    if (typeof cameraAngle !== 'undefined') cameraAngle = Math.atan2(-26.5 - (-26.5), -18.0 - (-12.0));
                }"""
                
new_spawn_1 = """                if (typeof playerPosition !== 'undefined') {
                    // ★修正: ダイナミックターン後の着地点（ポテト正面）へ
                    playerPosition.set(-26.5, 1.3, -13.0);

                    // 初期視点: -26.5, 0.6, -18.0 (最後のkfLook注視点)
                    if (typeof playerFacing !== 'undefined') playerFacing = Math.atan2(-26.5 - (-26.5), -18.0 - (-13.0));

                    if (typeof cameraAngle !== 'undefined') cameraAngle = Math.atan2(-26.5 - (-26.5), -18.0 - (-13.0));
                }"""
text = text.replace(old_spawn_1, new_spawn_1)

old_spawn_2 = """                playerPosition.set(-26.5, 1.3, -12.0);
                if (typeof playerFacing !== 'undefined') playerFacing = Math.atan2(-26.5 - (-26.5), -18.0 - (-12.0));
                if (typeof cameraAngle !== 'undefined') cameraAngle = Math.atan2(-26.5 - (-26.5), -18.0 - (-12.0));"""

new_spawn_2 = """                playerPosition.set(-26.5, 1.3, -13.0);
                if (typeof playerFacing !== 'undefined') playerFacing = Math.atan2(-26.5 - (-26.5), -18.0 - (-13.0));
                if (typeof cameraAngle !== 'undefined') cameraAngle = Math.atan2(-26.5 - (-26.5), -18.0 - (-13.0));"""
text = text.replace(old_spawn_2, new_spawn_2)

with codecs.open(file_path, "w", "utf-8") as f:
    f.write(text)

print("Updated 16.5s implementation.")
