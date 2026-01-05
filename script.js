import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || !href.startsWith('#')) return; // Ignore non-internal links

        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
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

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 4);
    camera.lookAt(0, 1, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace; // Crucial for vivid colors
    container.appendChild(renderer.domElement);

    // Controls (OrbitControls)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;
    controls.minDistance = 2;
    controls.maxDistance = 6;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 1.5;

    // Theme detection
    const isNewYear = document.body.classList.contains('theme-newyear');

    // Grid Helpers
    const gridColorNormal = isNewYear ? 0xD4AF37 : 0x000000;
    const gridColorCenter = isNewYear ? 0xB22222 : 0xFF0000;
    const gridHelper = new THREE.GridHelper(10, 10, gridColorCenter, gridColorNormal);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // Lighting
    // Soft global light (Hemisphere) - significantly brightens without glare
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const ambientColor = isNewYear ? 0xFFFBE6 : 0x404040;
    const ambientLight = new THREE.AmbientLight(ambientColor, 0.5); // Reduced ambient intensity as Hemi handles base brightness
    scene.add(ambientLight);

    const spotColor1 = isNewYear ? 0xFFD700 : 0xff3333;
    const spotLight1 = new THREE.SpotLight(spotColor1, isNewYear ? 8 : 6);
    spotLight1.position.set(5, 6, 0);
    spotLight1.angle = Math.PI / 5;
    spotLight1.penumbra = 0.3;
    spotLight1.decay = 2;
    spotLight1.distance = 20;
    spotLight1.castShadow = true;
    spotLight1.target.position.set(0, 1, 0);
    scene.add(spotLight1);
    scene.add(spotLight1.target);

    const spotColor2 = isNewYear ? 0xB22222 : 0x33ff33;
    const spotLight2 = new THREE.SpotLight(spotColor2, isNewYear ? 8 : 6);
    spotLight2.position.set(-5, 6, 0);
    spotLight2.angle = Math.PI / 5;
    spotLight2.penumbra = 0.3;
    spotLight2.decay = 2;
    spotLight2.distance = 20;
    spotLight2.castShadow = true;
    spotLight2.target.position.set(0, 1, 0);
    scene.add(spotLight2);
    scene.add(spotLight2.target);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5); // Reduced intensity to prevent blowout
    fillLight.position.set(0, 5, 10);
    scene.add(fillLight);

    // Front Light (Targeted at model visibility)
    const frontLight = new THREE.DirectionalLight(0xffffff, 1.0); // Boosted for brightness without emissive
    frontLight.position.set(0, 2, 5);
    scene.add(frontLight);

    // Animation variables
    let mixer;
    const clock = new THREE.Clock();
    let rightArmBone = null;
    let rightForeArmBone = null;
    let leftArmBone = null;
    let currentObject = null;

    // Model Configuration
    const models = [
        { file: "ポテトくん(通常).fbx" },
        { file: "ポテトくん(2026年午年).fbx" }
    ];

    // Populate dropdown
    const modelSelect = document.getElementById('model-select');
    if (modelSelect) {
        models.forEach((m, index) => {
            const opt = document.createElement('option');
            opt.value = index;
            const displayName = m.file.split('.')[0];
            opt.textContent = displayName;
            if (m.file === (isNewYear ? 'ポテトくん(2026年午年).fbx' : 'ポテトくん(通常).fbx')) opt.selected = true;
            modelSelect.appendChild(opt);
        });

        modelSelect.addEventListener('change', (e) => {
            const config = models[e.target.value];
            if (config) {
                loadModel(`models/${encodeURIComponent(config.file)}`);
            }
        });
    }

    // Load FBX Model Function
    const loader = new FBXLoader();
    const loadModel = (fullPath) => {
        if (currentObject) {
            scene.remove(currentObject);
        }

        rightArmBone = null;
        rightForeArmBone = null;
        leftArmBone = null;
        mixer = null;

        loader.load(fullPath, (object) => {
            console.log('Model loaded:', fullPath);
            currentObject = object;

            // Traverse to find bones
            object.traverse((child) => {
                if (child.isBone) {
                    const name = child.name.toLowerCase();
                    if (!rightArmBone && (name === 'upper_armr' || name.includes('upper_armr') || name.includes('rightarm') || name.includes('arm_r'))) rightArmBone = child;
                    if (!rightForeArmBone && (name === 'lower_armr' || name.includes('lower_armr') || name.includes('rightforearm') || name.includes('forearm_r'))) rightForeArmBone = child;
                    if (!leftArmBone && (name === 'upper_arml' || name.includes('upper_arml') || name.includes('leftarm') || name.includes('arm_l'))) leftArmBone = child;
                }

                // Material fix for dark models
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // Removed manual emissive boost to preserve vivid texture colors
                }
            });

            if (object.animations && object.animations.length > 0) {
                mixer = new THREE.AnimationMixer(object);
                const action = mixer.clipAction(object.animations[0]);
                action.play();
            }

            scene.add(object);

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
                object.position.y += (newSize.y / 2) - 0.5;
            }
        }, (xhr) => {
            // Progress
        }, (error) => {
            console.error('An error happened loading the FBX:', error);
            container.innerHTML = `<p style="color:red; background:white; padding:10px; border-radius:5px;">モデルの読み込みに失敗しました。</p>`;
        });
    };

    // Initial load based on theme
    const defaultModelName = isNewYear ? 'ポテトくん(2026年午年).fbx' : 'ポテトくん(通常).fbx';
    loadModel(`models/${encodeURIComponent(defaultModelName)}`);

    // Handle window resize
    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);
        renderer.render(scene, camera);
    }
    animate();

    // Trigger explicit resize after a short delay to handle mobile layout shifts
    setTimeout(() => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width > 0 && height > 0) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
    }, 500);
};

// i18n Translation Data
const translations = {
    ja: {
        "title": "ポテトくん VRM無料配布中！",
        "description": "Clusterで使えるオリジナルアバター「ポテトくん」の無料配布ページです。",
        "nav-details": "配布データ",
        "hero-title": "ポテトの妖精<br>「ポテトくん」",
        "hero-desc": "Clusterで使えるオリジナルVRMアバターを無料配布中！<br>🐴 今年の干支「午」の着ぐるみを着たポテトくんを配布中！",
        "hero-btn": "今すぐダウンロード",
        "details-title": "🎁 配布データについて",
        "details-format": "形式",
        "details-price": "価格",
        "details-free": "無料",
        "details-usage": "利用想定",
        "details-platform": "ClusterなどのVRM対応プラットフォーム",
        "license-title": "利用規約",
        "license-item1": "個人利用OK",
        "license-item3": "再配布NG",
        "license-item4": "公序良俗に反する利用NG",
        "download-btn": "VRMをダウンロード",
        "mini-game-guide": "右下の🎮️ボタンからミニゲームで遊べるよ！"
    },
    en: {
        "title": "PotatoKun VRM Free Distribution!",
        "description": "Free distribution page for 'PotatoKun', an original avatar for Cluster!",
        "nav-details": "Distribution Data",
        "hero-title": "Potato Fairy<br>'PotatoKun'",
        "hero-desc": "Original VRM avatar for Cluster now free!<br>🐴 Distributing Potato-kun in a Horse costume for this year's zodiac!",
        "hero-btn": "Download Now",
        "details-title": "🎁 Distribution Data",
        "details-format": "Format",
        "details-price": "Price",
        "details-free": "Free",
        "details-usage": "Intended Use",
        "details-platform": "VRM compatible platforms such as Cluster",
        "license-title": "Terms of Use",
        "license-item1": "Personal use OK",
        "license-item3": "Redistribution prohibited",
        "license-item4": "Use against public order prohibited",
        "download-btn": "Download VRM",
        "mini-game-guide": "Play mini-games from the 🎮️ button on the bottom right!"
    },
    es: {
        "title": "¡Distribución gratuita de PotatoKun VRM!",
        "description": "¡Página de distribución gratuita de 'PotatoKun', un avatar original para Cluster!",
        "nav-details": "Datos de Distribución",
        "hero-title": "Hada de la Patata<br>'PotatoKun'",
        "hero-desc": "¡Avatar VRM original para Cluster gratis!<br>🐴 ¡Distribuyendo a Potato-kun con un disfraz de Caballo para el zodiaco de este año!",
        "hero-btn": "Descargar Ahora",
        "details-title": "🎁 Datos de Distribución",
        "details-format": "Formato",
        "details-price": "Precio",
        "details-free": "Gratis",
        "details-usage": "Uso previsto",
        "details-platform": "Plataformas compatibles con VRM como Cluster",
        "license-title": "Términos de Uso",
        "license-item1": "Uso personal OK",
        "license-item3": "Redistribución prohibida",
        "license-item4": "Prohibido uso contra orden público",
        "download-btn": "Descargar VRM",
        "mini-game-guide": "¡Juega minijuegos desde el botón 🎮️ abajo a la derecha!"
    },
    zh: {
        "title": "PotatoKun VRM 免费发放中！",
        "description": "Cluster 原创化身“PotatoKun”的免费发放页面！",
        "nav-details": "发放数据",
        "hero-title": "土豆精灵<br>“PotatoKun”",
        "hero-desc": "Cluster 可用原创 VRM 化身免费发放中！<br>🐴 正在分发穿着今年生肖“马”玩偶服的土豆君！",
        "hero-btn": "立即下载",
        "details-title": "🎁 关于发放数据",
        "details-format": "格式",
        "details-price": "价格",
        "details-free": "免费",
        "details-usage": "预期用途",
        "details-platform": "Cluster 等 VRM 兼容平台",
        "license-title": "使用条款",
        "license-item1": "个人使用 OK",
        "license-item3": "禁止二次分发",
        "license-item4": "禁止違反公共秩序和道德的使用",
        "download-btn": "下载 VRM",
        "mini-game-guide": "点击右下角的🎮️按钮玩小游戏！"
    },
    ko: {
        "title": "포테토군 VRM 무료 배포 중!",
        "description": "Cluster에서 사용할 수 있는 오리지널 아바타 '포테토군'의 무료 배포 페이지입니다!",
        "nav-details": "배포 데이터",
        "hero-title": "감자 요정<br>'포テト군'",
        "hero-desc": "Cluster에서 쓸 수 있는 오리지널 VRM 아바타 무료 배포 중!<br>🐴 올해의 띠인 '말' 인형 옷을 입은 포테이토 군을 배포 중!",
        "hero-btn": "지금 다운로드",
        "details-title": "🎁 배포 데이터 정보",
        "details-format": "형식",
        "details-price": "가격",
        "details-free": "무료",
        "details-usage": "사용 용도",
        "details-platform": "Cluster 등 VRM 대응 플랫폼",
        "license-title": "이용 약관",
        "license-item1": "개인 이용 OK",
        "license-item3": "재배포 금지",
        "license-item4": "공서양속에 반하는 이용 금지",
        "download-btn": "VRM 다운로드",
        "mini-game-guide": "오른쪽 하단의 🎮️ 버튼에서 미니 게임을 즐길 수 있어요!"
    }
};

const updateLanguage = (lang) => {
    const data = translations[lang] || translations.ja;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (data[key]) el.innerHTML = data[key];
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
        const attrMapping = el.getAttribute('data-i18n-attr');
        const [attr, key] = attrMapping.split(':');
        if (data[key]) el.setAttribute(attr, data[key]);
    });
    localStorage.setItem('preferredLang', lang);
};

const initI18n = () => {
    const langSelectors = document.querySelectorAll('.lang-dropdown a');
    langSelectors.forEach(selector => {
        selector.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = selector.getAttribute('data-lang');
            updateLanguage(lang);
        });
    });
    const savedLang = localStorage.getItem('preferredLang') || 'ja';
    updateLanguage(savedLang);
};

document.addEventListener('DOMContentLoaded', () => {
    init3DViewer();
    initI18n();
});
