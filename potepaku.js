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
            window.hasUnlockedPrize = true;
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
                if (typeof window.showGameOver === 'function') {
                    window.showGameOver(score);
                } else {
                    console.error("showGameOver not found!");
                }
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
