import codecs
import re

file_path = "c:/GeminiProjects/TestProject/potecoin.js"
with codecs.open(file_path, "r", "utf-8") as f:
    text = f.read()

# We want to replace the sequence starting from "// カメラキーフレーム定義" up to "}, 16);"
# We will use regex to find this block.

pattern = re.compile(r'(\s*// カメラキーフレーム定義\s+const kfPos = \[).*?(},\s*16\);)', re.DOTALL)

new_block = """        // カメラ演出の刷新：1本のCatmullRomCurve3を使用
        const TOTAL_DURATION = 16.5; // 総演出時間

        if (!window.masterOpeningCurve) {
            window.masterOpeningCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-25.0, 15.0, -8.0),   // 点A: 空
                new THREE.Vector3(-28.5, 0.8, -18.5),   // 点B: 自販機正面（至近距離）
                new THREE.Vector3(-26.5, 1.3, -13.0)    // 点C: 旋回後のポテトくん正面
            ]);
            window.masterOpeningCurve.curveType = 'centripetal';
        }

        const easeInOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
        const startTime = performance.now();
        let timelineState = 0; // 0:Intro, 1:Dialog, 2:Hide Dialog

        const lines = OPENING_LINES[GameConfig.currentSeason];

        // 各時間のダイアログ内容を取得（存在しない場合のフォールバック含む）
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
            // 11.0s 〜 : ダイアログ消去 (トランジション開始)
            else if (elapsed >= 11.0 && elapsed < TOTAL_DURATION) {
                if (timelineState === 5) {
                    const tapContainers = document.querySelectorAll('.sg-tap-text');
                    tapContainers.forEach(el => el.remove());
                    timelineState = 6;
                }
            }
            // 終了検知 (進捗が1.0に達した、あるいは全ダイアログ完了後の最終座標到達)
            else if (elapsed >= TOTAL_DURATION) {
                // セーフティ: ダイアログ消去漏れ対策
                if (timelineState < 6) {
                    const tapContainers = document.querySelectorAll('.sg-tap-text');
                    tapContainers.forEach(el => el.remove());
                    timelineState = 6;
                }
                finishOpening();
                return;
            }

            // --- カメラ タイムライン (根本刷新) ---
            const rawT = Math.max(0, Math.min(1, elapsed / TOTAL_DURATION));
            const easedT = easeInOutSine(rawT);

            // 1. 曲線上の現在位置
            const curPos = window.masterOpeningCurve.getPoint(easedT);

            // 2. 「注視点固定」の解除と自動化 (進行方向 vs 各ターゲットのブレンド)
            const tangent = window.masterOpeningCurve.getTangent(easedT);
            const tangentLook = curPos.clone().add(tangent.multiplyScalar(5)); // 進行方向
            
            const potatoTarget = new THREE.Vector3(-26.5, 0.6, -14.0); // ポテトくん
            const vmTarget = new THREE.Vector3(-28.5, 1.0, -18.5); // 自販機

            let curLook = new THREE.Vector3();
            // easedT (0.0~1.0) の進行に合わせて注視点をリレーブレンド
            if (easedT < 0.4) {
                // 導入〜自販機接近: ポテトくん -> 自販機
                const w = easeInOutSine(easedT / 0.4);
                curLook.lerpVectors(potatoTarget, vmTarget, w);
            } else if (easedT < 0.7) {
                // 旋回中: 自販機 -> 進行方向(接線)
                const w = easeInOutSine((easedT - 0.4) / 0.3);
                curLook.lerpVectors(vmTarget, tangentLook, w);
            } else {
                // 着地: 進行方向(接線) -> ポテトくん
                const w = easeInOutSine((easedT - 0.7) / 0.3);
                curLook.lerpVectors(tangentLook, potatoTarget, w);
            }

            camera.position.copy(curPos);
            camera.lookAt(curLook);

        }, 16);"""

new_text = pattern.sub(new_block, text)

with codecs.open(file_path, "w", "utf-8") as f:
    f.write(new_text)

print("Opening camera logic completely overhauled to a unified CatmullRomCurve3.")
