/* Mini-Game System Controller */

const GameLibrary = {
    'potato-action': {
        title: "ポテトくんアクション",
        shortTitle: "ポテアク",
        description: "降ってくる「🍟(5点)」と「🍔(10点)」を集めよう！「☠️」に当たるとゲームオーバー！",
        icon: "🥔",
        iconImage: "assets/potatokun-action.png", // Custom Image
        isBeta: true, // Show Beta Badge
        init: (container) => PotatoAction.init(container),
        start: () => PotatoAction.start(),
        stop: () => PotatoAction.stop()
    },
    'potato-clicker': {
        title: "ポテトくんクリッカー",
        description: "【準備中】ポテトくんをクリックしてポイントを稼ぐゲームです。",
        icon: "👆",
        init: () => { },
        start: () => { },
        stop: () => { },
        isComingSoon: true
    },
    '3d-search': {
        title: "3D探索ゲーム",
        description: "【準備中】画面内の隠されたアイテムを探すゲームです。",
        icon: "🔍",
        init: () => { },
        start: () => { },
        stop: () => { },
        isComingSoon: true
    }
};

let currentActiveGameId = null;

/* DOM Elements */
let overlay, menuContainer, introContainer, activeGameContainer, gameOverContainer;
let fabBtn;

/* System Initialization */
function initGameSystem() {
    overlay = document.getElementById('minigame-container');
    menuContainer = document.getElementById('game-menu');
    introContainer = document.getElementById('game-intro');
    activeGameContainer = document.getElementById('active-game-container');
    gameOverContainer = document.getElementById('common-game-over');
    fabBtn = document.getElementById('fab-play-game');

    fabBtn.addEventListener('click', showGameMenu);

    // Setup Menu Grid
    renderGameMenu();

    // Close Button (Portal Level)
    document.getElementById('portal-close-btn').addEventListener('click', closePortal);

    // Intro Buttons
    document.getElementById('intro-start-btn').addEventListener('click', launchGame);
    document.getElementById('intro-back-btn').addEventListener('click', showGameMenu);

    // Game Over Buttons
    document.getElementById('game-over-retry-btn').addEventListener('click', launchGame);
    document.getElementById('game-over-menu-btn').addEventListener('click', showGameMenu);

    // Initial setup for specific games
    PotatoAction.setup(activeGameContainer);
}

function showGameMenu() {
    overlay.classList.remove('hidden');
    menuContainer.classList.remove('hidden');
    introContainer.classList.add('hidden');
    activeGameContainer.classList.add('hidden');
    gameOverContainer.classList.add('hidden');

    if (currentActiveGameId) {
        GameLibrary[currentActiveGameId].stop();
        currentActiveGameId = null;
    }
}

function closePortal() {
    overlay.classList.add('hidden');
    if (currentActiveGameId) {
        GameLibrary[currentActiveGameId].stop();
        currentActiveGameId = null;
    }
}

function renderGameMenu() {
    const grid = document.getElementById('game-grid');
    grid.innerHTML = ''; // Clear

    Object.keys(GameLibrary).forEach(id => {
        const game = GameLibrary[id];
        const card = document.createElement('div');
        card.className = `game-card ${game.isComingSoon ? 'disabled' : ''}`;

        const iconHtml = game.iconImage
            ? `<img src="${game.iconImage}" class="game-icon-img" alt="${game.title}">`
            : `<div class="game-icon">${game.icon}</div>`;

        card.innerHTML = `
            ${iconHtml}
            <div class="game-title">${game.title}</div>
            ${game.isBeta ? '<div class="beta-badge">β版</div>' : ''}
            ${game.isComingSoon ? '<div class="coming-soon-badge">Coming Soon</div>' : ''}
        `;

        if (!game.isComingSoon) {
            card.addEventListener('click', () => showGameIntro(id));
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
        prizeLink.href = "https://drive.google.com/file/d/1nz9HWyO4Q3sMbPDmTLRZcGWkF6k1OjZf/view?usp=sharing";
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
                    showFloatText(item.el.offsetLeft, item.el.offsetTop, 'RARE GET!', '#FF1493');
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


// Init
document.addEventListener('DOMContentLoaded', initGameSystem);
