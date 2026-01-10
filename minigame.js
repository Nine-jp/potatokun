import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';


/* Mini-Game System Controller */

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
        start: () => SearchGame.start(),
        stop: () => SearchGame.stop()
    }
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

    fabBtn.addEventListener('click', showGameMenu);

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
   GAME MODULE: PotatoKun Action
   ========================================= */
const PotatoAction = (() => {
    let container, player;
    let isPlaying = false;
    let score = 0;
    let items = [];
    let frameCount = 0;
    let animationId = null;

    // Rare Item States
    let rareSpawnWindowActive = false;
    let hasRareSpawnedThisWindow = false;
    let rareWindowStartTime = 0;

    // Support Item States
    let barrierCount = 0;
    let nextBarrierScore = 0;
    let nextBombScore = 0;
    let nextSpanThreshold = 50;
    let supportCycle = 0;

    const Config = { spawnRate: 48 };

    function setup(parentContainer) {
        container = parentContainer;
    }

    function init(gameContainer) { }

    function start() {
        isPlaying = true;
        score = 0;
        items = [];
        frameCount = 0;
        hasUnlockedPrize = false; // Reset for new run
        rareSpawnWindowActive = false;
        hasRareSpawnedThisWindow = false;
        rareWindowStartTime = 0;

        barrierCount = 0;
        nextSpanThreshold = 50;
        supportCycle = 0;
        scheduleSupportItems();

        setupGameUI();

        if (animationId) cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(loop);

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
        // Ensure items spawn within the span (at least 5 points after base, 5 points before end)
        nextBarrierScore = base + Math.floor(Math.random() * (span - 10)) + 5;
        nextBombScore = base + Math.floor(Math.random() * (span - 10)) + 5;
        supportCycle++;
    }

    function loop() {
        if (!isPlaying) return;

        // breakthroughCheck to start timer
        if (score >= 300 && rareWindowStartTime === 0) {
            rareWindowStartTime = frameCount;
        }

        const elapsed = frameCount - rareWindowStartTime;
        // Window is active between 10s (600 frames) and 20s (1200 frames) after breakthrough
        if (rareWindowStartTime > 0 && elapsed >= 600 && elapsed <= 1200 && !hasRareSpawnedThisWindow) {
            rareSpawnWindowActive = true;
        } else {
            rareSpawnWindowActive = false;
        }

        // Support Item Spanning Logic
        if (score >= nextSpanThreshold) {
            scheduleSupportItems();
        }

        // Spawn
        if (frameCount % Config.spawnRate === 0) spawnItem();

        // Difficulty
        if (frameCount % 600 === 0 && Config.spawnRate > 20) Config.spawnRate -= 2;

        updateItems();
        frameCount++;
        animationId = requestAnimationFrame(loop);
    }

    function spawnItem() {
        const rand = Math.random();
        let type;

        // Priority 1: Scheduled Support Items
        if (score >= nextBarrierScore && nextBarrierScore !== 0) {
            type = 'barrier';
            nextBarrierScore = 0; // Triggered
        } else if (score >= nextBombScore && nextBombScore !== 0) {
            type = 'bomb';
            nextBombScore = 0; // Triggered
        }
        // Priority 2: Rare Item
        else if (rareSpawnWindowActive && !hasRareSpawnedThisWindow) {
            type = 'rare';
            hasRareSpawnedThisWindow = true;
        }
        // Priority 3: Normal
        else {
            if (rand < 0.3) type = 'fry';
            else if (rand < 0.9) type = 'skull';
            else type = 'burger';
        }

        const el = document.createElement('div');
        el.className = 'pa-item';

        if (type === 'fry') el.textContent = '🍟';
        else if (type === 'burger') {
            el.textContent = '🍔';
            el.style.transform = 'scale(1.3)';
        }
        else if (type === 'skull') el.textContent = '☠️';
        else if (type === 'rare') {
            el.innerHTML = `<img src="assets/potatokun-action.png" style="width:100%; height:100%; object-fit:contain;">`;
            el.style.width = '80px';
            el.style.height = '80px';
        }
        else if (type === 'barrier') {
            el.textContent = '🫧';
        }
        else if (type === 'bomb') {
            el.textContent = '💣';
            el.classList.add('bomb'); // For CSS extra glow
        }

        // Constrain horizontal spawn to be within reachable area (playerHitBox.left/right limits)
        // Window width - player margin - item width
        const spawnX = 40 + Math.random() * (window.innerWidth - 120);
        el.style.left = `${spawnX}px`;
        el.style.top = '-80px';
        container.appendChild(el);

        items.push({
            el: el,
            y: -80,
            type: type,
            speed: type === 'skull' ? 5 + Math.random() * 2 : (type === 'burger' ? 6 + Math.random() * 2 : 3 + Math.random() * 2)
        });
    }

    function updateItems() {
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            item.y += item.speed;
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
                if (item.type === 'fry') {
                    score += 5;
                    showFloatText(item.el.offsetLeft, item.el.offsetTop, '+5');
                } else if (item.type === 'burger') {
                    score += 10;
                    showFloatText(item.el.offsetLeft, item.el.offsetTop, '+10', '#FF4500');
                    spawnSparkles(item.el.offsetLeft + 20, item.el.offsetTop + 20);
                } else if (item.type === 'rare') {
                    score += 50;
                    hasUnlockedPrize = true;
                    rareSpawnWindowActive = false;
                    hasRareSpawnedThisWindow = true;
                    showFloatText(item.el.offsetLeft, item.el.offsetTop, 'Avatar Unlocked!', '#FF1493');
                    spawnHearts(item.el.offsetLeft + 40, item.el.offsetTop + 40);
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
                        // Destroy just the skull
                        item.el.remove();
                        items.splice(i, 1);
                        continue;
                    } else {
                        stop();
                        showGameOver(score);
                        return;
                    }
                }

                if (item.type !== 'skull') {
                    document.getElementById('pa-score').textContent = score;
                    item.el.remove();
                    items.splice(i, 1);
                }
            } else if (item.y > window.innerHeight) {
                item.el.remove();
                items.splice(i, 1);
            }
        }
    }

    function addBarrier() {
        if (barrierCount < 3) {
            barrierCount++;
            updateBarrierVisual();
        }
    }

    function removeBarrier() {
        if (barrierCount > 0) {
            barrierCount--;
            updateBarrierVisual();
            // Breaking effect
            spawnParticles(player.offsetLeft + 75, player.offsetTop + 75, ['#00BFFF', '#FFFFFF'], 'pa-particle');
        }
    }

    function updateBarrierVisual() {
        // Remove all shield classes
        player.classList.remove('shield-1', 'shield-2', 'shield-3');
        // Add current shield class
        if (barrierCount > 0) {
            player.classList.add(`shield-${barrierCount}`);
        }
    }

    function activateBomb() {
        // Flash effect
        const flash = document.getElementById('pa-sacred-flash');
        flash.classList.remove('flash-active');
        void flash.offsetWidth; // Trigger reflow
        flash.classList.add('flash-active');

        // Clear all skulls
        for (let i = items.length - 1; i >= 0; i--) {
            if (items[i].type === 'skull') {
                items[i].el.remove();
                items.splice(i, 1);
            }
        }
    }

    function spawnSparkles(x, y) {
        spawnParticles(x, y, ['#FFD700', '#FFA500', '#FFFF00', '#FFFFFF'], 'pa-particle');
    }

    function spawnHearts(x, y) {
        spawnParticles(x, y, ['#FF1493', '#FF69B4', '#FFB6C1'], 'pa-heart', '💕');
    }

    function spawnParticles(x, y, colors, className, text = null) {
        const count = text ? 12 : 10;
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = className;
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            if (text) {
                el.textContent = text;
                el.style.fontSize = `${10 + Math.random() * 10}px`;
            } else {
                el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            }

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
        return !(r1.right - pad < r2.left + pad ||
            r1.left + pad > r2.right - pad ||
            r1.bottom - pad < r2.top + pad ||
            r1.top + pad > r2.bottom - pad);
    }

    function showFloatText(x, y, text, color = '#FFD700') {
        const el = document.createElement('div');
        el.className = 'pa-float-text';
        el.textContent = text;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.color = color;
        el.style.zIndex = '50';
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
    let isPlaying = false;
    let score = 0;
    let timeLeft = 30;
    let timerId = null;
    let animationId = null;
    let mixer;
    let clock = new THREE.Clock();

    let models = [];
    let targetIndex = -1;
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();

    // Cinematic State
    let isCinematic = false;
    let cinematicTimer = 0;

    // Player Position (Module Scope)
    let playerPosition = new THREE.Vector3(0, 0.6, 0);

    const loader = new FBXLoader();

    function setup(parentContainer) {
        container = parentContainer;
    }

    function init(gameContainer) { }

    function start() {
        isPlaying = true;
        score = 0;
        timeLeft = 60; // 60 seconds for maze exploration
        models = [];


        setupGameUI();

        if (window.pauseBackgroundViewer) window.pauseBackgroundViewer(true);

        setTimeout(async () => {
            initThreeJS();

            if (animationId) cancelAnimationFrame(animationId);
            animationId = requestAnimationFrame(loop);

            // Potato characters removed - player IS the potato!
            // await spawnClonesSequential();

            // Setup GET!/BUY button click handler
            const getBtn = document.getElementById('sg-get-btn');
            if (getBtn) {
                // Remove old listeners to avoid duplicates if restarted
                const newBtn = getBtn.cloneNode(true);
                getBtn.parentNode.replaceChild(newBtn, getBtn);

                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleInteraction();
                });
                newBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleInteraction();
                });
            }

            // Timer disabled for testing
            // startTimer();

            // Start Opening Cinematic
            startOpeningSequence();
        }, 100);
    }

    // === CINEMATIC SEQUENCES ===
    let sweatParticles = [];

    function createSweatEffects(model) {
        clearSweatEffects(); // Clear existing

        const sweatGeo = new THREE.SphereGeometry(0.03, 8, 8); // Smaller
        const sweatMat = new THREE.MeshBasicMaterial({ color: 0x87CEFA }); // Light Blue

        // 3 drops around head
        const positions = [
            { x: 0.15, y: 1.4, z: 0.2 },
            { x: -0.15, y: 1.3, z: 0.25 },
            { x: 0, y: 1.35, z: 0.3 }
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

    function startOpeningSequence() {
        console.log("Starting Opening Sequence...");
        isCinematic = true; // Lock controls
        const player = window.sgPlayer;
        if (!player) {
            console.error("Player model not found for opening!");
            return;
        }

        // --- 1. Positioning & Acting ---
        // In front of vending machine (x: -11, z: -5)
        player.position.set(-11, 0, -5);
        player.rotation.y = 0; // Face camera
        player.rotation.x = 0.5; // Bow head

        player.visible = true; // Show model

        createSweatEffects(player);

        // --- 2. Camera Work ---
        // Face Close-up
        const targetPos = new THREE.Vector3(-11, 1.1, -5);
        // Camera position: slightly front and below
        camera.position.set(-11, 1.0, -3.5);
        camera.lookAt(targetPos);

        // --- 3. Dialog Sequence ---
        // Scene 1: Potatokun (0s)
        showTapText(window.innerWidth / 2, window.innerHeight * 0.7, 'ポテトくん「はぁ... 暑い... のどが渇いた...」', '#FFFFFF');

        // Scene 2: Narrator (4s)
        setTimeout(() => {
            showTapText(window.innerWidth / 2, window.innerHeight * 0.7, 'おや？ ポテトくんが困っているみたいだ', '#87CEFA');
        }, 4000);

        // Scene 3: Solution (8s)
        setTimeout(() => {
            showTapText(window.innerWidth / 2, window.innerHeight * 0.7, 'そうだ！ 公園のコインを集めて\nジュースを買ってあげよう！', '#FFD700');
        }, 8000);

        // Scene 4: Game Start (12s)
        setTimeout(() => {
            // End Sequence
            isCinematic = false;
            if (player) player.rotation.x = 0; // Reset pose
            clearSweatEffects();

            // Camera Reset (TPS View)
            camera.position.set(-11, 4, 0);
            if (player) camera.lookAt(player.position);

            // Sync Control Target if exists
            if (controls) controls.target.copy(player.position);

            // Sync Player Logic Position (important for FPS movement)
            if (typeof playerPosition !== 'undefined') {
                playerPosition.set(-11, 0.6, -5);
            }

            showTapText(window.innerWidth / 2, window.innerHeight / 2, 'START!', '#FFFFFF');
        }, 12000);
    }

    function startEndingSequence() {
        isCinematic = true;

        // UI
        showTapText(window.innerWidth / 2, window.innerHeight / 2, '🎉 ジュース買えたよ！やったね！', '#00FF00');

        // Camera: Vending Machine view
        if (camera) {
            camera.position.set(-8, 3, -4);
            camera.lookAt(-11, 2, -8);
        }

        // Dance: Rotate Main Character (using sgGameCoins[0] as proxy if player model hidden? 
        // Actually player is camera in FPS... user said "Rotate Potatokun". 
        // In FPS mode, Potatokun is hidden or is the camera.
        // But for cinematic, we might want to see him. 
        // Assuming there is a visible potato model or we rotate the vending machine? 
        // User said: "Rotate Potatokun (window.sgCoin)". 
        // Wait, window.sgCoin was single decorative coin. Now we have sgGameCoins.
        // Maybe the user meant "Rotate the vending machine" or "Rotate a coin"?
        // The user request code said: "if(window.sgCoin) window.sgCoin.rotation.y += 0.5;"
        // Existing code removed single sgCoin. 
        // I will attempt to rotate the last collected coin or just skip rotation if model missing.
        // Actually, let's rotate the Camera around the vending machine for effect?
        // Or better: Re-enable player model visibility for cutscene?
        // Let's stick to user request code but adapt: 
        // "window.sgCoin" likely refers to the single decorative coin they thought existed.
        // I will assume they want a celebration effect. I'll rotate the vending machine instead?
        // No, user said "Potatokun".
        // Use camera rotation around target.

        const danceInterval = setInterval(() => {
            // Camera orbit effect
            const time = Date.now() * 0.002;
            camera.position.x = -11 + Math.cos(time) * 5;
            camera.position.z = -8 + Math.sin(time) * 5;
            camera.lookAt(-11, 2, -8);
        }, 16);

        setTimeout(() => {
            clearInterval(danceInterval);
            stop(); // Game End

            // Show Game Over (Clear)
            const collected = window.sgItemData ? window.sgItemData.collected : 10;
            showGameOver(collected * 100);

        }, 5000);
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
        clearInterval(timerId);
        if (animationId) cancelAnimationFrame(animationId);
        // Button handlers are removed when HTML is cleared

        if (window.pauseBackgroundViewer) window.pauseBackgroundViewer(false);

        if (renderer) {
            renderer.dispose();
            if (renderer.domElement && renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
            renderer = null;
        }
    }


    function setupGameUI() {
        container.innerHTML = `
            <div id="sg-ui" style="position:absolute; top:20px; left:20px; color:#fff; z-index:100; font-family:sans-serif; pointer-events:none; text-shadow: 2px 2px 4px #000000; font-size: 1.2rem; font-weight: bold;">
                <div>🪙 ポテコイン</div>
                <div style="margin-top:8px;">🪙 コイン: <span id="sg-coin-counter">0</span>/10</div>
            </div>
            <div id="sg-canvas-container" style="width:100%; height:100%; background: #1a1a1a;"></div>
            
            <!-- Crosshair for aiming - color changes based on target -->
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

            
            <!-- D-Pad Controller (GET button moved outside) -->
            <div id="sg-dpad" style="position:absolute; bottom:calc(120px + env(safe-area-inset-bottom)); left:calc(20px + env(safe-area-inset-left)); z-index:200; user-select:none;">
                <style>
                    .dpad-btn {
                        width: 70px;
                        height: 70px;
                        background: rgba(255,255,255,0.3);
                        border: 2px solid rgba(255,255,255,0.6);
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 28px;
                        color: white;
                        cursor: pointer;
                        touch-action: manipulation;
                        transition: background 0.1s;
                    }
                    .dpad-btn:active, .dpad-btn.active {
                        background: rgba(255,255,255,0.6);
                    }
                </style>
                <div style="display:grid; grid-template-columns: 70px 70px 70px; grid-template-rows: 70px 70px 70px; gap:5px;">
                    <div></div>
                    <button class="dpad-btn" id="dpad-up">▲</button>
                    <div></div>
                    <button class="dpad-btn" id="dpad-left">◀</button>
                    <div style="width:70px;height:70px;"></div>
                    <button class="dpad-btn" id="dpad-right">▶</button>
                    <div></div>
                    <button class="dpad-btn" id="dpad-down">▼</button>
                    <div></div>
                </div>
            </div>
            
            <!-- GET! button (floats above target coin) -->
            <button id="sg-get-btn" style="
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 65px;
                height: 65px;
                background: linear-gradient(145deg, #FFD700, #FFA500);
                border: 4px solid #FFFFFF;
                border-radius: 50%;
                font-size: 13px;
                font-weight: bold;
                color: #333;
                text-shadow: 1px 1px 0px #fff;
                cursor: pointer;
                z-index: 300;
                box-shadow: 0 6px 20px rgba(255,215,0,0.6), 0 0 15px rgba(255,255,255,0.4);
                touch-action: manipulation;
                pointer-events: auto;
                transition: transform 0.1s;
            ">🖐️<br>GET!</button>
            <style>
                #sg-get-btn:active {
                    transform: scale(0.85);
                    background: linear-gradient(145deg, #FFA500, #FF8C00);
                }
            </style>
            
            <!-- Instructions -->
            <div id="sg-instructions" style="position:absolute; bottom:20px; left:20px; color:#fff; z-index:100; font-family:sans-serif; text-shadow: 1px 1px 2px #000; font-size: 0.85rem; opacity:0.8; pointer-events:none;">
                <div>🎮 移動: WASD / D-Pad</div>
                <div>👁️ 視点: 画面スワイプ</div>
                <div>🎯 コインに近づくとGETボタン出現！</div>
            </div>



        `;
    }






    function initThreeJS() {
        const canvasContainer = document.getElementById('sg-canvas-container');
        const width = canvasContainer.clientWidth || window.innerWidth;
        const height = canvasContainer.clientHeight || window.innerHeight;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xBFEFFF); // Soft pastel sky blue
        scene.fog = new THREE.Fog(0x90EE90, 5, 25); // Green-tinted fog for grass maze

        camera = new THREE.PerspectiveCamera(75, width / height, 0.05, 1000); // Wider FOV, closer near plane
        camera.position.set(0, 0.6, 25); // POTATO HEIGHT (60cm) at park entrance
        camera.rotation.order = 'YXZ'; // Important for FPS camera

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        canvasContainer.appendChild(renderer.domElement);

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
        let cameraDistance = 0; // 0 = FPS, 10 = max TPS
        const CAMERA_DISTANCE_MIN = 0;
        const CAMERA_DISTANCE_MAX = 10;
        const ZOOM_SPEED = 0.5;

        // === ORBIT CAMERA CONTROL ===
        let cameraAngle = Math.PI; // Horizontal orbit angle (starts behind player)
        let cameraPitch = 0; // Vertical look angle (for FPS mode)

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


        // === Multi-touch Drag-to-Look Controls ===
        // Track look touch separately from D-pad touches
        let lookTouchId = null;
        let lastX = 0, lastY = 0;

        const onPointerDown = (e) => {
            // Ignore if clicking on D-pad
            if (e.target.closest('#sg-dpad')) return;

            if (e.type === 'mousedown') {
                lookTouchId = 'mouse';
                lastX = e.clientX;
                lastY = e.clientY;
            } else if (e.type === 'touchstart') {
                // Find a touch that's NOT on the D-pad
                for (const touch of e.changedTouches) {
                    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (!elem || !elem.closest('#sg-dpad')) {
                        lookTouchId = touch.identifier;
                        lastX = touch.clientX;
                        lastY = touch.clientY;
                        break;
                    }
                }
            }
        };

        const onPointerMove = (e) => {
            if (lookTouchId === null) return;

            let clientX, clientY;

            if (e.type === 'mousemove' && lookTouchId === 'mouse') {
                clientX = e.clientX;
                clientY = e.clientY;
            } else if (e.type === 'touchmove') {
                // Find the touch with matching ID
                let foundTouch = null;
                for (const touch of e.changedTouches) {
                    if (touch.identifier === lookTouchId) {
                        foundTouch = touch;
                        break;
                    }
                }
                if (!foundTouch) return;
                clientX = foundTouch.clientX;
                clientY = foundTouch.clientY;
            } else {
                return;
            }

            const deltaX = clientX - lastX;
            const deltaY = clientY - lastY;

            // Update orbit angle (horizontal) and pitch (vertical)
            cameraAngle -= deltaX * lookSpeed;
            cameraPitch -= deltaY * lookSpeed;

            // Clamp pitch to prevent flipping (±80 degrees)
            const MAX_PITCH = 80 * Math.PI / 180;
            cameraPitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, cameraPitch));

            // NaN safety
            if (isNaN(cameraAngle)) cameraAngle = Math.PI;
            if (isNaN(cameraPitch)) cameraPitch = 0;

            // Note: Camera rotation is now applied in the update loop, not here

            lastX = clientX;
            lastY = clientY;
        };


        const onPointerUp = (e) => {
            if (e.type === 'mouseup' || e.type === 'mouseleave') {
                if (lookTouchId === 'mouse') lookTouchId = null;
            } else if (e.type === 'touchend' || e.type === 'touchcancel') {
                for (const touch of e.changedTouches) {
                    if (touch.identifier === lookTouchId) {
                        lookTouchId = null;
                        break;
                    }
                }
            }
        };

        renderer.domElement.addEventListener('mousedown', onPointerDown);
        renderer.domElement.addEventListener('mousemove', onPointerMove);
        renderer.domElement.addEventListener('mouseup', onPointerUp);
        renderer.domElement.addEventListener('mouseleave', onPointerUp);
        renderer.domElement.addEventListener('touchstart', onPointerDown, { passive: true });
        renderer.domElement.addEventListener('touchmove', onPointerMove, { passive: true });
        renderer.domElement.addEventListener('touchend', onPointerUp);
        renderer.domElement.addEventListener('touchcancel', onPointerUp);

        // === ZOOM CONTROLS ===
        // Mouse wheel zoom
        const onWheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? ZOOM_SPEED : -ZOOM_SPEED;
            cameraDistance = Math.max(CAMERA_DISTANCE_MIN, Math.min(CAMERA_DISTANCE_MAX, cameraDistance + delta));
        };
        renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

        // Pinch zoom for mobile
        const onPinchMove = (e) => {
            if (e.touches.length === 2) {
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                const dx = t2.clientX - t1.clientX;
                const dy = t2.clientY - t1.clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (lastPinchDistance > 0) {
                    const pinchDelta = lastPinchDistance - distance;
                    const zoomChange = pinchDelta * 0.02; // Sensitivity
                    cameraDistance = Math.max(CAMERA_DISTANCE_MIN, Math.min(CAMERA_DISTANCE_MAX, cameraDistance + zoomChange));
                }
                lastPinchDistance = distance;
            }
        };

        const onPinchEnd = (e) => {
            if (e.touches.length < 2) {
                lastPinchDistance = 0;
            }
        };

        renderer.domElement.addEventListener('touchmove', onPinchMove, { passive: true });
        renderer.domElement.addEventListener('touchend', onPinchEnd);


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
        window.sgUpdateMovement = () => {
            if (isCinematic) return; // Disable movement during cinematic
            const direction = new THREE.Vector3();

            // Forward/backward (along camera direction)
            if (moveState.forward) {
                direction.z -= moveSpeed;
            }
            if (moveState.backward) {
                direction.z += moveSpeed;
            }

            // Strafe left/right
            if (moveState.left) {
                direction.x -= moveSpeed;
            }
            if (moveState.right) {
                direction.x += moveSpeed;
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
            const COLLISION_MARGIN = 0.5; // Player radius
            // Collision obstacles (slide removed - it's now walkable!)
            const obstacles = [
                // { name: 'slide', minX: -11, maxX: -5, minZ: -11, maxZ: -3 }, // REMOVED - can climb
                { name: 'gym', minX: 2, maxX: 8, minZ: -8, maxZ: -2 },
                { name: 'bench', minX: 8, maxX: 14, minZ: 6.5, maxZ: 9.5 },
                { name: 'tree', minX: -15, maxX: -9, minZ: 2, maxZ: 8 },
                { name: 'sandbox', minX: -4, maxX: 4, minZ: 9, maxZ: 15 },
                { name: 'fountain', minX: -4, maxX: 4, minZ: -15, maxZ: -9 }
            ];

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


            // Collect walkable meshes (EXCLUDE trees and ketchup)
            const walkableMeshes = [];
            scene.traverse((child) => {
                if (child.isMesh && child.geometry) {
                    // Exclude trees from walkable surfaces
                    if (!child.userData.isTree && !child.userData.isKetchup) {
                        walkableMeshes.push(child);
                    }
                }
            });

            const groundHits = groundRaycaster.intersectObjects(walkableMeshes, false);

            // Find the highest walkable surface at this position
            let targetHeight = 0; // Default ground level
            for (const hit of groundHits) {
                // Only consider surfaces we can stand on
                if (hit.point.y >= 0 && hit.point.y < 10) {
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





        // Brighter ambient light for cheerful atmosphere
        scene.add(new THREE.AmbientLight(0xffffff, 1.2));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(20, 40, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;

        // Expand shadow camera to cover entire park (-30 to 30)
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.bias = -0.0005; // Prevent shadow acne

        scene.add(dirLight);

        // Pastel green grass ground
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshLambertMaterial({ color: 0x98FB98 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // REMOVED: Beige dirt patches (previously cream-colored boards under objects)
        // Keeping only green grass ground for a cleaner look

        // === VOXEL CLOUDS for orientation ===

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

        // === EXTERIOR DECORATIONS (Outside fence - trees removed, using FBX instead) ===
        // Note: Old box-based trees removed - now using Tree_test.fbx for all trees
        const bushMaterial = new THREE.MeshLambertMaterial({ color: 0x2E8B57 }); // SeaGreen


        // Create exterior bushes
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const radius = 35 + Math.random() * 10;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const bush = new THREE.Mesh(
                new THREE.BoxGeometry(
                    1.5 + Math.random(),
                    0.8 + Math.random() * 0.5,
                    1.5 + Math.random()
                ),
                bushMaterial
            );
            bush.position.set(x, 0.4, z);
            bush.castShadow = true;
            scene.add(bush);
        }

        // Add park assets
        createParkAssets();


        // === LOAD FBX MODEL: Normal Potatokun ===
        const TARGET_HEIGHT = 1.5; // Target height in meters

        loader.load(
            'models/potatokun_normal.fbx',
            (fbx) => {
                console.log('FBX Model loaded: potatokun_normal.fbx');

                // === AUTO-SIZE NORMALIZATION using Box3 ===
                // Get bounding box of the model
                const box = new THREE.Box3().setFromObject(fbx);
                const size = new THREE.Vector3();
                box.getSize(size);

                const originalHeight = size.y;
                console.log('Loaded Model Height:', originalHeight.toFixed(3));

                // Calculate scale factor to achieve target height
                const scaleFactor = TARGET_HEIGHT / originalHeight;
                fbx.scale.setScalar(scaleFactor);
                console.log('Applied Scale:', scaleFactor.toFixed(6));

                // Recalculate bounding box after scaling
                const scaledBox = new THREE.Box3().setFromObject(fbx);

                // Position model so feet touch ground (Y=0)
                // Offset by the minimum Y of the scaled bounding box
                const offsetY = -scaledBox.min.y;

                // Position near the slide with Y offset for ground contact
                fbx.position.set(-5, offsetY, -8);
                console.log('Position Y offset:', offsetY.toFixed(3));

                // Rotate to face the center/player
                fbx.rotation.y = Math.PI / 4; // Face toward center

                // Set up shadows for all meshes
                fbx.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // Add to scene
                fbx.visible = false; // Hide until cinematic starts
                scene.add(fbx);
                window.sgPlayer = fbx; // Store globally for cinematics

                // Add edge outlines (EdgesGeometry method)
                addEdgesOutline(fbx, 15, 0x000000);
                console.log('Potatokun: Edge outlines applied');

                // Set up animation if available
                if (fbx.animations && fbx.animations.length > 0) {
                    mixer = new THREE.AnimationMixer(fbx);
                    const action = mixer.clipAction(fbx.animations[0]);
                    action.setLoop(THREE.LoopRepeat);
                    action.play();
                    console.log('Animation started:', fbx.animations[0].name);
                }

                // ★ Trigger Opening Sequence
                setTimeout(() => {
                    if (typeof startOpeningSequence === 'function') {
                        startOpeningSequence();
                    }
                }, 10);
            },
            (progress) => {
                // Loading progress
                if (progress.total > 0) {
                    const percent = (progress.loaded / progress.total * 100).toFixed(1);
                    console.log(`Loading FBX: ${percent}%`);
                }
            },
            (error) => {
                console.error('Error loading FBX model:', error);
            }
        );

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
                            const materials = Array.isArray(child.material) ? child.material : [child.material];
                            materials.forEach(mat => {
                                mat.transparent = true;
                                mat.opacity = 0.6;
                                mat.depthWrite = false;
                            });
                            // Skip outline for water
                            child.userData.skipOutline = true;
                            console.log('Water transparency applied to:', child.name);
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

        // === LOAD FBX MODEL: Vending Machine ===
        const VENDING_TARGET_HEIGHT = 2.0; // Target height: 2m (typical vending machine)

        loader.load(
            'models/vending_machine.fbx',
            (vendingFbx) => {
                console.log('FBX Loaded: vending_machine.fbx');

                // === AUTO-SIZE NORMALIZATION using Box3 ===
                const vendingBox = new THREE.Box3().setFromObject(vendingFbx);
                const vendingSize = new THREE.Vector3();
                vendingBox.getSize(vendingSize);

                const vendingOriginalHeight = vendingSize.y;
                console.log('Vending Machine Original Height:', vendingOriginalHeight.toFixed(3));

                // Calculate scale factor
                const vendingScaleFactor = VENDING_TARGET_HEIGHT / vendingOriginalHeight;
                vendingFbx.scale.setScalar(vendingScaleFactor);
                console.log('Vending Machine Applied Scale:', vendingScaleFactor.toFixed(6));

                // Recalculate bounding box for ground contact
                const scaledVendingBox = new THREE.Box3().setFromObject(vendingFbx);
                const vendingOffsetY = -scaledVendingBox.min.y;

                // Position next to slide (left side)
                vendingFbx.position.set(-11, vendingOffsetY, -8);
                // Face toward player/slide (rotated 90° clockwise)
                vendingFbx.rotation.y = 0;
                console.log('Vending machine placed at (-11, 0, -8)');

                // === Material, Shadow, and Special Effects ===
                vendingFbx.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        const childName = child.name.toLowerCase();

                        // Water/Glass: Transparency
                        if (childName.includes('water') || childName.includes('glass')) {
                            const mats = Array.isArray(child.material) ? child.material : [child.material];
                            mats.forEach(m => {
                                m.transparent = true;
                                m.opacity = 0.5;
                                m.depthWrite = false;
                            });
                            child.userData.skipOutline = true;
                            console.log('Vending: Transparency applied to:', child.name);
                        }

                        // Light: Emission
                        if (childName.includes('light')) {
                            const mats = Array.isArray(child.material) ? child.material : [child.material];
                            mats.forEach(m => {
                                if (m.emissive) {
                                    m.emissive.setHex(0xFFFFFF);
                                    m.emissiveIntensity = 2.0;
                                }
                            });
                            console.log('Vending: Emission applied to:', child.name);
                        }
                    }
                });

                scene.add(vendingFbx);

                // Add edge outlines
                addEdgesOutline(vendingFbx, 15, 0x000000);
                console.log('Vending machine: Edge outlines applied');

                // ▼ Added: Transparent HitBox for Aim Interaction
                const hitBoxGeo = new THREE.BoxGeometry(1.5, 2.5, 1.5);
                const hitBoxMat = new THREE.MeshBasicMaterial({
                    visible: false, // Transparent
                    wireframe: true // Set true for debugging
                });
                const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);

                // Align with vending machine
                hitBox.position.copy(vendingFbx.position);
                hitBox.position.y += 1.0; // Raise center

                // Identification flag
                hitBox.userData.isVendingMachine = true;

                scene.add(hitBox);

                // Add collision data
                if (!window.sgVendingCollision) {
                    window.sgVendingCollision = [];
                }
                window.sgVendingCollision.push({
                    x: -11,
                    z: -8,
                    radius: 0.8
                });
            },
            (progress) => {
                if (progress.total > 0) {
                    const percent = (progress.loaded / progress.total * 100).toFixed(1);
                    console.log(`Loading vending_machine.fbx: ${percent}%`);
                }
            },
            (error) => {
                console.error('Error loading vending_machine.fbx:', error);
            }
        );

        // === LOAD FBX MODEL: Coin (collectible game items) ===
        const COIN_TARGET_SIZE = 0.5; // Target diameter: 50cm

        loader.load(
            'models/coin.fbx',
            (masterCoin) => {
                console.log('FBX Loaded: coin.fbx (master for cloning)');

                // === AUTO-SIZE NORMALIZATION using Box3 ===
                const coinBox = new THREE.Box3().setFromObject(masterCoin);
                const coinSize = new THREE.Vector3();
                coinBox.getSize(coinSize);

                const coinMaxDim = Math.max(coinSize.x, coinSize.y, coinSize.z);
                console.log('Coin Original Size:', coinMaxDim.toFixed(3));

                // Calculate scale factor
                const coinScaleFactor = COIN_TARGET_SIZE / coinMaxDim;
                masterCoin.scale.setScalar(coinScaleFactor);
                console.log('Coin Applied Scale:', coinScaleFactor.toFixed(6));

                // === Material: Keep original FBX settings, only add shadows ===
                masterCoin.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        // DO NOT modify metalness/roughness - keep original FBX material
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

        // === LOAD FBX MODEL: Tree_test (Forest of trees around park edges) ===

        const TREE_TARGET_HEIGHT = 5.0; // Base target height for trees: 5 meters
        const NUM_TREES = 22; // Increased to replace old box-based trees

        loader.load(
            'models/Tree_test.fbx',
            (masterTree) => {
                console.log('FBX Model loaded: Tree_test.fbx (master for cloning)');

                // === AUTO-SIZE NORMALIZATION using Box3 (apply to master) ===
                const treeBox = new THREE.Box3().setFromObject(masterTree);
                const treeSize = new THREE.Vector3();
                treeBox.getSize(treeSize);

                const treeOriginalHeight = treeSize.y;
                console.log('Tree Original Height:', treeOriginalHeight.toFixed(3));

                // Calculate base scale factor to achieve target height
                const baseScaleFactor = TREE_TARGET_HEIGHT / treeOriginalHeight;
                masterTree.scale.setScalar(baseScaleFactor);
                console.log('Tree Base Scale:', baseScaleFactor.toFixed(6));

                // Set up shadows and fix material brightness on master
                masterTree.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        // Fix dark materials from Blender export
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => {
                                    if (mat.emissive) mat.emissive.setHex(0x111111);
                                });
                            } else {
                                if (child.material.emissive) {
                                    child.material.emissive.setHex(0x111111);
                                }
                            }
                        }
                    }
                });

                // === CLONE AND DISTRIBUTE TREES ===
                // Avoid center play area and ensure minimum distance between trees
                const AVOID_CENTER = 12;
                const PARK_BOUNDS = 26;
                const MIN_TREE_DISTANCE = 5.0; // Minimum 5m between trees

                // Track placed tree positions for distance checking
                const placedTrees = [];

                // Helper function to check distance from all placed trees
                function isTooClose(x, z) {
                    for (const placed of placedTrees) {
                        const dx = x - placed.x;
                        const dz = z - placed.z;
                        const distance = Math.sqrt(dx * dx + dz * dz);
                        if (distance < MIN_TREE_DISTANCE) {
                            return true;
                        }
                    }
                    return false;
                }

                // Generate positions with minimum distance check
                const treePositions = [];
                let totalAttempts = 0;
                const maxTotalAttempts = 200;

                while (treePositions.length < NUM_TREES && totalAttempts < maxTotalAttempts) {
                    const x = (Math.random() - 0.5) * 2 * PARK_BOUNDS;
                    const z = (Math.random() - 0.5) * 2 * PARK_BOUNDS;
                    totalAttempts++;

                    // Check: outside center area AND far enough from other trees
                    const outsideCenter = Math.abs(x) >= AVOID_CENTER || Math.abs(z) >= AVOID_CENTER;
                    if (outsideCenter && !isTooClose(x, z)) {
                        treePositions.push({ x, z });
                        placedTrees.push({ x, z });
                    }
                }

                console.log(`Placing ${treePositions.length} trees with ${MIN_TREE_DISTANCE}m spacing...`);

                // Store tree collision boxes globally for movement blocking
                window.sgTreeCollisions = [];

                treePositions.forEach((pos, index) => {
                    // Clone the master tree
                    const treeClone = masterTree.clone();

                    // Mark as tree for raycaster exclusion
                    treeClone.userData.isTree = true;
                    treeClone.name = `Tree_${index}`;
                    treeClone.traverse((child) => {
                        child.userData.isTree = true;
                    });

                    // Random scale variation (0.8 to 1.2)
                    const scaleVariation = 0.8 + Math.random() * 0.4;
                    treeClone.scale.multiplyScalar(scaleVariation);

                    // Recalculate bounding box for this clone's scale
                    const cloneBox = new THREE.Box3().setFromObject(treeClone);
                    const offsetY = -cloneBox.min.y;

                    // Set position with ground alignment
                    treeClone.position.set(pos.x, offsetY, pos.z);

                    // Random Y rotation (0 to 360 degrees)
                    treeClone.rotation.y = Math.random() * Math.PI * 2;

                    // Add collision data for this tree (trunk radius ~0.8m)
                    window.sgTreeCollisions.push({
                        x: pos.x,
                        z: pos.z,
                        radius: 0.8
                    });

                    // Add to scene
                    scene.add(treeClone);

                    // Add edge outlines (EdgesGeometry method)
                    addEdgesOutline(treeClone, 15, 0x000000);
                });


                console.log(`${treePositions.length} trees placed with collision data!`);

                // === EXTERIOR FOREST (Dense trees outside fence) ===
                const NUM_EXTERIOR_TREES = 70;
                console.log(`Placing ${NUM_EXTERIOR_TREES} exterior forest trees...`);

                for (let i = 0; i < NUM_EXTERIOR_TREES; i++) {
                    // Polar coordinates: radius 35-70m, angle 0-360°
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 35 + Math.random() * 35;
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;

                    // Clone the master tree
                    const exteriorTree = masterTree.clone();

                    // Mark as tree for raycaster exclusion
                    exteriorTree.userData.isTree = true;
                    exteriorTree.name = `ExteriorTree_${i}`;
                    exteriorTree.traverse((child) => {
                        child.userData.isTree = true;
                    });

                    // Large scale variation (0.8 to 1.8) for natural forest look
                    const scaleVariation = 0.8 + Math.random() * 1.0;
                    exteriorTree.scale.multiplyScalar(scaleVariation);

                    // Recalculate bounding box for ground alignment
                    const extBox = new THREE.Box3().setFromObject(exteriorTree);
                    const extOffsetY = -extBox.min.y;

                    // Set position
                    exteriorTree.position.set(x, extOffsetY, z);

                    // Random Y rotation
                    exteriorTree.rotation.y = Math.random() * Math.PI * 2;

                    // Add to scene (no collision for exterior trees)
                    scene.add(exteriorTree);

                    // Add edge outlines (EdgesGeometry method)
                    addEdgesOutline(exteriorTree, 15, 0x000000);
                }


                console.log(`${NUM_EXTERIOR_TREES} exterior forest trees placed!`);

            },
            (progress) => {
                if (progress.total > 0) {
                    const percent = (progress.loaded / progress.total * 100).toFixed(1);
                    console.log(`Loading Tree_test.fbx: ${percent}%`);
                }
            },
            (error) => {
                console.error('Error loading Tree_test.fbx:', error);
            }
        );




        // === GRASS MAZE GENERATION (3 color variations, 1.0-1.5m height) ===

        const grassColors = [
            new THREE.MeshLambertMaterial({ color: 0x228B22 }), // Forest green
            new THREE.MeshLambertMaterial({ color: 0x006400 }), // Dark green
            new THREE.MeshLambertMaterial({ color: 0x6B8E23 })  // Olive drab (dried grass)
        ];

        // Grid-based grass placement with paths
        const GRID_SIZE = 3; // Grid cell size
        const GRASS_HEIGHT_MIN = 1.0;
        const GRASS_HEIGHT_MAX = 1.5;


        for (let x = -25; x <= 25; x += GRID_SIZE) {
            for (let z = -25; z <= 25; z += GRID_SIZE) {
                // Skip areas around structures and paths
                const distFromCenter = Math.sqrt(x * x + z * z);
                const onMainPath = (Math.abs(x) < 4 && z > 0) || (Math.abs(z) < 4 && x > 0); // Cross path
                const nearSlide = (x < -4 && x > -12 && z < -4 && z > -12);
                const nearGym = (x > 1 && x < 9 && z < -1 && z > -9);
                const nearBench = (x > 6 && x < 14 && z > 4 && z < 12);
                const nearTree = (x < -8 && x > -16 && z > 1 && z < 9);
                const nearSandbox = (Math.abs(x) < 5 && z > 8 && z < 16);
                const nearFountain = (Math.abs(x) < 5 && z < -8 && z > -16);
                const nearSpawn = (Math.abs(x) < 5 && z > 20); // Player spawn area
                const nearVendingArea = (x > -14 && x < -8 && z > -10 && z < -2); // Vending & Cinematic area

                // Random chance to skip (creates natural paths)
                const randomSkip = Math.random() < 0.3;

                if (nearSlide || nearGym || nearBench || nearTree || nearSandbox || nearFountain || nearSpawn || nearVendingArea || onMainPath || randomSkip) {
                    continue;
                }

                // Create grass clump (multiple boxes for organic look)
                const clumpCount = Math.floor(Math.random() * 3) + 2;
                for (let i = 0; i < clumpCount; i++) {
                    const grassHeight = GRASS_HEIGHT_MIN + Math.random() * (GRASS_HEIGHT_MAX - GRASS_HEIGHT_MIN);
                    const grassMat = grassColors[Math.floor(Math.random() * grassColors.length)];
                    const grass = new THREE.Mesh(
                        new THREE.BoxGeometry(0.4, grassHeight, 0.4),
                        grassMat
                    );
                    grass.position.set(
                        x + (Math.random() - 0.5) * 2,
                        grassHeight / 2,
                        z + (Math.random() - 0.5) * 2
                    );
                    grass.rotation.y = Math.random() * Math.PI;
                    scene.add(grass);
                }

            }
        }

        // (Ketchup items REMOVED - now using Coins via FBX loader)
    }



    function createParkAssets() {
        // ===== VOXEL STYLE PARK - All BoxGeometry, Pastel Colors =====

        // === 滑り台 (Slide) at (-8, 0, -8) - Pastel Pink ===
        const slideGroup = new THREE.Group();
        const slideMaterial = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 }); // Light pink
        const woodMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 }); // Burlywood

        // Platform (stacked blocks)
        for (let y = 0; y < 3; y++) {
            const block = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1, 2),
                woodMaterial
            );
            block.position.set(0, 0.5 + y, 0);
            slideGroup.add(block);
        }
        // Slide slope (tilted box)
        const slope = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.3, 5),
            slideMaterial
        );
        slope.position.set(0, 1.5, 2.8);
        slope.rotation.x = Math.PI / 5;
        slideGroup.add(slope);
        slideGroup.position.set(-8, 0, -8);
        scene.add(slideGroup);
        slideGroup.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
        addEdgesOutline(slideGroup, 20, 0x000000);

        // === ジャングルジム (Jungle Gym) at (5, 0, -5) - Pastel Yellow wireframe ===
        const gymGroup = new THREE.Group();
        const gymMaterial = new THREE.MeshLambertMaterial({ color: 0xFFE4B5, wireframe: true }); // Moccasin
        const gymFrame = new THREE.Mesh(
            new THREE.BoxGeometry(6, 5, 6),
            gymMaterial
        );
        gymFrame.position.y = 2.5;
        gymGroup.add(gymFrame);
        gymGroup.position.set(5, 0, -5);
        scene.add(gymGroup);
        gymGroup.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
        addEdgesOutline(gymGroup, 20, 0x000000);

        // === ベンチ (Bench) at (10, 0, 8) - Pastel Brown ===
        const benchGroup = new THREE.Group();
        const benchMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C }); // Tan
        // Seat
        const benchSeat = new THREE.Mesh(
            new THREE.BoxGeometry(4, 0.4, 1.2),
            benchMaterial
        );
        benchSeat.position.y = 1;
        benchGroup.add(benchSeat);
        // Back
        const benchBack = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.2, 0.3),
            benchMaterial
        );
        benchBack.position.set(0, 1.6, -0.5);
        benchGroup.add(benchBack);
        // Legs (boxes)
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        for (let x of [-1.5, 1.5]) {
            const leg = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 1, 0.8),
                legMaterial
            );
            leg.position.set(x, 0.5, 0);
            benchGroup.add(leg);
        }
        benchGroup.position.set(10, 0, 8);
        scene.add(benchGroup);
        benchGroup.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
        addEdgesOutline(benchGroup, 20, 0x000000);

        // === 大きな木 (Big Tree) - REMOVED, now using Tree_test.fbx ===
        // Old primitive tree deleted - all trees are now FBX models

        // === 砂場 (Sandbox) at (0, 0, 12) - Cream color ===

        const sandMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFACD }); // Lemon chiffon
        const sandEdgeMaterial = new THREE.MeshLambertMaterial({ color: 0xBC8F8F }); // Rosy brown

        // Sand
        const sandbox = new THREE.Mesh(
            new THREE.BoxGeometry(6, 0.4, 6),
            sandMaterial
        );
        sandbox.position.set(0, 0.2, 12);
        scene.add(sandbox);

        // Edge (frame)
        const edgePositions = [
            [0, 0.4, 9], [0, 0.4, 15], [-3, 0.4, 12], [3, 0.4, 12]
        ];
        edgePositions.forEach(([ex, ey, ez], idx) => {
            const isHorizontal = idx < 2;
            const edge = new THREE.Mesh(
                new THREE.BoxGeometry(isHorizontal ? 7 : 0.5, 0.6, isHorizontal ? 0.5 : 7),
                sandEdgeMaterial
            );
            edge.position.set(ex, ey, ez);
            scene.add(edge);
        });

        // === 噴水 (Fountain) at (0, 0, -12) - Voxel style (square) ===
        const fountainGroup = new THREE.Group();
        const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0xB0C4DE }); // Light steel blue
        const waterMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEFA, transparent: true, opacity: 0.7 });

        // Base (square)
        const fountainBase = new THREE.Mesh(
            new THREE.BoxGeometry(6, 1, 6),
            stoneMaterial
        );
        fountainBase.position.y = 0.5;
        fountainGroup.add(fountainBase);

        // Water surface
        const fountainWater = new THREE.Mesh(
            new THREE.BoxGeometry(5, 0.3, 5),
            waterMaterial
        );
        fountainWater.position.y = 0.85;
        fountainGroup.add(fountainWater);

        // Center pillar (stacked cubes)
        for (let y = 0; y < 3; y++) {
            const pillar = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.8, 0.6),
                stoneMaterial
            );
            pillar.position.y = 1.2 + y * 0.7;
            fountainGroup.add(pillar);
        }
        fountainGroup.position.set(0, 0, -12);
        scene.add(fountainGroup);
        fountainGroup.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
        addEdgesOutline(fountainGroup, 20, 0x000000);

        // === 茂み (Bushes) - Voxel style (cubes) ===
        const bushMaterial = new THREE.MeshLambertMaterial({ color: 0x98FB98 }); // Pale green
        const bushPositions = [[15, 0], [-5, 15], [12, -8], [-15, -15]];
        bushPositions.forEach(([x, z]) => {
            // Cluster of small cubes
            const bushGroup = new THREE.Group();
            const offsets = [[0, 0, 0], [0.6, 0.3, 0], [-0.6, 0.2, 0], [0, 0.2, 0.6], [0, 0.4, -0.5]];
            offsets.forEach(([ox, oy, oz]) => {
                const cube = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    bushMaterial
                );
                cube.position.set(ox, 0.5 + oy, oz);
                bushGroup.add(cube);
            });
            bushGroup.position.set(x, 0, z);
            scene.add(bushGroup);
            bushGroup.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
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
                startEndingSequence();

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

            target.visible = false; // Just in case

            // Update Data
            if (window.sgItemData) {
                window.sgItemData.collected++;
                // Update UI
                const counter = document.getElementById('sg-coin-counter');
                if (counter) counter.innerText = window.sgItemData.collected;
            }

            // Update Score
            score += 50;
            const scoreEl = document.getElementById('sg-score');
            if (scoreEl) scoreEl.textContent = score;

            // Effect
            showTapText(window.innerWidth / 2, window.innerHeight / 2, '🪙 コイン GET!', '#FFD700');

            // Clear Target
            window.sgCurrentTarget = null;
            const getBtn = document.getElementById('sg-get-btn');
            if (getBtn) getBtn.style.display = 'none';
            const crosshair = document.getElementById('sg-crosshair');
            if (crosshair) crosshair.classList.remove('target-locked');
        }
    }

    function loop() {
        if (!isPlaying) return;

        // --- Cinematic Mode ---
        if (isCinematic) {
            const delta = clock.getDelta();
            if (mixer) mixer.update(delta); // Keep animations running (idle etc)

            // Sweat Animation
            if (sweatParticles) {
                sweatParticles.forEach(p => {
                    p.mesh.position.y -= p.speed;
                    if (p.mesh.position.y < p.startY - 0.4) p.mesh.position.y = p.startY;
                });
            }

            // Camera Shake Effect
            const time = Date.now() * 0.002;
            // Base Shake on current position (assumes camera is set to cinematic pos)
            // But we need to avoid drifting away. 
            // Better to use offsets from a base, but since we don't store base per frame easily here without state,
            // we'll use a subtle noise or just oscillate.
            // User code: camera.position.x += Math.sin(time) * ...
            // This causes drift if += is used. 
            // User code probably meant oscillation around current point, but += is definitely drift.
            // Let's assume startOpeningSequence set the camera to (-11, 1.0, -3.5).
            // We should use set/copy or oscillate relative to a base.
            // However, to follow user's "camera.position.x += ..." instruction strictly might cause flyaway.
            // Let's implement oscillation: pos = base + offset.
            // Since we don't have base in loop, strict replacement might be risky.
            // But let's look at user code again: "camera.position.x += Math.sin(time) * 0.002; camera.position.y += ..."
            // Math.sin changes sign, so it oscillates... BUT "+=" accumulates the value. Sum of sin is bounded? 
            // Integral of sin is -cos. So it will drift in a cosine pattern but potentially far.
            // Actually, if we add sin(t) every frame, position becomes Integral(sin(t)).
            // It will wander.
            // Let's use a safer shake using the sweat logic concept (looping) or just small randoms.
            // OR use the base position if we knew it.
            // Let's perform a lightweight shake:
            camera.position.x += (Math.random() - 0.5) * 0.002;
            camera.position.y += (Math.random() - 0.5) * 0.002;

            renderer.render(scene, camera);
            requestAnimationFrame(loop);
            return;
        }

        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);

        // FPS movement update
        if (window.sgUpdateMovement) window.sgUpdateMovement();

        // Coin rotation animation (all game coins)
        if (window.sgGameCoins) {
            window.sgGameCoins.forEach(coin => {
                if (coin.visible) {
                    coin.rotation.y += 0.05;
                }
            });
        }

        // === AIM DETECTION (Raycaster from center of screen) ===
        const getBtn = document.getElementById('sg-get-btn');
        const crosshair = document.getElementById('sg-crosshair');

        if (getBtn && camera && crosshair) {
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

            // Objects to interact with: Coins + Scene Children (for Vending HitBox)
            // Filtering scene.children efficiently is better, or use specific array.
            // Using scene.children for Vending HitBox (userData.isVendingMachine)
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
                // Coins are groups in sgGameCoins. Raycaster hits child mesh.
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

        // Render scene (using standard renderer, edges are physical LineSegments)
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(loop);
    }




    return { setup, init, start, stop };
})();



// Init
initGameSystem();
// document.addEventListener('DOMContentLoaded', initGameSystem);
