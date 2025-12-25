import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// 3D Model Viewer
const init3DViewer = () => {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    // Background will be handled by CSS (Sky gradient)

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 4);
    camera.lookAt(0, 1, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Controls (OrbitControls)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Helpers
    // GridHelper(size, divisions, colorCenterLine, colorGrid)
    const gridHelper = new THREE.GridHelper(10, 10, 0xFF4500, 0x00AA00);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // Lighting - Christmas Spotlight Setup
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
    scene.add(ambientLight);

    // Spotlight A - Red Christmas light from 45° right side above
    const spotLight1 = new THREE.SpotLight(0xff3333, 6);
    spotLight1.position.set(5, 6, 0);
    spotLight1.angle = Math.PI / 5;
    spotLight1.penumbra = 0.3;
    spotLight1.decay = 2;
    spotLight1.distance = 20;
    spotLight1.castShadow = true;
    spotLight1.target.position.set(0, 1, 0);
    scene.add(spotLight1);
    scene.add(spotLight1.target);

    // Spotlight B - Green Christmas light from 45° left side above
    const spotLight2 = new THREE.SpotLight(0x33ff33, 6);
    spotLight2.position.set(-5, 6, 0);
    spotLight2.angle = Math.PI / 5;
    spotLight2.penumbra = 0.3;
    spotLight2.decay = 2;
    spotLight2.distance = 20;
    spotLight2.castShadow = true;
    spotLight2.target.position.set(0, 1, 0);
    scene.add(spotLight2);
    scene.add(spotLight2.target);

    // Fill light from front
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
    fillLight.position.set(0, 5, 10);
    scene.add(fillLight);

    // Animation variables
    let mixer;
    const clock = new THREE.Clock();
    let rightArmBone = null;
    let rightForeArmBone = null;
    let leftArmBone = null;

    // Load FBX Model
    const loader = new FBXLoader();
    loader.load('uma2025-6.fbx', (object) => {
        console.log('Model loaded:', object);

        // Traverse to find bones
        object.traverse((child) => {
            if (child.isBone) {
                const name = child.name.toLowerCase();
                console.log('Found bone:', child.name, '(lowercase:', name + ')');

                // Find Right Arm (Upper)
                if (!rightArmBone && (name === 'upper_armr' || name.includes('upper_armr') || name.includes('rightarm') || name.includes('arm_r'))) {
                    rightArmBone = child;
                    console.log('✓ Right Arm Bone set:', child.name);
                }

                // Find Right ForeArm (Lower)
                if (!rightForeArmBone && (name === 'lower_armr' || name.includes('lower_armr') || name.includes('rightforearm') || name.includes('forearm_r'))) {
                    rightForeArmBone = child;
                    console.log('✓ Right ForeArm Bone set:', child.name);
                }

                // Find Left Arm (Upper)
                if (!leftArmBone && (name === 'upper_arml' || name.includes('upper_arml') || name.includes('leftarm') || name.includes('arm_l'))) {
                    leftArmBone = child;
                    console.log('✓ Left Arm Bone set:', child.name);
                }
            }
        });

        // Setup Animation
        if (object.animations && object.animations.length > 0) {
            mixer = new THREE.AnimationMixer(object);
            const action = mixer.clipAction(object.animations[0]);
            action.play();
        }

        scene.add(object);

        // Scaling and Positioning
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const scale = 2 / maxDim;
            object.scale.setScalar(scale);
            const newBox = new THREE.Box3().setFromObject(object);
            const newSize = newBox.getSize(new THREE.Vector3());
            newBox.getCenter(center);
            object.position.sub(center);
            // Align feet (bottom) to -0.5 (Grid position)
            // Center is at 0, so bottom is at -size/2.
            // To move bottom to -0.5: Add size/2 to get to 0, then subtract 0.5.
            object.position.y += (newSize.y / 2) - 0.5;
        }

    }, (xhr) => {
        // Progress
    }, (error) => {
        console.error('An error happened loading the FBX:', error);
        container.innerHTML = `<p style="color:red; background:white; padding:10px; border-radius:5px;">モデルの読み込みに失敗しました。<br>${error.message}</p>`;
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update(); // Update controls

        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        if (mixer) mixer.update(delta);


        renderer.render(scene, camera);
    }

    animate();
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init3DViewer);
