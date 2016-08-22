/**
 * Class implementing game fields where stone can be placed.
 */
class GameField
{
    /** Left neighbor of this field on the game board. */
    neighborLeft : GameField;
    /** Right neighbor of this field on the game board. */
    neighborRight : GameField;
    /** Top neighbor of this field on the game board. */
    neighborTop : GameField;
    /** Bottom neighbor of this field on the game board. */
    neighborBottom : GameField;

    /** Stone currently placed on this field. */
    owner : GameStone;
    /** Position of the field on the board in whole numbers. */
    position : Position2;

    /**
     * Creates a game field for the specified position. Neighbors have to be set later.
     * @param {number} xPos - X coordinate of position on screen in whole numbers.
     * @param {number} yPos - Y coordinate of position on screen in whole numbers.
     * @constructor
     */
    constructor (xPos : number, yPos : number) {
        this.position = {x: xPos, y: yPos};
    }

    /** Returns true if a horizontal mill is established using this field. */
    get isClosedMillHorizontal() : boolean {
        if (!this.owner || (!this.neighborLeft && !this.neighborRight))
            return false;
        if (!this.neighborLeft)
            return this.neighborRight.neighborRight && this.neighborRight.isClosedMillHorizontal;
        if (!this.neighborRight)
            return this.neighborLeft.neighborLeft && this.neighborLeft.isClosedMillHorizontal;
        return this.neighborLeft.owner && this.neighborLeft.owner.color == this.owner.color 
                && this.neighborRight.owner && this.neighborRight.owner.color == this.owner.color;
    }
    /** Returns true if a vertical mill is established using this field. */
    get isClosedMillVertical() : boolean {
        if (!this.owner || (!this.neighborTop && !this.neighborBottom))
            return false;
        if (!this.neighborTop)
            return this.neighborBottom.neighborBottom && this.neighborBottom.isClosedMillVertical;
        if (!this.neighborBottom)
            return this.neighborTop.neighborTop && this.neighborTop.isClosedMillVertical;
        return this.neighborTop.owner && this.neighborTop.owner.color == this.owner.color 
                && this.neighborBottom.owner && this.neighborBottom.owner.color == this.owner.color;
    }

    /** Returns true if the mouse is hovering over the field. */
    get isHovered() : boolean {
        var stoneRadius = Settings.stoneRadiusFactor * GameBoard.fieldLength;
        var realPos = GameBoard.GetRealPosition(this.position);
        var mousePos = InputController.mousePosition;
        return Math.pow(realPos.x - mousePos.x, 2) + Math.pow(realPos.y - mousePos.y, 2) <= Math.pow(stoneRadius, 2);
    }

    /**
     * Method painting the game field on the canvas.
     */
    Paint() : void {
        var color = Settings.fieldColor;
        if (Game.playerAI[Game.currentPlayer]) {
            // Nothing -> no hover effect if it is KI's turn
        } else if (Game.phase == 1 && !this.owner && this.isHovered) {
            // Stone can placed on this field and is hovered
            // (we do not mark all fields as this is clear and gives no information, also looks nicer)
            color = Settings.fieldColorHover;
        } else if (Game.phase == 2 && GameBoard.activeStone && this.CanStoneMoveTo(GameBoard.activeStone)) {
            // Active stone can be moved to this field, so mark it or shot if it is hovered
            if (this.isHovered) {
                color = Settings.fieldColorHover;
            } else {
                color = Settings.fieldColorMoveable;
            }
        }

        var pos = GameBoard.GetRealPosition(this.position);
        PaintHelper.FillCircle(pos.x, pos.y, 
                Settings.fieldRadiusFactor * GameBoard.fieldLength, 
                color);
    }

    /**
     * Method called if clicked on the game field.
     */
    OnClicked() : boolean {
        // If stone is placed on field redirect click to stone
        if (this.owner)
            return this.owner.OnClicked();
        
        switch (Game.phase) {
            case 1: // Placing Stones
                if (GameBoard.activeStone && !this.owner)
                    // Active stone can be placed on the field
                    GameBoard.MoveCurrentStoneToField(this);
                else
                    return false;
                break;
            case 2: // Moving Stones
                if (GameBoard.activeStone && this.CanStoneMoveTo(GameBoard.activeStone))
                    // Active stone can be moved to the field
                    GameBoard.MoveCurrentStoneToField(this);
                else
                    return false;
                break;
            default:
                return false;
        }
        
        return true; // true if click consumed
    }

    /**
     * Checks if a given stone can move to the current field.
     * @param {GameStone} stone - The stone that needs to be checked.
     * @returns {boolean} indicating if a stone can moved on the field.
     */
    CanStoneMoveTo(stone : GameStone) : boolean {
        // cannot move here if field is already occupied
        if (this.owner)
            return false;
        
        return !stone.isPlaced
                || GameBoard.GetStonesOnField(stone.color).length == 3
                || (this.neighborBottom && this.neighborBottom.owner == stone)
                || (this.neighborLeft && this.neighborLeft.owner == stone)
                || (this.neighborRight && this.neighborRight.owner == stone)
                || (this.neighborTop && this.neighborTop.owner == stone);
    }
}