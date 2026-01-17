import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';


/* Mini-Game System Controller */

// ★季節管理＆開発設定の司令塔
const GameConfig = {
    currentSeason: 'winter', // 'spring', 'summer', 'autumn', 'winter'
    debugMode: true          // ★trueなら、ロード/OPを飛ばしていきなりゲーム開始
};

const GameLibrary = {
    'potato-action': {
        title: "ポテトくんパクパク",
        shortTitle: "ポテパク",
        description: "降ってくる「🍟(5点)」と「🍔(10点)」を集めよう！「☠️」に当たるとゲームオーバー！",
        icon: "🥔",
        iconImage: "assets/potatokun-action.png", // Custom Image
        isBeta: true, // Show Beta Badge
        init: (container) => PotatoAction.init(container),
        start: () => PotatoAction.start(),
        stop: () => PotatoAction.stop()
    },
    'potato-clicker': {
        title: "ポテトくんゲーム②",
        description: "【準備中】ポテトくんをクリックしてポイントを稼ぐゲームです。",
        icon: "👆",
        init: () => { },
        start: () => { },
        stop: () => { },
        isComingSoon: true
    },
    '3d-search': {
        title: "ポテトくんコイン",
        shortTitle: "ポテコイン",
        description: "のどが渇いたポテトくんのために、公園に散らばったコインを10枚集めてジュースを買ってあげよう！",
        icon: "🪙",
        iconImage: "assets/coin_pic.png",
        iconScale: 0.7,
        isBeta: true,
        init: (container) => SearchGame.init(container),
        // TEST MODE: Skip Opening for quick testing
        start: () => SearchGame.start({ skipOpening: true }),
        stop: () => SearchGame.stop()
    }
};

// =============================
//  Seasonal Color Palette
// =============================
// ★季節設定は GameConfig.currentSeason で一元管理

// 季節ごとのパーティクルカラーパレット
const seasonalColors = {
    spring: [0xFF69B4, 0xFFB7C5, 0x00FF00, 0xFFFF00], // ピンク、桜色、緑、黄色
    summer: [0x0000FF, 0x00FFFF, 0xFFD700, 0xFFA500], // 青、水色、金、オレンジ
    autumn: [0xFF4500, 0xD2691E, 0x8B4513, 0xFFD700], // 紅葉色、茶色、金
    winter: [0xFFFFFF, 0x87CEEB, 0x4169E1, 0xB0E0E6], // 白、空色、ロイヤルブルー、淡水色
    default: [0xFFD700, 0xFFFFFF] // フォールバック
};

// 季節ごとの形状パレット
const seasonalShapes = {
    spring: ['🌸', '🌷', '🌱', '✨'],
    summer: ['🌻', '🌊', '🍦', '✨'],
    autumn: ['🍁', '🍂', '🍄', '✨'],
    // ★修正: 赤くなる '♥' を削除し、色変更可能な '♡' のみにする
    winter: ['❄️', '⛄', '♡', '✨', '●'],
    default: ['✨', '●', '★']
};

let currentActiveGameId = null;

/* DOM Elements */
let overlay, menuContainer, introContainer, activeGameContainer, gameOverContainer;
let fabBtn;
let scrollPos = 0;

/* System Initialization */
function initGameSystem() {
    overlay = document.getElementById('minigame-container');
    menuContainer = document.getElementById('game-menu');
    introContainer = document.getElementById('game-intro');
    activeGameContainer = document.getElementById('active-game-container');
    gameOverContainer = document.getElementById('common-game-over');
    fabBtn = document.getElementById('fab-play-game');

    if (!fabBtn) return;

    // TEST MODE: Direct Launch for Playground Dev
    fabBtn.addEventListener('click', () => {
        // Prepare UI state directly (Bypass Menu)
        scrollPos = window.pageYOffset;
        overlay.classList.remove('hidden');
        menuContainer.classList.add('hidden'); // Skip Menu
        introContainer.classList.add('hidden');
        activeGameContainer.classList.remove('hidden');
        gameOverContainer.classList.add('hidden');

        document.body.classList.add('modal-open');
        document.body.style.top = `-${scrollPos}px`;

        // Launch Potecoin Game
        currentActiveGameId = '3d-search';
        GameLibrary[currentActiveGameId].start();

        // ★UI要素のアニメーションをリプレイ（スライドイン演出）
        setTimeout(() => {
            const uiElements = [
                document.getElementById('hud-top-left'),
                document.getElementById('controls-bottom-left'),
                document.getElementById('controls-bottom-right')
            ];

            uiElements.forEach(el => {
                if (el) {
                    el.style.animation = 'none';
                    el.offsetHeight; // trigger reflow
                    el.style.animation = '';
                    el.style.opacity = '1';
                }
            });
        }, 100);
    });

    // Close Button (Portal Level)
    const closeBtn = document.getElementById('portal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closePortal);

    // Intro Buttons
    const startBtn = document.getElementById('intro-start-btn');
    if (startBtn) startBtn.addEventListener('click', launchGame);

    const backBtn = document.getElementById('intro-back-btn');
    if (backBtn) backBtn.addEventListener('click', showGameMenu);

    // Game Over Buttons
    const retryBtn = document.getElementById('game-over-retry-btn');
    if (retryBtn) retryBtn.addEventListener('click', launchGame);

    const menuBtn = document.getElementById('game-over-menu-btn');
    if (menuBtn) menuBtn.addEventListener('click', showGameMenu);

    // Setup Menu Grid
    renderGameMenu();

    // Initial setup for specific games
    PotatoAction.setup(activeGameContainer);
    SearchGame.setup(activeGameContainer);

    // ★追加: デバッグモードなら即座にポテコインゲームを起動
    if (GameConfig.debugMode) {
        console.log("🚀 DEBUG MODE: Auto-launching SearchGame...");

        // メニューなどをスキップして表示状態にする
        scrollPos = window.pageYOffset;
        if (overlay) overlay.classList.remove('hidden');
        if (menuContainer) menuContainer.classList.add('hidden');
        if (introContainer) introContainer.classList.add('hidden');
        if (activeGameContainer) activeGameContainer.classList.remove('hidden');
        if (gameOverContainer) gameOverContainer.classList.add('hidden');

        document.body.classList.add('modal-open');

        // ゲーム開始
        currentActiveGameId = '3d-search';
        GameLibrary[currentActiveGameId].start();

        // UIアニメーションのリセット
        setTimeout(() => {
            const uiElements = [
                document.getElementById('hud-top-left'),
                document.getElementById('controls-bottom-left'),
                document.getElementById('controls-bottom-right')
            ];
            uiElements.forEach(el => {
                if (el) {
                    el.style.animation = 'none';
                    el.offsetHeight;
                    el.style.animation = '';
                    el.style.opacity = '1';
                }
            });
        }, 100);
    }
}


function showGameMenu() {
    // Save scroll position
    scrollPos = window.pageYOffset;

    overlay.classList.remove('hidden');
    menuContainer.classList.remove('hidden');
    introContainer.classList.add('hidden');
    activeGameContainer.classList.add('hidden');
    gameOverContainer.classList.add('hidden');

    document.body.classList.add('modal-open');
    document.body.style.top = `-${scrollPos}px`;

    if (currentActiveGameId) {
        GameLibrary[currentActiveGameId].stop();
        currentActiveGameId = null;
    }
}

function closePortal() {
    overlay.classList.add('hidden');
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    window.scrollTo(0, scrollPos);

    if (currentActiveGameId) {
        GameLibrary[currentActiveGameId].stop();
        currentActiveGameId = null;
    }
}

function renderGameMenu() {
    const grid = document.getElementById('game-grid');
    if (!grid) return;
    grid.innerHTML = ''; // Clear

    Object.keys(GameLibrary).forEach(id => {
        const game = GameLibrary[id];
        const card = document.createElement('button'); // Changed to button
        card.type = 'button';
        card.className = `game-card ${game.isComingSoon ? 'disabled' : ''}`;
        card.style.zIndex = "11000"; // Ensure on top

        const scaleStyle = game.iconScale ? `style="transform: scale(${game.iconScale});"` : '';
        const iconHtml = game.iconImage
            ? `<img src="${game.iconImage}" class="game-icon-img" ${scaleStyle} alt="${game.title}">`
            : `<div class="game-icon">${game.icon}</div>`;

        card.innerHTML = `
            ${iconHtml}
            <div class="game-title">${game.title}</div>
            ${game.isBeta ? '<div class="beta-badge">β版</div>' : ''}
            ${game.isComingSoon ? '<div class="coming-soon-badge">Coming Soon</div>' : ''}
        `;

        if (!game.isComingSoon) {
            card.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                showGameIntro(id);
                return false;
            };
        }
        grid.appendChild(card);
    });
}

function showGameIntro(gameId) {
    currentActiveGameId = gameId;
    const game = GameLibrary[gameId];

    // Populate Intro
    const introIconContainer = document.getElementById('intro-icon');
    introIconContainer.innerHTML = ''; // Clear previous content

    if (game.iconImage) {
        introIconContainer.className = 'large-icon-img-container'; // Changed class for image containment
        introIconContainer.innerHTML = `<img src="${game.iconImage}" class="large-icon-img" alt="${game.title}">`;
    } else {
        introIconContainer.className = 'large-icon';
        introIconContainer.textContent = game.icon;
    }

    document.getElementById('intro-title').textContent = game.shortTitle || game.title;
    document.getElementById('intro-desc').textContent = game.description;

    menuContainer.classList.add('hidden');
    introContainer.classList.remove('hidden');
}

function launchGame() {
    if (!currentActiveGameId) return;

    introContainer.classList.add('hidden');
    gameOverContainer.classList.add('hidden');
    activeGameContainer.classList.remove('hidden');

    GameLibrary[currentActiveGameId].start();
}


let hasUnlockedPrize = false; // Persistent for current session/run

function showGameOver(score) {
    activeGameContainer.classList.add('hidden');
    gameOverContainer.classList.remove('hidden');
    document.getElementById('final-score-value').textContent = score;

    const prizeUI = document.getElementById('prize-container');
    const prizeLink = document.getElementById('prize-link');
    const prizeStatus = document.getElementById('prize-status');

    // Unlock condition: Special Rare Item collected OR Score >= 1000
    if (hasUnlockedPrize || score >= 1000) {
        prizeUI.classList.remove('hidden');
        const driveUrl = "https://drive.google.com/file/d/1nz9HWyO4Q3sMbPDmTLRZcGWkF6k1OjZf/view?usp=sharing";
        prizeLink.href = driveUrl;
        prizeLink.target = "_blank";
        prizeLink.rel = "noopener noreferrer";
        prizeLink.textContent = "Download Special VRM";
        prizeStatus.textContent = "(Available Now!)";
    } else {
        prizeUI.classList.add('hidden');
    }
}

/* =========================================
   GAME MODULE: PotatoAction (Pro Loop Ver)
   ========================================= */
const PotatoAction = (() => {
    let container, player;
    let isPlaying = false;
    let score = 0;
    let items = [];

    // === Game Loop Variables (DeltaTime) ===
    let lastTime = 0;
    const FIXED_STEP = 1 / 60; // 60FPS基準
    let accumulator = 0;
    let animationId = null;

    // Logic Timers
    let spawnTimer = 0;
    let difficultyTimer = 0;

    // Rare Item States
    let rareSpawnWindowActive = false;
    let hasRareSpawnedThisWindow = false;
    let rareWindowStartTime = 0;
    let elapsedForRare = 0; // 時間計測用

    // Support Item States
    let barrierCount = 0;
    let nextBarrierScore = 0;
    let nextBombScore = 0;
    let nextSpanThreshold = 50;
    let supportCycle = 0;

    // Config (Spawn Rate in Seconds)
    // 元が48フレーム(約0.8秒)だったので、秒数で管理
    let currentSpawnInterval = 0.8;
    const Config = { minSpawnInterval: 0.3 };

    function setup(parentContainer) {
        container = parentContainer;
    }

    function init(gameContainer) { }

    function start() {
        isPlaying = true;
        score = 0;
        items = [];

        // Timer Reset
        spawnTimer = 0;
        difficultyTimer = 0;
        elapsedForRare = 0;
        rareWindowStartTime = 0;

        // Config Reset
        currentSpawnInterval = 0.8;

        hasRareSpawnedThisWindow = false;
        rareSpawnWindowActive = false;

        barrierCount = 0;
        nextSpanThreshold = 50;
        supportCycle = 0;
        scheduleSupportItems();

        setupGameUI();

        if (animationId) cancelAnimationFrame(animationId);

        // ★Loop Start (DeltaTime)
        lastTime = performance.now();
        accumulator = 0;
        gameLoop(lastTime);

        window.addEventListener('mousemove', handleInput);
        window.addEventListener('touchmove', handleInput, { passive: false });
    }

    function stop() {
        isPlaying = false;
        if (animationId) cancelAnimationFrame(animationId);
        window.removeEventListener('mousemove', handleInput);
        window.removeEventListener('touchmove', handleInput);

        const existingItems = document.querySelectorAll('.pa-item');
        existingItems.forEach(el => el.remove());
    }

    function setupGameUI() {
        container.innerHTML = `
            <div id="pa-ui">Score: <span id="pa-score">0</span></div>
            <div id="pa-player"><img src="assets/potatokun-action.png" alt="PotatoKun"></div>
            <div id="pa-sacred-flash"></div>
        `;
        player = document.getElementById('pa-player');
    }

    function handleInput(e) {
        if (!isPlaying) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const halfWidth = 75;
        const x = Math.max(halfWidth, Math.min(window.innerWidth - halfWidth, clientX));
        player.style.left = `${x}px`;
    }

    function scheduleSupportItems() {
        let span;
        if (supportCycle === 0) {
            span = 50;
            nextSpanThreshold = 100;
        } else if (supportCycle === 1) {
            span = 80;
            nextSpanThreshold = 180;
        } else {
            span = 120;
            nextSpanThreshold += 120;
        }

        const base = nextSpanThreshold - span;
        nextBarrierScore = base + Math.floor(Math.random() * (span - 10)) + 5;
        nextBombScore = base + Math.floor(Math.random() * (span - 10)) + 5;
        supportCycle++;
    }

    // === Pro Game Loop ===
    function gameLoop(now) {
        if (!isPlaying) return;

        let delta = (now - lastTime) / 1000; // 秒単位
        lastTime = now;

        if (delta > 0.25) delta = 0.25; // 安全装置

        accumulator += delta;

        while (accumulator >= FIXED_STEP) {
            update(FIXED_STEP);
            accumulator -= FIXED_STEP;
        }

        render();
        animationId = requestAnimationFrame(gameLoop);
    }

    function update(dt) {
        // 1. レアアイテム出現判定 (時間ベース)
        if (score >= 300 && rareWindowStartTime === 0) {
            rareWindowStartTime = 1; // フラグ代わり
        }
        if (rareWindowStartTime > 0) {
            elapsedForRare += dt;
            // 10秒〜20秒の間
            if (elapsedForRare >= 10.0 && elapsedForRare <= 20.0 && !hasRareSpawnedThisWindow) {
                rareSpawnWindowActive = true;
            } else {
                rareSpawnWindowActive = false;
            }
        }

        // 2. スポーン管理
        spawnTimer += dt;
        if (spawnTimer >= currentSpawnInterval) {
            spawnItem();
            spawnTimer = 0;
        }

        // 3. 難易度上昇 (10秒ごとに加速)
        difficultyTimer += dt;
        if (difficultyTimer >= 10.0) {
            if (currentSpawnInterval > Config.minSpawnInterval) {
                currentSpawnInterval -= 0.05; // 少しずつ速く
            }
            difficultyTimer = 0;
        }

        // 4. サポートアイテムロジック (スコア依存なのでそのまま)
        if (score >= nextSpanThreshold) {
            scheduleSupportItems();
        }

        // 5. アイテム移動更新
        updateItems(dt);
    }

    function updateItems(dt) {
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];

            // 速度補正: 元のspeedはフレームあたり(約3px～8px)
            // 秒速に換算 = speed * 60
            const moveAmount = (item.speed * 60) * dt;

            item.y += moveAmount;
            item.el.style.top = `${item.y}px`;

            const pRect = player.getBoundingClientRect();
            const playerHitBox = {
                top: pRect.top + 20,
                bottom: pRect.bottom,
                left: pRect.left + 35,
                right: pRect.right - 35
            };
            const iRect = item.el.getBoundingClientRect();

            if (isColliding(playerHitBox, iRect)) {
                handleCollision(item, i);
            } else if (item.y > window.innerHeight) {
                item.el.remove();
                items.splice(i, 1);
            }
        }
    }

    function handleCollision(item, index) {
        if (item.type === 'fry') {
            score += 5;
            showFloatText(item.el.offsetLeft, item.el.offsetTop, '+5');
        } else if (item.type === 'burger') {
            score += 10;
            showFloatText(item.el.offsetLeft, item.el.offsetTop, '+10', '#FF4500');
            spawnSparkles(item.el.offsetLeft + 20, item.el.offsetTop + 20);
        } else if (item.type === 'rare') {
            score += 50;
            // Unlock Prize logic
            rareSpawnWindowActive = false;
            hasRareSpawnedThisWindow = true;

            showFloatText(item.el.offsetLeft, item.el.offsetTop, 'Avatar Unlocked!', '#FF1493');
            spawnHearts(item.el.offsetLeft + 40, item.el.offsetTop + 40);

            // ★ Unlock Special Prize (Persistent until game over)
            hasUnlockedPrize = true;
        } else if (item.type === 'barrier') {
            addBarrier();
            showFloatText(item.el.offsetLeft, item.el.offsetTop, `BARRIER ${barrierCount}!`, '#00BFFF');
        } else if (item.type === 'bomb') {
            activateBomb();
            showFloatText(item.el.offsetLeft, item.el.offsetTop, 'BOMB!', '#FFFFFF');
        } else if (item.type === 'skull') {
            if (barrierCount > 0) {
                removeBarrier();
                showFloatText(item.el.offsetLeft, item.el.offsetTop, 'SHIELDED!', '#00BFFF');
                item.el.remove();
                items.splice(index, 1);
                return;
            } else {
                stop();
                showGameOver(score);
                return;
            }
        }

        if (item.type !== 'skull') {
            document.getElementById('pa-score').textContent = score;
            item.el.remove();
            items.splice(index, 1);
        }
    }

    function render() {
        // DOM-based game, no canvas render needed
    }

    // --- Spawn & Effect Helpers (Same logic) ---
    function spawnItem() {
        const rand = Math.random();
        let type;

        if (score >= nextBarrierScore && nextBarrierScore !== 0) {
            type = 'barrier'; nextBarrierScore = 0;
        } else if (score >= nextBombScore && nextBombScore !== 0) {
            type = 'bomb'; nextBombScore = 0;
        } else if (rareSpawnWindowActive && !hasRareSpawnedThisWindow) {
            type = 'rare'; hasRareSpawnedThisWindow = true;
        } else {
            if (rand < 0.3) type = 'fry';
            else if (rand < 0.9) type = 'skull';
            else type = 'burger';
        }

        const el = document.createElement('div');
        el.className = 'pa-item';

        if (type === 'fry') el.textContent = '🍟';
        else if (type === 'burger') { el.textContent = '🍔'; el.style.transform = 'scale(1.3)'; }
        else if (type === 'skull') el.textContent = '☠️';
        else if (type === 'rare') {
            el.innerHTML = `<img src="assets/potatokun-action.png" style="width:100%; height:100%; object-fit:contain;">`;
            el.style.width = '80px'; el.style.height = '80px';
        }
        else if (type === 'barrier') el.textContent = '🫧';
        else if (type === 'bomb') { el.textContent = '💣'; el.classList.add('bomb'); }

        const spawnX = 40 + Math.random() * (window.innerWidth - 120);
        el.style.left = `${spawnX}px`;
        el.style.top = '-80px';
        container.appendChild(el);

        items.push({
            el: el,
            y: -80,
            type: type,
            // 速度: ピクセル/フレーム だったものを維持
            speed: type === 'skull' ? 5 + Math.random() * 2 : (type === 'burger' ? 6 + Math.random() * 2 : 3 + Math.random() * 2)
        });
    }

    function addBarrier() { if (barrierCount < 3) { barrierCount++; updateBarrierVisual(); } }
    function removeBarrier() { if (barrierCount > 0) { barrierCount--; updateBarrierVisual(); spawnParticles(player.offsetLeft + 75, player.offsetTop + 75, ['#00BFFF', '#FFFFFF'], 'pa-particle'); } }
    function updateBarrierVisual() {
        player.classList.remove('shield-1', 'shield-2', 'shield-3');
        if (barrierCount > 0) player.classList.add(`shield-${barrierCount}`);
    }
    function activateBomb() {
        const flash = document.getElementById('pa-sacred-flash');
        flash.classList.remove('flash-active');
        void flash.offsetWidth;
        flash.classList.add('flash-active');
        for (let i = items.length - 1; i >= 0; i--) {
            if (items[i].type === 'skull') { items[i].el.remove(); items.splice(i, 1); }
        }
    }
    function spawnSparkles(x, y) { spawnParticles(x, y, ['#FFD700', '#FFA500', '#FFFF00', '#FFFFFF'], 'pa-particle'); }
    function spawnHearts(x, y) { spawnParticles(x, y, ['#FF1493', '#FF69B4', '#FFB6C1'], 'pa-heart', '💕'); }
    function spawnParticles(x, y, colors, className, text = null) {
        const count = text ? 12 : 10;
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = className;
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            if (text) { el.textContent = text; el.style.fontSize = `${10 + Math.random() * 10}px`; }
            else { el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]; }

            const angle = Math.random() * Math.PI * 2;
            const velocity = 50 + Math.random() * 70;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            el.style.setProperty('--tx', `${tx}px`);
            el.style.setProperty('--ty', `${ty}px`);

            container.appendChild(el);
            setTimeout(() => el.remove(), 800);
        }
    }
    function isColliding(r1, r2) {
        const pad = 10;
        return !(r1.right - pad < r2.left + pad || r1.left + pad > r2.right - pad || r1.bottom - pad < r2.top + pad || r1.top + pad > r2.bottom - pad);
    }
    function showFloatText(x, y, text, color = '#FFD700') {
        const el = document.createElement('div');
        el.className = 'pa-float-text';
        el.textContent = text;
        el.style.left = `${x}px`; el.style.top = `${y}px`; el.style.color = color; el.style.zIndex = '50';
        container.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    return { setup, init, start, stop };
})();

/* =========================================
   GAME MODULE: 3D Search Game
   ========================================= */
const SearchGame = (() => {
    let container;
    let scene, camera, renderer, controls;

    // === Game State Management ===
    const GameState = {
        LOADING: 'loading',
        OPENING: 'opening',
        PLAYING: 'playing',
        ENDING: 'ending'
    };
    let currentState = GameState.LOADING;
    let openingNPC = null; // Openning dedicated NPC
    let banzaiNPC = null;  // Ending dedicated NPC
    let juiceModel = null; // Ending dedicated Object
    let slideModel = null; // Park Asset (Slide) for visibility control

    let isPlaying = false;
    let score = 0;
    let timeLeft = 30;
    let timerId = null;
    let animationId = null;
    let mixer;
    let clock = new THREE.Clock();

    // === Game Loop Variables ===
    let lastTime = performance.now();
    const FIXED_STEP = 1 / 60; // 60FPS基準の固定ステップ
    let accumulator = 0;

    let models = [];
    let targetIndex = -1;
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();

    // Cinematic State
    let isCinematic = false;
    let cinematicTimer = 0;

    // Player Position (Module Scope)
    let playerPosition = new THREE.Vector3(0, 0.6, 0);

    // Camera Control Variables (Module Scope for access from transitionToGameplay)
    let cameraDistance = 0; // 0 = FPS, 10 = max TPS
    let cameraAngle = Math.PI; // Horizontal orbit angle
    let cameraPitch = 0; // Vertical look angle

    // === NPC Position/Rotation Constants (Shared across seasons) ===
    const NPC_CONFIG = {
        opening: {
            position: { x: -11, z: -5 },  // カメラ演出位置
            rotation: 0,                   // 正面向き
        },
        gameplay: {
            position: { x: -13, z: -8 },  // 自販機の左側
            rotation: 0,                   // 正面向き
        },
        vendingMachine: { x: -11, z: -8 }
    };

    // === Season System ===
    const SEASON = {
        SUMMER: 'summer',
        WINTER: 'winter',
    };
    // ★季節は GameConfig.currentSeason で一元管理

    // === Season-specific Model Config ===
    const SEASON_CONFIG = {
        spring: {
            openingNPC: { model: 'models/potatokun_normal.fbx', height: 1.5 },
            gameplayNPC: { model: 'models/potatokun_sitting.fbx', height: 1.0 }
        },
        summer: {
            openingNPC: {
                model: 'models/potatokun_thristy.fbx',
                height: 1.5,
            },
            gameplayNPC: {
                model: 'models/potatokun_sitting.fbx',
                height: 1.0,
            },
        },
        autumn: {
            openingNPC: { model: 'models/potatokun_normal.fbx', height: 1.5 },
            gameplayNPC: { model: 'models/potatokun_sitting.fbx', height: 1.0 }
        },
        winter: {
            openingNPC: {
                model: 'models/potatokun_freezing.fbx',
                height: 1.5,
            },
            gameplayNPC: {
                model: 'models/potatokun_sitandfreezing.fbx',
                height: 1.0,
            },
        },
    };

    // === Season-specific Dialog Lines ===
    const OPENING_LINES = {
        spring: [
            { time: 0, text: 'ポテトくん「ふわぁ〜… ぽかぽかして ねむいなぁ…」', color: '#FF69B4' },
            { time: 4000, text: 'あ！ 公園の桜が 満開だね！', color: '#87CEFA' },
            { time: 7000, text: 'お花見したいけど、のどが渇いちゃった…', color: '#87CEFA' },
            { time: 10000, text: 'コインを集めて、ジュースでお花見パーティーしよう！', color: '#FFA500' },
        ],
        summer: [
            { time: 0, text: 'ポテトくん「はぁ〜… あついよ〜… のどカラカラ…」', color: '#FFAE00' },
            { time: 4000, text: 'あれれ？ ポテトくん、とっても困ってる！', color: '#87CEFA' },
            { time: 7000, text: 'こんな暑さじゃ、元気も出ないよね…', color: '#87CEFA' },
            { time: 10000, text: 'よし！ 公園に落ちているコインを集めて\\nジュースを買ってあげよう！', color: '#87CEFA' },
        ],
        autumn: [
            { time: 0, text: 'ポテトくん「ぐぅ〜…… お腹すいたなぁ……」', color: '#D2691E' },
            { time: 4000, text: '涼しくなってきて、食欲が止まらないよ！', color: '#FF8C00' },
            { time: 7000, text: 'あ！ あんなところに焼き芋……じゃなくてコインが！', color: '#D2691E' },
            { time: 10000, text: 'コインを集めて、秋の味覚をお腹いっぱい食べよう！', color: '#8B4513' },
        ],
        winter: [
            { time: 0, text: 'ポテトくん「ぶるる… さむい… からだが こおりそう…」', color: '#FFAE00' },
            { time: 4000, text: 'おや？ ポテトくんが ふるえている！', color: '#87CEFA' },
            { time: 7000, text: 'こんな寒さじゃ、あったかいものが欲しいね', color: '#87CEFA' },
            { time: 10000, text: 'よし！ コインを集めて、ホットドリンクを買ってあげよう！', color: '#87CEFA' },
        ],
    };

    // === Season Visuals (Ground Color etc.) ===
    const SEASON_VISUALS = {
        spring: {
            groundColor: 0x98FB98, // PaleGreen (若草色)
        },
        summer: {
            groundColor: 0x3FA34D, // Green
        },
        autumn: {
            groundColor: 0xDEB887, // BurlyWood (落ち葉や枯れ草の色)
        },
        winter: {
            groundColor: 0xE0FFFF, // LightCyan
        }
    };

    // NPC References
    let gameplayNPC = null; // Gameplay中に常駐するNPC

    const loader = new FBXLoader();

    // === Input Manager Class ===
    class InputManager {
        constructor(targetElement) {
            this.el = targetElement;
            this.lookPointerId = null;
            this.lastX = 0; this.lastY = 0;
            this.lookDX = 0; this.lookDY = 0;
            this.LOOK_SENSITIVITY = 0.003;
            this._bind();
        }

        consumeLookDelta() {
            const dx = this.lookDX; const dy = this.lookDY;
            this.lookDX = 0; this.lookDY = 0;
            return { dx, dy };
        }

        _bind() {
            this.el.style.touchAction = 'none'; // ブラウザのジェスチャーを無効化
            this.el.addEventListener('mousedown', this._onPointerDown);
            this.el.addEventListener('mousemove', this._onPointerMove);
            this.el.addEventListener('mouseup', this._onPointerUp);
            this.el.addEventListener('mouseleave', this._onPointerUp);

            // passive: false でピンチズーム等を確実にブロック
            this.el.addEventListener('touchstart', this._onPointerDown, { passive: false });
            this.el.addEventListener('touchmove', this._onPointerMove, { passive: false });
            this.el.addEventListener('touchend', this._onPointerUp);
            this.el.addEventListener('touchcancel', this._onPointerUp);
        }

        _onPointerDown = (e) => {
            // UI操作（D-Pad等）はInputManagerとしては無視
            // ※D-Pad側のイベントリスナーで処理されるため
            if (e.target.closest('#sg-dpad') || e.target.closest('.dpad-btn')) return;

            if (e.type === 'mousedown') {
                this.lookPointerId = 'mouse';
                this.lastX = e.clientX;
                this.lastY = e.clientY;
                return; // ここでreturnしないとtouchstartの判定に入ってしまう可能性があるため修正
            }

            if (e.type === 'touchstart') {
                // 【修正ポイント】
                // 「指が1本だけの時(e.touches.length === 1)」という制限を撤廃します。
                // 代わりに、「新しい指が視点用として有効か」を個別に判定します。

                for (const t of e.changedTouches) {
                    // すでに視点操作中の指(lookPointerId)が存在する場合、
                    // 新たな指は「2本目の視点指（ピンチ操作）」とみなして無視します。
                    if (this.lookPointerId !== null) continue;

                    // D-Padエリア外の指であれば、これを「視点操作用の指」として登録します。
                    // (移動用の指があっても、lookPointerIdがnullなら登録されます)
                    this.lookPointerId = t.identifier;
                    this.lastX = t.clientX;
                    this.lastY = t.clientY;

                    // 視点指が決まったらループを抜けます
                    break;
                }

                // 視点指として登録された場合のみ、デフォルト動作を防ぎます
                if (this.lookPointerId !== null) {
                    e.preventDefault();
                }
            }
        };

        _onPointerMove = (e) => {
            if (this.lookPointerId === null) return;
            let x, y;

            if (e.type === 'mousemove' && this.lookPointerId === 'mouse') {
                x = e.clientX; y = e.clientY;
            } else if (e.type === 'touchmove') {
                const t = [...e.changedTouches].find(t => t.identifier === this.lookPointerId);
                if (!t) return;
                x = t.clientX; y = t.clientY;
                e.preventDefault();
            } else { return; }

            this.lookDX += (x - this.lastX) * this.LOOK_SENSITIVITY;
            this.lookDY += (y - this.lastY) * this.LOOK_SENSITIVITY;
            this.lastX = x; this.lastY = y;
        };

        _onPointerUp = (e) => {
            if (this.lookPointerId === 'mouse' && (e.type === 'mouseup' || e.type === 'mouseleave')) {
                this.lookPointerId = null;
            } else if (e.type.startsWith('touch')) {
                for (const t of e.changedTouches) {
                    if (t.identifier === this.lookPointerId) {
                        this.lookPointerId = null; break;
                    }
                }
            }
        };

        dispose() {
            this.el.removeEventListener('mousedown', this._onPointerDown);
            this.el.removeEventListener('mousemove', this._onPointerMove);
            this.el.removeEventListener('mouseup', this._onPointerUp);
            this.el.removeEventListener('mouseleave', this._onPointerUp);
            this.el.removeEventListener('touchstart', this._onPointerDown);
            this.el.removeEventListener('touchmove', this._onPointerMove);
            this.el.removeEventListener('touchend', this._onPointerUp);
            this.el.removeEventListener('touchcancel', this._onPointerUp);
        }
    }

    function setup(parentContainer) {
        container = parentContainer;
    }

    function init(gameContainer) { }

    function start(options = {}) {
        // ★ ADMIN MODE: Instant Clear
        // Set to true to trigger ending immediately on BUY button press.
        // Set to false for normal gameplay.
        const adminMode = true;

        isPlaying = true;
        score = 0;
        timeLeft = 60; // 60 seconds
        models = [];

        // ★ Reset Ending Assets
        banzaiNPC = null;
        juiceModel = null;
        endingObjects = [];

        setupGameUI();

        // ★ Force Viewport for Game (Prevent Zoom)
        const meta = document.querySelector('meta[name="viewport"]');
        if (meta) {
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }

        // Pause Top Page Viewer (Encapsulated)
        window.backgroundViewer?.pause();

        setTimeout(async () => {
            initThreeJS();

            if (animationId) cancelAnimationFrame(animationId);

            // ★ Loop Start (DeltaTime)
            lastTime = performance.now();
            accumulator = 0;
            requestAnimationFrame(gameLoop);

            // Setup GET!/BUY button click handler
            const getBtn = document.getElementById('sg-get-btn');
            if (getBtn) {
                // Remove old listeners to avoid duplicates if restarted
                const newBtn = getBtn.cloneNode(true);
                getBtn.parentNode.replaceChild(newBtn, getBtn);

                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // ★ ADMIN MODE CHECK
                    if (typeof adminMode !== 'undefined' && adminMode) {
                        console.log("Admin Mode: Instant Clear Triggered");
                        // Ensure transition happens safely
                        transitionToEnding();
                        return;
                    }

                    handleInteraction();
                });
                newBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // ★ ADMIN MODE CHECK (Touch Support)
                    if (typeof adminMode !== 'undefined' && adminMode) {
                        console.log("Admin Mode: Instant Clear Triggered (Touch)");
                        transitionToEnding();
                        return;
                    }

                    handleInteraction();
                });
            }

            // ★ SKIP OPENING CHECK (For Development)
            if (arguments[0] && arguments[0].options && arguments[0].options.skipOpening) {
                // Note: arguments check due to setTimeout wrapper scope issues if not careful, 
                // but here 'options' is from start(options).
                // Wait, start(options) -> inside setTimeout, 'options' variable is available via closure.
            }

            // ★デバッグモードなら強制的にskipOpeningを有効化
            const shouldSkip = (options && options.skipOpening) || GameConfig.debugMode;

            if (shouldSkip) {
                console.log("🚀 DEBUG MODE: Skipping Opening Sequence");

                // Hide Loading Overlay
                const overlay = document.getElementById('sg-loading-overlay');
                if (overlay) overlay.style.display = 'none';

                // Set State
                isCinematic = false;
                currentState = GameState.PLAYING;

                // Position Player (Start Point)
                if (typeof playerPosition !== 'undefined') {
                    playerPosition.set(-13, 0.6, -5);
                }

                // Show UI
                const dpad = document.getElementById('sg-dpad');
                if (dpad) dpad.style.display = 'grid';

                const skipBtn = document.getElementById('sg-skip-btn');
                if (skipBtn) skipBtn.style.display = 'none';

                // Initial Text
                showTapText(window.innerWidth / 2, window.innerHeight / 2, 'START!', '#FFFFFF');

                return; // Skip startOpeningSequence
            }

            // ★★★ PLAYGROUND DEV: Opening Disabled ★★★
            // Original: startOpeningSequence();
            // Now: Directly set game to PLAYING state
            console.log("[PLAYGROUND DEV] Opening Sequence DISABLED - Direct Start");

            // Hide Loading Overlay
            const loadingOverlay = document.getElementById('sg-loading-overlay');
            if (loadingOverlay) loadingOverlay.style.display = 'none';

            // Set State to PLAYING
            isCinematic = false;
            currentState = GameState.PLAYING;

            // Position Player at Start Point (Safe zone, far from all colliders)
            if (typeof playerPosition !== 'undefined') {
                playerPosition.set(10, 0.6, 10); // Safe spawn: away from pipe(0,0) and obstacles
            }

            // Show D-Pad Controls
            const dpad = document.getElementById('sg-dpad');
            if (dpad) dpad.style.display = 'grid';

            // Hide Skip Button (not needed)
            const skipBtn = document.getElementById('sg-skip-btn');
            if (skipBtn) skipBtn.style.display = 'none';

            // Show START message
            showTapText(window.innerWidth / 2, window.innerHeight / 2, 'START!', '#FFFFFF');
        }, 100);
    }

    // === CINEMATIC SEQUENCES ===
    let sweatParticles = [];

    function createSweatEffects(model) {
        clearSweatEffects(); // Clear existing

        const sweatGeo = new THREE.SphereGeometry(0.03, 8, 8); // Smaller
        const sweatMat = new THREE.MeshBasicMaterial({ color: 0x87CEFA }); // Light Blue

        // 3 drops on forehead (centered, front of face)
        const positions = [
            { x: 0.05, y: 1.55, z: 0.35 },   // Right forehead
            { x: -0.05, y: 1.6, z: 0.35 },   // Left forehead
            { x: 0, y: 1.5, z: 0.4 }         // Between eyebrows
        ];

        positions.forEach(pos => {
            const mesh = new THREE.Mesh(sweatGeo, sweatMat);
            // Position relative to model world position
            mesh.position.copy(model.position).add(new THREE.Vector3(pos.x, pos.y, pos.z));
            scene.add(mesh);
            sweatParticles.push({ mesh: mesh, startY: mesh.position.y, speed: 0.005 + Math.random() * 0.005 });
        });
    }

    function clearSweatEffects() {
        sweatParticles.forEach(p => scene.remove(p.mesh));
        sweatParticles = [];
    }

    // Helper for sweat animation
    function updateSweatEffects() {
        sweatParticles.forEach(p => {
            p.mesh.position.y -= p.speed;
            if (p.mesh.position.y < p.startY - 0.4) {
                p.mesh.position.y = p.startY; // Loop
            }
        });
    }

    // === WINTER EFFECTS (Freezing/Shivering) ===
    let breathParticles = [];
    let shiverModel = null;
    let shiverFrame = 0;

    function createFreezingEffects(model) {
        clearFreezingEffects();
        shiverModel = model;
        shiverFrame = 0;

        // 白い息パーティクル (口元から上昇)
        const breathGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const breathMat = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.6
        });

        // Position near mouth
        for (let i = 0; i < 3; i++) {
            const mesh = new THREE.Mesh(breathGeo, breathMat.clone());
            mesh.position.copy(model.position).add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,  // X variance
                1.35 + Math.random() * 0.1,    // Mouth height
                0.35                            // Front of face
            ));
            scene.add(mesh);
            breathParticles.push({
                mesh: mesh,
                startY: mesh.position.y,
                speed: 0.003 + Math.random() * 0.002,
                life: 0,
                maxLife: 60 + Math.random() * 30
            });
        }
    }

    function updateFreezingEffects() {
        // 白い息の更新
        breathParticles.forEach(p => {
            p.mesh.position.y += p.speed;
            p.life++;
            // Fade out and reset
            if (p.life > p.maxLife) {
                p.mesh.position.y = p.startY;
                p.mesh.material.opacity = 0.6;
                p.life = 0;
            } else if (p.life > p.maxLife - 20) {
                p.mesh.material.opacity = 0.6 * (p.maxLife - p.life) / 20;
            }
        });

        // 体の震え
        if (shiverModel) {
            shiverFrame++;
            const shiverAmount = 0.015;
            shiverModel.position.x += Math.sin(shiverFrame * 0.5) * shiverAmount;
            shiverModel.rotation.z = Math.sin(shiverFrame * 0.3) * 0.02;
        }
    }

    function clearFreezingEffects() {
        breathParticles.forEach(p => {
            scene.remove(p.mesh);
            if (p.mesh.material) p.mesh.material.dispose();
            if (p.mesh.geometry) p.mesh.geometry.dispose();
        });
        breathParticles = [];
        if (shiverModel) {
            shiverModel.position.x = NPC_CONFIG.opening.position.x;
            shiverModel.rotation.z = 0;
        }
        shiverModel = null;
        shiverFrame = 0;
    }

    // === Gameplay Shiver Effect ===
    let gameShiverTime = 0;
    function updateGameplayShiver(dt) {
        // ★修正: currentSeason -> GameConfig.currentSeason
        if (GameConfig.currentSeason !== 'winter' || !gameplayNPC) return;

        gameShiverTime += dt;

        // 1. 高速振動 (High Frequency)
        const rapidShake = Math.sin(gameShiverTime * 60);

        // 2. 強弱の波 (Envelope)
        const slowWave = Math.sin(gameShiverTime * 1.0) + Math.sin(gameShiverTime * 2.3) * 0.5;

        let intensity = 0.005;
        if (slowWave > 0.2) {
            intensity += slowWave * 0.05;
        }

        // Apply Rotation Shake
        gameplayNPC.rotation.y = rapidShake * intensity;

        // Apply Position Shake
        const posConfig = NPC_CONFIG.gameplay || { position: { x: -13 } }; // 安全策
        gameplayNPC.position.x = posConfig.position.x + (rapidShake * intensity * 0.05);
    }

    // === Season-agnostic Effect Control ===
    function createSeasonEffects(model) {
        if (GameConfig.currentSeason === SEASON.SUMMER) {
            createSweatEffects(model);
        } else if (GameConfig.currentSeason === SEASON.WINTER) {
            createFreezingEffects(model);
        }
    }

    function updateSeasonEffects() {
        if (GameConfig.currentSeason === SEASON.SUMMER) {
            updateSweatEffects();
        } else if (GameConfig.currentSeason === SEASON.WINTER) {
            updateFreezingEffects();
        }
    }

    function clearSeasonEffects() {
        clearSweatEffects();
        clearFreezingEffects();
    }

    // Timer management for opening sequence
    let openingTimers = [];
    let openingInterval = null;

    // === NPC Spawn Functions ===

    /**
     * スポーン: Opening専用NPC (季節対応)
     * @param {Function} onComplete - ロード完了時コールバック
     */
    function spawnOpeningNPC(onComplete) {
        const posConfig = NPC_CONFIG.opening;
        const seasonConfig = SEASON_CONFIG[GameConfig.currentSeason].openingNPC;

        // 既存の破棄
        if (openingNPC) {
            disposeObject(openingNPC);
            openingNPC = null;
        }

        loader.load(
            seasonConfig.model,
            (fbx) => {
                console.log('FBX Loaded: Opening NPC (' + GameConfig.currentSeason + ')');

                // スケール調整
                const box = new THREE.Box3().setFromObject(fbx);
                const size = new THREE.Vector3();
                box.getSize(size);
                const scaleFactor = seasonConfig.height / (size.y > 0 ? size.y : 1.0);
                fbx.scale.setScalar(scaleFactor);

                // 位置・回転設定
                const scaledBox = new THREE.Box3().setFromObject(fbx);
                const offsetY = -scaledBox.min.y;
                fbx.position.set(posConfig.position.x, offsetY, posConfig.position.z);
                fbx.rotation.y = posConfig.rotation;

                // Entity設定
                fbx.userData.entityType = 'npc';
                fbx.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.userData.entityType = 'npc';
                    }
                });

                // 非表示でシーンに追加
                fbx.visible = false;
                scene.add(fbx);
                openingNPC = fbx;

                // アウトライン適用
                applyOutlineRules(fbx);

                // アニメーション（あれば）
                if (fbx.animations && fbx.animations.length > 0) {
                    mixer = new THREE.AnimationMixer(fbx);
                    const action = mixer.clipAction(fbx.animations[0]);
                    action.setLoop(THREE.LoopRepeat);
                    action.play();
                }

                if (onComplete) onComplete(fbx);
            },
            undefined,
            (error) => {
                console.error("Error loading Opening NPC:", error);
                if (onComplete) onComplete(null);
            }
        );
    }

    /**
     * スポーン: Gameplay常駐NPC (季節対応)
     */
    function spawnGameplayNPC() {
        const posConfig = NPC_CONFIG.gameplay;
        const seasonConfig = SEASON_CONFIG[GameConfig.currentSeason].gameplayNPC;

        // 既存の破棄
        if (gameplayNPC) {
            disposeObject(gameplayNPC);
            gameplayNPC = null;
        }

        loader.load(
            seasonConfig.model,
            (fbx) => {
                console.log('FBX Loaded: Gameplay NPC (' + GameConfig.currentSeason + ')');

                // スケール調整
                const box = new THREE.Box3().setFromObject(fbx);
                const size = new THREE.Vector3();
                box.getSize(size);
                const scaleFactor = seasonConfig.height / (size.y > 0 ? size.y : 1.0);
                fbx.scale.setScalar(scaleFactor);

                // 位置・回転設定
                const scaledBox = new THREE.Box3().setFromObject(fbx);
                const offsetY = -scaledBox.min.y;
                fbx.position.set(posConfig.position.x, offsetY, posConfig.position.z);
                fbx.rotation.y = posConfig.rotation;

                // Entity設定
                fbx.userData.entityType = 'npc';
                fbx.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.userData.entityType = 'npc';
                    }
                });

                // シーンに追加
                scene.add(fbx);
                gameplayNPC = fbx;

                // アウトライン適用
                applyOutlineRules(fbx);
            },
            undefined,
            (error) => {
                console.error("Error loading Gameplay NPC:", error);
            }
        );
    }


    // Safety Array for Ending Objects
    let endingObjects = [];
    function addEndingObject(obj) {
        endingObjects.push(obj);
        scene.add(obj);
    }

    /**
     * スポーン: Ending用アセット (Banzai Potato & Juice)
     * @param {Function} onComplete - ロード完了時コールバック
     */
    function spawnEndingAssets(onComplete) {
        console.log('--- spawnEndingAssets CALLED ---'); // Entry Log

        let loadedCount = 0;
        const onAssetLoaded = () => {
            loadedCount++;
            if (loadedCount === 2 && onComplete) onComplete();
        };

        // 1. Banzai Potato
        // 1. Ending Potato (Juice Ver)
        const banzaiPath = 'models/potatokun_juice.fbx';
        console.log('LOADING ENDING POTATO (Juice):', banzaiPath); // Requested Log

        loader.load(banzaiPath, (fbx) => {
            // スケール調整 (Opening NPCと同一ロジック)
            const seasonConfig = SEASON_CONFIG[GameConfig.currentSeason].openingNPC;
            const box = new THREE.Box3().setFromObject(fbx);
            const size = new THREE.Vector3();
            box.getSize(size);
            const scaleFactor = seasonConfig.height / (size.y > 0 ? size.y : 1.0);
            fbx.scale.setScalar(scaleFactor);

            // アウトライン & Material Cloning (Isolation)
            fbx.userData.entityType = 'npc';
            applyOutlineRules(fbx);
            fbx.traverse(c => {
                if (c.isMesh) {
                    c.castShadow = true;
                    c.receiveShadow = true;
                    c.userData.entityType = 'npc';

                    // Clone material to prevent shared state issues (e.g. accidental transparency)
                    if (Array.isArray(c.material)) {
                        c.material = c.material.map(m => {
                            const cloned = m.clone();
                            // ★ FORCE OPAQUE: Fix for persistent transparency
                            cloned.transparent = false;
                            cloned.opacity = 1.0;
                            return cloned;
                        });
                    } else if (c.material) {
                        const cloned = c.material.clone();
                        // ★ FORCE OPAQUE: Fix for persistent transparency
                        cloned.transparent = false;
                        cloned.opacity = 1.0;
                        c.material = cloned;
                    }

                    // Targeting the Can specifically (Blender name: Untitled)
                    if (c.name === 'Untitled') {
                        console.log('Fixed Transparency for Can (Untitled)');
                    }
                }
            });

            // ★ Wrap in Ending Root (Fix Scale/Origin)
            const endingRoot = new THREE.Object3D();
            endingRoot.name = 'BanzaiRoot';

            // Add FBX to Root
            endingRoot.add(fbx);

            // Reset FBX local transform just in case
            fbx.position.set(0, 0, 0);
            fbx.rotation.set(0, 0, 0);

            // Calculate Bounding Box of ROOT (World)
            // Note: We need to add to scene briefly or update matrix
            endingRoot.updateMatrixWorld(true);
            const rootBox = new THREE.Box3().setFromObject(endingRoot);
            const rootMinY = rootBox.min.y;

            // Ground Snap (Move Root)
            if (isFinite(rootMinY)) {
                endingRoot.position.y -= rootMinY;
            }
            // Generate Safety Floor
            endingRoot.position.y = Math.max(endingRoot.position.y, 0);

            // Scale Root (No Modification)
            // endingRoot.scale.setScalar(1.0);

            // Global Reference
            banzaiNPC = endingRoot; // Make banzaiNPC the ROOT

            console.log("Banzai Root Created via spawnEndingAssets");
            console.trace("Checking Spawn Origin");
            endingRoot.visible = false; // Start Hidden

            // Add via safety wrapper
            addEndingObject(endingRoot);

            // --------------------------------------

            onAssetLoaded();
        });

        // 2. Juice
        loader.load('models/juice.fbx', (fbx) => {
            // スケール (小さめ)
            const box = new THREE.Box3().setFromObject(fbx);
            const size = new THREE.Vector3();
            box.getSize(size);
            // 0.3m target height
            const scaleFactor = 0.3 / (size.y > 0 ? size.y : 1.0);
            fbx.scale.setScalar(scaleFactor);

            // アウトライン
            fbx.userData.entityType = 'object'; // 'object' uses simple outline
            applyOutlineRules(fbx);
            fbx.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; c.userData.entityType = 'object'; } });

            juiceModel = fbx;
            addEndingObject(fbx); // Use safe wrapper
            // scene.add(fbx); 
            fbx.visible = false; // 最初は隠す
            onAssetLoaded();
        });
    }

    // State Transition: Opening -> Gameplay
    function transitionToGameplay() {
        console.log("Transitioning to Gameplay...");

        // 1. オープニングNPC削除
        if (openingNPC) {
            disposeObject(openingNPC);
            openingNPC = null;
        }

        // 2. お座りくん生成
        spawnGameplayNPC();

        // 3. FPS視点へ & 入力有効化 (Sync Variables!)
        isCinematic = false;

        // ★ Stop OPENING interval explicitly
        if (openingInterval) {
            clearInterval(openingInterval);
            openingInterval = null;
        }

        // ★ Clear Season Effects (Snow, Sweat, etc.)
        clearSeasonEffects();

        // ★Reset Camera Variables for FPS
        cameraDistance = 0.0; // Force FPS

        // Synced Position: Starts at Z=2 (safe distance from Vending Machine at Z=-8)
        playerPosition.set(-11, 0.6, 2);

        // Sync Camera Angle to look at Vending Machine (North/Negative Z)
        cameraAngle = Math.PI; // PI = Looking -Z (North) in this logic
        cameraPitch = 0;       // Level

        // Apply immediately so render doesn't flicker
        camera.position.copy(playerPosition);
        camera.rotation.set(cameraPitch, cameraAngle, 0, 'YXZ');

        // UI Reset
        const dpad = document.getElementById('sg-dpad');
        if (dpad) dpad.style.display = 'grid';
        showTapText(window.innerWidth / 2, window.innerHeight / 2, 'START!', '#FFFFFF');

        // ★ Enable Player Input (ensure input manager is active)
        // enablePlayerInput is implicit - inputs are always enabled when isCinematic = false
        // But we can explicitly log for debugging:
        console.log("Player Input Enabled. State:", GameState.PLAYING);

        // ★ Set State LAST to ensure all setup is done
        currentState = GameState.PLAYING;
    }

    // Finish/Skip Opening - Common cleanup function
    // Finish/Skip Opening
    function finishOpening() {
        // 現在の状態がOPENINGでなければ無視（重複防止）
        if (currentState !== GameState.OPENING) return;
        openingTimers.forEach(id => clearTimeout(id));
        openingTimers = [];
        if (openingInterval) {
            clearInterval(openingInterval);
            openingInterval = null;
        }
        clearSweatEffects();

        // UI切り替え
        const skipBtn = document.getElementById('sg-skip-btn');
        if (skipBtn) skipBtn.style.display = 'none';

        // 次のフェーズへ
        if (typeof transitionToGameplay === 'function') {
            transitionToGameplay();
        } else {
            console.log("transitionToGameplay not found, falling back strictly.");
            if (openingNPC) openingNPC.visible = false;
            isCinematic = false;
            currentState = GameState.PLAYING;

            // Fallback UI
            const dpad = document.getElementById('sg-dpad');
            if (dpad) dpad.style.display = 'grid';
            if (typeof playerPosition !== 'undefined') playerPosition.set(-13, 0.6, -5);
            showTapText(window.innerWidth / 2, window.innerHeight / 2, 'START!', '#FFFFFF');
        }

    }

    function startOpeningSequence() {
        console.log("Starting Opening Sequence...");
        currentState = GameState.OPENING; // ★State変更
        isCinematic = true;

        // ★Opening NPC参照
        const npc = openingNPC;
        if (!npc) {
            console.warn("Opening NPC not ready yet, retrying...");
            setTimeout(startOpeningSequence, 500);
            return;
        }

        // --- UI Toggle ---
        const skipBtn = document.getElementById('sg-skip-btn');
        const dpad = document.getElementById('sg-dpad');
        if (dpad) dpad.style.display = 'none';
        if (skipBtn) {
            skipBtn.style.display = 'block';
            skipBtn.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();
                finishOpening();
            };
        }


        // --- Acting Setup ---
        npc.position.set(-11, 0, -5);
        npc.visible = true;
        createSeasonEffects(npc);

        // --- Camera Work ---
        const baseCamPos = new THREE.Vector3(-11, 1.0, -2.5);
        camera.position.copy(baseCamPos);
        camera.lookAt(-11, 0.5, -5);

        // --- Hide Loading Overlay ---
        const overlay = document.getElementById('sg-loading-overlay');
        if (overlay) overlay.style.display = 'none';

        // --- Dialog Sequence (Season-based) ---
        const lines = OPENING_LINES[GameConfig.currentSeason];
        lines.forEach(line => {
            if (line.time === 0) {
                showTapText(window.innerWidth / 2, window.innerHeight * 0.7, line.text, line.color);
            } else {
                openingTimers.push(setTimeout(() => {
                    showTapText(window.innerWidth / 2, window.innerHeight * 0.7, line.text, line.color);
                }, line.time));
            }
        });

        // --- Animation Loop ---
        // --- Animation Loop ---
        if (openingInterval) clearInterval(openingInterval);
        openingInterval = setInterval(() => {
            if (currentState !== GameState.OPENING) return; // 安全策
            updateSeasonEffects();
        }, 16);

        // Finish
        openingTimers.push(setTimeout(() => {
            finishOpening();
        }, 13000));
    }

    // State Transition: Gameplay -> Ending
    function transitionToEnding() {
        console.log("Transitioning to Ending...");
        currentState = GameState.ENDING;
        isPlaying = false;
        if (timerId) clearInterval(timerId);

        // UI & Asset Cleanup
        const bgCanvas = document.getElementById('canvas-container');
        if (bgCanvas) bgCanvas.style.display = 'none';
        ['sg-ui', 'sg-dpad', 'sg-get-btn', 'sg-instructions', 'sg-crosshair', 'sg-timer'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        if (gameplayNPC) gameplayNPC.visible = false;
        if (controls) controls.enabled = false;
        if (slideModel) slideModel.visible = false;

        // Start Controller
        EndingController.start();
    }


    /**
     * エンディングコントローラー
     * 演出を一本のタイムラインで管理
     */
    const EndingController = {
        time: 0,
        steps: [],

        // ★ Camera Base Definition (Single Source of Truth)
        // [FIXED] Default Frontal View
        // Pos: (vm.x, 1.3, vm.z + 3.5)
        // LookAt: (vm.x, 1.3, vm.z)
        baseCamera: {
            pos: new THREE.Vector3(NPC_CONFIG.vendingMachine.x, 1.3, NPC_CONFIG.vendingMachine.z + 3.5),
            lookAt: new THREE.Vector3(NPC_CONFIG.vendingMachine.x, 1.3, NPC_CONFIG.vendingMachine.z)
        },

        start: function () {
            this.time = 0;

            // Define Steps
            this.steps = [
                {
                    time: 0.0,
                    fired: false,
                    action: () => {
                        console.log("Ending Step 1: Init Camera & Assets");

                        // Camera Setup: Use BASE CONSTANT
                        // Front of Vending Machine (Default Position)
                        const base = this.baseCamera;
                        camera.position.copy(base.pos);
                        camera.lookAt(base.lookAt);
                        camera.updateMatrixWorld();

                        // Assets Init (Hidden at start)
                        if (banzaiNPC) {
                            banzaiNPC.visible = false; // Hidden until Step 3
                            banzaiNPC.position.set(-10.5, 0, -7.0);
                            banzaiNPC.rotation.y = -Math.PI / 8;
                        } else {
                            // Emergency Spawn check
                            spawnEndingAssets(() => {
                                if (banzaiNPC) {
                                    addEndingObject(banzaiNPC);
                                    banzaiNPC.visible = false;
                                    banzaiNPC.position.set(-10.5, 0, -7.0);
                                    banzaiNPC.rotation.y = -Math.PI / 8;
                                }
                            });
                        }
                        if (juiceModel) {
                            juiceModel.visible = false; // Hidden until Step 2
                            // Pos: Front (+0.4) & Right (+0.4) of Center, Height 1.1m -> Adjusted Phase 2
                            const vm = NPC_CONFIG.vendingMachine;
                            // Update: X (Center - 0.1), Y (0.4), Z (Unchanged)
                            juiceModel.position.set(vm.x - 0.1, 0.4, vm.z + 0.4);

                            // Rotation: Sideways (Z-axis rotation)
                            juiceModel.rotation.set(0, 0, Math.PI / 2);
                        }
                    }
                },
                {
                    time: 1.5,
                    fired: false,
                    action: () => {
                        console.log("Ending Step 2: Juice Slide");
                        if (juiceModel) juiceModel.visible = true;
                        showTapText(window.innerWidth / 2, window.innerHeight * 0.3, "ジュース、買えたよ！", "#00FF00");
                    }
                },
                {
                    time: 3.5,
                    fired: false,
                    action: () => {
                        console.log("Ending Step 3: Potato Appears");
                        if (banzaiNPC) banzaiNPC.visible = true;
                        if (juiceModel) juiceModel.visible = false; // Hide Juice (Picked up by Potato)
                        showTapText(window.innerWidth / 2, window.innerHeight * 0.3, "ありがとう💕", "#FFA500");
                    }
                },
                {
                    time: 6.5,
                    fired: false,
                    action: () => {
                        console.log("Ending Step 4: Finish");
                        finishEnding();
                    }
                }
            ];

            // Execute time 0 immediately
            this.update(0);
        },

        update: function (dt) {
            this.time += dt;

            // Execute Steps
            this.steps.forEach(step => {
                if (!step.fired && this.time >= step.time) {
                    step.action();
                    step.fired = true;
                }
            });

            // --- Continuous Animations ---

            // Juice Slide (1.5s ~ 3.0s)
            if (this.time >= 1.5 && this.time < 3.0) {
                if (juiceModel && juiceModel.visible) {
                    // Slide forward/up slightly
                    juiceModel.position.z += dt * 0.1;
                }
            }

            // Potato Bob (3.5s ~)
            if (this.time >= 3.5) {
                if (banzaiNPC && banzaiNPC.visible) {
                    // Gentle vertical bob
                    banzaiNPC.position.y = Math.sin((this.time - 3.5) * 4) * 0.05;
                }
            }
        }
    };

    /**
     * エンディング演出用アップデート関数
     * @param {number} dt 
     */
    function updateEndingAnimation(dt) {
        EndingController.update(dt);
    }

    function finishEnding() {
        console.log("Ending Finished.");

        // Message display (Success/Thank You)
        const overlay = document.getElementById('sg-loading-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 1s';
            overlay.innerHTML = 'THANK YOU FOR PLAYING!';

            // Force reflow
            void overlay.offsetWidth;
            overlay.style.opacity = '1';
        }

        // Return to Mini Game Select after delay (Auto Transition)
        setTimeout(() => {
            console.log("Transitioning to Menu...");
            stop(); // Cleanup Three.js & Events

            // Hide Ending Overlay directly
            if (overlay) overlay.style.display = 'none';

            // Attempt transition
            if (typeof showGameMenu === 'function') {
                showGameMenu();
            } else {
                console.warn("showGameMenu not found via scope, forcing UI reset.");
                // Manual Fallback
                const menu = document.getElementById('game-menu');
                const active = document.getElementById('active-game-container');
                const overlayPortal = document.getElementById('minigame-container');

                if (active) active.classList.add('hidden');
                if (menu) menu.classList.remove('hidden');
                if (overlayPortal) overlayPortal.classList.remove('hidden');
            }
        }, 3000); // Wait 3.0s (User Request)
    }





    function startTimer() {
        if (timerId) clearInterval(timerId);
        timerId = setInterval(() => {
            timeLeft--;
            const timerEl = document.getElementById('sg-timer');
            if (timerEl) timerEl.textContent = timeLeft;
            if (timeLeft <= 0) {
                stop();
                const collected = window.sgItemData ? window.sgItemData.collected : 0;
                showGameOver(collected * 100);
            }
        }, 1000);
    }

    function stop() {
        isPlaying = false;

        // ★ Restore Viewport
        const meta = document.querySelector('meta[name="viewport"]');
        if (meta) {
            meta.content = 'width=device-width, initial-scale=1.0';
        }

        clearInterval(timerId);
        if (animationId) cancelAnimationFrame(animationId);
        // Button handlers are removed when HTML is cleared

        // Resume Top Page Viewer
        window.backgroundViewer?.resume();

        if (renderer) {
            renderer.dispose();
            if (renderer.domElement && renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
            renderer = null;
        }

        // Reset Model References
        slideModel = null;
    }


    function setupGameUI() {
        container.innerHTML = `
            <!-- Loading Overlay -->
            <div id="sg-loading-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: #87CEEB;
                z-index: 9999;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-family: 'Courier New', monospace;
                font-size: 24px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            ">Now Loading...</div>
            
            <div id="sg-canvas-container" style="width:100%; height:100%; background: #1a1a1a;"></div>

            <!-- SKIP Button -->
            <div id="sg-skip-btn" style="
                position: absolute;
                top: 80px;
                right: 20px;
                z-index: 250;
                color: white;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                font-size: 18px;
                border: 2px solid white;
                background: rgba(0, 0, 0, 0.5);
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                display: none;
                user-select: none;
                -webkit-tap-highlight-color: transparent;
            ">SKIP ▶</div>

            <!-- Crosshair -->
            <style>
                #sg-crosshair .crosshair-h, #sg-crosshair .crosshair-v { background: white; transition: background 0.15s; }
                #sg-crosshair .crosshair-circle { border-color: white; transition: border-color 0.15s; }
                #sg-crosshair.target-locked .crosshair-h, #sg-crosshair.target-locked .crosshair-v { background: #FF4444; }
                #sg-crosshair.target-locked .crosshair-circle { border-color: #FF4444; }
            </style>
            <div id="sg-crosshair" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:150; pointer-events:none !important;">
                <div class="crosshair-h" style="width:24px; height:3px; position:absolute; left:-12px; top:-1.5px; opacity:0.9;"></div>
                <div class="crosshair-v" style="width:3px; height:24px; position:absolute; left:-1.5px; top:-12px; opacity:0.9;"></div>
                <div class="crosshair-circle" style="width:8px; height:8px; border:2px solid white; border-radius:50%; position:absolute; left:-6px; top:-6px; opacity:0.7;"></div>
            </div>

            <!-- NEW UI CONTAINER (Fixed Absolute Layout) -->
            <div id="ui-container">
                
                <div id="hud-top-left">
                    <h1>ポテトコイン</h1>
                    <div id="score">コイン: <span id="sg-coin-counter">0</span>/10</div>
                    <div id="tutorial-hint" style="display:none;">🎮 移動: D-Pad / 🦅 視点切替</div>
                </div>

                <div id="controls-bottom-left">
                    <!-- Fused D-Pad (CSS Grid) -->
                    <div id="dpad-cross">
                        <div class="dpad-empty"></div> <button id="dpad-up">▲</button>   <div class="dpad-empty"></div> 
                        <button id="dpad-left">◀</button> <div id="dpad-center"></div>   <button id="dpad-right">▶</button>
                        <div class="dpad-empty"></div> <button id="dpad-down">▼</button> <div class="dpad-empty"></div> 
                    </div>
                </div>

                <div id="controls-bottom-right">
                    <!-- Vertical Stack -->
                    <button id="btn-action-pickup" class="action-btn pickup-btn" style="display: none;">
                        <img src="assets/horseshoe_magnet.png" alt="GET">
                    </button>
                    
                    <button id="toggle-view-btn" class="action-btn view-btn">🦅</button>
                </div>
                
            </div>
        `;

        // ★追加: 視点切替ボタンのイベントリスナー (新ID対応)
        // DOM挿入直後なので、ここでイベントを設定する
        setTimeout(() => {
            bindUIEvents(); // Bind listeners
        }, 100);
    }

    // === UI Event Binding Helper ===
    function bindUIEvents() {
        // 1. 視点切替
        const toggleViewBtn = document.getElementById('toggle-view-btn');
        if (toggleViewBtn) {
            const toggleHandler = (e) => {
                e.preventDefault(); e.stopPropagation();
                // Toggle Logic
                if (typeof cameraDistance !== 'undefined') {
                    const isTPS = (cameraDistance > 0.5);
                    cameraDistance = isTPS ? 0.0 : 8.0; // Toggle
                    console.log('View Mode:', isTPS ? 'FPS' : 'TPS');
                    // Visual Feedback
                    toggleViewBtn.classList.add('active');
                    setTimeout(() => toggleViewBtn.classList.remove('active'), 100);
                }
            };
            toggleViewBtn.onclick = toggleHandler;
            toggleViewBtn.ontouchstart = toggleHandler;
        }

        // 2. PICKUPボタン (🧲) - 共通関数を使う簡略版
        const pickupBtn = document.getElementById('btn-action-pickup');
        if (pickupBtn) {
            pickupBtn.onclick = null; // イベントの多重登録を防ぐ

            pickupBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log("🧲 Clicked!");

                // 半径3m以内のコインを探す
                if (typeof playerPosition === 'undefined' || !scene) {
                    console.log("playerPosition or scene undefined");
                    return;
                }

                let nearestDist = 3.0;
                let targetCoin = null;

                scene.traverse((obj) => {
                    if (obj.userData.isCoin && !obj.userData.collected) {
                        const worldPos = new THREE.Vector3();
                        obj.getWorldPosition(worldPos);
                        const dist = playerPosition.distanceTo(worldPos);
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            targetCoin = obj;
                        }
                    }
                });

                // 見つけたら共通関数に投げるだけ！
                if (targetCoin) {
                    collectCoin(targetCoin);
                    pickupBtn.style.display = 'none'; // ボタンは消す
                } else {
                    console.log("No coin in range");
                }
            };

            // スマホのタッチ対応
            pickupBtn.ontouchend = (e) => { e.preventDefault(); pickupBtn.click(); };
        }
    }

    // === Update UI (Visibility Logic) ===
    function updateUI() {
        const pickupBtn = document.getElementById('btn-action-pickup');
        if (!pickupBtn || typeof playerPosition === 'undefined') return;

        let nearCoinFound = false;

        // Scan for coins near player
        scene.traverse((obj) => {
            if (obj.userData.isCoin && !obj.userData.collected) {
                const worldPos = new THREE.Vector3();
                obj.getWorldPosition(worldPos);
                if (playerPosition.distanceTo(worldPos) < 2.5) {
                    nearCoinFound = true;
                }
            }
        });

        // Toggle Display
        if (nearCoinFound) {
            if (pickupBtn.style.display !== 'flex') {
                pickupBtn.style.display = 'flex';
                // Reset Animation
                pickupBtn.style.animation = 'none';
                void pickupBtn.offsetWidth;
                pickupBtn.style.animation = 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }
        } else {
            if (pickupBtn.style.display !== 'none') {
                pickupBtn.style.display = 'none';
            }
        }
    }

    // === Coin Collection Helper (Delta Time対応版) ===
    /**
     * コイン取得時の共通処理関数 (Delta Time対応)
     * @param {THREE.Object3D} coinObj - 取得対象のコイン
     */
    function collectCoin(coinObj) {
        if (!coinObj || coinObj.userData.collected) return;

        // 1. ステータス更新
        coinObj.userData.collected = true;

        // コインのワールド座標を保存してから削除
        const coinWorldPos = new THREE.Vector3();
        coinObj.getWorldPosition(coinWorldPos);
        scene.remove(coinObj);

        // 2. スコア加算
        if (window.sgItemData) {
            window.sgItemData.collected++;
            const counter = document.getElementById('sg-coin-counter');
            if (counter) counter.textContent = window.sgItemData.collected;
        }

        // 3. 効果音
        try {
            const audio = new AudioContext();
            const osc = audio.createOscillator();
            const gain = audio.createGain();
            osc.connect(gain);
            gain.connect(audio.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audio.currentTime);
            gain.gain.setValueAtTime(0.1, audio.currentTime);
            osc.start();
            osc.stop(audio.currentTime + 0.1);
        } catch (err) { console.warn("Audio error:", err); }

        // 4. ★パーティクルエフェクト (Delta Time対応版)
        const particleCount = 15;

        // 季節設定の取得
        const season = GameConfig.currentSeason;
        const colors = seasonalColors[season] || seasonalColors['default'];
        const shapes = seasonalShapes[season] || ['●'];

        for (let i = 0; i < particleCount; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 32; canvas.height = 32;
            const context = canvas.getContext('2d');

            const color = colors[Math.floor(Math.random() * colors.length)];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];

            context.fillStyle = '#' + color.toString(16).padStart(6, '0');
            context.font = '24px sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(shape, 16, 16);

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false
            });
            const sprite = new THREE.Sprite(material);

            // 発生位置
            sprite.position.copy(coinWorldPos);
            sprite.position.x += (Math.random() - 0.5) * 0.3;
            sprite.position.y += (Math.random() - 0.5) * 0.3;
            sprite.position.z += (Math.random() - 0.5) * 0.3;

            // サイズ
            sprite.scale.set(0.13, 0.13, 0.13);

            // 速度ベクトル
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.08,
                Math.random() * 0.08,
                (Math.random() - 0.5) * 0.08
            );

            scene.add(sprite);

            // ★時間管理用の変数
            let lastTime = performance.now();

            const animateSprite = () => {
                if (material.opacity <= 0) {
                    scene.remove(sprite);
                    material.dispose();
                    texture.dispose();
                    return;
                }

                // ★Delta Time計算 (秒単位)
                const now = performance.now();
                const dt = Math.min((now - lastTime) / 1000, 0.1);
                lastTime = now;

                // 60FPS基準のタイムスケール
                const timeScale = dt * 60;

                // 移動 (速度 × タイムスケール)
                sprite.position.x += velocity.x * timeScale;
                sprite.position.y += velocity.y * timeScale;
                sprite.position.z += velocity.z * timeScale;

                // 減速 (空気抵抗)
                velocity.multiplyScalar(Math.pow(0.95, timeScale));

                // フェードアウト
                material.opacity -= 0.03 * timeScale;

                requestAnimationFrame(animateSprite);
            };
            animateSprite();
        }

        console.log(`✨ Coin collected (${GameConfig.currentSeason} + DeltaTime) at:`, coinWorldPos);
    }






    function initThreeJS() {
        const canvasContainer = document.getElementById('sg-canvas-container');
        const width = canvasContainer.clientWidth || window.innerWidth;
        const height = canvasContainer.clientHeight || window.innerHeight;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xBFEFFF); // Soft pastel sky blue
        scene.fog = new THREE.Fog(0x90EE90, 5, 25); // Green-tinted fog for grass maze

        // ★ ライトをグローバル変数に保持
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(20, 50, 20); // Default Summer position
        dirLight.castShadow = true;
        // Shadow map settings
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -40;
        dirLight.shadow.camera.right = 40;
        dirLight.shadow.camera.top = 40;
        dirLight.shadow.camera.bottom = -40;
        scene.add(dirLight);
        window.sgSunLight = dirLight; // 参照保持

        // Ambient Light (soft filler)
        const ambientLight = new THREE.AmbientLight(0x404040, 0.9); // Soft white light (Brighter shadows)
        scene.add(ambientLight);

        // ★ 環境設定（空・光・フォグ）
        const ENV_CONFIG = {
            spring: {
                background: 0xE0FFFF, // 淡い空色
                fog: 0xFFF0F5,        // ★重要: ラベンダーブラッシュ（桜色の霞）
                lightPos: { x: 20, y: 40, z: 20 }, // 夏より少し低い
                lightIntensity: 1.3,  // 柔らかい日差し
                ambientColor: 0xFFF5EE, // シーシェル（暖かみのある白）
                ambientIntensity: 0.9   // 優しく全体を照らす
            },
            summer: {
                background: 0xBFEFFF, // パステルブルー
                fog: 0x90EE90,        // 薄緑
                lightPos: { x: 20, y: 50, z: 20 }, // 夏は太陽が高い
                lightIntensity: 1.6,   // ★明るく
                ambientColor: 0x808080, // 少し明るめのグレー
                ambientIntensity: 1.5   // 環境光を上げて影をさらに明るく
            },
            autumn: {
                background: 0xFFE4B5, // モカシン (夕暮れに近い淡いオレンジ)
                fog: 0xFFDAB9,        // ピーチパフ (暖色の霞)
                lightPos: { x: 20, y: 30, z: 20 }, // 夏より低く、冬より高い
                lightIntensity: 1.4,  // 夕日のような強さ
                ambientColor: 0x8B4513, // サドルブラウン (暖かみのある影)
                ambientIntensity: 1.0
            },
            winter: {
                background: 0xE6E6FA, // ラベンダー（冬の空）
                fog: 0xE6E6FA,        // 霧も同色で馴染ませる
                lightPos: { x: 20, y: 25, z: 20 }, // 太陽は低い位置（影が伸びる）
                lightIntensity: 1.2,    // 夏(1.6)より日差しを弱くする
                ambientColor: 0x666688, // 青みがかったグレー（冷たい影の色）
                ambientIntensity: 1.0   // 雪の反射で影もそこそこ明るくする
            }
        };

        window.setEnvironmentSeason = (seasonName) => {
            console.log(`Setting Environment to: ${seasonName}`);
            const config = ENV_CONFIG[seasonName] || ENV_CONFIG.summer;

            // 1. 空の色
            scene.background = new THREE.Color(config.background);

            // 2. フォグの色 (遠景の色)
            if (scene.fog) {
                scene.fog.color.setHex(config.fog);
            }

            // 3. 太陽の位置と強さ
            if (window.sgSunLight) {
                window.sgSunLight.position.set(
                    config.lightPos.x,
                    config.lightPos.y,
                    config.lightPos.z
                );
                window.sgSunLight.intensity = config.lightIntensity;
                // 影カメラの更新
                window.sgSunLight.updateMatrixWorld();
            }

            // 4. 環境光の調整
            scene.traverse((child) => {
                if (child.isAmbientLight) {
                    child.color.setHex(config.ambientColor);
                    child.intensity = config.ambientIntensity;
                }
            });
        };

        camera = new THREE.PerspectiveCamera(75, width / height, 0.05, 1000); // Wider FOV, closer near plane
        camera.position.set(0, 0.6, 25); // POTATO HEIGHT (60cm) at park entrance
        camera.rotation.order = 'YXZ'; // Important for FPS camera

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        canvasContainer.appendChild(renderer.domElement);

        // === リサイズ・画面回転時の処理 ===
        window.addEventListener('resize', onWindowResize, false);

        function onWindowResize() {
            // カメラのアスペクト比を修正
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            // レンダラーのサイズを修正
            renderer.setSize(window.innerWidth, window.innerHeight);

            console.log("Window resized:", window.innerWidth, window.innerHeight);
        }

        // === EdgesGeometry Outline Function ===
        /**
         * オブジェクトにエッジライン（輪郭線）を追加する関数
         * @param {THREE.Object3D} object - 対象のオブジェクト
         * @param {number} thresholdAngle - エッジを検出する角度（デフォルト15度）
         * @param {number} color - 線の色（デフォルト黒）
         */
        function addEdgesOutline(object, thresholdAngle = 15, color = 0x000000) {
            object.traverse((child) => {
                if (child.isMesh && child.geometry) {
                    // Skip if flagged (e.g., water, transparent objects)
                    if (child.userData.skipOutline) return;

                    // Skip if already has edges
                    const existingEdges = child.children.find(c => c.isLineSegments);
                    if (existingEdges) return;

                    try {
                        const edgesGeometry = new THREE.EdgesGeometry(child.geometry, thresholdAngle);
                        const lineMaterial = new THREE.LineBasicMaterial({
                            color: color,
                            linewidth: 2
                        });
                        const edges = new THREE.LineSegments(edgesGeometry, lineMaterial);
                        child.add(edges);
                    } catch (e) {
                        console.warn('EdgesGeometry failed for', child.name, e);
                    }
                }
            });
        }

        // Store addEdgesOutline globally for use in asset loaders
        window.addEdgesOutline = addEdgesOutline;

        // === OPTIMIZATION: Cached Walkable Meshes ===
        // To prevent scene.traverse() every frame (causing stutter with many objects),
        // we cache the list of walkable meshes and update it periodically.
        window.sgWalkableMeshes = [];

        window.sgRefreshWalkableMeshes = () => {
            if (!scene) return;
            const meshes = [];
            scene.traverse((child) => {
                if (child.isMesh && child.geometry) {
                    // Exclude trees, ketchup items, invisible objects, vending machine HitBox
                    if (!child.userData.isTree &&
                        !child.userData.isKetchup &&
                        !child.userData.isVendingMachine &&
                        !child.userData.isCoin && // Coins are not ground
                        !child.userData.ignoreGround && // Grass, Dokan pipe itself
                        child.visible !== false) {
                        meshes.push(child);
                    }
                }
            });
            window.sgWalkableMeshes = meshes;
            // console.log("Walkable meshes updated:", displayMeshes.length);
        };

        // Update walkable meshes every 2 seconds (sufficient for static ground)
        setInterval(window.sgRefreshWalkableMeshes, 2000);


        // === FPS Camera Variables (POTATO PERSPECTIVE) ===
        let yaw = Math.PI; // Looking toward center (negative Z)
        let pitch = 0;
        const moveSpeed = 0.08; // SLOWER - small potato walking speed
        const lookSpeed = 0.003;
        const moveState = { forward: false, backward: false, left: false, right: false };

        // Position bounds
        const BOUNDS = { min: -28, max: 28 };
        const PLAYER_HEIGHT = 0.6; // POTATO HEIGHT (60cm)

        // (Ketchup tracking REMOVED - now using Coin system via window.sgCoinData)

        // === CAMERA ZOOM (FPS to TPS) ===
        // cameraDistance, cameraAngle, cameraPitch are now MODULE SCOPE
        // Re-initialize them here for clarity if wanted:
        cameraDistance = 0; // 0 = FPS, 10 = max TPS
        const CAMERA_DISTANCE_MIN = 0;
        const CAMERA_DISTANCE_MAX = 10;
        const ZOOM_SPEED = 0.5;

        // === ORBIT CAMERA CONTROL ===
        cameraAngle = Math.PI; // Horizontal orbit angle (starts behind player)
        cameraPitch = 0; // Vertical look angle (for FPS mode)

        // Player position tracking (separate from camera)
        // playerPosition is now Module Scope
        playerPosition.set(0, 0.6, 25);
        let playerFacing = Math.PI; // Direction player is facing

        // Pinch zoom tracking
        let lastPinchDistance = 0;

        // Player model reference (will be set when FBX loads)
        let playerModel = null;


        // Apply initial rotation (will be updated in loop)
        camera.rotation.y = cameraAngle;
        camera.rotation.x = cameraPitch;


        // InputManagerの初期化
        const inputManager = new InputManager(renderer.domElement);

        // 視点切替ボタンの設定（ピンチ操作の代わり）
        const viewBtn = document.getElementById('dpad-view');
        if (viewBtn) {
            let isTPS = false;
            const toggleView = (e) => {
                e.preventDefault(); e.stopPropagation();
                isTPS = !isTPS;
                cameraDistance = isTPS ? 8.0 : 0.0; // 距離切り替え
                viewBtn.style.background = isTPS ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)";
            };
            // viewBtn.addEventListener('touchstart', toggleView, { passive: false });
            // viewBtn.addEventListener('click', toggleView); // PC対応
            // ★REMOVED: Old dpad-view listener (Moved to bindUIEvents)
        }

        // ★追加: カーソル変更用のRaycaster (マウス移動時に常時判定)
        const hoverRaycaster = new THREE.Raycaster();

        // PC用: マウス移動時のカーソル変化
        renderer.domElement.addEventListener('mousemove', (event) => {
            if (!isPlaying) return;

            const rect = renderer.domElement.getBoundingClientRect();
            // 座標計算
            const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            hoverRaycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

            // コインと自販機を判定対象にする
            const intersects = hoverRaycaster.intersectObjects(scene.children, true);
            let isHovering = false;

            // ★修正: シンプルなループに戻す (壁抜け判定なし)
            for (const hit of intersects) {
                // 距離制限: 2.5m以内
                if (hit.distance > 2.5) continue;

                const obj = hit.object;

                // 親を遡ってターゲット確認
                let targetGroup = obj;
                while (targetGroup.parent && !targetGroup.userData.isCoin && !targetGroup.userData.isVendingMachine && targetGroup !== scene) {
                    targetGroup = targetGroup.parent;
                }

                // ターゲットが見つかったら即反応 (手前の障害物は無視)
                if (targetGroup.userData.isVendingMachine || (targetGroup.userData.isCoin && !targetGroup.userData.collected)) {
                    isHovering = true;
                    break; // 見つかった時点で終了
                }
            }

            // ★変更: オリジナル磁石カーソルを適用
            // url('パス') x座標 y座標, バックアップ(auto)
            // 64x64ピクセルの中心(32 32)を判定位置にする
            document.body.style.cursor = isHovering
                ? "url('assets/horseshoe_magnet.png') 32 32, auto"
                : 'default';
        });

        // ★ 新・インタラクション機能 (コインをクリックで拾う)
        const handleInputInteraction = (event) => {
            if (!isPlaying) return;

            // 座標取得 (マウス vs タッチ)
            const rect = renderer.domElement.getBoundingClientRect();
            let clientX, clientY;

            // タッチイベントの正規化
            if (event.type === 'touchstart') {
                if (event.changedTouches.length > 0) {
                    clientX = event.changedTouches[0].clientX;
                    clientY = event.changedTouches[0].clientY;
                } else return;
            } else {
                // click (マウス)
                clientX = event.clientX;
                clientY = event.clientY;
            }

            // 正規化デバイス座標 (-1 to +1) への変換
            const mouse = new THREE.Vector2();
            mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

            // Raycaster発射
            const clickRaycaster = new THREE.Raycaster();
            clickRaycaster.setFromCamera(mouse, camera);
            const intersects = clickRaycaster.intersectObjects(scene.children, true);

            // ★修正: シンプルなループに戻す (壁抜け判定なし)
            for (const hit of intersects) {
                // 距離制限: 2.5m以内
                if (hit.distance > 2.5) continue;

                const obj = hit.object;

                // 親を遡ってターゲット確認
                let targetGroup = obj;
                while (targetGroup.parent && !targetGroup.userData.isCoin && !targetGroup.userData.isVendingMachine && targetGroup !== scene) {
                    targetGroup = targetGroup.parent;
                }

                const isCoin = targetGroup.userData.isCoin && !targetGroup.userData.collected;
                const isVending = targetGroup.userData.isVendingMachine;

                // ターゲットが見つかったらアクション実行
                if (isCoin) {
                    // コインゲット処理！ (Helper利用)
                    collectCoin(targetGroup, clientX, clientY);
                    return; // 1個取ったら処理終了

                } else if (isVending) {
                    console.log("Vending Machine Clicked");
                    // 自販機処理があればここに記述
                    return;
                }
            }
        };

        // イベント登録
        renderer.domElement.addEventListener('click', handleInputInteraction);
        // タッチ環境での反応を良くするため touchstart も追加
        renderer.domElement.addEventListener('touchstart', handleInputInteraction, { passive: false });

        // ★旧UIの非表示化 (十字キーとGETボタン)
        const crosshair = document.getElementById('sg-crosshair');
        if (crosshair) crosshair.style.display = 'none';
        const getBtn = document.getElementById('sg-get-btn');
        if (getBtn) getBtn.style.display = 'none';


        // ★ Pre-load Ending Assets here (Hidden by default)
        spawnEndingAssets();

        // ★ PlayGround Test Assets
        if (typeof spawnTestAssets === 'function') {
            spawnTestAssets();
        }


        // === Keyboard Controls ===
        const onKeyDown = (e) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': moveState.forward = true; break;
                case 'KeyS': case 'ArrowDown': moveState.backward = true; break;
                case 'KeyA': case 'ArrowLeft': moveState.left = true; break;
                case 'KeyD': case 'ArrowRight': moveState.right = true; break;
            }
        };

        const onKeyUp = (e) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': moveState.forward = false; break;
                case 'KeyS': case 'ArrowDown': moveState.backward = false; break;
                case 'KeyA': case 'ArrowLeft': moveState.left = false; break;
                case 'KeyD': case 'ArrowRight': moveState.right = false; break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        // === D-Pad Button Controls ===
        const setupDpadButton = (id, direction) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            const activate = () => { moveState[direction] = true; btn.classList.add('active'); };
            const deactivate = () => { moveState[direction] = false; btn.classList.remove('active'); };

            btn.addEventListener('mousedown', activate);
            btn.addEventListener('mouseup', deactivate);
            btn.addEventListener('mouseleave', deactivate);
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); activate(); }, { passive: false });
            btn.addEventListener('touchend', deactivate);
        };

        setupDpadButton('dpad-up', 'forward');
        setupDpadButton('dpad-down', 'backward');
        setupDpadButton('dpad-left', 'left');
        setupDpadButton('dpad-right', 'right');

        // === Movement Update Function (called in loop) ===
        window.sgUpdateMovement = (dt) => {
            // カメラ回転 (InputManager)
            if (typeof inputManager !== 'undefined') {
                const { dx, dy } = inputManager.consumeLookDelta();
                cameraAngle -= dx;
                cameraPitch -= dy;
                // 上下の角度制限
                const MAX_PITCH = Math.PI * 0.45;
                cameraPitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, cameraPitch));
            }

            if (isCinematic) return; // Disable movement during cinematic
            const direction = new THREE.Vector3();

            // ★重要: 速度を「秒速」に変換して dt を掛ける
            // moveSpeed(0.08) * 60FPS = 4.8 (秒速)
            const speedFactor = (moveSpeed * 60) * dt;

            // Forward/backward (along camera direction)
            if (moveState.forward) {
                direction.z -= speedFactor;
            }
            if (moveState.backward) {
                direction.z += speedFactor;
            }

            // Strafe left/right
            if (moveState.left) {
                direction.x -= speedFactor;
            }
            if (moveState.right) {
                direction.x += speedFactor;
            }

            // Rotate direction by cameraAngle (camera-relative movement)
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngle);

            // Update player facing direction when moving
            if (direction.length() > 0.001) {
                playerFacing = Math.atan2(direction.x, direction.z);
            }

            // New position before collision check (use playerPosition)
            const newX = playerPosition.x + direction.x;
            const newZ = playerPosition.z + direction.z;

            // === AABB Collision Detection for Structures ===
            const COLLISION_MARGIN = 0.25; // Player radius (reduced for better mobility)
            // Collision obstacles (slide and old tree REMOVED - now using FBX trees with sgTreeCollisions)
            // ★【修正】古いボクセルアセット（ベンチ、ジム、砂場など）の衝突判定を全削除
            // これにより、FBXモデル以外の「見えない壁」がなくなります。
            const obstacles = [];

            let blockedX = false;
            let blockedZ = false;

            for (const obs of obstacles) {
                const withinX = newX > obs.minX - COLLISION_MARGIN && newX < obs.maxX + COLLISION_MARGIN;
                const withinZ = newZ > obs.minZ - COLLISION_MARGIN && newZ < obs.maxZ + COLLISION_MARGIN;
                const currentWithinX = playerPosition.x > obs.minX - COLLISION_MARGIN && playerPosition.x < obs.maxX + COLLISION_MARGIN;
                const currentWithinZ = playerPosition.z > obs.minZ - COLLISION_MARGIN && playerPosition.z < obs.maxZ + COLLISION_MARGIN;

                // Block X if moving into obstacle on X axis
                if (withinX && currentWithinZ) {
                    blockedX = true;

                }
                // Block Z if moving into obstacle on Z axis
                if (currentWithinX && withinZ) {
                    blockedZ = true;
                }
            }

            // === FBX TREE TRUNK COLLISION (circular) ===
            if (window.sgTreeCollisions) {
                for (const tree of window.sgTreeCollisions) {
                    const dxNew = newX - tree.x;
                    const dzNew = newZ - tree.z;
                    const distNew = Math.sqrt(dxNew * dxNew + dzNew * dzNew);
                    const collisionRadius = tree.radius + COLLISION_MARGIN;

                    if (distNew < collisionRadius) {
                        // Check which axis to block
                        const dxCurrent = playerPosition.x - tree.x;
                        const dzCurrent = playerPosition.z - tree.z;

                        // Block X if moving closer on X axis
                        if (Math.abs(dxNew) < Math.abs(dxCurrent)) {
                            blockedX = true;
                        }
                        // Block Z if moving closer on Z axis
                        if (Math.abs(dzNew) < Math.abs(dzCurrent)) {
                            blockedZ = true;
                        }
                    }
                }
            }

            // === ELEPHANT FOUNTAIN COLLISION (circular) ===
            if (window.sgFountainCollision) {
                for (const fountain of window.sgFountainCollision) {
                    const dxNew = newX - fountain.x;
                    const dzNew = newZ - fountain.z;
                    const distNew = Math.sqrt(dxNew * dxNew + dzNew * dzNew);
                    const collisionRadius = fountain.radius + COLLISION_MARGIN;

                    if (distNew < collisionRadius) {
                        const dxCurrent = playerPosition.x - fountain.x;
                        const dzCurrent = playerPosition.z - fountain.z;

                        if (Math.abs(dxNew) < Math.abs(dxCurrent)) {
                            blockedX = true;
                        }
                        if (Math.abs(dzNew) < Math.abs(dzCurrent)) {
                            blockedZ = true;
                        }
                    }
                }
            }



            // === 土管用など追加の障害物判定 (sgExtraObstacles) ===
            if (window.sgExtraObstacles) {
                for (const obs of window.sgExtraObstacles) {
                    const withinX = newX > obs.minX - COLLISION_MARGIN && newX < obs.maxX + COLLISION_MARGIN;
                    const withinZ = newZ > obs.minZ - COLLISION_MARGIN && newZ < obs.maxZ + COLLISION_MARGIN;
                    const currentWithinX = playerPosition.x > obs.minX - COLLISION_MARGIN && playerPosition.x < obs.maxX + COLLISION_MARGIN;
                    const currentWithinZ = playerPosition.z > obs.minZ - COLLISION_MARGIN && playerPosition.z < obs.maxZ + COLLISION_MARGIN;

                    if (withinX && currentWithinZ) blockedX = true;
                    if (currentWithinX && withinZ) blockedZ = true;
                }
            }

            // Apply movement to playerPosition (not camera)
            if (!blockedX) {
                playerPosition.x += direction.x;
            }
            if (!blockedZ) {
                playerPosition.z += direction.z;
            }

            // Enforce bounds on player position
            playerPosition.x = Math.max(BOUNDS.min, Math.min(BOUNDS.max, playerPosition.x));
            playerPosition.z = Math.max(BOUNDS.min, Math.min(BOUNDS.max, playerPosition.z));

            // === DYNAMIC HEIGHT (Ground Detection via Raycaster) ===
            // Cast ray from high above player position, pointing down
            const groundRaycaster = new THREE.Raycaster();
            const rayOrigin = new THREE.Vector3(playerPosition.x, 50, playerPosition.z);
            const rayDirection = new THREE.Vector3(0, -1, 0);
            groundRaycaster.set(rayOrigin, rayDirection);

            // Use CACHED walkable meshes (Optimized)
            // If the cache is empty (init), try to refresh immediately
            if (!window.sgWalkableMeshes || window.sgWalkableMeshes.length === 0) {
                if (typeof window.sgRefreshWalkableMeshes === 'function') {
                    window.sgRefreshWalkableMeshes();
                }
            }
            // Fallback to empty if still nothing (prevents crash, though player might fall if no ground)
            const walkableMeshes = window.sgWalkableMeshes || [];

            const groundHits = groundRaycaster.intersectObjects(walkableMeshes, false);

            // Find the highest walkable surface at this position
            let targetHeight = 0; // Default ground level
            for (const hit of groundHits) {
                // Only consider surfaces we can stand on
                if (hit.point.y >= 0 && hit.point.y < 10) {

                    // ★【追加】段差制限 (Max Step Height)
                    // 現在の足元より 1.0m 以上高い場所は「壁」や「天井」とみなして無視する。
                    // これにより、土管の天井(Y=2.0)の下にいる時に、上に吸い寄せられるのを防ぐ。
                    if (hit.point.y > playerPosition.y + 1.0) {
                        continue;
                    }

                    if (hit.point.y > targetHeight) {
                        targetHeight = hit.point.y;
                    }
                }
            }

            // Apply height with smooth interpolation (for falling)
            const desiredY = targetHeight + PLAYER_HEIGHT;
            const heightDiff = desiredY - playerPosition.y;

            // Apply height smoothly to playerPosition.y
            if (heightDiff > 0) {
                // Going up - instant (climbing)
                playerPosition.y = desiredY;
            } else if (heightDiff < -0.1) {
                // Going down - smooth fall
                playerPosition.y += heightDiff * 0.15;
            } else {
                // Close enough - lock to target
                playerPosition.y = desiredY;
            }

            // === ORBIT CAMERA POSITIONING ===
            if (cameraDistance > 0) {
                // TPS MODE: Camera orbits around player using cameraAngle
                const offsetX = Math.sin(cameraAngle) * cameraDistance;
                const offsetZ = Math.cos(cameraAngle) * cameraDistance;
                const offsetY = cameraDistance * 0.3; // Elevate camera as we zoom out

                // Position camera behind player (orbit)
                camera.position.x = playerPosition.x + offsetX;
                camera.position.z = playerPosition.z + offsetZ;
                camera.position.y = playerPosition.y + offsetY;

                // Always look at player center
                camera.lookAt(playerPosition.x, playerPosition.y, playerPosition.z);
            } else {
                // FPS MODE: Camera is player's eyes
                camera.position.x = playerPosition.x;
                camera.position.z = playerPosition.z;
                camera.position.y = playerPosition.y;

                // Apply FPS rotation using cameraAngle and cameraPitch
                camera.rotation.y = cameraAngle;
                camera.rotation.x = cameraPitch;
            }

            // === PLAYER MODEL VISIBILITY AND POSITION ===
            if (playerModel) {
                // Position player model at player location
                playerModel.position.set(playerPosition.x, playerModel.position.y, playerPosition.z);
                playerModel.rotation.y = -playerFacing + Math.PI; // Face movement direction

                // Hide in FPS, show in TPS
                playerModel.visible = cameraDistance >= 0.5;
            }



            // (Old ketchup hover detection REMOVED - now using coin proximity in loop())

        };






        const visualConfig = SEASON_VISUALS[GameConfig.currentSeason] || SEASON_VISUALS.summer;
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshLambertMaterial({ color: visualConfig.groundColor })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // REMOVED: Beige dirt patches (previously cream-colored boards under objects)
        // Keeping only green grass ground for a cleaner look

        // =========================================
        // ★ UTILITY HELPERS (Global Outline & Cleanup)
        // =========================================

        // 1. オブジェクトの完全廃棄（メモリリーク防止 & アウトライン残留防止）
        window.disposeObject = (obj) => {
            if (!obj) return;
            // 再帰的に子要素を破棄
            obj.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
                // LineSegments（アウトライン）も明示的に破棄
                if (child.isLineSegments) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                }
            });
            // 親から削除
            if (obj.parent) obj.parent.remove(obj);
        };

        // 2. アウトライン適用ルール（重複防止 & 除外判定）
        window.applyOutlineRules = (object) => {
            if (!object) return;
            // デフォルトは60（建物など）
            let defaultThreshold = 60;
            const color = 0x000000;

            object.traverse((child) => {
                // プレイヤー（FPS視点カメラ）以外かつメッシュであれば適用
                if (child.isMesh && child.userData.entityType !== 'player') {
                    // キャラ専用設定
                    let thresholdAngle = defaultThreshold;
                    if (child.userData.entityType === 'npc') {
                        thresholdAngle = 70; // キャラはシルエット重視（詳細な線を出さない）
                    }

                    // 既にアウトラインがあるかチェック（二重付与防止）
                    let hasOutline = false;
                    child.children.forEach(c => {
                        if (c.isLineSegments && c.userData.isOutline) hasOutline = true;
                    });

                    if (!hasOutline) {
                        // アウトライン生成
                        if (child.geometry) {
                            const edges = new THREE.EdgesGeometry(child.geometry, thresholdAngle);
                            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: color }));
                            line.userData.isOutline = true; // 識別用フラグ
                            child.add(line);
                        }
                    }
                }
            });
        };

        // 3. 既存関数のラッパー（互換性維持）
        // 個別の addEdgesOutline 呼び出しを applyOutlineRules に誘導するか、
        // またはこの関数自体を安全な実装にする
        // 3. 既存関数のラッパー（互換性維持 + NPC70度強制）
        window.addEdgesOutline = (object, angle = 60, color = 0x000000) => {
            object.traverse((child) => {
                if (child.isMesh && child.userData.entityType !== 'player') {
                    // キャラは70度（スッキリ）、その他は指定角度（デフォルト60度＝カッチリ）
                    let threshold = (child.userData.entityType === 'npc') ? 70 : angle;
                    // 重複チェック
                    let hasOutline = false;
                    child.children.forEach(c => {
                        if (c.isLineSegments && c.userData.isOutline) hasOutline = true;
                    });

                    if (!hasOutline && child.geometry) {
                        const edges = new THREE.EdgesGeometry(child.geometry, angle); // 引数の角度を使用
                        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: color }));
                        line.userData.isOutline = true;
                        child.add(line);
                    }
                }
            });
        };

        // === VOXEL CLOUDS for orientation ===
        // REMOVED at user request
        /*
        const cloudMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        const cloudPositions = [
            { x: -20, y: 15, z: -15 },
            { x: 10, y: 18, z: -20 },
            { x: 25, y: 12, z: 0 },
            { x: -15, y: 14, z: 10 },
            { x: 5, y: 20, z: 15 },
            { x: -25, y: 16, z: -5 },
            { x: 15, y: 13, z: -25 },
            { x: 0, y: 17, z: -10 },
            { x: -10, y: 19, z: -20 },
            { x: 20, y: 11, z: 20 },
            { x: -5, y: 15, z: 25 },
            { x: 12, y: 14, z: 8 }
        ];
     
        cloudPositions.forEach(pos => {
            const cloudGroup = new THREE.Group();
            // Main body
            const main = new THREE.Mesh(
                new THREE.BoxGeometry(4, 1.5, 3),
                cloudMaterial
            );
            cloudGroup.add(main);
            // Side puffs
            const puff1 = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1.2, 2),
                cloudMaterial
            );
            puff1.position.set(-2, 0.2, 0.5);
            cloudGroup.add(puff1);
            const puff2 = new THREE.Mesh(
                new THREE.BoxGeometry(2.5, 1.3, 2.2),
                cloudMaterial
            );
            puff2.position.set(1.8, 0.3, -0.3);
            cloudGroup.add(puff2);
     
            cloudGroup.position.set(pos.x, pos.y, pos.z);
            cloudGroup.rotation.y = Math.random() * Math.PI;
            scene.add(cloudGroup);
        });
        */


        // === PERIMETER FENCE (Voxel Style) ===
        const FENCE_BOUNDARY = 30;
        const POST_SPACING = 4;
        const fencePostMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 }); // Burlywood
        const fenceRailMaterial = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 }); // Wheat

        // Create fence posts and rails
        function createFenceSection(startX, startZ, endX, endZ, isXAxis) {
            const length = isXAxis ? Math.abs(endX - startX) : Math.abs(endZ - startZ);
            const numPosts = Math.floor(length / POST_SPACING) + 1;

            for (let i = 0; i < numPosts; i++) {
                const t = i / (numPosts - 1);
                const x = startX + (endX - startX) * t;
                const z = startZ + (endZ - startZ) * t;

                // Fence post
                const post = new THREE.Mesh(
                    new THREE.BoxGeometry(0.4, 1.5, 0.4),
                    fencePostMaterial
                );
                post.position.set(x, 0.75, z);
                post.castShadow = true;
                scene.add(post);

                // Post top cap
                const cap = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 0.15, 0.5),
                    fencePostMaterial
                );
                cap.position.set(x, 1.55, z);
                scene.add(cap);
            }

            // Rails connecting posts
            const railLength = length;
            const railX = (startX + endX) / 2;
            const railZ = (startZ + endZ) / 2;

            // Upper rail
            const upperRail = new THREE.Mesh(
                new THREE.BoxGeometry(
                    isXAxis ? railLength : 0.2,
                    0.15,
                    isXAxis ? 0.2 : railLength
                ),
                fenceRailMaterial
            );
            upperRail.position.set(railX, 1.2, railZ);
            scene.add(upperRail);

            // Lower rail
            const lowerRail = new THREE.Mesh(
                new THREE.BoxGeometry(
                    isXAxis ? railLength : 0.2,
                    0.15,
                    isXAxis ? 0.2 : railLength
                ),
                fenceRailMaterial
            );
            lowerRail.position.set(railX, 0.5, railZ);
            scene.add(lowerRail);
        }

        // Four sides of the fence
        createFenceSection(-FENCE_BOUNDARY, -FENCE_BOUNDARY, FENCE_BOUNDARY, -FENCE_BOUNDARY, true);  // North
        createFenceSection(-FENCE_BOUNDARY, FENCE_BOUNDARY, FENCE_BOUNDARY, FENCE_BOUNDARY, true);   // South
        createFenceSection(-FENCE_BOUNDARY, -FENCE_BOUNDARY, -FENCE_BOUNDARY, FENCE_BOUNDARY, false); // West
        createFenceSection(FENCE_BOUNDARY, -FENCE_BOUNDARY, FENCE_BOUNDARY, FENCE_BOUNDARY, false);  // East

        // === EXTERIOR DECORATIONS (Outside fence) ===
        // ★【削除】草・低木を削除してフィールドを更地にする
        // (Exterior bushes removed for cleaner test field)

        // Add park assets
        createParkAssets();


        // ★★★ PLAYGROUND DEV: Opening Callback DISABLED ★★★
        // Original spawnOpeningNPC callback would trigger startOpeningSequence here.
        // Commenting out entirely to prevent any deferred opening start.
        /*
        spawnOpeningNPC((npc) => {
            if (npc) {
                setTimeout(() => {
                    if (currentState !== GameState.PLAYING && typeof startOpeningSequence === 'function') {
                        startOpeningSequence();
                    }
                }, 100);
            } else {
                setTimeout(() => {
                    if (currentState !== GameState.PLAYING && typeof startOpeningSequence === 'function') {
                        startOpeningSequence();
                    }
                }, 100);
            }
        });
        */
        // Instead, just load the NPC without callback (for potential later use)
        spawnOpeningNPC(() => { /* No-op callback */ });

        // === LOAD FBX MODEL: Elephant Fountain (Water Drinking Station) ===
        const FOUNTAIN_TARGET_HEIGHT = 0.9; // Target height: 0.9m (potato's chest height)

        loader.load(
            'models/elephant_fountain.fbx',
            (fountainFbx) => {
                console.log('FBX Model loaded: elephant_fountain.fbx');

                // === AUTO-SIZE NORMALIZATION using Box3 ===
                const fountainBox = new THREE.Box3().setFromObject(fountainFbx);
                const fountainSize = new THREE.Vector3();
                fountainBox.getSize(fountainSize);

                const fountainOriginalHeight = fountainSize.y;
                console.log('Fountain Original Height:', fountainOriginalHeight.toFixed(3));

                // Calculate scale factor to achieve target height
                const fountainScaleFactor = FOUNTAIN_TARGET_HEIGHT / fountainOriginalHeight;
                fountainFbx.scale.setScalar(fountainScaleFactor);
                console.log('Fountain Applied Scale:', fountainScaleFactor.toFixed(6));

                // Recalculate bounding box after scaling
                const scaledFountainBox = new THREE.Box3().setFromObject(fountainFbx);

                // Position at (3, 0, 3) with Y offset for ground contact
                const fountainOffsetY = -scaledFountainBox.min.y;
                fountainFbx.position.set(3, fountainOffsetY, 3);
                console.log('Fountain Position Y offset:', fountainOffsetY.toFixed(3));

                // Face toward center/player
                fountainFbx.rotation.y = -Math.PI / 4;

                // Set up shadows for all meshes and handle water transparency
                fountainFbx.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        // Water transparency check
                        if (child.name.toLowerCase().includes('water')) {
                            // Clone material to avoid affecting other models sharing the same material
                            if (Array.isArray(child.material)) {
                                child.material = child.material.map(m => {
                                    const cloned = m.clone();
                                    cloned.transparent = true;
                                    cloned.opacity = 0.6;
                                    cloned.depthWrite = false;
                                    return cloned;
                                });
                            } else {
                                const cloned = child.material.clone();
                                cloned.transparent = true;
                                cloned.opacity = 0.6;
                                cloned.depthWrite = false;
                                child.material = cloned;
                            }
                            // Skip outline for water
                            child.userData.skipOutline = true;
                            console.log('Water transparency applied to (Cloned Material):', child.name);
                        }
                    }
                });

                // Add to scene
                scene.add(fountainFbx);
                console.log('Elephant fountain placed at (3, 0, 3)');

                // Add edge outlines (EdgesGeometry method)
                addEdgesOutline(fountainFbx, 15, 0x000000);
                console.log('Elephant fountain: Edge outlines applied');

                // Add collision data for the fountain
                if (!window.sgFountainCollision) {
                    window.sgFountainCollision = [];
                }
                window.sgFountainCollision.push({
                    x: 3,
                    z: 3,
                    radius: 0.6 // Approximate radius
                });
            },
            (progress) => {
                if (progress.total > 0) {
                    const percent = (progress.loaded / progress.total * 100).toFixed(1);
                    console.log(`Loading elephant_fountain.fbx: ${percent}%`);
                }
            },
            (error) => {
                console.error('Error loading elephant_fountain.fbx:', error);
            }
        );


        // === LOAD FBX MODEL: Coin (collectible game items) ===
        const COIN_TARGET_SIZE = 0.5; // Target diameter: 50cm

        // ★修正: テスト用モデル 'coin_test.fbx' を読み込む
        loader.load(
            'models/coin_test.fbx',
            (masterCoin) => {
                console.log('FBX Loaded: coin_test.fbx (master for cloning)');

                // === AUTO-SIZE NORMALIZATION using Box3 ===
                const coinBox = new THREE.Box3().setFromObject(masterCoin);
                const coinSize = new THREE.Vector3();
                coinBox.getSize(coinSize);
                const coinMaxDim = Math.max(coinSize.x, coinSize.y, coinSize.z);
                const coinScaleFactor = COIN_TARGET_SIZE / coinMaxDim;
                masterCoin.scale.setScalar(coinScaleFactor);

                // === Material Replacement (Force Unlit / MeshBasicMaterial) ===
                masterCoin.traverse((child) => {
                    if (child.isMesh) {
                        // 影を落とすのはOKだが、影を受けるのはNG（ムラの原因）
                        child.castShadow = true;
                        child.receiveShadow = false; // ★重要: 影を受けない

                        // ★重要: BasicMaterial（光計算なし・常時発光）に置き換える
                        if (child.material) {
                            const oldMat = Array.isArray(child.material) ? child.material[0] : child.material;

                            // MeshBasicMaterialを作成
                            const newMat = new THREE.MeshBasicMaterial({
                                map: oldMat.map, // テクスチャ引き継ぎ
                                color: 0xFFFFFF, // 白ベース（テクスチャの色をそのまま出す）
                                transparent: false,
                                opacity: 1.0,
                                side: THREE.DoubleSide // 裏面も念のため描画
                            });

                            // もしテクスチャが無い場合だけ、金色にする
                            if (!oldMat.map) {
                                newMat.color.setHex(0xFFD700);
                            }

                            child.material = newMat;
                        }
                    }
                });

                // === Game coin positions (10 coins spread around park) ===
                const coinPositions = [
                    { x: -15, z: -15 }, { x: 15, z: -15 }, { x: -15, z: 15 },
                    { x: 15, z: 15 }, { x: -20, z: 0 }, { x: 20, z: 0 },
                    { x: 0, z: -20 }, { x: 8, z: 18 }, { x: -10, z: -20 }, { x: 12, z: -18 }
                ];

                window.sgGameCoins = []; // For rotation animation
                const gameItems = []; // For collection tracking

                coinPositions.forEach((pos, index) => {
                    const coin = masterCoin.clone();
                    coin.position.set(pos.x, 1.0, pos.z); // Float 1m above ground

                    // Collection flag
                    coin.userData.isCoin = true;
                    coin.userData.coinIndex = index;
                    coin.userData.collected = false;

                    // Re-apply shadows to cloned meshes
                    coin.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    // Add edge outlines
                    addEdgesOutline(coin, 15, 0x000000);

                    scene.add(coin);
                    window.sgGameCoins.push(coin);
                    gameItems.push(coin);
                });

                // Store collection data globally
                window.sgItemData = {
                    items: gameItems,
                    collected: 0,
                    total: coinPositions.length
                };

                console.log(`${coinPositions.length} collectible coins placed!`);

                // Update UI text
                const ketchupLabel = document.getElementById('sg-ketchup');
                if (ketchupLabel) {
                    ketchupLabel.textContent = '0';
                    // Update label text
                    const parent = ketchupLabel.parentNode;
                    if (parent) {
                        parent.childNodes.forEach(node => {
                            if (node.nodeType === 3 && node.textContent.includes('ケチャップ')) {
                                node.textContent = '🪙 コイン: ';
                            }
                        });
                    }
                }
            },
            (progress) => {
                if (progress.total > 0) {
                    const percent = (progress.loaded / progress.total * 100).toFixed(1);
                    console.log(`Loading coin.fbx: ${percent}%`);
                }
            },
            (error) => {
                console.error('Error loading coin.fbx:', error);
            }
        );

        // === 土管 (Dokan) の読み込み ===
        spawnDokan();
        // === 雲 (Clouds) の生成 ===
        spawnClouds();
        // === 草 (Grass) の生成 ===
        spawnGrass();
        // === LOAD FBX MODEL: Tree_test (Forest of trees around park edges) ===

        const TREE_TARGET_HEIGHT = 5.0; // Base target height for trees: 5 meters
        const NUM_TREES = 22; // Increased to replace old box-based trees

        // ==========================================
        // 木 (Tree) の配置と季節カラー管理
        // models/tree.fbx
        // ==========================================
        function spawnTrees() {
            console.log("--- spawnTrees CALLED (Mesh-Specific Color) ---");

            // ★ 葉っぱ専用カラーパレット
            const TREE_PALETTES = {
                spring: [
                    0xFFB7C5, // 桜色 (Cherry Blossom)
                    0xFF69B4, // ホットピンク (アクセント)
                    0xFFC0CB, // ピンク
                    0xFFF0F5  // 淡いピンク
                ],
                summer: [
                    0x66BB6A, // 鮮やかな緑
                    0x43A047, // 少し濃い緑
                    0x81C784, // 淡い緑
                    0x9CCC65  // 黄緑
                ],
                autumn: [
                    0xFF4500, // オレンジレッド (真っ赤な紅葉)
                    0xD2691E, // チョコレート (茶色い葉)
                    0xFF8C00, // ダークオレンジ
                    0xFFD700  // ゴールド (銀杏)
                ],
                winter: [
                    0xE6E6FA, // ラベンダー (薄紫)
                    0xF8F8FF, // ゴーストホワイト (青み白)
                    0xD8BFD8  // アザミ色 (パステルパープル)
                ]
            };

            window.sgTreeObjects = [];

            // ★ 季節切り替え関数 (葉っぱだけを変える)
            window.setTreeSeason = (seasonName) => {
                console.log(`Setting Tree Season to: ${seasonName}`);

                const palette = TREE_PALETTES[seasonName] || TREE_PALETTES.summer;
                const isMultiColor = palette.length > 1;

                window.sgTreeObjects.forEach((tree, index) => {
                    // 木ごとにランダムな色を決定
                    const colorHex = isMultiColor
                        ? palette[index % palette.length]
                        : palette[0];
                    const leafColorObj = new THREE.Color(colorHex);
                    const trunkColorObj = new THREE.Color(0xFFFFFF); // 幹は常に白(テクスチャ色)

                    tree.traverse(child => {
                        if (child.isMesh && child.material) {
                            // ★重要: メッシュ名で判定 (小文字変換してチェック)
                            // Blender由来の名前: "Leaves", "Trunk" などを想定
                            const name = child.name.toLowerCase();

                            // 判定ロジック: 名前に 'leaves', 'leaf', 'canopy' が含まれるか？
                            const isLeaves = name.includes('leaves') || name.includes('leaf') || name.includes('canopy');

                            if (child.material.color) {
                                if (isLeaves) {
                                    // 葉っぱなら季節の色を適用
                                    child.material.color.copy(leafColorObj);
                                } else {
                                    // 幹なら元の色(白乗算)に戻す
                                    child.material.color.copy(trunkColorObj);
                                }
                            }
                        }
                    });
                });
                console.log(`Updated ${window.sgTreeObjects.length} trees to ${seasonName} (Leaves only).`);
            };


            const loader = new FBXLoader();

            loader.load('models/tree.fbx', (masterTree) => {
                console.log('FBX Loaded: tree.fbx');

                // 階層構造と名前の確認ログ
                masterTree.traverse((c) => {
                    if (c.isMesh) console.log(`[Tree Mesh Found] Name: ${c.name}`);
                });

                window.sgMasterTree = masterTree;

                // マテリアル設定 (クローン必須)
                masterTree.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material = child.material.map(m => m.clone());
                            } else {
                                child.material = child.material.clone();
                            }
                            // 自己発光リセット
                            if (child.material.emissive) {
                                child.material.emissive.setHex(0x000000);
                            }
                        }
                        child.userData.isTree = true;
                    }
                });


                // --- Tree Placement Logic ---
                const NUM_TREES = 80; // Total standard trees
                const treePositions = [];
                const placedTrees = [];
                const MIN_TREE_DISTANCE = 5.0;

                // Placement Helper
                function isTooClose(x, z) {
                    for (const placed of placedTrees) {
                        const dx = x - placed.x;
                        const dz = z - placed.z;
                        if (Math.sqrt(dx * dx + dz * dz) < MIN_TREE_DISTANCE) return true;
                    }
                    return false;
                }

                // 1. Generate Positions (Inner Park)
                let attempts = 0;
                while (treePositions.length < NUM_TREES && attempts < 500) {
                    attempts++;
                    const x = (Math.random() - 0.5) * 50; // -25~25
                    const z = (Math.random() - 0.5) * 50; // -25~25

                    // AVOID CENTER (Radius ~12m)
                    if (x * x + z * z < 144) continue;

                    if (!isTooClose(x, z)) {
                        treePositions.push({ x, z });
                        placedTrees.push({ x, z });
                    }
                }

                // 2. Clone and Place
                window.sgTreeCollisions = []; // Reset collisions

                treePositions.forEach((pos, index) => {
                    const tree = masterTree.clone();
                    tree.userData.isTree = true; // Mark root
                    tree.name = `Tree_${index}`;

                    // Random Scale 0.8 ~ 1.2
                    const scale = 0.8 + Math.random() * 0.4;
                    tree.scale.setScalar(scale);

                    // Box for ground alignment
                    const box = new THREE.Box3().setFromObject(tree);
                    const offsetY = -box.min.y;
                    tree.position.set(pos.x, offsetY, pos.z);

                    // Random Rotation
                    tree.rotation.y = Math.random() * Math.PI * 2;

                    scene.add(tree);
                    window.sgTreeObjects.push(tree); // Track

                    // Collision Data
                    window.sgTreeCollisions.push({
                        x: pos.x,
                        z: pos.z,
                        radius: 0.3 * scale // Rough trunk radius
                    });

                    // Outline
                    if (window.addEdgesOutline) window.addEdgesOutline(tree, 15, 0x000000);
                });

                console.log(`${treePositions.length} trees placed.`);

                // 3. Exterior Forest (Dense ring outside)
                const NUM_EXTERIOR = 70;
                for (let i = 0; i < NUM_EXTERIOR; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 35 + Math.random() * 35; // 35m - 70m radius
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;

                    const extTree = masterTree.clone();
                    extTree.userData.isTree = true;
                    extTree.name = `ExteriorTree_${i}`;

                    // Larger Scale for exterior
                    const scale = 1.2 + Math.random() * 0.8;
                    extTree.scale.setScalar(scale);

                    const box = new THREE.Box3().setFromObject(extTree);
                    const offsetY = -box.min.y;
                    extTree.position.set(x, offsetY, z);

                    extTree.rotation.y = Math.random() * Math.PI * 2;

                    scene.add(extTree);
                    window.sgTreeObjects.push(extTree);

                    if (window.addEdgesOutline) window.addEdgesOutline(extTree, 15, 0x000000);
                }

                // Initialize Season
                window.setTreeSeason(GameConfig.currentSeason);

            },
                undefined,
                (error) => console.error('Error loading tree.fbx:', error)
            );
        }

        // ★ GLOBAL SEASON MANAGER (Comms Tower)
        window.setGameSeason = (seasonName) => {
            console.log(`%c=== SEASON CHANGE: ${seasonName.toUpperCase()} ===`, 'color: orange; font-weight: bold;');

            // 1. Grass
            if (window.setGrassSeason) window.setGrassSeason(seasonName);

            // 2. Trees
            if (window.setTreeSeason) window.setTreeSeason(seasonName);

            // 3. Environment (Sky, Fog, Sun)
            if (window.setEnvironmentSeason) window.setEnvironmentSeason(seasonName);

            // 4. Clouds ★追加
            if (window.setCloudSeason) window.setCloudSeason(seasonName);
        };

        // Call the new tree spawning function
        spawnTrees();

        // Initialize Game Season (sets grass and trees)
        window.setGameSeason(GameConfig.currentSeason);


        /* REMOVED OLD TREE LOADING LOGIC */





        // === GRASS MAZE GENERATION REMOVED ===
        // (Field cleared for better visibility)

        // (Ketchup items REMOVED - now using Coins via FBX loader)
    }



    // ==========================================
    // 公園遊具・設備 (Park Assets) の一括配置
    // ==========================================
    function createParkAssets() {
        console.log("--- createParkAssets (FBX List) CALLED ---");

        // ★休憩所エリアの基準位置 (ここを変えれば自販機とゴミ箱が一緒に動きます！)
        const REST_AREA = { x: -11.0, y: 0, z: -8.0 };

        // ★アセット管理リスト
        const ASSET_CONFIG = [
            // ---------------------------------------------------
            // [1] ベンチ
            // ---------------------------------------------------
            {
                name: 'Bench',
                path: 'models/bench.fbx',
                pos: { x: 10, y: 0, z: 8 },
                rot: { y: -45 },
                scale: 1.0,
                onLoad: (obj) => { }
            },
            // ---------------------------------------------------
            // [2] 象さん噴水
            // ---------------------------------------------------
            {
                name: 'Fountain_New',
                path: 'models/fountain.fbx',
                pos: { x: 0, y: 0, z: -12 },
                rot: { y: 0 },
                scale: 2.5,
                onLoad: (obj) => { }
            },
            // ---------------------------------------------------
            // [3] 自販機 (Vending Machine) - 休憩所の主役
            // ---------------------------------------------------
            {
                name: 'VendingMachine',
                path: 'models/vending_test.fbx',
                pos: { x: REST_AREA.x, y: REST_AREA.y, z: REST_AREA.z }, // 基準位置
                rot: { y: 90 }, // 横向き
                scale: 1.0, // onLoad内で自動調整
                onLoad: (obj) => {
                    // --- サイズ調整 (高さ2m) ---
                    const box = new THREE.Box3().setFromObject(obj);
                    const size = new THREE.Vector3();
                    box.getSize(size);
                    const scaleFactor = 2.0 / (size.y > 0 ? size.y : 1.0);
                    obj.scale.setScalar(scaleFactor);

                    // --- 位置調整 (地面に接地) ---
                    const scaledBox = new THREE.Box3().setFromObject(obj);
                    const offsetY = -scaledBox.min.y;
                    obj.position.set(REST_AREA.x, REST_AREA.y + offsetY, REST_AREA.z);

                    // --- 美肌化 & マテリアル設定 ---
                    obj.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;

                            if (child.material) {
                                const mats = Array.isArray(child.material) ? child.material : [child.material];
                                mats.forEach(m => {
                                    m.flatShading = true; // ★魔法のコード
                                    m.needsUpdate = true;

                                    // ライト部分の発光
                                    if (child.name.toLowerCase().includes('light') && m.emissive) {
                                        m.emissive.setHex(0xFFFFFF);
                                        m.emissiveIntensity = 2.0;
                                    }
                                });
                            }
                            // ガラス透過
                            const name = child.name.toLowerCase();
                            if (name.includes('water') || name.includes('glass')) {
                                const mats = Array.isArray(child.material) ? child.material : [child.material];
                                mats.forEach(m => { m.transparent = true; m.opacity = 0.5; });
                                child.userData.skipOutline = true;
                            }
                        }
                    });

                    // --- 判定用ボックス ---
                    const hitBox = new THREE.Mesh(
                        new THREE.BoxGeometry(1.5, 2.5, 1.5),
                        new THREE.MeshBasicMaterial({ visible: false })
                    );
                    hitBox.position.copy(obj.position);
                    hitBox.position.y += 1.0;
                    hitBox.userData.isVendingMachine = true;
                    scene.add(hitBox);
                }
            },
            // ---------------------------------------------------
            // [4] ゴミ箱 (RecycleBin) - 自販機の相棒
            // ---------------------------------------------------
            {
                name: 'RecycleBin',
                path: 'models/RecycleBin.fbx',
                // ★位置は「自販機の場所 + Z方向に1.1m」として定義！
                pos: { x: REST_AREA.x, y: REST_AREA.y, z: REST_AREA.z + 1.1 },
                rot: { y: 90 }, // 自販機と同じ向き
                scale: 1.0,
                onLoad: (obj) => {
                    // --- 美肌化 (フラットシェーディング) ---
                    obj.traverse((child) => {
                        if (child.isMesh && child.material) {
                            const mats = Array.isArray(child.material) ? child.material : [child.material];
                            mats.forEach(m => {
                                m.flatShading = true; // ★ここにも魔法を適用！
                                m.needsUpdate = true;
                            });
                        }
                    });
                }
            },
            // ---------------------------------------------------
            // [5] シーソー
            // ---------------------------------------------------
            {
                name: 'Seesaw',
                path: 'models/seesaw.fbx',
                pos: { x: -15, y: 0.6, z: 10 },
                rot: { y: 30 },
                scale: 1.0,
            },
            // ---------------------------------------------------
            // [6] 滑り台
            // ---------------------------------------------------
            {
                name: 'Slide',
                path: 'models/slide.fbx',
                pos: { x: -8, y: 0, z: -8 },
                rot: { y: 180 },
                scale: 1.5,
            }
        ];

        const loader = new FBXLoader();

        ASSET_CONFIG.forEach(config => {
            loader.load(config.path, (fbx) => {
                console.log(`[Asset Loaded] ${config.name}`);

                // 1. サイズ計測ログ
                const box = new THREE.Box3().setFromObject(fbx);
                const size = new THREE.Vector3();
                box.getSize(size);
                console.log(`  🔍 ${config.name} Raw Size: W${size.x.toFixed(2)} x H${size.y.toFixed(2)} x D${size.z.toFixed(2)}`);

                // 2. 基本トランスフォーム適用
                fbx.position.set(config.pos.x, config.pos.y, config.pos.z);
                if (config.rot.y) fbx.rotation.y = config.rot.y * (Math.PI / 180);

                const finalScale = config.scale || 1.0;
                fbx.scale.setScalar(finalScale);

                // 3. 影とマテリアルの共通設定
                fbx.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (child.material) {
                            const mats = Array.isArray(child.material) ? child.material : [child.material];
                            mats.forEach(m => {
                                if (m.emissive) m.emissive.setHex(0x000000);
                            });
                        }
                    }
                });

                // 4. アウトライン
                if (typeof window.addEdgesOutline === 'function') {
                    window.addEdgesOutline(fbx, 15, 0x000000);
                }

                // 5. 個別ロジック実行 (コールバック)
                if (config.onLoad) {
                    config.onLoad(fbx);
                }

                scene.add(fbx);

            }, undefined, (error) => {
                console.warn(`Error loading ${config.name}:`, error);
            });
        });
    }



    // Hide spots in the park
    const hideSpots = [
        { name: "滑り台の下", x: -8, y: 0, z: -5, rot: 45 },
        { name: "ジャングルジムの上", x: 5, y: 5, z: -5, rot: -30 }, // Y=5 to sit on top of frame
        { name: "ジャングルジムの横", x: 8, y: 0, z: -3, rot: 90 },
        { name: "ベンチの裏", x: 10, y: 0, z: 9.5, rot: 180 },
        { name: "大きな木の影", x: -10, y: 0, z: 5, rot: 'peek' }, // Special: face toward center
        { name: "砂場の隅", x: 2, y: 0, z: 14, rot: 220 },
        { name: "砂場の反対側", x: -2, y: 0, z: 10, rot: 140 },
        { name: "噴水のふち", x: 2, y: 0, z: -10, rot: 135 },
        { name: "噴水の反対側", x: -2, y: 0, z: -14, rot: 0 },
        { name: "茂みの横", x: 13, y: 0, z: 2, rot: 270 },
        { name: "入口付近", x: 0, y: 0, z: 20, rot: 180 },
        { name: "公園の隅", x: -15, y: 0, z: -12, rot: 30 }
    ];


    async function spawnClonesSequential() {
        models.forEach(m => { if (m.parent) m.parent.remove(m); });
        models = [];

        const count = 10;
        targetIndex = Math.floor(Math.random() * count);

        // Shuffle hide spots and pick 10
        const shuffledSpots = [...hideSpots].sort(() => Math.random() - 0.5);
        const selectedSpots = shuffledSpots.slice(0, count);

        // Create spots array
        const spots = [];
        for (let i = 0; i < count; i++) {
            const isTarget = (i === targetIndex);
            const hideSpot = selectedSpots[i];

            const spotGroup = new THREE.Group();
            // Add small random offset for natural look
            spotGroup.position.set(
                hideSpot.x + (Math.random() - 0.5) * 1.5,
                hideSpot.y,
                hideSpot.z + (Math.random() - 0.5) * 1.5
            );

            // Handle rotation - 'peek' means face toward center, otherwise use defined rotation
            if (hideSpot.rot === 'peek') {
                // Calculate angle to face toward center (0,0)
                const angleToCenter = Math.atan2(-hideSpot.z, -hideSpot.x) + Math.PI / 2;
                spotGroup.rotation.y = angleToCenter + (Math.random() - 0.5) * 0.5;
            } else {
                spotGroup.rotation.y = (hideSpot.rot + (Math.random() - 0.5) * 30) * (Math.PI / 180);
            }
            spotGroup.userData.isTarget = isTarget;
            spotGroup.userData.id = i;
            spotGroup.userData.spotName = hideSpot.name;
            scene.add(spotGroup);
            models.push(spotGroup);

            spots.push({ group: spotGroup, isTarget: isTarget, index: i, name: hideSpot.name });
        }

        // Helper: small delay
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Create voxel-style Potato-kun character (no FBX loading needed!)
        function createVoxelPotato(isTarget, spotIndex) {
            const potatoGroup = new THREE.Group();

            // === Body (golden yellow elongated box) ===
            const bodyColor = isTarget ? 0xDAA520 : 0xFFD700; // Target is slightly darker (fried potato color)
            const bodyMaterial = new THREE.MeshLambertMaterial({ color: bodyColor });
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 2, 0.8),
                bodyMaterial
            );
            body.position.y = 1.5;
            body.userData.id = spotIndex;
            body.userData.isTarget = isTarget;
            potatoGroup.add(body);

            // === Arms (black thin boxes) ===
            const limbMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            // Left arm
            const leftArm = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.2, 0.2),
                limbMaterial
            );
            leftArm.position.set(-1, 1.8, 0);
            leftArm.userData.id = spotIndex;
            leftArm.userData.isTarget = isTarget;
            potatoGroup.add(leftArm);

            // Right arm
            const rightArm = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.2, 0.2),
                limbMaterial
            );
            rightArm.position.set(1, 1.8, 0);
            rightArm.userData.id = spotIndex;
            rightArm.userData.isTarget = isTarget;
            potatoGroup.add(rightArm);

            // === Legs (black thin boxes) ===
            const leftLeg = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.6, 0.2),
                limbMaterial
            );
            leftLeg.position.set(-0.3, 0.3, 0);
            leftLeg.userData.id = spotIndex;
            leftLeg.userData.isTarget = isTarget;
            potatoGroup.add(leftLeg);

            const rightLeg = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.6, 0.2),
                limbMaterial
            );
            rightLeg.position.set(0.3, 0.3, 0);
            rightLeg.userData.id = spotIndex;
            rightLeg.userData.isTarget = isTarget;
            potatoGroup.add(rightLeg);

            // === Boxing Gloves (red, larger cubes) ===
            const gloveMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
            const leftGlove = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.5),
                gloveMaterial
            );
            leftGlove.position.set(-1.4, 1.8, 0);
            leftGlove.userData.id = spotIndex;
            leftGlove.userData.isTarget = isTarget;
            potatoGroup.add(leftGlove);

            const rightGlove = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.5),
                gloveMaterial
            );
            rightGlove.position.set(1.4, 1.8, 0);
            rightGlove.userData.id = spotIndex;
            rightGlove.userData.isTarget = isTarget;
            potatoGroup.add(rightGlove);

            // === Shoes (red cubes) ===
            const leftShoe = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.2, 0.4),
                gloveMaterial
            );
            leftShoe.position.set(-0.3, 0.05, 0.1);
            leftShoe.userData.id = spotIndex;
            leftShoe.userData.isTarget = isTarget;
            potatoGroup.add(leftShoe);

            const rightShoe = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.2, 0.4),
                gloveMaterial
            );
            rightShoe.position.set(0.3, 0.05, 0.1);
            rightShoe.userData.id = spotIndex;
            rightShoe.userData.isTarget = isTarget;
            potatoGroup.add(rightShoe);

            // === Face (on front of body) ===
            // Eyes (white with black pupils)
            const eyeWhiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
            const pupilMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });

            // Left eye (always open)
            const leftEyeWhite = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.3, 0.05),
                eyeWhiteMaterial
            );
            leftEyeWhite.position.set(-0.25, 2.1, 0.43);
            potatoGroup.add(leftEyeWhite);

            const leftPupil = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.15, 0.06),
                pupilMaterial
            );
            leftPupil.position.set(-0.25, 2.05, 0.46);
            potatoGroup.add(leftPupil);

            // Right eye - WINK for target (closed eye), normal for others
            if (isTarget) {
                // Winking eye: just a thin horizontal line (closed)
                const winkLine = new THREE.Mesh(
                    new THREE.BoxGeometry(0.3, 0.06, 0.05),
                    pupilMaterial
                );
                winkLine.position.set(0.25, 2.05, 0.43);
                winkLine.userData.id = spotIndex;
                winkLine.userData.isTarget = true;
                potatoGroup.add(winkLine);
            } else {
                // Normal open eye
                const rightEyeWhite = new THREE.Mesh(
                    new THREE.BoxGeometry(0.25, 0.3, 0.05),
                    eyeWhiteMaterial
                );
                rightEyeWhite.position.set(0.25, 2.1, 0.43);
                potatoGroup.add(rightEyeWhite);

                const rightPupil = new THREE.Mesh(
                    new THREE.BoxGeometry(0.12, 0.15, 0.06),
                    pupilMaterial
                );
                rightPupil.position.set(0.25, 2.05, 0.46);
                potatoGroup.add(rightPupil);
            }

            // Mouth - slightly different color for target (pink vs red)
            const mouthColor = isTarget ? 0xFF69B4 : 0xCC0000; // Pink for target, red for others
            const mouthMaterial = new THREE.MeshLambertMaterial({ color: mouthColor });
            const mouth = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.1, 0.05),
                mouthMaterial
            );
            mouth.position.set(0, 1.6, 0.43);
            potatoGroup.add(mouth);

            // Apply shadow settings to all potato meshes
            potatoGroup.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });

            // Apply edge outlines to potato
            addEdgesOutline(potatoGroup, 15, 0x000000);

            return potatoGroup;
        }


        // Create all potato characters
        for (let i = 0; i < spots.length; i++) {
            const spot = spots[i];
            const isTarget = spot.isTarget;

            // Create voxel potato
            const potato = createVoxelPotato(isTarget, spot.index);
            potato.scale.setScalar(isTarget ? 1.1 : 1.0); // Target slightly bigger
            spot.group.add(potato);

            await delay(30);
        }
    }


    function onSelect(event) {
        if (!isPlaying || !renderer) return;


        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;

        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(models, true);

        if (intersects.length > 0) {
            const hit = intersects[0].object;

            // Visual feedback: flash the hit model
            const originalColor = hit.material ? hit.material.emissive?.clone() : null;
            if (hit.material && hit.material.emissive) {
                hit.material.emissive.setHex(0xffff00);
                setTimeout(() => {
                    if (originalColor) hit.material.emissive.copy(originalColor);
                    else hit.material.emissive.setHex(0x000000);
                }, 200);
            }

            // Text feedback
            if (hit.userData.isTarget) {
                showTapText(clientX, clientY, '🎉 あたり！ +100', '#FFD700');
                score += 100;
                document.getElementById('sg-score').textContent = score;

                // Confetti effect!
                const hitPosition = intersects[0].point;
                spawnConfetti(hitPosition);

                resetRound();
            } else {
                const messages = ['タップ！', 'ちがうよ〜', 'ハズレ', 'おしい！', 'ポテト！'];
                const randomMsg = messages[Math.floor(Math.random() * messages.length)];
                showTapText(clientX, clientY, randomMsg, '#FFFFFF');
            }
        }
    }

    // Confetti particle effect
    function spawnConfetti(position) {
        const confettiColors = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0x95E1D3, 0xF38181, 0xAA96DA, 0xFCBAD3];
        const confettiCount = 30;
        const confettiPieces = [];

        for (let i = 0; i < confettiCount; i++) {
            const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            const piece = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.2, 0.2),
                new THREE.MeshLambertMaterial({ color: color })
            );

            piece.position.copy(position);
            piece.position.y += 1;

            // Random velocity
            piece.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.4,
                Math.random() * 0.3 + 0.2,
                (Math.random() - 0.5) * 0.4
            );
            piece.userData.rotSpeed = new THREE.Vector3(
                Math.random() * 0.2,
                Math.random() * 0.2,
                Math.random() * 0.2
            );
            piece.userData.life = 60; // frames

            scene.add(piece);
            confettiPieces.push(piece);
        }

        // Animate confetti
        function animateConfetti() {
            let allDead = true;
            confettiPieces.forEach(piece => {
                if (piece.userData.life > 0) {
                    allDead = false;
                    piece.position.add(piece.userData.velocity);
                    piece.userData.velocity.y -= 0.015; // gravity
                    piece.rotation.x += piece.userData.rotSpeed.x;
                    piece.rotation.y += piece.userData.rotSpeed.y;
                    piece.rotation.z += piece.userData.rotSpeed.z;
                    piece.userData.life--;

                    // Fade out
                    if (piece.userData.life < 20) {
                        piece.material.transparent = true;
                        piece.material.opacity = piece.userData.life / 20;
                    }
                } else if (piece.parent) {
                    scene.remove(piece);
                }
            });

            if (!allDead) {
                requestAnimationFrame(animateConfetti);
            }
        }
        animateConfetti();
    }


    function showTapText(x, y, text, color) {
        const el = document.createElement('div');
        el.className = 'sg-tap-text';
        el.textContent = text;
        el.style.position = 'fixed'; // Changed from implicit static
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transform = 'translate(-50%, -50%)'; // Center alignment
        el.style.color = color;
        el.style.zIndex = '2000'; // High z-index to show above UI
        el.style.fontWeight = 'bold';
        el.style.fontSize = '1.5rem';
        el.style.textShadow = '0 0 5px black';
        el.style.pointerEvents = 'none';
        container.appendChild(el);
        setTimeout(() => el.remove(), 1500); // Slightly longer display
    }

    async function resetRound() {
        // Clear models
        models.forEach(m => {
            if (m.parent) m.parent.remove(m);
        });
        models = [];
        await spawnClonesSequential();
    }

    function handleInteraction() {
        // Ignore if not playing or no target
        if (!isPlaying || !window.sgCurrentTarget) return;

        const target = window.sgCurrentTarget;

        // Get current coins
        const currentCoins = window.sgItemData ? window.sgItemData.collected : 0;

        // --- Case A: Vending Machine (BUY) ---
        if (target.userData.isVendingMachine) {

            if (currentCoins >= 10) {
                // === Game Clear! ===
                console.log("Juice Purchased! Game Clear!");

                // Start Ending Cinematic
                transitionToEnding();

            } else {
                // === Not Enough Coins ===
                const missing = 10 - currentCoins;
                showTapText(window.innerWidth / 2, window.innerHeight / 2, `あと ${missing} 枚足りないよ！`, '#FF4500');
            }
            return;
        }

        // --- Case B: Coin (GET) ---
        if (target.userData.isCoin || target.userData.isTargetItem) {
            // Coin collection
            const parentGroup = target.parent && target.parent.type === 'Group' ? target.parent : target;
            scene.remove(parentGroup); // Remove from scene
            if (parentGroup !== target) scene.remove(target); // Ensure self is removed if not group

            // Update coins
            if (window.sgItemData) {
                window.sgItemData.collected++;
                const counter = document.getElementById('sg-coin-counter');
                if (counter) counter.textContent = window.sgItemData.collected;

                // Play sound (Beep)
                const audio = new AudioContext(); // Simple beep
                const osc = audio.createOscillator();
                const gain = audio.createGain();
                osc.connect(gain);
                gain.connect(audio.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, audio.currentTime); // A5
                gain.gain.setValueAtTime(0.1, audio.currentTime);
                osc.start();
                osc.stop(audio.currentTime + 0.1);
            }

            // Hide button
            window.sgCurrentTarget = null;
            const getBtn = document.getElementById('sg-get-btn');
            if (getBtn) getBtn.style.display = 'none';
        }
    }

    // === Pro Game Loop ===
    function gameLoop(now) {
        if (!isPlaying && currentState !== GameState.ENDING) return; // Only stop if not ENDING (ENDING uses loop for animation)

        // DeltaTime Calculation
        let dt = (now - lastTime) / 1000;
        lastTime = now;

        // Cap dt to prevent spiral of death (max 0.1s)
        if (dt > 0.1) dt = 0.1;

        accumulator += dt;

        while (accumulator >= FIXED_STEP) {
            update(FIXED_STEP);
            accumulator -= FIXED_STEP;
        }

        render();
        animationId = requestAnimationFrame(gameLoop);
    }

    function update(dt) {
        if (mixer) mixer.update(dt);

        // ★ ENDING専用処理
        if (currentState === GameState.ENDING) {
            updateEndingAnimation(dt);
            return;
        }

        // ★ OPENING専用処理（PLAYINGでは完全にスキップ）
        if (currentState === GameState.OPENING) {
            // Opening effects are handled in startOpeningSequence interval
            return; // Skip gameplay update during opening
        }

        // ★ PLAYING専用処理
        if (currentState === GameState.PLAYING) {
            // Gameplay Update
            if (window.sgUpdateMovement) window.sgUpdateMovement(dt);

            // ★ UI Update (Coin Button)
            updateUI();


            // Coin Rotation (3.0 rad/sec)
            if (window.sgGameCoins) {
                window.sgGameCoins.forEach(coin => {
                    if (coin.visible) coin.rotation.y += 3.0 * dt;
                });
            }

            // Gameplay NPC Shiver (Winter Only)
            updateGameplayShiver(dt);

            // Aim Detection (Moved from loop)
            // ★ Deprecated: Click interaction implemented instead
            // updateAim();
        }
    }


    function updateAim() {
        // === AIM DETECTION (Raycaster from center of screen) ===
        const getBtn = document.getElementById('sg-get-btn');
        const crosshair = document.getElementById('sg-crosshair');

        if (getBtn && camera && crosshair) {
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

            // Objects to interact with: Coins + Scene Children (for Vending HitBox)
            const intersects = raycaster.intersectObjects(scene.children, true);

            let targetFound = null;
            let targetType = null; // 'coin' or 'vending'

            for (const hit of intersects) {
                const obj = hit.object;

                // 1. Vending Machine HitBox
                if (obj.userData.isVendingMachine && hit.distance <= 4.0) {
                    targetFound = obj;
                    targetType = 'vending';
                    break; // Priority
                }

                // 2. Coin (game items) - check parent group or mesh
                let coinGroup = obj;
                while (coinGroup.parent && !coinGroup.userData.isCoin && coinGroup !== scene) {
                    coinGroup = coinGroup.parent;
                }

                if (coinGroup.userData.isCoin && !coinGroup.userData.collected && hit.distance <= 3.0) {
                    targetFound = coinGroup;
                    targetType = 'coin';
                    break;
                }
            }

            if (targetFound) {
                // Target locked
                window.sgCurrentTarget = targetFound;
                crosshair.classList.add('target-locked');
                getBtn.style.display = 'block';

                // Position button near crosshair
                getBtn.style.left = '50%';
                getBtn.style.top = '60%';
                getBtn.style.transform = 'translate(-50%, -50%)';

                if (targetType === 'vending') {
                    getBtn.innerHTML = '🍹<br>BUY';
                } else {
                    getBtn.innerHTML = '🖐️<br>GET!';
                }
            } else {
                // No target
                window.sgCurrentTarget = null;
                crosshair.classList.remove('target-locked');
                getBtn.style.display = 'none';
            }
        }
    }

    function render() {
        if (renderer && scene && camera) {
            // Debug Log for Ending Camera
            if (currentState === GameState.ENDING) {
                // Throttle log to once per second approx? No, user asked for it. 
                // But let's simple throttle to avoid console flood 60fps
                if (Math.random() < 0.01) {
                    console.log('RENDER CAMERA', currentState, camera.uuid, camera.position.toArray());
                }
            }
            renderer.render(scene, camera);
        }
    }



    // ==========================================
    // 雲 (Cloud) の配置と季節カラー管理
    // ==========================================
    function spawnClouds() {
        console.log("--- spawnClouds CALLED ---");

        window.sgCloudObjects = []; // 雲管理用配列

        // ★ 雲の色パレット (Emissive発光色)
        const CLOUD_COLORS = {
            spring: 0x443344, // ほんのり桜色
            summer: 0x333333, // 通常の白（グレー発光）
            autumn: 0x663322, // ★夕暮れ（赤みのある暖色グレー）
            winter: 0x444455  // 雪雲（青みのあるグレー）
        };

        // ★ 雲の色変更関数
        window.setCloudSeason = (seasonName) => {
            console.log(`Setting Cloud Season to: ${seasonName}`);
            const colorHex = CLOUD_COLORS[seasonName] || CLOUD_COLORS.summer;

            window.sgCloudObjects.forEach(cloud => {
                cloud.traverse(child => {
                    if (child.isMesh && child.material) {
                        // エミッシブカラー（発光色）を変更して色味を変える
                        if (child.material.emissive) {
                            child.material.emissive.setHex(colorHex);
                        }
                    }
                });
            });
        };

        const loader = new FBXLoader();
        loader.load('models/cloud.fbx', (masterCloud) => {
            console.log("Cloud Loaded: cloud.fbx");

            masterCloud.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = false;

                    if (child.material) {
                        child.material.fog = false; // フォグの影響を受けない
                        // 初期色設定
                        if (child.material.emissive) {
                            child.material.emissive.setHex(CLOUD_COLORS.summer);
                        }
                    }
                }
            });

            const cloudCount = 15;
            for (let i = 0; i < cloudCount; i++) {
                const cloud = masterCloud.clone();
                const x = (Math.random() - 0.5) * 100;
                const z = (Math.random() - 0.5) * 100;
                const y = 15 + Math.random() * 10;

                cloud.position.set(x, y, z);
                cloud.rotation.y = Math.random() * Math.PI * 2;
                cloud.scale.setScalar(0.8 + Math.random() * 0.7);

                scene.add(cloud);
                window.sgCloudObjects.push(cloud);
            }

            console.log(`${cloudCount} clouds placed.`);

            // ★現在の季節を適用
            if (typeof GameConfig !== 'undefined' && GameConfig.currentSeason) {
                window.setCloudSeason(GameConfig.currentSeason);
            } else {
                window.setCloudSeason('summer');
            }

        }, undefined, (error) => {
            console.error("Error loading cloud.fbx:", error);
        });
    }

    // ==========================================
    // 草 (Grass) の配置と季節カラー管理
    // ==========================================
    function spawnGrass() {
        console.log("--- spawnGrass CALLED ---");

        // ★ 季節ごとのカラーパレット定義 (ここをいじれば色が変えられます)
        const GRASS_PALETTES = {
            spring: [
                0x90EE90, // LightGreen
                0x98FB98, // PaleGreen
                0xADFF2F  // GreenYellow (新芽の色)
            ],
            summer: [
                0x66BB6A, // 鮮やかな緑
                0x43A047, // 少し濃い緑
                0x81C784, // 淡い緑
                0x9CCC65  // 黄緑っぽい緑
            ],
            autumn: [
                0xCD853F, // ペルー (乾いた土色)
                0xDAA520, // ゴールデンロッド (枯れ草色)
                0x8B4513  // サドルブラウン
            ],
            winter: [
                0xDDDDDD, // 冬の色
            ]
        };

        window.sgGrassObjects = []; // 草オブジェクト管理用

        // ★ 季節切り替え関数のアップデート
        window.setGrassSeason = (seasonName) => {
            console.log(`Setting Grass Season to: ${seasonName}`);

            // パレットを取得 (未定義なら夏をデフォルトに)
            const palette = GRASS_PALETTES[seasonName] || GRASS_PALETTES.summer;
            const isMultiColor = palette.length > 1;

            window.sgGrassObjects.forEach((grass, index) => {
                // ランダムに色を選ぶ (indexを使ってバラけさせる)
                const colorHex = isMultiColor
                    ? palette[index % palette.length]
                    : palette[0];

                const colorObj = new THREE.Color(colorHex);

                grass.traverse(child => {
                    if (child.isMesh && child.material) {
                        // 色を乗算 (白～グレーのモデルに色が乗る)
                        if (child.material.color) {
                            child.material.color.copy(colorObj);
                        }
                    }
                });
            });
            console.log(`Updated ${window.sgGrassObjects.length} grass patches to ${seasonName}.`);
        };


        const loader = new FBXLoader();
        loader.load('models/grass.fbx', (masterGrass) => {
            console.log("Grass Loaded: grass.fbx");

            masterGrass.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // 地面判定無視
                    child.userData.ignoreGround = true;

                    // ★重要: マテリアルをクローンして、個別に色を変えられるようにする
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(m => m.clone());
                        } else {
                            child.material = child.material.clone();
                        }

                        // 自己発光を少し抑えめにセット (影をきれいに出すため)
                        if (child.material.emissive) {
                            child.material.emissive.setHex(0x000000);
                        }
                    }
                }
            });

            // アウトライン追加
            if (typeof window.addEdgesOutline === 'function') {
                window.addEdgesOutline(masterGrass, 15, 0x000000);
            }

            // 草の配置数
            const grassCount = 200;

            for (let i = 0; i < grassCount; i++) {
                const grass = masterGrass.clone();

                // ランダム配置
                const x = (Math.random() - 0.5) * 50;
                const z = (Math.random() - 0.5) * 50;
                grass.position.set(x, 0, z);

                // ランダム回転
                grass.rotation.y = Math.random() * Math.PI * 2;

                // ランダムスケール
                const scale = 5.0 + Math.random() * 3.0;
                grass.scale.setScalar(scale);

                scene.add(grass);
                window.sgGrassObjects.push(grass);
            }

            console.log(`${grassCount} grass patches placed.`);

            // ★修正: GameConfig.currentSeason を使用
            window.setGrassSeason(GameConfig.currentSeason);

        }, undefined, (error) => {
            console.error("Error loading grass.fbx:", error);
        });
    }

    // ==========================================
    // 土管 (Dokan) の特別配置
    // 中は通り抜け可能、上にも乗れる
    // ==========================================
    function spawnDokan() {
        console.log("--- spawnDokan CALLED ---");

        loader.load('models/ceramic_pipe.fbx', (fbx) => {
            console.log("Dokan Loaded: ceramic_pipe.fbx");

            // スケールと回転を設定
            fbx.scale.setScalar(2.0);  // 2倍サイズ
            // 【修正】土管の向きを90度回転させ、Z軸（通路の向き）に合わせる
            fbx.rotation.set(0, Math.PI / 2, 0);

            // バウンディングボックスを計算して底面をY=0に設置
            fbx.updateMatrixWorld(true);
            const box = new THREE.Box3().setFromObject(fbx);
            const bottomY = box.min.y; // モデルの最下部Y
            const groundY = 0 - bottomY; // 底面をY=0に合わせるオフセット

            fbx.position.set(14, groundY, 12);

            // デバッグログ
            console.log('Dokan bounding box min:', box.min.toArray());
            console.log('Dokan bounding box max:', box.max.toArray());
            console.log('Dokan ground offset:', groundY);
            console.log('Dokan final position:', fbx.position.toArray());

            // ★【修正】土管モデル自体は「地面判定」から除外する
            // これにより、中に入っても天井にワープせず、地面を歩けるようになる
            fbx.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // 地面判定（Raycaster）で無視させるフラグ
                    child.userData.ignoreGround = true;
                }
            });

            scene.add(fbx);

            // アウトライン追加
            if (typeof window.addEdgesOutline === 'function') {
                window.addEdgesOutline(fbx, 20, 0x000000);
            }

            // ★【追加】上に乗るための「透明な天井板」を作成
            // 土管のサイズ(Scale 2.0)に合わせて調整
            const roofGeo = new THREE.BoxGeometry(1.6, 0.2, 3.2);
            const roofMat = new THREE.MeshBasicMaterial({
                color: 0x00FF00,
                wireframe: true,
                visible: false    // ★【修正】不可視に変更 (判定のみ有効)
            });
            const roof = new THREE.Mesh(roofGeo, roofMat);

            // 土管の天辺付近に配置
            roof.position.set(14, 2.0, 12);
            scene.add(roof);
            console.log('Dokan roof platform added at:', roof.position.toArray());

            console.log('Dokan added to scene at:', fbx.position.toArray());

            // ★【修正】実測サイズに基づく衝突判定の生成
            // バウンディングボックスから正確なサイズを取得
            fbx.updateMatrixWorld(true);
            const pipeBox = new THREE.Box3().setFromObject(fbx);

            const pipeWidthX = pipeBox.max.x - pipeBox.min.x; // 幅
            const pipeHeight = pipeBox.max.y - pipeBox.min.y; // 高さ (Y)
            const pipeLength = pipeBox.max.z - pipeBox.min.z; // 長さ (Z)

            console.log(`Dokan Collision: H=${pipeHeight.toFixed(2)}, L=${pipeLength.toFixed(2)}`);

            // 土管の中心座標
            const dokanX = 14;
            const dokanZ = 12;

            // ★パラメータ設定
            const innerGap = 0.5;  // 中心から内壁まで0.5m (通路幅1.0m)
            const wallThick = 0.1; // ★壁の厚さを0.1mに変更 (激薄設定)

            // 衝突判定のリセット
            window.sgExtraObstacles = [];

            // 左の壁 (Z方向の長さは実測値 pipeLength を使用)
            window.sgExtraObstacles.push({
                minX: dokanX - innerGap - wallThick,
                maxX: dokanX - innerGap,
                minZ: dokanZ - pipeLength / 2,
                maxZ: dokanZ + pipeLength / 2
            });

            // 右の壁
            window.sgExtraObstacles.push({
                minX: dokanX + innerGap,
                maxX: dokanX + innerGap + wallThick,
                minZ: dokanZ - pipeLength / 2,
                maxZ: dokanZ + pipeLength / 2
            });

            // ★デバッグ表示 (実測サイズに合わせる)
            const debugGroup = new THREE.Group();
            debugGroup.name = 'DokanDebugWalls';

            // ★【修正】調整完了につき非表示にする (判定は残る)
            debugGroup.visible = false;

            window.sgExtraObstacles.forEach(obs => {
                const w = obs.maxX - obs.minX;
                const h = pipeHeight; // ★高さも実測値に合わせる (約2mになるはず)
                const d = obs.maxZ - obs.minZ; // ここが自動的に3.0mになります
                const x = (obs.minX + obs.maxX) / 2;
                const z = (obs.minZ + obs.maxZ) / 2;

                const boxMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(w, h, d),
                    new THREE.MeshBasicMaterial({ color: 0xFF0000, wireframe: true })
                );
                // 高さは地面(0)から積み上げるので y = h/2
                boxMesh.position.set(x, h / 2, z);
                debugGroup.add(boxMesh);
            });
            scene.add(debugGroup);
            console.log('Dokan debug walls hidden (Physics active)');

        }, undefined, (error) => {
            console.error("Error loading ceramic_pipe.fbx:", error);
        });
    }

    // spawnDokan() は initThreeJS() 内から呼び出す（scene初期化後）

    return { setup, init, start, stop };
})();



// ★季節の初期化（草・木・空の色を適用）
if (typeof window.setGameSeason === 'function') {
    window.setGameSeason(GameConfig.currentSeason);
}

// Init
initGameSystem();
// document.addEventListener('DOMContentLoaded', initGameSystem);
