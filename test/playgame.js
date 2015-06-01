var _ = require('underscore');
var T3 = require('../lib/tic-tac-toe');
var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
    });

var game = new T3();
game.newGame(4);

rl.setPrompt('What\'s your move? ');

function spacy(s, i) {
    return (s[i] == '') ? i : s[i];
}

function printBoard(b) {
    console.log();
    console.log('%s|%s|%s', spacy(b,6), spacy(b,7), spacy(b,8));
    console.log('_+_+_');
    console.log('%s|%s|%s', spacy(b,3), spacy(b,4), spacy(b,5));
    console.log('_+_+_');
    console.log('%s|%s|%s', spacy(b,0), spacy(b,1), spacy(b,2));
}

printBoard(game.getBoard());
rl.prompt();

rl.on('line', function(line) {
    game.playerMove(Number(line.trim()));
    printBoard(game.getBoard());
    
    if (game.getWinner() != '') {
        console.log("Result of game: " + game.getWinner());
        process.exit(0);
    }
    
    rl.prompt();
});

