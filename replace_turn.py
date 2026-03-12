import codecs

file_path = "c:/GeminiProjects/TestProject/potecoin.js"
with codecs.open(file_path, "r", "utf-8") as f:
    text = f.read()

# Update 1: Camera animation block
old_cam = """            // --- カメラ タイムライン ---
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
            const curPos = new THREE.Vector3().lerpVectors(kfPos[idx].p, kfPos[idx + 1].p, easedT);
            const curLook = new THREE.Vector3().lerpVectors(kfLook[idx].l, kfLook[idx + 1].l, easedT);

            camera.position.copy(curPos);
            camera.lookAt(curLook);"""

new_cam = """            // --- カメラ タイムライン ---
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

text = text.replace(old_cam, new_cam)

# Update 2: Skip Opening block coordinates
old_skip = """                if (typeof playerPosition !== 'undefined') {
                    // ★修正: 自販機前のポテトくん付近へ
                    playerPosition.set(-27.5, 0.6, -15.5);

                    if (typeof playerFacing !== 'undefined') playerFacing = Math.atan2(-28.0 - (-27.5), -18.0 - (-15.5));

                    if (typeof cameraAngle !== 'undefined') cameraAngle = Math.atan2(-28.0 - (-27.5), -18.0 - (-15.5));
                }"""
                
new_skip = """                if (typeof playerPosition !== 'undefined') {
                    // ★修正: ダイナミックターン後の着地点（ポテト正面）へ
                    playerPosition.set(-28.0, 0.6, -11.5);

                    if (typeof playerFacing !== 'undefined') playerFacing = Math.atan2(-26.5 - (-28.0), -14.0 - (-11.5));

                    if (typeof cameraAngle !== 'undefined') cameraAngle = Math.atan2(-26.5 - (-28.0), -14.0 - (-11.5));
                }"""

text = text.replace(old_skip, new_skip)

# Update 3: Fallback UI coordinates
old_base = "if (typeof playerPosition !== 'undefined') playerPosition.set(-27.5, 0.6, -15.5);"

new_base = """if (typeof playerPosition !== 'undefined') {
                playerPosition.set(-28.0, 0.6, -11.5);
                if (typeof playerFacing !== 'undefined') playerFacing = Math.atan2(-26.5 - (-28.0), -14.0 - (-11.5));
                if (typeof cameraAngle !== 'undefined') cameraAngle = Math.atan2(-26.5 - (-28.0), -14.0 - (-11.5));
            }"""

text = text.replace(old_base, new_base)

with codecs.open(file_path, "w", "utf-8") as f:
    f.write(text)

print("Dynamic Turn Updated.")
