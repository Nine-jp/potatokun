import codecs
import re

file_path = "c:/GeminiProjects/TestProject/potecoin.js"
with codecs.open(file_path, "r", "utf-8") as f:
    text = f.read()

# Replace kfPos
old_kf_pos = """        const kfPos = [
            { t: 0, p: new THREE.Vector3(-25.0, 15.0, -8.0) }, // 0.0s: 上空から
            { t: 3, p: new THREE.Vector3(-25.5, 0.6, -12.5) }, // 3.0s: 目線ローアングル
            { t: 11, p: new THREE.Vector3(-25.5, 0.6, -12.5) }, // 11.0s: 停止したまま
            { t: 13, p: new THREE.Vector3(-27.5, 0.6, -15.5) } // 13.0s: 新スポーン地点
        ];"""
        
new_kf_pos = """        const kfPos = [
            { t: 0.0, p: new THREE.Vector3(-25, 15, -10) },
            { t: 3.0, p: new THREE.Vector3(-26.5, 0.6, -16.5) },
            { t: 11.0, p: new THREE.Vector3(-26.5, 0.6, -16.5) },
            // ▼ ここからUターン軌道を追加
            { t: 11.8, p: new THREE.Vector3(-28.0, 0.8, -17.5) }, // 自販機正面へグッと踏み込む
            { t: 12.4, p: new THREE.Vector3(-30.0, 1.1, -15.0) }, // 左へ大きく回り込む
            { t: 13.0, p: new THREE.Vector3(-26.5, 1.3, -12.0) }  // ポテトくんを正面に捉える着地点
        ];"""

# Replace kfLook
old_kf_look = """        const kfLook = [
            { t: 0, l: new THREE.Vector3(-26.5, 0.5, -14.0) },
            { t: 3, l: new THREE.Vector3(-27.5, 0.6, -16.0) },
            { t: 11, l: new THREE.Vector3(-27.5, 0.6, -16.0) },
            { t: 13, l: new THREE.Vector3(-28.0, 0.6, -18.0) }
        ];"""

new_kf_look = """        const kfLook = [
            { t: 0.0, l: new THREE.Vector3(-26.5, 0.6, -18.0) },
            { t: 3.0, l: new THREE.Vector3(-26.5, 0.6, -18.0) },
            { t: 11.0, l: new THREE.Vector3(-26.5, 0.6, -18.0) },
            { t: 11.8, l: new THREE.Vector3(-28.0, 1.0, -18.0) }, // 自販機のボタン付近を凝視
            { t: 13.0, l: new THREE.Vector3(-26.5, 0.6, -18.0) }  // 最後はポテトくんをしっかり見る
        ];"""

text = text.replace(old_kf_pos, new_kf_pos)
text = text.replace(old_kf_look, new_kf_look)


# Replace Camera Timeline loop to dynamically evaluate CatmullRom Curve via time indexing
old_cam_loop = """            // --- カメラ タイムライン ---
            let curPos = new THREE.Vector3();
            let curLook = new THREE.Vector3();

            if (elapsed < 11.0) {
                // 0.0s - 11.0s: Standard Linear Interpolation
                let idx = 0;
                for (let i = 0; i < kfPos.length - 1; i++) {
                    if (elapsed >= kfPos[i].t && elapsed <= kfPos[i + 1].t) {
                        idx = i; break;
                    } else if (i === kfPos.length - 2 && elapsed > kfPos[i + 1].t) {
                        idx = i;
                    }
                }
                let t = 0;
                if (elapsed > kfPos[idx].t) {
                    t = (elapsed - kfPos[idx].t) / (kfPos[idx + 1].t - kfPos[idx].t);
                    t = Math.max(0, Math.min(1, t));
                }
                const easedT = easeInOutSine(t);
                curPos.lerpVectors(kfPos[idx].p, kfPos[idx + 1].p, easedT);
                curLook.lerpVectors(kfLook[idx].l, kfLook[idx + 1].l, easedT);
            } else {
                // 11.0s - 13.0s: Dynamic U-Turn
                // Normalize elapsed time to 0.0 ~ 1.0 (2 seconds total)
                const rawT = Math.max(0, Math.min(1, (elapsed - 11.0) / 2.0));
                const turnT = easeInOutSine(rawT);
                
                // Lazy initialize the curves (ensures Three.js CatmullRomCurve3 is only created once)
                if (!window.turnCurvePos) {
                    window.turnCurvePos = new THREE.CatmullRomCurve3([
                        new THREE.Vector3(-25.5, 0.6, -12.5),  // 11.0s: Start (End of Phase 2)
                        new THREE.Vector3(-27.8, 0.6, -17.5),  // 11.8s: Approach VM
                        new THREE.Vector3(-30.5, 0.6, -14.5),  // 12.4s: Swing wide
                        new THREE.Vector3(-28.0, 0.6, -11.5)   // 13.0s: Final Landing Front of Potato
                    ]);

                    window.turnCurveLook = new THREE.CatmullRomCurve3([
                        new THREE.Vector3(-27.5, 0.6, -16.0), // 11.0s: Look at potato
                        new THREE.Vector3(-28.0, 1.0, -18.0), // 11.8s: Look at VM
                        new THREE.Vector3(-26.5, 0.5, -14.0), // 12.4s: Look back at potato
                        new THREE.Vector3(-26.5, 0.5, -14.0)  // 13.0s: Final look at potato
                    ]);
                }
                
                curPos = window.turnCurvePos.getPoint(turnT);
                curLook = window.turnCurveLook.getPoint(turnT);
            }

            camera.position.copy(curPos);
            camera.lookAt(curLook);"""

new_cam_loop = """            // --- カメラ タイムライン ---
            let curPos = new THREE.Vector3();
            let curLook = new THREE.Vector3();

            if (elapsed < 11.0) {
                // 0.0s - 11.0s: Standard Linear Interpolation
                let idx = 0;
                for (let i = 0; i < kfPos.length - 1; i++) {
                    if (elapsed >= kfPos[i].t && elapsed <= kfPos[i + 1].t) {
                        idx = i; break;
                    } else if (i === kfPos.length - 2 && elapsed > kfPos[i + 1].t) {
                        idx = i;
                    }
                }
                let t = 0;
                if (elapsed > kfPos[idx].t) {
                    t = (elapsed - kfPos[idx].t) / (kfPos[idx + 1].t - kfPos[idx].t);
                    t = Math.max(0, Math.min(1, t));
                }
                const easedT = easeInOutSine(t);
                curPos.lerpVectors(kfPos[idx].p, kfPos[idx + 1].p, easedT);
                
                // For LookAt
                let lIdx = 0;
                for (let i = 0; i < kfLook.length - 1; i++) {
                    if (elapsed >= kfLook[i].t && elapsed <= kfLook[i + 1].t) {
                        lIdx = i; break;
                    } else if (i === kfLook.length - 2 && elapsed > kfLook[i + 1].t) {
                        lIdx = i;
                    }
                }
                let lT = 0;
                if (elapsed > kfLook[lIdx].t) {
                    lT = (elapsed - kfLook[lIdx].t) / (kfLook[lIdx + 1].t - kfLook[lIdx].t);
                    lT = Math.max(0, Math.min(1, lT));
                }
                const easedLT = easeInOutSine(lT);
                curLook.lerpVectors(kfLook[lIdx].l, kfLook[lIdx + 1].l, easedLT);

            } else {
                // 11.0s - 13.0s: Dynamic U-Turn using dynamically built CatmullRomCurve3
                if (!window.turnCurvePos) {
                    // 11秒以降のすべての位置を取得
                    const ptsPos = kfPos.filter(k => k.t >= 11.0).map(k => k.p);
                    window.turnCurvePos = new THREE.CatmullRomCurve3(ptsPos);
                    window.turnCurvePos.curveType = 'centripetal'; // より滑らかな補間

                    const ptsLook = kfLook.filter(k => k.t >= 11.0).map(k => k.l);
                    window.turnCurveLook = new THREE.CatmullRomCurve3(ptsLook);
                    window.turnCurveLook.curveType = 'centripetal';
                }
                
                // 時間を0.0 ~ 1.0に正規化し、イーズ関数を適用
                const rawT = Math.max(0, Math.min(1, (elapsed - 11.0) / 2.0));
                const turnT = easeInOutSine(rawT);
                
                curPos = window.turnCurvePos.getPoint(turnT);
                curLook = window.turnCurveLook.getPoint(turnT);
            }

            camera.position.copy(curPos);
            camera.lookAt(curLook);"""

text = text.replace(old_cam_loop, new_cam_loop)

# Update Skip logic coordinates to (-26.5, 1.3, -12.0)
old_skip = """                if (typeof playerPosition !== 'undefined') {
                    // ★修正: ダイナミックターン後の着地点（ポテト正面）へ
                    playerPosition.set(-28.0, 0.6, -11.5);

                    if (typeof playerFacing !== 'undefined') playerFacing = Math.atan2(-26.5 - (-28.0), -14.0 - (-11.5));

                    if (typeof cameraAngle !== 'undefined') cameraAngle = Math.atan2(-26.5 - (-28.0), -14.0 - (-11.5));
                }"""

new_skip = """                if (typeof playerPosition !== 'undefined') {
                    // ★修正: ダイナミックターン後の着地点（ポテト正面）へ
                    playerPosition.set(-26.5, 1.3, -12.0);

                    // 初期視点: -26.5, 0.6, -18.0 (最後のkfLook注視点)
                    if (typeof playerFacing !== 'undefined') playerFacing = Math.atan2(-26.5 - (-26.5), -18.0 - (-12.0));

                    if (typeof cameraAngle !== 'undefined') cameraAngle = Math.atan2(-26.5 - (-26.5), -18.0 - (-12.0));
                }"""
text = text.replace(old_skip, new_skip)

old_base_ui = "playerPosition.set(-28.0, 0.6, -11.5);\n                if (typeof playerFacing !== 'undefined') playerFacing = Math.atan2(-26.5 - (-28.0), -14.0 - (-11.5));\n                if (typeof cameraAngle !== 'undefined') cameraAngle = Math.atan2(-26.5 - (-28.0), -14.0 - (-11.5));"
new_base_ui = "playerPosition.set(-26.5, 1.3, -12.0);\n                if (typeof playerFacing !== 'undefined') playerFacing = Math.atan2(-26.5 - (-26.5), -18.0 - (-12.0));\n                if (typeof cameraAngle !== 'undefined') cameraAngle = Math.atan2(-26.5 - (-26.5), -18.0 - (-12.0));"
text = text.replace(old_base_ui, new_base_ui)

with codecs.open(file_path, "w", "utf-8") as f:
    f.write(text)

print("Keyframes explicitly set.")
