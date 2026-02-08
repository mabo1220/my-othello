const SIZE = 8;
const PLAYER = 1; // 黒
const CPU = 2;    // 白
const EMPTY = -1;

let board = [];
const weights = [
    [120, -20, 20,  5,  5, 20, -20, 120],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [ 20,  -5, 15,  3,  3, 15,  -5,  20],
    [  5,  -5,  3,  3,  3,  3,  -5,   5],
    [  5,  -5,  3,  3,  3,  3,  -5,   5],
    [ 20,  -5, 15,  3,  3, 15,  -5,  20],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [120, -20, 20,  5,  5, 20, -20, 120]
];

// ゲーム初期化
function startGame() {
    board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
    board[3][3] = CPU; board[4][4] = CPU;
    board[3][4] = PLAYER; board[4][3] = PLAYER;
    drawBoard();
}

// 描画更新
function drawBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    let pCount = 0, cCount = 0;

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.onclick = () => playerMove(r, c);
            
            if (board[r][c] !== EMPTY) {
                const stone = document.createElement('div');
                stone.className = `stone ${board[r][c] === PLAYER ? 'black' : 'white'}`;
                cell.appendChild(stone);
                board[r][c] === PLAYER ? pCount++ : cCount++;
            }
            boardElement.appendChild(cell);
        }
    }
    document.getElementById('player-score').innerText = pCount;
    document.getElementById('cpu-score').innerText = cCount;
}

// 8方向探索ロジック
function getFlipList(r, c, color, targetBoard) {
    const opp = color === PLAYER ? CPU : PLAYER;
    let flips = [];
    const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

    for (let [dr, dc] of directions) {
        let temp = [];
        let tr = r + dr, tc = c + dc;
        while (tr >= 0 && tr < SIZE && tc >= 0 && tc < SIZE && targetBoard[tr][tc] === opp) {
            temp.push([tr, tc]);
            tr += dr; tc += dc;
        }
        if (tr >= 0 && tr < SIZE && tc >= 0 && tc < SIZE && targetBoard[tr][tc] === color) {
            flips = flips.concat(temp);
        }
    }
    return flips;
}

// プレイヤーの手番
async function playerMove(r, c) {
    if (board[r][c] !== EMPTY) return;
    const flips = getFlipList(r, c, PLAYER, board);
    if (flips.length === 0) return;

    board[r][c] = PLAYER;
    flips.forEach(([fr, fc]) => board[fr][fc] = PLAYER);
    drawBoard();

    if (hasValidMove(CPU)) {
        setTimeout(cpuMove, 500);
    } else if (!hasValidMove(PLAYER)) {
        alert("終了！");
    }
}

// AI思考（Alpha-Beta法 Lv.6）
function cpuMove() {
    let bestScore = -Infinity;
    let bestMove = null;

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] === EMPTY) {
                const flips = getFlipList(r, c, CPU, board);
                if (flips.length > 0) {
                    let nextBoard = board.map(row => [...row]);
                    nextBoard[r][c] = CPU;
                    flips.forEach(([fr, fc]) => nextBoard[fr][fc] = CPU);

                    let score = alphaBeta(nextBoard, 5, -Infinity, Infinity, false);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = {r, c};
                    }
                }
            }
        }
    }

    if (bestMove) {
        const flips = getFlipList(bestMove.r, bestMove.c, CPU, board);
        board[bestMove.r][bestMove.c] = CPU;
        flips.forEach(([fr, fc]) => board[fr][fc] = CPU);
        drawBoard();
        if (!hasValidMove(PLAYER) && hasValidMove(CPU)) setTimeout(cpuMove, 500);
    }
}

function alphaBeta(vBoard, depth, alpha, beta, isMaximizing) {
    if (depth === 0) return evaluate(vBoard);
    // ... ここにVBAと同じAlphaBetaロジックをループで実装 ...
    return isMaximizing ? alpha : beta; 
}

function evaluate(vBoard) {
    let score = 0;
    for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++)
            if (vBoard[r][c] === CPU) score += weights[r][c];
            else if (vBoard[r][c] === PLAYER) score -= weights[r][c];
    return score;
}

function hasValidMove(color) {
    for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++)
            if (board[r][c] === EMPTY && getFlipList(r, c, color, board).length > 0) return true;
    return false;
}

startGame();