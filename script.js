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

function initGame() {
    board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
    board[3][3] = CPU; board[4][4] = CPU;
    board[3][4] = PLAYER; board[4][3] = PLAYER;
    drawBoard();
}

function drawBoard() {
    const boardElement = document.getElementById('board');
    if(!boardElement) return;
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
    document.getElementById('p-score').innerText = pCount;
    document.getElementById('c-score').innerText = cCount;
}

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
        alert("ゲーム終了！");
    }
}

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
                    // 快適に遊ぶため深さを 6 に設定
                    let score = alphaBeta(nextBoard, 6, -Infinity, Infinity, false);
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
    } else {
        alert("PCはパスします");
    }
}

function alphaBeta(vBoard, depth, alpha, beta, isMaximizing) {
    if (depth === 0) return evaluate(vBoard);
    const color = isMaximizing ? CPU : PLAYER;
    let possibleMoves = [];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (vBoard[r][c] === EMPTY && getFlipList(r, c, color, vBoard).length > 0) {
                possibleMoves.push({r, c});
            }
        }
    }
    if (possibleMoves.length === 0) return evaluate(vBoard);

    if (isMaximizing) {
        let val = -Infinity;
        for (let move of possibleMoves) {
            let nextBoard = vBoard.map(row => [...row]);
            const flips = getFlipList(move.r, move.c, CPU, nextBoard);
            nextBoard[move.r][move.c] = CPU;
            flips.forEach(([fr, fc]) => nextBoard[fr][fc] = CPU);
            val = Math.max(val, alphaBeta(nextBoard, depth - 1, alpha, beta, false));
            alpha = Math.max(alpha, val);
            if (alpha >= beta) break;
        }
        return val;
    } else {
        let val = Infinity;
        for (let move of possibleMoves) {
            let nextBoard = vBoard.map(row => [...row]);
            const flips = getFlipList(move.r, move.c, PLAYER, nextBoard);
            nextBoard[move.r][move.c] = PLAYER;
            flips.forEach(([fr, fc]) => nextBoard[fr][fc] = PLAYER);
            val = Math.min(val, alphaBeta(nextBoard, depth - 1, alpha, beta, true));
            beta = Math.min(beta, val);
            if (alpha >= beta) break;
        }
        return val;
    }
}

function evaluate(vBoard) {
    let score = 0;
    let pMoves = countPossibleMovesVirtual(vBoard, PLAYER);
    let cMoves = countPossibleMovesVirtual(vBoard, CPU);

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (vBoard[r][c] === CPU) score += weights[r][c];
            else if (vBoard[r][c] === PLAYER) score -= weights[r][c];
        }
    }
    // 戦略：自分の打てる場所を増やし、相手を減らす
    score += (cMoves - pMoves) * 15;
    return score;
}

function countPossibleMovesVirtual(vBoard, color) {
    let count = 0;
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (vBoard[r][c] === EMPTY && getFlipList(r, c, color, vBoard).length > 0) count++;
        }
    }
    return count;
}

function hasValidMove(color) {
    for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++)
            if (board[r][c] === EMPTY && getFlipList(r, c, color, board).length > 0) return true;
    return false;
}

initGame();
