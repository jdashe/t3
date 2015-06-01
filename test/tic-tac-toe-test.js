var assert = require('chai').assert;
var _ = require('underscore');
var T3 = require('../lib/tic-tac-toe');

describe('tic-tac-toe engine tests', function () {
    it('try to create a game object', function() {
        var game = new T3();
        assert.isNotNull(game);
        assert.isDefined(game.newGame, 'newGame not found');
        assert.isDefined(game.getState, 'getState not found');
        assert.isDefined(game.recoverGame, 'recoverGame not found');
        assert.isDefined(game.getBoard, 'getBoard not found');
        assert.isDefined(game.playerMove, 'playerMove not found');
        assert.isDefined(game.getWinner, 'getWinner not found');
    });
    
    it('new game', function() {
        var game = new T3();
        game.newGame();
        
        // New board should be an array of empty cells.
        var board = game.getBoard();
        assert.isDefined(board, 'board should exist');
        assert.isArray(board, 'board should be an array');
        assert.equal(9, board.length, 'board should have 9 cells');
        assert(_.every(board, function(cell){return cell == '';}), 
                'board should be filled with empty cells');
        
        // No winner yet.
        assert.equal(game.getWinner(), '', 'game shouldn\'t have a winner yet');
    });
    
    it('game state', function() {
        var game = new T3();
        game.newGame();

        var gameState = game.getState();
        assert.isDefined(gameState, 'should have an initial state');
        
        assert.isDefined(gameState.skillLevel, 'skillLevel missing');
        assert.equal(gameState.skillLevel, 2, 'expected skillLevel to be set to intermediate');
        
        assert.isDefined(gameState.state);
        assert.equal(gameState.state, 0, 'expected initial state to be 0');
        
        assert.isDefined(gameState.turn);
        assert.equal(gameState.turn, 1, 'expected initial turn to be the human');
    });

    it('game play of one move', function() {
        var game = new T3();
        game.newGame();
        
        // First move. Let's go in the center.
        game.playerMove(4);
        assert.equal(game.getWinner(), '', 'no winner yet');
        var board = game.getBoard();
        assert.equal(board[4], 'X', 'expected player move in the center');
        
        // There should be exactly one O and one X in the board.
        assert.equal(_.reduce(board, function(memo, cell){ return cell == 'O' ? 1 : 0; }, 0),
                    1);
        assert.equal(_.reduce(board, function(memo, cell){ return cell == 'X' ? 1 : 0; }, 0),
                    1);
    });

});