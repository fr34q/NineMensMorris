/**
 * Static class providing the current game state and general functions to control the game.
 */
class Game {
    static phase : number; // current game state
    static turn : number; // game turn (removing stones not counting)
    static currentPlayer : number;
    static playerAI : Array<EnemyAI> = [null, null]; // set if a player is played by computer

    /**
     * Reset and start new game.
     */
    static Start() : void {
        Game.Reset();
        Game.phase = 1;
        PaintHelper.Clear();
        GameBoard.Paint();
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
            Game.playerAI[1] = new EnemyAIPrimitive(1);
        Game.phase = 0; // menu
        Game.turn = 0;
        Game.currentPlayer = 1; // white
        
        GameBoard.Initialize();
    }

    /**
     * Function that is called regularly to paint on canvas etc.
     */
    static Loop() : void {
        // Updating canvas dimensions
        Game.ResizeScreen();
                
        switch (Game.phase) {
            case 0: // Menu
                break;
            case 1: // Placing stones
            case 2: // Moving stones
            case 3: // Removing stones
                PaintHelper.Clear();
                GameBoard.Paint();
                break;
            case 4: // Winner Screen
            case 5: // Draw Screen
                var showText = "Game is drawn!";
                if (Game.phase == 4) showText = (Game.currentPlayer == 1 ? "White" : "Black") + " wins!";

                PaintHelper.Clear();
                GameBoard.Paint();
                PaintHelper.FillRectangle(0, 0, canvas.width, canvas.height, 'rgba(225,225,225,0.85)');
                PaintHelper.DrawText(3, 3, showText, 
                        'large', 'black', 'center');
                PaintHelper.DrawText(3, 4, '(Click anywhere to go to menu.)', 
                        'normal', 'black', 'center');
                break;
        }
    }

    /**
     * Updating canvas HTML dimensions to fit with the CSS values necessary for displaying the canvas correctly.
     */
    static ResizeScreen() : void {
        canvas.height = canvas.scrollHeight;
        canvas.width = canvas.scrollWidth;
    }
}