// Tic Tac Toe engine, snarfed from http://blog.ostermiller.org/tic-tac-toe-strategy .
//
// Pits a human against an AI, with the human going first and playing X. The AI
// can be set with different levels of toughness, from beginner (uses random moves)
// through unbeatable. State can be grabbed for persisting and recreating.
//
// To play a new game, instantiate with a playing level. Individual moves are
// made by calling move(i) with the index of the cell the player wishes to mark with an X.
// After a move, call detectWinner() to determine if the game is over.
//
// To persist state, call getState() for a blob of JSON. To recreate a game from state,
// pass in this JSON in the constructor. No promises if you mess with the contents.
//

var _ = require('underscore');

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
    var _state = 0; // new game
    var _skillLevel = 2; // 1 = beginner, 2 = intermediate, 3 = experienced, 4 = perfect
    var _turn = 1; // 1 = human, -1 = computer
    
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
        var winner = detectWin(_state);
        if (winner == 0){
            var moves = getLegalMoves(_state);
            var hope = -999;
            var goodMoves = openingBook(_state);
            if (goodMoves == 0){
                for (var i=0; i<9; i++){
                    if ((moves & (1<<i)) != 0) {
                        var value = moveValue(_state, i, _turn, _turn, 15, 1);
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
        var winner = detectWin(_state);
        if (winner == 0) moveRandom(getLegalMoves(_state));
    }

    function getGoodMove(state){
        var moves = getLegalMoves(state);
        for (var i=0; i<9; i++){
            if ((moves & (1<<i)) != 0) {
                if (detectWinMove(state, i, _turn)){
                    move(i);
                    return 0;
                }
            }
        }
        for (var j=0; j<9; j++){
            if ((moves & (1<<j)) != 0) {
                if (detectWinMove(state, j, -_turn)){
                    move(j);
                    return 0;
                }
            }
        }
        return moves;
    }

    function intermediateMove(){
        var winner = detectWin(_state);
        if (winner == 0) {
            moveRandom(getGoodMove(_state));
        }
    }

    function experiencedMove(){
        var winner = detectWin(_state);
        if (winner == 0) {
            var moves = openingBook(state);
            if (_state == 0) moves = 0x145;
            if (moves == 0) moves = getGoodMove(_state);
            moveRandom(moves);
        }
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

    // Pass in a valid board to build state
    function buildStateFromBoard(board){
        var state = 0;
        for (var i=0; i<9; i++){
            var cell = board[i];
            var value = 0;
            if (cell.indexOf('X') != -1) value = 0x3;
            if (cell.indexOf('O') != -1) value = 0x2;
            state |= value << (i*2);
        }
        return state;
    }
    
    // Returns empty string if game is still in progress,
    // X or O if the player or computer won (respectively),
    // or C for cat's game.
    function getWinner() {
        var winner = detectWin(_state);
        if ((winner & 0x300000) != 0){
            if ((winner & 0x300000) == 0x100000){
                return 'X';
            } else if ((winner & 0x300000) == 0x200000){
                return 'O';
            } else {
                return 'C';
            }
        }
        
        return ''; // Game still in progress
    }
    
    function stateMove(state, move, nextTurn){
        var value = 0x3;
        if (nextTurn == -1) value = 0x2;
        return (state | (value << (move*2)));
    }

    //
    // Creates a board from the internal bit field.
    //
    function buildBoardFromState() {
        var board = [];
        for (var i=0; i<9; i++){
            board[i] = cellValue(i);
        }
        
        return board;
    }
    
    // Returns the value of a cell index based on the current _state:
    // '' if the cell is empty, X or O otherwise.
    function cellValue(cellIndex) {
        var value = '';
        if ((_state & (1<<(cellIndex*2+1))) != 0){
            if ((_state & (1<<(cellIndex*2))) != 0){
                value = 'X';
            } else {
                value = 'O';
            }
        }

        return value;
    }
    
    //
    // Adds an X to the board, then makes the computer's move if
    // appropriate. Pass in an index from 0 to 8.
    //
    // Ignores overwrites of existing cells and moves made
    // after the game is over.
    //
    // Returns a built-out board representing the state of the game
    // after the computer's move.
    // 
    function playerMove(cellIndex) {
        if (_turn == -1) {
            throw new Error('Hey, it\'s the computer\'s turn.');
        }
        
        move(cellIndex);
        return buildBoardFromState(_state);
    }
    
    function move(cellIndex){
        var winner = detectWin(_state);

        if (winner != 0) {
            // We've already got a winner, so no-op.
            return;
        }

        if (cellValue(cellIndex) == ''){
            _state = stateMove(_state, cellIndex, _turn);
            nextTurn();
        }
    }
    
    // Makes the computer's move, if it's the computer's turn.    
    function nextTurn(){
        _turn = -_turn;
        if (_turn == 1){
            // It's the human's turn.
        } else {
            if (_skillLevel == 1) beginnerMove();
            if (_skillLevel == 2) intermediateMove();
            if (_skillLevel == 3) experiencedMove();
            if (_skillLevel == 4) perfectMove();
        }
    }

    function countMoves(state){
        var count = 0;
        for (var i=0; i<9; i++){
            if ((state & (1<<(i*2+1))) != 0) {
               count++;
            }
        }
        return count;
    }

    function newGame(skillLevel) {
        initGame(0, // <- state, blank board
                 1, // <- whose turn. 1 == human.
                 skillLevel);
    }
    
    function initGame(state, turn, skillLevel) {
        _turn = (turn === 1) ? 1 : -1;
        _state = (isInt(state)) ? state : 0;
        
        _skillLevel = 2; // defaults to intermediate        
        if (isInt(skillLevel)) {
            // data is an integer
            _skillLevel = ((skillLevel > 0) && (skillLevel < 5)) ? skillLevel : 2;               
        }
    }
    
    function isInt(data) {
        return (typeof data==='number' && (data%1)===0);
    }
    
    function recoverGame(gameState) {
        if (_.has(gameState, 'skillLevel') &&
            _.has(gameState, 'state') &&
            _.has(gameState, 'turn')) {
            
            initGame(gameState.state,
                     gameState.turn,
                     gameState.skillLevel);
        }
        else {
            newGame();
        }
    }

    return {
        "newGame" : newGame,
        "getState" : function() {
            return {
                'skillLevel' : _skillLevel,
                'state'      : _state,
                'turn'       : _turn
            };
        },
        "recoverGame" : recoverGame,
        "getBoard"    : buildBoardFromState,
        "playerMove"  : playerMove,
        "getWinner"   : getWinner
    }
};
