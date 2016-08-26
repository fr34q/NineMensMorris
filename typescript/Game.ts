/**
 * Static class providing the current game state and general functions to control the game.
 */
class Game {
    /** Curent game phase */
    static phase : number;
    /** Game turn (removing stones not counting) */
    static turn : number;
    /** Current player */
    static currentPlayer : number;
    /** Set if a player is played by computer */
    static playerAI : Array<EnemyAI> = [null, null];
    /** How long AI will sleep before deciding its next move */
    static enemyAIRandomSleepTime = 500; // ms
    
    /**
     * Reset and start new game.
     */
    static Start() : void {
        Game.Reset();
        Game.phase = 1;

        GameBoard.UpdateProperties();
        GameBoard.TryAIMove();
    }
    
    /**
     * Reset game and set phase to menu.
     */
    static Reset() : void {
        // Create new AI players
        if (Game.playerAI[0])
            Game.playerAI[0] = new EnemyAIPrimitive(0);
        if (Game.playerAI[1])
            Game.playerAI[1] = new EnemyAIMinimax(1);
        Game.phase = 0; // menu
        Game.turn = 0;
        Game.currentPlayer = 1; // white
        
        GameBoard.Initialize();
    }

    /**
     * Triggers the winner screen after a game.
     */
    static ShowWinnerScreen() : void {
        Game.phase = 4;
        GameBoard.UpdateProperties();
        winnerScreenText.innerText = (Game.currentPlayer == 1 ? "White" : "Black") + " wins!";
        winnerScreen.style.display = 'table';
    }
    /**
     * Triggers the draw screen after a game.
     */
    static ShowDrawScreen() : void {
        Game.phase = 5;
        GameBoard.UpdateProperties();
        winnerScreenText.innerText = "Game is drawn!";
        winnerScreen.style.display = 'table';
    }

    private static countWin : number[] = [0,0];
    private static countDraw : number = 0;
    static AutoPlayStatistics(totalStop? : number) : void {
        if (Game.phase == 4 || Game.phase == 5) {
            if (Game.phase == 4) this.countWin[Game.currentPlayer]++;
            else this.countDraw++;
            console.info("W: "+this.countWin[1]+" - B: "+this.countWin[0]
                    +" - D: "+this.countDraw+" => T: "+(this.countWin[0]+this.countWin[1]+this.countDraw));
            if(totalStop != null && (this.countWin[0]+this.countWin[1]+this.countDraw) >= totalStop)
                return; // No new game and further listening
            Menu.StartGame();
        }
        if (totalStop != null)
            setTimeout(() => this.AutoPlayStatistics(totalStop), 100);
        else
            setTimeout(() => this.AutoPlayStatistics(), 100);
    }
}