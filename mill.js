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
        setTimeout(function () { currAI.MakeMoveIntern(); }, Game.enemyAIRandomSleepTime);
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
        GameBoard.UpdateProperties();
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
     * Triggers the winner screen after a game.
     */
    Game.ShowWinnerScreen = function () {
        Game.phase = 4;
        GameBoard.UpdateProperties();
        winnerScreenText.innerText = (Game.currentPlayer == 1 ? "White" : "Black") + " wins!";
        winnerScreen.style.display = 'table';
    };
    /**
     * Triggers the draw screen after a game.
     */
    Game.ShowDrawScreen = function () {
        Game.phase = 5;
        GameBoard.UpdateProperties();
        winnerScreenText.innerText = "Game is drawn!";
        winnerScreen.style.display = 'table';
    };
    /** Set if a player is played by computer */
    Game.playerAI = [null, null];
    /** How long AI will sleep before deciding its next move */
    Game.enemyAIRandomSleepTime = 500; // ms
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
            this.UpdateProperties();
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
        // only need to create fields once as they do not change
        if (!this.gameFields) {
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
        }
        // remove old stones from html
        if (this.stones)
            this.stones.forEach(function (arr) { return arr.forEach(function (s) { return s.Remove(); }); });
        // create stones and place them next to the game board
        this.stones = [new Array(9), new Array(9)];
        for (var _i = 0, _a = [0, 1]; _i < _a.length; _i++) {
            var color = _a[_i];
            for (var i = 0; i < 9; i++) {
                this.stones[color][i] = new GameStone(color, { x: 7 - 8 * color, y: 6 / 8 * i });
            }
        }
        this.activeStone = this.stones[Game.currentPlayer][8];
        // Update stones and fields
        this.UpdateProperties();
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
     * Updates properties and style of fields and stones.
     */
    GameBoard.UpdateProperties = function () {
        this.gameFields.forEach(function (f) { return f.UpdateProperties(); });
        this.stones.forEach(function (a) { return a.forEach(function (s) { return s.UpdateProperties(); }); });
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
        this.stones[stone.color].splice(this.stones[stone.color].indexOf(stone), 1);
        stone.Remove();
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
                Game.ShowWinnerScreen();
                return true;
            }
            // Check if there are any enemy stones that can be removed.
            // If not no stone can be removed and next player continues.
            if (this.GetStonesOnField(1 - Game.currentPlayer).some(function (s) { return !s.isInClosedMill; })) {
                this.lastGamePhase = Game.phase; // to go back after removal
                Game.phase = 3; // Remove stone for closed Muehle
                this.activeStone = null;
                // Update stone and field properties
                this.UpdateProperties();
                // Check if current player is AI and if so let him move
                // Need to call this manually here as player is not switching.
                this.TryAIMove();
                return true;
            }
        }
        // check for game draw
        if (this.CheckAndUpdateDraw()) {
            Game.ShowDrawScreen();
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
            Game.ShowWinnerScreen();
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
        // Update stone and field properties
        this.UpdateProperties();
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
        var _this = this;
        this._element = document.createElement('div');
        this.position = { x: xPos, y: yPos }; // after creating the div element we can set the position
        this._element.setAttribute('class', 'field');
        gameBoard.appendChild(this._element);
        this._element.onclick = function () { return _this.OnClicked(); }; // lambda expression to avoid complications with 'this'
    }
    Object.defineProperty(GameField.prototype, "position", {
        /** Position of the field on the board in whole numbers. */
        get: function () {
            return this._position;
        },
        set: function (newPos) {
            this._position = newPos;
            if (this.element) {
                this.element.style.transform = 'translate(' + (newPos.x - 3) * 10 + 'vmin, ' + (newPos.y - 3) * 10 + 'vmin)';
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameField.prototype, "element", {
        /**
         * The DIV element representing this field.
         */
        get: function () {
            return this._element;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameField.prototype, "accessible", {
        /**
         * can a stone be moved onto the field
         */
        get: function () {
            return this._accessible;
        },
        set: function (newAccessible) {
            if (newAccessible) {
                this.element.classList.add('fieldMoveable');
            }
            else {
                this.element.classList.remove('fieldMoveable');
            }
            this._accessible = newAccessible;
        },
        enumerable: true,
        configurable: true
    });
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
    /**
     * Updates field properties and style converning accessible.
     */
    GameField.prototype.UpdateProperties = function () {
        this.accessible = (Game.phase == 1 && !this.owner) ||
            (Game.phase == 2 && GameBoard.activeStone && this.CanStoneMoveTo(GameBoard.activeStone));
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
    function GameStone(color, position) {
        var _this = this;
        this._position = null;
        this._active = false;
        this._moveable = false;
        this._removeable = false;
        /**
         * field on which the stone currently is placed if any
         */
        this.field = null;
        this._color = color;
        this._element = document.createElement('div');
        this.position = position; // after creating the div element we can set the position
        this._element.setAttribute('class', color == 1 ? 'stoneWhite' : 'stoneBlack');
        if (Game.enemyAIRandomSleepTime <= 200) {
            // instant transition moving stones
            this._element.classList.add("stoneMoveInstant");
        }
        else if (Game.enemyAIRandomSleepTime <= 400) {
            // fast transition
            this._element.classList.add("stoneMoveFast");
        }
        // set random offset so all stones look different
        this._element.style.backgroundPosition = Math.random() * 8 + 'vmin, ' + Math.random() * 8 + 'vmin';
        gameBoard.appendChild(this._element);
        this._element.onclick = function () { return _this.OnClicked(); }; // lambda expression to avoid complications with 'this'
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
    Object.defineProperty(GameStone.prototype, "position", {
        /**
         * position of the stone in whole numbers
         */
        get: function () {
            return this._position;
        },
        set: function (newPos) {
            this._position = newPos;
            if (this.element) {
                this.element.style.transform = 'translate(' + (newPos.x - 3) * 10 + 'vmin, ' + (newPos.y - 3) * 10 + 'vmin)';
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameStone.prototype, "element", {
        /**
         * The DIV element representing this stone.
         */
        get: function () {
            return this._element;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameStone.prototype, "active", {
        /**
         * telling if the stone is the active one
         */
        get: function () {
            return this._active;
        },
        set: function (newActive) {
            if (newActive) {
                this.element.classList.add('stoneActive');
            }
            else {
                this.element.classList.remove('stoneActive');
            }
            this._active = newActive;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameStone.prototype, "moveable", {
        /**
         * can the stone be moved
         */
        get: function () {
            return this._moveable;
        },
        set: function (newMoveable) {
            if (newMoveable) {
                this.element.classList.add('stoneMoveable');
            }
            else {
                this.element.classList.remove('stoneMoveable');
            }
            this._moveable = newMoveable;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameStone.prototype, "removeable", {
        /**
         * can the stone be removed
         */
        get: function () {
            return this._removeable;
        },
        set: function (newRemoveable) {
            if (newRemoveable) {
                this.element.classList.add('stoneRemoveable');
            }
            else {
                this.element.classList.remove('stoneRemoveable');
            }
            this._removeable = newRemoveable;
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
    /**
     * Updates stone properties and style converning moveable and removeable.
     */
    GameStone.prototype.UpdateProperties = function () {
        // Mark stones that can be moved
        this.moveable = Game.phase == 2 && this.color == Game.currentPlayer && this.isMoveable;
        // Mark stones that can be removed and highlight the stone currently hovered
        this.removeable = Game.phase == 3 && this.color != Game.currentPlayer && !this.isInClosedMill && this.isPlaced;
    };
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
    GameStone.prototype.Remove = function () {
        if (this.field)
            this.field.owner = null;
        this.field = null;
        this.element.remove();
    };
    return GameStone;
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
        gameBoard.style.display = 'block';
        winnerScreen.style.display = 'none';
    };
    /**
     * Reset game and show menu.
     */
    Menu.ReturnToMenu = function () {
        Game.Reset();
        gameMenu.style.display = 'block';
        gameBoard.style.display = 'none';
        winnerScreen.style.display = 'none';
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
            Game.enemyAIRandomSleepTime = time;
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
// Define variables to globally gameBoard and gameMenu
var gameMenu;
var gameBoard;
var winnerScreen;
var winnerScreenText;
/**
 * This function is called when page finished loading.
 */
function onLoad() {
    gameMenu = document.getElementById("gameMenu");
    gameBoard = document.getElementById("gameBoard");
    winnerScreen = document.getElementById("winnerScreen");
    winnerScreenText = document.getElementById("winnerScreenText");
    Game.Reset();
}
//# sourceMappingURL=mill.js.map