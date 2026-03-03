import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

// Global Cache for Tree Optimization
let masterTreeModel = null;



/**
 * 🎵 AntiGravity Audio Manager (AGAM) - 2D Pure Edition
 * 3D音響機能を完全に削除し、全デバイスで確実な再生を保証するシンプル設計
 */
const AudioManager = {
    context: null,
    buffers: {},    // 音声データの保管庫
    activeSources: {}, // ループ再生中のソース管理
    isUnlocked: false,

    // ■ 1. 初期化 (カメラ不要)
    init: function () {
        if (this.context) return;

        // AudioContextの生成
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();

        console.log("🔊 AudioManager: Context Created (2D Only)");

        // iOSアンロックの罠を仕掛ける
        this.setupUnlock();
    },

    // ■ 2. 音声ファイルのロード
    load: function (key, url) {
        if (!this.context) this.init();

        return new Promise((resolve, reject) => {
            if (this.buffers[key]) {
                resolve(this.buffers[key]);
                return;
            }

            const loader = new THREE.AudioLoader();
            loader.load(url, (buffer) => {
                this.buffers[key] = buffer;
                console.log(`💿 Loaded Audio: ${key}`);
                resolve(buffer);
            }, undefined, (err) => {
                console.error(`❌ Failed to load audio: ${key}`, err);
                reject(err);
            });
        });
    },

    // ■ 3. 再生（シンプルかつ堅牢）
    play: function (key, volume = 1.0) {
        // バッファが無い場合は無視
        if (!this.buffers[key]) return;

        // iOS対策: 再生直前にコンテキストの状態を確認
        if (this.context.state === 'suspended') {
            this.context.resume().catch(e => console.error(e));
        }

        const source = this.context.createBufferSource();
        source.buffer = this.buffers[key];

        const gainNode = this.context.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.context.destination);

        // iOS対策: currentTime 指定
        source.start(this.context.currentTime);
    },

    // ■ 3-B. ループ再生（新規追加）
    playLoop: function (key, volume = 1.0) {
        if (!this.buffers[key]) return;
        if (this.activeSources[key]) return; // 既に再生中なら何もしない

        if (this.context.state === 'suspended') {
            this.context.resume().catch(e => console.error(e));
        }

        const source = this.context.createBufferSource();
        source.buffer = this.buffers[key];
        source.loop = true; // ループ有効化

        const gainNode = this.context.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.context.destination);

        source.start(this.context.currentTime);
        this.activeSources[key] = source; // 管理リストに追加
    },

    // ■ 3-C. ループ停止（新規追加）
    stopLoop: function (key) {
        const source = this.activeSources[key];
        if (source) {
            try {
                source.stop();
            } catch (e) { console.error(e); }
            delete this.activeSources[key];
        }
    },

    // (以前ここにあった play3D 関数は削除されました)

    // ■ 4. iOS強力アンロック
    setupUnlock: function () {
        const unlock = () => {
            if (this.isUnlocked) return;

            if (this.context.state === 'suspended') {
                this.context.resume();
            }

            const emptyBuffer = this.context.createBuffer(1, 1, 22050);
            const source = this.context.createBufferSource();
            source.buffer = emptyBuffer;
            source.connect(this.context.destination);
            source.start(0);

            console.log("🔓 AudioManager: Unlocked!");
            this.isUnlocked = true;

            ['touchstart', 'touchend', 'click', 'keydown'].forEach(evt => {
                document.removeEventListener(evt, unlock);
            });
        };

        ['touchstart', 'touchend', 'click', 'keydown'].forEach(evt => {
            document.addEventListener(evt, unlock, { once: true, capture: true });
        });
    }
};

// グローバル公開
window.AudioManager = AudioManager;

/* Mini-Game System Controller */

// ★季節管理＆開発設定の司令塔
const GameConfig = {
    currentSeason: 'winter', // 冬仕様に変更
    debugMode: false          // ★通常モードに変更 (一時的)
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
        // 通常モード
        start: () => SearchGame.start({ skipOpening: false }),
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

    // ★修正: メニューをバイパスして直接 3d-search を開始する
    fabBtn.addEventListener('click', () => {
        // メニューを開く時と同じようにオーバレイを表示し、スクロールを固定する
        scrollPos = window.pageYOffset;
        overlay.classList.remove('hidden');
        document.body.classList.add('modal-open');
        document.body.style.top = `-${scrollPos}px`;

        // 強制的にメニュー層を非表示にする
        if (menuContainer) menuContainer.classList.add('hidden');
        if (introContainer) introContainer.classList.add('hidden');

        currentActiveGameId = '3d-search';
        // launchGame内でactiveGameContainerが表示される
        launchGame();
    });

    // Close Button (Portal Level)
    const closeBtn = document.getElementById('portal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closePortal);

    // Intro Buttons
    const startBtn = document.getElementById('intro-start-btn');
    if (startBtn) startBtn.addEventListener('click', launchGame);

    // ==========================================
    // iOS/Mobile Audio Unlock (Robust Version)
    // ==========================================
    // ==========================================
    // iOS/Mobile Audio Unlock
    // ==========================================
    // AudioManagerに統合されたため削除 (AudioManager.setupUnlock)

    // Initialize Menu Buttons (Continued)

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
    if (typeof PotatoAction !== 'undefined') PotatoAction.setup(activeGameContainer);
    if (typeof SearchGame !== 'undefined') SearchGame.setup(activeGameContainer);

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

    const titleEl = document.getElementById('intro-title');
    if (titleEl) titleEl.textContent = game.shortTitle || game.title;

    const descEl = document.getElementById('intro-desc');
    if (descEl) descEl.textContent = game.description;

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


window.hasUnlockedPrize = false; // Persistent for current session/run

function showGameOver(score) {
    activeGameContainer.classList.add('hidden');
    gameOverContainer.classList.remove('hidden');
    const scoreEl = document.getElementById('final-score-value');
    if (scoreEl) scoreEl.textContent = score;

    const prizeUI = document.getElementById('prize-container');
    const prizeLink = document.getElementById('prize-link');
    const prizeStatus = document.getElementById('prize-status');

    // Unlock condition: Special Rare Item collected OR Score >= 1000
    if (window.hasUnlockedPrize || score >= 1000) {
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
window.showGameOver = showGameOver;

/* =========================================
   GAME MODULE: PotatoAction (Pro Loop Ver)
   ========================================= */
/*
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
        if (!isPlaying || !player) return; // Guard player
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
            const scoreEl = document.getElementById('pa-score');
            if (scoreEl) scoreEl.textContent = score;
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
    function spawnSparkles(x, y, z) {
        if (typeof spawnSparkles === 'function' && arguments.length === 2) {
            // Backward compatibility for 2D UI calls
            spawnParticles(x, y, ['#FFD700', '#FFA500', '#FFFF00', '#FFFFFF'], 'pa-particle');
            return;
        }
        // 3D/World calls (via window.spawnSparkles override)
        // Note: The original spawnSparkles was UI based (x,y). 
        // The user request defines window.spawnSparkles = (x,y,z) => ...
        // We will perform the override via global assignment as requested by the user prompt structure style,
        // or directly modify here if this is the only definition.

        // HOWEVER, the user specifically asked to "Update spawnSparkles function (around line 2090? - actually 640 here)"
        // AND requested: window.spawnSparkles = (x, y, z) => { ... }

        // Let's stick to the user's specific block implementation for the global scope to handle the 3D logic,
        // but here we are in the potatoAction module scope.
        // The user's request #1 says "spawnSparkles function extension" but the code example shows `window.spawnSparkles = ...`

        // Let's implement the user's requested logic by exposing it or modifying the loop.
        // Actually, looking at the user request, they want me to simple ADD the logic to the loop and update the function.
        // The function at 640 is inside PotatoAction.

        spawnParticles(x, y, ['#FFD700', '#FFA500', '#FFFF00', '#FFFFFF'], 'pa-particle');
    }
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
*/

/* =========================================
   GAME MODULE: 3D Search Game
   ========================================= */
const SearchGame = (() => {
    let container;
    let scene, camera, renderer, controls;
    let groundRaycaster = new THREE.Raycaster(); // Persistent raycaster
    let raycastFrameCounter = 0;                 // Counter for throttling
    let lastGroundHeight = 0;                    // Cached ground height

    // ★★★ ParkState ★★★
    const ParkState = {
        vegetationMode: 'forestOnly'
        // 'forestOnly' | 'allOff' | 'allOn'
    };


    // ★★★ Forest Area Definition ★★★
    function isInsideForestArea(x, z) {
        return (x < -2 && z < -2);
    }

    // ★★★ Park Zone Definition ★★★
    function getParkZone(x, z) {
        // 十字路
        if (Math.abs(x) < 5 || Math.abs(z) < 5) return 'crossroad';

        // 中央広場（噴水）
        if (x * x + z * z < 100) return 'plaza';

        // 北西：休憩エリア
        if (x < -2 && z < -2) return 'rest';

        // 北東：池エリア建設予定
        if (x > 2 && z < -2) return 'vacant';

        // 南西：森林エリア
        if (x < -2 && z > 2) return 'forest';

        // 南東：遊具エリア
        if (x > 2 && z > 2) return 'playground';

        return 'unknown';
    }

    // ★★★ ExclusionManager ★★★
    const ExclusionManager = (() => {
        const zones = [];

        function checkStaticRules(x, z) {
            const zone = getParkZone(x, z);

            if (ParkState.vegetationMode === 'allOff') return true;

            if (ParkState.vegetationMode === 'forestOnly') {
                return zone !== 'forest';
            }

            // 各エリア別の禁止ルール（名称をリライト後のものに同期）
            if (zone === 'crossroad') return true;
            if (zone === 'plaza') return true;
            if (zone === 'rest') return true;
            if (zone === 'vacant') return true;
            if (zone === 'playground') return true;

            // forest のみ許可
            if (zone === 'forest') return false;

            return true;
        }

        return {
            addCircle: (x, z, r) => zones.push({ x, z, r }),
            isBlocked: (x, z) =>
                checkStaticRules(x, z) ||
                zones.some(zItem =>
                    (x - zItem.x) ** 2 + (z - zItem.z) ** 2 < zItem.r ** 2
                ),
            reset: () => { zones.length = 0; }
        };
    })();


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
    // ★追加: プレイヤーの向き (モジュールスコープ)
    let playerFacing = 0; // 初期値: 南向き

    // Camera Control Variables (Module Scope for access from transitionToGameplay)
    let cameraDistance = 0; // 0 = FPS, 10 = max TPS
    let cameraAngle = Math.PI; // Horizontal orbit angle
    let cameraPitch = 0; // Vertical look angle

    // === NPC Position/Rotation Constants (Shared across seasons) ===
    // ★修正: North = -Z System. Inverted Z coordinates.
    const NPC_CONFIG = {
        opening: {
            position: { x: -11, z: 5 },  // Old: -5. Inverted: 5
            rotation: 0,
        },
        gameplay: {
            position: { x: -13, z: 8 },  // Old: -8. Inverted: 8
            rotation: 0,
        },
        vendingMachine: { x: -11, z: 8 } // Old: -8. Inverted: 8
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
                    // ★修正: 北側入り口へ (North = -Z)
                    // Old: -27. Wait, checking logic.
                    // If Old "North" was +Z, then -27 was South?
                    // Let's stick to INVERTING whatever was there to flip the world.
                    // Old: -27. Inverted: 27.
                    // But standard park entrance is usually South (+Z).
                    // If we want "North Entrance", and North is -Z, then -27 is correct.
                    // Let's assume the user wants the player at the "Entrance".
                    // If Old Code said "North side entrance (Z = -27)", and Old North was +Z... then -27 was South?
                    // Confusion.
                    // Let's simply INVERT Z.
                    // Old: -27 -> New: 27.
                    // New 27 is South (+Z).
                    // If the user wants a North (-Z) coordinate system, South is +Z.
                    playerPosition.set(0, 0.6, 27);

                    // ★修正: プレイヤーの体は南向き(0)
                    if (typeof playerFacing !== 'undefined') playerFacing = 0;

                    // ★修正: カメラは0度で北(噴水の方)を向かせる
                    if (typeof cameraAngle !== 'undefined') cameraAngle = 0;
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
                playerPosition.set(0, 0.6, 27); // ★修正: デバッグ起動時と同一の元の場所に統一
                if (typeof playerFacing !== 'undefined') playerFacing = 0;
                if (typeof cameraAngle !== 'undefined') cameraAngle = 0;
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

        // Synced Position: Starts at Z=-2 (safe distance from Vending Machine at Z=8)
        // Old: 2. Inverted: -2.
        playerPosition.set(-11, 0.6, -2);

        // Sync Camera Angle to look at Vending Machine (North/Negative Z)
        cameraAngle = 0; // 0 = Looking -Z (North/Fountain)
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
            if (typeof playerPosition !== 'undefined') playerPosition.set(-13, 0.6, 5); // Old: -5. Inverted: 5.
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
        const baseCamPos = new THREE.Vector3(-11, 1.0, 2.5); // Old: -2.5. Inverted: 2.5
        camera.position.copy(baseCamPos);
        camera.lookAt(-11, 0.5, 5); // Old: -5. Inverted: 5

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
                            banzaiNPC.position.set(-10.5, 0, 7.0); // Old: -7.0. Inverted: 7.0
                            banzaiNPC.rotation.y = -Math.PI / 8;
                        } else {
                            // Emergency Spawn check
                            spawnEndingAssets(() => {
                                if (banzaiNPC) {
                                    addEndingObject(banzaiNPC);
                                    banzaiNPC.visible = false;
                                    banzaiNPC.position.set(-10.5, 0, 7.0); // Old: -7.0. Inverted: 7.0
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
        const targetContainer = document.getElementById('active-game-container');
        if (!targetContainer) {
            console.error("setupGameUI: active-game-container not found.");
            return;
        }

        // 親コンテナ設定（スクロールロック）
        if (getComputedStyle(targetContainer).position === 'static') {
            targetContainer.style.position = 'relative';
        }
        targetContainer.style.width = '100%';
        targetContainer.style.height = '100%';
        targetContainer.style.overflow = 'hidden';

        // ★修正点: 全操作エリアに 'touch-action: none' を適用し、ブラウザの干渉を無効化
        targetContainer.innerHTML = `
            <div id="sg-loading-overlay" style="position:absolute; inset:0; background:#87CEEB; z-index:2000; display:flex; justify-content:center; align-items:center; color:white; font-family:monospace; font-size:24px; font-weight:bold;">
                Now Loading...
            </div>
            
            <div id="sg-canvas-container" style="position:absolute; inset:0; background:#1a1a1a; z-index:0;"></div>

            <div id="sg-skip-btn" style="position:absolute; top:80px; right:20px; z-index:1500; color:white; font-weight:bold; border:2px solid white; background:rgba(0,0,0,0.5); padding:8px 16px; border-radius:6px; cursor:pointer; display:none;">
                SKIP ▶
            </div>

            <div id="floating-message" style="
                position: fixed; left: 50%; top: 30%; transform: translate(-50%, -50%);
                color: #FFFFFF; font-family: sans-serif; font-size: 24px; font-weight: bold;
                background: rgba(0, 0, 0, 0.8); border: 2px solid white; border-radius: 20px; padding: 15px 30px;
                text-shadow: none;
                pointer-events: none; z-index: 2147483647; display: none; white-space: nowrap;
            "></div>

            <div id="ui-container" style="position:absolute; inset:0; pointer-events:none; z-index:1000;">
                
                <div id="hud-top-left" style="pointer-events: auto; touch-action: none;">
                    <h1>ポテトコイン</h1>
                    <div id="score" style="display:none;">コイン: <span id="sg-coin-counter">0</span>/10</div>
                    <div id="tutorial-hint" style="display:none;">🎮 移動: D-Pad / 🦅 視点切替</div>
                </div>

                <div id="controls-bottom-left" style="pointer-events: auto; touch-action: none;">
                    <div id="dpad-cross">
                        <div class="dpad-empty"></div> <button id="dpad-up">▲</button> <div class="dpad-empty"></div> 
                        <button id="dpad-left">◀</button> <div id="dpad-center"></div> <button id="dpad-right">▶</button>
                        <div class="dpad-empty"></div> <button id="dpad-down">▼</button> <div class="dpad-empty"></div> 
                    </div>
                </div>

                <div id="controls-bottom-right" style="pointer-events: auto; touch-action: none;">
                    <button id="btn-action-pickup" class="action-btn pickup-btn" style="visibility: hidden; display: flex; pointer-events: none;">
                        <img src="assets/horseshoe_magnet.png" alt="GET">
                    </button>
                    <button id="toggle-view-btn" class="action-btn view-btn">🦅</button>
                </div>
            </div>
        `;

        // データの復元
        if (window.sgItemData && typeof window.sgItemData.collected === 'number') {
            const counter = document.getElementById('sg-coin-counter');
            if (counter) counter.textContent = window.sgItemData.collected;
        }

        // イベントバインド
        setTimeout(() => {
            if (typeof bindUIEvents === 'function') {
                bindUIEvents();
            } else {
                console.error("Critical: bindUIEvents is missing in this scope.");
            }
        }, 0);
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

                let nearestDistSq = 3.0 * 3.0;
                let targetCoin = null;

                scene.traverse((obj) => {
                    if (obj.userData.isCoin && !obj.userData.collected) {
                        const worldPos = new THREE.Vector3();
                        obj.getWorldPosition(worldPos);
                        const distSq = playerPosition.distanceToSquared(worldPos);
                        if (distSq < nearestDistSq) {
                            nearestDistSq = distSq;
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

    // === Update UI (Visibility Logic - Optimized) ===
    function updateUI() {
        const pickupBtn = document.getElementById('btn-action-pickup');
        if (!pickupBtn || typeof playerPosition === 'undefined') return;

        let nearCoinFound = false;
        const CHECK_DIST_SQ = 3.0 * 3.0; // 2乗距離で比較 (ルート計算回避)

        // ★最適化: scene.traverse を廃止し、管理配列のみをループさせる

        // 1. 通常コインのチェック
        const tempVec = new THREE.Vector3();
        if (window.sgGameCoins) {
            for (const coin of window.sgGameCoins) {
                if (coin.visible && !coin.userData.collected) {
                    coin.getWorldPosition(tempVec);
                    if (playerPosition.distanceToSquared(tempVec) < CHECK_DIST_SQ) {
                        nearCoinFound = true;
                        break;
                    }
                }
            }
        }

        // 2. 隠しコインのチェック (通常コインで見つかってなければ)
        if (!nearCoinFound && window.sgActiveCoins) {
            for (const coin of window.sgActiveCoins) {
                if (coin.visible && !coin.userData.collected) {
                    coin.getWorldPosition(tempVec);
                    if (playerPosition.distanceToSquared(tempVec) < CHECK_DIST_SQ) {
                        nearCoinFound = true;
                        break;
                    }
                }
            }
        }

        // Toggle Display
        if (nearCoinFound) {
            if (pickupBtn.style.visibility !== 'visible') {
                pickupBtn.style.visibility = 'visible';
                pickupBtn.style.pointerEvents = 'auto'; // ensure click works
                pickupBtn.style.animation = 'none';
                void pickupBtn.offsetWidth;
                pickupBtn.style.animation = 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }
        } else {
            if (pickupBtn.style.visibility !== 'hidden') {
                pickupBtn.style.visibility = 'hidden';
                pickupBtn.style.pointerEvents = 'none';
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

            // ★ 10枚達成メッセージ
            if (window.sgItemData.collected === 10) {
                if (window.showFloatingMessage) {
                    window.showFloatingMessage("ジュース、ポテトくんよろこんでくれたね～💕");
                }
            }

            // ★ 20枚達成メッセージ (追加)
            if (window.sgItemData.collected === 20) {
                if (window.showFloatingMessage) {
                    window.showFloatingMessage("すごい！20枚達成！ポテトくんからプレゼントがあるみたいだよ🎁（仮）");
                }
            }
        }

        // 3. 効果音
        // 3. 効果音 (AudioManager)
        window.AudioManager.play('coin', 0.8);

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
        // 位置は季節によって変わるため、ここでは初期化のみ
        dirLight.castShadow = true;

        // 修正: シャドウアクネ完全除去セット
        // bias: 影全体のオフセット。小さすぎるとアクネ、大きすぎると「ピーターパン現象（影が浮く）」
        dirLight.shadow.bias = -0.0001;
        // normalBias: 法線方向に影をずらす。平面のアクネにはこれが一番効きます！
        dirLight.shadow.normalBias = 0.02;

        // Shadow map settings
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
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
        camera = new THREE.PerspectiveCamera(75, width / height, 0.05, 1000); // Wider FOV, closer near plane
        camera.position.set(0, 0.6, -25); // Old: 25. Inverted: -25. (North Entrance?)
        // If 25 was "Entrance", and we Invert, it becomes -25.
        // If North = -Z, then -25 is North.
        // Standard park entrance is often South (+Z).
        // Let's assume standard inversion: 25 -> -25.
        camera.rotation.order = 'YXZ'; // Important for FPS camera
        camera.rotation.order = 'YXZ'; // Important for FPS camera

        // ★★★ Audio Managerの初期化 & リソースロード ★★★
        window.AudioManager.init();
        window.AudioManager.load('coin', 'assets/coin_se.mp3');
        window.AudioManager.load('cat', 'assets/cat_voice.mp3');
        window.AudioManager.load('thud', 'assets/thud.mp3');

        // ▼▼▼ 今回の追加箇所 (ここだけ追加) ▼▼▼
        window.AudioManager.load('boing', 'assets/boing.mp3');
        window.AudioManager.load('splash', 'assets/splash.mp3');
        window.AudioManager.load('psshhh', 'assets/psshhh.mp3');

        // ▼ 追加 ▼
        window.AudioManager.load('wheeee', 'assets/wheeee.mp3');
        // ▲▲▲ 追加ここまで ▲▲▲

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(1);
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
        // 修正: 柵(32m)に合わせて、ギリギリまで行けるよう31mに設定
        const BOUNDS = { min: -31, max: 31 };
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
        // Player position tracking (separate from camera)
        // playerPosition is now Module Scope
        playerPosition.set(0, 0.6, -25); // Old: 25. Inverted: -25.
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

        // PC用: マウス移動時のカーソル変化（コイン回収 ＆ リンク判定）
        renderer.domElement.addEventListener('mousemove', (event) => {
            if (!isPlaying) return;

            const rect = renderer.domElement.getBoundingClientRect();
            const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            hoverRaycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

            const intersects = hoverRaycaster.intersectObjects(scene.children, true);
            let cursorState = 'default'; // 'default' | 'magnet' | 'pointer'

            for (const hit of intersects) {
                // 1. リンク（看板）の判定 [距離5m以内]
                if (hit.distance <= 5.0 && hit.object.userData.isLink) {
                    cursorState = 'pointer';
                    break; // 最優先で決定
                }

                // 2. コイン・自販機の判定 [距離2.5m以内]
                if (hit.distance <= 2.5) {
                    const obj = hit.object;
                    // 親を遡ってターゲット確認
                    let targetGroup = obj;
                    while (targetGroup.parent && !targetGroup.userData.isCoin && !targetGroup.userData.isVendingMachine && targetGroup !== scene) {
                        targetGroup = targetGroup.parent;
                    }

                    // ターゲットが見つかったら磁石モード
                    if (targetGroup.userData.isVendingMachine || (targetGroup.userData.isCoin && !targetGroup.userData.collected)) {
                        cursorState = 'magnet';
                        break;
                    }
                }
            }

            // カーソルの適用（競合なし）
            if (cursorState === 'magnet') {
                document.body.style.cursor = "url('assets/horseshoe_magnet.png') 32 32, auto";
            } else if (cursorState === 'pointer') {
                document.body.style.cursor = 'pointer';
            } else {
                document.body.style.cursor = 'default';
            }
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

            // ★修正版: クリック判定ループ (完全版)
            for (const hit of intersects) {
                // 【最優先】無視フラグがあるオブジェクトは、何があっても即スキップ
                // これで透明なスコップ本体は絶対に反応しなくなります
                if (hit.object.userData.ignoreRaycast) continue;

                // 1. リンク（看板）の判定 [最優先・距離5m]
                if (hit.distance <= 5.0 && hit.object.userData.isLink && hit.object.userData.url) {
                    window.open(hit.object.userData.url, '_blank');
                    return;
                }

                const obj = hit.object;

                // 2. 距離チェック (プレイヤー足元基準)
                // 3.0m以上離れていたら、たとえヒットボックスでも反応しない
                const hitPos = new THREE.Vector3();
                obj.getWorldPosition(hitPos);

                if (typeof playerPosition !== 'undefined') {
                    // 高さの差を無視した水平距離で測るのが操作性向上のコツ
                    const dx = playerPosition.x - hitPos.x;
                    const dz = playerPosition.z - hitPos.z;
                    const distSq = dx * dx + dz * dz;
                    if (distSq > 3.0 * 3.0) continue; // 1.5m圏外なら無視
                } else {
                    if (hit.distance > 3.2) continue;
                }

                // --- ここから下は既存のターゲット特定ロジック ---

                // 親を遡って主要オブジェクト（Coin, Vending, Action持ち）を探す
                let targetGroup = obj;
                // isHitBoxなら、その親(parentItem)をターゲットとみなす
                if (obj.userData.isHitBox && obj.userData.parentItem) {
                    targetGroup = obj.userData.parentItem;
                } else {
                    while (targetGroup.parent && !targetGroup.userData.isCoin && !targetGroup.userData.isVendingMachine && targetGroup !== scene) {
                        targetGroup = targetGroup.parent;
                    }
                }

                const isCoin = targetGroup.userData.isCoin && !targetGroup.userData.collected;
                const isVending = targetGroup.userData.isVendingMachine;

                // インタラクティブ・オブジェクト（アクション持ち）の判定
                let interactable = targetGroup; // 上で特定したグループを使う

                // もし親にアクションがあればそれを使う
                while (interactable && !interactable.userData.action) {
                    interactable = interactable.parent;
                }

                // アクション実行
                if (interactable && interactable.userData.action) {
                    console.log("👆 Action Triggered:", interactable.name || 'Unnamed');
                    interactable.userData.action();
                    return;
                } else if (isCoin) {
                    collectCoin(targetGroup, clientX, clientY);
                    return;
                } else if (isVending) {
                    console.log("Vending Machine Clicked");
                    return;
                }
            }
        };

        // イベント登録
        // renderer.domElement.addEventListener('click', handleInputInteraction);
        // // タッチ環境での反応を良くするため touchstart も追加
        // renderer.domElement.addEventListener('touchstart', handleInputInteraction, { passive: false });

        /**
         * 【Phase 2 施工完了】スワイプとタップの完全分離 (Smart Tap System)
         * 既存の addEventListener('touchstart', ...) を無効化し、賢い判定に入れ替える
         */
        (() => {
            const canvas = renderer.domElement;

            // 2. スマートタップ判定用の変数
            let touchStartX = 0;
            let touchStartY = 0;
            let isSwiping = false;
            const TAP_THRESHOLD = 10; // 10px以上動いたら「スワイプ（視点移動）」とみなす

            // ■ タッチ開始：位置を記憶（まだGETしない！）
            canvas.addEventListener('touchstart', (e) => {
                if (e.touches.length > 0) {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                    isSwiping = false; // フラグリセット
                }
            }, { passive: false });

            // ■ タッチ移動：もし大きく動いたら「スワイプ中」と認定
            canvas.addEventListener('touchmove', (e) => {
                // 既にスワイプ判定済みなら計算不要
                if (isSwiping) return;

                if (e.touches.length > 0) {
                    const x = e.touches[0].clientX;
                    const y = e.touches[0].clientY;
                    // 移動距離を三平方の定理で計算
                    const dist = Math.sqrt(Math.pow(x - touchStartX, 2) + Math.pow(y - touchStartY, 2));

                    // 閾値を超えたら「これはカメラ操作だ！」と判定
                    if (dist > TAP_THRESHOLD) {
                        isSwiping = true;
                    }
                }
            }, { passive: false });

            // ■ タッチ終了：スワイプしてなければ「タップ」として処理実行！
            canvas.addEventListener('touchend', (e) => {
                // スワイプ判定されていたら、コイン判定はキャンセル（視点操作のみ）
                if (isSwiping) {
                    // console.log("👆 Swiped (Camera Move) - Interaction Ignored");
                    return;
                }

                console.log("👆 Tap Detected! Executing Interaction...");

                // 既存の handleInputInteraction を呼び出す
                // (touchend には touches がないので、changedTouches から座標を拾って偽装する)
                if (typeof handleInputInteraction === 'function' && e.changedTouches.length > 0) {
                    const t = e.changedTouches[0];

                    // 擬似イベントオブジェクトを作成
                    const fakeEvent = {
                        preventDefault: () => { },
                        clientX: t.clientX,
                        clientY: t.clientY,
                        // 既存関数が touches[0] を参照していても大丈夫なように配列化
                        touches: [{ clientX: t.clientX, clientY: t.clientY }],
                        type: 'touchstart', // 既存ロジックを騙すためにtouchstartとして送り込む
                        changedTouches: [{ clientX: t.clientX, clientY: t.clientY }]
                    };

                    // 実行！
                    handleInputInteraction(fakeEvent);
                }
            }, { passive: false });

            // マウスのクリックもサポート（PC用）
            canvas.addEventListener('click', handleInputInteraction);

            console.log("✅ Smart Tap System Installed: Swipes are no longer Taps!");
        })();

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
                case 'KeyC':
                    if (typeof GameConfig !== 'undefined' && GameConfig.debugMode) {
                        const x = camera.position.x.toFixed(2);
                        const z = camera.position.z.toFixed(2);
                        const y = camera.position.y.toFixed(2);

                        const code = `createCoin(${x}, ${z}, ${y});`;

                        console.log(`%c[COIN] ${code}`, 'color: #ffd700; font-weight: bold; font-size: 1.2em;');

                        const panel = document.getElementById('debug-pos-panel');
                        if (panel) {
                            const originalColor = panel.style.color;
                            panel.style.color = '#ffd700';
                            panel.innerText = `COPIED: ${code}`;
                            setTimeout(() => {
                                panel.style.color = originalColor;
                            }, 1500);
                        }
                    }
                    break;
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
        // ★ネコ耳アニメーション管理
        let nekoEarAnim = {
            active: false,
            startTime: 0,
            duration: 250 // ms
        };
        let nekoTriggered = false; // ★追加: 1回切り制御用フラグ

        window.sgUpdateMovement = (dt) => {
            // === 1. 入力とカメラの処理 ===
            if (typeof inputManager !== 'undefined') {
                const { dx, dy } = inputManager.consumeLookDelta();
                cameraAngle -= dx;
                cameraPitch -= dy;
                const MAX_PITCH = Math.PI * 0.45;
                cameraPitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, cameraPitch));
            }

            if (isCinematic) return;

            // === 2. 移動ベクトルの計算 ===
            const direction = new THREE.Vector3();
            const speedFactor = (moveSpeed * 60) * dt;

            if (moveState.forward) direction.z -= speedFactor;
            if (moveState.backward) direction.z += speedFactor;
            if (moveState.left) direction.x -= speedFactor;
            if (moveState.right) direction.x += speedFactor;

            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngle);

            if (direction.length() > 0.001) {
                playerFacing = Math.atan2(direction.x, direction.z);
            }

            // 移動後の予定座標
            const newX = playerPosition.x + direction.x;
            const newZ = playerPosition.z + direction.z;

            // === 3. 衝突判定 (木・障害物) ===
            const COLLISION_MARGIN = 0.25;
            let blockedX = false;
            let blockedZ = false;

            // 追加障害物
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

            // 木
            if (window.sgTreeCollisions) {
                for (const tree of window.sgTreeCollisions) {
                    if (tree.hasCoin) continue;
                    const dxNew = newX - tree.x;
                    const dzNew = newZ - tree.z;
                    const distNew = Math.sqrt(dxNew * dxNew + dzNew * dzNew);

                    if (distNew < tree.radius + COLLISION_MARGIN) {
                        const dxCurrent = playerPosition.x - tree.x;
                        const dzCurrent = playerPosition.z - tree.z;
                        if (Math.abs(dxNew) < Math.abs(dxCurrent)) blockedX = true;
                        if (Math.abs(dzNew) < Math.abs(dzCurrent)) blockedZ = true;
                    }
                }
            }

            // コインの木のバリア
            if (window.testTreeCollision && window.testTreeCollision.hasCoin) {
                const tree = window.testTreeCollision;
                const dist = Math.sqrt(Math.pow(newX - tree.x, 2) + Math.pow(newZ - tree.z, 2));
                const barrierRadius = 1.8;
                if (dist < barrierRadius) {
                    const dx = newX - tree.x;
                    const dz = newZ - tree.z;
                    const pushOut = barrierRadius - dist;
                    direction.x += (dx / dist) * pushOut;
                    direction.z += (dz / dist) * pushOut;

                    // ★追加: 衝突音 (1.5秒のクールダウン) - コインの木のみ
                    const now = Date.now();
                    if (!window.lastThudTime || now - window.lastThudTime > 1500) {
                        window.AudioManager.play('thud', 0.5);
                        window.lastThudTime = now;
                    }
                }
            }

            // === 4. 象さんと噴水 (現状維持・ログ削除のみ) ===
            // ※ナインさんの指示通り、ここのロジックは変更しません
            if (window.sgFountainCollision) {
                window.sgFountainCollision.forEach(fountain => {
                    const dxNew = newX - fountain.x;
                    const dzNew = newZ - fountain.z;
                    const distNew = Math.sqrt(dxNew * dxNew + dzNew * dzNew);

                    if (distNew < fountain.radius + COLLISION_MARGIN) {
                        const dxCurrent = playerPosition.x - fountain.x;
                        const dzCurrent = playerPosition.z - fountain.z;
                        if (Math.abs(dxNew) < Math.abs(dxCurrent)) blockedX = true;
                        if (Math.abs(dzNew) < Math.abs(dzCurrent)) blockedZ = true;

                        // 水しぶきエフェクト
                        let lastSplashTime = window.lastSplashTime || 0;
                        const now = Date.now();
                        if (now - lastSplashTime > 200) {
                            window.spawnFountainSparkles(playerPosition.x, playerPosition.y + 1.5, playerPosition.z, true, false);
                            window.lastSplashTime = now;
                        }
                    }
                });
            }

            // === 5. 移動の適用 ===
            if (!blockedX) playerPosition.x += direction.x;
            if (!blockedZ) playerPosition.z += direction.z;

            // エリア制限
            playerPosition.x = Math.max(BOUNDS.min, Math.min(BOUNDS.max, playerPosition.x));
            playerPosition.z = Math.max(BOUNDS.min, Math.min(BOUNDS.max, playerPosition.z));

            // === 6. 地面の高さ合わせ (Throttled & Cached) ===
            raycastFrameCounter++;
            if (raycastFrameCounter >= 2) {
                raycastFrameCounter = 0;

                groundRaycaster.set(new THREE.Vector3(playerPosition.x, 50, playerPosition.z), new THREE.Vector3(0, -1, 0));

                if (!window.sgWalkableMeshes || window.sgWalkableMeshes.length === 0) {
                    if (typeof window.sgRefreshWalkableMeshes === 'function') window.sgRefreshWalkableMeshes();
                }
                const walkableMeshes = window.sgWalkableMeshes || [];
                const groundHits = groundRaycaster.intersectObjects(walkableMeshes, false);

                let foundHeight = 0;
                for (const hit of groundHits) {
                    if (hit.point.y >= 0 && hit.point.y < 10) {
                        if (hit.point.y > playerPosition.y + 1.0) continue;
                        if (hit.point.y > foundHeight) foundHeight = hit.point.y;
                    }
                }
                lastGroundHeight = foundHeight;
            }

            const desiredY = lastGroundHeight + PLAYER_HEIGHT;
            const heightDiff = desiredY - playerPosition.y;
            if (heightDiff > 0) playerPosition.y = desiredY;
            else if (heightDiff < -0.1) playerPosition.y += heightDiff * 0.15;
            else playerPosition.y = desiredY;

            // === 7. カメラとモデルの更新 ===
            if (cameraDistance > 0) {
                camera.position.x = playerPosition.x + Math.sin(cameraAngle) * cameraDistance;
                camera.position.z = playerPosition.z + Math.cos(cameraAngle) * cameraDistance;
                camera.position.y = playerPosition.y + cameraDistance * 0.3;
                camera.lookAt(playerPosition.x, playerPosition.y, playerPosition.z);
            } else {
                camera.position.copy(playerPosition);
                camera.rotation.set(cameraPitch, cameraAngle, 0, 'YXZ');
            }

            if (playerModel) {
                playerModel.position.set(playerPosition.x, playerModel.position.y, playerPosition.z);
                playerModel.rotation.y = -playerFacing + Math.PI;
                playerModel.visible = cameraDistance >= 0.5;
            }



            // ★★★ ネコ耳ピクピク判定 (恩返しイベント：設定確定版) ★★★
            if (false && currentState === GameState.PLAYING && window.sgBenchCat) { // ★これを追加：イベント判定を無効化
                const cat = window.sgBenchCat;

                // ▼▼▼ 判定エリア設定 (Master Settings) ▼▼▼

                // 1. 判定の中心: ネコの前方 0.5m
                const triggerOffset = new THREE.Vector3(0, 0, 0.5);
                const triggerCenter = triggerOffset.applyMatrix4(cat.matrixWorld);

                // 2. 判定の半径: 1.0m (これが正解です)
                const TRIGGER_RADIUS = 1.0;

                // 距離計算
                const dx = playerPosition.x - triggerCenter.x;
                const dz = playerPosition.z - triggerCenter.z;
                const distXZ = Math.sqrt(dx * dx + dz * dz);

                // ① トリガー判定 (変数 TRIGGER_RADIUS を正しく使用)
                if (distXZ < TRIGGER_RADIUS && !nekoTriggered && cat.visible) {
                    nekoTriggered = true;
                    console.log("🐱 Cat Event: Triggered (Master Settings)!");

                    // 1. ニャーと鳴く
                    if (window.AudioManager) window.AudioManager.play('cat', 1.0);

                    // ▼▼▼ 2. ふんわり煙エフェクト (爆発感ゼロ) ▼▼▼
                    const particleCount = 100; // 密度を出すために増量
                    const particles = [];
                    // 極小の粒
                    const pGeom = new THREE.BoxGeometry(0.03, 0.03, 0.03);
                    const pMatBase = new THREE.MeshBasicMaterial({
                        color: 0xFFFFFF, // 純白
                        transparent: true,
                        opacity: 0.6,    // 最初から少し透けさせる
                        depthWrite: false
                    });

                    for (let i = 0; i < particleCount; i++) {
                        const mesh = new THREE.Mesh(pGeom, pMatBase.clone());

                        // ネコの体全体から湧き出るように配置
                        mesh.position.copy(cat.position);
                        mesh.position.y += 0.3;
                        // ランダムに配置（飛び散らせるのではなく、最初からそこに置く）
                        mesh.position.x += (Math.random() - 0.5) * 0.6;
                        mesh.position.z += (Math.random() - 0.5) * 0.6;
                        mesh.position.y += (Math.random() - 0.5) * 0.4;

                        // ★速度は「ほぼゼロ」で、ゆっくり上昇するだけ
                        mesh.userData.velocity = new THREE.Vector3(
                            (Math.random() - 0.5) * 0.01, // 横揺れ程度
                            0.02 + Math.random() * 0.03,  // ゆっくり上昇
                            (Math.random() - 0.5) * 0.01  // 横揺れ程度
                        );

                        // 回転もゆったり
                        mesh.userData.rotSpeed = (Math.random() - 0.5) * 0.05;

                        // 各粒子の個別の寿命（バラバラに消えるように）
                        mesh.userData.life = 1.0 + Math.random() * 0.5;

                        scene.add(mesh);
                        particles.push(mesh);
                    }

                    // 煙のアニメーション (膨らみながら消える)
                    const smokeAnim = setInterval(() => {
                        let activeCount = 0;
                        particles.forEach(p => {
                            if (p.userData.life <= 0) {
                                if (p.visible) {
                                    p.visible = false;
                                    scene.remove(p);
                                }
                                return;
                            }
                            activeCount++;

                            // 移動 (ゆっくり上昇)
                            p.position.add(p.userData.velocity);

                            // 回転
                            p.rotation.x += p.userData.rotSpeed;
                            p.rotation.y += p.userData.rotSpeed;

                            // ★ここがポイント：粒がどんどん膨らむ（拡散表現）
                            p.scale.multiplyScalar(1.05);

                            // 寿命を減らす
                            p.userData.life -= 0.03;
                            p.material.opacity = p.userData.life * 0.5; // 徐々に透明に
                        });

                        if (activeCount === 0) {
                            clearInterval(smokeAnim);
                        }
                    }, 30);
                    // ▲▲▲ 煙エフェクト終了 ▲▲▲


                    // 3. ネコを消す
                    cat.visible = false;

                    // 4. コイン出現
                    if (window.sgCoinMaster) {
                        const coin = window.sgCoinMaster.clone();
                        const offset = cat.userData.coinOffset || new THREE.Vector3(1.2, 0, 0);
                        const coinPos = cat.localToWorld(offset.clone());
                        coin.position.copy(coinPos);
                        coin.position.y += 0.25;

                        // ★サイズ指定: 0.5 (50cm) 絶対厳守！
                        coin.scale.setScalar(1.0);
                        const box = new THREE.Box3().setFromObject(coin);
                        const size = new THREE.Vector3(); box.getSize(size);
                        const maxDim = Math.max(size.x, size.y, size.z);

                        // 0.5メートルに設定
                        if (maxDim > 0) coin.scale.setScalar(0.5 / maxDim);

                        coin.userData.isCoin = true;
                        coin.userData.collected = false;

                        // ★アウトライン追加
                        if (window.addEdgesOutline) window.addEdgesOutline(coin, 15, 0x000000);

                        scene.add(coin);
                        if (window.sgGameCoins) window.sgGameCoins.push(coin);
                    }
                }
            }
        }; // ← sgUpdateMovement の閉じカッコ








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

                    // ★追加: アウトライン無効フラグがあればスキップ
                    if (child.userData.skipOutline) return;
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



        // === PERIMETER FENCE (Voxel Style) ===
        // 修正: 35mだと広すぎたため、並木(30m)が収まるギリギリの32mに設定
        const FENCE_BOUNDARY = 32;
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



        // === LOAD FBX MODEL: Coin (collectible game items) ===
        const COIN_TARGET_SIZE = 0.5; // Target diameter: 50cm

        // ★修正: 正式モデル 'coin.fbx' を読み込む
        loader.load(
            'models/coin.fbx',
            (masterCoin) => {
                console.log('FBX Loaded: coin.fbx (Official Master)');
                window.sgCoinMaster = masterCoin; // ★これを追加

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



                // こうしておけば、プログラムは「コインが0枚のステージなんだな」と理解して正常に動きます
                const coinPositions = [];


                /*
                                // ▼▼▼ 🪙コイン座標・場所 (Coin) ▼▼▼
                
                                const coinPositions = [
                                    { x: 0.00, y: 0.62, z: 21.80 }, // 正面(十字路)
                                    { x: 24.00, y: 3.60, z: 23.00 }, // 噴水(十字路)
                                    { x: 4.26, y: 0.60, z: -30.86 }, // 中央北(十字路)
                                    { x: -30.94, y: 0.60, z: 3.84 }, // 中央西(十字路)
                                    { x: 24.00, y: 0.60, z: 13.50 }, // 土管(遊具エリア)
                                    { x: 9.00, y: 1.00, z: 7.00 }, // 切り株(遊具エリア)
                                    { x: 15.00, y: 0.65, z: 9.00 }, // ブランコ(遊具エリア)
                                    { x: 16.00, y: 1.00, z: 16.00 }, // ロケット(遊具エリア)
                                    { x: 2.31, y: 1.60, z: -0.23 }, // 滑り台(遊具エリア)
                                    { x: -29.00, y: 0.60, z: -20.00 }, // 自販機裏(休憩エリア)
                                    { x: -23.30, y: 0.90, z: -19.45 }, // パラソル(休憩エリア)
                                    { x: -7.00, y: 0.85, z: -26.00 }, // トゥクトゥク(休憩エリア)
                                    { x: -9.00, y: 1.60, z: -9.20 }, // 象さん(休憩エリア)
                                    { x: -31.00, y: 0.60, z: 31.00 }, // 森林奥地(森林エリア)
                                    { x: -19.55, y: 0.60, z: 14.04 } // 森林エリア
                                ];
                */
                window.sgGameCoins = []; // For rotation animation
                const gameItems = []; // For collection tracking

                coinPositions.forEach((pos, index) => {
                    const coin = masterCoin.clone();

                    // ★修正: pos.y が指定されていればそれを使い、なければデフォルトの 1.0 を使う
                    const posY = (pos.y !== undefined) ? pos.y : 1.0;
                    coin.position.set(pos.x, posY, pos.z);

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

        // ▼▼▼ 💭雲 (Cloud) ▼▼▼

        spawnClouds();
        const TreeInstanceManager = (() => {
            let components = [];

            const init = (masterModel, count) => {
                components.forEach(c => {
                    if (c.mesh) { scene.remove(c.mesh); c.mesh.geometry?.dispose(); c.mesh.material?.dispose(); }
                    if (c.edge) { scene.remove(c.edge); c.edge.geometry?.dispose(); c.edge.material?.dispose(); }
                });
                components = [];

                masterModel.updateMatrixWorld(true);
                const rootInv = new THREE.Matrix4().copy(masterModel.matrixWorld).invert();

                masterModel.traverse(child => {
                    if (child.isMesh) {
                        const baseMatrix = child.matrixWorld.clone().premultiply(rootInv);
                        const name = child.name.toLowerCase();

                        let mat = Array.isArray(child.material) ? child.material.map(m => m.clone()) : child.material.clone();
                        const iMesh = new THREE.InstancedMesh(child.geometry, mat, count);
                        iMesh.name = `Instanced_${child.name}`;
                        iMesh.castShadow = true;
                        iMesh.receiveShadow = true;
                        iMesh.userData.ignoreGround = true;
                        iMesh.userData.isTree = true;
                        scene.add(iMesh);

                        // アウトライン完全廃止
                        components.push({ name, mesh: iMesh, edge: null, baseMatrix });
                    }
                });
                console.log(`TreeInstanceManager: ${components.length} parts (No outlines).`);
            };

            const setTransform = (index, dummy) => {
                dummy.updateMatrix();
                components.forEach(comp => {
                    const finalMatrix = new THREE.Matrix4().multiplyMatrices(dummy.matrix, comp.baseMatrix);
                    comp.mesh.setMatrixAt(index, finalMatrix);
                    if (comp.edge) comp.edge.setMatrixAt(index, finalMatrix);
                });
            };

            const updateSeason = (seasonName) => {
                const TREE_PALETTES = {
                    spring: [0xFF69B4, 0xFF1493, 0xFF99CC, 0xFFB6C1],
                    summer: [0x66BB6A, 0x43A047, 0x81C784, 0x9CCC65],
                    autumn: [0xFF4500, 0xD2691E, 0xFF8C00, 0xFFD700],
                    winter: [0xE6E6FA, 0xF8F8FF, 0xD8BFD8]
                };
                const palette = TREE_PALETTES[seasonName] || TREE_PALETTES.summer;
                const color = new THREE.Color();
                components.forEach(comp => {
                    const isLeaves = comp.name.includes('leaves') || comp.name.includes('leaf') || comp.name.includes('canopy');
                    for (let i = 0; i < comp.mesh.count; i++) {
                        color.setHex(isLeaves ? palette[i % palette.length] : 0xFFFFFF);
                        comp.mesh.setColorAt(i, color);
                    }
                    if (comp.mesh.instanceColor) comp.mesh.instanceColor.needsUpdate = true;
                });
            };

            const finalize = () => {
                components.forEach(c => {
                    c.mesh.instanceMatrix.needsUpdate = true;
                    if (c.edge) c.edge.instanceMatrix.needsUpdate = true;
                });
            };

            return { init, setTransform, updateSeason, finalize };
        })();
        window.TreeInstanceManager = TreeInstanceManager;

        // ★隠しコインを木にセットアップする関数
        function setupHiddenCoin(targetTree) {
            if (!targetTree) return;
            if (!window.sgActiveCoins) window.sgActiveCoins = [];

            const loader = new FBXLoader();
            loader.load('models/coin.fbx', (object) => {
                const coin = object;
                const season = GameConfig.currentSeason || 'summer';
                const seasonColors = { spring: 0xADFF2F, summer: 0xFF69B4, autumn: 0xE0FFFF, winter: 0xFFD700 };
                const targetColor = seasonColors[season];

                coin.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        const oldMat = Array.isArray(child.material) ? child.material[0] : child.material;
                        child.material = new THREE.MeshBasicMaterial({
                            map: oldMat.map,
                            color: targetColor,
                            side: THREE.DoubleSide
                        });
                    }
                });

                // サイズ調整
                const box = new THREE.Box3().setFromObject(coin);
                const size = new THREE.Vector3();
                box.getSize(size);
                coin.scale.setScalar(0.5 / (Math.max(size.x, size.y, size.z) || 1));

                // 配置
                coin.position.set(0, 2.2, 0); // 木のローカル座標
                const coinLight = new THREE.PointLight(targetColor, 3.0, 5.0);
                coin.add(coinLight);

                coin.userData = {
                    isCoin: true,
                    isFalling: false,
                    hasFallen: false,
                    pointLight: coinLight,
                    parentTree: targetTree
                };

                // アウトライン追加
                if (window.addEdgesOutline) window.addEdgesOutline(coin, 15, 0x000000);

                targetTree.add(coin);
                targetTree.userData.hasCoin = true;
                window.sgActiveCoins.push(coin);

                // 衝突判定データの更新
                const col = window.sgTreeCollisions.find(c =>
                    Math.abs(c.x - targetTree.position.x) < 0.1 && Math.abs(c.z - targetTree.position.z) < 0.1
                );
                if (col) {
                    col.hasCoin = true;
                    window.testTreeCollision = col;
                }
                console.log("✨ Hidden Coin ready in a tree at:", targetTree.position);
            });
        }



        function spawnTrees() {
            console.log("spawnTrees Phase 2");
            window.sgTreeObjects = [];
            window.sgTreeCollisions = [];

            window.setTreeSeason = (s) => {
                if (window.TreeInstanceManager) window.TreeInstanceManager.updateSeason(s);
            };

            const benchLoader = new FBXLoader();
            benchLoader.load('models/bench.fbx', (mb) => {
                mb.scale.setScalar(1.0);
                if (window.applyOutlineRules) window.applyOutlineRules(mb);
                mb.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
                const addB = (x, z, r) => { if (Math.abs(x - 4) < 0.1 && Math.abs(z - 16) < 0.1) return; const b = mb.clone(); b.position.set(x, 0, z); b.rotation.y = r * (Math.PI / 180); scene.add(b); if (typeof ExclusionManager !== 'undefined') ExclusionManager.addCircle(x, z, 1.5); };
                for (let d = 10; d <= 30; d += 4) { const b = d - 2; addB(b, 4, 180); addB(-b, 4, 180); addB(b, -4, 0); addB(-b, -4, 0); addB(4, b, -90); addB(4, -b, -90); addB(-4, b, 90); addB(-4, -b, 90); }
            });

            const exec = (mt) => {
                window.sgMasterTree = mt;
                const all = [];
                const addA = (x, z) => { all.push({ x, z, type: 'avenue', scale: 0.8 + Math.random() * 0.4 }); if (typeof ExclusionManager !== 'undefined') ExclusionManager.addCircle(x, z, 2.0); };
                for (let d = 10; d <= 30; d += 4) { addA(d, 4); addA(d, -4); addA(-d, 4); addA(-d, -4); addA(4, d); addA(-4, d); addA(4, -d); addA(-4, -d); }
                const fq = []; let att = 0;
                while (fq.length < 184 && att < 10000) { att++; const x = (Math.random() - 0.5) * 62, z = (Math.random() - 0.5) * 62; if ([...all, ...fq].some(p => (p.x - x) ** 2 + (p.z - z) ** 2 < 4)) continue; if (typeof ExclusionManager !== 'undefined' && ExclusionManager.isBlocked(x, z)) continue; fq.push({ x, z, type: 'forest', scale: 0.8 + Math.random() * 0.4 }); if (typeof ExclusionManager !== 'undefined') ExclusionManager.addCircle(x, z, 1.2); }
                all.push(...fq);
                for (let i = 0; i < 70; i++) { const a = Math.random() * Math.PI * 2, r = 45 + Math.random() * 35; all.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, type: 'exterior', scale: 1.2 + Math.random() * 0.8 }); }
                const cands = all.map((p, i) => p.type === 'forest' && p.x < -10 && p.z > 10 ? i : -1).filter(i => i >= 0);
                const cti = cands.length > 0 ? cands[Math.floor(Math.random() * cands.length)] : all.findIndex(p => p.type === 'forest');
                const iq = [];
                all.forEach((d, i) => {
                    if (d.type !== 'exterior') window.sgTreeCollisions.push({ x: d.x, z: d.z, radius: 0.3 * d.scale });
                    if (i === cti) { const t = mt.clone(); t.userData.isTree = true; t.name = 'Tree_CoinHolder'; t.scale.setScalar(d.scale); t.position.set(d.x, 0, d.z); t.rotation.y = Math.random() * Math.PI * 2; t.traverse(c => { if (c.isMesh) { c.material = Array.isArray(c.material) ? c.material.map(m => m.clone()) : c.material.clone(); c.castShadow = true; c.receiveShadow = true; } }); if (window.applyOutlineRules) window.applyOutlineRules(t); scene.add(t); window.sgTreeObjects.push(t); console.log('CoinTree at ' + d.x.toFixed(1) + ',' + d.z.toFixed(1)); /* setupHiddenCoin(t); */ }
                    else { iq.push({ x: d.x, z: d.z, scale: d.scale, rot: Math.random() * Math.PI * 2 }); }
                });
                if (window.TreeInstanceManager) { window.TreeInstanceManager.init(mt, iq.length); const dm = new THREE.Object3D(); iq.forEach((p, i) => { dm.position.set(p.x, 0, p.z); dm.rotation.y = p.rot; dm.scale.setScalar(p.scale); window.TreeInstanceManager.setTransform(i, dm); }); window.TreeInstanceManager.finalize(); console.log('Instanced ' + iq.length + ' trees.'); }
                window.setTreeSeason(GameConfig.currentSeason);
            };
            if (window.sgMasterTree) exec(window.sgMasterTree); else new FBXLoader().load('models/tree.fbx', exec, undefined, console.error);
        }

        // =================================================================
        // 🛠️ PROJECT POTATO: GRASS INSTANCED (InstancedMesh Mode)
        // =================================================================
        const GRASS_PALETTES = {
            spring: [0x90EE90, 0x98FB98, 0xADFF2F],
            summer: [0x66BB6A, 0x43A047, 0x81C784, 0x9CCC65],
            autumn: [0xCD853F, 0xDAA520, 0x8B4513],
            winter: [0xDDDDDD]
        };

        window.setGrassSeason = (seasonName) => {
            const palette = GRASS_PALETTES[seasonName] || GRASS_PALETTES.summer;
            if (window.sgGrassInstancedMesh) {
                const color = new THREE.Color();
                for (let i = 0; i < window.sgGrassInstancedMesh.count; i++) {
                    color.setHex(palette[i % palette.length]);
                    window.sgGrassInstancedMesh.setColorAt(i, color);
                }
                if (window.sgGrassInstancedMesh.instanceColor) {
                    window.sgGrassInstancedMesh.instanceColor.needsUpdate = true;
                }
            }
        };

        function spawnGrass() {
            if (window.hasSpawnedGrass) return;
            window.hasSpawnedGrass = true;
            console.log("--- spawnGrass (InstancedMesh Mode) ---");

            // クリーンアップ
            const existing = scene.getObjectByName('InstancedGrassField');
            if (existing) {
                existing.geometry?.dispose();
                scene.remove(existing);
            }

            new FBXLoader().load('models/grass.fbx', (masterGrass) => {
                // 1. メッシュの抽出
                let grassMesh = null;
                masterGrass.traverse(c => { if (c.isMesh) grassMesh = c; });
                if (!grassMesh) return;

                // 2. 【形状補正】-90度で起こす
                grassMesh.geometry.rotateX(-Math.PI / 2);

                // 3. マテリアル準備
                let mat = grassMesh.material;
                mat = (Array.isArray(mat) ? mat[0] : mat).clone();
                mat.transparent = true;
                mat.alphaTest = 0.5;
                mat.side = THREE.DoubleSide;

                // 4. InstancedMesh 作成
                const grassCount = 800;
                const iMesh = new THREE.InstancedMesh(grassMesh.geometry, mat, grassCount);
                iMesh.name = 'InstancedGrassField';
                iMesh.castShadow = false;
                iMesh.receiveShadow = true;
                iMesh.userData.ignoreGround = true;

                const dummy = new THREE.Object3D();
                let placed = 0;
                let attempts = 0;

                // 5. 配置ループ
                while (placed < grassCount && attempts < 5000) {
                    attempts++;
                    const x = (Math.random() - 0.5) * 62;
                    const z = (Math.random() - 0.5) * 62;
                    if (typeof ExclusionManager !== 'undefined' && ExclusionManager.isBlocked(x, z)) continue;

                    dummy.position.set(x, 0, z);
                    dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
                    const s = 3.5 + Math.random() * 2.0;
                    dummy.scale.set(s, s, s);
                    dummy.updateMatrix();

                    iMesh.setMatrixAt(placed, dummy.matrix);
                    placed++;
                }

                iMesh.instanceMatrix.needsUpdate = true;
                scene.add(iMesh);
                window.sgGrassInstancedMesh = iMesh;

                console.log(`✅ ${placed} grass patches (InstancedMesh Fix Mode).`);
                if (typeof GameConfig !== 'undefined') window.setGrassSeason(GameConfig.currentSeason);
            }, undefined, console.error);
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

            // 5. Parasols ★追加
            if (window.setParasolSeason) window.setParasolSeason(seasonName);
        };

        // ★ Parasol Season Manager
        window.sgParasolCanopies = [];
        window.setParasolSeason = (seasonName) => {
            const seasonColors = {
                spring: 0xFFC0CB, // Pink
                summer: 0x00BFFF, // Blue
                autumn: 0xD2691E, // Orange/Brown
                winter: 0xE0FFFF  // White/Cyan
            };
            const color = seasonColors[seasonName] || seasonColors.summer;

            if (window.sgParasolCanopies) {
                window.sgParasolCanopies.forEach(mesh => {
                    if (mesh.material) {
                        // MeshLambertMaterial or MeshBasicMaterial depending on loaded asset
                        // Ensure we clone if needed or just set color if unique
                        mesh.material.color.setHex(color);
                    }
                });
            }
        };

        // 1. Place Park Assets (Registers Exclusion Zones)
        createParkAssets();

        // 2. Place Trees (Registers Exclusion Zones & Respects them)
        spawnTrees();

        // 3. Place Grass (Respects all Exclusion Zones)
        spawnGrass();

        // Initialize Game Season (sets grass and trees)
        window.setGameSeason(GameConfig.currentSeason);

        // DEBUG: 座標表示パネル
        if (typeof GameConfig !== 'undefined' && GameConfig.debugMode) {
            const existingPanel = document.getElementById('debug-pos-panel');
            if (existingPanel) existingPanel.remove();

            const debugPanel = document.createElement('div');
            debugPanel.id = 'debug-pos-panel';
            debugPanel.style.position = 'absolute';
            debugPanel.style.top = '10px';
            debugPanel.style.left = '50%';
            debugPanel.style.transform = 'translateX(-50%)';
            debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            debugPanel.style.color = '#00FF00';
            debugPanel.style.padding = '8px 16px';
            debugPanel.style.fontFamily = 'monospace';
            debugPanel.style.fontSize = '16px';
            debugPanel.style.fontWeight = 'bold';
            debugPanel.style.borderRadius = '4px';
            debugPanel.style.zIndex = '10000';
            debugPanel.style.pointerEvents = 'none';
            debugPanel.innerText = 'POS X:0.00 Z:0.00 H:0.00';
            document.body.appendChild(debugPanel);
        }
    }



    // ==========================================
    // 公園遊具・設備 (Park Assets) の一括配置
    // ==========================================
    function createParkAssets() {
        // ★追加: ガード処理
        if (window.hasParkAssetsCreated) {
            console.log("createParkAssets already called. Skipping.");
            return;
        }
        window.hasParkAssetsCreated = true;

        console.log("--- createParkAssets CALLED ---");

        try {
            if (!window.sgExtraObstacles) window.sgExtraObstacles = [];
            if (!window.sgFountainCollision) window.sgFountainCollision = [];
            if (!window.sgInteractables) window.sgInteractables = [];

            if (window.sgSnowmen) {
                window.sgSnowmen.forEach(s => { if (s.parent) s.parent.remove(s); });
            }
            window.sgSnowmen = [];

            if (!window.parkGroup) {
                window.parkGroup = new THREE.Group();
                window.parkGroup.name = "ParkAssetsContainer";
                scene.add(window.parkGroup);
            }

            // ★★★ 道路 (Roads) の生成 [追加] ★★★
            // 地面(Y=0)よりわずかに浮かせて配置 (Z-fighting防止)
            const roadMat = new THREE.MeshLambertMaterial({ color: 0x808080 }); // グレー

            // 南北の道 (Z軸) 幅10m -> 6m
            // 変更点: (10, 100) を (6, 100) にする
            const roadNS = new THREE.Mesh(new THREE.PlaneGeometry(6, 100), roadMat);
            roadNS.rotation.x = -Math.PI / 2;
            roadNS.position.set(0, -0.01, 0);
            roadNS.receiveShadow = true;
            window.parkGroup.add(roadNS);

            // 東西の道 (X軸) 幅10m -> 6m
            // 変更点: (100, 10) を (100, 6) にする
            const roadEW = new THREE.Mesh(new THREE.PlaneGeometry(100, 6), roadMat);
            roadEW.rotation.x = -Math.PI / 2;
            roadEW.position.set(0, -0.01, 0);
            roadEW.receiveShadow = true;
            window.parkGroup.add(roadEW);

            // ★コインテクスチャ生成
            const createCoinTextures = () => {
                const size = 128;
                const cFace = '#ffae00'; const cBorder = '#f05e1c'; const cEye = '#ffffff';
                const cPupil = '#000000'; const cMouth = '#e83015'; const cPText = '#86c166';
                const borderThickness = 14;
                const canvasFace = document.createElement('canvas'); canvasFace.width = size; canvasFace.height = size;
                const ctx1 = canvasFace.getContext('2d');
                ctx1.translate(64, 64); ctx1.rotate(-Math.PI / 2); ctx1.translate(-64, -64);
                ctx1.fillStyle = cBorder; ctx1.fillRect(0, 0, size, size);
                ctx1.beginPath(); ctx1.arc(64, 64, 64 - borderThickness, 0, Math.PI * 2); ctx1.fillStyle = cFace; ctx1.fill();
                ctx1.fillStyle = cEye; ctx1.fillRect(35, 32, 20, 45); ctx1.fillRect(73, 32, 20, 45);
                ctx1.fillStyle = cPupil; ctx1.fillRect(40, 44, 10, 22); ctx1.fillRect(78, 44, 10, 22);
                ctx1.fillStyle = cMouth; ctx1.fillRect(42, 92, 44, 10);
                const texFace = new THREE.CanvasTexture(canvasFace);
                texFace.minFilter = THREE.NearestFilter; texFace.magFilter = THREE.NearestFilter;
                const canvasBack = document.createElement('canvas'); canvasBack.width = size; canvasBack.height = size;
                const ctx2 = canvasBack.getContext('2d');
                ctx2.translate(64, 64); ctx2.rotate(-Math.PI / 2); ctx2.translate(-64, -64);
                ctx2.fillStyle = cBorder; ctx2.fillRect(0, 0, size, size);
                ctx2.beginPath(); ctx2.arc(64, 64, 64 - borderThickness, 0, Math.PI * 2); ctx2.fillStyle = cFace; ctx2.fill();
                ctx2.fillStyle = cPText; ctx2.font = 'bold 80px sans-serif';
                ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle'; ctx2.fillText('P', 64, 68);
                const texBack = new THREE.CanvasTexture(canvasBack);
                texBack.minFilter = THREE.NearestFilter; texBack.magFilter = THREE.NearestFilter;
                const canvasSide = document.createElement('canvas'); canvasSide.width = 2; canvasSide.height = 2;
                const ctxSide = canvasSide.getContext('2d'); ctxSide.fillStyle = cBorder; ctxSide.fillRect(0, 0, 2, 2);
                const texSide = new THREE.CanvasTexture(canvasSide);
                texSide.minFilter = THREE.NearestFilter; texSide.magFilter = THREE.NearestFilter;
                return { face: texFace, back: texBack, side: texSide };
            };
            const coinTex = createCoinTextures();

            // --- 共通テクスチャ生成ロジック (Shared) ---
            const getOrCreateCircleTexture = () => {
                if (window.particleCircleTexture) return window.particleCircleTexture;

                const size = 64;
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');

                // 円形の描画
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();

                const texture = new THREE.CanvasTexture(canvas);
                window.particleCircleTexture = texture;
                // console.log("⚪ Created Shared Circle Texture Asset.");
                return texture;
            };

            const spawnSnowExplosion = (pos) => {
                // 関数が呼ばれる直前にテクスチャを確保
                getOrCreateCircleTexture();

                const particleCount = 15;
                // MeshではなくSpriteを使用（コインと同じ仕様にする）
                const material = new THREE.SpriteMaterial({
                    map: window.particleCircleTexture,
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.8,
                    depthWrite: false
                });

                for (let i = 0; i < particleCount; i++) {
                    const particle = new THREE.Sprite(material.clone()); // 個別にopacity制御するためclone
                    particle.position.set(
                        pos.x + (Math.random() - 0.5) * 1.0, // 範囲も少し狭める
                        pos.y + Math.random() * 1.0,
                        pos.z + (Math.random() - 0.5) * 1.0
                    );

                    // サイズ: コインは0.13なので、雪もそれに近づける (0.15〜0.2)
                    const s = 0.15 + Math.random() * 0.1;
                    particle.scale.set(s, s, s);

                    scene.add(particle);

                    // 速度ベクトル (コイン取得時と同じパラメータ)
                    const velocity = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.08,
                        Math.random() * 0.08,
                        (Math.random() - 0.5) * 0.08
                    );

                    let lastTime = performance.now();

                    const animate = () => {
                        // Delta Time計算
                        const now = performance.now();
                        const dt = Math.min((now - lastTime) / 1000, 0.1);
                        lastTime = now;

                        // 60FPS基準のタイムスケール
                        const timeScale = dt * 60;

                        // 移動
                        particle.position.x += velocity.x * timeScale;
                        particle.position.y += velocity.y * timeScale;
                        particle.position.z += velocity.z * timeScale;

                        // 減速 (空気抵抗)
                        velocity.multiplyScalar(Math.pow(0.95, timeScale));

                        // フェードアウト
                        particle.material.opacity -= 0.03 * timeScale;

                        if (particle.material.opacity <= 0) {
                            scene.remove(particle);
                            particle.material.dispose();
                        } else {
                            requestAnimationFrame(animate);
                        }
                    };
                    animate();
                }
                // console.log("❄️ Snow Explosion: Round Sprites deployed.");
            };

            // 砂場の飛散エフェクト (createSandSplash)
            window.createSandSplash = (pos) => {
                getOrCreateCircleTexture();
                const particleCount = 12;
                const material = new THREE.SpriteMaterial({
                    map: window.particleCircleTexture,
                    color: 0xf4a460, // 砂の色 (Sandy Brown)
                    transparent: true,
                    opacity: 0.9,
                    depthWrite: false
                });

                for (let i = 0; i < particleCount; i++) {
                    const particle = new THREE.Sprite(material.clone());
                    particle.position.set(
                        pos.x + (Math.random() - 0.5) * 0.8,
                        pos.y + Math.random() * 0.5,
                        pos.z + (Math.random() - 0.5) * 0.8
                    );
                    const s = 0.1 + Math.random() * 0.15;
                    particle.scale.set(s, s, s);
                    scene.add(particle);

                    const velocity = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.15,
                        0.1 + Math.random() * 0.1,
                        (Math.random() - 0.5) * 0.15
                    );
                    let lastTime = performance.now();
                    const animateSplash = () => {
                        const now = performance.now();
                        const dt = Math.min((now - lastTime) / 1000, 0.1);
                        lastTime = now;
                        const timeScale = dt * 60;

                        particle.position.add(velocity.clone().multiplyScalar(timeScale));
                        velocity.y -= 0.008 * timeScale; // 重力

                        particle.material.opacity -= 0.02 * timeScale;
                        if (particle.material.opacity <= 0) {
                            scene.remove(particle);
                            particle.material.dispose();
                        } else {
                            requestAnimationFrame(animateSplash);
                        }
                    };
                    animateSplash();
                }
            };

            // ★修正: North = -Z Coordinate System (Inverted Z)

            // ★ 3Dパーティクルシステム (window.spawnSparkles用 - 最適化版)
            window.spawnParticles = (x, y, z, colors, className) => {
                if (!scene) return;

                // 【最適化1】テクスチャのキャッシュ利用
                const texture = getOrCreateCircleTexture();
                const count = 5;

                for (let i = 0; i < count; i++) {
                    // 【最適化2】色の適用方法の変更 (SpriteMaterial.colorプロパティを使用)
                    const colorValue = (colors && colors.length > 0)
                        ? colors[Math.floor(Math.random() * colors.length)]
                        : 0xffffff;

                    const material = new THREE.SpriteMaterial({
                        map: texture,
                        color: new THREE.Color(colorValue),
                        transparent: true,
                        opacity: 1.0,
                        depthWrite: false,
                        blending: THREE.AdditiveBlending // 加算合成で光を表現
                    });

                    const sprite = new THREE.Sprite(material);

                    // 初期位置のランダム拡散
                    const spread = 0.5;
                    sprite.position.set(
                        x + (Math.random() - 0.5) * spread,
                        y + (Math.random() - 0.5) * spread,
                        z + (Math.random() - 0.5) * spread
                    );

                    // サイズのランダム化
                    const scale = 0.1 + Math.random() * 0.1;
                    sprite.scale.set(scale, scale, 1.0);

                    scene.add(sprite);

                    // 【最適化3】Vanilla JSによるアニメーション処理
                    let velocityY = 0.01 + Math.random() * 0.01;
                    let velocityX = (Math.random() - 0.5) * 0.01;
                    let velocityZ = (Math.random() - 0.5) * 0.01;
                    let opacity = 1.0;

                    const animate = () => {
                        opacity -= 0.02;
                        if (opacity <= 0) {
                            scene.remove(sprite);
                            material.dispose();
                            return;
                        }

                        // 位置更新
                        sprite.position.x += velocityX;
                        sprite.position.y += velocityY;
                        sprite.position.z += velocityZ;

                        // わずかな減速
                        velocityY *= 0.98;

                        // 不透明度反映
                        sprite.material.opacity = opacity;

                        requestAnimationFrame(animate);
                    };
                    animate();
                }
            };


            // 1. spawnSparkles の修正（キラキラ仕様）
            window.spawnSparkles = (x, y, z) => {
                if (typeof window.spawnParticles === 'function') {
                    // 白と金の小さな粒、かつ少しだけ上に浮く設定
                    window.spawnParticles(x, y, z, ['#FFFFFF', '#FFD700'], 'pa-particle');
                }
            };

            // 1. カラーパレットの変更
            // 1. 関数の書き換え（透明度・速度・寿命を最適化）
            window.spawnFountainSparkles = (x, y, z, isWaterColor = true, isBack = false) => {
                // ★修正: 共通テクスチャ生成ロジックを使用
                getOrCreateCircleTexture();

                const count = isBack ? 2 : 3;
                const waterPalette = [0xFFFFFF, 0x87CEFA, 0xB8EEF7];
                const goldPalette = [0xFFFFFF, 0x87CEFA, 0xB8EEF7];

                for (let i = 0; i < count; i++) {
                    const color = isWaterColor
                        ? waterPalette[Math.floor(Math.random() * waterPalette.length)]
                        : goldPalette[Math.floor(Math.random() * goldPalette.length)];

                    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                        map: window.particleCircleTexture,
                        color: color,
                        transparent: true,
                        opacity: 0.6,
                        depthWrite: false
                    }));

                    sprite.position.set(x + (Math.random() - 0.5) * 0.1, y, z + (Math.random() - 0.5) * 0.1);
                    sprite.scale.setScalar(isBack ? 0.07 : 0.06);
                    scene.add(sprite);

                    let velY = isBack ? (0.01 + Math.random() * 0.01) : (0.02 + Math.random() * 0.02);
                    let velX = (Math.random() - 0.5) * (isBack ? 0.02 : 0.01);
                    let velZ = (Math.random() - 0.5) * (isBack ? 0.02 : 0.01);
                    let life = 1.0;

                    const anim = () => {
                        life -= 0.03;
                        if (life <= 0) { scene.remove(sprite); return; }
                        sprite.position.x += velX;
                        sprite.position.y += velY;
                        sprite.position.z += velZ;

                        velY -= isBack ? 0.0003 : 0.002;

                        sprite.material.opacity = life;
                        requestAnimationFrame(anim);
                    };
                    anim();
                }
            };

            // ▼▼▼ 🪑🪑🪑ベンチ (Bench) ▼▼▼
            // --- ランダムベンチ選択ロジック ---

            const getTargetBench = () => {
                const benches = [];
                const START = 10.0, END = 30.0, STEP = 4.0;
                for (let d = START; d <= END; d += STEP) {
                    const b = d - 2.0;
                    // 4方向、合計8つの座標と向きを追加
                    benches.push({ x: b, z: 4, r: 180 }, { x: -b, z: 4, r: 180 });
                    benches.push({ x: b, z: -4, r: 0 }, { x: -b, z: -4, r: 0 });
                    benches.push({ x: 4, z: b, r: -90 }, { x: 4, z: -b, r: -90 });
                    benches.push({ x: -4, z: b, r: 90 }, { x: -4, z: -b, r: 90 });
                }
                // 遊具エリア入口(x:4, z:16)のベンチを除外（全47個にする）
                const validBenches = benches.filter(p => !(Math.abs(p.x - 4) < 0.1 && Math.abs(p.z - 16) < 0.1));
                return validBenches[Math.floor(Math.random() * validBenches.length)];
            };
            const selectedBench = getTargetBench();

            const ASSET_CONFIG = [
                {
                    name: 'MainFountain',
                    path: 'models/fountain.fbx',
                    pos: { x: 0, y: 0, z: 0 },
                    scale: 3.0,
                    rot: { y: 0 },
                    collision: false,
                    exclusionRadius: 8.0,
                    onLoad: (obj) => {
                        obj.traverse(c => {
                            // メッシュかつ名前に'water'が含まれる場合（大文字小文字無視）
                            if (c.isMesh && c.name.toLowerCase().includes('water')) {
                                // マテリアル配列対応
                                const materials = Array.isArray(c.material) ? c.material : [c.material];
                                materials.forEach(mat => {
                                    mat.transparent = true;
                                    mat.opacity = 0.5; // 半透明
                                    mat.depthWrite = false; // 前後関係の描画崩れ防止
                                });

                                c.castShadow = false; // 影を落とさない（影なし）
                                c.receiveShadow = true; // 影は受ける
                                c.userData.skipOutline = true; // アウトラインなし
                            }
                        });
                    }
                },



                // ▼▼▼ 🛝滑り台 (Slide) ▼▼▼

                {
                    name: 'Slide',
                    path: 'models/slide.fbx',
                    pos: { x: 24, z: 23 },
                    rot: { y: 270 },
                    scale: 3.0,
                    collision: false,
                    exclusionRadius: 8.0,
                    onLoad: (obj) => {
                        console.log("🛝 Slide placed at (x: 24, z: 23)");
                    }
                },

                // ▼▼▼ ⚖️シーソー (Seesaw) - 静的オブジェクト版 ▼▼▼

                {
                    name: 'Seesaw',
                    path: 'models/seesaw.fbx',
                    pos: { x: 18, y: 0.6, z: 25 }, // 地面(y=0)に設置。浮いている場合は微調整してください
                    rot: { y: 0 },
                    scale: 1.0,
                    collision: false,
                    exclusionRadius: 3.0,
                    onLoad: (obj) => {
                        // 余計なPivot作成などは行わず、影の設定のみを適用
                        obj.traverse(c => {
                            if (c.isMesh) {
                                c.castShadow = true;
                                c.receiveShadow = true;
                            }
                        });
                        console.log("Seesaw loaded as a static object.");
                    }
                },

                // ▼▼▼ 🐘象さん (ElephantSprayer) ▼▼▼

                {
                    name: 'ElephantSprayer',
                    path: 'models/elephant_sprayer.fbx',
                    pos: { x: -9, y: 0, z: -8.5 },
                    rot: { y: 0 }, // ★向きを0度に完全固定
                    scale: 0.8, // 必要に応じて微調整
                    collision: true,
                    collisionType: 'cylinder',
                    collisionSize: { radius: 1.35, height: 3 },
                    onLoad: (obj) => {
                        // ストリームメッシュの初期化と分別
                        const streams = [];
                        obj.traverse((c) => {
                            if (c.isMesh && c.name.toLowerCase().includes('stream')) {
                                c.material = (Array.isArray(c.material) ? c.material[0] : c.material).clone();
                                c.material.transparent = true;
                                c.material.opacity = 0.6;
                                c.material.depthWrite = false;
                                c.visible = false;

                                // ★修正: 水流メッシュにはアウトラインを付けない
                                c.userData.skipOutline = true;

                                streams.push(c);
                            }
                            c.castShadow = true;
                        });

                        // ★名前による分別ロジック (より確実)
                        obj.userData.noseStreams = [];
                        obj.userData.backStreams = [];

                        streams.forEach(s => {
                            if (s.name.toLowerCase().includes('nose')) {
                                obj.userData.noseStreams.push(s);
                            } else {
                                obj.userData.backStreams.push(s);
                            }
                        });

                        // フォールバック: 名前でnoseが見つからなかった場合のみZソート
                        if (obj.userData.noseStreams.length === 0 && streams.length > 0) {
                            console.warn("Elephant: No 'nose' stream found by name. Falling back to Z-sort.");
                            streams.sort((a, b) => b.position.z - a.position.z);
                            obj.userData.noseStreams.push(streams[0]);

                            // backStreamsから重複削除
                            const idx = obj.userData.backStreams.indexOf(streams[0]);
                            if (idx > -1) obj.userData.backStreams.splice(idx, 1);
                        }

                        console.log(`Elephant Streams Sorted: Nose=${obj.userData.noseStreams.length}, Back=${obj.userData.backStreams.length}`);

                        if (window.applyOutlineRules) window.applyOutlineRules(obj);
                    }
                },

                // ▼▼▼ 🪧看板 (Signboard) ▼▼▼

                {
                    name: 'InfoBoard',
                    path: 'models/signboard.fbx',
                    pos: { x: -28.63, y: 0, z: -12.62 },
                    rot: { y: 90 },
                    scale: 1.0,
                    collision: false,
                    userData: {
                        title: "インフォメーション",
                        description: "ポテトくんの公園へようこそ！"
                    },
                    onLoad: (obj) => {
                        // 1. ポスター貼り付け & URL設定
                        const textureLoader = new THREE.TextureLoader();
                        const posterTexture = textureLoader.load('assets/NewCollection.png');
                        posterTexture.colorSpace = THREE.SRGBColorSpace;
                        posterTexture.flipY = true;

                        const targetUrl = 'https://potatokun.base.shop/';

                        obj.traverse((c) => {
                            if (c.isMesh) {
                                c.castShadow = true;
                                c.receiveShadow = true;

                                if (c.name.includes('Face')) {
                                    const mat = (Array.isArray(c.material) ? c.material[0] : c.material).clone();
                                    mat.map = posterTexture;
                                    mat.color.setHex(0xffffff);
                                    c.material = mat;

                                    c.userData.url = targetUrl;
                                    c.userData.isLink = true;
                                }
                            }
                        });

                        // 2. 柱の衝突判定（股下通過用）
                        obj.updateMatrixWorld(true);
                        const box = new THREE.Box3().setFromObject(obj);
                        const legThickness = 0.3;
                        window.sgExtraObstacles.push({
                            minX: box.min.x, maxX: box.max.x,
                            minZ: box.min.z, maxZ: box.min.z + legThickness
                        });
                        window.sgExtraObstacles.push({
                            minX: box.min.x, maxX: box.max.x,
                            minZ: box.max.z - legThickness, maxZ: box.max.z
                        });

                        window.sgExtraObstacles.push({
                            minX: box.min.x, maxX: box.max.x,
                            minZ: box.max.z - legThickness, maxZ: box.max.z
                        });

                        // 3. クリックイベントは handleInputInteraction で統合管理するため削除
                    }
                },

                // ▼▼▼ 🎰自動販売機 (VendingMachine) ▼▼▼

                {
                    name: 'VendingMachine',
                    path: 'models/vending_machine.fbx',
                    pos: { x: 0, y: 0, z: 0 }, // Template pos
                    rot: { y: 90 },
                    scale: 1.0,
                    // positions: Defined here for the loader to clone
                    positions: [
                        { x: -28, z: -18.0 },
                        { x: -28, z: -19.3 },
                        { x: -28, z: -20.6 },
                        { x: -28, z: -21.9 }
                    ],
                    collision: false, // Handle manually in onLoad
                    onLoad: (vm, index) => {
                        // This callback runs for EACH clone
                        vm.visible = true;

                        // ★商品パネル (Decal) の追加
                        const texLoader = new THREE.TextureLoader();
                        const panelTex = texLoader.load(`assets/vending_panel_${index + 1}.png`);
                        // Planeはデフォルトで+Z向き。自販機のFrontが+Zならそのまま見手側に向く。
                        // 暗所でも見えるように BasicMaterial + Transparent
                        const panelMat = new THREE.MeshBasicMaterial({ map: panelTex, transparent: true });
                        const panelGeo = new THREE.PlaneGeometry(1.0, 1.6);
                        const panel = new THREE.Mesh(panelGeo, panelMat);

                        // 位置合わせ (Y:1.15, Z:0.28) -> (Y:1.38, Z:0.285)
                        panel.position.set(0, 1.05, 0.285);

                        vm.add(panel);

                        // Apply materials logic
                        vm.traverse(c => {
                            if (c.isMesh) {
                                const name = c.name.toLowerCase();
                                if (name.includes('body')) {
                                    c.castShadow = true; c.receiveShadow = true;
                                } else if (name.includes('light')) {
                                    c.castShadow = false; c.receiveShadow = false;
                                    if (c.material) {
                                        c.material = c.material.clone();
                                        c.material.emissive = new THREE.Color(0xFFBF00);
                                    }
                                } else if (name.includes('water')) {
                                    c.castShadow = false; c.receiveShadow = true;
                                    if (c.material) {
                                        c.material = c.material.clone();
                                        c.material.transparent = true;
                                        c.material.opacity = 0.5;
                                        c.material.depthWrite = false;
                                    }
                                } else {
                                    c.castShadow = true; c.receiveShadow = true;
                                }
                            }
                        });


                        vm.updateMatrixWorld(true);
                        const box = new THREE.Box3().setFromObject(vm);
                        const legThickness = 0.3;
                        window.sgExtraObstacles.push(
                            { minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.min.z + legThickness },
                            { minX: box.min.x, maxX: box.max.x, minZ: box.max.z - legThickness, maxZ: box.max.z }
                        );
                    }
                },

                // ▼▼▼ 🗑️ゴミ箱 (TrashCan) ▼▼▼

                {
                    name: 'TrashCan',
                    path: 'models/recyclebin.fbx',
                    pos: { x: 0, y: 0, z: 0 },
                    rot: { y: 90 },
                    scale: 1.0,
                    positions: [
                        { x: -28, z: -23.2 },
                        { x: -28, z: -23.9 }
                    ],
                    collision: true,
                    exclusionRadius: 1.0,
                    onLoad: (obj) => {
                        obj.traverse(c => {
                            if (c.isMesh) {
                                c.castShadow = true;
                                c.receiveShadow = true;
                            }
                        });
                    }
                },

                {
                    name: 'Dokan', path: 'models/ceramic_pipe.fbx', pos: { x: 24, y: 0, z: 14 }, rot: { y: 90 }, scale: 2.0, exclusionRadius: 3.5, // Old z: -14
                    onLoad: (obj) => {
                        try {
                            obj.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(obj); obj.position.y -= box.min.y;
                            obj.traverse(c => { if (c.isMesh) c.userData.ignoreGround = true; });
                            const roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 3.2), new THREE.MeshBasicMaterial({ visible: false }));
                            roof.position.copy(obj.position); roof.position.y += 2.0; roof.rotation.y = obj.rotation.y; window.parkGroup.add(roof);
                            const gap = 0.55; const thick = 0.1;
                            window.sgExtraObstacles.push({ minX: obj.position.x - gap - thick, maxX: obj.position.x - gap, minZ: obj.position.z - 1.6, maxZ: obj.position.z + 1.6 }, { minX: obj.position.x + gap, maxX: obj.position.x + gap + thick, minZ: obj.position.z - 1.6, maxZ: obj.position.z + 1.6 });
                        } catch (e) { console.error("Error in Dokan onLoad:", e); }
                    }
                },


                // ▼▼▼ 🪑🐱ベンチねこ (BenchCat) ▼▼▼

                {
                    name: 'BenchCat',
                    path: 'models/cat.fbx',
                    pos: { x: selectedBench.x, y: 0.45, z: selectedBench.z },
                    rot: { y: selectedBench.r },
                    scale: 1.0,
                    onLoad: (cat) => {
                        const box = new THREE.Box3().setFromObject(cat);
                        const heightOfBench = 0.28; // ナイン氏調整済みの座面高
                        cat.position.y += (heightOfBench - box.min.y);

                        // ★追加: ネコをベンチの「左」にずらす
                        cat.translateX(-0.6);

                        // ★追加: 「右」のスペース（コイン出現位置）を計算して記憶
                        // ネコから見て左へ1.2m（＝ベンチの反対側）の位置
                        cat.userData.coinOffset = new THREE.Vector3(1.2, 0, 0);

                        cat.traverse(child => {
                            if (child.name === 'Ears') cat.userData.ears = child;
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                                child.userData.entityType = 'npc';
                            }
                        });
                        if (window.applyOutlineRules) window.applyOutlineRules(cat);
                        window.sgBenchCat = cat;
                        cat.userData.hasReacted = false;
                        cat.userData.isReacting = false;
                        cat.userData.reactionTimer = 0;
                        console.log(`🐱 Bench Cat Spawned at (x:${selectedBench.x}, z:${selectedBench.z})`);
                    }
                },

                // ▼▼▼ 🛞タイヤ (Tire) ▼▼▼

                {
                    name: 'Tire',
                    path: 'models/tire.fbx',
                    pos: { x: 0, y: -10, z: 0 },
                    rot: { y: 0 },
                    scale: 1.0,
                    collision: false,
                    onLoad: (baseTire) => {
                        console.log("🛞 Tire FBX Loaded. Configuring Layout...");

                        // 1. 自動スケール調整 (Auto-Scale to 1.0m)
                        baseTire.updateMatrixWorld(true);
                        const box = new THREE.Box3().setFromObject(baseTire);
                        const size = new THREE.Vector3();
                        box.getSize(size);
                        const maxDim = Math.max(size.x, size.y, size.z);
                        const scaleFactor = 1.0 / (maxDim > 0 ? maxDim : 1.0);
                        baseTire.scale.setScalar(scaleFactor);

                        // テンプレートは隠す
                        baseTire.visible = false;

                        // 2. 配置座標の生成（合計8個：入口からの導線用）
                        const tirePositions = [];

                        // 左側（北側）の4つ: Z = 14.5
                        for (let i = 0; i < 4; i++) {
                            tirePositions.push({
                                x: 5.5 + (i * 1.2),
                                z: 14.5
                            });
                        }

                        // 右側（南側）の4つ: Z = 17.5
                        for (let i = 0; i < 4; i++) {
                            tirePositions.push({
                                x: 5.5 + (i * 1.2),
                                z: 17.5
                            });
                        }

                        // 3. カラーパレット (赤・青・黄)
                        const tireColors = [0xFF0000, 0x0000FF, 0xFFFF00];

                        // 4. 生成ループ
                        tirePositions.forEach((pos, index) => {
                            const tire = baseTire.clone();
                            tire.visible = true;

                            // 配置 (原点中心なのでY=0で半分埋まる)
                            tire.position.set(pos.x, 0, pos.z);

                            // 色の適用 (順番にサイクル)
                            const colorHex = tireColors[index % 3];

                            tire.traverse(child => {
                                if (child.isMesh) {
                                    child.castShadow = true;
                                    child.receiveShadow = true;

                                    if (child.material) {
                                        child.material = child.material.clone();
                                        child.material.color.setHex(colorHex);
                                        child.material.transparent = false;
                                        child.material.opacity = 1.0;
                                    }
                                }
                            });

                            window.parkGroup.add(tire);

                            // ★衝突判定 (ExclusionManager) は削除しました
                            // これでタイヤの上を歩けます
                        });

                        console.log(`Placed ${tirePositions.length} tires (Walkable).`);
                    }
                },

                // ▼▼▼ ⛱️パラソル (Parasol) ▼▼▼

                {
                    name: 'Parasol',
                    path: 'models/parasol.fbx',
                    pos: { x: 0, y: 0, z: 0 },
                    scale: 0.8,
                    // positions: Moved here
                    positions: [
                        // 1. 西側列 (Near Vending Line X:-23)
                        { x: -23, z: -9.0 }, { x: -22, z: -14.0 }, { x: -23, z: -19.0 },
                        { x: -22, z: -24.0 }, { x: -23, z: -27.5 },

                        // 2. 中央列 (Mid Area X:-18 ~ -13)
                        { x: -18, z: -11.0 }, { x: -17, z: -16.0 }, { x: -18, z: -21.0 }, { x: -17, z: -26.0 },
                        { x: -13, z: -9.0 }, { x: -13, z: -13.0 }, { x: -12, z: -18.0 }, { x: -13, z: -23.0 }, { x: -12, z: -27.0 },

                        // 3. 東側列 (Near East Line X:-7) - Avoid Elephant (-9, -8.5)
                        { x: -8, z: -15.0 }
                    ],
                    collision: false,
                    onLoad: (parasol) => {
                        // Runs for EACH clone
                        parasol.visible = true;
                        parasol.rotation.y = Math.random() * Math.PI * 2; // Random rot

                        // Register canopy for season updates
                        parasol.traverse(c => {
                            if (c.isMesh && c.name.toLowerCase().includes('canopy')) {
                                c.material = c.material.clone(); // Clone mat for independence
                                window.sgParasolCanopies.push(c);
                            }
                            if (c.isMesh) {
                                c.castShadow = true;
                                c.receiveShadow = true;
                            }
                        });

                        // ★追加: 円柱衝突判定 (半径0.6)
                        if (window.sgFountainCollision) {
                            window.sgFountainCollision.push({ x: parasol.position.x, z: parasol.position.z, radius: 0.6 });
                        }
                    }
                },

                // ▼▼▼ 🚙キッチンカー (KitchenCar) ▼▼▼

                {
                    name: 'KitchenCar_Tuktuk',
                    path: 'models/tuktuk.fbx',
                    pos: { x: -7, y: 0, z: -25 },
                    rot: { y: 180 }, // 南向き
                    scale: 1.0,
                    collision: false, // カスタム衝突判定を使用するためfalse
                    exclusionRadius: 3.5,
                    onLoad: (tuktuk) => {
                        console.log("🚙 TukTuk KitchenCar: Ground-level Deployment (South Facing)");

                        // 影とマテリアルの基本設定 & 詳細チューニング
                        tuktuk.traverse(c => {
                            if (c.isMesh) {
                                // 0. ベース設定
                                c.castShadow = true;
                                c.receiveShadow = true;
                                if (c.material) {
                                    // 配列マテリアル対応
                                    const materials = Array.isArray(c.material) ? c.material : [c.material];

                                    materials.forEach(m => {
                                        m.shadowSide = THREE.BackSide;
                                    });
                                }

                                const name = c.name.toLowerCase();

                                // 1. ライトの控えめな発光
                                if (name.includes('light')) {
                                    if (!Array.isArray(c.material)) {
                                        c.material = c.material.clone();
                                        c.material.emissive = new THREE.Color(0xFFFFCC); // 暖かみのある白
                                        c.material.emissiveIntensity = 0.4; // ★光量少なめ
                                        c.castShadow = false; // ライト自体は影を落とさない
                                    }
                                }

                                // 2. ガラスの透過設定
                                if (name.includes('glass')) {
                                    if (!Array.isArray(c.material)) {
                                        c.material = c.material.clone();
                                        c.material.transparent = true;
                                        c.material.opacity = 0.3; // ★しっかり透過
                                        c.material.depthWrite = false; // 描画順のバグ防止
                                        c.castShadow = false; // ガラスは影を落とさない
                                    }
                                }

                                // 3. ポスター面 (画像適用) ★URL追加
                                if (name.includes('kitchencar_face')) {
                                    if (!Array.isArray(c.material)) {
                                        c.material = c.material.clone();

                                        // テクスチャの非同期ロード
                                        const textureLoader = new THREE.TextureLoader();
                                        textureLoader.load('assets/kitchencar_ad2.png', (tex) => {
                                            tex.colorSpace = THREE.SRGBColorSpace;
                                            tex.flipY = true;

                                            // 画像を時計回りに270度回転
                                            tex.center.set(0.5, 0.5);
                                            tex.rotation = -Math.PI * 1.5;

                                            c.material.map = tex;
                                            c.material.color.setHex(0xFFFFFF);
                                            c.material.emissive = new THREE.Color(0xFFFFFF);
                                            c.material.emissiveMap = tex;
                                            c.material.emissiveIntensity = 0.2;
                                            c.material.needsUpdate = true;

                                            console.log("🖼️ KitchenCar Poster applied to:", name);
                                        });

                                        // ★リンク設定
                                        c.userData.url = 'https://x.com/potato_kun_junk';
                                        c.userData.isLink = true;
                                    }
                                }
                            }
                        });

                        // 「いい感じ」の物理判定登録
                        if (window.sgExtraObstacles) {
                            window.sgExtraObstacles.push({
                                minX: -7 - 1.3, maxX: -7 + 1.3,
                                minZ: -25 - 3.5, maxZ: -25 + 3.5
                            });
                        }
                    }
                },

                // ▼▼▼ 🪏砂場 (Sandbox) ▼▼▼

                {
                    name: 'Sandbox',
                    path: 'models/sandbox_set.fbx',
                    pos: { x: 10, y: 0, z: 25 },
                    rot: { y: 0 },
                    scale: 1.4,
                    onLoad: (obj) => {
                        console.log("🪏 Sandbox Set Loaded");
                        let shovel = null;
                        let sandMound = null;

                        obj.traverse(c => {
                            if (c.isMesh) {
                                c.castShadow = true;
                                c.receiveShadow = true;

                                const name = c.name.toLowerCase();
                                if (name.includes('shovel')) {
                                    shovel = c;
                                    shovel.traverse((child) => {
                                        if (child.isMesh) {
                                            child.userData.ignoreRaycast = true;
                                        }
                                    });

                                    const hitGeo = new THREE.BoxGeometry(0.6, 0.2, 0.5);
                                    const hitMat = new THREE.MeshBasicMaterial({
                                        visible: false,
                                        side: THREE.DoubleSide
                                    });

                                    const hitBox = new THREE.Mesh(hitGeo, hitMat);
                                    hitBox.userData.parentItem = shovel;
                                    hitBox.userData.isHitBox = true;
                                    hitBox.userData.skipOutline = true;
                                    hitBox.userData.ignoreHighlight = true;

                                    shovel.geometry.computeBoundingBox();
                                    const center = new THREE.Vector3();
                                    shovel.geometry.boundingBox.getCenter(center);
                                    hitBox.position.copy(center);

                                    shovel.add(hitBox);
                                }
                                if (name.includes('mound') || name.includes('sandpile')) sandMound = c;

                                if (c.name.includes('SandboxMain')) {
                                    if (window.sgWalkableMeshes) window.sgWalkableMeshes.push(c);
                                }
                            }
                        });

                        if (shovel && sandMound) {
                            shovel.userData.hasDug = false;
                            shovel.userData.action = () => {
                                return;
                            };
                        }
                    }
                },

                // ▼▼▼ 🪵切り株 (Stump) ▼▼▼

                {
                    name: 'Stump_Center',
                    path: 'models/stump.fbx',
                    pos: { x: 0, y: 0, z: 0 },
                    rot: { y: 0 },
                    scale: 0.7,
                    collision: false,
                    exclusionRadius: 2.0,
                    positions: [
                        { x: 7.5, z: 6 }, { x: 6.5, z: 7 }, { x: 8, z: 10 },
                        { x: 10.5, z: 6 }, { x: 11, z: 9 }, { x: 9, z: 8.5 },
                        { x: 10, z: 11 }, { x: 9, z: 7 }
                    ],
                    onLoad: (obj) => {
                        obj.rotation.y = Math.random() * Math.PI * 2;
                        console.log("🪵 Stump placed (Random Rotation)");
                    }
                },

                // ▼▼▼ ⛓️ブランコ (Swing) ▼▼▼

                {
                    name: 'Swing_Playground',
                    path: 'models/swing.fbx',
                    pos: { x: 0, y: 0, z: 0 },
                    rot: { y: 180 },
                    scale: 1.0,
                    collision: false,
                    exclusionRadius: 3.0,
                    positions: [
                        { x: 15, z: 9 }, { x: 17, z: 9 }, { x: 19, z: 9 }
                    ],
                    onLoad: (obj) => {
                        console.log("⛓️ Swing placed at (x: 15, z: 9)");
                    }
                },

                // ▼▼▼ 🚀ロケット (Rocket) ▼▼▼

                {
                    name: 'Rocket_Secret',
                    path: 'models/rocket.fbx',
                    pos: { x: 16, z: 16 },
                    rot: { y: 0 },
                    scale: 1.65,
                    collision: false,
                    exclusionRadius: 2.5,
                    onLoad: (rocket) => {
                        console.log("🚀 Rocket Logic Started...");
                        rocket.position.set(16, 0, 16);
                        rocket.scale.setScalar(2.0);
                        rocket.updateMatrixWorld(true);

                        rocket.traverse((c) => {
                            if (c.isMesh) {
                                c.material.transparent = false;
                                c.material.opacity = 1.0;
                                c.material.depthWrite = true;
                                c.material.side = THREE.DoubleSide;
                                c.castShadow = true;
                                c.receiveShadow = true;
                            }
                        });

                        rocket.traverse((child) => {
                            if (child.isMesh && child.name.includes('COL_WALL')) {
                                child.updateMatrixWorld(true);
                                const box = new THREE.Box3().setFromObject(child);
                                if (window.sgExtraObstacles) {
                                    window.sgExtraObstacles.push({
                                        minX: box.min.x, maxX: box.max.x,
                                        minZ: box.min.z, maxZ: box.max.z
                                    });
                                }
                                child.visible = false;
                                child.userData.ignoreRaycast = true;
                            }
                        });
                    }
                },

                // ==========================================
                // 池エリア
                // ==========================================

                {
                    name: 'Barricade_NorthEast',
                    path: 'models/barricade.fbx',
                    pos: { x: 0, y: 0, z: 0 },
                    scale: 1.0,
                    onLoad: (master) => {
                        // ベンチの背後（x=4, z=-4）に密着させる設定
                        const startX = 6.0;  // ベンチからさらに後退
                        const startZ = -6.0; // ベンチからさらに後退
                        const count = 11;
                        const spacing = 2.3; // 隙間を詰めた精密な間隔

                        for (let i = 0; i < count; i++) {
                            // 角の重なりを防ぐため、i=0（角の地点）は生成をスキップ
                            if (i === 0) continue;
                            // 横列（南側の封鎖）
                            const bX = master.clone();
                            bX.position.set(startX + i * spacing, 0, startZ);
                            window.parkGroup.add(bX);

                            // 縦列（西側の封鎖）
                            const bZ = master.clone();
                            bZ.position.set(startX, 0, startZ - i * spacing);
                            bZ.rotation.y = Math.PI / 2;
                            window.parkGroup.add(bZ);
                        }

                        // 全バリケードにアウトライン適用
                        window.parkGroup.traverse(c => {
                            if (c.name === 'Barricade_NorthEast_Clone' || (c.parent && c.parent.name === 'Barricade_NorthEast')) {
                                if (window.applyOutlineRules) window.applyOutlineRules(c);
                            }
                        });
                        master.visible = false;

                        // 2. 物理封鎖の設定（createParkAssets 内）
                        // 物理封鎖
                        window.sgExtraObstacles.push({ minX: 5.8, maxX: 32, minZ: -32, maxZ: -5.8 });
                    }
                }
            ];

            const loader = new FBXLoader();
            window.sgMixers = []; // Clear mixers

            ASSET_CONFIG.forEach(config => {
                // Pre-register exclusions if positions are defined
                if (typeof ExclusionManager !== 'undefined' && ExclusionManager.addCircle) {
                    if (config.positions) {
                        config.positions.forEach(p => ExclusionManager.addCircle(p.x, p.z, config.exclusionRadius || 2.0));
                    } else {
                        ExclusionManager.addCircle(config.pos.x, config.pos.z, config.exclusionRadius || 2.0);
                    }
                }

                loader.load(config.path, (masterFBX) => {
                    try {
                        const targets = config.positions ? config.positions : [config.pos];

                        targets.forEach((pos, i) => {
                            let fbx;
                            if (typeof SkeletonUtils !== 'undefined') {
                                fbx = SkeletonUtils.clone(masterFBX);
                            } else {
                                fbx = masterFBX.clone(); // Fallback
                            }

                            fbx.name = config.name + (config.positions ? `_${i}` : '');
                            fbx.position.set(pos.x, config.pos.y || 0, pos.z);

                            if (config.rot && config.rot.y !== undefined) {
                                fbx.rotation.y = config.rot.y * (Math.PI / 180);
                            }

                            // Scale
                            fbx.scale.setScalar(config.scale || 1.0);

                            // ★徹底洗浄: マテリアルを標準状態にリセット
                            fbx.traverse(c => {
                                if (c.isMesh) {
                                    c.castShadow = true;
                                    c.receiveShadow = true;

                                    if (c.material) {
                                        // 配列マテリアル対応
                                        const materials = Array.isArray(c.material) ? c.material : [c.material];

                                        materials.forEach(mat => {
                                            // ★アクネ対策（影計算のみ裏面で行う）は全モデルに適用
                                            mat.shadowSide = THREE.BackSide;
                                        });
                                    }
                                }
                            });

                            // ★ Animation Handling
                            if (fbx.animations && fbx.animations.length > 0) {
                                const mixer = new THREE.AnimationMixer(fbx);
                                const action = mixer.clipAction(fbx.animations[0]);
                                action.play();
                                if (window.sgMixers) window.sgMixers.push(mixer);
                            }

                            if (config.onLoad) config.onLoad(fbx, i); // Pass index i here

                            if (typeof window.applyOutlineRules === 'function') window.applyOutlineRules(fbx);

                            if (config.collision) {
                                fbx.updateMatrixWorld(true);
                                const box = new THREE.Box3().setFromObject(fbx);
                                if (config.collisionType === 'cylinder') {
                                    const sizeX = box.max.x - box.min.x; const sizeZ = box.max.z - box.min.z;
                                    const radius = Math.max(sizeX, sizeZ) / 2 * 0.9;
                                    window.sgFountainCollision.push({ x: pos.x, z: pos.z, radius: radius });
                                } else {
                                    window.sgExtraObstacles.push({ minX: box.min.x + 0.1, maxX: box.max.x - 0.1, minZ: box.min.z + 0.1, maxZ: box.max.z - 0.1 });
                                }
                            }
                            window.parkGroup.add(fbx);
                        });

                        // Re-apply seasons after cloning (e.g. Parasol initial color)
                        if (config.name === 'Parasol' && window.setParasolSeason && typeof GameConfig !== 'undefined') {
                            window.setParasolSeason(GameConfig.currentSeason);
                        }

                    } catch (e) { console.error(`Error loading asset ${config.name}:`, e); }
                }, undefined, e => console.warn(`Failed to load ${config.name}:`, e));
            });



            // ▼▼▼ ⛄️体当たり人形 (Seasondoll) ▼▼▼

            const snowmanPositions = [{ x: 11, z: 14 }, { x: 11, z: 16 }, { x: 11, z: 18 }]; // Old: -14, -16, -18. Inverted: 14, 16, 18
            const winnerIndex = Math.floor(Math.random() * snowmanPositions.length);
            // ==========================================
            // 1. マスターモデル管理 & 季節カラー定義
            // ==========================================
            window.seasonDollMaster = null; // キャッシュ用
            window.pendingDollRequests = []; // ロード待ちキュー

            const SEASON_DOLL_COLORS = {
                spring: 0xFFB7C5, // 桜色
                summer: 0x4FC3F7, // 水色
                autumn: 0xFFAE00, // オレンジ
                winter: 0xb8eef7  // 薄氷色
            };

            // ==========================================
            // 2. 季節更新関数の定義
            // ==========================================
            window.updateSeasonDollColor = (seasonName) => {
                const targetColor = new THREE.Color(SEASON_DOLL_COLORS[seasonName] || SEASON_DOLL_COLORS.winter);

                if (window.sgSnowmen) {
                    window.sgSnowmen.forEach(doll => {
                        doll.traverse(child => {
                            if (child.isMesh) {
                                // ★bodyのみ色変更
                                const name = child.name.toLowerCase();
                                if (name.includes('body')) {
                                    if (child.material) {
                                        // 配列マテリアル対応
                                        if (Array.isArray(child.material)) {
                                            child.material.forEach(m => m.color.copy(targetColor));
                                        } else {
                                            child.material.color.copy(targetColor);
                                        }
                                    }
                                }
                            }
                        });
                    });
                }
                console.log(`⛄️ SeasonDolls body color updated to: ${seasonName}`);
            };

            // ==========================================
            // 3. createSnowman 関数の上書き (FBX版)
            // ==========================================
            // 既存の createSnowman を完全に置き換えます。
            // 呼び出し元のロジック(座標configなど)はそのまま利用されます。

            const createSnowman = (config, isWinner, hasPaid = false) => {
                // 実際にシーンに配置する内部関数
                const placeDoll = (master, conf, winnerFlag, paidFlag) => {
                    const doll = master.clone();

                    // 座標適用 (既存ロジック準拠)
                    doll.position.set(conf.x, 0, conf.z);

                    // ランダム回転 (お好みで調整可能。今はランダム)
                    doll.rotation.y = Math.random() * Math.PI * 2;

                    // ★スケール設定 (標準化)
                    // ここを書き換えることで、後で「0.9 + Math.random() * 0.2」のように個体差を出せます。
                    // 現時点では指示通り「基準 1.0」とします。
                    const baseScale = 0.8;
                    doll.scale.setScalar(baseScale);

                    // ギミック移植
                    doll.userData.isWinner = winnerFlag;
                    doll.userData.hasPaid = paidFlag;
                    doll.userData.isDead = false;

                    // アニメーションミキサー初期化 (もし将来アニメさせるなら)
                    // doll.mixer = new THREE.AnimationMixer(doll);

                    // 管理リスト登録
                    window.parkGroup.add(doll);
                    window.sgSnowmen.push(doll);

                    // 衝突判定 (既存維持)
                    if (typeof ExclusionManager !== 'undefined') {
                        ExclusionManager.addCircle(conf.x, conf.z, 1.0);
                    }

                    // 現在の季節色を適用
                    if (typeof GameConfig !== 'undefined') {
                        const currentSeason = GameConfig.currentSeason || 'winter';
                        const color = new THREE.Color(SEASON_DOLL_COLORS[currentSeason]);

                        doll.traverse(c => {
                            if (c.isMesh && c.name.toLowerCase().includes('body')) {
                                if (c.material) {
                                    if (Array.isArray(c.material)) c.material.forEach(m => m.color.copy(color));
                                    else c.material.color.copy(color);
                                }
                            }
                        });
                    }
                };

                // --- ロード制御ロジック ---

                if (window.seasonDollMaster) {
                    // A. ロード済みなら即配置
                    placeDoll(window.seasonDollMaster, config, isWinner, hasPaid);
                } else {
                    // B. 未ロードならキューに追加してロード開始
                    window.pendingDollRequests.push({ config, isWinner, hasPaid });

                    // 初回のみローダー起動
                    if (window.pendingDollRequests.length === 1) {
                        const loader = new FBXLoader();
                        loader.load('models/seasondoll.fbx', (fbx) => {
                            console.log("📥 SeasonDoll Master Loaded.");

                            // マスターモデルの初期設定
                            fbx.traverse(c => {
                                if (c.isMesh) {
                                    c.castShadow = true;
                                    c.receiveShadow = true;
                                    // マテリアル独立化
                                    if (c.material) {
                                        c.material = Array.isArray(c.material)
                                            ? c.material.map(m => m.clone())
                                            : c.material.clone();
                                    }
                                }
                            });
                            fbx.animations = []; // 干渉防止

                            window.seasonDollMaster = fbx;

                            // 待機していた配置リクエストを一気に処理
                            window.pendingDollRequests.forEach(req => {
                                placeDoll(fbx, req.config, req.isWinner, req.hasPaid);
                            });
                            window.pendingDollRequests = []; // キューを空に

                        }, undefined, (err) => console.error("❌ Failed to load seasondoll.fbx", err));
                    }
                }
            };
            snowmanPositions.forEach((config, index) => createSnowman(config, index === winnerIndex));

            // コイン出現演出 (FBX版)
            const spawnDropCoin = (startPos) => {
                // マスターモデルが準備できていない場合は安全に中止
                if (!window.sgCoinMaster) {
                    console.warn("⚠️ Coin Master not ready. Using fallback or skipping.");
                    return;
                }

                // 本物のコインモデルをクローン
                const coin = window.sgCoinMaster.clone();

                // 座標・サイズ調整
                coin.position.copy(startPos);
                coin.position.y += 0.5;
                // coin.fbxはロード時にサイズ調整済みだが、cloneでリセットされる場合があるため念のため再適用
                // (ロード時のスケールロジックに依存しますが、ここでは安全策として0.5倍前後を目安に)
                // もしロード処理側で masterCoin.scale をセットしているなら、clone にも引き継がれます。

                // 影の設定
                coin.traverse(c => {
                    if (c.isMesh) {
                        c.castShadow = true;
                        c.receiveShadow = true;
                    }
                });

                coin.userData.isCoin = true;
                coin.userData.collected = false;

                // アウトライン追加
                if (window.addEdgesOutline) window.addEdgesOutline(coin, 15, 0x000000);

                scene.add(coin);
                if (window.sgGameCoins) window.sgGameCoins.push(coin);

                // 飛び出しアニメーション (物理挙動風)
                let velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    0.4, // 上への跳ね上がり
                    (Math.random() - 0.5) * 0.2
                );
                let gravity = 0.02;

                const dropAnim = setInterval(() => {
                    // 親から削除されたら終了
                    if (!coin.parent || coin.userData.collected) {
                        clearInterval(dropAnim);
                        return;
                    }

                    // 移動と回転
                    coin.position.add(velocity);
                    coin.rotation.y += 0.3; // クルクル回る
                    velocity.y -= gravity;

                    // 地面に着地
                    if (coin.position.y <= 0.5) {
                        coin.position.y = 0.5;
                        clearInterval(dropAnim);
                    }
                }, 16);
            };



            // アニメーション監視ループ (エラー修正・安全化版)
            if (window.sgSnowmanInterval) clearInterval(window.sgSnowmanInterval);

            window.sgSnowmanInterval = setInterval(() => {
                // 【安全装置1】プレイヤー座標やシーンが未ロードなら何もせずリターン
                // これで "reading 'z'" エラーの9割を防ぎます
                if (!playerPosition || !scene) return;

                // 1. 雪だるま判定
                if (window.sgSnowmen) {
                    window.sgSnowmen.forEach(snowman => {
                        // 【安全装置2】親から外れた(削除された)雪だるまは無視
                        if (!snowman || !snowman.parent || snowman.userData.isDead || !snowman.visible) return;

                        const worldPos = new THREE.Vector3();
                        snowman.getWorldPosition(worldPos);

                        // 距離チェック
                        if (playerPosition.distanceTo(worldPos) < 2.0) {

                            // ▼▼▼ 今回の追加箇所 (boing) ▼▼▼
                            window.AudioManager.play('boing', 1.0);
                            // ▲▲▲ 追加ここまで ▲▲▲

                            snowman.visible = false;
                            snowman.userData.isDead = true;

                            if (typeof spawnSnowExplosion === 'function') spawnSnowExplosion(worldPos);

                            if (snowman.userData.isWinner && !snowman.userData.hasPaid) {
                                snowman.userData.hasPaid = true;
                                // if (typeof spawnDropCoin === 'function') spawnDropCoin(worldPos); // ★コイン生成のみ停止

                                // ▼ 追加：コイン出現音 ▼
                                window.AudioManager.play('wheeee', 1.0);

                                const div = document.createElement('div');
                                div.textContent = "🎉POP!";
                                div.style.position = 'fixed'; div.style.left = '50%'; div.style.top = '50%'; div.style.color = '#FFD700';
                                div.style.fontSize = '40px'; div.style.fontWeight = 'bold'; div.style.textShadow = '0 0 10px black';
                                div.style.transform = 'translate(-50%, -50%)'; div.style.zIndex = 3000;
                                div.style.animation = 'floatUp 1s forwards';
                                document.body.appendChild(div); setTimeout(() => div.remove(), 1000);
                            }

                            setTimeout(() => {
                                // ★修正: 古いオブジェクトを完全削除
                                const oldX = snowman.position.x;
                                const oldZ = snowman.position.z;
                                const wasWinner = snowman.userData.isWinner;
                                const wasPaid = snowman.userData.hasPaid; // ★ 支払い履歴を継承

                                if (snowman.parent) {
                                    snowman.parent.remove(snowman);
                                }

                                // 配列からも削除 (安全のため)
                                const idx = window.sgSnowmen.indexOf(snowman);
                                if (idx > -1) window.sgSnowmen.splice(idx, 1);

                                // ★修正: 新しい関数経由で、新品をリスポーンさせる
                                // これならスケールも季節カラーも最新ルールが適用される！
                                if (typeof createSnowman === 'function') {
                                    createSnowman({ x: oldX, z: oldZ }, wasWinner, wasPaid);
                                }
                            }, 5000); // 復活時間 (3秒に変更指示があればここ)
                        }
                    });
                }


                // ▼▼▼ 🐘象さん (ElephantSprayer) ▼▼▼

                const elephant = scene.getObjectByName('ElephantSprayer');
                // ★修正: elephant.position の存在チェックを追加
                if (elephant && elephant.position) {
                    const pPos = playerPosition;

                    // 鼻先
                    const noseOffset = new THREE.Vector3(0, 0, 0.8).applyQuaternion(elephant.quaternion);
                    const noseWorldPos = elephant.position.clone().add(noseOffset);

                    const isNoseActive = pPos.distanceTo(noseWorldPos) < 1.6;
                    if (elephant.userData.noseStreams) {
                        elephant.userData.noseStreams.forEach(s => s.visible = isNoseActive);
                    }
                    if (isNoseActive) {
                        if (typeof window.spawnFountainSparkles === 'function')
                            window.spawnFountainSparkles(noseWorldPos.x, 0.1, noseWorldPos.z, true, false);

                        // ▼▼▼ LOOP ON ▼▼▼
                        window.AudioManager.playLoop('splash', 0.8);
                    } else {
                        // ▲▲▲ LOOP OFF ▲▲▲
                        window.AudioManager.stopLoop('splash');
                    }

                    // 背中
                    const backSensorOffset = new THREE.Vector3(0, 0.6, -0.8).applyQuaternion(elephant.quaternion);
                    const backSensorPos = elephant.position.clone().add(backSensorOffset);
                    const backFaucetOffset = new THREE.Vector3(0, 1.0, -0.65).applyQuaternion(elephant.quaternion);
                    const backFaucetPos = elephant.position.clone().add(backFaucetOffset);

                    const isBackActive = pPos.distanceTo(backSensorPos) < 1.4;
                    if (elephant.userData.backStreams) {
                        elephant.userData.backStreams.forEach(s => s.visible = isBackActive);
                    }
                    if (isBackActive) {
                        if (typeof window.spawnFountainSparkles === 'function')
                            window.spawnFountainSparkles(backFaucetPos.x, backFaucetPos.y, backFaucetPos.z, false, true);

                        // ▼▼▼ LOOP ON ▼▼▼
                        window.AudioManager.playLoop('psshhh', 0.8);
                    } else {
                        // ▲▲▲ LOOP OFF ▲▲▲
                        window.AudioManager.stopLoop('psshhh');
                    }
                }

            }, 30);


        } catch (error) { console.error("CRITICAL ERROR in createParkAssets:", error); }
    }


    window.showFloatingMessage = function (text) {
        const el = document.getElementById('floating-message');
        if (el) {
            el.textContent = text;
            el.style.display = 'block';
            el.style.opacity = '1';
            el.style.transition = 'none';

            // アニメーション (Pop In)
            el.style.transform = 'translate(-50%, -50%) scale(0.5)';
            setTimeout(() => {
                el.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                el.style.transform = 'translate(-50%, -50%) scale(1.0)';
            }, 10);

            if (window.floatingMessageTimeout) clearTimeout(window.floatingMessageTimeout);

            window.floatingMessageTimeout = setTimeout(() => {
                el.style.transition = 'opacity 1s';
                el.style.opacity = '0';
                setTimeout(() => {
                    if (el.style.opacity === '0') el.style.display = 'none';
                }, 1000);
            }, 3000);
        }
    };


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

        // Update interaction lights/hints
        if (window.updateInteractionHints) window.updateInteractionHints(dt);

        if (currentState === GameState.ENDING) {
            updateEndingAnimation(dt);
            return;
        }

        if (currentState === GameState.OPENING) {
            return;
        }

        if (currentState === GameState.PLAYING) {
            if (window.sgUpdateMovement) window.sgUpdateMovement(dt);

            updateUI(); // 最適化された updateUI を呼ぶ

            // Coin Rotation
            if (window.sgGameCoins) {
                window.sgGameCoins.forEach(coin => {
                    if (coin.visible) coin.rotation.y += 3.0 * dt;
                });
            }

            updateGameplayShiver(dt);

            // ■ 独立したコイン更新ループ（メモリ最適化版）
            if (window.sgActiveCoins) {
                // ★最適化: ループ外で一時変数を確保（GC対策）
                const tempVec = new THREE.Vector3();

                window.sgActiveCoins = window.sgActiveCoins.filter(coin => {
                    if (coin.userData.collected) return false;

                    const parentTree = coin.userData.parentTree;
                    coin.rotation.y += 5.0 * dt;

                    // A. トリガー判定
                    if (!coin.userData.isFalling && !coin.userData.hasFallen) {
                        const treePos = parentTree ? parentTree.position : coin.position;

                        // ★最適化: distanceToSquared を使用し、高さ(y)を無視した距離計算を軽量化
                        const dx = playerPosition.x - treePos.x;
                        const dz = playerPosition.z - treePos.z;
                        const distSq = dx * dx + dz * dz;

                        // 2.0m * 2.0m = 4.0
                        if (distSq < 4.0) {
                            coin.userData.isFalling = true;
                            scene.attach(coin);

                            // ★最適化: Box3.setFromObject を初回のみ実行し、結果をキャッシュ
                            if (typeof coin.userData.groundY === 'undefined') {
                                const box = new THREE.Box3().setFromObject(coin);
                                coin.userData.groundY = (box.max.y - box.min.y) / 2;
                            }

                            // プレイヤー方向へ弾く計算
                            tempVec.subVectors(playerPosition, coin.position).normalize();
                            const angleOffset = (Math.random() - 0.5) * Math.PI;
                            const cos = Math.cos(angleOffset);
                            const sin = Math.sin(angleOffset);

                            coin.userData.velX = (tempVec.x * cos - tempVec.z * sin) * 1.5;
                            coin.userData.velZ = (tempVec.x * sin + tempVec.z * cos) * 1.5;
                            coin.userData.velY = 4.0;

                            if (parentTree) parentTree.userData.shakeTimer = 0.5;
                        }
                    }

                    // B. 木の揺れ
                    if (parentTree && parentTree.userData.shakeTimer > 0) {
                        parentTree.userData.shakeTimer -= dt;
                        const s = parentTree.userData.shakeTimer;
                        parentTree.rotation.z = Math.sin(s * 80) * 0.1 * s;
                        parentTree.rotation.x = Math.cos(s * 80) * 0.1 * s;
                    } else if (parentTree) {
                        parentTree.rotation.z = 0;
                        parentTree.rotation.x = 0;
                    }

                    // C. 落下物理
                    if (coin.userData.isFalling) {
                        coin.userData.velY -= 15.0 * dt;
                        coin.position.x += coin.userData.velX * dt;
                        coin.position.y += coin.userData.velY * dt;
                        coin.position.z += coin.userData.velZ * dt;

                        const targetY = coin.userData.groundY || 0.25;
                        if (coin.position.y <= targetY) {
                            coin.position.y = targetY;
                            coin.userData.isFalling = false;
                            coin.userData.hasFallen = true;

                            if (coin.userData.pointLight) {
                                coin.userData.pointLight.intensity = 0;
                            }

                            coin.traverse((child) => {
                                if (child.isMesh && child.material) {
                                    if (child.material.color) child.material.color.setHex(0xFFFFFF);
                                    if (!(child.material instanceof THREE.MeshBasicMaterial)) {
                                        const oldMat = child.material;
                                        child.material = new THREE.MeshBasicMaterial({
                                            map: oldMat.map,
                                            color: 0xFFFFFF,
                                            side: THREE.DoubleSide
                                        });
                                    }
                                }
                            });

                            if (window.testTreeCollision) {
                                window.testTreeCollision.hasCoin = false;
                            }
                        }
                    }
                    return true;
                });
            }
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
                let obj = hit.object;

                // [Rule 1] Redirect Hitbox to Parent
                if (obj.userData.isHitBox && obj.userData.parentItem) {
                    obj = obj.userData.parentItem;
                }

                // 1. Vending Machine HitBox
                if (obj.userData.isVendingMachine && hit.distance <= 4.0) {
                    targetFound = obj;
                    targetType = 'vending';
                    break; // Priority
                }

                // [Rule 2] Generic Interaction (Shovel, etc.)
                // Traverse up to find the root interactable
                let interactable = obj;
                while (interactable && !interactable.userData.action && interactable !== scene) {
                    interactable = interactable.parent;
                }

                if (interactable && interactable.userData.action) {
                    // ★ STRICT DISTANCE CHECK ★
                    // Calculate distance from Player's feet (XZ plane), not Camera
                    const worldPos = new THREE.Vector3();
                    interactable.getWorldPosition(worldPos);

                    if (typeof playerPosition !== 'undefined') {
                        const dx = playerPosition.x - worldPos.x;
                        const dz = playerPosition.z - worldPos.z;
                        const distSq = dx * dx + dz * dz;
                        const THRESHOLD_SQ = 3.0 * 3.0; // 3mまで反応

                        if (distSq <= THRESHOLD_SQ) {
                            targetFound = interactable;
                            targetType = 'action'; // Mark as generic action
                            break; // Stop checking other objects
                        }
                    }
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
                } else if (targetType === 'action') {
                    getBtn.innerHTML = '⛏️<br>DIG'; // Show Dig Icon
                    getBtn.style.background = '#FFD700'; // Gold color
                } else {
                    getBtn.innerHTML = '🖐️<br>GET!';
                    getBtn.style.background = ''; // Reset to default
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
        // Init mix clock if needed
        if (!window.sgClock) window.sgClock = new THREE.Clock();
        const delta = window.sgClock.getDelta();

        // Update Mixers
        if (window.sgMixers && window.sgMixers.length > 0) {
            window.sgMixers.forEach(mixer => mixer.update(delta));
        }

        if (renderer && scene && camera) {
            // Debug Log for Ending Camera
            if (currentState === GameState.ENDING) {
                // Throttle log to once per second approx? No, user asked for it. 
                // But let's simple throttle to avoid console flood 60fps
                if (Math.random() < 0.01) {
                    console.log('RENDER CAMERA', currentState, camera.uuid, camera.position.toArray());
                }
            }

            // DEBUG: 座標情報の更新
            if (typeof GameConfig !== 'undefined' && GameConfig.debugMode) {
                const panel = document.getElementById('debug-pos-panel');
                if (panel && camera) {
                    const x = camera.position.x.toFixed(2);
                    const z = camera.position.z.toFixed(2);
                    const y = camera.position.y.toFixed(2);
                    panel.innerText = `POS X:${x} Z:${z} H:${y}`;
                }
            }

            renderer.render(scene, camera);
        }
    }






    // ==========================================
    // 木 (Tree) と ベンチ (Bench) の配置（品質維持・最適化版）
    // ==========================================

    /*
        function spawnTrees() {
            console.log("--- spawnTrees CALLED (Time Slicing Mode) ---");
     
            // ★ 葉っぱ専用カラーパレット
            const TREE_PALETTES = {
                spring: [0xFF69B4, 0xFF1493, 0xFF99CC, 0xFFB6C1],
                summer: [0x66BB6A, 0x43A047, 0x81C784, 0x9CCC65],
                autumn: [0xFF4500, 0xD2691E, 0xFF8C00, 0xFFD700],
                winter: [0xE6E6FA, 0xF8F8FF, 0xD8BFD8]
            };
            window.sgTreeObjects = [];
            window.sgTreeCollisions = [];
     
            // ★ 季節切り替え関数
            window.setTreeSeason = (seasonName) => {
                // (この中身は変更なし)
                console.log(`Setting Tree Season to: ${seasonName}`);
                const palette = TREE_PALETTES[seasonName] || TREE_PALETTES.summer;
                window.sgTreeObjects.forEach((tree, index) => {
                    const colorHex = palette[index % palette.length];
                    const leafColorObj = new THREE.Color(colorHex);
                    const trunkColorObj = new THREE.Color(0xFFFFFF);
                    tree.traverse(child => {
                        if (child.isMesh && child.material) {
                            const name = child.name.toLowerCase();
                            const isLeaves = name.includes('leaves') || name.includes('leaf') || name.includes('canopy');
                            if (child.material.color) {
                                child.material.color.copy(isLeaves ? leafColorObj : trunkColorObj);
                            }
                        }
                    });
                });
            };
     
            // 並木設定
            const AVENUE_OFFSET = 4.0;
            const AVENUE_START = 10.0;
            const AVENUE_END = 30.0;
            const AVENUE_STEP = 4.0;
     
            // ===================================
            // 1. ベンチの配置 (Benches) - 変更なし
            // ===================================
            const benchLoader = new FBXLoader();
            benchLoader.load('models/bench.fbx', (masterBench) => {
                masterBench.scale.setScalar(1.0);
                if (typeof window.applyOutlineRules === 'function') window.applyOutlineRules(masterBench);
                masterBench.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
     
                const addBench = (x, z, rotY) => {
                    if (Math.abs(x - 4) < 0.1 && Math.abs(z - 16) < 0.1) return;
                    const bench = masterBench.clone();
                    bench.position.set(x, 0, z);
                    bench.rotation.y = rotY * (Math.PI / 180);
                    scene.add(bench);
                    if (typeof ExclusionManager !== 'undefined') ExclusionManager.addCircle(x, z, 1.5);
                };
     
                for (let d = AVENUE_START; d <= AVENUE_END; d += AVENUE_STEP) {
                    const b = d - 2.0;
                    addBench(b, 4, 180); addBench(-b, 4, 180);
                    addBench(b, -4, 0); addBench(-b, -4, 0);
                    addBench(4, b, -90); addBench(4, -b, -90);
                    addBench(-4, b, 90); addBench(-4, -b, 90);
                }
            });
     
            // ===================================
            // 2. 木の配置 (Trees) - ★タイムスライス実装★
            // ===================================
            const treeLoader = new FBXLoader();
            treeLoader.load('models/tree.fbx', (masterTree) => {
                console.log('FBX Loaded: tree.fbx (Starting Time Slicing Generation)');
                window.sgMasterTree = masterTree;
     
                // ★Step 1: 親玉（マスター）のセットアップ
                masterTree.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (child.material) {
                            const mList = Array.isArray(child.material) ? child.material : [child.material];
                            const name = child.name.toLowerCase();
                            const isLeaves = name.includes('leaves') || name.includes('leaf') || name.includes('canopy');
     
                            mList.forEach(m => {
                                m.emissive.setHex(0x000000);
                                if (isLeaves) {
                                    m.transparent = false;
                                    m.alphaTest = 0.5;
                                    m.side = THREE.DoubleSide;
                                }
                            });
                        }
                        child.userData.isTree = true;
                        // アウトラインの事前計算
                        if (child.geometry) {
                            const edgesGeometry = new THREE.EdgesGeometry(child.geometry, 15);
                            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
                            const edges = new THREE.LineSegments(edgesGeometry, lineMaterial);
                            edges.userData.isOutline = true;
                            child.add(edges);
                        }
                    }
                });
     
                // 生成予定リスト（まだシーンには追加しない）
                const plantingQueue = [];
     
                // A. 並木道 (Avenue)
                // 並木は本数が少なく、ゲームプレイに重要なので、先にリストへ
                const addFixedTree = (x, z) => {
                    // ここでは座標とタイプだけ登録
                    plantingQueue.push({ x: x, z: z, type: 'avenue' });
                    if (typeof ExclusionManager !== 'undefined') ExclusionManager.addCircle(x, z, 2.0);
                };
                for (let d = AVENUE_START; d <= AVENUE_END; d += AVENUE_STEP) {
                    addFixedTree(d, AVENUE_OFFSET); addFixedTree(d, -AVENUE_OFFSET);
                    addFixedTree(-d, AVENUE_OFFSET); addFixedTree(-d, -AVENUE_OFFSET);
                    addFixedTree(AVENUE_OFFSET, d); addFixedTree(-AVENUE_OFFSET, d);
                    addFixedTree(AVENUE_OFFSET, -d); addFixedTree(-AVENUE_OFFSET, -d);
                }
     
                // B. ランダム配置 (Forest)
                const NUM_TREES = 160;
                let attempts = 0;
                const MIN_TREE_DISTANCE = 2.5;
                const MIN_DIST2 = MIN_TREE_DISTANCE * MIN_TREE_DISTANCE;
                const range = 62;
                // 既に配置が決まった座標リスト（並木含む）
                const placedPositions = plantingQueue.map(p => ({ x: p.x, z: p.z }));
     
                const isTooClose = (x, z) => {
                    for (const placed of placedPositions) {
                        const dx = x - placed.x;
                        const dz = z - placed.z;
                        if ((dx * dx + dz * dz) < MIN_DIST2) return true;
                    }
                    return false;
                };
     
                while (plantingQueue.length < (NUM_TREES + 24) && attempts < 10000) {
                    attempts++;
                    const x = (Math.random() - 0.5) * range;
                    const z = (Math.random() - 0.5) * range;
                    if (typeof ExclusionManager !== 'undefined' && ExclusionManager.isBlocked(x, z)) continue;
                    if (isTooClose(x, z)) continue;
     
                    plantingQueue.push({ x: x, z: z, type: 'forest' });
                    placedPositions.push({ x: x, z: z });
                    if (typeof ExclusionManager !== 'undefined') ExclusionManager.addCircle(x, z, 1.2);
                }
     
                // C. 外周の木 (Exterior)
                const NUM_EXTERIOR = 70;
                for (let i = 0; i < NUM_EXTERIOR; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 45 + Math.random() * 35;
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;
                    plantingQueue.push({ x: x, z: z, type: 'exterior' });
                }
     
                console.log(`Total Trees to Plant: ${plantingQueue.length}`);
     
                // ★★★ タイムスライス実行ロジック ★★★
                const masterBox = new THREE.Box3().setFromObject(masterTree);
                const masterOffsetY = -masterBox.min.y;
     
                // 1フレームに植える本数（PC/スマホの性能に合わせて調整可）
                const BATCH_SIZE = 5;
     
                const processPlanting = () => {
                    // キューが空になったら終了
                    if (plantingQueue.length === 0) {
                        console.log("🌲 All trees planted.");
                        // 隠しコインのセットアップ（木が生え終わった後に実行）
                        setupHiddenCoin();
                        // 色の最終適用
                        if (window.setTreeSeason) window.setTreeSeason(GameConfig.currentSeason);
                        return;
                    }
     
                    // バッチサイズ分だけ処理
                    const batch = plantingQueue.splice(0, BATCH_SIZE);
     
                    batch.forEach((data, i) => {
                        const tree = masterTree.clone();
                        tree.userData.isTree = true;
     
                        // スケールと位置
                        let scale = 1.0;
                        if (data.type === 'exterior') {
                            scale = 1.2 + Math.random() * 0.8;
                        } else {
                            scale = 0.8 + Math.random() * 0.4;
                        }
                        tree.scale.setScalar(scale);
                        tree.position.set(data.x, masterOffsetY * scale, data.z);
                        tree.rotation.y = Math.random() * Math.PI * 2;
     
                        // マテリアルの独立化
                        tree.traverse(child => {
                            if (child.isMesh && child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material = child.material.map(m => m.clone());
                                } else {
                                    child.material = child.material.clone();
                                }
                            }
                        });
     
                        scene.add(tree);
                        window.sgTreeObjects.push(tree);
     
                        // 森の木だけ衝突判定を追加
                        if (data.type !== 'exterior') {
                            window.sgTreeCollisions.push({ x: data.x, z: data.z, radius: 0.3 * scale });
                        }
                    });
     
                    // 次のフレームで続きを実行
                    requestAnimationFrame(processPlanting);
                };
     
                // 植樹開始！
                processPlanting();
     
            }, undefined, (error) => console.error('Error loading tree.fbx:', error));
    */

    /*
            // --- Helper Function for Stump ---
            function createCoin(x, y, z) {
                const loader = new FBXLoader();
                loader.load('models/coin.fbx', (coin) => {
                    coin.scale.setScalar(0.015);
                    coin.position.set(x, y, z);
     
                    coin.traverse(c => {
                        if (c.isMesh) {
                            c.castShadow = true;
                            const oldMat = Array.isArray(c.material) ? c.material[0] : c.material;
                            c.material = new THREE.MeshBasicMaterial({
                                map: oldMat ? oldMat.map : null,
                                color: 0xFFD700,
                                side: THREE.DoubleSide
                            });
                        }
                    });
     
                    coin.userData.isCoin = true;
                    coin.userData.collected = false;
     
                    // アニメーション用
                    coin.userData.spinSpeed = 0.05;
                    const animateCoin = () => {
                        if (!coin.parent && !coin.userData.collected && coin.visible) {
                            // シーン直下の場合も回す
                            coin.rotation.y += coin.userData.spinSpeed;
                            requestAnimationFrame(animateCoin);
                        } else if (coin.parent && !coin.userData.collected) {
                            coin.rotation.y += coin.userData.spinSpeed;
                            requestAnimationFrame(animateCoin);
                        }
                    };
                    animateCoin();
     
                    window.parkGroup.add(coin); // シーンに追加
                    if (window.sgGameCoins) window.sgGameCoins.push(coin);
                });
            }
     
        }
    */

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
    // 草 (Grass) の配置と季節カラー管理 - InstancedMesh Edition
    // ==========================================
    /**
     * 🛠️ PROJECT POTATO: ULTRA LIGHTWEIGHT GRASS (InstancedMesh Edition)
     * [GOAL] 800個の草をInstancedMeshに統合し、ドローコールを1/800に削減。
     * [FIX] 既存の setGrassSeason との互換性を維持。
     */

    // ★ 季節ごとのカラーパレット定義
    const GRASS_PALETTES = {
        spring: [0x90EE90, 0x98FB98, 0xADFF2F],
        summer: [0x66BB6A, 0x43A047, 0x81C784, 0x9CCC65],
        autumn: [0xCD853F, 0xDAA520, 0x8B4513],
        winter: [0xDDDDDD]
    };

    // ★ 季節切り替え関数 (InstancedMesh対応版)
    window.setGrassSeason = (seasonName) => {
        if (!window.sgGrassInstancedMesh) return;

        const palette = GRASS_PALETTES[seasonName] || GRASS_PALETTES.summer;
        const mesh = window.sgGrassInstancedMesh;
        const color = new THREE.Color();

        for (let i = 0; i < mesh.count; i++) {
            const hex = palette[i % palette.length];
            color.setHex(hex);
            mesh.setColorAt(i, color);
        }
        mesh.instanceColor.needsUpdate = true;
        console.log(`❄️ Instanced Grass: Color updated to ${seasonName}.`);
    };

    // ==========================================
    // 1. 草 (Grass) の配置修正 (Final Fix)
    // ==========================================
    function spawnGrass() {
        if (window.hasSpawnedGrass) return;
        window.hasSpawnedGrass = true;

        console.log("--- spawnGrass CALLED (Final Fix Mode) ---");

        // クリーンアップ
        if (window.sgGrassObjects) {
            window.sgGrassObjects.forEach(g => { if (g.parent) g.parent.remove(g); });
        }
        window.sgGrassObjects = [];

        // 不要なInstancedMesh削除
        const existing = scene.getObjectByName('InstancedGrassField');
        if (existing) {
            if (existing.geometry) existing.geometry.dispose();
            scene.remove(existing);
        }
        window.sgGrassInstancedMesh = null;

        const loader = new FBXLoader();
        loader.load('models/grass.fbx', (masterGrass) => {

            // ★対策: アニメーション干渉排除 & Pivot補正準備
            masterGrass.animations = [];
            const temp = masterGrass.clone();
            temp.scale.setScalar(1);
            temp.rotation.set(0, 0, 0);
            temp.position.set(0, 0, 0);
            const tempBox = new THREE.Box3().setFromObject(temp);
            const baseOffset = -tempBox.min.y; // 底上げ量

            // マテリアル設定
            masterGrass.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = false;
                    child.receiveShadow = false;
                    child.userData.ignoreGround = true;
                    child.frustumCulled = false; // 視界外判定無効化

                    if (child.material) {
                        const setMat = (m) => {
                            m.transparent = true;
                            m.alphaTest = 0.5;
                            m.side = THREE.DoubleSide;
                            if (m.emissive) m.emissive.setHex(0x000000);
                        };
                        if (Array.isArray(child.material)) child.material = child.material.map(m => m.clone());
                        else child.material = child.material.clone();

                        if (Array.isArray(child.material)) child.material.forEach(setMat);
                        else setMat(child.material);
                    }
                }
            });

            // 配置ループ (while文で数を保証)
            const targetCount = 200;
            const range = 62;
            let count = 0;
            let attempts = 0;

            while (count < targetCount && attempts < 5000) {
                attempts++;
                const x = (Math.random() - 0.5) * range;
                const z = (Math.random() - 0.5) * range;

                if (typeof ExclusionManager !== 'undefined' && ExclusionManager.isBlocked(x, z)) continue;

                const grass = masterGrass.clone();

                // ★スケールと位置補正
                const scale = 3.5 + Math.random() * 3.0;
                grass.scale.setScalar(scale);

                const y = baseOffset * scale;
                grass.position.set(x, y, z);
                grass.rotation.y = Math.random() * Math.PI * 2;

                grass.updateMatrix();
                grass.updateMatrixWorld(true);

                scene.add(grass);
                window.sgGrassObjects.push(grass);
                count++;
            }
            console.log(`✅ Grass Placed: ${count} patches (Final Fix).`);

            if (typeof window.setGrassSeason === 'function' && typeof GameConfig !== 'undefined') {
                window.setGrassSeason(GameConfig.currentSeason);
            }

        }, undefined, (err) => console.error(err));
    }


    // ==========================================
    // 🌊 POND SYSTEM: Single FBX Model Approach (+ Stone Wall)
    // ==========================================
    function spawnPond() {
        if (window.hasSpawnedPond) return;
        window.hasSpawnedPond = true;

        // 池の中心座標
        const POND_POSITION = { x: 22.7, y: 0, z: -18 };

        console.log("🌊 [POND] Initializing spawn logic...");

        const executePondSpawn = () => {
            console.log("🌊 [POND] Scene Ready. Loading assets...");
            const loader = new FBXLoader();

            // Load Pond and Stone in parallel
            const loadPond = new Promise((resolve, reject) => {
                loader.load('models/pond.fbx', resolve, undefined, reject);
            });
            const loadStone = new Promise((resolve, reject) => {
                loader.load('models/stone.fbx', resolve, undefined, reject);
            });

            Promise.all([loadPond, loadStone]).then(([pondModel, stoneModel]) => {
                // --- 1. Pond Setup ---
                // Restore height (User requested Ground Level = 0)
                // Fix: Z-fighting reported. Lifting slightly (1cm).
                pondModel.position.set(POND_POSITION.x, 0.01, POND_POSITION.z);
                pondModel.scale.setScalar(2.5);

                // Load Gravel Texture
                const texLoader = new THREE.TextureLoader();
                const gravelTex = texLoader.load('assets/gravelmat.png');
                gravelTex.colorSpace = THREE.SRGBColorSpace;
                gravelTex.wrapS = THREE.RepeatWrapping;
                gravelTex.wrapT = THREE.RepeatWrapping;
                // Revert repeat to 1x1 (Let UVs control the scale entirely)
                gravelTex.repeat.set(1, 1);

                pondModel.traverse(child => {
                    if (child.isMesh) {
                        const name = child.name.toLowerCase();
                        // console.log(`🌊 [POND] Found Mesh: ${name}`); // Debug

                        if (name.includes('gravelmat')) {
                            // ★ Debug: Check for UVs
                            const geom = child.geometry;
                            const hasUV = geom.attributes.uv !== undefined;
                            // console.log(`🪨 [Gravel] Mesh: ${child.name}, HasUV: ${hasUV}`);

                            // ★ Fix: Planar Mapping with adjusted scale
                            if (!hasUV || true) { // Force Planar Mapping for safety (User reported solid color)
                                const posAttribute = geom.attributes.position;
                                const uvArray = new Float32Array(posAttribute.count * 2);

                                for (let i = 0; i < posAttribute.count; i++) {
                                    const x = posAttribute.getX(i);
                                    const y = posAttribute.getY(i); // ★Fix: Use Y instead of Z (Mesh is likely XY-plane in local space)
                                    // Scale UVs: 1.0 means texture repeats every 1.0 local units (approx 2.5m in world)
                                    // Previously combined with repeat 16, it was too dense. Now it's natural.
                                    const uvScale = 1.0;
                                    uvArray[i * 2] = x * uvScale;
                                    uvArray[i * 2 + 1] = y * uvScale;
                                }
                                geom.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
                                geom.attributes.uv.needsUpdate = true;
                                // console.log("🔧 [Gravel] Generated Planar UVs.");
                            }

                            // ★ Fix: Vertex Colorによる擬似的深度表現 (Radial Gradient)
                            geom.computeBoundingBox();
                            const bbox = geom.boundingBox;
                            const centerX = (bbox.max.x + bbox.min.x) / 2;
                            const centerY = (bbox.max.y + bbox.min.y) / 2;
                            const maxRadius = Math.max(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y) / 2;

                            const count = geom.attributes.position.count;
                            const colors = new Float32Array(count * 3);
                            const colorCenter = new THREE.Color(0xaac1ef); // Center: Deep Dark Navy
                            const colorEdge = new THREE.Color(0x7cc8ef);   // Edge: Original tinted gravel

                            for (let i = 0; i < count; i++) {
                                const x = geom.attributes.position.getX(i);
                                const y = geom.attributes.position.getY(i);

                                // Calculate normalized distance from center (0.0 = Center, 1.0 = Edge)
                                const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                                let alpha = dist / maxRadius;
                                alpha = Math.min(1.0, Math.max(0.0, alpha));
                                // Non-linear curve for better depth feel (Stay dark longer)
                                alpha = Math.pow(alpha, 0.6);

                                const c = colorCenter.clone().lerp(colorEdge, alpha);
                                colors[i * 3] = c.r;
                                colors[i * 3 + 1] = c.g;
                                colors[i * 3 + 2] = c.b;
                            }
                            geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));


                            // ★ Gravel Settings (Opaque Ground)
                            child.material = new THREE.MeshLambertMaterial({
                                map: gravelTex,
                                side: THREE.DoubleSide,
                                vertexColors: true, // ★ Enable Vertex Colors
                                // color: 7cc8ef // Removed (Baked into vertex colors)
                            });
                            child.receiveShadow = true;
                            child.castShadow = false;

                            // ★ Debug: Restore bottom visibility after temporary check
                            child.visible = true;

                        } else {
                            // ★ Water Settings (Transparent Blue / Preserve Texture)
                            const setupWaterMaterial = (mat) => {
                                mat.transparent = true;
                                mat.opacity = 0.86;
                                mat.depthWrite = false;
                                mat.side = THREE.DoubleSide;

                                // ★追加：これが一番効きます。「自らぼんやり光る」設定を追加
                                mat.emissive = new THREE.Color(0x224488); // ほんのり青く光らせる
                                mat.emissiveIntensity = 0.3; // 発光の強さ（0.0〜1.0で調整）

                                // If no map exists, apply the deep blue color.
                                // If map exists (pond_block.png), use a lighter tint to not "blow out" the design.
                                if (mat.map) {
                                    mat.color.set(0xcccccc); // Light tint to preserve texture details
                                    console.log(`🌊 [POND] Using existing map for water: ${child.name}`);
                                } else {
                                    mat.color.set(0x00BFFF); // Default deep blue
                                }
                            };

                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => setupWaterMaterial(mat));
                            } else if (child.material) {
                                setupWaterMaterial(child.material);
                            }
                            child.castShadow = false;
                            child.receiveShadow = true;
                            child.frustumCulled = false;
                        }
                    }
                });

                pondModel.name = 'PondMain';
                scene.add(pondModel);

                // Register walkable surface
                if (typeof window.sgWalkableMeshes !== 'undefined' && Array.isArray(window.sgWalkableMeshes)) {
                    pondModel.traverse(child => {
                        if (child.isMesh) window.sgWalkableMeshes.push(child);
                    });
                }
                console.log(`✅ [POND] pond.fbx placed at (${POND_POSITION.x}, ${POND_POSITION.z})`);


                // --- 2. Stone Wall Setup (Marker Based) ---
                console.log("🪨 [POND] Looking for 'StonePoint' markers in pond model...");

                // Stone Settings
                // Fix: Previous calculation resulted in tiny stones.
                // stone.fbx is likely large, so let's try a fixed reasonable scale first.
                // Assuming stone.fbx is roughly unit size or larger.
                const stoneBaseScale = 0.01; // Try 0.01 (100x bigger than previous 0.0001??)

                // Let's re-measure properly
                stoneModel.scale.setScalar(1.0);
                const rawBox = new THREE.Box3().setFromObject(stoneModel);
                const rawSize = new THREE.Vector3();
                rawBox.getSize(rawSize);
                const maxDim = Math.max(rawSize.x, rawSize.z, rawSize.y);

                // Target size: 0.8 meters (slightly larger for visibility)
                const targetSize = 0.8;
                let finalScale = targetSize / maxDim;

                // Safety check
                if (!isFinite(finalScale) || finalScale === 0) finalScale = 0.01;

                // console.log(`🪨 [Stone] RawMax: ${maxDim}, FinalScale: ${finalScale}`);


                const stoneGroup = new THREE.Group();
                stoneGroup.name = 'PondStoneWall';
                let stoneCount = 0;

                pondModel.traverse((child) => {
                    if (child.name.includes("StonePoint")) {
                        const stone = stoneModel.clone();

                        // Copy transform exactly from marker (Position & Rotation)
                        const worldPos = new THREE.Vector3();
                        const worldQuat = new THREE.Quaternion();

                        child.getWorldPosition(worldPos);
                        child.getWorldQuaternion(worldQuat);

                        stone.position.copy(worldPos);
                        stone.quaternion.copy(worldQuat);

                        // Adjust Y slightly to prevent z-fighting with water if necessary
                        // But keep user control. Setting to 0.05 just to be safe.
                        stone.position.y = 0.05;

                        // Variation in scale only
                        // User requested specific range: Min 1.6, Max 1.8
                        const scaleVar = 1.6 + Math.random() * 0.2;
                        stone.scale.setScalar(finalScale * scaleVar);

                        stone.castShadow = true;
                        stone.receiveShadow = true;
                        stoneGroup.add(stone);
                        stoneCount++;
                    }
                });

                if (stoneCount > 0) {
                    scene.add(stoneGroup);
                    console.log(`✅ [POND] Placed ${stoneCount} stones at markers.`);

                } else {
                    console.warn("⚠️ [POND] No 'StonePoint' markers found! Falling back to skipped.");
                }

            }).catch(err => {
                console.error("❌ [POND] Error loading assets:", err);
            });
        };

        // スケジューラー: scene初期化待ち
        const scheduler = setInterval(() => {
            if (typeof scene !== 'undefined' && scene !== null) {
                clearInterval(scheduler);
                executePondSpawn();
            }
        }, 100);
    }

    // 池を生成
    spawnPond();

    /**
     * 💡 Interaction Hint System V2
     * Adds a PointLight and pulses emissive material when player is near interactable objects.
     */
    // ★インタラクション誘導システム (完全安全版)
    window.updateInteractionHints = function (dt) {
        if (!window.sgInteractables || typeof playerPosition === 'undefined') return;

        // ★判定距離: 1.5m (ピンポイント接近)
        const THRESHOLD_SQ = 1.5 * 1.5;

        // パルスアニメーション
        const time = performance.now() / 1000;
        const pulseIntensity = (Math.sin(time * 8) + 1) * 0.5 + 0.5;

        window.sgInteractables.forEach(obj => {
            if (!obj.visible) return;

            const worldPos = new THREE.Vector3();

            // ★重要: HitBoxがある場合は、そのワールド座標を基準にする
            // (親オブジェクトの原点がズレている場合への対策)
            const hitBox = obj.children.find(c => c.userData.isHitBox);
            if (hitBox) {
                hitBox.getWorldPosition(worldPos);
            } else {
                obj.getWorldPosition(worldPos);
            }

            const dx = playerPosition.x - worldPos.x;
            const dz = playerPosition.z - worldPos.z;
            const distSq = dx * dx + dz * dz;

            // === 判定ロジック ===
            if (distSq < THRESHOLD_SQ) {
                // [ON] 範囲内
                // 1. 物理ライトの追加
                if (!obj.userData.hintLight) {
                    const light = new THREE.PointLight(0xFFFF00, 2.0, 4.0);
                    light.position.set(0, 0.5, 0);
                    obj.add(light);
                    obj.userData.hintLight = light;
                }
                if (obj.userData.hintLight) {
                    obj.userData.hintLight.intensity = 2.0 * pulseIntensity;
                }

                // 2. マテリアル発光 (エラー回避チェック付き)
                obj.traverse(c => {
                    // 無視フラグがあれば即リターン
                    if (c.userData.ignoreHighlight || c.userData.isHitBox) return;

                    if (c.isMesh && c.material) {
                        // 配列マテリアルにも対応
                        const mats = Array.isArray(c.material) ? c.material : [c.material];
                        mats.forEach(m => {
                            // ★ここが修正点: m.emissive が存在するか必ず確認する
                            if (m && m.emissive) {
                                m.emissive.setHex(0xFFFF00);
                                m.emissiveIntensity = 0.5 * pulseIntensity;
                            }
                        });
                    }
                });

            } else {
                // [OFF] 範囲外
                // 1. 物理ライト削除
                if (obj.userData.hintLight) {
                    obj.remove(obj.userData.hintLight);
                    if (obj.userData.hintLight.dispose) obj.userData.hintLight.dispose();
                    obj.userData.hintLight = null;

                    // 2. 発光リセット (エラー回避チェック付き)
                    obj.traverse(c => {
                        if (c.userData.ignoreHighlight || c.userData.isHitBox) return;

                        if (c.isMesh && c.material) {
                            const mats = Array.isArray(c.material) ? c.material : [c.material];
                            mats.forEach(m => {
                                // ★ここが修正点: m.emissive が存在するか必ず確認する
                                if (m && m.emissive) {
                                    // 元の色に戻す (黒)
                                    m.emissive.setHex(0x000000);
                                    m.emissiveIntensity = 0;
                                }
                            });
                        }
                    });
                }
            }
        });
    };

    // モジュールの戻り値
    return { setup, init, start, stop };
})();

// ★季節の初期化
if (typeof window.setGameSeason === 'function' && typeof GameConfig !== 'undefined') {
    window.setGameSeason(GameConfig.currentSeason);
}

// ゲームシステムの起動
if (typeof initGameSystem === 'function') {
    initGameSystem();
}

// ▼▼▼ ベンチ猫の「恩返し」イベント（デバッグ表示＆安全装置付き・再送） ▼▼▼
(function () {
    const TRIGGER_DIST = 3.0; // 判定距離
    let isCatGone = false;
    let debugLabel = null;

    // デバッグ用ラベル（黄色い文字）
    function updateDebug(dist) {
        if (!debugLabel) {
            debugLabel = document.createElement('div');
            debugLabel.style.cssText = 'position:fixed; top:100px; left:10px; color:yellow; font-weight:bold; z-index:9999; font-family:monospace; background:rgba(0,0,0,0.5); padding:5px; pointer-events:none;';
            document.body.appendChild(debugLabel);
        }
        if (isCatGone) {
            debugLabel.style.color = '#00FF00';
            debugLabel.textContent = "🐱 Cat Event: TRIGGERED!";
        } else {
            debugLabel.textContent = `🐱 Cat Dist: ${dist.toFixed(2)}m`;
        }
    }

    setInterval(() => {
        return; // ★これを追加：イベント監視を直ちに終了
        // ネコがいなければ中断
        if (!window.sgBenchCat) return;
        if (isCatGone) return;

        // プレイヤー位置取得
        let pPos = null;
        if (window.camera) pPos = window.camera.position;
        else if (typeof playerPosition !== 'undefined') pPos = playerPosition;
        if (!pPos) return;

        // 距離チェック
        const dx = pPos.x - window.sgBenchCat.position.x;
        const dz = pPos.z - window.sgBenchCat.position.z;
        const distSq = dx * dx + dz * dz;
        const dist = Math.sqrt(distSq);

        // 画面に距離を表示
        updateDebug(dist);

        if (dist < TRIGGER_DIST) {
            // ★ イベント発生！
            isCatGone = true;
            updateDebug(dist);
            const cat = window.sgBenchCat;

            console.log("🐱 Cat Event Triggered!");

            // 1. エフェクト (煙)
            try {
                if (typeof window.spawnSnowExplosion === 'function') {
                    window.spawnSnowExplosion(cat.position);
                }
            } catch (e) { console.error("Smoke Effect Error:", e); }

            // 2. ネコを消す
            cat.visible = false;

            // 3. コイン出現
            if (window.sgCoinMaster) {
                const coin = window.sgCoinMaster.clone();

                // 座標計算
                const offset = cat.userData.coinOffset || new THREE.Vector3(1.2, 0, 0);
                const coinPos = cat.localToWorld(offset.clone());

                coin.position.copy(coinPos);
                coin.position.y = 0.5;

                // サイズ補正
                coin.scale.setScalar(0.01);
                const box = new THREE.Box3().setFromObject(coin);
                const size = new THREE.Vector3(); box.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z);
                if (maxDim > 0) coin.scale.setScalar(0.5 / maxDim);

                coin.userData.isCoin = true;
                coin.userData.collected = false;
                coin.visible = true;

                // ★アウトライン追加
                if (window.addEdgesOutline) window.addEdgesOutline(coin, 15, 0x000000);

                if (window.parkGroup) window.parkGroup.add(coin);
                else window.scene.add(coin);

                if (window.sgGameCoins) window.sgGameCoins.push(coin);

                // アニメーション
                let velY = 0.3;
                const gravity = 0.02;
                const dropAnim = setInterval(() => {
                    if (!coin.parent || coin.userData.collected) {
                        clearInterval(dropAnim);
                        return;
                    }
                    coin.position.y += velY;
                    velY -= gravity;
                    coin.rotation.y += 0.5;

                    if (coin.position.y <= 0.5) {
                        coin.position.y = 0.5;
                        clearInterval(dropAnim);
                    }
                }, 16);

                if (window.AudioManager) window.AudioManager.play('wheeee');

                // 吹き出し
                const pop = document.createElement('div');
                pop.textContent = "🐱💭 Here!";
                pop.style.cssText = "position:fixed; top:40%; left:50%; transform:translate(-50%,-50%); color:white; font-size:30px; font-weight:bold; text-shadow:0 0 5px black; animation: floatUp 1s forwards; pointer-events:none; z-index:10000;";
                document.body.appendChild(pop);
                setTimeout(() => pop.remove(), 1000);

            } else {
                console.error("⚠️ sgCoinMaster not found!");
            }
        }
    }, 200);
})();



// ▼▼▼ キッチンカーイベント（v7 FIX：完全自律・本番対応版） ▼▼▼
(function () {
    // 1. 設定
    const TARGET_X = -9.0;   // 判定エリアの中心
    const TARGET_Z = -24.37;
    const RADIUS = 0.8;
    const REQUIRED_TIME = 3000;

    // コインの軌道設定
    const START_POS = { x: -7.8, y: 1.2, z: -24.28 }; // カウンターの中
    const END_POS = { x: -8.5, y: 0.5, z: -24.28 };   // プレイヤーの目の前

    let stayTimer = 0;
    let isEventTriggered = false;
    let hintLabel = null;
    let generatedCoin = null;
    let playerCamera = null; // カメラ（プレイヤー）を特定して保持する変数

    // 2. 吹き出しUI
    function updateHintLabel(text, show) {
        if (!hintLabel) {
            hintLabel = document.createElement('div');
            hintLabel.style.cssText = `
                position: fixed; left: 50%; top: 30%; transform: translate(-50%, -50%);
                color: #FFFFFF; font-family: sans-serif; font-size: 32px; font-weight: 900;
                text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
                pointer-events: none; z-index: 2147483647; display: none; white-space: nowrap;
                background: rgba(0, 0, 0, 0.5); padding: 10px 20px; border-radius: 10px; border: 2px solid white;
            `;
            document.body.appendChild(hintLabel);
        }
        hintLabel.textContent = text;
        hintLabel.style.display = show ? 'block' : 'none';
    }

    // 3. コインを飛ばすアニメーション関数
    function spawnFlyingCoin() {
        if (!window.sgCoinMaster || !window.parkGroup) return;

        const coin = window.sgCoinMaster.clone();
        coin.visible = true;
        coin.userData.isCoin = true;
        coin.userData.collected = false;

        // 初期位置
        coin.position.set(START_POS.x, START_POS.y, START_POS.z);
        coin.rotation.set(0, 0, 0);

        // ★アウトライン追加
        if (window.addEdgesOutline) window.addEdgesOutline(coin, 15, 0x000000);

        window.parkGroup.add(coin);
        if (window.sgGameCoins) window.sgGameCoins.push(coin);
        generatedCoin = coin;

        let progress = 0;
        const duration = 45;

        const animInterval = setInterval(() => {
            if (!coin.parent || coin.userData.collected) {
                clearInterval(animInterval);
                return;
            }

            progress++;
            const t = progress / duration;

            if (t >= 1.0) {
                coin.position.set(END_POS.x, END_POS.y, END_POS.z);
                clearInterval(animInterval);
            } else {
                const easeOut = 1 - Math.pow(1 - t, 2);
                coin.position.x = START_POS.x + (END_POS.x - START_POS.x) * easeOut;
                coin.position.z = START_POS.z + (END_POS.z - START_POS.z) * easeOut;
                const height = Math.sin(t * Math.PI) * 0.5;
                coin.position.y = START_POS.y + (END_POS.y - START_POS.y) * t + height;
            }
        }, 16);
    }

    // 4. プレイヤー位置取得関数（文字ではなくカメラを探す）
    function getPlayerPosition() {
        // 1. window.camera があればそれを使う
        if (window.camera) return window.camera.position;

        // 2. なければシーン内からカメラを探して記憶する（初回のみ検索）
        if (!playerCamera && window.scene) {
            window.scene.traverse(obj => {
                if (obj.isCamera) playerCamera = obj;
            });
        }
        if (playerCamera) return playerCamera.position;

        // 3. どうしても見つからない時の最終手段（デバッグパネルがあれば利用）
        const panel = document.getElementById('debug-pos-panel');
        if (panel) {
            const match = panel.innerText.match(/X:([-0-9.]+) Z:([-0-9.]+)/);
            if (match) return { x: parseFloat(match[1]), z: parseFloat(match[2]) };
        }

        return null;
    }

    // 5. 監視ループ
    setInterval(() => {
        return; // ★これを追加：プレイヤーの立ち止まり判定を無効化
        if (isEventTriggered) {
            if (generatedCoin && generatedCoin.userData.collected && generatedCoin.parent) {
                generatedCoin.parent.remove(generatedCoin);
                generatedCoin = null;
            }
            return;
        }

        // ★ここで位置を取得（本番対応）
        const pos = getPlayerPosition();
        if (!pos) return;

        const dx = pos.x - TARGET_X;
        const dz = pos.z - TARGET_Z;
        const distSq = dx * dx + dz * dz;

        if (distSq < RADIUS * RADIUS) {
            stayTimer += 100;
            if (stayTimer < REQUIRED_TIME) {
                const remaining = Math.ceil((REQUIRED_TIME - stayTimer) / 1000);
                updateHintLabel(`⌛️ Tick-Tock... ${remaining}`, true);
            } else {
                isEventTriggered = true;
                updateHintLabel("🎁 for U!", true);
                setTimeout(() => updateHintLabel("", false), 2000);

                spawnFlyingCoin();
                if (window.AudioManager) window.AudioManager.play('wheeee');
            }
        } else {
            stayTimer = 0;
            updateHintLabel("", false);
        }
    }, 100);
})();

// ▼▼▼ 幽霊コイン特定用デバッグスクリプト ▼▼▼
setInterval(() => {
    if (window.scene) {
        window.scene.traverse((obj) => {
            if (obj.userData && obj.userData.isCoin) {
                // ワールド座標ではなくローカル座標が(0,0,0)かどうかも念のためチェック
                if (obj.position.x === 0 && obj.position.y === 0 && obj.position.z === 0) {
                    if (!obj.userData._ghostLogged) {
                        console.warn("👻 GHOST COIN DETECTED at (0,0,0)! Name:", obj.name, "Parent:", obj.parent ? obj.parent.name : "None", "UserData:", obj.userData);

                        // 画面状にも表示しておく
                        const div = document.createElement('div');
                        div.textContent = `👻 Ghost Coin found: ${obj.name} (Parent: ${obj.parent ? obj.parent.name : 'None'})`;
                        div.style.cssText = "position:fixed; top:10px; right:10px; color:red; font-weight:bold; background:black; padding:10px; z-index:9999;";
                        document.body.appendChild(div);

                        obj.userData._ghostLogged = true; //何度も出ないように
                    }
                }
            }
        });
    }
}, 2000);
