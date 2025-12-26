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

// i18n Translation Data
const translations = {
    ja: {
        "title": "ポテトくん VRM無料配布中！",
        "description": "Clusterで使えるオリジナルアバター「ポテトくん」の無料配布ページです。フライドポテトがモチーフの元気なキャラクター！",
        "nav-details": "配布データ",
        "hero-title": "🎄 メリークリスマス! 🎅<br>ポテトの妖精「ポテトくん」",
        "hero-desc": "Clusterで使えるVRMアバターを無料配布中!<br>🐴 今だけ来年の干支「午」の着ぐるみを着たポテトくんを配布中!",
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
        "download-btn": "VRMをダウンロード"
    },
    en: {
        "title": "PotatoKun VRM Free Distribution!",
        "description": "Free distribution page for 'PotatoKun', an original avatar for Cluster! A cheerful character based on French fries!",
        "nav-details": "Distribution Data",
        "hero-title": "🎄 Merry Christmas! 🎅<br>Potato Fairy 'PotatoKun'",
        "hero-desc": "VRM avatar for Cluster now free!<br>🐴 Horse costume version for next year's zodiac also available now!",
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
        "download-btn": "Download VRM"
    },
    es: {
        "title": "¡Distribución gratuita de PotatoKun VRM!",
        "description": "¡Página de distribución gratuita de 'PotatoKun', un avatar original para Cluster! ¡Un personaje alegre basado en las patatas fritas!",
        "nav-details": "Datos de Distribución",
        "hero-title": "🎄 ¡Feliz Navidad! 🎅<br>Hada de la Patata 'PotatoKun'",
        "hero-desc": "¡Avatar VRM para Cluster gratis!<br>🐴 ¡Versión con disfraz de caballo para el zodiaco del próximo año disponible ahora!",
        "hero-btn": "Descargar Ahora",
        "details-title": "🎁 Datos de Distribución",
        "details-format": "Formato",
        "details-price": "Precio",
        "details-free": "Gratis",
        "details-usage": "Uso previsto",
        "details-platform": "Plataformas compatibles con VRM como Cluster",
        "license-title": "Términos de Uso",
        "license-item1": "Uso personal OK",
        "license-item2": "Modificación OK",
        "license-item3": "Redistribución prohibida",
        "license-item4": "Prohibido uso contra orden público",
        "download-btn": "Descargar VRM"
    },
    zh: {
        "title": "PotatoKun VRM 免费发放中！",
        "description": "Cluster 原创化身“PotatoKun”的免费发放页面！基于炸薯条的充满活力的角色！",
        "nav-details": "发放数据",
        "hero-title": "🎄 圣诞快乐! 🎅<br>土豆精灵“PotatoKun”",
        "hero-desc": "Cluster 可用 VRM 化身免费发放中！<br>🐴 穿有明年属相“午”着装的 PotatoKun 也在发放中！",
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
        "license-item4": "禁止违反公共秩序和道德的使用",
        "download-btn": "下载 VRM"
    },
    ko: {
        "title": "포테토군 VRM 무료 배포 중!",
        "description": "Cluster에서 사용할 수 있는 오리지널 아바타 '포테토군'의 무료 배포 페이지입니다! 감자튀김을 모티브로 한 활기찬 캐릭터!",
        "nav-details": "배포 데이터",
        "hero-title": "🎄 메리 크리스마스! 🎅<br>감자 요정 '포테토군'",
        "hero-desc": "Cluster에서 쓸 수 있는 VRM 아바타 무료 배포 중!<br>🐴 지금만 내년 간지 '오'의 코스튬을 입은 포테토군 배포 중!",
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
        "download-btn": "VRM 다운로드"
    }
};

const updateLanguage = (lang) => {
    const data = translations[lang] || translations.ja;

    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (data[key]) {
            el.innerHTML = data[key];
        }
    });

    // Update elements with data-i18n-attr attribute
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
        const attrMapping = el.getAttribute('data-i18n-attr');
        const [attr, key] = attrMapping.split(':');
        if (data[key]) {
            el.setAttribute(attr, data[key]);
        }
    });

    // Save language preference
    localStorage.setItem('preferredLang', lang);
};

// Initialize i18n functionality
const initI18n = () => {
    const langSelectors = document.querySelectorAll('.lang-dropdown a');
    langSelectors.forEach(selector => {
        selector.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = selector.getAttribute('data-lang');
            updateLanguage(lang);
        });
    });

    // Load preferred or default language
    const savedLang = localStorage.getItem('preferredLang') || 'ja';
    updateLanguage(savedLang);
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    init3DViewer();
    initI18n();
});
