var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * Stupid AI implementation using random selection among all possibilities.
 */
var EnemyAIRandom = (function () {
    function EnemyAIRandom(_color) {
        this.color = _color;
    }
    EnemyAIRandom.prototype.MakeMove = function () {
        if (Game.currentPlayer != this.color) {
            // this should not be necessary but just in case lets log if it happens
            console.error("[AI] Current player is not AI.");
            return false;
        }
        // Wait the given time before executing actual move calculation
        var currAI = this;
        setTimeout(function () { currAI.MakeMoveIntern(); }, Settings.enemyAIRandomSleepTime);
    };
    EnemyAIRandom.prototype.MakeMoveIntern = function () {
        switch (Game.phase) {
            case 1:
                // get possible fields where new stone can be placed at
                var possibleFields = GameBoard.gameFields.filter(function (f) { return !f.owner; });
                if (possibleFields.length < 1) {
                    console.error("[AI] No fields to place stone at.");
                    return false;
                }
                // select random field and place active stone
                var field = possibleFields[Math.floor(Math.random() * possibleFields.length)];
                GameBoard.MoveCurrentStoneToField(field);
                return true;
            case 2:
                // this should not happen but check if there are stones on the field
                if (!GameBoard.GetStonesOnField(this.color)) {
                    console.error("[AI] No own stones exist.");
                    return false;
                }
                // get moveable stones
                var moveableStones = GameBoard.GetStonesOnField(this.color).filter(function (s) { return s.isMoveable; });
                if (moveableStones.length < 1) {
                    console.error("[AI] No moveable stones available.");
                    return false;
                }
                // select random stone
                var stone = moveableStones[Math.floor(Math.random() * moveableStones.length)];
                // get possible fields where the stone can move to
                var possibleFields = GameBoard.gameFields.filter(function (f) { return f.CanStoneMoveTo(stone); });
                // again this should not have happend as only moveable stones are used
                if (possibleFields.length < 1) {
                    console.error("[AI] No fields to move stone to.");
                    return false;
                }
                // select random field and move stone on it
                var field = possibleFields[Math.floor(Math.random() * possibleFields.length)];
                return GameBoard.MoveStoneToField(stone, field);
            case 3:
                // should not happen but check if enemy has stones
                if (!GameBoard.GetStonesOnField(1 - this.color)) {
                    console.error("[AI] No enemy stones exist.");
                    return false;
                }
                // get all removeable enemy stones
                var removeableStones = GameBoard.GetStonesOnField(1 - this.color).filter(function (s) { return !s.isInClosedMill; });
                if (removeableStones.length < 1) {
                    console.error("[AI] No removeable stones available.");
                    return false;
                }
                // select a random stone and remove it
                var stone = removeableStones[Math.floor(Math.random() * removeableStones.length)];
                return GameBoard.RemoveStoneFromField(stone);
            default:
                // normally this should not happen as AI is not called then but if, log it
                console.error("[AI] No action possible at game phase " + Game.phase + "!");
                return false;
        }
    };
    return EnemyAIRandom;
}());
/**
 * Primitive AI implementing some basic rules for creating mills etc.
 */
var EnemyAIPrimitive = (function (_super) {
    __extends(EnemyAIPrimitive, _super);
    function EnemyAIPrimitive() {
        _super.apply(this, arguments);
    }
    // as extending random AI wie only need to override this function
    EnemyAIPrimitive.prototype.MakeMoveIntern = function () {
        switch (Game.phase) {
            case 1: // place stones
            case 2:
                var moveableStones = void 0;
                if (Game.phase == 1 && (GameBoard.activeStone && GameBoard.activeStone.color == this.color)) {
                    moveableStones = [GameBoard.activeStone];
                }
                else if (Game.phase == 2) {
                    moveableStones = GameBoard.GetStonesOnField(this.color).filter(function (s) { return s.isMoveable; });
                }
                else {
                    // gamePhase 1 and no/wrong active stone
                    console.error("[AI] Could not retrieve moveable stones.");
                    return false;
                }
                if (moveableStones.length < 1) {
                    console.error("[AI] No moveable stones available.");
                    return false;
                }
                // Greedy method of making own mills
                // Look for the first possibility to close a mill
                var preferredStone = null;
                var preferredField = null;
                for (var _i = 0, moveableStones_1 = moveableStones; _i < moveableStones_1.length; _i++) {
                    var stone = moveableStones_1[_i];
                    var possibleFields = GameBoard.gameFields.filter(function (f) { return f.CanStoneMoveTo(stone); });
                    for (var _a = 0, possibleFields_1 = possibleFields; _a < possibleFields_1.length; _a++) {
                        var field = possibleFields_1[_a];
                        if (EnemyAIPrimitive.wouldBeMuehle(field, stone)) {
                            preferredField = field;
                            preferredStone = stone;
                            break;
                        }
                    }
                    if (preferredStone)
                        break;
                }
                // If a possibility is found, take it
                if (preferredStone && preferredField)
                    return GameBoard.MoveStoneToField(preferredStone, preferredField);
                // Greedy method to avoid enemy mills
                // First get all fields where enemy can potentially close a mill within his next move
                var enemyStones = GameBoard.stones[1 - this.color]; // need all stones (not only the placed ones)
                var badFields = new Array();
                for (var _b = 0, enemyStones_1 = enemyStones; _b < enemyStones_1.length; _b++) {
                    var stone = enemyStones_1[_b];
                    var possibleFields = GameBoard.gameFields.filter(function (f) { return f.CanStoneMoveTo(stone); });
                    for (var _c = 0, possibleFields_2 = possibleFields; _c < possibleFields_2.length; _c++) {
                        var field = possibleFields_2[_c];
                        if (EnemyAIPrimitive.wouldBeMuehle(field, stone)) {
                            badFields.push(field);
                        }
                    }
                }
                // Check all own moveable stones if one can prohibit this
                preferredStone = null;
                preferredField = null;
                for (var _d = 0, badFields_1 = badFields; _d < badFields_1.length; _d++) {
                    var field = badFields_1[_d];
                    for (var _e = 0, moveableStones_2 = moveableStones; _e < moveableStones_2.length; _e++) {
                        var stone = moveableStones_2[_e];
                        if (field.CanStoneMoveTo(stone)) {
                            preferredField = field;
                            preferredStone = stone;
                            break;
                        }
                    }
                    if (preferredField)
                        break;
                }
                // If one is found, move him there
                if (preferredStone && preferredField)
                    return GameBoard.MoveStoneToField(preferredStone, preferredField);
                // Try to build 2 stones together to be able to build a mill
                if (Game.phase == 1) {
                    var possibleFields = new Array();
                    // Get all fields who are empty and have one own stone and another free field in its row/column
                    GameBoard.GetStonesOnField(this.color).forEach(function (stone) {
                        // check for horizontal candidates
                        if (stone.field.neighborLeft) {
                            if (stone.field.neighborRight) {
                                // current stone is placed in the middle of a row
                                if (!stone.field.neighborLeft.owner && !stone.field.neighborRight.owner) {
                                    // left and right neighbors are empty -> possible candidates
                                    possibleFields.push(stone.field.neighborLeft);
                                    possibleFields.push(stone.field.neighborRight);
                                }
                            }
                            else if (stone.field.neighborLeft.neighborLeft) {
                                // stone is placed on the right field of a row
                                if (!stone.field.neighborLeft.owner && !stone.field.neighborLeft.neighborLeft.owner) {
                                    // both fields on the left are empty -> possible candidates
                                    possibleFields.push(stone.field.neighborLeft);
                                    possibleFields.push(stone.field.neighborLeft.neighborLeft);
                                }
                            }
                        }
                        else if (stone.field.neighborRight && stone.field.neighborRight.neighborRight) {
                            // stone is placed on the left field of a row
                            if (!stone.field.neighborRight.owner && !stone.field.neighborRight.neighborRight.owner) {
                                // both right neighbors are empty -> possible candidates
                                possibleFields.push(stone.field.neighborRight);
                                possibleFields.push(stone.field.neighborRight.neighborRight);
                            }
                        }
                        // check for vertical candidates
                        if (stone.field.neighborTop) {
                            if (stone.field.neighborBottom) {
                                // current stone is placed in the middle of a column
                                if (!stone.field.neighborTop.owner && !stone.field.neighborBottom.owner) {
                                    //top and bottom neighbors are empty -> possible candidates
                                    possibleFields.push(stone.field.neighborTop);
                                    possibleFields.push(stone.field.neighborBottom);
                                }
                            }
                            else if (stone.field.neighborTop.neighborTop) {
                                // stone is placed at the bottom of a column
                                if (!stone.field.neighborTop.owner && !stone.field.neighborTop.neighborTop.owner) {
                                    // both fields at the top are empty -> possible candidates
                                    possibleFields.push(stone.field.neighborTop);
                                    possibleFields.push(stone.field.neighborTop.neighborTop);
                                }
                            }
                        }
                        else if (stone.field.neighborBottom && stone.field.neighborBottom.neighborBottom) {
                            // stone is placed at the top of a column
                            if (!stone.field.neighborBottom.owner && !stone.field.neighborBottom.neighborBottom.owner) {
                                // both bottom neighbors are empty -> possible candidates
                                possibleFields.push(stone.field.neighborBottom);
                                possibleFields.push(stone.field.neighborBottom.neighborBottom);
                            }
                        }
                    });
                    // if a possible field is found select one randomly and move stone there
                    if (possibleFields.length > 1) {
                        var field = possibleFields[Math.floor(Math.random() * possibleFields.length)];
                        return GameBoard.MoveCurrentStoneToField(field);
                    }
                }
                break;
        }
        // if no preferable moves were found just call the method from the random AI this class extends
        return _super.prototype.MakeMoveIntern.call(this);
    };
    /**
     * Helper method to determine if placing/moving a stone onto a field would cause a horizontal mill.
     * @param {GameField} field - The field on which the stone may be placed.
     * @param {GameStone} stone - The stone that may be placed on the field.
     * @returns {boolean} indicating if moving stone on field would create a horizontal mill.
     */
    EnemyAIPrimitive.WouldBeMuehleHorizontal = function (field, stone) {
        // If no neighbors no mill possible
        if (!field.neighborLeft && !field.neighborRight)
            return false;
        // Cannot make a mill if e.g. XOO -> OXO because function thinks XOO is already 2 so lets place the middle stone O on the left
        // Thus this case has to be excluded manually
        if ((field.neighborLeft && field.neighborLeft.owner == stone)
            || (field.neighborRight && field.neighborRight.owner == stone))
            return false;
        if (!field.neighborLeft && field.neighborRight.neighborRight)
            // Field has two right neighbors -> check if both are occupied by stones of the right color
            return field.neighborRight.owner && field.neighborRight.owner.color == stone.color
                && field.neighborRight.neighborRight.owner && field.neighborRight.neighborRight.owner.color == stone.color;
        if (!field.neighborRight && field.neighborLeft.neighborLeft)
            // Field has two left neighbors -> same check here
            return field.neighborLeft.owner && field.neighborLeft.owner.color == stone.color
                && field.neighborLeft.neighborLeft.owner && field.neighborLeft.neighborLeft.owner.color == stone.color;
        // If reaching this code a left and a right neighbor exists -> similar check here
        return field.neighborLeft && field.neighborRight
            && field.neighborLeft.owner && field.neighborLeft.owner.color == stone.color
            && field.neighborRight.owner && field.neighborRight.owner.color == stone.color;
    };
    /**
     * Helper method to determine if placing/moving a stone onto a field would cause a vertical mill.
     * @param {GameField} field - The field on which the stone may be placed.
     * @param {GameStone} stone - The stone that may be placed on the field.
     * @returns {boolean} indicating if moving stone on field would create a vertical mill.
     */
    EnemyAIPrimitive.wouldBeMuehleVertical = function (field, stone) {
        // If no neighbors no mill possible
        if (!field.neighborTop && !field.neighborBottom)
            return false;
        // Have to exclude the case where stone is moved within the column so effectively nothing changes
        if ((field.neighborTop && field.neighborTop.owner == stone)
            || (field.neighborBottom && field.neighborBottom.owner == stone))
            return false;
        if (!field.neighborTop && field.neighborBottom.neighborBottom)
            // Field has two lower neighbors -> check if both are occupied by stones of the right color
            return field.neighborBottom.owner && field.neighborBottom.owner.color == stone.color
                && field.neighborBottom.neighborBottom.owner && field.neighborBottom.neighborBottom.owner.color == stone.color;
        if (!field.neighborBottom && field.neighborTop.neighborTop)
            // Field has two top neighbors -> same check
            return field.neighborTop.owner && field.neighborTop.owner.color == stone.color
                && field.neighborTop.neighborTop.owner && field.neighborTop.neighborTop.owner.color == stone.color;
        // Field has one upper and one lower neighbor -> same check
        return field.neighborTop && field.neighborBottom
            && field.neighborTop.owner && field.neighborTop.owner.color == stone.color
            && field.neighborBottom.owner && field.neighborBottom.owner.color == stone.color;
    };
    /**
     * Helper method to determine if placing/moving a stone onto a field would cause a mill.
     * @param {GameField} field - The field on which the stone may be placed.
     * @param {GameStone} stone - The stone that may be placed on the field.
     * @returns {boolean} indicating if moving stone on field would create a mill.
     */
    EnemyAIPrimitive.wouldBeMuehle = function (field, stone) {
        return this.WouldBeMuehleHorizontal(field, stone) || this.wouldBeMuehleVertical(field, stone);
    };
    return EnemyAIPrimitive;
}(EnemyAIRandom));
/**
 * Static class providing the current game state and general functions to control the game.
 */
var Game = (function () {
    function Game() {
    }
    /**
     * Reset and start new game.
     */
    Game.Start = function () {
        Game.Reset();
        Game.phase = 1;
        PaintHelper.Clear();
        GameBoard.Paint();
        GameBoard.TryAIMove();
    };
    /**
     * Reset game and set phase to menu.
     */
    Game.Reset = function () {
        // Create new AI players
        if (Game.playerAI[0])
            Game.playerAI[0] = new EnemyAIPrimitive(0);
        if (Game.playerAI[1])
            Game.playerAI[1] = new EnemyAIPrimitive(1);
        Game.phase = 0; // menu
        Game.turn = 0;
        Game.currentPlayer = 1; // white
        GameBoard.Initialize();
    };
    /**
     * Function that is called regularly to paint on canvas etc.
     */
    Game.Loop = function () {
        // Updating canvas dimensions
        Game.ResizeScreen();
        switch (Game.phase) {
            case 0:
                break;
            case 1: // Placing stones
            case 2: // Moving stones
            case 3:
                PaintHelper.Clear();
                GameBoard.Paint();
                break;
            case 4: // Winner Screen
            case 5:
                var showText = "Game is drawn!";
                if (Game.phase == 4)
                    showText = (Game.currentPlayer == 1 ? "White" : "Black") + " wins!";
                PaintHelper.Clear();
                GameBoard.Paint();
                PaintHelper.FillRectangle(0, 0, canvas.width, canvas.height, 'rgba(225,225,225,0.85)');
                PaintHelper.DrawText(3, 3, showText, 'large', 'black', 'center');
                PaintHelper.DrawText(3, 4, '(Click anywhere to go to menu.)', 'normal', 'black', 'center');
                break;
        }
    };
    /**
     * Updating canvas HTML dimensions to fit with the CSS values necessary for displaying the canvas correctly.
     */
    Game.ResizeScreen = function () {
        canvas.height = canvas.scrollHeight;
        canvas.width = canvas.scrollWidth;
    };
    Game.playerAI = [null, null]; // set if a player is played by computer
    return Game;
}());
/**
 * Static class implementing the game board and providing most of the game logic and features.
 */
var GameBoard = (function () {
    function GameBoard() {
    }
    Object.defineProperty(GameBoard, "activeStone", {
        /** specifies the active stone */
        get: function () {
            return this._activeStone;
        },
        set: function (newStone) {
            // setting a new active stone will reset active property of old active stone
            if (this._activeStone)
                this._activeStone.active = false;
            this._activeStone = newStone;
            if (newStone)
                newStone.active = true;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Initializes/Resets the game board for a new game
     */
    GameBoard.Initialize = function () {
        this.lastTurnMill = -1;
        this.hashForDraw = [];
        // Game board built up from left to right and up to down
        this.gameFields = [
            new GameField(0, 0),
            new GameField(3, 0),
            new GameField(6, 0),
            new GameField(1, 1),
            new GameField(3, 1),
            new GameField(5, 1),
            new GameField(2, 2),
            new GameField(3, 2),
            new GameField(4, 2),
            new GameField(0, 3),
            new GameField(1, 3),
            new GameField(2, 3),
            new GameField(4, 3),
            new GameField(5, 3),
            new GameField(6, 3),
            new GameField(2, 4),
            new GameField(3, 4),
            new GameField(4, 4),
            new GameField(1, 5),
            new GameField(3, 5),
            new GameField(5, 5),
            new GameField(0, 6),
            new GameField(3, 6),
            new GameField(6, 6),
        ];
        // same index means pair -> left and right neighbor (horizontal connections)
        var nachbarL = [0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22];
        var nachbarR = [1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 22, 23];
        for (var i = 0; i < nachbarL.length; i++) {
            GameBoard.gameFields[nachbarL[i]].neighborRight = GameBoard.gameFields[nachbarR[i]];
            GameBoard.gameFields[nachbarR[i]].neighborLeft = GameBoard.gameFields[nachbarL[i]];
        }
        // same for vertical connections
        var nachbarT = [0, 9, 3, 10, 6, 11, 1, 4, 16, 19, 8, 12, 5, 13, 2, 14];
        var nachbarB = [9, 21, 10, 18, 11, 15, 4, 7, 19, 22, 12, 17, 13, 20, 14, 23];
        for (var i = 0; i < nachbarT.length; i++) {
            GameBoard.gameFields[nachbarT[i]].neighborBottom = GameBoard.gameFields[nachbarB[i]];
            GameBoard.gameFields[nachbarB[i]].neighborTop = GameBoard.gameFields[nachbarT[i]];
        }
        // create stones and place them next to the game board
        this.stones = [new Array(Settings.stoneCountPerPlayer), new Array(Settings.stoneCountPerPlayer)];
        for (var _i = 0, _a = [0, 1]; _i < _a.length; _i++) {
            var color = _a[_i];
            for (var i = 0; i < Settings.stoneCountPerPlayer; i++) {
                this.stones[color][i] = new GameStone(color);
                this.stones[color][i].position = { x: 7 - 8 * color, y: 6 / (Settings.stoneCountPerPlayer - 1) * i };
            }
        }
        this.activeStone = this.stones[Game.currentPlayer][Settings.stoneCountPerPlayer - 1];
    };
    /**
     * Returns all stones of a given color that are placed on the field.
     * @param {number} stonecolor - Color of the placed stones to return.
     * @returns {Array<GameStone>} an array with all placed stones of a given color.
     */
    GameBoard.GetStonesOnField = function (stonecolor) {
        return this.stones[stonecolor].filter(function (s) { return s.isPlaced; });
    };
    /**
     * Places a stone on a given field.
     * @param {GameStone} stone - The stone to move.
     * @param {GameField} field - The field where to move the stone.
     */
    GameBoard.PlaceStoneAtField = function (stone, field) {
        if (field.owner != null) {
            console.error("Cannot place stone on field that is already occupied!");
            return;
        }
        if (stone.field)
            stone.field.owner = null; // reset owner of old field
        field.owner = stone;
        stone.position = field.position;
        stone.field = field;
        this.activeStone = stone;
        this.CheckMuehleSwitchPlayer();
    };
    /**
     * Places the active stone at the given field.
     * @param {GameField} field - The field to move the active stone to.
     */
    GameBoard.PlaceCurrentStoneAtField = function (field) {
        this.PlaceStoneAtField(this.activeStone, field);
    };
    /**
     * Moves a stone to a given fields if possible.
     * @param {GameStone} stone - The stone to move.
     * @param {GameField} field - The field to move the stone to.
     * @returns {boolean} if the move was possible and thus performed.
     */
    GameBoard.MoveStoneToField = function (stone, field) {
        if (!field.CanStoneMoveTo(stone))
            return false;
        this.PlaceStoneAtField(stone, field);
        return true;
    };
    /**
     * Move the active stone to a given field if possible.
     * @param {GameField} field - The field to move the stone to.
     * @returns {boolean} if the move was possible and thus performed.
     */
    GameBoard.MoveCurrentStoneToField = function (field) {
        if (!this.activeStone || !field.CanStoneMoveTo(this.activeStone))
            return false;
        this.PlaceCurrentStoneAtField(field);
        return true;
    };
    /**
     * Remove the given stone from the board if possible.
     * @ param {GameStone} stone - The stone to be removed.
     * @ returns {boolean} if the stone could be removed.
     */
    GameBoard.RemoveStoneFromField = function (stone) {
        if (!stone.field || stone.isInClosedMill || Game.phase != 3) {
            return false; // protected stone
        }
        stone.field.owner = null;
        this.stones[stone.color].splice(this.stones[stone.color].indexOf(stone), 1);
        // Go back to the last game phase before removing a stone
        Game.phase = this.lastGamePhase;
        this.SwitchCurrentPlayer();
        return true;
    };
    /**
     * Check if mill exist or game is drawn, and if not then switch players.
     * @returns {boolean} if a mill existed.
     */
    GameBoard.CheckMuehleSwitchPlayer = function () {
        if (this.activeStone && this.activeStone.isInClosedMill) {
            // update last turn where mill was closed -> for Remis decision
            this.lastTurnMill = Game.turn;
            if (Game.phase == 2 && this.stones[1 - Game.currentPlayer].length <= 3) {
                // mill created and enemy has only 3 stones left -> player wins
                Game.phase = 4;
                return true;
            }
            // Check if there are any enemy stones that can be removed.
            // If not no stone can be removed and next player continues.
            if (this.GetStonesOnField(1 - Game.currentPlayer).some(function (s) { return !s.isInClosedMill; })) {
                this.lastGamePhase = Game.phase; // to go back after removal
                Game.phase = 3; // Remove stone for closed Muehle
                this.activeStone = null;
                // Check if current player is AI and if so let him move
                // Need to call this manually here as player is not switching.
                this.TryAIMove();
                return true;
            }
        }
        // check for game draw
        if (this.CheckAndUpdateDraw()) {
            Game.phase = 5;
            return false;
        }
        this.SwitchCurrentPlayer();
        return false;
    };
    /**
     * Method to switch active player.
     */
    GameBoard.SwitchCurrentPlayer = function () {
        // Check if next player can move some stones
        if (Game.turn >= 17 && !this.GetStonesOnField(1 - Game.currentPlayer).some(function (s) { return s.isMoveable; })) {
            // no moves possible anymore
            Game.phase = 4;
            return;
        }
        // Check if phase has to switch from placing to moving stones
        if (Game.phase == 1 && Game.turn >= 17) {
            Game.phase = 2;
            GameBoard.activeStone = null;
        }
        // Switch players, reset active stone and increment turn counter
        Game.currentPlayer = 1 - Game.currentPlayer;
        this.activeStone = this.GetUnsettledStone(Game.currentPlayer); // returns null if no unsettled stones
        Game.turn++;
        // Check if its AIs turn
        this.TryAIMove();
    };
    /**
     * Returns a stone of a given color that is not placed yet.
     * @param {number} color - Color of the stone to return.
     * @returns {GameStone} the unsettled stone or null of none present.
     */
    GameBoard.GetUnsettledStone = function (color) {
        var unsettledStones = this.stones[Game.currentPlayer].filter(function (s) { return !s.isPlaced; });
        if (unsettledStones.length < 1)
            return null;
        return unsettledStones[unsettledStones.length - 1];
    };
    /**
     * Checks if the current player is AI and if so calls its MakeMove() method.
     * @returns {boolean} if the AI made a move.
     */
    GameBoard.TryAIMove = function () {
        if (Game.playerAI[Game.currentPlayer])
            return Game.playerAI[Game.currentPlayer].MakeMove();
        return false;
    };
    /**
     * Checks if game is draw and updates game board placements list.
     * @returns {boolean} if game is draw.
     */
    GameBoard.CheckAndUpdateDraw = function () {
        // draw if 50 moves without a mill
        if (Game.turn - this.lastTurnMill >= 50) {
            return true;
        }
        // update placement datalist
        var curState = this.CurrentStateToNumber();
        // check if this is the third time the same field
        if (!this.hashForDraw[curState]) {
            this.hashForDraw[curState] = 1;
        }
        else if (++this.hashForDraw[curState] >= 3) {
            return true;
        }
        return false; // no draw
    };
    /**
     * Returns a unique number representing the stones on the current game board.
     * Can be used as a hash to identify the current game board placement.
     * Remark: This is only possible if 64bit number representation is used as 3^24 > 2^32.
     * @returns {number} the unique number of the current game board.
     */
    GameBoard.CurrentStateToNumber = function () {
        return this.gameFields.map(function (f, i) { return Math.pow(3, i) * (f.owner ? (f.owner.color == 1 ? 2 : 1) : 0); }).reduce(function (a, b) { return a + b; }, 0);
    };
    /**
     * Draws the game board and stones on the canvas.
     */
    GameBoard.Paint = function () {
        var fieldLineWidth = Settings.fieldLineWidthFactor * this.fieldLength;
        var stoneBorderWidth = Settings.stoneBorderWidthFactor * this.fieldLength;
        var context = canvas.getContext('2d');
        //  Draw connecting lines between game fields
        for (var _i = 0, _a = GameBoard.gameFields; _i < _a.length; _i++) {
            var field = _a[_i];
            var realPos = this.GetRealPosition(field.position);
            // Only have to draw lines to right and bottom neighbors (left and top equivalents exist)
            if (field.neighborRight) {
                var realPosNeighbor = this.GetRealPosition(field.neighborRight.position);
                PaintHelper.DrawLine(realPos.x, realPos.y, realPosNeighbor.x, realPosNeighbor.y, fieldLineWidth, Settings.fieldColor);
            }
            if (field.neighborBottom) {
                var realPosNeighbor = this.GetRealPosition(field.neighborBottom.position);
                PaintHelper.DrawLine(realPos.x, realPos.y, realPosNeighbor.x, realPosNeighbor.y, fieldLineWidth, Settings.fieldColor);
            }
        }
        // Draw fields
        for (var _b = 0, _c = GameBoard.gameFields; _b < _c.length; _b++) {
            var field = _c[_b];
            field.Paint();
        }
        // Draw stones
        for (var _d = 0, _e = [0, 1]; _d < _e.length; _d++) {
            var color = _e[_d];
            for (var _f = 0, _g = GameBoard.stones[color]; _f < _g.length; _f++) {
                var stone = _g[_f];
                stone.Paint();
            }
        }
    };
    /**
     * Returns the real position (in px) of a field position (typically integer values).
     * The field position is measured in fieldLength starting at (0,0) at the center of the top left field.
     * @param {Position2} intPos - The position on the game board.
     * @returns {Position2} (in px) the position on the canvas.
     */
    GameBoard.GetRealPosition = function (intPos) {
        var fieldLength = this.fieldLength;
        var offsetX = (canvas.width - fieldLength * 7) / 2;
        var offsetY = (canvas.height - fieldLength * 7) / 2;
        return { x: offsetX + (intPos.x + 0.5) * fieldLength,
            y: offsetY + (intPos.y + 0.5) * fieldLength };
    };
    /**
     * Inverse function of GetRealPosition().
     * @param {Position2} realPos - (in px) The position on the canvas.
     * @returns {Position2} the position on the game board in whole numbers.
     */
    GameBoard.getFieldPosition = function (realPos) {
        var fieldLength = this.fieldLength;
        var offsetX = (canvas.width - fieldLength * 7) / 2;
        var offsetY = (canvas.height - fieldLength * 7) / 2;
        return { x: Math.floor((realPos.x - offsetX) / fieldLength),
            y: Math.floor((realPos.y - offsetX) / fieldLength) };
    };
    Object.defineProperty(GameBoard, "fieldLength", {
        /** The length of a game field. Many settings/figures are measured in this unit. */
        get: function () {
            // 9/7 as we need 9 fields horizontal including two columns for stones placed outside the field.
            return Math.min(canvas.height / 7.0, canvas.width / 9.0);
        },
        enumerable: true,
        configurable: true
    });
    return GameBoard;
}());
/**
 * Class implementing game fields where stone can be placed.
 */
var GameField = (function () {
    /**
     * Creates a game field for the specified position. Neighbors have to be set later.
     * @param {number} xPos - X coordinate of position on screen in whole numbers.
     * @param {number} yPos - Y coordinate of position on screen in whole numbers.
     * @constructor
     */
    function GameField(xPos, yPos) {
        this.position = { x: xPos, y: yPos };
    }
    Object.defineProperty(GameField.prototype, "isClosedMillHorizontal", {
        /** Returns true if a horizontal mill is established using this field. */
        get: function () {
            if (!this.owner || (!this.neighborLeft && !this.neighborRight))
                return false;
            if (!this.neighborLeft)
                return this.neighborRight.neighborRight && this.neighborRight.isClosedMillHorizontal;
            if (!this.neighborRight)
                return this.neighborLeft.neighborLeft && this.neighborLeft.isClosedMillHorizontal;
            return this.neighborLeft.owner && this.neighborLeft.owner.color == this.owner.color
                && this.neighborRight.owner && this.neighborRight.owner.color == this.owner.color;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameField.prototype, "isClosedMillVertical", {
        /** Returns true if a vertical mill is established using this field. */
        get: function () {
            if (!this.owner || (!this.neighborTop && !this.neighborBottom))
                return false;
            if (!this.neighborTop)
                return this.neighborBottom.neighborBottom && this.neighborBottom.isClosedMillVertical;
            if (!this.neighborBottom)
                return this.neighborTop.neighborTop && this.neighborTop.isClosedMillVertical;
            return this.neighborTop.owner && this.neighborTop.owner.color == this.owner.color
                && this.neighborBottom.owner && this.neighborBottom.owner.color == this.owner.color;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameField.prototype, "isHovered", {
        /** Returns true if the mouse is hovering over the field. */
        get: function () {
            var stoneRadius = Settings.stoneRadiusFactor * GameBoard.fieldLength;
            var realPos = GameBoard.GetRealPosition(this.position);
            var mousePos = InputController.mousePosition;
            return Math.pow(realPos.x - mousePos.x, 2) + Math.pow(realPos.y - mousePos.y, 2) <= Math.pow(stoneRadius, 2);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Method painting the game field on the canvas.
     */
    GameField.prototype.Paint = function () {
        var color = Settings.fieldColor;
        if (Game.playerAI[Game.currentPlayer]) {
        }
        else if (Game.phase == 1 && !this.owner && this.isHovered) {
            // Stone can placed on this field and is hovered
            // (we do not mark all fields as this is clear and gives no information, also looks nicer)
            color = Settings.fieldColorHover;
        }
        else if (Game.phase == 2 && GameBoard.activeStone && this.CanStoneMoveTo(GameBoard.activeStone)) {
            // Active stone can be moved to this field, so mark it or shot if it is hovered
            if (this.isHovered) {
                color = Settings.fieldColorHover;
            }
            else {
                color = Settings.fieldColorMoveable;
            }
        }
        var pos = GameBoard.GetRealPosition(this.position);
        PaintHelper.FillCircle(pos.x, pos.y, Settings.fieldRadiusFactor * GameBoard.fieldLength, color);
    };
    /**
     * Method called if clicked on the game field.
     */
    GameField.prototype.OnClicked = function () {
        // If stone is placed on field redirect click to stone
        if (this.owner)
            return this.owner.OnClicked();
        switch (Game.phase) {
            case 1:
                if (GameBoard.activeStone && !this.owner)
                    // Active stone can be placed on the field
                    GameBoard.MoveCurrentStoneToField(this);
                else
                    return false;
                break;
            case 2:
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
    };
    /**
     * Checks if a given stone can move to the current field.
     * @param {GameStone} stone - The stone that needs to be checked.
     * @returns {boolean} indicating if a stone can moved on the field.
     */
    GameField.prototype.CanStoneMoveTo = function (stone) {
        // cannot move here if field is already occupied
        if (this.owner)
            return false;
        return !stone.isPlaced
            || GameBoard.GetStonesOnField(stone.color).length == 3
            || (this.neighborBottom && this.neighborBottom.owner == stone)
            || (this.neighborLeft && this.neighborLeft.owner == stone)
            || (this.neighborRight && this.neighborRight.owner == stone)
            || (this.neighborTop && this.neighborTop.owner == stone);
    };
    return GameField;
}());
/**
 * Class implementing game stones.
 */
var GameStone = (function () {
    /**
     * Creates a stone of the given color.
     * @param {number} color - Color of the stone (0: black, 1: white).
     * @constructor
     */
    function GameStone(farbe) {
        this._color = farbe;
        this.position = { x: -1, y: -1 }; // set initial position to (-1,-1) - does not matter
        this.active = false;
        // set random patternOffset so all stones look different
        this.patternOffset = { x: Math.floor(Math.random() * 201), y: Math.floor(Math.random() * 201) };
    }
    Object.defineProperty(GameStone.prototype, "color", {
        /**
         * color of the stone (readonly)
         */
        get: function () {
            return this._color;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameStone.prototype, "isPlaced", {
        /**
         * Returns true if stone is placed on the field.
         */
        get: function () {
            return this.field != null;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Paint the stone on the canvas.
     */
    GameStone.prototype.Paint = function () {
        var stoneBorderWidth = Settings.stoneBorderWidthFactor * GameBoard.fieldLength;
        var stoneBorderColor = this.color == 1 ? Settings.stoneWhiteBorderColor : Settings.stoneBlackBorderColor;
        if (this.active) {
            // Active stone
            stoneBorderColor = Settings.stoneBorderColorActive;
            stoneBorderWidth *= Settings.stoneBorderMarkedFactor;
        }
        else if (Game.phase == 2 && this.isHovered && this.isMoveable && this.color == Game.currentPlayer && !Game.playerAI[Game.currentPlayer]) {
            // Hovered stone that can be moved by human player
            stoneBorderColor = Settings.stoneBorderColorHovered;
            stoneBorderWidth *= Settings.stoneBorderMarkedFactor;
        }
        else if (Game.phase == 2 && this.color == Game.currentPlayer && this.isMoveable) {
            // Mark stones that can be moved
            stoneBorderColor = Settings.stoneBorderColorMoveable;
            stoneBorderWidth *= Settings.stoneBorderMarkedFactor;
        }
        else if (Game.phase == 3 && this.color != Game.currentPlayer && !this.isInClosedMill && this.isPlaced) {
            // Mark stones that can be removed and highlight the stone currently hovered
            if (this.isHovered && !Game.playerAI[Game.currentPlayer])
                stoneBorderColor = Settings.stoneBorderColorRemoveableHovered;
            else
                stoneBorderColor = Settings.stoneBorderColorRemoveable;
            stoneBorderWidth *= Settings.stoneBorderMarkedFactor;
        }
        var realPos = GameBoard.GetRealPosition(this.position);
        PaintHelper.FillCirclePattern(realPos.x, realPos.y, Settings.stoneRadiusFactor * GameBoard.fieldLength, imgStonePattern[this.color], stoneBorderColor, stoneBorderWidth, this.patternOffset);
    };
    Object.defineProperty(GameStone.prototype, "isHovered", {
        /**
         * Returns true if the stone is currently hovered by mouse.
         */
        get: function () {
            var stoneRadius = Settings.stoneRadiusFactor * GameBoard.fieldLength;
            var realPos = GameBoard.GetRealPosition(this.position);
            var mousePos = InputController.mousePosition;
            return Math.pow(realPos.x - mousePos.x, 2) + Math.pow(realPos.y - mousePos.y, 2) <= Math.pow(stoneRadius, 2);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Method called if clicked on stone.
     * @returns {boolean} if click was consumed by the stone or not.
     */
    GameStone.prototype.OnClicked = function () {
        if (Game.phase == 2 && Game.currentPlayer == this.color && this.isMoveable) {
            // Stone can be moved -> activate him
            GameBoard.activeStone = this;
            return true;
        }
        else if (Game.phase == 3 && Game.currentPlayer != this.color && !this.isInClosedMill) {
            // Stone can be removed -> do it
            GameBoard.RemoveStoneFromField(this);
            return true;
        }
        return false;
    };
    Object.defineProperty(GameStone.prototype, "isMoveable", {
        /**
         * Returns true if the stone can be moved on the field.
         */
        get: function () {
            return GameBoard.stones[this.color].length == 3 || (this.field && ((this.field.neighborBottom && !this.field.neighborBottom.owner)
                || (this.field.neighborLeft && !this.field.neighborLeft.owner)
                || (this.field.neighborRight && !this.field.neighborRight.owner)
                || (this.field.neighborTop && !this.field.neighborTop.owner)));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameStone.prototype, "isInClosedMill", {
        /**
         * Returns true if the stone is currently in a closed mill.
         */
        get: function () {
            return this.field && (this.field.isClosedMillHorizontal || this.field.isClosedMillVertical);
        },
        enumerable: true,
        configurable: true
    });
    return GameStone;
}());
/**
 * Class that handles mouse input.
 */
var InputController = (function () {
    function InputController() {
    }
    Object.defineProperty(InputController, "mousePosition", {
        /**
         * Current mouse position relative to the canvas.
         */
        get: function () {
            return InputController._mousePos;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Initialize the controller by registering mouse handlers;
     */
    InputController.InitController = function () {
        canvas.addEventListener('mousemove', this.RegisterMouseMove, false);
        canvas.addEventListener("mouseout", this.RegisterMouseOut, false);
        canvas.addEventListener("click", this.RegisterMouseClick, false);
    };
    /**
     * Event handler that is called if mouse is moved inside the canvas.
     */
    InputController.RegisterMouseMove = function (evt) {
        // Retrieve and internally store mouse position.
        var rect = canvas.getBoundingClientRect();
        InputController._mousePos = {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };
    /**
     * Event handler that is called if mouse is moved out of the canvas.
     */
    InputController.RegisterMouseOut = function (evt) {
        // Set mouse position to (0,0) so no elements are hovered anymore.
        InputController._mousePos = { x: 0, y: 0 };
    };
    /**
     * Event handler that is called if mouse click inside canvas is registered.
     */
    InputController.RegisterMouseClick = function (evt) {
        // If winning screen we only need to detect if it was clicked somewhere
        if (Game.phase == 4 || Game.phase == 5) {
            Menu.ReturnToMenu();
            return;
        }
        // No input possible/necessary if active player is AI
        if (Game.playerAI[Game.currentPlayer])
            return;
        // Forward click to fields that may be concerned about
        for (var _i = 0, _a = GameBoard.gameFields; _i < _a.length; _i++) {
            var field = _a[_i];
            if (field.isHovered && field.OnClicked())
                return;
        }
    };
    InputController._mousePos = { x: 0, y: 0 };
    return InputController;
}());
/**
 * Static class providing functions to comfortably draw figures on the canvas.
 */
var PaintHelper = (function () {
    function PaintHelper() {
    }
    /**
     * Draws a circle with given properties on the canvas.
     * @param {number} centerX - (in px) The x coordinate of the circles middle.
     * @param {number} centerY - (in px) The y coordinate of the circles middle.
     * @param {number} radius - (in px) The radius of the circle.
     * @param {string} filling - The fillStyle property of the context.
     * @param {string} [border] - If set a border is drawn with the strokeStyle property being this value.
     * @param {number} [borderWidth] - (in px) The border width if set, otherwise 3px is chosen.
     */
    PaintHelper.FillCircle = function (centerX, centerY, radius, filling, border, borderWidth) {
        var context = canvas.getContext('2d');
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        context.fillStyle = filling;
        context.fill();
        if (border) {
            if (borderWidth) {
                context.lineWidth = borderWidth;
            }
            else {
                context.lineWidth = 3;
            }
            context.strokeStyle = border;
            context.stroke();
        }
    };
    /**
     * Draws a circle with given properties on the canvas filled by a given pattern.
     * @param {number} centerX - (in px) The x coordinate of the circles middle.
     * @param {number} centerY - (in px) The y coordinate of the circles middle.
     * @param {number} radius - (in px) The radius of the circle.
     * @param {CanvasPattern} pattern - The pattern to fill the circle with.
     * @param {string} [border] - If set a border is drawn with the strokeStyle property being this value.
     * @param {number} [borderWidth] - (in px) The border width if set, otherwise 3px is chosen.
     * @param {Position2} [patternOffset] - (in {px,px}) If specified, sets the offset of the pattern to the given constant value.
     *      Otherwise pattern is dependent on position on the screen.
     */
    PaintHelper.FillCirclePattern = function (centerX, centerY, radius, pattern, border, borderWidth, patternOffset) {
        var context = canvas.getContext('2d');
        if (patternOffset) {
            // By translating the context same offset will result in the same clipping..
            // In the other case same centerX,centerY will result in the same clipping
            // meaning that a moving object will result in a moving cutting but the pattern being fixed in the background.
            context.save();
            context.translate(centerX + patternOffset.x, centerY + patternOffset.y);
        }
        context.beginPath();
        if (patternOffset) {
            context.arc(-patternOffset.x, -patternOffset.y, radius, 0, 2 * Math.PI, false);
        }
        else {
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        }
        context.fillStyle = pattern;
        context.fill();
        if (border) {
            if (borderWidth) {
                context.lineWidth = borderWidth;
            }
            else {
                context.lineWidth = 3;
            }
            context.strokeStyle = border;
            context.stroke();
        }
        if (patternOffset) {
            // translate context back to its original position
            context.restore();
        }
    };
    /**
     * Draws a straight line between two points.
     * @param {number} fromX - (in px) The x coordinate of the starting point.
     * @param {number} fromY - (in px) The y coordinate of the starting point.
     * @param {number} toX - (in px) The x coordinate of the ending point.
     * @param {number} toY - (in px) The y coordinate of the ending point.
     * @param {number} [width] - (in px) The width of the line. If none given, default/last value is used.
     * @param {string} [color] - The strokeStyle property of the context, for example a color.
     */
    PaintHelper.DrawLine = function (fromX, fromY, toX, toY, width, color) {
        var context = canvas.getContext('2d');
        context.beginPath();
        context.moveTo(fromX, fromY);
        context.lineTo(toX, toY);
        if (width) {
            context.lineWidth = width;
        }
        if (color) {
            context.strokeStyle = color;
        }
        context.stroke();
    };
    /**
     * Draws a filled rectangle on the canvas.
     * @param {number} x - (in px) The x coordinate of the top left corner.
     * @param {number} y - (in px) The y coordinate of the top left corner.
     * @param {number} width - (in px) The width of the rectangle.
     * @param {number} height - (in px) The height of the rectangle.
     * @param {number} width - (in px) The width of the border line.
     * @param {string} [color] - The strokeStyle property of the context, for example a color.
     */
    PaintHelper.FillRectangle = function (x, y, width, height, color) {
        var context = canvas.getContext('2d');
        if (color) {
            context.fillStyle = color;
        }
        context.fillRect(x, y, width, height);
    };
    /**
     * Draws text on the canvas.
     * @param {number} x - (in px) The x coordinate where to place the text.
     * @param {number} y - (in px) The y coordinate where to place the text.
     * @param {string} text - The text to be drawn.
     * @param {string} [font] - If given, specifies the font property. Special values 'normal' and 'large' exist.
     * @param {string} [color] - The fillStyle property of the context, for example a color.
     * @param {string} [textAlign] - The textAlign property being able to center text or make it right-aligned.
     */
    PaintHelper.DrawText = function (x, y, text, font, color, textAlign) {
        var context = canvas.getContext('2d');
        if (font) {
            if (font == 'normal')
                context.font = Math.floor(GameBoard.fieldLength * Settings.textSizeNormalMultiplier) + 'px Calibri';
            else if (font == 'large') {
                context.font = 'bold ' + Math.floor(GameBoard.fieldLength * Settings.textSizeBigMultiplier) + 'px Arial';
                text = text.toUpperCase();
            }
            else
                context.font = font;
        }
        if (textAlign) {
            context.textAlign = textAlign;
        }
        if (color) {
            context.fillStyle = color;
        }
        var realPos = GameBoard.GetRealPosition({ x: x, y: y });
        context.fillText(text, realPos.x, realPos.y);
    };
    /**
     * Removes everything drawn onto the canvas.
     */
    PaintHelper.Clear = function () {
        var context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    };
    return PaintHelper;
}());
/**
 * Static class that stores all settings for the game in a central place.
 */
var Settings = (function () {
    function Settings() {
    }
    /** How long between two calls of Game.Loop() */
    Settings.gameLoopInterval = 100; // ms
    /** How long AI will sleep before deciding its next move */
    Settings.enemyAIRandomSleepTime = 500; // ms
    /** Path to pattern image of black stone */
    Settings.stoneBlackImageSource = 'pictures/marmor3s.jpg';
    /** Path to pattern image of white stone */
    Settings.stoneWhiteImageSource = 'pictures/marmor4s.jpg';
    /** Radius of stones in units of 1 fieldLength */
    Settings.stoneRadiusFactor = 0.4; // in fieldLength
    /** Width of stone border in units of 1 fieldLength */
    Settings.stoneBorderWidthFactor = 0.02; // in fieldLength
    /** Factor to which the stone borders increase if marked */
    Settings.stoneBorderMarkedFactor = 3; // in normal thickness
    /** Border color of normal white stones */
    Settings.stoneWhiteBorderColor = '#000000';
    /** Border color of normal black stones */
    Settings.stoneBlackBorderColor = '#ffffff';
    /** Border color of the active stone */
    Settings.stoneBorderColorActive = '#ff7700';
    /** Border color of hovered stones */
    Settings.stoneBorderColorHovered = '#dd4400';
    /** Border color of stones marked to be moveable */
    Settings.stoneBorderColorMoveable = '#00ff00';
    /** Border color of stones that can be removed */
    Settings.stoneBorderColorRemoveable = '#ff0000';
    /** Border color of stones that can be removed and are hovered */
    Settings.stoneBorderColorRemoveableHovered = '#ff7777';
    /** Radius of game fields in units of 1 fieldLength */
    Settings.fieldRadiusFactor = 0.1; // in fieldLength
    /** Width of game board lines in units of 1 fieldLength */
    Settings.fieldLineWidthFactor = 0.05; // in fieldLength
    /** Color of normal game fields */
    Settings.fieldColor = '#000000';
    /** Color of hovered fields */
    Settings.fieldColorHover = '#00aa00';
    /** Color of fields where stones can move to */
    Settings.fieldColorMoveable = '#44ff00';
    /** Number of stones per player at the beginning */
    Settings.stoneCountPerPlayer = 9;
    /** Text size of big text in units of 1 fieldLength */
    Settings.textSizeBigMultiplier = 0.85; // in fieldLength
    /** Text size of normal text in units of 1 fieldLength */
    Settings.textSizeNormalMultiplier = 0.46; // in fieldLength
    return Settings;
}());
/**
 * Implementing functions necessary for the menu.
 */
var Menu = (function () {
    function Menu() {
    }
    /**
     * Start new game and show game canvas.
     */
    Menu.StartGame = function () {
        Game.Start();
        gameMenu.style.display = 'none';
        canvas.style.display = 'block';
    };
    /**
     * Reset game and show menu.
     */
    Menu.ReturnToMenu = function () {
        Game.Reset();
        gameMenu.style.display = 'block';
        canvas.style.display = 'none';
    };
    /**
     * This function is called if a menu setting is changed and updates the game values.
     */
    Menu.ReadSettings = function () {
        // get input elements from the menu
        var checkboxWhite = document.getElementById('whiteAI');
        var checkboxBlack = document.getElementById('blackAI');
        var inputAITime = document.getElementById('AItime');
        if (!checkboxWhite || !checkboxBlack || !inputAITime) {
            console.error("Could not find all menu elements!");
            return;
        }
        if (checkboxWhite.checked) {
            // White is played by AI
            if (!Game.playerAI[1])
                Game.playerAI[1] = new EnemyAIPrimitive(1);
        }
        else {
            Game.playerAI[1] = null;
        }
        if (checkboxBlack.checked) {
            // Black is played by AI
            if (!Game.playerAI[0])
                Game.playerAI[0] = new EnemyAIPrimitive(0);
        }
        else {
            Game.playerAI[0] = null;
        }
        var time = Number(inputAITime.value);
        if (!isNaN(time)) {
            if (time < 0) {
                inputAITime.value = "0";
                time = 0;
            }
            else if (time > 9999) {
                inputAITime.value = "9999";
                time = 9999;
            }
            else if (Math.floor(time) != time) {
                inputAITime.value = Math.floor(time).toString();
                time = Math.floor(time);
            }
            Settings.enemyAIRandomSleepTime = time;
        }
        else {
            // no valid number -> reset field
            inputAITime.value = "";
        }
    };
    return Menu;
}());
/**
 * GLOBAL TODO:
 * - Langfristig Canvas durch reine HTML Objekte ersetzen -> Alle Anzeigeeigenschaften in CSS, hover etc
 * - Regeln in eigene Klasse ausgliedern -> besserer Überblick / Struktur
 * - FieldPosition und RealPosition interfaces erstellen, die Position2 ersetzen und eindeutiger zuweisbar sind.
 */
// Define variables to globally access canvas, context and gameMenu
var canvas;
var context;
var gameMenu;
// Store if images have been loaded -> start game only if finished loading
var elementLoaded = new Array();
var imgStone = [new Image(200, 200), new Image(200, 200)];
var imgStonePattern;
/**
 * This function is called when page finished loading.
 */
function onLoad() {
    gameMenu = document.getElementById("gameMenu");
    canvas = document.getElementById("myCanvas");
    context = canvas.getContext("2d");
    // need to initially set width and height property of canvas correctly
    Game.ResizeScreen();
    // load necessary images
    imgStone.forEach(function (e) { return e.onload = addElementToLoad(); });
    imgStone[0].src = Settings.stoneBlackImageSource;
    imgStone[1].src = Settings.stoneWhiteImageSource;
    // check if images are already loaded
    checkLoadedFinish();
}
/**
 * Function checks if all elements are loaded and if so, onAllElementsLoaded() is called.
 * Otherwise 100ms later another check will be performed.
 */
function checkLoadedFinish() {
    if (everyElementLoaded()) {
        onAllElementsLoaded();
    }
    else {
        setTimeout(checkLoadedFinish, 100);
    }
}
/**
 * Function is executed if checkLoadedFinish() was called and all images/resources are loaded.
 */
function onAllElementsLoaded() {
    // create patterns from loaded images
    imgStonePattern = imgStone.map(function (img) { return context.createPattern(img, 'repeat'); });
    // activate mouse input detection
    InputController.InitController();
    // reset game and start the game loop where canvas is redrawn etc.
    Game.Reset();
    window.setInterval(Game.Loop, Settings.gameLoopInterval);
}
/**
 * Function adds a new element to the list of elements to load.
 * @returns {() => void} event handler for the onload event of the element that is loaded.
 */
function addElementToLoad() {
    elementLoaded.push(false);
    var idx = elementLoaded.length - 1;
    return function () { elementLoaded[idx] = true; };
}
/**
 * Checks if all elements added finished loading.
 * @returns {boolean} true iff all elements added by addElementToLoad() called the belonging onload event handler.
 */
function everyElementLoaded() {
    return elementLoaded.map(function (e) { return e ? 1 : 0; }).reduce(function (a, b) { return a + b; }) == elementLoaded.length;
}
//# sourceMappingURL=mill.js.map