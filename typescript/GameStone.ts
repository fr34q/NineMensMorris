/**
 * Class implementing game stones.
 */
class GameStone
{
    /**
     * position of the stone in whole numbers
     */
    position : Position2;
    /**
     * telling if the stone is the active one
     */
    active : boolean;
    /**
     * field on which the stone currently is placed if any
     */
    field : GameField;

    // delcaring pattern offset for the stone so the visible part of the pattern will stay the same during the game
    private patternOffset : Position2;

    // black: 0, white: 1
    private _color : number;
    /**
     * color of the stone (readonly)
     */
    get color() : number { 
        return this._color;
    }
    
    /**
     * Creates a stone of the given color.
     * @param {number} color - Color of the stone (0: black, 1: white).
     * @constructor
     */
    constructor (farbe : number)
    {
        this._color = farbe;
        this.position = {x: -1, y: -1}; // set initial position to (-1,-1) - does not matter
        this.active = false;

        // set random patternOffset so all stones look different
        this.patternOffset = {x: Math.floor(Math.random()*201), y: Math.floor(Math.random()*201)};
    }

    /**
     * Returns true if stone is placed on the field.
     */
    get isPlaced() : boolean {
        return this.field != null;
    }

    /**
     * Paint the stone on the canvas.
     */
    Paint() : void {
        var stoneBorderWidth = Settings.stoneBorderWidthFactor * GameBoard.fieldLength;
        var stoneBorderColor = this.color==1 ? Settings.stoneWhiteBorderColor : Settings.stoneBlackBorderColor;
        if (this.active) {
            // Active stone
            stoneBorderColor = Settings.stoneBorderColorActive;
            stoneBorderWidth *= Settings.stoneBorderMarkedFactor;
        } else if (Game.phase == 2 && this.isHovered && this.isMoveable && this.color == Game.currentPlayer && !Game.playerAI[Game.currentPlayer]) {
            // Hovered stone that can be moved by human player
            stoneBorderColor = Settings.stoneBorderColorHovered;
            stoneBorderWidth *= Settings.stoneBorderMarkedFactor;
        } else if (Game.phase == 2 && this.color == Game.currentPlayer && this.isMoveable) {
            // Mark stones that can be moved
            stoneBorderColor = Settings.stoneBorderColorMoveable;
            stoneBorderWidth *= Settings.stoneBorderMarkedFactor;
        } else if (Game.phase == 3 && this.color != Game.currentPlayer && !this.isInClosedMill && this.isPlaced) {
            // Mark stones that can be removed and highlight the stone currently hovered
            if (this.isHovered  && !Game.playerAI[Game.currentPlayer])
                stoneBorderColor = Settings.stoneBorderColorRemoveableHovered;
            else
                stoneBorderColor = Settings.stoneBorderColorRemoveable;
            stoneBorderWidth *= Settings.stoneBorderMarkedFactor;
        }

        var realPos = GameBoard.GetRealPosition(this.position);
        PaintHelper.FillCirclePattern(realPos.x, realPos.y, 
                Settings.stoneRadiusFactor * GameBoard.fieldLength, 
                imgStonePattern[this.color], 
                stoneBorderColor, stoneBorderWidth,
                this.patternOffset);
    }

    /**
     * Returns true if the stone is currently hovered by mouse.
     */
    get isHovered() : boolean {
        var stoneRadius = Settings.stoneRadiusFactor * GameBoard.fieldLength;
        var realPos = GameBoard.GetRealPosition(this.position);
        var mousePos = InputController.mousePosition;
        return Math.pow(realPos.x - mousePos.x, 2) + Math.pow(realPos.y - mousePos.y, 2) <= Math.pow(stoneRadius, 2);
    }

    /**
     * Method called if clicked on stone.
     * @returns {boolean} if click was consumed by the stone or not.
     */
    OnClicked() : boolean {
        if (Game.phase == 2 && Game.currentPlayer == this.color && this.isMoveable) {
            // Stone can be moved -> activate him
            GameBoard.activeStone = this;
            return true;
        } else if (Game.phase == 3 && Game.currentPlayer != this.color && !this.isInClosedMill) {
            // Stone can be removed -> do it
            GameBoard.RemoveStoneFromField(this);
            return true;
        }
        return false;
    }

    /**
     * Returns true if the stone can be moved on the field.
     */
    get isMoveable() : boolean {
        return GameBoard.stones[this.color].length == 3 || (this.field && (
                (this.field.neighborBottom && !this.field.neighborBottom.owner)
                || (this.field.neighborLeft && !this.field.neighborLeft.owner)
                || (this.field.neighborRight && !this.field.neighborRight.owner)
                || (this.field.neighborTop && !this.field.neighborTop.owner)));
    }

    /**
     * Returns true if the stone is currently in a closed mill.
     */
    get isInClosedMill() : boolean {
        return this.field && (this.field.isClosedMillHorizontal || this.field.isClosedMillVertical);
    }
}