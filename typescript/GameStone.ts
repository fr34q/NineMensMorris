/**
 * Class implementing game stones.
 */
class GameStone
{
    private _color : number; // black: 0, white: 1
    private _position : FieldPosition = null;
    private _element : HTMLDivElement;
    private _active : boolean = false;
    private _moveable : boolean = false;
    private _removeable : boolean = false;

    /**
     * color of the stone (readonly)
     */
    get color() : number { 
        return this._color;
    }

    /**
     * position of the stone in whole numbers
     */
    get position() : FieldPosition {
        return this._position;
    }
    set position(newPos : FieldPosition) {
        this._position = newPos;
        if (this.element) {
            this.element.style.transform = 'translate('+(newPos.x-3)*10+'vmin, '+(newPos.y-3)*10+'vmin)';
        }
    }

    /**
     * field on which the stone currently is placed if any
     */
    field : GameField = null;

    /**
     * The DIV element representing this stone.
     */
    get element() : HTMLDivElement {
        return this._element;
    }

    /**
     * telling if the stone is the active one
     */
    get active() : boolean {
        return this._active;
    }
    set active(newActive : boolean) {
        if (newActive) {
            this.element.classList.add('stoneActive');
        } else {
            this.element.classList.remove('stoneActive');
        }
        this._active = newActive;
    }

    /**
     * can the stone be moved
     */
    get moveable() : boolean {
        return this._moveable;
    }
    set moveable(newMoveable : boolean) {
        if (newMoveable) {
            this.element.classList.add('stoneMoveable');
        } else {
            this.element.classList.remove('stoneMoveable');
        }
        this._moveable = newMoveable;
    }

    /**
     * can the stone be removed
     */
    get removeable() : boolean {
        return this._removeable;
    }
    set removeable(newRemoveable : boolean) {
        if (newRemoveable) {
            this.element.classList.add('stoneRemoveable');
        } else {
            this.element.classList.remove('stoneRemoveable');
        }
        this._removeable = newRemoveable;
    }

    /**
     * Returns true if stone is placed on the field.
     */
    get isPlaced() : boolean {
        return this.field != null;
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

    /**
     * Creates a stone of the given color.
     * @param {number} color - Color of the stone (0: black, 1: white).
     * @constructor
     */
    constructor (color : number, position : FieldPosition)
    {
        this._color = color;
        
        this._element = document.createElement('div');
        this.position = position; // after creating the div element we can set the position
        this._element.setAttribute('class', color==1 ? 'stoneWhite' : 'stoneBlack');
        if (Game.enemyAIRandomSleepTime <= 200) {
            // instant transition moving stones
            this._element.classList.add("stoneMoveInstant");
            
        } else if (Game.enemyAIRandomSleepTime <= 400) {
            // fast transition
            this._element.classList.add("stoneMoveFast");
        }

        // set random offset so all stones look different
        this._element.style.backgroundPosition = Math.random()*8 + 'vmin, ' + Math.random()*8 + 'vmin';
        gameBoard.appendChild(this._element);

        this._element.onclick = () => this.OnClicked(); // lambda expression to avoid complications with 'this'
    }

    /**
     * Updates stone properties and style converning moveable and removeable.
     */
    UpdateProperties() : void {
        // Mark stones that can be moved
        this.moveable = Game.phase == 2 && this.color == Game.currentPlayer && this.isMoveable;
        // Mark stones that can be removed and highlight the stone currently hovered
        this.removeable = Game.phase == 3 && this.color != Game.currentPlayer && !this.isInClosedMill && this.isPlaced;
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

    Remove() : void {
        if (this.field) this.field.owner = null;
        this.field = null;
        this.element.remove();
    }
}