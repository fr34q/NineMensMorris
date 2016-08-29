var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * Class for storing game information for the alpha beta algorithm.
 */
var GameNode = (function () {
    /**
     *  Creates a class for storing a game state.
     */
    function GameNode() {
        this.stones = [new Array(24), new Array(24)];
        // if undefined !(..) will result as true like expected from false -> can leave out explicit definition
    }
    /**
     * Makes a copy of the game state.
     * @returns {GameNode} the copy of the game state.
     */
    GameNode.prototype.Clone = function () {
        var node = new GameNode();
        // need to copy stones different as it is otherwise only referenced
        node.stones = [this.stones[0].slice(0), this.stones[1].slice(0)];
        node.currentPlayer = this.currentPlayer;
        node.gameTurn = this.gameTurn;
        node.gamePhase = this.gamePhase;
        return node;
    };
    /**
     * Creates a GameNode with state of the current game board.
     * @returns {GameNode} the current game board state.
     */
    GameNode.GetFromCurrentBoard = function () {
        var node = new GameNode();
        node.currentPlayer = Game.currentPlayer;
        node.gameTurn = Game.turn;
        node.gamePhase = Game.phase;
        GameBoard.gameFields.forEach(function (f, i) {
            if (f.owner)
                node.stones[f.owner.color][i] = true;
        });
        return node;
    };
    /**
     * Get neighbor fields of a specific field.
     * @param {number} field Field number to determine the neighbors of.
     * @returns {Array<number>} all neighbors of the given field.
     */
    GameNode.GetNeighbors = function (field) {
        // less copy paste code, less probability of copying mistakes
        return [
            GameNode.neighborLeft[field],
            GameNode.neighborRight[field],
            GameNode.neighborTop[field],
            GameNode.neighborBottom[field]
        ].filter(function (num) { return num !== null; });
    };
    /**
     * Get all fields that are in the same row as the specified field.
     * @param {number} field Field number to determine the neighbors of.
     * @returns {Array<number>} all row neighbors of the given field.
     */
    GameNode.GetNeighborsRow = function (field) {
        return [
            GameNode.neighborLeft[field],
            GameNode.neighborRight[field],
            GameNode.neighborLeft[GameNode.neighborLeft[field]],
            GameNode.neighborRight[GameNode.neighborRight[field]]
        ].filter(function (num) { return num !== null && num !== undefined; });
    };
    /**
     * Get all fields that are in the same column as the specified field.
     * @param {number} field Field number to determine the neighbors of.
     * @returns {Array<number>} all column neighbors of the given field.
     */
    GameNode.GetNeighborsColumn = function (field) {
        return [
            GameNode.neighborTop[field],
            GameNode.neighborBottom[field],
            GameNode.neighborTop[GameNode.neighborTop[field]],
            GameNode.neighborBottom[GameNode.neighborBottom[field]]
        ].filter(function (num) { return num !== null && num !== undefined; });
    };
    /**
     * Get all fields that are not occupied by a stone.
     * @returns {Array<number>} all unoccupied fields.
     */
    GameNode.prototype.GetEmptyFields = function () {
        var _this = this;
        return indices(24).filter(function (num) { return !_this.FieldIsOccupied(num); });
    };
    /**
     * Get all fields that are occupied by a stone of the given color.
     * @returns {Array<number>} all fields with stone of given color.
     */
    GameNode.prototype.GetFieldsWithStone = function (color) {
        var _this = this;
        return indices(24).filter(function (num) { return _this.stones[color][num]; });
    };
    /**
     * Gets the color of the stone on a specific field.
     * @param {number} field The field where the stone is placed.
     * @returns {StoneColor} the stone color or null if not occupied.
     */
    GameNode.prototype.GetColorOnField = function (field) {
        if (this.stones[StoneColor.Black][field])
            return StoneColor.Black;
        if (this.stones[StoneColor.White][field])
            return StoneColor.White;
        return null;
    };
    /**
     * Determines if a field is occupied.
     * @param {number} field The field to check.
     * @returns {booleab} if there is a stone on the given field.
     */
    GameNode.prototype.FieldIsOccupied = function (field) {
        return this.stones[StoneColor.White][field] || this.stones[StoneColor.Black][field];
    };
    /**
     * Get list of all possible moves at the current game state.
     * @returns {Array<GameMove>} all possible moves.
     */
    GameNode.prototype.GetPossibleMoves = function () {
        var _this = this;
        if (this.GetWinner() !== null)
            return []; // game ended -> no more moves
        switch (this.gamePhase) {
            case 1:
                return this.GetEmptyFields().map(function (fieldNum) { return ({
                    phase: _this.gamePhase,
                    from: null,
                    to: fieldNum
                }); });
            case 2:
                return this.GetFieldsWithStone(this.currentPlayer).map(function (fieldNum) { return (
                // if only 3 stones left player can jump and reach any empty field
                // otherwise only neighbor fields that are not occupied
                (_this.GetFieldsWithStone(_this.currentPlayer).length <= 3 ?
                    _this.GetEmptyFields() :
                    GameNode.GetNeighbors(fieldNum)
                        .filter(function (num) { return !_this.FieldIsOccupied(num); })).map(function (fieldNumTo) { return ({
                    phase: _this.gamePhase,
                    from: fieldNum,
                    to: fieldNumTo
                }); })); }).reduce(function (a, b) { return a.concat(b); });
            case 3:
                return this.GetFieldsWithStone(1 - this.currentPlayer) // get fields where enemy has stones
                    .filter(function (num) { return !_this.CheckMill(num); }) // can remove only free stones
                    .map(function (fieldNum) { return ({
                    phase: _this.gamePhase,
                    from: fieldNum,
                    to: null
                }); });
            default:
                return [];
        }
    };
    /**
     * Perform a certain move on the current game state and updating all information.
     * @param {GameMove} move The move to perform.
     * @returns {boolean} if the move could be performed.
     */
    GameNode.prototype.PerformMove = function (move) {
        if (move.phase != this.gamePhase) {
            console.error("[AI] move not fitting to current game phase.");
            return false;
        }
        if (this.GetWinner() != null) {
            console.error("[AI] game already ended so no more moves possible.");
            return false;
        }
        switch (this.gamePhase) {
            case 1:
                // check if move has right format and field where to go is empty
                if (move.from !== null || move.to === null || this.FieldIsOccupied(move.to)) {
                    console.error("[AI] game move has wrong values");
                    return false;
                }
                this.stones[this.currentPlayer][move.to] = true;
                this.IncrementAndUpdate(move.to);
                break;
            case 2:
                // check format and if there is a stone that can be moved onto an empty field
                if (move.from === null || move.to === null || this.FieldIsOccupied(move.to)
                    || !this.stones[this.currentPlayer][move.from]) {
                    console.error("[AI] game move has wrong values");
                    return false;
                }
                this.stones[this.currentPlayer][move.from] = false;
                this.stones[this.currentPlayer][move.to] = true;
                this.IncrementAndUpdate(move.to);
                break;
            case 3:
                // check format and if there is an enemy stone that is not in a mill and can be removed
                if (move.from == null || move.to != null || !this.stones[1 - this.currentPlayer][move.from] || this.CheckMill(move.from)) {
                    console.error("[AI] game move has wrong values");
                    return false;
                }
                this.stones[1 - this.currentPlayer][move.from] = false;
                this.IncrementAndUpdate(move.from);
                break;
            default:
                console.error("[AI] Move in game phase " + move.phase + " could not be performed.");
                return false;
        }
        return true;
    };
    /**
     * Reverses a performed move and sets the game state to the move before that state.
     * Especially useful if only one GameNode will represent the game state and different
     * options shall be tried.
     * @param {GameMove} move The move to be undone.
     * @returns {boolean} if the move could be undone.
     */
    GameNode.prototype.UndoMove = function (move) {
        // if a stone should be removed right now the current player closed a mill in the last turn
        // and so no players were switched
        var lastPlayer = this.gamePhase == 3 ? this.currentPlayer : 1 - this.currentPlayer;
        switch (move.phase) {
            case 1:
                // check format and if there is a stone that can be unplaced
                if (move.from != null || move.to == null || !this.stones[lastPlayer][move.to]) {
                    console.error("[AI] Move cannot be undone, wrong format. (1)");
                    return false;
                }
                this.stones[lastPlayer][move.to] = false;
                break;
            case 2:
                // check format and if stone can moved back 
                if (move.from == null || move.to == null || !this.stones[lastPlayer][move.to]
                    || this.FieldIsOccupied(move.from)) {
                    console.error("[AI] Move cannot be undone, wrong format. (2)");
                    return false;
                }
                this.stones[lastPlayer][move.from] = true;
                this.stones[lastPlayer][move.to] = false;
                break;
            case 3:
                // check format and if there is no stone were it was removed
                if (move.from == null || move.to != null || this.FieldIsOccupied(move.from)) {
                    console.error("[AI] Move cannot be undone, wrong format. (3)");
                    return false;
                }
                this.stones[1 - lastPlayer][move.from] = true;
                break;
            default:
                console.error("[AI] Move in game phase " + move.phase + " could not be undone.");
                return false;
        }
        // otherwise last game state was closing a mill -> no game turn decrement or player switch
        if (this.gamePhase != 3)
            this.gameTurn--;
        this.currentPlayer = lastPlayer;
        this.gamePhase = move.phase;
        return true;
    };
    /**
     * This function increments the game turn and updates game state.
     * @param {number} field The field the last stone was placed on or removed from.
     */
    GameNode.prototype.IncrementAndUpdate = function (field) {
        var _this = this;
        // check if mill was closed and enemy has any stones to remove or only 3 stones left
        if (this.gamePhase != 3 && this.CheckMill(field) && (this.GetFieldsWithStone(1 - this.currentPlayer)
            .some(function (fieldNum) { return !_this.CheckMill(fieldNum); })
            || this.GetFieldsWithStone(1 - this.currentPlayer).length <= 3)) {
            this.gamePhase = 3;
            // no game turn increment / player switch
            return;
        }
        // update game state information
        this.gamePhase = (this.gameTurn < 17) ? 1 : 2;
        this.gameTurn++;
        this.currentPlayer = 1 - this.currentPlayer;
    };
    /**
     * Check if the stone on the current field is involved in a horizontal mill.
     * @param {number} field The field to check.
     * @returns {boolean} if a horizontal mill is found on the field.
     */
    GameNode.prototype.CheckMillHorizontal = function (field) {
        var _this = this;
        var color = this.GetColorOnField(field);
        if (color === null)
            return false; // no stone on field
        // returns if all other fields in the same row carry a stone of the same color
        return GameNode.GetNeighborsRow(field).every(function (neighbor) { return _this.stones[color][neighbor]; });
    };
    /**
     * Check if the stone on the current field is involved in a vertical mill.
     * @param {number} field The field to check.
     * @returns {boolean} if a vertical mill is found on the field.
     */
    GameNode.prototype.CheckMillVertical = function (field) {
        var _this = this;
        var color = this.GetColorOnField(field);
        if (color === null)
            return false; // no stone on field
        // returns if all other fields in the same column carry a stone of the same color
        return GameNode.GetNeighborsColumn(field).every(function (neighbor) { return _this.stones[color][neighbor]; });
    };
    /**
     * Check if the stone on the current field is involved in a mill.
     * @param {number} field The field to check.
     * @returns {boolean} if a mill is found.
     */
    GameNode.prototype.CheckMill = function (fieldnum) {
        return this.CheckMillHorizontal(fieldnum) || this.CheckMillVertical(fieldnum);
    };
    /**
     * Check if a stone if the given color can be placed on the specified field
     * and if this would result in a closed horizontal mill.
     * @param {number} field The field to check.
     * @param {StoneColor} color The player for which to check for potential mills.
     * @returns {boolean} if a potential horizontal mill is found.
     */
    GameNode.prototype.PotentialMillHorizontal = function (field, color) {
        var _this = this;
        if (this.FieldIsOccupied(field))
            return false; // field has to be empty
        // returns if all other fields in the same row carry a stone of the specified color
        return GameNode.GetNeighborsRow(field).every(function (neighbor) { return _this.stones[color][neighbor]; });
    };
    /**
     * Check if a stone if the given color can be placed on the specified field
     * and if this would result in a closed vertical mill.
     * @param {number} field The field to check.
     * @param {StoneColor} color The player for which to check for potential mills.
     * @returns {boolean} if a potential vertical mill is found.
     */
    GameNode.prototype.PotentialMillVertical = function (field, color) {
        var _this = this;
        if (this.FieldIsOccupied(field))
            return false; // field has to be empty
        // returns if all other fields in the same column carry a stone of the specified color
        return GameNode.GetNeighborsColumn(field).every(function (neighbor) { return _this.stones[color][neighbor]; });
    };
    /**
     * Check if a stone if the given color can be placed on the specified field
     * and if this would result in a closed mill.
     * @param {number} field The field to check.
     * @param {StoneColor} color The player for which to check for potential mills.
     * @returns {boolean} if a potential mill is found.
     */
    GameNode.prototype.PotentialMill = function (field, color) {
        return this.PotentialMillHorizontal(field, color) || this.PotentialMillVertical(field, color);
    };
    /**
     * Gets the winner of the current game if any.
     * @returns {number} The winner or null if none.
     */
    GameNode.prototype.GetWinner = function () {
        var _this = this;
        // check if mill was closed and enemy has only 3 stones left
        if (this.gamePhase == 3 && this.gameTurn > 17 && this.stones[1 - this.currentPlayer].filter(function (b) { return b; }).length <= 3)
            return this.currentPlayer;
        if (this.gamePhase == 2 && this.stones[this.currentPlayer].filter(function (b) { return b; }).length > 3)
            // check if there are moveable stones left, so if any stone has a free neighbor field
            return this.GetFieldsWithStone(this.currentPlayer).some(function (fieldNum) {
                return GameNode.GetNeighbors(fieldNum).some(function (neighbor) { return !_this.FieldIsOccupied(neighbor); });
            }) ? null : 1 - this.currentPlayer; // in the latter no stone can move so other player wins
        return null;
    };
    /**
     * Get the rating of the current game state.
     * @param {number} color The color of the player for which the store should be obtained.
     * @returns {number} the score of the game state.
     */
    GameNode.prototype.GetRating = function (color) {
        // Rating procedure follows roughly:
        // https://kartikkukreja.wordpress.com/2014/03/17/heuristicevaluation-function-for-nine-mens-morris/
        // Calculate store always for currentPlayer and switch sign later
        // mill closed for currentPlayer
        var criteria1 = this.gamePhase == 3 ? 1 : 0;
        // difference mills
        var criteria2 = this.NumberOfMills(this.currentPlayer) - this.NumberOfMills(1 - this.currentPlayer);
        // difference between blocked stones
        var criteria3 = this.NumberOfBlockedStones(1 - this.currentPlayer) - this.NumberOfBlockedStones(this.currentPlayer);
        // difference between number of stones
        var criteria4 = this.stones[this.currentPlayer].filter(function (b) { return b; }).length
            - this.stones[1 - this.currentPlayer].filter(function (b) { return b; }).length;
        // difference between number of 2-piece configurations
        var criteria5 = this.NumberOfTwoPieceConfs(this.currentPlayer) - this.NumberOfTwoPieceConfs(1 - this.currentPlayer);
        // difference between number of 3-piece configurations
        var criteria6 = this.NumberOfThreePieceConfs(this.currentPlayer) - this.NumberOfThreePieceConfs(1 - this.currentPlayer);
        // difference between number of open double mills
        var criteria7 = this.NumberOfOpenDoubleMills(this.currentPlayer) - this.NumberOfOpenDoubleMills(1 - this.currentPlayer);
        // difference between number of open mills
        var criteria8 = this.NumberOfOpenMills(this.currentPlayer) - this.NumberOfOpenMills(1 - this.currentPlayer);
        // winning configurations
        var winner = this.GetWinner();
        var criteria9 = (winner == null) ? 0 : (winner == this.currentPlayer ? 1 : -1);
        var rating = 0;
        if (this.gamePhase == 1 || (this.gamePhase == 3 && this.gameTurn < 18)) {
            // while placing stones
            rating = 100 * criteria1 + 26 * criteria2 + 30 * criteria3 + 9 * criteria4 + 10 * criteria5 + 7 * criteria6;
        }
        else if (this.gamePhase == 2 || (this.gamePhase == 3 && this.gameTurn >= 18)) {
            // stones are moving
            rating = 500 * criteria1 + 43 * criteria2 + 30 * criteria3 + 11 * criteria4 + 1000 * criteria7 + 500 * criteria8 + 500000 * criteria9;
        }
        if (this.gameTurn >= 18 && (this.GetFieldsWithStone(StoneColor.White).length <= 3 || this.GetFieldsWithStone(StoneColor.Black).length <= 3)) {
            // one player has only 3 stones left additional weighting of some criteria
            rating += 100 * criteria5 + 500 * criteria6;
        }
        // switch sign depending on the player
        rating *= color == this.currentPlayer ? 1 : -1;
        return rating;
    };
    /**
     * Returns the number of two piece configurations a particular player has.
     * A two piece configuration is one that forms a closed mill if a stone is added.
     * @param {number} player The player for which to count the configurations.
     * @returns {number} the number of two piece configurations.
     */
    GameNode.prototype.NumberOfTwoPieceConfs = function (player) {
        var _this = this;
        return this.GetEmptyFields().filter(function (fieldNum) { return _this.PotentialMillVertical(fieldNum, player); }).length
            + this.GetEmptyFields().filter(function (fieldNum) { return _this.PotentialMillHorizontal(fieldNum, player); }).length;
    };
    /**
     * Returns the number of three piece configurations a particular player has.
     * A three piece configuration is one where there are two possibilities to
     * add a stone that would close a mill.
     * @param {number} player The player for which to count the configurations.
     * @returns {number} the number of three piece configurations.
     */
    GameNode.prototype.NumberOfThreePieceConfs = function (player) {
        var _this = this;
        // we check if a stone has an empty field in horizontal direction that could cause a mill
        // and if furthermore in vertical direction there is also an empty field that satisfy this
        // take own stones and select those that fulfil this (edge stones)
        return this.GetFieldsWithStone(player).filter(function (fieldNum) {
            return GameNode.GetNeighborsColumn(fieldNum)
                .some(function (neighbor) { return _this.PotentialMillVertical(neighbor, player); })
                && GameNode.GetNeighborsRow(fieldNum)
                    .some(function (neighbor) { return _this.PotentialMillHorizontal(neighbor, player); });
        }).length;
    };
    /**
     * Gets the numbers of closed mills a player has.
     * @param {number} player The player from whom to count the mills.
     * @returns {number} the number of closed mills.
     */
    GameNode.prototype.NumberOfMills = function (player) {
        var _this = this;
        // count each stone that is in a mill and then divide by three
        // as it is possible that a stone is in two mills simultaneously
        // we make them count twice
        return this.GetFieldsWithStone(player)
            .map(function (field) { return (_this.CheckMillHorizontal(field) ? 1 : 0) + (_this.CheckMillVertical(field) ? 1 : 0); })
            .reduce(function (a, b) { return a + b; }) / 3;
    };
    /**
     * Returns the number of open mills that may be closed within one move
     * and that cannot be prohibited by a neighbor enemy stone.
     * @param {number} player The player for which to count the open mills.
     * @returns {number} the number of open mills.
     */
    GameNode.prototype.NumberOfOpenMills = function (player) {
        var _this = this;
        // we check for horizontal and vertical mills (they count separate)
        // if an empty field can be settled to such one
        return this.GetEmptyFields().filter(function (fieldNum) { return (
        // can a stone be placed here to get a horizontal mill
        _this.PotentialMillHorizontal(fieldNum, player)
            && GameNode.GetNeighborsColumn(fieldNum).some(function (neighbor) {
                return _this.GetColorOnField(neighbor) === player;
            })
            && GameNode.GetNeighborsColumn(fieldNum).every(function (neighbor) {
                return _this.GetColorOnField(neighbor) !== 1 - player;
            })); }).length // we count all empty fields satisfying this conditions
            + this.GetEmptyFields().filter(function (fieldNum) { return (_this.PotentialMillVertical(fieldNum, player)
                && GameNode.GetNeighborsRow(fieldNum).some(function (neighbor) {
                    return _this.GetColorOnField(neighbor) === player;
                })
                && GameNode.GetNeighborsRow(fieldNum).every(function (neighbor) {
                    return _this.GetColorOnField(neighbor) !== 1 - player;
                })); }).length;
    };
    /**
     * Gets the number of double mills a particular player has.
     * A double mill in this definition are two closed mills sharing a stone.
     * @param {number} player The player of which to count the double mills.
     * @returns {number} the number of double mills.
     */
    GameNode.prototype.NumberOfDoubleMills = function (player) {
        var _this = this;
        // returns the number of stones that are in two closed mills simultaneously
        return this.stones[player]
            .filter(function (b, fieldNum) { return b && _this.CheckMillHorizontal(fieldNum) && _this.CheckMillVertical(fieldNum); })
            .length;
    };
    /**
     * Returns the number of open double mills that may be switched within one move.
     * @param {number} player The player for which to count the open double mills.
     * @returns {number} the number of open double mills.
     */
    GameNode.prototype.NumberOfOpenDoubleMills = function (player) {
        var _this = this;
        return this.GetEmptyFields().filter(function (fieldNum) {
            // check all empty fields where a mill could be closed
            return _this.PotentialMill(fieldNum, player)
                && GameNode.GetNeighbors(fieldNum)
                    .some(function (neighbor) { return _this.stones[player][neighbor]
                    && _this.CheckMill(neighbor); });
        }).length;
    };
    /**
     * Gets the number of blocked stones a particular player has.
     * @param {number} player The player of which to count the blocked stones.
     * @returns {number} the number of blocked stones.
     */
    GameNode.prototype.NumberOfBlockedStones = function (player) {
        var _this = this;
        // get all stones of the player
        return this.GetFieldsWithStone(player).filter(function (fieldNum) {
            // and select these where all neighbor fields are occupied
            return GameNode.GetNeighbors(fieldNum).every(function (neighbor) {
                return _this.FieldIsOccupied(neighbor);
            });
        }).length; // finally count them
    };
    /**
     * Returns a unique number representing the stones on the current game board.
     * Can be used as a hash to identify the current game board placement.
     * Remark: This is only possible if 64bit number representation is used as 3^24 > 2^32.
     * @returns {number} the unique number of the current game board.
     */
    GameNode.prototype.CurrentStateToNumber = function () {
        return this.stones[0].map(function (b, fieldNum) { return Math.pow(3, fieldNum) * (b ? 1 : 0); }).reduce(function (a, b) { return a + b; }, 0)
            + this.stones[1].map(function (b, fieldNum) { return Math.pow(3, fieldNum) * (b ? 2 : 0); }).reduce(function (a, b) { return a + b; }, 0);
    };
    /** The left neighbor for each field or null if none. */
    GameNode.neighborLeft = [null, 0, 1, null, 3, 4, null, 6, 7, null, 9, 10, null, 12, 13, null, 15, 16, null, 18, 19, null, 21, 22];
    /** The right neighbor for each field or null if none. */
    GameNode.neighborRight = [1, 2, null, 4, 5, null, 7, 8, null, 10, 11, null, 13, 14, null, 16, 17, null, 19, 20, null, 22, 23, null];
    /** The top neighbor for each field or null if none. */
    GameNode.neighborTop = [null, null, null, null, 1, null, null, 4, null, 0, 3, 6, 8, 5, 2, 11, null, 12, 10, 16, 13, 9, 19, 14];
    /** The bottom neighbor for each field or null if none. */
    GameNode.neighborBottom = [9, 4, 14, 10, 7, 13, 11, null, 12, 21, 18, 15, 17, 20, 23, null, 19, null, null, 22, null, null, null, null];
    return GameNode;
}());
/**
 * Stupid AI implementation using random selection among all possibilities.
 */
var EnemyAIMinimax = (function () {
    /**
     * Creates an instance of an AI using the alpha beta search.
     * @param {number} _color The color as which this AI plays.
     * @param {boolean} [_respectLimit] If the AI respect its time limit. Defaults to true.
     */
    function EnemyAIMinimax(_color, _respectLimit) {
        /** How many moves the AI will look in the future */
        this.startDepth = 4;
        /** If the AI will respect its time limit or take all possible moves into account */
        this.respectLimit = true;
        this.color = _color;
        if (_respectLimit != null)
            this.respectLimit = _respectLimit;
    }
    /**
     * Function that invokes the AI if a move has to be performed.
     * @returns {boolean} if a move could be performed
     */
    EnemyAIMinimax.prototype.MakeMove = function () {
        var _this = this;
        if (Game.currentPlayer != this.color) {
            // this should not be necessary but just in case lets log if it happens
            console.error("[AI] Current player is not AI.");
            return false;
        }
        // reset values for calculation
        this.hashForRepeat = [];
        this.storedMove = null;
        // just wait shortly to give html time to render
        setTimeout(function () { _this.MakeMoveIntern(); }, 50);
    };
    /**
     * Executes a previously calculated move stored in storedMove.
     * If no move was set a random decision amongst all possibilities will be used.
     */
    EnemyAIMinimax.prototype.ExecuteMove = function () {
        if (this.storedMove == null) {
            // this may happen if timout happens before one move was considered
            // or if all possible moves that were calculated in time would have been repeats
            console.error("[AI] No moves could be calculated! Making random decision.");
            // Get all possible moves
            var possibleMoves = GameNode.GetFromCurrentBoard().GetPossibleMoves();
            if (possibleMoves.length < 1) {
                console.error("[AI] No possible moves found...");
                return;
            }
            // set a random one to be executed so game will not be interrupted
            this.storedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }
        if (this.storedMove.phase == Game.phase) {
            // for each phase first check format of stored move and if ok call the belonging game board method.
            switch (Game.phase) {
                case 1:
                    if (this.storedMove.from == null && this.storedMove.to != null)
                        GameBoard.MoveCurrentStoneToField(GameBoard.gameFields[this.storedMove.to]);
                    else
                        console.error("[AI] Stored move is not in the right format.");
                    break;
                case 2:
                    if (this.storedMove.from != null && this.storedMove.to != null && GameBoard.gameFields[this.storedMove.from].owner)
                        GameBoard.MoveStoneToField(GameBoard.gameFields[this.storedMove.from].owner, GameBoard.gameFields[this.storedMove.to]);
                    else
                        console.error("[AI] Stored move is not in the right format.");
                    break;
                case 3:
                    if (this.storedMove.to == null && this.storedMove.from != null && GameBoard.gameFields[this.storedMove.from].owner)
                        GameBoard.RemoveStoneFromField(GameBoard.gameFields[this.storedMove.from].owner);
                    else
                        console.error("[AI] Stored move is not in the right format.");
                    break;
                default:
                    console.error("[AI] No move possible during game phase " + Game.phase + "!");
                    break;
            }
        }
        else {
            console.error("[AI] Game phase " + this.storedMove.phase + " of suggested move does not fit actual game status (phase " + Game.phase + ")!");
        }
    };
    /**
     * Calculates the next move and calls execution method.
     */
    EnemyAIMinimax.prototype.MakeMoveIntern = function () {
        var _this = this;
        // set start time for restriction to a time limit
        this.startTime = Date.now();
        // Start alpha beta search:
        var rating = this.AlphaBeta(GameNode.GetFromCurrentBoard(), this.startDepth, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
        //console.log("[AI] Found move with rating "+rating+".");
        //console.log("[AI] "+(Date.now()-this.startTime)+"ms needed to calculate this move.");
        // AI has some time to move, as the html transition of the previous move might be still ongoing
        // the AI will wait the full time before executing the calculated move
        var remainingTime = Game.aiDecisionTime - (Date.now() - this.startTime);
        if (remainingTime > 10) {
            setTimeout(function () { return _this.ExecuteMove(); }, remainingTime);
        }
        else {
            this.ExecuteMove();
        }
    };
    /**
     * Customized implementation of the alpha beta pruning,
     * an optimization of the minimax algorithm both trying
     * to maximize the minimum possible store you can get by your move.
     * @param {GameNode} node The game state to look at.
     * @param {number} depth How deep the algorithm shall look.
     * @param {number} alpha The maximum rating the AI can get.
     * @param {number} beta The minimum rating the enemy can reach.
     */
    EnemyAIMinimax.prototype.AlphaBeta = function (node, depth, alpha, beta) {
        // check if already a winner exists or final depth is reached
        // or time is up and AI respects it -> base case of the recursive call.
        var winner = node.GetWinner();
        if (winner != null || depth <= 0
            || (this.respectLimit && Date.now() - this.startTime > Game.aiDecisionTime)) {
            // extra punishment if move causes the enemy to win.
            // it is bad to loose, but it is worse if our next move makes enemy win possible...
            // (cannot put this in GetRating() as depth and this.startDepth not accessible there)
            // second part of condition is for the case that we can take a stone (enemy will only get to move at turn 3 then)
            var punishment = ((winner == 1 - this.color && (depth == this.startDepth - 2
                || (depth == this.startDepth - 3 && node.currentPlayer != this.color))) ? 1 : 0);
            return node.GetRating(this.color)
                - 500000 * punishment;
        }
        // get a list of all possible moves at the current game state
        var possibleMoves = node.GetPossibleMoves();
        // shortcut if winning is only one step away
        // this does not need much time but is much faster at the end of the game
        // as there typically less stones exist and thus way more possibilites
        if (depth == this.startDepth) {
            for (var _i = 0, possibleMoves_1 = possibleMoves; _i < possibleMoves_1.length; _i++) {
                var move = possibleMoves_1[_i];
                // try the move
                node.PerformMove(move);
                // check if it results in the AI winning
                if (node.GetWinner() === this.color) {
                    console.log("[AI] Taking shortcut to win.");
                    // take this move and return
                    this.storedMove = move;
                    return node.GetRating(this.color);
                }
                // if not undo the move and continue with the normal routine
                node.UndoMove(move);
            }
            // mix moves
            // a bit randomness if moves equal so it is not fully deterministic
            // only necessary for depth == this.startDepth is move is from there
            possibleMoves = this.shuffleArray(possibleMoves);
        }
        if (node.currentPlayer === this.color) {
            var maxValue = alpha; // this value stores the new alpha
            for (var _a = 0, possibleMoves_2 = possibleMoves; _a < possibleMoves_2.length; _a++) {
                var move = possibleMoves_2[_a];
                // try the move
                node.PerformMove(move);
                // check if this move results in a game board that we already looked at
                var currState = node.CurrentStateToNumber();
                if (!GameBoard.hashForDraw[currState] && !this.hashForRepeat[currState]) {
                    // if not then we add it to the hashList
                    this.hashForRepeat[currState] = true;
                    // recursively call the algorithm for the next move (depth decreased by one)
                    // also new alpha value is given as parameter
                    var value = this.AlphaBeta(node, depth - 1, maxValue, beta);
                    // now as all future moves following on the current are checked
                    // we have not done this move so fare so configuration will be deleted from hashList again
                    this.hashForRepeat = this.hashForRepeat.splice(currState, 1);
                }
                else {
                    // configuration already happened, set value so it will not trigger the following if clause
                    var value = maxValue;
                    console.log("[AI] Skipping repeating move.");
                }
                // undo the move so the next move can be tried
                node.UndoMove(move);
                if (value > maxValue) {
                    // found a move that produces a better result for us
                    maxValue = value; // set new alpha
                    // cutoff as we already now that enemy can reach a lower rating we cannot prohibit
                    if (maxValue >= beta)
                        break;
                    // it is better than previous moves so we will save it as possible candidate
                    if (depth == this.startDepth) {
                        this.storedMove = move;
                    }
                }
            }
            return maxValue;
        }
        else {
            var minValue = beta; // this value stores the new beta
            for (var _b = 0, possibleMoves_3 = possibleMoves; _b < possibleMoves_3.length; _b++) {
                var move = possibleMoves_3[_b];
                // try move
                node.PerformMove(move);
                // recursive call for the next possible moves
                var value = this.AlphaBeta(node, depth - 1, alpha, minValue);
                // undo move to allow further moves to be tested
                node.UndoMove(move);
                if (value < minValue) {
                    // found a move where enemy can minimize our score further
                    minValue = value;
                    // cutoff as the AI can already reach a higher value
                    if (minValue <= alpha)
                        break;
                }
            }
            return minValue;
        }
    };
    /**
     * Randomize array element order in-place using Durstenfeld shuffle algorithm.
     * @param {Array<any>} array The array that will be shuffled.
     * @returns {Array<any>} the shuffled array.
     */
    EnemyAIMinimax.prototype.shuffleArray = function (array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    };
    return EnemyAIMinimax;
}());
/**
 * Stupid AI implementation using random selection among all possibilities.
 */
var EnemyAIRandom = (function () {
    /**
     * Instantiates a random AI.
     * @param {number} _color The color the AI plays for
     * @constructor
     */
    function EnemyAIRandom(_color) {
        this.color = _color;
    }
    /**
     * Function that invokes the AI if a move has to be performed.
     * @returns {boolean} if a move could be performed.
     */
    EnemyAIRandom.prototype.MakeMove = function () {
        var _this = this;
        if (Game.currentPlayer != this.color) {
            // this should not be necessary but just in case lets log if it happens
            console.error("[AI] Current player is not AI.");
            return false;
        }
        // Wait the given time before executing actual move calculation as this is done in no time
        var result = false;
        setTimeout(function () { return result = _this.MakeMoveIntern(); }, Game.aiDecisionTime);
        return result;
    };
    /**
     * Calculates and executes the next move.
     * @returns {boolean} if a move could be performed.
     */
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
    // all other functions, in particular constructor and MakeMove() ware provided
    /**
     * Calculates and executes the next move.
     * @returns {boolean} if a move could be performed.
     */
    EnemyAIPrimitive.prototype.MakeMoveIntern = function () {
        switch (Game.phase) {
            case 1: // place stones
            case 2:
                var moveableStones = void 0;
                if (Game.phase == 1 && (GameBoard.activeStone && GameBoard.activeStone.color == this.color)) {
                    // placing stones so only moveable stone is the one preselected
                    moveableStones = [GameBoard.activeStone];
                }
                else if (Game.phase == 2) {
                    // moving stones so get all moveable stones on the field
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
                    // for each stone get possible locations to move to
                    var possibleFields = GameBoard.gameFields.filter(function (f) { return f.CanStoneMoveTo(stone); });
                    // check if one of them would mean closing a mill
                    for (var _a = 0, possibleFields_1 = possibleFields; _a < possibleFields_1.length; _a++) {
                        var field = possibleFields_1[_a];
                        if (EnemyAIPrimitive.wouldBeMuehle(field, stone)) {
                            preferredField = field;
                            preferredStone = stone;
                            break;
                        }
                    }
                    // if we already found a stone to move we can break here
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
                    // for each enemy stone get the locations it can be moved to
                    var possibleFields = GameBoard.gameFields.filter(function (f) { return f.CanStoneMoveTo(stone); });
                    // check if any field would lead to a closed mill
                    for (var _c = 0, possibleFields_2 = possibleFields; _c < possibleFields_2.length; _c++) {
                        var field = possibleFields_2[_c];
                        if (EnemyAIPrimitive.wouldBeMuehle(field, stone)) {
                            // add it to the list of all badFields
                            badFields.push(field);
                        }
                    }
                }
                // Check all own moveable stones if one can intervene
                preferredStone = null;
                preferredField = null;
                for (var _d = 0, badFields_1 = badFields; _d < badFields_1.length; _d++) {
                    var field = badFields_1[_d];
                    for (var _e = 0, moveableStones_2 = moveableStones; _e < moveableStones_2.length; _e++) {
                        var stone = moveableStones_2[_e];
                        if (field.CanStoneMoveTo(stone)) {
                            // found a stone that can be moved into an enemy's mill
                            preferredField = field;
                            preferredStone = stone;
                            break;
                        }
                    }
                    // if found a possibility we do not look further
                    if (preferredField)
                        break;
                }
                // If one is found, move the stone there
                if (preferredStone && preferredField)
                    return GameBoard.MoveStoneToField(preferredStone, preferredField);
                // Try to build 2 stones together to be able to build a mill but
                // only do this while still placing stones having the full field selection
                // (while moving stones it would be unlikely enough that a third stone is in range)
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
            case 3:
                break; // just randomly select one
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
        this.InitializeAIs();
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
        winnerScreenText.innerText = (Game.currentPlayer == StoneColor.White ? "White" : "Black") + " wins!";
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
    /**
     * Initializes Statistics Mode where game restarts automatically
     * and winners will be counted and displayed in the footer.
     */
    Game.StartStatMode = function () {
        this.countWin = [0, 0];
        this.countDraw = 0;
        this.AutoPlayStatistics();
    };
    /**
     * Checks in Stat Mode if game ended and if so logs it and restarts.
     */
    Game.AutoPlayStatistics = function () {
        var _this = this;
        if (Game.phase == 4 || Game.phase == 5) {
            if (Game.phase == 4)
                this.countWin[Game.currentPlayer]++;
            else
                this.countDraw++;
            var infoText = "White: " + this.countWin[1]
                + " - Black: " + this.countWin[0]
                + " - Draw: " + this.countDraw
                + " (Total: " + (this.countWin[0] + this.countWin[1] + this.countDraw) + ")";
            console.info(infoText);
            footer.innerHTML = infoText;
            Game.Start();
            winnerScreen.style.display = 'none';
        }
        else if (Game.phase == 0) {
            return; // no new call to function (menu interrupts)
        }
        setTimeout(function () { return _this.AutoPlayStatistics(); }, 100);
    };
    /**
     * Initializes the player AIs according to playerAINumber.
     */
    Game.InitializeAIs = function () {
        var _this = this;
        [0, 1].forEach(function (color) {
            switch (_this.playerAINumber[color]) {
                case 1:
                    Game.playerAI[color] = new EnemyAIRandom(color);
                    break;
                case 2:
                    Game.playerAI[color] = new EnemyAIPrimitive(color);
                    break;
                case 3:
                    Game.playerAI[color] = new EnemyAIMinimax(color, true);
                    break;
                case 4:
                    Game.playerAI[color] = new EnemyAIMinimax(color, false);
                    break;
                default:
                    Game.playerAI[color] = null;
                    break;
            }
        });
    };
    /**
     * Numbers describing the type of AI for each player.
     * 0: Human, 1: Random, 2: Easy, 3: Medium, 4: Hard
     */
    Game.playerAINumber = [0, 0];
    /** Set if a player is played by computer */
    Game.playerAI = [null, null];
    /** How long AI will sleep/calculate before deciding its next move */
    Game.aiDecisionTime = 500; // ms
    /** Turns statistics mode on or off */
    Game.statMode = false;
    /** Telling if game is in nature design or not */
    Game.natureDesign = true;
    Game.countWin = [0, 0];
    Game.countDraw = 0;
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
        for (var _i = 0, _a = [StoneColor.Black, StoneColor.White]; _i < _a.length; _i++) {
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
     * @param {StoneColor} color - Color of the placed stones to return.
     * @returns {Array<GameStone>} an array with all placed stones of a given color.
     */
    GameBoard.GetStonesOnField = function (color) {
        return this.stones[color].filter(function (s) { return s.isPlaced; });
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
     * @param {StoneColor} color - Color of the stone to return.
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
     * @param {StoneColor} color - Color of the stone.
     * @constructor
     */
    function GameStone(color, position) {
        var _this = this;
        this._position = null;
        this._active = false;
        this._moveable = false;
        this._removeable = false;
        this._hoverable = false;
        /**
         * field on which the stone currently is placed if any
         */
        this.field = null;
        this._color = color;
        this._element = document.createElement('div');
        this.position = position; // after creating the div element we can set the position
        this._element.setAttribute('class', color === StoneColor.White ? 'stoneWhite' : 'stoneBlack');
        if (Game.aiDecisionTime <= 200) {
            // instant transition moving stones
            this._element.classList.add("stoneMoveInstant");
        }
        else if (Game.aiDecisionTime <= 400) {
            // fast transition
            this._element.classList.add("stoneMoveFast");
        }
        // set random offset so all stones look different
        if (!Game.natureDesign)
            this._element.style.backgroundPosition = Math.floor(Math.random() * 201) + 'px, ' + Math.floor(Math.random() * 201) + 'px';
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
    Object.defineProperty(GameStone.prototype, "hoverable", {
        /**
         * if the stone can be hovered at the moment
         */
        get: function () {
            return this._hoverable;
        },
        set: function (newHoverable) {
            if (newHoverable) {
                this.element.classList.add('stoneHoverable');
            }
            else {
                this.element.classList.remove('stoneHoverable');
            }
            this._hoverable = newHoverable;
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
    Object.defineProperty(GameStone.prototype, "canBeClicked", {
        /**
         * If the stone can be clicked
         */
        get: function () {
            return (Game.phase == 2 && Game.currentPlayer == this.color
                && !Game.playerAI[this.color] && this.isMoveable && !this.active)
                || (Game.phase == 3 && Game.currentPlayer == 1 - this.color
                    && !Game.playerAI[1 - this.color] && this.isPlaced && !this.isInClosedMill);
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
        // Mark stones that can be removed
        this.removeable = Game.phase == 3 && this.color != Game.currentPlayer && !this.isInClosedMill && this.isPlaced;
        // Set if the stone can be hovered (so if it may be clicked by player)
        this.hoverable = this.canBeClicked;
    };
    /**
     * Method called if clicked on stone.
     * @returns {boolean} if click was consumed by the stone or not.
     */
    GameStone.prototype.OnClicked = function () {
        // if element cannot be clicked return false
        if (!this.canBeClicked)
            return false;
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
        // initializing statistics mode
        if (Game.statMode) {
            Game.StartStatMode();
            footer.innerHTML = "Statistics Mode - Auto Restart and Result Logging enabled.";
        }
        else {
            footer.innerHTML = "Enjoy the game!";
        }
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
        var checkboxStatMode = document.getElementById('statMode');
        var checkboxClassicDesign = document.getElementById('classicDesign');
        if (!checkboxStatMode || !checkboxClassicDesign) {
            console.error("Could not find all menu elements!");
            return;
        }
        Game.statMode = checkboxStatMode.checked;
        // Show some info concerning Stat Mode if turned on for the first time
        if (Game.statMode && this.statModeFirstEnabled) {
            this.statModeFirstEnabled = false;
            Menu.ShowInfoOverlay("Statistics Mode is for long term probing of game results between two AI players. " +
                "Game will automatically restart and results are logged and displayed in the footer. " +
                "Stat Mode can be interrupted by going to the menu.");
        }
        console.log(Game.natureDesign);
        Game.natureDesign = !checkboxClassicDesign.checked;
        console.log(Game.natureDesign);
        this.UpdateNatureDesign();
    };
    /**
     * Called by AI select dropdown, sets the AI for a specified color.
     * @param {number} color - The color for which the AI is altered.
     * @param {number} aiNum - Number describing which AI should be set.
     * @param {HTMLLinkElement} elem - Element that was clicked.
     */
    Menu.SetPlayerAI = function (color, aiNum, elem) {
        if (color !== StoneColor.Black && color !== StoneColor.White)
            return; // input invalid
        switch (aiNum) {
            case 0: // playerAI
            case 1: // random
            case 2: // easy
            case 3: // middle
            case 4:
                break;
            default:
                return; // not a valid input
        }
        Game.playerAINumber[color] = aiNum;
        // adjust the button text to fit the new selection
        [
            document.getElementById('blackAI'),
            document.getElementById('whiteAI')
        ][color].innerHTML = elem.innerHTML;
    };
    /**
     * Triggered if clicked on button to toggle dropdown list.
     * @param {HTMLButtonElement} elem - The element clicked on.
     */
    Menu.ToggleDropdown = function (elem) {
        var content = elem.nextElementSibling;
        if (content) {
            content.classList.toggle("show");
            // make all others disappear:
            var dropdowns = document.getElementsByClassName("dropdown-content");
            for (var i = 0; i < dropdowns.length; i++) {
                if (dropdowns[i] != content) {
                    dropdowns[i].classList.remove('show');
                }
            }
        }
        else {
            console.error("Dropdown content could not be found.");
        }
    };
    /**
     * Shows an information overlay with given text.
     * @param {string} text - The text to print on the screen.
     */
    Menu.ShowInfoOverlay = function (text) {
        var disp = document.getElementById('infoOverlay');
        disp.getElementsByTagName('p')[0]
            .innerHTML = text;
        disp.style.display = 'table';
    };
    /**
     * Hides the information overlay.
     */
    Menu.HideInfoOverlay = function () {
        document.getElementById('infoOverlay')
            .style.display = 'none';
    };
    /**
     * Updates the nature design if active.
     */
    Menu.UpdateNatureDesign = function () {
        if (Game.natureDesign) {
            // nature design turned on
            this.ChangeCSS("style/nature.css", 0);
        }
        else {
            // turned off
            this.ChangeCSS("style/normal.css", 0);
        }
    };
    /**
     * Changes a CSS style sheet on the fly.
     */
    Menu.ChangeCSS = function (cssFile, cssLinkIndex) {
        var oldlink = document.getElementsByTagName("link").item(cssLinkIndex);
        var newlink = document.createElement("link");
        newlink.setAttribute("rel", "stylesheet");
        newlink.setAttribute("type", "text/css");
        newlink.setAttribute("href", cssFile);
        document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
    };
    /** If stat mode was never enabled before. For displaying infoOverlay. */
    Menu.statModeFirstEnabled = true;
    return Menu;
}());
/**
 * GLOBAL TODO:
 * - FieldPosition und RealPosition interfaces erstellen, die Position2 ersetzen und eindeutiger zuweisbar sind.
 * - let statt var
 */
/** Enum for handling the stone color. */
var StoneColor;
(function (StoneColor) {
    StoneColor[StoneColor["Black"] = 0] = "Black";
    StoneColor[StoneColor["White"] = 1] = "White";
})(StoneColor || (StoneColor = {}));
// Declare variables to globally access gameBoard and gameMenu
var gameMenu;
var gameBoard;
var winnerScreen;
var winnerScreenText;
var footer;
/**
 * This function is called when page finished loading.
 */
function onLoad() {
    gameMenu = document.getElementById("gameMenu");
    gameBoard = document.getElementById("gameBoard");
    winnerScreen = document.getElementById("winnerScreen");
    winnerScreenText = document.getElementById("winnerScreenText");
    footer = document.getElementsByTagName('footer')[0].getElementsByTagName('p')[0];
    Game.Reset();
    // Needed for menu:
    // Close the dropdown menu if the user clicks outside of it
    window.onclick = function (event) {
        if (!event.target.matches('.dropbtn')) {
            var dropdowns = document.getElementsByClassName("dropdown-content");
            for (var i = 0; i < dropdowns.length; i++)
                dropdowns[i].classList.remove('show');
        }
    };
}
/**
 * Helper function to get range [0,1,2,...,len-1]
 * @param {number} len The length of the range array.
 * @returns {number[]} an array [0,1, ..., len-1].
 */
function indices(len) {
    var arr = new Array(len);
    for (var i = 0; i < len; i++)
        arr[i] = i;
    return arr;
}
//# sourceMappingURL=mill.js.map