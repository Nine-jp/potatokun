import codecs
import re

file_path = "c:/GeminiProjects/TestProject/potecoin.js"
with codecs.open(file_path, "r", "utf-8") as f:
    text = f.read()

pattern = re.compile(r'(\s*// カメラ演出の刷新：.*?)(},\s*16\);)', re.DOTALL)

new_block = """        // カメラ演出の刷新： CatmullRom曲線の完全自動化（kfPos配列連動）
        const kfPos = [
            { t: 0.0, p: new THREE.Vector3(-25, 15, -10) },
            { t: 3.0, p: new THREE.Vector3(-26.5, 0.6, -16.5) },
            { t: 11.0, p: new THREE.Vector3(-26.5, 0.6, -16.5) },
            { t: 12.5, p: new THREE.Vector3(-28.5, 0.8, -19.5) }, // 自販機の奥
            { t: 15.0, p: new THREE.Vector3(-33.0, 1.2, -15.0) }, // 外側旋回
            { t: 17.0, p: new THREE.Vector3(-26.5, 1.3, -12.5) }  // 着地
        ];

        const kfLook = [
            { t: 0.0, l: new THREE.Vector3(-26.5, 0.5, -14.0) },
            { t: 3.0, l: new THREE.Vector3(-26.5, 0.6, -14.0) },
            { t: 11.0, l: new THREE.Vector3(-26.5, 0.6, -14.0) },
            { t: 12.5, l: new THREE.Vector3(-28.5, 1.0, -19.5) },
            { t: 15.0, l: new THREE.Vector3(-31.0, 1.2, -17.0) },
            { t: 17.0, l: new THREE.Vector3(-26.5, 0.6, -18.0) }  // ポテトくん
        ];

        const lastTime = kfPos[kfPos.length - 1].t; // 動的に最終時間を取得

        if (!window.masterOpeningCurve) {
            window.masterOpeningCurve = new THREE.CatmullRomCurve3(kfPos.map(k => k.p));
            window.masterOpeningCurve.curveType = 'centripetal';
            
            window.masterLookCurve = new THREE.CatmullRomCurve3(kfLook.map(k => k.l));
            window.masterLookCurve.curveType = 'centripetal';
        }

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
            } else if (elapsed >= 11.0 && elapsed < lastTime) {
                if (timelineState === 5) {
                    const tapContainers = document.querySelectorAll('.sg-tap-text');
                    tapContainers.forEach(el => el.remove());
                    timelineState = 6;
                }
            } else if (elapsed >= lastTime) {
                // セーフティ: ダイアログ消去漏れ対策
                if (timelineState < 6) {
                    const tapContainers = document.querySelectorAll('.sg-tap-text');
                    tapContainers.forEach(el => el.remove());
                    timelineState = 6;
                }
                finishOpening();
                return;
            }

            // --- カメラ タイムライン (kfPosに合わせたCatmullRom進捗計算) ---
            let idx = 0;
            for (let i = 0; i < kfPos.length - 1; i++) {
                if (elapsed >= kfPos[i].t && elapsed <= kfPos[i + 1].t) {
                    idx = i; break;
                } else if (i === kfPos.length - 2 && elapsed > kfPos[i + 1].t) {
                    idx = i;
                }
            }

            let localT = 0;
            if (elapsed > kfPos[idx].t) {
                const segmentDuration = kfPos[idx + 1].t - kfPos[idx].t;
                localT = (elapsed - kfPos[idx].t) / segmentDuration;
                localT = Math.max(0, Math.min(1, localT));
                // 各区間でのイーズ
                localT = easeInOutSine(localT);
            }

            const curveSegments = kfPos.length - 1;
            const curveT = (idx + localT) / curveSegments;

            // カーブから現在の位置と注視点を取得
            const curPos = window.masterOpeningCurve.getPoint(curveT);
            const curLook = window.masterLookCurve.getPoint(curveT);

            camera.position.copy(curPos);
            camera.lookAt(curLook);

        }, 16);"""

new_text = pattern.sub(new_block, text)

with codecs.open(file_path, "w", "utf-8") as f:
    f.write(new_text)

print("TOTAL_DURATION eliminated. Segment math fully rebuilt. 17s U-Turn applied.")
