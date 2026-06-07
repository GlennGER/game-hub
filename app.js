let gameInterval;
let diffMode = "medium";
let chessLevel = "medium";
let chessBoard = [];
let chessTurn = 'w';
let chessSelected = null;
let chessStatus = '';
let chessLocked = false; // true while AI is thinking or move in progress
let chessAITimer = null;

function getHighscore(key, difficulty = diffMode) {
    return Number(localStorage.getItem("gamehub-highscore-" + key + "-" + difficulty) || 0);
}

function saveHighscore(key, score, difficulty = diffMode) {
    const best = getHighscore(key, difficulty);
    if (score > best) {
        localStorage.setItem("gamehub-highscore-" + key + "-" + difficulty, score);
        return true;
    }
    return false;
}

function getBestTime(key, difficulty = diffMode) {
    return Number(localStorage.getItem("gamehub-besttime-" + key + "-" + difficulty) || 0);
}

function saveBestTime(key, time, difficulty = diffMode) {
    const best = getBestTime(key, difficulty);
    if (!best || time < best) {
        localStorage.setItem("gamehub-besttime-" + key + "-" + difficulty, time);
        return true;
    }
    return false;
}

function scoreText(label, score, key, difficulty = diffMode) {
    return `${label}: ${score} | Highscore: ${getHighscore(key, difficulty)}`;
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
    if(activeSelect) {
        if(screenId === 'game-chess') activeSelect.value = chessLevel;
        else activeSelect.value = diffMode;
    }

    if(document.getElementById('snake-start-btn')) document.getElementById('snake-start-btn').style.display = 'block';
    if(document.getElementById('flappy-start-btn')) document.getElementById('flappy-start-btn').style.display = 'block';
    if(document.getElementById('traffic-start-btn')) document.getElementById('traffic-start-btn').style.display = 'block';

    if(screenId === 'game-tictactoe') resetTTT();
    if(screenId === 'game-memory') initMemory();
    if(screenId === 'game-blockblast') initBlockBlast();
    if(screenId === 'game-highlow') initHighLow();
    if(screenId === 'game-guess') initGuess();
    if(screenId === 'game-clicker') initClicker();
    if(screenId === 'game-reaction') initReaction();
    if(screenId === 'game-hangman') initHangman();
    if(screenId === 'game-yatzy') initYatzy();
    if(screenId === 'game-chess') initChess();
    if(screenId === 'game-minesweeper') initMinesweeper();
    if(screenId === 'game-traffic') initTraffic();
    if(screenId === 'main-menu') updateMenuHighscores();

    if(screenId === 'game-snake' || screenId === 'game-traffic') {
        const canvas = document.getElementById(screenId === 'game-snake' ? 'snakeCanvas' : 'trafficCanvas');
        if(canvas && !canvas._touchBound) {
            let tx = 0, ty = 0;
            canvas.addEventListener('touchstart', function(e){
                const t = e.touches[0]; tx = t.clientX; ty = t.clientY; e.preventDefault();
            }, {passive:false});
            canvas.addEventListener('touchend', function(e){
                const t = e.changedTouches[0]; const dx = t.clientX - tx; const dy = t.clientY - ty; const absX = Math.abs(dx); const absY = Math.abs(dy);
                if(Math.max(absX, absY) < 24) return;
                if(screenId === 'game-snake') {
                    if(absX > absY) { if(dx > 0) changeSnakeDir('RIGHT'); else changeSnakeDir('LEFT'); }
                    else { if(dy > 0) changeSnakeDir('DOWN'); else changeSnakeDir('UP'); }
                } else {
                    if(dx > 0) changeTrafficLane('RIGHT'); else changeTrafficLane('LEFT');
                }
                e.preventDefault();
            }, {passive:false});

            const mobileButtons = document.getElementById(screenId).querySelectorAll('.mobile-only .ctrl-btn');
            mobileButtons.forEach(btn => {
                if(btn._touchBound) return;
                btn.addEventListener('touchstart', function(ev){
                    ev.preventDefault();
                    this.classList.add('active');
                    const dir = this.dataset.dir;
                    if(!dir) return;
                    const activeScreen = document.querySelector('.screen.active')?.id;
                    if(activeScreen === 'game-snake') changeSnakeDir(dir);
                    else if(activeScreen === 'game-traffic') changeTrafficLane(dir);
                }, {passive:false});
                btn.addEventListener('touchend', function(ev){ ev.preventDefault(); this.classList.remove('active'); }, {passive:false});
                btn._touchBound = true;
            });
            canvas._touchBound = true;
        }
    }
}

function updateMenuHighscores() {
    // Intentionally left blank: highscores are shown inside each game screen only.
}

function liveDifficultyChange(value) {
    diffMode = value;
    const activeScreen = document.querySelector('.screen.active').id;
    if(activeScreen === 'game-snake' && document.getElementById('snake-start-btn').style.display === 'none') startSnake();
    if(activeScreen === 'game-flappy' && document.getElementById('flappy-start-btn').style.display === 'none') startFlappy();
    if(activeScreen === 'game-traffic' && document.getElementById('traffic-start-btn').style.display === 'none') startTraffic();
    if(activeScreen === 'game-memory') initMemory();
    if(activeScreen === 'game-blockblast') initBlockBlast();
    if(activeScreen === 'game-guess') initGuess();
    if(activeScreen === 'game-hangman') initHangman();
}

function liveChessLevelChange(value) {
    chessLevel = value;
    if(document.querySelector('.screen.active')?.id === 'game-chess') {
        renderChessBoard();
        if(chessLevel !== 'two' && chessTurn === 'b') setTimeout(() => aiMove(), 200);
    }
}

window.addEventListener("keydown", function(e) {
    const activeScreen = document.querySelector('.screen.active')?.id;
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.key || e.code)) {
        if(activeScreen === 'game-snake' || activeScreen === 'game-flappy' || activeScreen === 'game-traffic') e.preventDefault();
    }
    if(activeScreen === 'game-snake') {
        if(e.key === "ArrowUp") changeSnakeDir("UP");
        if(e.key === "ArrowDown") changeSnakeDir("DOWN");
        if(e.key === "ArrowLeft") changeSnakeDir("LEFT");
        if(e.key === "ArrowRight") changeSnakeDir("RIGHT");
    } else if(activeScreen === 'game-flappy') {
        if(e.code === "Space") flappyJump();
    } else if(activeScreen === 'game-traffic') {
        if(e.key === "ArrowLeft") changeTrafficLane("LEFT");
        if(e.key === "ArrowRight") changeTrafficLane("RIGHT");
        if(e.code === "Space") startTraffic();
    }
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
        const isNew = saveHighscore("snake", snakeScore);
        try { maybeAddHighscore("snake", snakeScore, false); } catch(e) { /* ignore */ }
        document.getElementById('snake-score').innerText = `💀 Score: ${snakeScore} | ${formatHighscoresAll('snake', false)}${isNew ? " 🆕" : ""}`;
        document.getElementById('snake-start-btn').style.display = 'block';
        updateMenuHighscores();
        clearInterval(gameInterval); return;
    }
    snake.unshift(head);
    if(head.x === food.x && head.y === food.y) { snakeScore++; generateFood(); } else { snake.pop(); }
    const ctx = document.getElementById("snakeCanvas").getContext("2d");
    ctx.fillStyle = "#fdf8ef"; ctx.fillRect(0,0,300,300);
    ctx.fillStyle = "#c27a5a"; ctx.beginPath(); ctx.arc(food.x*20+10, food.y*20+10, 8, 0, Math.PI*2); ctx.fill(); // Rundes Futter
    ctx.fillStyle = "#6f8f72"; snake.forEach(s => ctx.fillRect(s.x*20+1, s.y*20+1, 18, 18));
    document.getElementById('snake-score').innerText = `Score: ${snakeScore} | ${formatHighscoresAll('snake', false)}`;
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
        if(p.x === 25) { flappyScore++; document.getElementById('flappy-score').innerText = `Score: ${flappyScore} | ${formatHighscoresAll('flappy', false)}`; }
    });
    if(birdY > 400 || birdY < 0 || !flappyActive) {
        clearInterval(gameInterval); document.getElementById('flappy-start-btn').style.display = 'block';
        const isNew = saveHighscore("flappy", flappyScore);
        try { maybeAddHighscore("flappy", flappyScore, false); } catch(e) { /* ignore */ }
        document.getElementById('flappy-score').innerText = `Game Over! Score: ${flappyScore} | ${formatHighscoresAll('flappy', false)}${isNew ? " 🆕" : ""}`;
        updateMenuHighscores();
    }
    pipes = pipes.filter(p => p.x > -40);
}

// TRAFFIC GAME
let trafficCanvas, trafficCtx, trafficPlayer, trafficCars, trafficScore, trafficSpeed, trafficSpawnTimer, trafficActive;
const trafficLaneCount = 5;
const trafficRoadMargin = 18;
const trafficCarWidth = 42;
const trafficCarHeight = 90;

function initTraffic() {
    trafficCanvas = document.getElementById('trafficCanvas');
    trafficCtx = trafficCanvas.getContext('2d');
    trafficPlayer = {
        lane: 2,
        targetLane: 2,
        x: 0,
        y: trafficCanvas.height - trafficCarHeight - 18,
        width: trafficCarWidth,
        height: trafficCarHeight
    };
    trafficCars = [];
    trafficScore = 0;
    trafficSpeed = diffMode === 'easy' ? 1.8 : diffMode === 'medium' ? 3.2 : 4.6;
    trafficSpawnTimer = 0;
    trafficActive = false;
    document.getElementById('traffic-start-btn').style.display = 'block';
    document.getElementById('traffic-score').innerText = `Bereit? | ${formatHighscoresAll('traffic', false)}`;
    trafficPlayer.x = laneCenterX(trafficPlayer.lane);
    drawTraffic();
}

function startTraffic() {
    document.getElementById('traffic-start-btn').style.display = 'none';
    trafficPlayer.lane = 2;
    trafficPlayer.targetLane = 2;
    trafficPlayer.x = laneCenterX(trafficPlayer.lane);
    trafficCars = [];
    trafficScore = 0;
    trafficActive = true;
    trafficSpawnTimer = 0;
    trafficSpeed = diffMode === 'easy' ? 1.8 : diffMode === 'medium' ? 3.2 : 4.6;
    clearInterval(gameInterval);
    gameInterval = setInterval(updateTraffic, 28);
    updateTrafficScore();
}

function changeTrafficLane(direction) {
    if(!trafficActive) return;
    if(direction === 'LEFT' && trafficPlayer.targetLane > 0) trafficPlayer.targetLane--;
    if(direction === 'RIGHT' && trafficPlayer.targetLane < trafficLaneCount - 1) trafficPlayer.targetLane++;
}

function updateTraffic() {
    if(!trafficActive) return;
    trafficSpawnTimer += 1;
    const speedBase = diffMode === 'easy' ? 1.8 : diffMode === 'medium' ? 3.2 : 4.6;
    const speedRamp = diffMode === 'easy' ? 0.025 : diffMode === 'medium' ? 0.045 : 0.08;
    trafficSpeed = speedBase + trafficScore * speedRamp;

    const spawnThreshold = diffMode === 'easy'
        ? Math.max(70, 110 - trafficScore * 0.5)
        : diffMode === 'medium'
            ? Math.max(44, 84 - trafficScore * 0.8)
            : Math.max(24, 58 - trafficScore * 1.0);

    if(trafficSpawnTimer > spawnThreshold) {
        trafficSpawnTimer = 0;
        spawnTrafficCar();
    }

    for(const car of trafficCars) {
        car.y += trafficSpeed;
    }
    trafficCars = trafficCars.filter(car => car.y < trafficCanvas.height + trafficCarHeight);

    const targetX = laneCenterX(trafficPlayer.targetLane);
    if(trafficPlayer.x < targetX) trafficPlayer.x = Math.min(targetX, trafficPlayer.x + 7);
    if(trafficPlayer.x > targetX) trafficPlayer.x = Math.max(targetX, trafficPlayer.x - 7);

    if(checkTrafficCollision()) {
        trafficGameOver();
        return;
    }
    trafficCars.forEach(car => {
        if(!car.counted && car.y > trafficPlayer.y + trafficPlayer.height) {
            car.counted = true;
            trafficScore += 1;
            updateTrafficScore();
        }
    });
    drawTraffic();
}

function spawnTrafficCar() {
    const lanes = [0, 1, 2, 3, 4];
    const blocked = new Set(
        trafficCars
            .filter(c => c.y > -trafficCarHeight && c.y < trafficPlayer.y + trafficCarHeight * 0.4)
            .map(c => c.lane)
    );
    const options = lanes.filter(l => !blocked.has(l));
    if(options.length === 0) {
        // Avoid full blockage: wait until one lane clears.
        return;
    }
    const lane = options[Math.floor(Math.random() * options.length)];
    trafficCars.push({ lane, y: -trafficCarHeight - Math.random() * 120, color: '#c27a5a', counted: false });
}

function laneCenterX(lane) {
    const laneWidth = (trafficCanvas.width - trafficRoadMargin * 2) / trafficLaneCount;
    return trafficRoadMargin + laneWidth * lane + (laneWidth - trafficCarWidth) / 2;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}

function drawCar(ctx, x, y, width, height, bodyColor, roofColor, headlightColor) {
    ctx.fillStyle = bodyColor;
    drawRoundedRect(ctx, x, y, width, height, Math.round(width * 0.18));

    ctx.fillStyle = roofColor;
    drawRoundedRect(ctx, x + width * 0.12, y + height * 0.08, width * 0.76, height * 0.32, Math.round(width * 0.14));

    ctx.fillStyle = '#2a2f34';
    ctx.fillRect(x + width * 0.14, y + height * 0.52, width * 0.72, height * 0.18);

    ctx.fillStyle = headlightColor;
    ctx.fillRect(x + 4, y + height * 0.58, width * 0.14, height * 0.12);
    ctx.fillRect(x + width - 4 - width * 0.14, y + height * 0.58, width * 0.14, height * 0.12);

    ctx.fillStyle = '#333';
    ctx.fillRect(x + width * 0.12, y + height - 12, width * 0.22, 8);
    ctx.fillRect(x + width * 0.66, y + height - 12, width * 0.22, 8);

    ctx.fillStyle = '#111';
    const wheelSize = Math.round(width * 0.18);
    ctx.beginPath();
    ctx.arc(x + width * 0.2, y + height - 8, wheelSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + width * 0.8, y + height - 8, wheelSize / 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawTraffic() {
    const ctx = trafficCtx;
    ctx.clearRect(0, 0, trafficCanvas.width, trafficCanvas.height);
    const gradient = ctx.createLinearGradient(0, 0, 0, trafficCanvas.height);
    gradient.addColorStop(0, '#4c5b66');
    gradient.addColorStop(0.35, '#333f47');
    gradient.addColorStop(1, '#1b1f22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, trafficCanvas.width, trafficCanvas.height);

    const roadWidth = trafficCanvas.width - trafficRoadMargin * 2;
    const laneWidth = roadWidth / trafficLaneCount;
    ctx.fillStyle = '#2c343b';
    ctx.fillRect(trafficRoadMargin, 0, roadWidth, trafficCanvas.height);
    ctx.strokeStyle = '#7e8b97';
    ctx.lineWidth = 2;
    ctx.strokeRect(trafficRoadMargin, 0, roadWidth, trafficCanvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    for(let i=1;i<trafficLaneCount;i++) {
        ctx.setLineDash([16, 14]);
        ctx.beginPath();
        ctx.moveTo(trafficRoadMargin + i*laneWidth, 0);
        ctx.lineTo(trafficRoadMargin + i*laneWidth, trafficCanvas.height);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = '#c2c7ca';
    for(let y=0; y<trafficCanvas.height; y += 60) {
        ctx.fillRect(trafficCanvas.width/2 - 4, y, 8, 32);
    }

    // Draw traffic cars
    trafficCars.forEach(car => {
        const x = laneCenterX(car.lane);
        drawCar(ctx, x, car.y, trafficCarWidth, trafficCarHeight, car.color, '#9aa3af', '#fdf7e9');
    });

    // Draw player car
    const px = trafficPlayer.x;
    drawCar(ctx, px, trafficPlayer.y, trafficPlayer.width, trafficPlayer.height, '#8fae87', '#d6e3d7', '#fff9c8');
}

function checkTrafficCollision() {
    const playerRect = {
        x: trafficPlayer.x + 4,
        y: trafficPlayer.y + 10,
        width: trafficPlayer.width - 8,
        height: trafficPlayer.height - 20
    };
    return trafficCars.some(car => {
        const carX = laneCenterX(car.lane);
        const carRect = {
            x: carX + 4,
            y: car.y + 6,
            width: trafficCarWidth - 8,
            height: trafficCarHeight - 12
        };
        return playerRect.x < carRect.x + carRect.width &&
               playerRect.x + playerRect.width > carRect.x &&
               playerRect.y < carRect.y + carRect.height &&
               playerRect.y + playerRect.height > carRect.y;
    });
}

function trafficGameOver() {
    trafficActive = false;
    clearInterval(gameInterval);
    document.getElementById('traffic-start-btn').style.display = 'block';
    const isNew = saveHighscore('traffic', trafficScore);
    document.getElementById('traffic-score').innerText = `Game Over! Score: ${trafficScore} | ${formatHighscoresAll('traffic', false)}${isNew ? ' 🆕' : ''}`;
    maybeAddHighscore('traffic', trafficScore, false);
}

function updateTrafficScore() {
    document.getElementById('traffic-score').innerText = `Score: ${trafficScore} | ${formatHighscoresAll('traffic', false)}`;
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
        reactTimer = setTimeout(() => { box.classList.add('ready'); box.innerText = "JETZT KLICKEN!"; reactStart = Date.now(); }, Math.random()*2500 + 1000);
    } else if(box.classList.contains('ready')) {
        let diff = Date.now() - reactStart;
        const isNew = saveBestTime("reaction", diff, 'default');
        try { maybeAddHighscore("reaction", diff, true, 'default'); } catch(e) { /* ignore */ }
        document.getElementById('reaction-status').innerText = `Ergebnis: ${diff} ms! | ${formatBestTimeSingle('reaction')}${isNew ? " 🆕" : ""}`;
        box.classList.remove('ready'); box.innerText = "BEREIT FÜR NEUEN START"; reactionGameRunning = false;
        updateMenuHighscores();
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
    const board = document.getElementById('memory-board');
    const cols = Math.ceil(Math.sqrt(gameSet.length));
    board.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    document.getElementById('memory-status').innerText = `Paare zu finden: ${count}`;
    board.innerHTML = gameSet.map(icon => `<div class="mem-card" data-icon="${icon}" onclick="flipCard(this)">${icon}</div>`).join('');
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
let blockDrag = { pieceIndex: null, hoverX: null, hoverY: null };
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
    const previewCells = new Set();
    let previewInvalid = false;
    if(blockDrag.pieceIndex !== null && blockDrag.hoverX !== null && blockDrag.hoverY !== null) {
        const shape = blockPieces[blockDrag.pieceIndex].shape;
        if(shape) {
            previewInvalid = !canPlaceBlock(shape, blockDrag.hoverX, blockDrag.hoverY);
            shape.forEach((row, dy) => row.forEach((v, dx) => {
                if(v) {
                    const prettyX = blockDrag.hoverX + dx;
                    const prettyY = blockDrag.hoverY + dy;
                    previewCells.add(`${prettyX},${prettyY}`);
                }
            }));
        }
    }
    for(let y = 0; y < 8; y++) {
        for(let x = 0; x < 8; x++) {
            const cell = document.createElement('button');
            const isPreview = previewCells.has(`${x},${y}`);
            let previewClass = "";
            if(isPreview) previewClass = previewInvalid ? " invalid" : " preview";
            cell.className = "block-cell" + (blockBoard[y][x] ? " filled" : "") + previewClass;
            cell.dataset.x = x; cell.dataset.y = y;
            cell.onpointerup = () => {
                placeBlockPiece(x, y);
                blockDrag.pieceIndex = null;
                blockDrag.hoverX = null;
                blockDrag.hoverY = null;
            };
            cell.onpointerenter = () => {
                if(blockDrag.pieceIndex !== null) {
                    selectedBlockPiece = blockDrag.pieceIndex;
                    blockDrag.hoverX = x;
                    blockDrag.hoverY = y;
                    renderBlockBlast();
                }
            };
            board.appendChild(cell);
        }
    }
    board.onpointerleave = () => {
        if(blockDrag.pieceIndex !== null) {
            blockDrag.hoverX = null;
            blockDrag.hoverY = null;
            renderBlockBlast();
        }
    };

    const rack = document.getElementById('blockblast-pieces');
    rack.innerHTML = "";
    blockPieces.forEach((piece, index) => {
        const holder = document.createElement('button');
        holder.className = "block-piece" + (selectedBlockPiece === index ? " selected" : "") + (piece.used ? " used" : "") + (blockDrag.pieceIndex === index ? " dragging" : "");
        holder.dataset.index = index;
        holder.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 18px)`;
        holder.onpointerdown = (e) => {
            if(piece.used) return;
            selectedBlockPiece = index;
            blockDrag.pieceIndex = index;
            blockDrag.hoverX = null;
            blockDrag.hoverY = null;
            e.preventDefault();
            renderBlockBlast();
        };
        holder.onpointerup = () => {
            blockDrag.pieceIndex = null;
            blockDrag.hoverX = null;
            blockDrag.hoverY = null;
            renderBlockBlast();
        };
        holder.onpointerleave = () => {
            if(blockDrag.pieceIndex === index) {
                holder.classList.add('dragging');
            }
        };
        piece.shape.forEach(row => row.forEach(v => {
            const bit = document.createElement('span');
            bit.className = "piece-bit" + (v ? " filled" : "");
            holder.appendChild(bit);
        }));
        rack.appendChild(holder);
    });

    let status = message || `Score: ${blockScore} | ${formatHighscoresAll('blockblast', false)}`;
    if(!canAnyBlockPieceFit()) {
        const isNew = saveHighscore("blockblast", blockScore);
        try { maybeAddHighscore("blockblast", blockScore, false); } catch(e) { /* ignore */ }
        status = `Game Over! Score: ${blockScore} | ${formatHighscoresAll('blockblast', false)}${isNew ? " 🆕" : ""}`;
        updateMenuHighscores();
    }
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
    blockDrag.pieceIndex = null;
    blockDrag.hoverX = null;
    blockDrag.hoverY = null;
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
    if(Object.keys(scorecard).length === Object.keys(categories).length) {
        const total = Object.values(scorecard).reduce((a,b)=>a+b,0);
        const isNew = saveGlobalHighscore("yatzy", total);
        try { maybeAddHighscore("yatzy", total, false, 'default'); } catch(e) { /* ignore */ }
        document.getElementById('yatzy-status').innerText = `Spiel beendet! Total: ${total} | ${formatHighscoreSingle('yatzy')}${isNew ? " 🆕" : ""}`;
        updateMenuHighscores();
    }
    else { updateYatzyUI(); renderScorecard(); }
}

// WEITERE LOGIKEN
let hlCurrent, hlScore;
function initHighLow() { hlCurrent = Math.floor(Math.random()*100)+1; hlScore = 0; document.getElementById('current-card-val').innerText = hlCurrent; document.getElementById('hl-score').innerText = `Score: 0 | ${formatHighscoreSingle('highlow')}`; }
function guessHighLow(g) {
    let nextNum = Math.floor(Math.random()*100)+1;
    if((g==='higher'&&nextNum>=hlCurrent) || (g==='lower'&&nextNum<=hlCurrent)) {
        hlScore++; hlCurrent = nextNum;
        document.getElementById('current-card-val').innerText = hlCurrent;
        document.getElementById('hl-score').innerText = `Richtig! Score: ${hlScore} | ${formatHighscoreSingle('highlow')}`;
    } else {
        const isNew = saveGlobalHighscore("highlow", hlScore);
        try { maybeAddHighscore("highlow", hlScore, false, 'default'); } catch(e) { /* ignore */ }
        document.getElementById('hl-score').innerText = `Falsch! Zahl war ${nextNum}. Game Over! Score: ${hlScore} | ${formatHighscoreSingle('highlow')}${isNew ? " 🆕" : ""}`;
        updateMenuHighscores();
    }
}
let guessTarget, maxGuessRange;
function initGuess() { maxGuessRange = diffMode === "easy" ? 50 : (diffMode === "medium" ? 100 : 250); guessTarget = Math.floor(Math.random()*maxGuessRange)+1; document.getElementById('guess-status').innerText = `Rate von 1 bis ${maxGuessRange}`; document.getElementById('guess-input').value = ""; }
function checkGuess() { let v = parseInt(document.getElementById('guess-input').value); if(v === guessTarget) document.getElementById('guess-status').innerText = "🎉 Gefunden!"; else if(v < guessTarget) document.getElementById('guess-status').innerText = "Höher! 📈"; else document.getElementById('guess-status').innerText = "Tiefer! 📉"; }

// COOKIE CLICKER (UPGRADED)
let clickerState = {
    cookies: 0,
    clickPower: 1,
    buildings: {}
};

const clickerUpgrades = {
    clickPowerLvl: { name: "Klick-Stärke", cost: 50, costMultiplier: 1.5, value: 1, isClickPower: true, icon: "⚡" },
    cursor: { name: "Zeiger", cost: 15, costMultiplier: 1.15, value: 0.5, isClickPower: false, icon: "🖱️" },
    grandma: { name: "Oma", cost: 100, costMultiplier: 1.15, value: 4, isClickPower: false, icon: "👵" },
    bakery: { name: "Bäckerei", cost: 1100, costMultiplier: 1.15, value: 32, isClickPower: false, icon: "🏪" },
    factory: { name: "Fabrik", cost: 12000, costMultiplier: 1.15, value: 260, isClickPower: false, icon: "🏭" },
    farm: { name: "Bauernhof", cost: 25000, costMultiplier: 1.14, value: 140, isClickPower: false, icon: "🌾" },
    mine: { name: "Mine", cost: 140000, costMultiplier: 1.13, value: 800, isClickPower: false, icon: "⛏️" },
    lab: { name: "Labor", cost: 560000, costMultiplier: 1.12, value: 3500, isClickPower: false, icon: "🧪" },
    mall: { name: "Einkaufszentrum", cost: 2600000, costMultiplier: 1.12, value: 16000, isClickPower: false, icon: "🏬" },
    portal: { name: "Portal", cost: 12000000, costMultiplier: 1.11, value: 82000, isClickPower: false, icon: "🌀" },
    robot: { name: "Roboter", cost: 72000000, costMultiplier: 1.11, value: 420000, isClickPower: false, icon: "🤖" },
    server: { name: "Serverfarm", cost: 320000000, costMultiplier: 1.10, value: 2300000, isClickPower: false, icon: "💾" },
    station: { name: "Raumstation", cost: 1200000000, costMultiplier: 1.10, value: 12000000, isClickPower: false, icon: "🚀" },
    observatory: { name: "Observatorium", cost: 5500000000, costMultiplier: 1.09, value: 62000000, isClickPower: false, icon: "🔭" },
    universe: { name: "Universum", cost: 24000000000, costMultiplier: 1.09, value: 320000000, isClickPower: false, icon: "🌌" }
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
            buildings: {}
        };
        for (let key in clickerUpgrades) {
            clickerState.buildings[key] = 0;
        }
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

function getPieceColor(piece) {
    if(!piece) return null;
    return piece === piece.toUpperCase() ? 'w' : 'b';
}
function isWhitePiece(piece) { return piece && piece === piece.toUpperCase(); }
function isBlackPiece(piece) { return piece && piece === piece.toLowerCase(); }
function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
function cloneBoard(board) { return board.map(row => row.slice()); }
function chessPieceIcon(piece) {
    return {
        P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔',
        p: '♟︎', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚'
    }[piece] || '';
}
function initChess() {
    if(chessAITimer) {
        clearTimeout(chessAITimer);
        chessAITimer = null;
    }
    chessLocked = false;
    chessBoard = [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R']
    ];
    chessTurn = 'w';
    chessSelected = null;
    chessStatus = 'Weiß am Zug';
    renderChessBoard();
}
function resetChess() { initChess(); }
function updateChessStatus() {
    const whiteKing = chessBoard.some(row => row.includes('K'));
    const blackKing = chessBoard.some(row => row.includes('k'));
    if(!whiteKing) {
        chessStatus = 'Game over: Schwarz gewinnt!';
        return;
    }
    if(!blackKing) {
        chessStatus = 'Glückwunsch! Weiß gewinnt!';
        return;
    }
    const moves = chessTurn === 'w' ? getAllMoves('w', chessBoard) : getAllMoves('b', chessBoard);
    const inCheck = isInCheck(chessTurn, chessBoard);
    if(moves.length === 0) {
        if(inCheck) {
            chessStatus = chessTurn === 'w' ? 'Schachmatt! Schwarz gewinnt!' : 'Schachmatt! Weiß gewinnt!';
        } else {
            chessStatus = 'Patt! Unentschieden!';
        }
        return;
    }
    if(inCheck) {
        chessStatus = chessTurn === 'w' ? 'Weiß ist im Schach' : (chessLevel === 'two' ? 'Schwarz ist im Schach' : 'Bot ist im Schach');
    } else {
        chessStatus = chessTurn === 'w' ? 'Weiß am Zug' : (chessLevel === 'two' ? 'Schwarz am Zug' : 'Bot zieht...');
    }
    chessStatus += ` | Modus: ${chessLevel === 'two' ? '2 Spieler' : (chessLevel.charAt(0).toUpperCase() + chessLevel.slice(1))}`;
}
function renderChessBoard() {
    const boardEl = document.getElementById('chess-board');
    if(!boardEl) return;
    const possible = chessSelected ? getLegalMoves(chessSelected.r, chessSelected.c, chessBoard) : [];
    let html = '';
    chessBoard.forEach((row, r) => {
        row.forEach((piece, c) => {
            const isSelected = chessSelected && chessSelected.r === r && chessSelected.c === c;
            const isTarget = possible.some(m => m.r === r && m.c === c);
            const colorClass = ((r + c) % 2 === 0) ? 'white' : 'black';
            let content = '';
            if(piece) {
                const side = getPieceColor(piece);
                content = `<span class="piece ${side === 'w' ? 'white-piece' : 'black-piece'}">${chessPieceIcon(piece)}</span>`;
            }
            html += `<div class="chess-cell ${colorClass}${isSelected ? ' selected' : ''}${isTarget ? ' move-target' : ''}" onclick="selectChessCell(${r}, ${c})">${content}</div>`;
        });
    });
    boardEl.innerHTML = html;
    updateChessStatus();
    document.getElementById('chess-status').innerText = chessStatus;
}
function selectChessCell(r, c) {
    // block input when AI is thinking or when it's not the human's turn in AI modes
    if(chessLocked) return;
    if(chessLevel !== 'two' && chessTurn !== 'w') return;
    const piece = chessBoard[r][c];
    // if something selected, attempt move
    if(chessSelected) {
        const legal = getLegalMoves(chessSelected.r, chessSelected.c, chessBoard);
        const target = legal.find(move => move.r === r && move.c === c);
        if(target) {
            makeChessMove(chessSelected, target);
            return;
        }
        // if clicked another own-piece, change selection
        if(getPieceColor(piece) === chessTurn) {
            chessSelected = { r, c };
            renderChessBoard();
            return;
        }
        chessSelected = null;
        renderChessBoard();
        return;
    }
    // select only if piece belongs to current player
    if(getPieceColor(piece) === chessTurn) {
        chessSelected = { r, c };
        renderChessBoard();
    }
}
function makeChessMove(from, to) {
    const piece = chessBoard[from.r][from.c];
    if(!piece) return;
    chessBoard[to.r][to.c] = piece;
    chessBoard[from.r][from.c] = '';
    if(piece.toLowerCase() === 'p' && (to.r === 0 || to.r === 7)) {
        chessBoard[to.r][to.c] = piece === piece.toUpperCase() ? 'Q' : 'q';
    }
    chessSelected = null;
    // switch turn
    chessTurn = chessTurn === 'w' ? 'b' : 'w';
    renderChessBoard();
    // if playing against AI and it's AI's turn, trigger AI
    if(chessLevel !== 'two' && chessTurn === 'b') {
        setTimeout(() => { aiMove(); }, 250);
    }
}
function aiMove() {
    chessLocked = true;
    if(!chessBoard.some(row => row.includes('k')) || !chessBoard.some(row => row.includes('K'))) {
        renderChessBoard();
        chessLocked = false;
        return;
    }
    const moves = getAllMoves('b', chessBoard);
    if(moves.length === 0) {
        chessStatus = 'Unentschieden!';
        renderChessBoard();
        chessLocked = false;
        if(chessAITimer) { clearTimeout(chessAITimer); chessAITimer = null; }
        return;
    }
    chessStatus = 'Bot denkt...';
    renderChessBoard();
    chessAITimer = setTimeout(() => {
        let choice;
        if(chessLevel === 'easy') {
            choice = moves[Math.floor(Math.random() * moves.length)];
        } else {
            choice = chooseBestCaptureOrRandomMove(moves);
        }
        if(!choice) choice = moves[Math.floor(Math.random() * moves.length)];
        applyAIMove(choice);
        chessLocked = false;
        chessAITimer = null;
    }, 70);
}
function applyAIMove(move) {
    if(!move) return;
    const piece = chessBoard[move.from.r][move.from.c];
    chessBoard[move.to.r][move.to.c] = piece;
    chessBoard[move.from.r][move.from.c] = '';
    if(piece.toLowerCase() === 'p' && (move.to.r === 0 || move.to.r === 7)) {
        chessBoard[move.to.r][move.to.c] = piece === piece.toUpperCase() ? 'Q' : 'q';
    }
    chessTurn = 'w';
    chessSelected = null;
    renderChessBoard();
}
function getAllMoves(color, board) {
    const moves = [];
    board.forEach((row, r) => row.forEach((piece, c) => {
        if(!piece) return;
        if(getPieceColor(piece) !== color) return;
        const legal = getLegalMoves(r, c, board);
        legal.forEach(move => {
            moves.push({ from: { r, c }, to: move, captured: !!board[move.r][move.c] });
        });
    }));
    return moves;
}
function getLegalMoves(r, c, board) {
    const piece = board[r][c];
    if(!piece) return [];
    const color = getPieceColor(piece);
    const enemy = color === 'w' ? isBlackPiece : isWhitePiece;
    const ally = color === 'w' ? isWhitePiece : isBlackPiece;
    const rawMoves = [];
    const addMove = (nr, nc) => {
        if(!inBounds(nr, nc) || ally(board[nr][nc])) return false;
        rawMoves.push({ r: nr, c: nc });
        return !board[nr][nc];
    };
    const addStep = (dr, dc) => {
        let nr = r + dr, nc = c + dc;
        while(inBounds(nr, nc)) {
            if(!addMove(nr, nc)) break;
            nr += dr; nc += dc;
        }
    };
    const lower = piece.toLowerCase();
    if(lower === 'p') {
        const dir = color === 'w' ? -1 : 1;
        if(inBounds(r + dir, c) && !board[r + dir][c]) rawMoves.push({ r: r + dir, c });
        if((color === 'w' && r === 6 || color === 'b' && r === 1) && inBounds(r + dir * 2, c) && !board[r + dir][c] && !board[r + dir * 2][c]) {
            rawMoves.push({ r: r + dir * 2, c });
        }
        for(const dc of [-1, 1]) {
            const nr = r + dir, nc = c + dc;
            if(inBounds(nr, nc) && enemy(board[nr][nc])) rawMoves.push({ r: nr, c: nc });
        }
    } else if(lower === 'n') {
        [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => addMove(r + dr, c + dc));
    } else if(lower === 'b') {
        [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr, dc]) => addStep(dr, dc));
    } else if(lower === 'r') {
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr, dc]) => addStep(dr, dc));
    } else if(lower === 'q') {
        [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr, dc]) => addStep(dr, dc));
    } else if(lower === 'k') {
        [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr, dc]) => addMove(r + dr, c + dc));
    }
    return rawMoves.filter(move => {
        const copy = cloneBoard(board);
        const moved = copy[r][c];
        copy[move.r][move.c] = moved;
        copy[r][c] = '';
        if(moved.toLowerCase() === 'p' && (move.r === 0 || move.r === 7)) {
            copy[move.r][move.c] = moved === moved.toUpperCase() ? 'Q' : 'q';
        }
        return !isInCheck(color, copy);
    });
}

function findKing(color, board) {
    const target = color === 'w' ? 'K' : 'k';
    for(let r = 0; r < 8; r++) {
        for(let c = 0; c < 8; c++) {
            if(board[r][c] === target) return { r, c };
        }
    }
    return null;
}

function isSquareAttacked(r, c, byColor, board) {
    const enemyPawn = byColor === 'w' ? 'P' : 'p';
    const pawnDir = byColor === 'w' ? -1 : 1;
    const pawnRows = [{r:r - pawnDir, c: c-1}, {r:r - pawnDir, c: c+1}];
    for(const pos of pawnRows) {
        if(inBounds(pos.r, pos.c) && board[pos.r][pos.c] === enemyPawn) return true;
    }
    const knightOffsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for(const [dr, dc] of knightOffsets) {
        const nr = r + dr, nc = c + dc;
        if(inBounds(nr, nc) && board[nr][nc] === (byColor === 'w' ? 'N' : 'n')) return true;
    }
    const directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    for(const [dr, dc] of directions) {
        let nr = r + dr, nc = c + dc;
        let distance = 1;
        while(inBounds(nr, nc)) {
            const piece = board[nr][nc];
            if(piece) {
                const expected = byColor === 'w' ? piece === piece.toUpperCase() : piece === piece.toLowerCase();
                if(expected) {
                    const lower = piece.toLowerCase();
                    if(distance === 1 && lower === 'k') return true;
                    if(lower === 'q') return true;
                    if((lower === 'b' || lower === 'q') && Math.abs(dr) === Math.abs(dc)) return true;
                    if((lower === 'r' || lower === 'q') && (dr === 0 || dc === 0)) return true;
                }
                break;
            }
            nr += dr; nc += dc; distance++;
        }
    }
    return false;
}

function isInCheck(color, board) {
    const king = findKing(color, board);
    if(!king) return false;
    const attacker = color === 'w' ? 'b' : 'w';
    return isSquareAttacked(king.r, king.c, attacker, board);
}

// On load: show existing highscores on menu cards
const HIGHSCORE_LIMIT = 10;

function evaluateBoard(board) {
    const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 50 };
    let score = 0;
    board.forEach(row => {
        row.forEach(piece => {
            if(!piece) return;
            const v = values[piece.toLowerCase()] || 0;
            // positive = advantage for black
            score += piece === piece.toLowerCase() ? v : -v;
        });
    });
    return score;
}

function minimax(board, depth, maximizing) {
    const whiteKing = board.some(row => row.includes('K'));
    const blackKing = board.some(row => row.includes('k'));
    if(!whiteKing) return 10000;
    if(!blackKing) return -10000;
    if(depth === 0) return evaluateBoard(board);
    const color = maximizing ? 'b' : 'w';
    const moves = getAllMoves(color, board);
    if(moves.length === 0) return evaluateBoard(board);
    if(maximizing) {
        let best = -Infinity;
        for(const mv of moves) {
            const copy = cloneBoard(board);
            applyMoveOnBoard(copy, mv);
            best = Math.max(best, minimax(copy, depth - 1, false));
        }
        return best;
    } else {
        let best = Infinity;
        for(const mv of moves) {
            const copy = cloneBoard(board);
            applyMoveOnBoard(copy, mv);
            best = Math.min(best, minimax(copy, depth - 1, true));
        }
        return best;
    }
}

function chooseBestAIMove(moves, depth) {
    let best = null; let bestScore = -Infinity;
    for(const mv of moves) {
        const copy = cloneBoard(chessBoard);
        applyMoveOnBoard(copy, mv);
        const sc = minimax(copy, depth - 1, false);
        if(sc > bestScore) { bestScore = sc; best = mv; }
    }
    return best;
}

function chooseBestCaptureOrRandomMove(moves) {
    const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
    let best = [];
    let bestValue = -1;
    for(const mv of moves) {
        const target = chessBoard[mv.to.r][mv.to.c];
        const value = target ? values[target.toLowerCase()] : 0;
        if(value > bestValue) {
            bestValue = value;
            best = [mv];
        } else if(value === bestValue) {
            best.push(mv);
        }
    }
    if(bestValue > 0) return best[Math.floor(Math.random() * best.length)];
    return moves[Math.floor(Math.random() * moves.length)];
}

function chooseBestMaterialMove(moves) {
    let best = null;
    let bestScore = -Infinity;
    for(const mv of moves) {
        const copy = cloneBoard(chessBoard);
        applyMoveOnBoard(copy, mv);
        const sc = evaluateBoard(copy);
        if(sc > bestScore) {
            bestScore = sc;
            best = mv;
        }
    }
    return best;
}

function getHighscoresList(key, difficulty = diffMode) {
    try { return JSON.parse(localStorage.getItem("gamehub-highscores-" + key + "-" + difficulty) || '[]'); } catch(e) { return []; }
}

function getHighscoresAll(key) {
    return {
        easy: getHighscore(key, 'easy'),
        medium: getHighscore(key, 'medium'),
        hard: getHighscore(key, 'hard')
    };
}

function formatHighscoresAll(key, isTime) {
    const h = getHighscoresAll(key);
    if(isTime) return `⚡ Easy:${h.easy} ms | Norm:${h.medium} ms | Hard:${h.hard} ms`;
    return `🏆 E:${h.easy} | N:${h.medium} | H:${h.hard}`;
}

function getGlobalHighscore(key) {
    return getHighscore(key, 'default');
}

function saveGlobalHighscore(key, score) {
    return saveHighscore(key, score, 'default');
}

function formatHighscoreSingle(key) {
    return `🏆 Best: ${getGlobalHighscore(key)}`;
}

function formatBestTimeSingle(key) {
    return `⚡ Best: ${getBestTime(key, 'default')} ms`;
}

function saveHighscoresList(key, list, difficulty = diffMode) {
    localStorage.setItem("gamehub-highscores-" + key + "-" + difficulty, JSON.stringify(list));
}

function addHighscore(key, name, score, isTime, difficulty = diffMode) {
    const list = getHighscoresList(key, difficulty);
    list.push({ name: name || 'Player', score: Number(score), date: Date.now() });
    list.sort((a,b) => (isTime ? a.score - b.score : b.score - a.score));
    list.splice(HIGHSCORE_LIMIT);
    saveHighscoresList(key, list, difficulty);
}

function maybeAddHighscore(key, score, isTime, difficulty = diffMode) {
    const list = getHighscoresList(key, difficulty);
    const qualifies = list.length < HIGHSCORE_LIMIT || (isTime ? score < list[list.length-1].score : score > list[list.length-1].score);
    if(!qualifies) return false;
    // Use stored player name or a default; do not prompt to avoid annoyance
    let name = localStorage.getItem('gamehub-player-name') || 'Spieler';
    addHighscore(key, name, score, isTime, difficulty);
    if(isTime) saveBestTime(key, score, difficulty); else saveHighscore(key, score, difficulty);
    updateMenuHighscores();
    const sel = document.getElementById('hs-game-select'); if(sel && sel.value === key) showHighscores(key, difficulty);
    return true;
}

function showHighscores(key, difficulty = diffMode) {
    const list = getHighscoresList(key, difficulty);
    const isTime = key === 'reaction';
    const container = document.getElementById('hs-list');
    if(!container) return;
    if(list.length === 0) { container.innerHTML = `<div style="padding:12px;">Keine Einträge für ${key} (${difficulty}).</div>`; return; }
    let html = '<ol class="hs-list" style="padding-left:18px; margin:0;">';
    list.forEach(entry => {
        html += `<li class="hs-entry" style="margin:8px 0; display:flex; justify-content:space-between;"><div><strong class="hs-name">${entry.name}</strong> <span style="color:var(--text-muted); font-size:0.85rem; margin-left:8px;">${new Date(entry.date).toLocaleDateString()}</span></div><div class="hs-score">${entry.score}${isTime ? ' ms' : ''}</div></li>`;
    });
    html += '</ol>';
    container.innerHTML = html;
}

function clearHighscores(key, difficulty = diffMode) {
    if(!confirm('Lösche Highscores für ' + key + ' (' + difficulty + ')?')) return;
    localStorage.removeItem('gamehub-highscores-' + key + '-' + difficulty);
    if(key === 'reaction') localStorage.removeItem('gamehub-besttime-' + key + '-' + difficulty); else localStorage.removeItem('gamehub-highscore-' + key + '-' + difficulty);
    updateMenuHighscores();
    showHighscores(key, difficulty);
}

// MINESWEEPER
let minesweeperBoard = [];
let minesweeperRevealed = [];
let minesweeperGameOver = false;
let minesweeperMines = 0;
let minesweeperFlagged = 0;
let minesweeperSize = 8;

function liveMinesweeperDiff(val) {
    diffMode = val;
    initMinesweeper();
}

function initMinesweeper() {
    minesweeperGameOver = false;
    minesweeperFlagged = 0;
    
    // Set grid size and mine count based on difficulty
    if(diffMode === 'easy') {
        minesweeperSize = 6;
        minesweeperMines = 8;
    } else if(diffMode === 'medium') {
        minesweeperSize = 8;
        minesweeperMines = 16;
    } else {
        minesweeperSize = 10;
        minesweeperMines = 30;
    }
    
    // Initialize board and revealed state
    minesweeperBoard = Array(minesweeperSize).fill(0).map(() => Array(minesweeperSize).fill(0));
    minesweeperRevealed = Array(minesweeperSize).fill(0).map(() => Array(minesweeperSize).fill(false));
    
    // Place mines randomly
    let placed = 0;
    while(placed < minesweeperMines) {
        const r = Math.floor(Math.random() * minesweeperSize);
        const c = Math.floor(Math.random() * minesweeperSize);
        if(minesweeperBoard[r][c] !== 'M') {
            minesweeperBoard[r][c] = 'M';
            placed++;
        }
    }
    
    // Calculate numbers
    for(let r = 0; r < minesweeperSize; r++) {
        for(let c = 0; c < minesweeperSize; c++) {
            if(minesweeperBoard[r][c] !== 'M') {
                let count = 0;
                for(let dr = -1; dr <= 1; dr++) {
                    for(let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr, nc = c + dc;
                        if(nr >= 0 && nr < minesweeperSize && nc >= 0 && nc < minesweeperSize && minesweeperBoard[nr][nc] === 'M') {
                            count++;
                        }
                    }
                }
                minesweeperBoard[r][c] = count;
            }
        }
    }
    
    renderMinesweeper();
}

function renderMinesweeper() {
    const board = document.getElementById('minesweeper-board');
    const status = document.getElementById('minesweeper-status');
    
    board.style.gridTemplateColumns = `repeat(${minesweeperSize}, 1fr)`;
    board.innerHTML = '';
    
    for(let r = 0; r < minesweeperSize; r++) {
        for(let c = 0; c < minesweeperSize; c++) {
            const cell = document.createElement('div');
            cell.className = 'minesweeper-cell';
            const revealed = minesweeperRevealed[r][c];
            
            if(revealed) {
                cell.classList.add('revealed');
                const val = minesweeperBoard[r][c];
                if(val === 'M') {
                    cell.classList.add('mine');
                    cell.innerHTML = '💣';
                } else if(val > 0) {
                    cell.innerHTML = val;
                    cell.style.color = ['#0000FF','#008000','#FF0000','#000080','#800000','#008080','#000000','#808080'][val - 1] || '#000';
                }
            } else if(localStorage.getItem(`minesweeper-flag-${r}-${c}`)) {
                cell.classList.add('flagged');
                cell.innerHTML = '🚩';
            }
            
            cell.onclick = () => revealMinesweeper(r, c);
            cell.oncontextmenu = (e) => { e.preventDefault(); flagMinesweeper(r, c); };
            board.appendChild(cell);
        }
    }
    
    updateMinesweeperStatus();
}

function revealMinesweeper(r, c) {
    if(minesweeperGameOver || minesweeperRevealed[r][c]) return;
    if(localStorage.getItem(`minesweeper-flag-${r}-${c}`)) return;
    
    minesweeperRevealed[r][c] = true;
    
    if(minesweeperBoard[r][c] === 'M') {
        minesweeperGameOver = true;
        revealAllMines();
        updateMinesweeperStatus();
        renderMinesweeper();
        return;
    }
    
    if(minesweeperBoard[r][c] === 0) {
        for(let dr = -1; dr <= 1; dr++) {
            for(let dc = -1; dc <= 1; dc++) {
                const nr = r + dr, nc = c + dc;
                if(nr >= 0 && nr < minesweeperSize && nc >= 0 && nc < minesweeperSize && !minesweeperRevealed[nr][nc]) {
                    revealMinesweeper(nr, nc);
                }
            }
        }
    }
    
    renderMinesweeper();
}

function flagMinesweeper(r, c) {
    if(minesweeperGameOver || minesweeperRevealed[r][c]) return;
    
    const key = `minesweeper-flag-${r}-${c}`;
    if(localStorage.getItem(key)) {
        localStorage.removeItem(key);
        minesweeperFlagged--;
    } else {
        localStorage.setItem(key, '1');
        minesweeperFlagged++;
    }
    
    renderMinesweeper();
}

function revealAllMines() {
    for(let r = 0; r < minesweeperSize; r++) {
        for(let c = 0; c < minesweeperSize; c++) {
            if(minesweeperBoard[r][c] === 'M') {
                minesweeperRevealed[r][c] = true;
            }
        }
    }
}

function updateMinesweeperStatus() {
    const status = document.getElementById('minesweeper-status');
    const revealed = minesweeperRevealed.flat().filter(x => x).length;
    const nonMineCount = minesweeperSize * minesweeperSize - minesweeperMines;
    
    if(minesweeperGameOver) {
        status.innerText = '💣 Spiel vorbei! BOOM!';
    } else if(revealed === nonMineCount) {
        minesweeperGameOver = true;
        status.innerText = '🎉 Du hast gewonnen!';
    } else {
        status.innerText = `Flaggen: ${minesweeperFlagged}/${minesweeperMines} | Enthüllt: ${revealed}/${nonMineCount}`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    updateMenuHighscores();
    // ensure highscores screen shows default selection
    const sel = document.getElementById('hs-game-select');
    const selDiff = document.getElementById('hs-diff-select');
    const diff = selDiff ? selDiff.value : diffMode;
    if(sel) showHighscores(sel.value || 'snake', diff);
});

