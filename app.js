let gameInterval;
let diffMode = "medium";

function getHighscore(key) {
    return Number(localStorage.getItem("gamehub-highscore-" + key) || 0);
}

function saveHighscore(key, score) {
    const best = getHighscore(key);
    if(score > best) {
        localStorage.setItem("gamehub-highscore-" + key, score);
        return true;
    }
    return false;
}

function getBestTime(key) {
    return Number(localStorage.getItem("gamehub-besttime-" + key) || 0);
}

function saveBestTime(key, time) {
    const best = getBestTime(key);
    if(!best || time < best) {
        localStorage.setItem("gamehub-besttime-" + key, time);
        return true;
    }
    return false;
}

function scoreText(label, score, key) {
    return `${label}: ${score} | Highscore: ${getHighscore(key)}`;
}

let clickerInterval = null;

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    clearInterval(gameInterval);
    if(clickerInterval) {
        clearInterval(clickerInterval);
        saveClickerState();
    }

    const activeSelect = document.querySelector(`#${screenId} .diff-select`);
    if(activeSelect) activeSelect.value = diffMode;

    if(document.getElementById('snake-start-btn')) document.getElementById('snake-start-btn').style.display = 'block';
    if(document.getElementById('flappy-start-btn')) document.getElementById('flappy-start-btn').style.display = 'block';

    if(screenId === 'game-tictactoe') resetTTT();
    if(screenId === 'game-memory') initMemory();
    if(screenId === 'game-blockblast') initBlockBlast();
    if(screenId === 'game-highlow') initHighLow();
    if(screenId === 'game-guess') initGuess();
    if(screenId === 'game-clicker') initClicker();
    if(screenId === 'game-reaction') initReaction();
    if(screenId === 'game-hangman') initHangman();
    if(screenId === 'game-yatzy') initYatzy();
}

function liveDifficultyChange(value) {
    diffMode = value;
    const activeScreen = document.querySelector('.screen.active').id;
    if(activeScreen === 'game-snake' && document.getElementById('snake-start-btn').style.display === 'none') startSnake();
    if(activeScreen === 'game-flappy' && document.getElementById('flappy-start-btn').style.display === 'none') startFlappy();
    if(activeScreen === 'game-memory') initMemory();
    if(activeScreen === 'game-blockblast') initBlockBlast();
    if(activeScreen === 'game-reaction') initReaction();
    if(activeScreen === 'game-guess') initGuess();
    if(activeScreen === 'game-hangman') initHangman();
}

window.addEventListener("keydown", function(e) {
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.key || e.code)) {
        if(document.getElementById('game-snake').classList.contains('active') || document.getElementById('game-flappy').classList.contains('active')) e.preventDefault();
    }
    if(e.key === "ArrowUp") changeSnakeDir("UP"); if(e.key === "ArrowDown") changeSnakeDir("DOWN");
    if(e.key === "ArrowLeft") changeSnakeDir("LEFT"); if(e.key === "ArrowRight") changeSnakeDir("RIGHT");
    if(e.code === "Space") flappyJump();
});

// SNAKE
let snake, snakeDir, food, snakeScore;
function startSnake() {
    document.getElementById('snake-start-btn').style.display = 'none';
    snake = [{x: 8, y: 8}]; snakeDir = "RIGHT"; snakeScore = 0; generateFood();
    document.getElementById('snake-score').innerText = scoreText("Score", snakeScore, "snake");
    let speed = diffMode === "easy" ? 170 : (diffMode === "medium" ? 110 : 65);
    clearInterval(gameInterval);
    gameInterval = setInterval(updateSnake, speed);
}
function generateFood() { food = { x: Math.floor(Math.random()*15), y: Math.floor(Math.random()*15) }; }
function changeSnakeDir(dir) {
    if(dir==="UP" && snakeDir!=="DOWN") snakeDir="UP"; if(dir==="DOWN" && snakeDir!=="UP") snakeDir="DOWN";
    if(dir==="LEFT" && snakeDir!=="RIGHT") snakeDir="LEFT"; if(dir==="RIGHT" && snakeDir!=="LEFT") snakeDir="RIGHT";
}
function updateSnake() {
    let head = { ...snake[0] };
    if(snakeDir === "RIGHT") head.x++; if(snakeDir === "LEFT") head.x--; if(snakeDir === "UP") head.y--; if(snakeDir === "DOWN") head.y++;
    if(head.x < 0 || head.x >= 15 || head.y < 0 || head.y >= 15 || snake.some(s => s.x === head.x && s.y === head.y)) {
        document.getElementById('snake-score').innerText = "💀 Crashed! Score: " + snakeScore;
        document.getElementById('snake-start-btn').style.display = 'block';
        clearInterval(gameInterval); return;
    }
    snake.unshift(head);
    if(head.x === food.x && head.y === food.y) { snakeScore++; generateFood(); } else { snake.pop(); }
    const ctx = document.getElementById("snakeCanvas").getContext("2d");
    ctx.fillStyle = "#fdf8ef"; ctx.fillRect(0,0,300,300);
    ctx.fillStyle = "#c27a5a"; ctx.beginPath(); ctx.arc(food.x*20+10, food.y*20+10, 8, 0, Math.PI*2); ctx.fill(); // Rundes Futter
    ctx.fillStyle = "#6f8f72"; snake.forEach(s => ctx.fillRect(s.x*20+1, s.y*20+1, 18, 18));
    document.getElementById('snake-score').innerText = "Score: " + snakeScore;
}

// FLAPPY BIRD
let birdY, birdV, pipes, flappyScore, flappyActive;
function startFlappy() {
    document.getElementById('flappy-start-btn').style.display = 'none';
    birdY = 160; birdV = 0; pipes = []; flappyScore = 0; flappyActive = true;
    let gap = diffMode === "easy" ? 160 : (diffMode === "medium" ? 130 : 100);
    clearInterval(gameInterval);
    gameInterval = setInterval(() => updateFlappy(gap), 25);
}
function flappyJump() { if(flappyActive) birdV = -5.5; }
function updateFlappy(gap) {
    birdV += 0.36; birdY += birdV;
    if(pipes.length === 0 || pipes[pipes.length-1].x < 160) {
        pipes.push({x: 320, top: Math.random() * (160) + 40});
    }
    const canvas = document.getElementById("flappyCanvas"); const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,320,400); 
    ctx.fillStyle = "#d79a73"; ctx.fillRect(50, birdY, 18, 18); // Vogel Farbe angepasst
    ctx.fillStyle = "#6f8f72";
    pipes.forEach(p => {
        p.x -= 2.5; ctx.fillRect(p.x, 0, 40, p.top); ctx.fillRect(p.x, p.top + gap, 40, 400);
        if(p.x < 68 && p.x > 12 && (birdY < p.top || birdY > p.top + gap - 18)) flappyActive = false;
        if(p.x === 25) { flappyScore++; document.getElementById('flappy-score').innerText = "Score: " + flappyScore; }
    });
    if(birdY > 400 || birdY < 0 || !flappyActive) {
        clearInterval(gameInterval); document.getElementById('flappy-start-btn').style.display = 'block';
        document.getElementById('flappy-score').innerText = "Game Over! Score: " + flappyScore;
    }
    pipes = pipes.filter(p => p.x > -40);
}

// TIC-TAC-TOE
let tttBoard = ["","","","","","","","",""], tttActive = true;
function resetTTT() {
    tttBoard = ["","","","","","","","",""]; tttActive = true;
    document.getElementById('ttt-status').innerText = "Du bist X. Starte!";
    document.querySelectorAll('.ttt-board .cell').forEach(c => { c.innerText = ""; c.style.color = "var(--text-color)"; });
}
function makeMove(i) {
    if(tttBoard[i] !== "" || !tttActive) return;
    tttBoard[i] = "X"; 
    let cell = document.querySelectorAll('.ttt-board .cell')[i];
    cell.innerText = "X"; cell.style.color = "var(--accent-color)";
    if(checkTTTWin("X")) { document.getElementById('ttt-status').innerText = "🎉 Du gewinnst!"; tttActive = false; return; }
    if(!tttBoard.includes("")) { document.getElementById('ttt-status').innerText = "Remis! 🤝"; return; }
    tttActive = false;
    setTimeout(botMove, 300);
}
function botMove() {
    if(!tttBoard.includes("")) return;
    let choice = -1;
    if(diffMode === "hard") {
        choice = findWinningMove("O");
        if(choice === -1) choice = findWinningMove("X");
    }
    if(choice === -1) {
        let frees = []; tttBoard.forEach((c,i) => { if(c==="") frees.push(i); });
        choice = frees[Math.floor(Math.random()*frees.length)];
    }
    tttBoard[choice] = "O"; 
    let cell = document.querySelectorAll('.ttt-board .cell')[choice];
    cell.innerText = "O"; cell.style.color = "#c27a5a";
    if(checkTTTWin("O")) { document.getElementById('ttt-status').innerText = "🤖 Bot gewinnt!"; }
    else if(!tttBoard.includes("")) { document.getElementById('ttt-status').innerText = "Remis! 🤝"; }
    else { tttActive = true; document.getElementById('ttt-status').innerText = "Deine Kugel..."; }
}
function findWinningMove(player) {
    let lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for(let l of lines) {
        let counts = l.map(idx => tttBoard[idx]);
        if(counts.filter(c => c === player).length === 2 && counts.filter(c => c === "").length === 1) {
            return l[counts.indexOf("")];
        }
    }
    return -1;
}
function checkTTTWin(p) {
    return [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].some(l => l.every(i => tttBoard[i]===p));
}

// REAKTIONSTEST
let reactTimer, reactStart, reactionGameRunning = false;
function initReaction() {
    clearTimeout(reactTimer); reactionGameRunning = false;
    const box = document.getElementById('reaction-box');
    box.classList.remove('ready'); box.innerText = "KLICK MICH ZUM STARTEN";
}
function clickReactionBox() {
    const box = document.getElementById('reaction-box');
    if(!reactionGameRunning && !box.classList.contains('ready')) {
        reactionGameRunning = true; box.innerText = "WARTE AUF GRÜN...";
        let delay = diffMode === "easy" ? 4000 : (diffMode === "medium" ? 2500 : 1200);
        reactTimer = setTimeout(() => { box.classList.add('ready'); box.innerText = "JETZT KLICKEN!"; reactStart = Date.now(); }, Math.random()*delay + 1000);
    } else if(box.classList.contains('ready')) {
        let diff = Date.now() - reactStart;
        document.getElementById('reaction-status').innerText = `Ergebnis: ${diff} ms!`;
        box.classList.remove('ready'); box.innerText = "BEREIT FÜR NEUEN START"; reactionGameRunning = false;
    } else {
        clearTimeout(reactTimer); reactionGameRunning = false; box.innerText = "ZU FRÜH!";
    }
}

// MEMORY
let flipped = [];
function initMemory() {
    let icons = ['🦊','🦁','🐯','🐵','🍏','🍕','💎','🚗','🎈','🎸','⚽','👾'];
    let count = diffMode === "easy" ? 6 : (diffMode === "medium" ? 8 : 12);
    let gameSet = [];
    for(let i=0; i<count; i++) { gameSet.push(icons[i]); gameSet.push(icons[i]); }
    gameSet.sort(() => 0.5 - Math.random());
    flipped = [];
    document.getElementById('memory-status').innerText = `Paare zu finden: ${count}`;
    document.getElementById('memory-board').innerHTML = gameSet.map(icon => `<div class="mem-card" data-icon="${icon}" onclick="flipCard(this)">${icon}</div>`).join('');
}
function flipCard(card) {
    if(flipped.length >= 2 || card.classList.contains('flipped')) return;
    card.classList.add('flipped'); flipped.push(card);
    if(flipped.length === 2) {
        if(flipped[0].dataset.icon === flipped[1].dataset.icon) {
            flipped = [];
            if(document.querySelectorAll('.mem-card:not(.flipped)').length === 0) document.getElementById('memory-status').innerText = "Gewonnen! 🎉";
        } else {
            setTimeout(() => { flipped.forEach(c => c.classList.remove('flipped')); flipped = []; }, 650);
        }
    }
}

// BLOCK BLAST
let blockBoard = [], blockPieces = [], selectedBlockPiece = null, blockScore = 0;
const blockShapes = [
    [[1]], [[1,1]], [[1],[1]], [[1,1,1]], [[1],[1],[1]],
    [[1,1],[1,1]], [[1,1,0],[0,1,1]], [[0,1,1],[1,1,0]],
    [[1,0],[1,0],[1,1]], [[0,1],[0,1],[1,1]], [[1,1,1],[0,1,0]],
    [[1,1,1],[1,0,0]], [[1,1,1],[0,0,1]]
];
function initBlockBlast() {
    blockBoard = Array.from({ length: 8 }, () => Array(8).fill(0));
    blockScore = 0;
    selectedBlockPiece = null;
    dealBlockPieces();
    renderBlockBlast();
}
function dealBlockPieces() {
    let pool = blockShapes.slice();
    if(diffMode === "easy") pool = pool.slice(0, 8);
    if(diffMode === "hard") pool = pool.slice(3);
    blockPieces = Array.from({ length: 3 }, () => ({
        shape: pool[Math.floor(Math.random() * pool.length)],
        used: false
    }));
}
function renderBlockBlast(message) {
    const board = document.getElementById('blockblast-board');
    board.innerHTML = "";
    for(let y = 0; y < 8; y++) {
        for(let x = 0; x < 8; x++) {
            const cell = document.createElement('button');
            cell.className = "block-cell" + (blockBoard[y][x] ? " filled" : "");
            cell.onclick = () => placeBlockPiece(x, y);
            board.appendChild(cell);
        }
    }

    const rack = document.getElementById('blockblast-pieces');
    rack.innerHTML = "";
    blockPieces.forEach((piece, index) => {
        const holder = document.createElement('button');
        holder.className = "block-piece" + (selectedBlockPiece === index ? " selected" : "") + (piece.used ? " used" : "");
        holder.onclick = () => selectBlockPiece(index);
        holder.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 18px)`;
        piece.shape.forEach(row => row.forEach(v => {
            const bit = document.createElement('span');
            bit.className = "piece-bit" + (v ? " filled" : "");
            holder.appendChild(bit);
        }));
        rack.appendChild(holder);
    });

    let status = message || `Score: ${blockScore}`;
    if(!canAnyBlockPieceFit()) status = `Game Over! Score: ${blockScore}`;
    document.getElementById('blockblast-status').innerText = status;
}
function selectBlockPiece(index) {
    if(blockPieces[index].used) return;
    selectedBlockPiece = selectedBlockPiece === index ? null : index;
    renderBlockBlast();
}
function placeBlockPiece(x, y) {
    if(selectedBlockPiece === null) return;
    const piece = blockPieces[selectedBlockPiece];
    if(piece.used || !canPlaceBlock(piece.shape, x, y)) {
        renderBlockBlast("Passt hier nicht.");
        return;
    }
    piece.shape.forEach((row, dy) => row.forEach((v, dx) => {
        if(v) blockBoard[y + dy][x + dx] = 1;
    }));
    blockScore += countShapeBlocks(piece.shape);
    piece.used = true;
    selectedBlockPiece = null;
    clearBlockLines();
    if(blockPieces.every(p => p.used)) dealBlockPieces();
    renderBlockBlast();
}
function canPlaceBlock(shape, x, y) {
    return shape.every((row, dy) => row.every((v, dx) => {
        if(!v) return true;
        return y + dy < 8 && x + dx < 8 && !blockBoard[y + dy][x + dx];
    }));
}
function clearBlockLines() {
    const rows = [], cols = [];
    for(let y = 0; y < 8; y++) if(blockBoard[y].every(Boolean)) rows.push(y);
    for(let x = 0; x < 8; x++) if(blockBoard.every(row => row[x])) cols.push(x);
    rows.forEach(y => blockBoard[y].fill(0));
    cols.forEach(x => blockBoard.forEach(row => row[x] = 0));
    if(rows.length || cols.length) blockScore += (rows.length + cols.length) * 10;
}
function canAnyBlockPieceFit() {
    return blockPieces.some(piece => !piece.used && blockBoard.some((row, y) => row.some((_, x) => canPlaceBlock(piece.shape, x, y))));
}
function countShapeBlocks(shape) {
    return shape.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
}

// YATZY
let dice = [1,1,1,1,1], keeps = [false,false,false,false,false], rollCount = 0;
let scorecard = {};
const categories = { ones:"Einser", twos:"Zweier", threes:"Dreier", fours:"Vierer", fives:"Fünfer", sixes:"Sechser", triple:"Dreierpasch", quad:"Viererpasch", fullhouse:"Full House (25)", pass:"Kleine Straße (30)", largepass:"Große Straße (40)", yatzy:"YATZY (50)", chance:"Chance" };
function initYatzy() { rollCount = 0; scorecard = {}; keeps.fill(false); document.getElementById('roll-btn').disabled = false; updateYatzyUI(); renderScorecard(); }
function updateYatzyUI() {
    document.getElementById('yatzy-status').innerText = `Wurf ${rollCount}/3`;
    const symbols = ["","⚀","⚁","⚂","⚃","⚄","⚅"];
    dice.forEach((val, i) => {
        let die = document.getElementById('dice-row').children[i];
        die.innerText = symbols[val];
        if(keeps[i]) die.classList.add('keep'); else die.classList.remove('keep');
    });
}
function toggleDie(i) { if(rollCount > 0) { keeps[i] = !keeps[i]; updateYatzyUI(); } }
function rollDice() {
    if(rollCount >= 3) return;
    rollCount++;
    for(let i=0; i<5; i++) { if(!keeps[i]) dice[i] = Math.floor(Math.random()*6)+1; }
    updateYatzyUI(); renderScorecard();
    if(rollCount === 3) document.getElementById('roll-btn').disabled = true;
}
function calculateCategoryScore(cat) {
    let counts = Array(7).fill(0); dice.forEach(d => counts[d]++);
    let sum = dice.reduce((a,b)=>a+b, 0);
    switch(cat) {
        case "ones": return counts[1]*1; case "twos": return counts[2]*2; case "threes": return counts[3]*3;
        case "fours": return counts[4]*4; case "fives": return counts[5]*5; case "sixes": return counts[6]*6;
        case "triple": return counts.some(c => c>=3) ? sum : 0;
        case "quad": return counts.some(c => c>=4) ? sum : 0;
        case "fullhouse": return (counts.includes(2) && counts.includes(3)) ? 25 : 0;
        case "chance": return sum;
        case "yatzy": return counts.includes(5) ? 50 : 0;
        case "pass": 
            let s1 = new Set(dice); return (s1.has(1)&&s1.has(2)&&s1.has(3)&&s1.has(4)) || (s1.has(2)&&s1.has(3)&&s1.has(4)&&s1.has(5)) || (s1.has(3)&&s1.has(4)&&s1.has(5)&&s1.has(6)) ? 30 : 0;
        case "largepass":
            let s2 = new Set(dice); return (s2.size === 5 && (!s2.has(1) || !s2.has(6))) ? 40 : 0;
    }
}
function renderScorecard() {
    let html = ""; let total = 0;
    for(let key in categories) {
        let isUsed = scorecard[key] !== undefined;
        let val = isUsed ? scorecard[key] : (rollCount > 0 ? calculateCategoryScore(key) : "-");
        html += `<div class="score-row ${isUsed?'used':''}" onclick="chooseCategory('${key}')"><span class="score-name">${categories[key]}</span><span class="score-val">${val}</span></div>`;
        if(isUsed) total += scorecard[key];
    }
    html += `<div class="score-row used" style="font-weight:bold; color: var(--text-color);"><span class="score-name">GESAMT:</span><span class="score-val">${total}</span></div>`;
    document.getElementById('yatzy-scorecard').innerHTML = html;
}
function chooseCategory(key) {
    if(rollCount === 0 || scorecard[key] !== undefined) return;
    scorecard[key] = calculateCategoryScore(key);
    rollCount = 0; keeps.fill(false);
    document.getElementById('roll-btn').disabled = false;
    if(Object.keys(scorecard).length === Object.keys(categories).length) { document.getElementById('yatzy-status').innerText = "Spiel beendet!"; } 
    else { updateYatzyUI(); renderScorecard(); }
}

// WEITERE LOGIKEN
let hlCurrent, hlScore;
function initHighLow() { hlCurrent = Math.floor(Math.random()*100)+1; hlScore = 0; document.getElementById('current-card-val').innerText = hlCurrent; document.getElementById('hl-score').innerText = "Score: 0"; }
function guessHighLow(g) {
    let nextNum = Math.floor(Math.random()*100)+1;
    if((g==='higher'&&nextNum>=hlCurrent) || (g==='lower'&&nextNum<=hlCurrent)) { hlScore++; hlCurrent = nextNum; document.getElementById('current-card-val').innerText = hlCurrent; document.getElementById('hl-score').innerText = "Richtig! Score: "+hlScore; }
    else document.getElementById('hl-score').innerText = `Falsch! Zahl war ${nextNum}. Game Over!`;
}
let guessTarget, maxGuessRange;
function initGuess() { maxGuessRange = diffMode === "easy" ? 50 : (diffMode === "medium" ? 100 : 250); guessTarget = Math.floor(Math.random()*maxGuessRange)+1; document.getElementById('guess-status').innerText = `Rate von 1 bis ${maxGuessRange}`; document.getElementById('guess-input').value = ""; }
function checkGuess() { let v = parseInt(document.getElementById('guess-input').value); if(v === guessTarget) document.getElementById('guess-status').innerText = "🎉 Gefunden!"; else if(v < guessTarget) document.getElementById('guess-status').innerText = "Höher! 📈"; else document.getElementById('guess-status').innerText = "Tiefer! 📉"; }

// COOKIE CLICKER (UPGRADED)
let clickerState = {
    cookies: 0,
    clickPower: 1,
    buildings: {
        clickPowerLvl: 0,
        cursor: 0,
        grandma: 0,
        bakery: 0,
        factory: 0
    }
};

const clickerUpgrades = {
    clickPowerLvl: { name: "Klick-Stärke", cost: 50, costMultiplier: 1.5, value: 1, isClickPower: true, icon: "⚡" },
    cursor: { name: "Zeiger", cost: 15, costMultiplier: 1.15, value: 0.5, isClickPower: false, icon: "🖱️" },
    grandma: { name: "Oma", cost: 100, costMultiplier: 1.15, value: 4, isClickPower: false, icon: "👵" },
    bakery: { name: "Bäckerei", cost: 1100, costMultiplier: 1.15, value: 32, isClickPower: false, icon: "🏪" },
    factory: { name: "Fabrik", cost: 12000, costMultiplier: 1.15, value: 260, isClickPower: false, icon: "🏭" }
};

let clickerSaveTimer = 0;

function initClicker() {
    const saved = localStorage.getItem("gamehub-clicker-state");
    if(saved) {
        try {
            clickerState = JSON.parse(saved);
        } catch(e) {
            console.error("Failed to parse clicker state", e);
        }
    } else {
        clickerState = {
            cookies: 0,
            clickPower: 1,
            buildings: {
                clickPowerLvl: 0,
                cursor: 0,
                grandma: 0,
                bakery: 0,
                factory: 0
            }
        };
    }

    if(!clickerState.buildings) clickerState.buildings = {};
    for (let key in clickerUpgrades) {
        if (clickerState.buildings[key] === undefined) {
            clickerState.buildings[key] = 0;
        }
    }
    if(clickerState.clickPower === undefined) clickerState.clickPower = 1;
    if(clickerState.cookies === undefined) clickerState.cookies = 0;

    const lastTime = Number(localStorage.getItem("gamehub-clicker-lasttime") || 0);
    const now = Date.now();
    const cps = calculateCPS();
    if(lastTime > 0 && cps > 0) {
        const elapsedSeconds = Math.max(0, (now - lastTime) / 1000);
        const produced = Math.floor(elapsedSeconds * cps);
        if(produced > 0) {
            clickerState.cookies += produced;
            saveClickerState();
            setTimeout(() => {
                alert(`Willkommen zurück! Deine Gebäude haben in deiner Abwesenheit ${produced.toLocaleString('de-DE')} Cookies gebacken! 🍪`);
            }, 300);
        }
    }

    clearInterval(clickerInterval);
    clickerInterval = setInterval(clickerTick, 100);
    clickerSaveTimer = 0;

    updateClickerUI();
}

function clickerTick() {
    const cps = calculateCPS();
    if(cps > 0) {
        clickerState.cookies += cps * 0.1;
        clickerSaveTimer += 100;
        if(clickerSaveTimer >= 5000) {
            saveClickerState();
            clickerSaveTimer = 0;
        }
        updateClickerUI(true);
    }
}

function calculateCPS() {
    let cps = 0;
    for(let key in clickerUpgrades) {
        const upgrade = clickerUpgrades[key];
        if(!upgrade.isClickPower) {
            const count = clickerState.buildings[key] || 0;
            cps += count * upgrade.value;
        }
    }
    return Math.round(cps * 10) / 10;
}

function getUpgradeCost(key) {
    const upgrade = clickerUpgrades[key];
    const count = clickerState.buildings[key] || 0;
    return Math.floor(upgrade.cost * Math.pow(upgrade.costMultiplier, count));
}

function clickCookie() {
    clickerState.cookies += clickerState.clickPower;
    saveClickerState();
    updateClickerUI(true);
    createFloatingText(`+${clickerState.clickPower}`);
}

function createFloatingText(text) {
    const wrapper = document.querySelector('.cookie-wrapper');
    if(!wrapper) return;
    const span = document.createElement('span');
    span.innerText = text;
    span.className = "floating-cookie-text";
    
    const x = Math.random() * 80 - 40;
    const y = Math.random() * 40 - 20;
    span.style.left = `calc(50% + ${x}px)`;
    span.style.top = `calc(50% + ${y}px)`;
    
    wrapper.appendChild(span);
    setTimeout(() => {
        span.remove();
    }, 800);
}

function buyUpgrade(key) {
    const cost = getUpgradeCost(key);
    if(clickerState.cookies >= cost) {
        clickerState.cookies -= cost;
        clickerState.buildings[key] = (clickerState.buildings[key] || 0) + 1;
        
        const upgrade = clickerUpgrades[key];
        if(upgrade.isClickPower) {
            clickerState.clickPower += upgrade.value;
        }
        
        saveClickerState();
        updateClickerUI();
    }
}

function saveClickerState() {
    localStorage.setItem("gamehub-clicker-state", JSON.stringify(clickerState));
    localStorage.setItem("gamehub-clicker-lasttime", Date.now().toString());
}

function resetClicker() {
    if(confirm("Möchtest du wirklich deinen gesamten Fortschritt zurücksetzen?")) {
        clickerState = {
            cookies: 0,
            clickPower: 1,
            buildings: {
                clickPowerLvl: 0,
                cursor: 0,
                grandma: 0,
                bakery: 0,
                factory: 0
            }
        };
        saveClickerState();
        updateClickerUI();
    }
}

function updateClickerUI(isTickOnly) {
    const scoreEl = document.getElementById('clicker-score');
    const cpsEl = document.getElementById('clicker-cps');
    if(!scoreEl || !cpsEl) return;

    const cps = calculateCPS();
    scoreEl.innerText = `Cookies: ${Math.floor(clickerState.cookies).toLocaleString('de-DE')}`;
    cpsEl.innerText = `${cps.toLocaleString('de-DE')} pro Sekunde | Klick: +${clickerState.clickPower}`;

    if(isTickOnly) {
        for(let key in clickerUpgrades) {
            const btn = document.getElementById(`shop-item-${key}`);
            if(btn) {
                const cost = getUpgradeCost(key);
                if(clickerState.cookies >= cost) {
                    btn.classList.remove('disabled');
                } else {
                    btn.classList.add('disabled');
                }
            }
        }
        return;
    }

    const shopEl = document.getElementById('clicker-shop');
    if(!shopEl) return;

    let html = `<div class="shop-title">Upgrades & Gebäude</div>`;
    for(let key in clickerUpgrades) {
        const upgrade = clickerUpgrades[key];
        const cost = getUpgradeCost(key);
        const count = clickerState.buildings[key] || 0;
        const isDisabled = clickerState.cookies < cost ? 'disabled' : '';
        
        let desc = "";
        if(upgrade.isClickPower) {
            desc = `+${upgrade.value} pro Klick`;
        } else {
            desc = `+${upgrade.value} Cookies/s`;
        }

        html += `
            <div class="shop-item ${isDisabled}" id="shop-item-${key}" onclick="buyUpgrade('${key}')">
                <div class="shop-item-info">
                    <span class="shop-item-name">${upgrade.icon} ${upgrade.name}</span>
                    <span class="shop-item-desc">${desc}</span>
                </div>
                <div class="shop-item-buy">
                    <span class="shop-item-cost">${cost.toLocaleString('de-DE')} 🍪</span>
                    <span class="shop-item-count">Besitz: ${count}</span>
                </div>
            </div>
        `;
    }
    shopEl.innerHTML = html;
}

function playRPS(p) { let options = ['✊', '✋', '✌️'], c = options[Math.floor(Math.random()*3)], res = ""; if(p === c) res = "Gleichstand!"; else if((p==='✊'&&c==='✌️') || (p==='✋'&&c==='✊') || (p==='✌️'&&c==='✋')) res = "Sieg! 🎉"; else res = "Niederlage! 🤖"; document.getElementById('rps-status').innerText = `Bot: ${c} -> ${res}`; }
let pool = ["CODE", "GAME", "OFFLINE", "ENGINE", "ARCADE", "PIXEL", "MOBILE"], word, guesses, lives;
function initHangman() { word = pool[Math.floor(Math.random()*wordPoolLength())]; guesses = []; lives = diffMode === "easy" ? 8 : (diffMode === "medium" ? 6 : 4); updateHangman(); document.getElementById('hangman-keyboard').innerHTML = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => `<button class="key-btn" onclick="guessLetter(this, '${l}')">${l}</button>`).join(""); }
function wordPoolLength() { return pool.length; }
function guessLetter(btn, l) { btn.disabled = true; guesses.push(l); if(!word.includes(l)) lives--; updateHangman(); }
function updateHangman() { let str = word.split("").map(l => guesses.includes(l)?l:"_").join(" "); document.getElementById('hangman-word').innerText = str; document.getElementById('hangman-status').innerText = "Leben übrig: " + lives; if(!str.includes("_")) document.getElementById('hangman-status').innerText = "Gewonnen! 🏆"; if(lives <= 0) document.getElementById('hangman-status').innerText = "Verloren! Wort war: " + word; }
