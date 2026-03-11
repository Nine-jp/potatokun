import os
import re

file_path = "c:/GeminiProjects/TestProject/potecoin.js"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace OPENING_LINES timing values (to make the object logically match, though it's not strictly used in the loop)
content = content.replace("{ time: 0, text:", "{ time: 3000, text:")
content = content.replace("{ time: 4000, text:", "{ time: 5000, text:")
content = content.replace("{ time: 7000, text:", "{ time: 7500, text:")
# 10000 is already correct

# Replace camera keyframes
old_kf_pos = """        const kfPos = [
            { t: 0, p: new THREE.Vector3(-25.0, 15.0, -8.0) }, // 0.0s: 上空から
            { t: 3, p: new THREE.Vector3(-25.5, 0.6, -12.5) }, // 3.0s: 目線ローアングル (現在より50%ポテトくんに接近)
            { t: 8, p: new THREE.Vector3(-25.5, 0.6, -12.5) }, // 8.0s: 停止したまま
            { t: 11, p: new THREE.Vector3(-27.5, 0.6, -15.5) } // 11.0s: 新スポーン地点
        ];"""
        
new_kf_pos = """        const kfPos = [
            { t: 0, p: new THREE.Vector3(-25.0, 15.0, -8.0) }, // 0.0s: 上空から
            { t: 3, p: new THREE.Vector3(-25.5, 0.6, -12.5) }, // 3.0s: 目線ローアングル
            { t: 11, p: new THREE.Vector3(-25.5, 0.6, -12.5) }, // 11.0s: 停止したまま
            { t: 13, p: new THREE.Vector3(-27.5, 0.6, -15.5) } // 13.0s: 新スポーン地点
        ];"""

old_kf_look = """        const kfLook = [
            { t: 0, l: new THREE.Vector3(-26.5, 0.5, -14.0) },
            { t: 3, l: new THREE.Vector3(-27.5, 0.6, -16.0) },
            { t: 8, l: new THREE.Vector3(-27.5, 0.6, -16.0) },
            { t: 11, l: new THREE.Vector3(-28.0, 0.6, -18.0) }
        ];"""
        
new_kf_look = """        const kfLook = [
            { t: 0, l: new THREE.Vector3(-26.5, 0.5, -14.0) },
            { t: 3, l: new THREE.Vector3(-27.5, 0.6, -16.0) },
            { t: 11, l: new THREE.Vector3(-27.5, 0.6, -16.0) },
            { t: 13, l: new THREE.Vector3(-28.0, 0.6, -18.0) }
        ];"""

content = content.replace(old_kf_pos, new_kf_pos)
content = content.replace(old_kf_look, new_kf_look)

# Replace the UI Timeline loop
old_ui_timeline_pattern = r"            // --- UI タイムライン ---.*?            // --- カメラ タイムライン ---"

new_ui_timeline = """            // --- UI タイムライン ---
            // 0.0s 〜 3.0s: 導入（タイトルロゴ出）
            if (elapsed < 3.0) {
                if (timelineState === 0) {
                    if (titleEl) titleEl.style.opacity = '1';
                    timelineState = 1;
                }
            }
            // 3.0s 〜 5.0s: ロゴ消去＋ダイアログ1番目
            else if (elapsed >= 3.0 && elapsed < 5.0) {
                if (timelineState === 1) {
                    if (titleEl) titleEl.style.opacity = '0'; // ロゴ消去
                    showTapText(window.innerWidth / 2, window.innerHeight * 0.7, text0s, color0s);
                    timelineState = 2;
                }
            }
            // 5.0s 〜 7.5s: ダイアログ2番目
            else if (elapsed >= 5.0 && elapsed < 7.5) {
                if (timelineState === 2) {
                    showTapText(window.innerWidth / 2, window.innerHeight * 0.7, text4s, color4s);
                    timelineState = 3;
                }
            }
            // 7.5s 〜 10.0s: ダイアログ3番目
            else if (elapsed >= 7.5 && elapsed < 10.0) {
                if (timelineState === 3) {
                    showTapText(window.innerWidth / 2, window.innerHeight * 0.7, text7s, color7s);
                    timelineState = 4;
                }
            }
            // 10.0s 〜 11.0s: ダイアログ4番目
            else if (elapsed >= 10.0 && elapsed < 11.0) {
                if (timelineState === 4) {
                    showTapText(window.innerWidth / 2, window.innerHeight * 0.7, text10s, color10s);
                    timelineState = 5;
                }
            }
            // 11.0s 〜 13.0s: ダイアログ消去 (トランジション開始)
            else if (elapsed >= 11.0 && elapsed < 13.0) {
                if (timelineState === 5) {
                    const tapContainers = document.querySelectorAll('.sg-tap-text');
                    tapContainers.forEach(el => el.remove());
                    timelineState = 6;
                }
            }
            // 13.0s以降: 操作解禁・START
            else if (elapsed >= 13.0) {
                finishOpening();
                return;
            }

            // --- カメラ タイムライン ---"""

content = re.sub(old_ui_timeline_pattern, new_ui_timeline, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement Complete")
