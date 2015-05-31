// Tic Tac Toe engine, snarfed from http://blog.ostermiller.org/tic-tac-toe-strategy .
//
// Pits a human against an AI, with the human going first and playing X. The AI
// can be set with different levels of toughness, from beginner (uses random moves)
// through unbeatable. State can be grabbed for persisting and recreating.
//
// To play, instantiate with a playing level

var T3Game = module.exports = function() {

    // The board is an array of 9 strings each containing an X, O, or blank.
    // Indexing of the board:
    //
    //   6|7|8
    //   -+-+-
    //   3|4|5
    //   -+-+-
    //   0|1|2
    //
    var board = new Array();
    var skillLevel = 1; // 1 = beginner, 2 = intermediate, 3 = experienced, 4 = perfect
    var turn = -1; // 1 = human, -1 = computer

    function nextTurn(){
        turn = -turn;
        if (turn == 1){
            // It's the human's turn.
        } else {
            if (skillLevel == 1) beginnerMove();
            if (skillLevel == 2) intermediateMove();
            if (skillLevel == 3) experiencedMove();
            if (skillLevel == 4) perfectMove();
        }
    }

    function getLegalMoves(state){
        var moves = 0;
        for (var i=0; i<9; i++){
            if ((state & (1<<(i*2+1))) == 0){
                moves |= 1 << i;
            }
        }
        return moves;
    }

    function moveRandom(moves){
        var numMoves = 0;
        for (var i=0; i<9; i++){
            if ((moves & (1<<i)) != 0) numMoves++;
        }
        if (numMoves > 0){
            var moveNum = Math.ceil(Math.random()*numMoves);
            numMoves = 0;
            for (var j=0; j<9; j++){
                if ((moves & (1<<j)) != 0) numMoves++;
                if (numMoves == moveNum){
                    move(j);
                    return;
                }
            }
        }
    }

    function openingBook(state){
        var mask = state & 0x2AAAA;	
        if (mask == 0x00000) return 0x1FF;
        if (mask == 0x00200) return 0x145;
        if (mask == 0x00002 ||
            mask == 0x00020 ||
            mask == 0x02000 ||
            mask == 0x20000) return 0x010;
        if (mask == 0x00008) return 0x095;
        if (mask == 0x00080) return 0x071;
        if (mask == 0x00800) return 0x11C;
        if (mask == 0x08000) return 0x152;
        return 0;
    }

    function perfectMove(){
        var state = getState();
        var winner = detectWin(state);
        if (winner == 0){
            var moves = getLegalMoves(state);
            var hope = -999;
            var goodMoves = openingBook(state);
            if (goodMoves == 0){
                for (var i=0; i<9; i++){
                    if ((moves & (1<<i)) != 0) {
                        var value = moveValue(state, i, turn, turn, 15, 1);
                        if (value > hope){
                            hope = value;
                            goodMoves = 0;
                        }
                        if (hope == value){
                            goodMoves |= (1<<i);
                        }
                    }
                }
            }
            moveRandom(goodMoves);
        }
    }

    function moveValue(istate, move, moveFor, nextTurn, limit, depth){
        var state = stateMove(istate, move, nextTurn);
        var winner = detectWin(state);
        if ((winner & 0x300000) == 0x300000){
            return 0;
        } else if (winner != 0){
            if (moveFor == nextTurn) return 10 - depth;
            else return depth - 10;
        }
        var hope = 999;
        if (moveFor != nextTurn) hope = -999;
        if(depth == limit) return hope;
        var moves = getLegalMoves(state);
        for (var i=0; i<9; i++){
            if ((moves & (1<<i)) != 0) {
                var value = moveValue(state, i, moveFor, -nextTurn, 10-Math.abs(hope), depth+1);
                if (Math.abs(value) != 999){
                    if (moveFor == nextTurn && value < hope){
                        hope = value;
                    } else if (moveFor != nextTurn && value > hope){
                        hope = value;
                    }
                }
            }
        }
        return hope;
    }

    function detectWinMove(state, cellNum, nextTurn){
        var value = 0x3;
        if (nextTurn == -1) value = 0x2;
        var newState = state | (value << cellNum*2);
        return detectWin(newState);
    }

    function beginnerMove(){
        var state = getState();
        var winner = detectWin(state);
        if (winner == 0) moveRandom(getLegalMoves(state));
    }

    function getGoodMove(state){
        var moves = getLegalMoves(state);
        for (var i=0; i<9; i++){
            if ((moves & (1<<i)) != 0) {
                if (detectWinMove(state, i, turn)){
                    move(i);
                    return 0;
                }
            }
        }
        for (var j=0; j<9; j++){
            if ((moves & (1<<j)) != 0) {
                if (detectWinMove(state, j, -turn)){
                    move(i);
                    return 0;
                }
            }
        }
        return moves;
    }


    function intermediateMove(){
        var state = getState();
        var winner = detectWin(state);
        if (winner == 0) {
            moveRandom(getGoodMove(state));
        }
    }

    function experiencedMove(){
        var state = getState();
        var winner = detectWin(state);
        if (winner == 0) {
            var moves = openingBook(state);
            if (state == 0) moves = 0x145;
            if (moves == 0) moves = getGoodMove(state);
            moveRandom(moves);
        }
    }

    function buildStateFromBoard(){
        var state = 0;
        for (var i=0; i<9; i++){
            var cell = cells[i];
            var value = 0;
            if (cell.indexOf('X') != -1) value = 0x3;
            if (cell.indexOf('O') != -1) value = 0x2;
            state |= value << (i*2);
        }
        return state;
    }

    function detectWin(state){
        if ((state & 0x3F000) == 0x3F000) return 0x13F000;
        if ((state & 0x3F000) == 0x2A000) return 0x22A000;
        if ((state & 0x00FC0) == 0x00FC0) return 0x100FC0;
        if ((state & 0x00FC0) == 0x00A80) return 0x200A80;
        if ((state & 0x0003F) == 0x0003F) return 0x10003F;
        if ((state & 0x0003F) == 0x0002A) return 0x20002A;
        if ((state & 0x030C3) == 0x030C3) return 0x1030C3;
        if ((state & 0x030C3) == 0x02082) return 0x202082;
        if ((state & 0x0C30C) == 0x0C30C) return 0x10C30C;
        if ((state & 0x0C30C) == 0x08208) return 0x208208;
        if ((state & 0x30C30) == 0x30C30) return 0x130C30;
        if ((state & 0x30C30) == 0x20820) return 0x220820;
        if ((state & 0x03330) == 0x03330) return 0x103330;
        if ((state & 0x03330) == 0x02220) return 0x202220;
        if ((state & 0x30303) == 0x30303) return 0x130303;
        if ((state & 0x30303) == 0x20202) return 0x220202;
        if ((state & 0x2AAAA) == 0x2AAAA) return 0x300000;
        return 0;
    }

    function recordWin(winner){
        if ((winner & 0x300000) == 0x100000){
            xWon++;
        } else if ((winner & 0x300000) == 0x200000){
            oWon++;
        } else if ((winner & 0x300000) == 0x300000){
            catsGame++;
        }
        drawStats();
    }

    function drawStats() {
        var b = board;
        var totalGames = xWon + oWon + catsGame;
        b.xWon = xWon;
        b.oWon = oWon;
        b.catsGame = catsGame;
        b.xWonPer = ((xWon==0)?0:(Math.round(xWon * 1000 / totalGames) / 10)) + '%';
        b.oWonPer = ((oWon==0)?0:(Math.round(oWon * 1000 / totalGames) / 10)) + '%';
        b.catsGamePer = ((catsGame==0)?0:(Math.round(catsGame * 1000 / totalGames) / 10)) + '%';
    }

    function clearStats() {
        xWon = 0;
        oWon = 0;
        catsGame = 0;
        drawStats();
    }

    function buildBoardFromState(state) {
        var winner = detectWin(state);
        if ((winner & 0x300000) != 0){
            if ((winner & 0x300000) == 0x100000){
                xWon++;
            } else if ((winner & 0x300000) == 0x200000){
                oWon++;
            } else {
                catsGame++;
            }
            drawStats();
        }
        
        for (var i=0; i<9; i++){
            var value = '';
            if ((state & (1<<(i*2+1))) != 0){
                if ((state & (1<<(i*2))) != 0){
                    value = 'X';
                } else {
                    value = 'O';
                }
            }
            if ((winner & (1<<(i*2+1))) != 0){
                if (cells[i].style){
                    cells[i].style.backgroundColor='red';
                } else {
                    value = '*' + value + '*';
                }
            } else {
                if (cells[i].style){
                    cells[i].style.backgroundColor='green';
                }
            }
            cells[i] = value;
        }
    }

    function stateMove(state, move, nextTurn){
        var value = 0x3;
        if (nextTurn == -1) value = 0x2;
        return (state | (value << (move*2)));
    }

    // Add an X or O to the board. The index looks like:
    // 
    function move(cellIndex){
        if (cells[cellIndex] == ''){
            var state = getState();
            var winner = detectWin(state);
            if (winner == 0){
                state = stateMove(state, cellIndex, turn);
                drawState(state);
                nextTurn();
            }
            
            return (detectWin(state) != 0);
        }
    }
    
    function countMoves(state){
        var count = 0;
        for (var i=0; i<9; i++){
            if ((state & (1<<(i*2+1))) != 0){
               count++;
            }
        }
        return count;
    }

    function newGame() {
        var state = getState();
        var winner = detectWin(state);
        if (winner == 0 && countMoves(state) > 1){
            if (turn == 1) oWon++;
            else xWon++;
            drawStats();
        }
        drawState(0);
        // Human always goes first.
        turn = -1;
        nextTurn();
    }
    
    return {
        "init" : function (savedState) {
            makeCells();
            loadStats();
            newGame();
        },
        "move" : move
        "detectWin" : function() {
            var state = getState();
            return detectWin(state);
        }
    }
};