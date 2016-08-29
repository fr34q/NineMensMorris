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
    /** 
     * Numbers describing the type of AI for each player.
     * 0: Human, 1: Random, 2: Easy, 3: Medium, 4: Hard
     */
    static playerAINumber : number[] = [0,0];
    /** Set if a player is played by computer */
    static playerAI : Array<EnemyAI> = [null, null];
    /** How long AI will sleep/calculate before deciding its next move */
    static aiDecisionTime : number = 500; // ms
    /** Turns statistics mode on or off */
    static statMode : boolean = false;
    /** Telling if game is in nature design or not */
    static natureDesign : boolean = true;

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
        this.InitializeAIs();
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
    /**
     * Initializes Statistics Mode where game restarts automatically
     * and winners will be counted and displayed in the footer.
     */
    static StartStatMode() : void {
        this.countWin = [0,0];
        this.countDraw = 0;
        this.AutoPlayStatistics();
    }
    /**
     * Checks in Stat Mode if game ended and if so logs it and restarts.
     */
    static AutoPlayStatistics() : void {
        if (Game.phase == 4 || Game.phase == 5) {
            if (Game.phase == 4) this.countWin[Game.currentPlayer]++;
            else this.countDraw++;
            var infoText = "White: " + this.countWin[1]
                    + " - Black: " + this.countWin[0] 
                    + " - Draw: " + this.countDraw
                    + " (Total: " + (this.countWin[0]+this.countWin[1]+this.countDraw) + ")";
            console.info(infoText);
            footer.innerHTML = infoText;
            Game.Start();
            winnerScreen.style.display = 'none';
        } else if (Game.phase == 0) {
            return; // no new call to function (menu interrupts)
        }
        setTimeout(() => this.AutoPlayStatistics(), 100);
    }
    /**
     * Initializes the player AIs according to playerAINumber.
     */
    static InitializeAIs() : void {
        [0,1].forEach(color => {
            switch(this.playerAINumber[color]) {
                case 1: // random
                    Game.playerAI[color] = new EnemyAIRandom(color);
                    break;
                case 2: // easy
                    Game.playerAI[color] = new EnemyAIPrimitive(color);
                    break;
                case 3: // middle
                    Game.playerAI[color] = new EnemyAIMinimax(color, true);
                    break;
                case 4: // hard
                    Game.playerAI[color] = new EnemyAIMinimax(color, false);
                    break;
                default: // human
                    Game.playerAI[color] = null;
                    break;
            }
        });
    }
}