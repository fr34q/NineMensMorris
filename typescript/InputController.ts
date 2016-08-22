/**
 * Class that handles mouse input.
 */
class InputController
{
    private static _mousePos : Position2 = {x: 0, y: 0};
    /**
     * Current mouse position relative to the canvas.
     */
    static get mousePosition() : Position2 {
        return InputController._mousePos;
    }

    /**
     * Initialize the controller by registering mouse handlers;
     */
    static InitController() {
        canvas.addEventListener('mousemove', this.RegisterMouseMove, false);
        canvas.addEventListener ("mouseout", this.RegisterMouseOut, false);
        canvas.addEventListener("click", this.RegisterMouseClick, false);
    }
    
    /**
     * Event handler that is called if mouse is moved inside the canvas.
     */
    private static RegisterMouseMove(evt) : void {
        // Retrieve and internally store mouse position.
        var rect = canvas.getBoundingClientRect();
        InputController._mousePos = {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };
    }
    /**
     * Event handler that is called if mouse is moved out of the canvas.
     */
    private static RegisterMouseOut(evt) : void {
        // Set mouse position to (0,0) so no elements are hovered anymore.
        InputController._mousePos = {x: 0, y: 0};
    }
    /**
     * Event handler that is called if mouse click inside canvas is registered.
     */
    private static RegisterMouseClick(evt) : void {
        // If winning screen we only need to detect if it was clicked somewhere
        if(Game.phase == 4 || Game.phase == 5) {
            Menu.ReturnToMenu();
            return;
        }
        // No input possible/necessary if active player is AI
        if (Game.playerAI[Game.currentPlayer])
            return;
        // Forward click to fields that may be concerned about
        for (var field of GameBoard.gameFields) {
            if (field.isHovered && field.OnClicked())
                return;
        }
    }
    
      
}