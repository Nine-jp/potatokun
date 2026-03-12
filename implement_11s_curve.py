import codecs
import re

file_path = "c:/GeminiProjects/TestProject/potecoin.js"
with codecs.open(file_path, "r", "utf-8") as f:
    text = f.read()

# 1. Update finishOpening coordinates for seamless transition
# Search for: if (typeof playerPosition !== 'undefined') playerPosition.set(-27.5, 0.6, -15.5);
# Target lookAt: (0, 0.6, 31) from landing (-27.5, 0.6, -15.5)
# angle = Math.atan2(0 - (-27.5), 31 - (-15.5))

new_spawn_logic = """            if (typeof playerPosition !== 'undefined') {
                playerPosition.set(-27.5, 0.6, -15.5);
                const targetLook = new THREE.Vector3(0, 0.6, 31);
                const angle = Math.atan2(targetLook.x - playerPosition.x, targetLook.z - playerPosition.z);
                if (typeof playerFacing !== 'undefined') playerFacing = angle;
                if (typeof cameraAngle !== 'undefined') cameraAngle = angle;
            }"""

# Use regex to find and replace the spawn logic in finishOpening
text = re.sub(r'if \(typeof playerPosition !== \'undefined\'\) playerPosition\.set\(-27\.5, 0\.6, -15\.5\);', new_spawn_logic, text)

# 2. Overhaul startOpeningSequence camera loop and keyframes
# Replace from camera keyframes definition to the end of the interval loop

camera_refactor_pattern = re.compile(r'(\s*// カメラキーフレーム定義\s+const kfPos = \[).*?(\}, 16\);)', re.DOTALL)

curve_logic = """        // 根本刷新：CatmullRomCurve3 による曲線軌道
        const camPoints = [
            new THREE.Vector3(-25.0, 15.0, -8.0), // 0s: 上空
            new THREE.Vector3(-25.5, 0.6, -12.5), // 3s: 接近
            new THREE.Vector3(-25.5, 0.6, -12.5), // 8s: 停止
            new THREE.Vector3(-29.5, 0.6, -16.5), // 9.5s: 回避
            new THREE.Vector3(-27.5, 0.6, -15.5)  // 11s: 到着
        ];
        const camCurve = new THREE.CatmullRomCurve3(camPoints);

        const lookPoints = [
            new THREE.Vector3(-26.5, 0.5, -14.0), // 初期
            new THREE.Vector3(-27.5, 0.6, -16.0), // ポテトくん
            new THREE.Vector3(0, 0.6, 31)         // 最終
        ];
        const lookCurve = new THREE.CatmullRomCurve3(lookPoints);

        const easeInOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
        const startTime = performance.now();
        let timelineState = 0; // 0:Intro, 1:Dialog, 2:Hide Dialog

        const lines = OPENING_LINES[GameConfig.currentSeason];

        // 各時間のダイアログ内容を取得
        const text0s = lines && lines.length > 0 ? lines[0].text : 'ポテトくん「……さ、寒い。温かい飲み物が〜」';
        const color0s = lines && lines.length > 0 ? lines[0].color : '#B0E0E6';
        const text4s = lines && lines.length > 1 ? lines[1].text : 'おや？ ポテトくんが困っているようだ...';
        const color4s = lines && lines.length > 1 ? lines[1].color : '#FFFFFF';
        const text7s = lines && lines.length > 2 ? lines[2].text : 'こんな寒さじゃ、凍えちゃうね...';
        const color7s = lines && lines.length > 2 ? lines[2].color : '#FFFFFF';
        const text10s = lines && lines.length > 3 ? lines[3].text : 'よし！ コインを集めてジュースを買ってあげよう！';
        const color10s = lines && lines.length > 3 ? lines[3].color : '#FFFFFF';

        // アニメーションループ (タイムライン制御)
        if (openingInterval) clearInterval(openingInterval);
        openingInterval = setInterval(() => {
            if (currentState !== GameState.OPENING) return;
            updateSeasonEffects();

            const elapsed = (performance.now() - startTime) / 1000.0;

            // --- UI タイムライン ---
            if (elapsed < 3.0) {
                if (timelineState === 0) {
                    if (titleEl) titleEl.style.opacity = '1';
                    timelineState = 1;
                }
            } else if (elapsed >= 3.0 && elapsed < 5.0) {
                if (timelineState === 1) {
                    if (titleEl) titleEl.style.opacity = '0';
                    showTapText(window.innerWidth / 2, window.innerHeight * 0.7, text0s, color0s);
                    timelineState = 2;
                }
            } else if (elapsed >= 5.0 && elapsed < 7.5) {
                if (timelineState === 2) {
                    showTapText(window.innerWidth / 2, window.innerHeight * 0.7, text4s, color4s);
                    timelineState = 3;
                }
            } else if (elapsed >= 7.5 && elapsed < 10.0) {
                if (timelineState === 3) {
                    showTapText(window.innerWidth / 2, window.innerHeight * 0.7, text7s, color7s);
                    timelineState = 4;
                }
            } else if (elapsed >= 10.0 && elapsed < 11.0) {
                if (timelineState === 4) {
                    showTapText(window.innerWidth / 2, window.innerHeight * 0.7, text10s, color10s);
                    timelineState = 5;
                }
            } else if (elapsed >= 11.0) {
                if (timelineState === 5) {
                    const tapContainers = document.querySelectorAll('.sg-tap-text');
                    tapContainers.forEach(el => el.remove());
                    timelineState = 6;
                }
                finishOpening();
                return;
            }

            // --- カメラ タイムライン (CatmullRomCurve3) ---
            const progress = Math.min(elapsed / 11.0, 1.0);
            const easedT = easeInOutSine(progress);
            
            const curPos = camCurve.getPoint(easedT);
            const curLook = lookCurve.getPoint(easedT);

            camera.position.copy(curPos);
            camera.lookAt(curLook);

        }, 16);"""

text = camera_refactor_pattern.sub(curve_logic, text)

with codecs.open(file_path, "w", "utf-8") as f:
    f.write(text)

print("Opening sequence overhauled to CatmullRomCurve3 (11s).")
