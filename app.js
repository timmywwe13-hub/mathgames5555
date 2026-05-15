window.GameHub = {};

/* --- APP LOGIC --- */
GameHub.app = {
    startGame(game) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`${game}-screen`).classList.add('active');
        if (game === 'blackjack') GameHub.blackjack.init();
        if (game === 'scramble') GameHub.wordScramble.init();
        if (game === 'snake') GameHub.snake.init();
        if (game === 'cookie') GameHub.cookieClicker.init();
        if (game === 'dice') GameHub.diceRoll.init();
        if (game === 'fakemon') GameHub.fakemon.init();
    },
    showMenu() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('menu-screen').classList.add('active');
        if (GameHub.snake && GameHub.snake.stop) GameHub.snake.stop();
        if (GameHub.wordScramble && GameHub.wordScramble.timerInterval) clearInterval(GameHub.wordScramble.timerInterval);
        if (GameHub.fakemon && GameHub.fakemon.gameLoop) cancelAnimationFrame(GameHub.fakemon.gameLoop);
        if (GameHub.cookieClicker && GameHub.cookieClicker.autoInterval) clearInterval(GameHub.cookieClicker.autoInterval);
    },
    showModal(title, body, btnText, callback) {
        const modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerText = body;
        const btn = document.getElementById('modal-btn');
        btn.innerText = btnText;
        btn.onclick = () => { modal.style.display = 'none'; callback(); };
        modal.style.display = 'flex';
    }
};

/* --- BLACKJACK --- */
GameHub.blackjack = {
    chips: 500, deck: [], playerHand: [], dealerHand: [], currentBet: 0, gameActive: false,
    init() { this.chips = 500; this.updateUI(); },
    updateUI() { document.getElementById('bj-chips').innerText = this.chips; },
    adjustBet(amt) {
        let input = document.getElementById('bj-bet-input');
        let val = parseInt(input.value) + amt;
        if (val < 10) val = 10; if (val > this.chips) val = this.chips;
        input.value = val;
    },
    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'], values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        this.deck = [];
        for (let s of suits) for (let v of values) this.deck.push({ value: v, suit: s, color: (s === '♥' || s === '♦') ? 'red' : 'black' });
        this.deck.sort(() => Math.random() - 0.5);
    },
    getHandValue(hand) {
        let value = 0, aces = 0;
        for (let card of hand) {
            if (card.value === 'A') { aces++; value += 11; }
            else if (['J','Q','K'].includes(card.value)) value += 10;
            else value += parseInt(card.value);
        }
        while (value > 21 && aces > 0) { value -= 10; aces--; }
        return value;
    },
    renderCard(card, isHidden = false) {
        const div = document.createElement('div');
        div.className = `card ${isHidden ? 'hidden' : card.color}`;
        div.innerHTML = isHidden
            ? `<div style="margin:auto">?</div>`
            : `<div>${card.value}</div><div style="text-align:center; font-size:1.5rem">${card.suit}</div><div style="text-align:right">${card.value}</div>`;
        return div;
    },
    deal() {
        this.currentBet = parseInt(document.getElementById('bj-bet-input').value);
        if (this.currentBet > this.chips) return alert("Not enough chips!");
        this.chips -= this.currentBet; this.updateUI();
        this.createDeck();
        this.playerHand = [this.deck.pop(), this.deck.pop()];
        this.dealerHand = [this.deck.pop(), this.deck.pop()];
        this.gameActive = true;
        document.getElementById('bj-deal-btn').style.display = 'none';
        document.getElementById('bj-action-btns').style.display = 'block';
        document.getElementById('bj-next-btn').style.display = 'none';
        document.getElementById('bj-message').innerText = "";
        document.getElementById('bj-dealer-score').style.display = 'none';
        this.updateTable();
        if (this.getHandValue(this.playerHand) === 21) this.stand();
    },
    updateTable() {
        const pHandDiv = document.getElementById('bj-player-hand'), dHandDiv = document.getElementById('bj-dealer-hand');
        pHandDiv.innerHTML = ''; dHandDiv.innerHTML = '';
        this.playerHand.forEach(c => pHandDiv.appendChild(this.renderCard(c)));
        this.dealerHand.forEach((c, i) => dHandDiv.appendChild(this.renderCard(c, i === 1 && this.gameActive)));
        document.getElementById('bj-player-score').innerText = `(${this.getHandValue(this.playerHand)})`;
    },
    hit() {
        this.playerHand.push(this.deck.pop()); this.updateTable();
        if (this.getHandValue(this.playerHand) > 21) this.endRound("Bust! Dealer wins.");
    },
    double() {
        if (this.chips < this.currentBet) return alert("Not enough chips!");
        this.chips -= this.currentBet; this.currentBet *= 2; this.updateUI();
        this.hit(); if (this.getHandValue(this.playerHand) <= 21) this.stand();
    },
    stand() {
        this.gameActive = false;
        let dValue = this.getHandValue(this.dealerHand);
        while (dValue < 17) { this.dealerHand.push(this.deck.pop()); dValue = this.getHandValue(this.dealerHand); }
        this.updateTable();
        document.getElementById('bj-dealer-score').style.display = 'inline';
        document.getElementById('bj-dealer-score').innerText = `(${dValue})`;
        const pValue = this.getHandValue(this.playerHand);
        if (dValue > 21 || pValue > dValue) {
            let winAmt = this.currentBet * 2;
            if (pValue === 21 && this.playerHand.length === 2) winAmt = this.currentBet * 2.5;
            this.chips += winAmt; this.endRound("You Win!");
        } else if (pValue < dValue) {
            this.endRound("Dealer Wins.");
        } else {
            this.chips += this.currentBet; this.endRound("Push (Tie).");
        }
    },
    endRound(msg) {
        this.gameActive = false;
        document.getElementById('bj-message').innerText = msg;
        document.getElementById('bj-action-btns').style.display = 'none';
        document.getElementById('bj-next-btn').style.display = 'inline-block';
        this.updateUI();
        if (this.chips <= 0) GameHub.app.showModal("Bankrupt!", "You ran out of chips!", "Restart", () => { this.chips = 500; this.updateUI(); this.resetRound(); });
    },
    resetRound() {
        document.getElementById('bj-deal-btn').style.display = 'inline-block';
        document.getElementById('bj-action-btns').style.display = 'none';
        document.getElementById('bj-next-btn').style.display = 'none';
        document.getElementById('bj-dealer-hand').innerHTML = '';
        document.getElementById('bj-player-hand').innerHTML = '';
        document.getElementById('bj-player-score').innerText = '';
        document.getElementById('bj-dealer-score').style.display = 'none';
        document.getElementById('bj-message').innerText = '';
    }
};

/* --- WORD SCRAMBLE --- */
GameHub.wordScramble = {
    words: [
        {w: 'Elephant', d: 1}, {w: 'Giraffe', d: 1}, {w: 'Kangaroo', d: 1}, {w: 'Penguin', d: 1},
        {w: 'Hamster', d: 1}, {w: 'Japan', d: 1}, {w: 'Canada', d: 1}, {w: 'Brazil', d: 1},
        {w: 'France', d: 1}, {w: 'Egypt', d: 1}, {w: 'Pizza', d: 1}, {w: 'Burger', d: 1},
        {w: 'Taco', d: 1}, {w: 'Sushi', d: 1}, {w: 'Pasta', d: 1}, {w: 'Soccer', d: 1},
        {w: 'Tennis', d: 1}, {w: 'Hockey', d: 1}, {w: 'Rugby', d: 1}, {w: 'Boxing', d: 1},
        {w: 'Astronaut', d: 2}, {w: 'Architect', d: 2}, {w: 'Detective', d: 2}, {w: 'Engineer', d: 2},
        {w: 'Musician', d: 2}, {w: 'Australia', d: 2}, {w: 'Argentina', d: 2}, {w: 'Thailand', d: 2},
        {w: 'Iceland', d: 2}, {w: 'Germany', d: 2}, {w: 'Chocolate', d: 2}, {w: 'Avocado', d: 2},
        {w: 'Pineapple', d: 2}, {w: 'Coconut', d: 2}, {w: 'Pumpkin', d: 2},
        {w: 'Synchronize', d: 3}, {w: 'Philosophy', d: 3}, {w: 'Atmosphere', d: 3},
        {w: 'Algorithm', d: 3}, {w: 'Hypothesis', d: 3}
    ],
    currentWord: '', score: 0, streak: 0, count: 0, timer: 30, timerInterval: null, difficulty: 1, hintUsed: false,
    init() { this.score = 0; this.streak = 0; this.count = 0; this.difficulty = 1; this.nextWord(); },
    nextWord() {
        this.count++; if (this.count > 10) { this.endGame(); return; }
        this.hintUsed = false; document.getElementById('sc-hint-btn').disabled = false;
        document.getElementById('sc-count').innerText = this.count;
        document.getElementById('sc-input').value = '';
        const pool = this.words.filter(w => w.d <= this.difficulty);
        const pick = pool[Math.floor(Math.random() * pool.length)];
        this.currentWord = pick.w;
        let s = this.currentWord.split('').sort(() => Math.random() - 0.5).join('');
        while (s.toLowerCase() === this.currentWord.toLowerCase()) s = this.currentWord.split('').sort(() => Math.random() - 0.5).join('');
        document.getElementById('sc-word').innerText = s;
        this.startTimer();
    },
    startTimer() {
        clearInterval(this.timerInterval); this.timer = 30;
        const bar = document.getElementById('sc-timer-bar');
        this.timerInterval = setInterval(() => {
            this.timer -= 0.1; bar.style.width = (this.timer / 30 * 100) + '%';
            if (this.timer <= 0) { clearInterval(this.timerInterval); this.streak = 0; this.updateStats(); this.nextWord(); }
        }, 100);
    },
    checkGuess() {
        const guess = document.getElementById('sc-input').value.trim().toLowerCase();
        if (guess === this.currentWord.toLowerCase()) {
            let points = 10; if (this.timer > 25) points += 5;
            this.score += points; this.streak++; if (this.streak % 5 === 0) this.difficulty++;
            this.updateStats(); clearInterval(this.timerInterval); this.nextWord();
        } else {
            document.getElementById('sc-input').style.border = '2px solid red';
            setTimeout(() => { document.getElementById('sc-input').style.border = 'none'; }, 500);
        }
    },
    useHint() {
        if (this.hintUsed) return; this.score = Math.max(0, this.score - 3); this.updateStats();
        this.hintUsed = true; document.getElementById('sc-hint-btn').disabled = true;
        const idx = Math.floor(Math.random() * this.currentWord.length);
        alert(`Hint: Letter at position ${idx + 1} is ${this.currentWord[idx]}`);
    },
    updateStats() { document.getElementById('sc-score').innerText = this.score; document.getElementById('sc-streak').innerText = this.streak; },
    endGame() { clearInterval(this.timerInterval); GameHub.app.showModal("Complete!", `Score: ${this.score}`, "Play Again", () => this.init()); }
};

/* --- SNAKE --- */
GameHub.snake = {
    canvas: null, ctx: null, snake: [], food: {x: 0, y: 0}, dir: 'RIGHT', nextDir: 'RIGHT',
    score: 0, highscore: 0, paused: false, speed: 150, lastTime: 0, timer: 0, gameLoop: null,
    init() {
        this.canvas = document.getElementById('snakeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.reset(); this.start();
    },
    reset() {
        this.snake = [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}];
        this.dir = 'RIGHT'; this.nextDir = 'RIGHT'; this.score = 0; this.speed = 150;
        this.paused = false; this.spawnFood(); this.updateUI();
    },
    spawnFood() {
        this.food = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) };
        if (this.snake.some(s => s.x === this.food.x && s.y === this.food.y)) this.spawnFood();
    },
    setDir(newDir) {
        const opposites = { 'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT' };
        if (newDir !== opposites[this.dir]) this.nextDir = newDir;
    },
    togglePause() {
        this.paused = !this.paused;
        document.getElementById('sn-pause-msg').style.display = this.paused ? 'block' : 'none';
    },
    updateUI() {
        document.getElementById('sn-score').innerText = this.score;
        document.getElementById('sn-highscore').innerText = this.highscore;
    },
    start() { this.lastTime = performance.now(); this.gameLoop = requestAnimationFrame((t) => this.loop(t)); },
    stop() { cancelAnimationFrame(this.gameLoop); },
    loop(timestamp) {
        const deltaTime = timestamp - this.lastTime; this.lastTime = timestamp; this.timer += deltaTime;
        if (!this.paused && this.timer >= this.speed) { this.update(); this.draw(); this.timer = 0; }
        this.gameLoop = requestAnimationFrame((t) => this.loop(t));
    },
    update() {
        this.dir = this.nextDir; const head = { ...this.snake[0] };
        if (this.dir === 'UP') head.y--; if (this.dir === 'DOWN') head.y++;
        if (this.dir === 'LEFT') head.x--; if (this.dir === 'RIGHT') head.x++;
        if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || this.snake.some(s => s.x === head.x && s.y === head.y)) return this.gameOver();
        this.snake.unshift(head);
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            if (this.score % 50 === 0) this.speed = Math.max(60, this.speed - 10);
            this.spawnFood(); this.updateUI();
        } else {
            this.snake.pop();
        }
    },
    draw() {
        this.ctx.clearRect(0, 0, 400, 400);
        this.ctx.fillStyle = '#ef4444'; this.drawRR(this.food.x * 20, this.food.y * 20, 18, 18, 5);
        this.snake.forEach((s, i) => { this.ctx.fillStyle = i === 0 ? '#22d3ee' : '#0891b2'; this.drawRR(s.x * 20, s.y * 20, 18, 18, 5); });
    },
    drawRR(x, y, w, h, r) { this.ctx.beginPath(); this.ctx.roundRect(x + 1, y + 1, w, h, r); this.ctx.fill(); },
    gameOver() {
        if (this.score > this.highscore) this.highscore = this.score;
        this.updateUI();
        GameHub.app.showModal("Game Over!", `Score: ${this.score}`, "Try Again", () => this.reset());
    }
};

/* --- COOKIE CLICKER --- */
GameHub.cookieClicker = {
    cookies: 0, cps: 0, autoInterval: null,
    baseUpgrades: [
        { name: "Cursor",   cost: 15,          power: 0.1,    emoji: "🖱️" },
        { name: "Grandma",  cost: 100,          power: 1,      emoji: "👵" },
        { name: "Farm",     cost: 1100,         power: 8,      emoji: "🌾" },
        { name: "Mine",     cost: 12000,        power: 47,     emoji: "⛏️" },
        { name: "Factory",  cost: 130000,       power: 260,    emoji: "🏭" },
        { name: "Bank",     cost: 1400000,      power: 1400,   emoji: "🏦" },
        { name: "Temple",   cost: 20000000,     power: 7800,   emoji: "🏛️" },
        { name: "Wizard",   cost: 330000000,    power: 44000,  emoji: "🧙" },
        { name: "Shipment", cost: 5100000000,   power: 260000, emoji: "🚀" },
    ],
    upgrades: [],
    init() {
        this.cookies = 0;
        this.cps = 0;
        this.upgrades = this.baseUpgrades.map(u => ({ ...u, count: 0, currentCost: u.cost }));
        if (this.autoInterval) clearInterval(this.autoInterval);
        this.renderUpgrades();
        this.startAuto();
        this.updateUI();
    },
    clickCookie() {
        this.cookies++;
        this.updateUI();
    },
    handleTouch(e) {
        e.preventDefault();
        this.clickCookie();
    },
    startAuto() {
        this.autoInterval = setInterval(() => {
            if (this.cps > 0) {
                this.cookies += this.cps / 10;
                this.updateUI();
            }
        }, 100);
    },
    renderUpgrades() {
        const list = document.getElementById('upgrade-list');
        if (!list) return;
        list.innerHTML = '';
        this.upgrades.forEach((upg, i) => {
            const btn = document.createElement('button');
            btn.className = 'upgrade-btn';
            btn.id = `upg-${i}`;
            btn.onclick = () => this.buyUpgrade(i);
            btn.innerHTML = `${upg.emoji} <b>${upg.name}</b> x${upg.count}<br><small>Cost: ${this.formatNum(upg.currentCost)}</small><br><small>+${upg.power} CPS each</small>`;
            list.appendChild(btn);
        });
    },
    buyUpgrade(i) {
        const upg = this.upgrades[i];
        if (this.cookies >= upg.currentCost) {
            this.cookies -= upg.currentCost;
            upg.count++;
            this.cps += upg.power;
            upg.currentCost = Math.ceil(upg.currentCost * 1.15);
            this.renderUpgrades();
            this.updateUI();
        }
    },
    formatNum(n) {
        if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
        if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
        return Math.floor(n);
    },
    updateUI() {
        const countEl = document.getElementById('cookie-count');
        const cpsEl = document.getElementById('cookie-cps');
        if (countEl) countEl.innerText = `${this.formatNum(this.cookies)} Cookies`;
        if (cpsEl) cpsEl.innerText = `CPS: ${this.cps.toFixed(1)}`;
        this.upgrades.forEach((upg, i) => {
            const btn = document.getElementById(`upg-${i}`);
            if (btn) btn.disabled = this.cookies < upg.currentCost;
        });
    }
};

/* --- DICE ROLL --- */
GameHub.diceRoll = {
    balance: 500,
    init() { this.balance = 500; this.updateUI(); },
    updateUI() { document.getElementById('dice-balance').innerText = this.balance; },
    roll() {
        const bet = parseInt(document.getElementById('dice-bet-amount').value);
        const picked = document.getElementById('dice-number').value;
        const display = document.getElementById('dice-result-display');
        const msg = document.getElementById('dice-message');
        if (isNaN(bet) || bet <= 0 || bet > this.balance) return alert("Invalid bet!");
        this.balance -= bet; this.updateUI();
        let rolls = 0;
        const interval = setInterval(() => {
            display.innerText = `🎲 ${Math.floor(Math.random() * 6) + 1}`;
            if (++rolls > 10) {
                clearInterval(interval);
                const result = Math.floor(Math.random() * 6) + 1;
                display.innerText = `🎲 ${result}`;
                if (result == picked) { this.balance += bet * 5; msg.innerText = "JACKPOT! 🎉"; msg.style.color = "lime"; }
                else { msg.innerText = "Lost! Try again."; msg.style.color = "red"; }
                this.updateUI();
            }
        }, 100);
    }
};

/* --- FAKEMON --- */
GameHub.fakemon = {
    canvas: null, ctx: null,
    player: { x: 250, y: 250, size: 30, speed: 4, dir: 'STOP' },
    monsters: [], caught: 0,
    pool: [
        {e: '🐶', n: 'Wooflet', lv: 5,  hp: 50},  {e: '🐱', n: 'Meowish', lv: 7,  hp: 60},
        {e: '🐉', n: 'Drakon',  lv: 12, hp: 100}, {e: '🦊', n: 'Foxy',    lv: 6,  hp: 55},
        {e: '🦁', n: 'Leo',     lv: 15, hp: 120}, {e: '🐹', n: 'Hammy',   lv: 4,  hp: 40},
        {e: '🐨', n: 'Koal',    lv: 8,  hp: 70},  {e: '🐯', n: 'Tigra',   lv: 14, hp: 110},
        {e: '🐸', n: 'Froggo',  lv: 5,  hp: 50},  {e: '🦄', n: 'Uni',     lv: 20, hp: 150}
    ],
    party: [
        {n: 'Leaflet', e: '🌱', hp: 100, maxHp: 100, lv: 10},
        {n: 'Flamy',   e: '🔥', hp: 100, maxHp: 100, lv: 10},
        {n: 'Aqua',    e: '💧', hp: 100, maxHp: 100, lv: 10},
        {n: 'Sparky',  e: '⚡', hp: 100, maxHp: 100, lv: 10}
    ],
    grass: [], state: 'WORLD', currentEnemy: null, currentAlly: null,
    init() {
        this.canvas = document.getElementById('fakemonCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.caught = 0; this.state = 'WORLD';
        this.player.x = 250; this.player.y = 250;
        this.party.forEach(p => { p.hp = p.maxHp; });
        this.createWorld(); this.spawn(); this.start();
    },
    createWorld() {
        this.grass = [];
        for (let i = 0; i < 60; i++) this.grass.push({x: Math.random() * 500, y: Math.random() * 500, s: Math.random() * 5 + 2});
    },
    spawn() {
        this.monsters = [];
        for (let i = 0; i < 10; i++) {
            const p = this.pool[Math.floor(Math.random() * this.pool.length)];
            this.monsters.push({ x: Math.random() * 460 + 20, y: Math.random() * 460 + 20, emoji: p.e, name: p.n, lv: p.lv, hp: p.hp, maxHp: p.hp, caught: false, offset: Math.random() * Math.PI * 2 });
        }
    },
    startMove(d) { this.player.dir = d; },
    stopMove() { this.player.dir = 'STOP'; },
    start() { this.gameLoop = requestAnimationFrame(() => this.loop()); },
    loop() { this.update(); this.draw(); this.gameLoop = requestAnimationFrame(() => this.loop()); },
    update() {
        if (this.state !== 'WORLD') return;
        if (this.player.dir === 'UP')    this.player.y -= this.player.speed;
        if (this.player.dir === 'DOWN')  this.player.y += this.player.speed;
        if (this.player.dir === 'LEFT')  this.player.x -= this.player.speed;
        if (this.player.dir === 'RIGHT') this.player.x += this.player.speed;
        this.player.x = Math.max(0, Math.min(500 - this.player.size, this.player.x));
        this.player.y = Math.max(0, Math.min(500 - this.player.size, this.player.y));
        this.monsters.forEach(m => { if (!m.caught && Math.hypot(this.player.x - m.x, this.player.y - m.y) < 30) this.startBattle(m); });
    },
    draw() {
        this.ctx.fillStyle = "#2d5a27"; this.ctx.fillRect(0, 0, 500, 500);
        this.ctx.fillStyle = "#3a7a35";
        this.grass.forEach(g => { this.ctx.beginPath(); this.ctx.arc(g.x, g.y, g.s, 0, Math.PI * 2); this.ctx.fill(); });
        const time = Date.now() / 500;
        this.ctx.font = "30px Arial"; this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle";
        this.monsters.forEach(m => { if (!m.caught) { const bob = Math.sin(time + m.offset) * 5; this.ctx.fillText(m.emoji, m.x, m.y + bob); } });
        this.ctx.font = "35px Arial"; this.ctx.fillText("🚶", this.player.x + 15, this.player.y + 15);
    },
    startBattle(monster) {
        this.state = 'BATTLE'; this.currentEnemy = monster; this.currentAlly = this.party[0];
        document.getElementById('fakemon-battle-ui').style.display = 'block';
        document.getElementById('enemy-name').innerText = monster.name;
        document.getElementById('enemy-lv').innerText = monster.lv;
        document.getElementById('enemy-hp').style.width = '100%';
        document.getElementById('player-name').innerText = this.currentAlly.n;
        document.getElementById('player-lv').innerText = this.currentAlly.lv;
        document.getElementById('player-hp').style.width = (this.currentAlly.hp / this.currentAlly.maxHp * 100) + '%';
        document.getElementById('enemy-sprite').innerText = monster.emoji;
        document.getElementById('player-sprite').innerText = this.currentAlly.e;
        this.showBattleText(`A wild ${monster.name} appeared!`);
    },
    showBattleText(txt) {
        const el = document.getElementById('battle-text');
        el.innerText = txt; el.style.display = 'block';
        setTimeout(() => { el.style.display = 'none'; }, 2000);
    },
    battleAction(action) {
        if (this.state !== 'BATTLE') return;
        if (action === 'attack') {
            const dmg = 10 + Math.floor(Math.random() * 10);
            this.currentEnemy.hp -= dmg;
            this.showBattleText(`${this.currentAlly.n} attacked for ${dmg} dmg!`);
            this.updateBattleUI();
            if (this.currentEnemy.hp <= 0) {
                setTimeout(() => {
                    this.showBattleText(`${this.currentEnemy.name} fainted! You caught it!`);
                    this.currentEnemy.caught = true; this.caught++;
                    document.getElementById('fakemon-caught').innerText = this.caught;
                    setTimeout(() => this.endBattle(), 2000);
                }, 1000);
            } else {
                setTimeout(() => this.enemyTurn(), 1500);
            }
        } else if (action === 'catch') {
            const chance = (1 - (this.currentEnemy.hp / this.currentEnemy.maxHp)) + 0.2;
            if (Math.random() < chance) {
                this.showBattleText(`Gotcha! ${this.currentEnemy.name} was caught!`);
                this.currentEnemy.caught = true; this.caught++;
                document.getElementById('fakemon-caught').innerText = this.caught;
                setTimeout(() => this.endBattle(), 2000);
            } else {
                this.showBattleText(`Oh no! It broke free!`);
                setTimeout(() => this.enemyTurn(), 1500);
            }
        } else if (action === 'run') {
            this.showBattleText(`Got away safely!`);
            setTimeout(() => this.endBattle(), 1000);
        }
    },
    enemyTurn() {
        const dmg = 5 + Math.floor(Math.random() * 5);
        this.currentAlly.hp -= dmg;
        this.showBattleText(`${this.currentEnemy.name} attacked back for ${dmg} dmg!`);
        this.updateBattleUI();
        if (this.currentAlly.hp <= 0) {
            this.showBattleText(`Your Pokémon fainted!`);
            setTimeout(() => this.endBattle(), 2000);
        }
    },
    updateBattleUI() {
        document.getElementById('enemy-hp').style.width = Math.max(0, (this.currentEnemy.hp / this.currentEnemy.maxHp * 100)) + '%';
        document.getElementById('player-hp').style.width = Math.max(0, (this.currentAlly.hp / this.currentAlly.maxHp * 100)) + '%';
    },
    endBattle() {
        this.state = 'WORLD';
        document.getElementById('fakemon-battle-ui').style.display = 'none';
        this.currentAlly.hp = this.currentAlly.maxHp;
    }
};

/* --- SETTINGS --- */
GameHub.settings = {
    changeBg(color) { document.body.style.backgroundColor = color; },
    changeAccent(color) {
        document.documentElement.style.setProperty('--accent-gold', color);
        document.documentElement.style.setProperty('--accent-green', color);
        document.documentElement.style.setProperty('--accent-cyan', color);
    }
};

/* --- GLOBAL KEYBOARD CONTROLS --- */
window.addEventListener('keydown', (e) => {
    if (document.getElementById('snake-screen').classList.contains('active')) {
        if (e.key === 'ArrowUp')    GameHub.snake.setDir('UP');
        if (e.key === 'ArrowDown')  GameHub.snake.setDir('DOWN');
        if (e.key === 'ArrowLeft')  GameHub.snake.setDir('LEFT');
        if (e.key === 'ArrowRight') GameHub.snake.setDir('RIGHT');
    }
    if (document.getElementById('fakemon-screen').classList.contains('active')) {
        if (e.key === 'ArrowUp')    GameHub.fakemon.startMove('UP');
        if (e.key === 'ArrowDown')  GameHub.fakemon.startMove('DOWN');
        if (e.key === 'ArrowLeft')  GameHub.fakemon.startMove('LEFT');
        if (e.key === 'ArrowRight') GameHub.fakemon.startMove('RIGHT');
    }
});
window.addEventListener('keyup', (e) => {
    if (document.getElementById('fakemon-screen').classList.contains('active')) GameHub.fakemon.stopMove();
});
