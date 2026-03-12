import codecs
import re

file_path = "c:/GeminiProjects/TestProject/potecoin.js"
with codecs.open(file_path, "r", "utf-8") as f:
    text = f.read()

pattern = re.compile(r'(\s*// カメラ演出の刷新：1本のCatmullRomCurve3を使用\s+const TOTAL_DURATION =).*?(},\s*16\);)', re.DOTALL)

new_block = """        // カメラ演出の刷新：4点のペース制御付き CatmullRomCurve3
        const TOTAL_DURATION = 15.0; // 全体のベース尺（ダイアログ待ちで実時間は延びる）

        if (!window.masterOpeningCurve) {
            window.masterOpeningCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-25.0, 15.0, -8.0),   // P0: 空（開始地点）
                new THREE.Vector3(-26.5, 0.6, -16.5),   // P1: ポテトくん至近距離（セリフ用停止地点）
                new THREE.Vector3(-28.5, 0.8, -18.5),   // P2: 自販機正面（Uターンの頂点）
                new THREE.Vector3(-26.5, 1.3, -13.0)    // P3: ポテトくん正面（着地点）
            ]);
            window.masterOpeningCurve.curveType = 'centripetal';
        }

        const easeInOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
        const startTime = performance.now();
        let timelineState = 0; // 0:Intro, 1:Dialog, 2:Hide Dialog
        
        // ダイアログ管理フラグ
        let dialogsCompleted = false;

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
            else if (elapsed >= 11.0 && !dialogsCompleted) {
                if (timelineState === 5) {
                    const tapContainers = document.querySelectorAll('.sg-tap-text');
                    tapContainers.forEach(el => el.remove());
                    timelineState = 6;
                    dialogsCompleted = true; // ここで旋回フラグON
                }
            }

            // --- カメラ タイムライン (ペース制御付き) ---
            // 0.0~3.0s: 0%〜30% (降下: P0 => P1)
            // 3.0~11.0s: 30%〜30% (P1で完全停止してダイアログ待ち)
            // 11.0s以降: 30%〜100% (旋回〜着地: P1 => P2 => P3)
            
            let curveT = 0;
            if (elapsed < 3.0) {
                curveT = 0.3 * easeInOutSine(elapsed / 3.0);
            } else if (!dialogsCompleted) {
                curveT = 0.3; // 完全にP1で停止
            } else {
                // 11.0s を超えてダイアログが終わった後
                // 残り時間 (TOTAL_DURATION - 11.0 = 4.0秒) で 30% ~ 100% へ
                const remainElapsed = elapsed - 11.0;
                const remainDuration = TOTAL_DURATION - 11.0; 
                if (remainElapsed >= remainDuration) {
                    curveT = 1.0;
                } else {
                    const localT = easeInOutSine(remainElapsed / remainDuration);
                    curveT = 0.3 + (0.7 * localT);
                }
            }

            // 終了検知 (曲線の終端 P3(t=1.0) に達した時)
            if (curveT >= 1.0) {
                // セーフティ: ダイアログ消去漏れ対策
                if (timelineState < 6) {
                    const tapContainers = document.querySelectorAll('.sg-tap-text');
                    tapContainers.forEach(el => el.remove());
                    timelineState = 6;
                }
                finishOpening();
                return;
            }

            // 1. 曲線上の現在位置
            const curPos = window.masterOpeningCurve.getPoint(curveT);

            // 2. 視線（LookAt）の最適化
            // 進行方向の接線
            const tangent = window.masterOpeningCurve.getTangent(curveT);
            const tangentLook = curPos.clone().add(tangent.multiplyScalar(5)); 
            
            const potatoTarget = new THREE.Vector3(-26.5, 0.6, -14.0);

            let curLook = new THREE.Vector3();
            if (curveT <= 0.3) {
                // 降下・滞在中: ずっとポテトくんを見る
                curLook.copy(potatoTarget);
            } else {
                // 旋回中 (0.3 ~ 1.0): 進行方向(接線)とポテトくんを自然にブレンド
                // 最初は進行方向を向き、最後はポテトくんに視線を戻す
                const blendT = (curveT - 0.3) / 0.7; // 0.0 ~ 1.0 に正規化
                
                if (blendT < 0.8) {
                    // 旋回のメイン期間は進行方向（接線）を注視
                    curLook.lerpVectors(potatoTarget, tangentLook, easeInOutSine(blendT / 0.8));
                } else {
                    // 最後の着地直前でポテトくんに振り返る
                    curLook.lerpVectors(tangentLook, potatoTarget, easeInOutSine((blendT - 0.8) / 0.2));
                }
            }

            camera.position.copy(curPos);
            camera.lookAt(curLook);

        }, 16);"""

new_text = pattern.sub(" 15.0;" + new_block.split("TOTAL_DURATION = 15.0;")[1], text)

with codecs.open(file_path, "w", "utf-8") as f:
    f.write(new_text)

print("Opening pacing strictly synchronized to 0-30-80-100 logic.")
