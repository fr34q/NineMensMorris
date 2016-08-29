/**
 * Interface describing a game move.
 */
interface GameMove {
    /** Phase where the move can be performed. */
    phase: number;
    /** From which field a stone is moved or null if stone is placed. */
    from: number; 
    /** To which field a stone is moved or null if stone is removed. */
    to: number
}

/**
 * Class for storing game information for the alpha beta algorithm.
 */
class GameNode {
    /** The left neighbor for each field or null if none. */
    static neighborLeft : number[] = [null,0,1,null,3,4,null,6,7,null,9,10,null,12,13,null,15,16,null,18,19,null,21,22];
    /** The right neighbor for each field or null if none. */
    static neighborRight : number[] = [1,2,null,4,5,null,7,8,null,10,11,null,13,14,null,16,17,null,19,20,null,22,23,null];
    /** The top neighbor for each field or null if none. */
    static neighborTop : number[] = [null,null,null,null,1,null,null,4,null,0,3,6,8,5,2,11,null,12,10,16,13,9,19,14];
    /** The bottom neighbor for each field or null if none. */
    static neighborBottom : number[] = [9,4,14,10,7,13,11,null,12,21,18,15,17,20,23,null,19,null,null,22,null,null,null,null];

    /** Tells if a stone of a certain color sits on a specific field, e.g. stones[color][field] */
    stones : [boolean[], boolean[]];
    /** The current player */
    currentPlayer : StoneColor;
    /** The current number of game turns */
    gameTurn : number;
    /** The current game phase */
    //TODO: this shouldn't be a number, use enums
    gamePhase : number;

    /**
     *  Creates a class for storing a game state.
     */
    constructor() {
        this.stones = [new Array<boolean>(24), new Array<boolean>(24)];
        // if undefined !(..) will result as true like expected from false -> can leave out explicit definition
    }

    /**
     * Makes a copy of the game state.
     * @returns {GameNode} the copy of the game state.
     */
    Clone() : GameNode {
        var node = new GameNode();
        // need to copy stones different as it is otherwise only referenced
        node.stones = [this.stones[0].slice(0), this.stones[1].slice(0)];
        node.currentPlayer = this.currentPlayer;
        node.gameTurn = this.gameTurn;
        node.gamePhase = this.gamePhase;
        return node;
    }

    /**
     * Creates a GameNode with state of the current game board.
     * @returns {GameNode} the current game board state.
     */
    static GetFromCurrentBoard() : GameNode {
        var node = new GameNode();

        node.currentPlayer = Game.currentPlayer;
        node.gameTurn = Game.turn;
        node.gamePhase = Game.phase;
        GameBoard.gameFields.forEach((f,i) => {
            if (f.owner) node.stones[f.owner.color][i] = true;
        });
        return node;
    }

    /**
     * Get neighbor fields of a specific field.
     * @param {number} field Field number to determine the neighbors of.
     * @returns {Array<number>} all neighbors of the given field.
     */
    static GetNeighbors(field : number) : Array<number> {
        // less copy paste code, less probability of copying mistakes
        return [
            GameNode.neighborLeft[field],
            GameNode.neighborRight[field],
            GameNode.neighborTop[field],
            GameNode.neighborBottom[field]
        ].filter(num => num !== null);
    }
    /**
     * Get all fields that are in the same row as the specified field.
     * @param {number} field Field number to determine the neighbors of.
     * @returns {Array<number>} all row neighbors of the given field.
     */
    static GetNeighborsRow(field : number) : Array<number> {
        return [
            GameNode.neighborLeft[field],
            GameNode.neighborRight[field],
            GameNode.neighborLeft[GameNode.neighborLeft[field]],
            GameNode.neighborRight[GameNode.neighborRight[field]]
        ].filter(num => num !== null && num !== undefined);
    }
    /**
     * Get all fields that are in the same column as the specified field.
     * @param {number} field Field number to determine the neighbors of.
     * @returns {Array<number>} all column neighbors of the given field.
     */
    static GetNeighborsColumn(field : number) : Array<number> {
        return [
            GameNode.neighborTop[field],
            GameNode.neighborBottom[field],
            GameNode.neighborTop[GameNode.neighborTop[field]],
            GameNode.neighborBottom[GameNode.neighborBottom[field]]
        ].filter(num => num !== null && num !== undefined);
    }
    
    /**
     * Get all fields that are not occupied by a stone.
     * @returns {Array<number>} all unoccupied fields.
     */
    GetEmptyFields() : Array<number> {
        return indices(24).filter(num => !this.FieldIsOccupied(num));
    }
    /**
     * Get all fields that are occupied by a stone of the given color.
     * @returns {Array<number>} all fields with stone of given color.
     */
    GetFieldsWithStone(color : StoneColor) : Array<number> {
        return indices(24).filter(num => this.stones[color][num]);
    }
    /**
     * Gets the color of the stone on a specific field.
     * @param {number} field The field where the stone is placed.
     * @returns {StoneColor} the stone color or null if not occupied.
     */
    GetColorOnField(field : number) : StoneColor {
        if (this.stones[StoneColor.Black][field]) return StoneColor.Black;
        if (this.stones[StoneColor.White][field]) return StoneColor.White;
        return null;
    }
    /**
     * Determines if a field is occupied.
     * @param {number} field The field to check.
     * @returns {booleab} if there is a stone on the given field.
     */
    FieldIsOccupied(field: number) : boolean {
        return this.stones[StoneColor.White][field] || this.stones[StoneColor.Black][field];
    }
    /**
     * Get list of all possible moves at the current game state.
     * @returns {Array<GameMove>} all possible moves.
     */
    GetPossibleMoves() : Array<GameMove> {
        if (this.GetWinner() !== null) return []; // game ended -> no more moves
        switch (this.gamePhase) {
            case 1: // placing stones TODO: ← this kind of comment shouldn't be needed
                return this.GetEmptyFields().map(fieldNum => ({ // can place on all empty fields
                    phase: this.gamePhase, 
                    from: null, // from outside the board
                    to: fieldNum 
                }));
            case 2: // moving stones
                return this.GetFieldsWithStone(this.currentPlayer).map(fieldNum => (
                    // if only 3 stones left player can jump and reach any empty field
                    // otherwise only neighbor fields that are not occupied
                    (this.GetFieldsWithStone(this.currentPlayer).length <= 3 ? 
                        this.GetEmptyFields() : 
                        GameNode.GetNeighbors(fieldNum)
                            .filter(num => !this.FieldIsOccupied(num))
                    ).map(fieldNumTo => ({
                        phase: this.gamePhase, 
                        from: fieldNum, 
                        to: fieldNumTo
                    }))
                    // for each stone we got an array of possible moves
                    // now we have to merge them in one big array
                )).reduce((a, b) => a.concat(b));
            case 3: // removing stones
                return this.GetFieldsWithStone(1-this.currentPlayer) // get fields where enemy has stones
                    .filter(num => !this.CheckMill(num)) // can remove only free stones
                    .map(fieldNum => ({
                        phase: this.gamePhase, 
                        from: fieldNum, 
                        to: null
                    })
                );
            default:
                return [];
        }
    }

    /**
     * Perform a certain move on the current game state and updating all information.
     * @param {GameMove} move The move to perform.
     * @returns {boolean} if the move could be performed.
     */
    PerformMove(move : GameMove) : boolean {
        if(move.phase != this.gamePhase) {
            console.error("[AI] move not fitting to current game phase.")
            return false;
        }
        if(this.GetWinner() != null) {
            console.error("[AI] game already ended so no more moves possible.");
            return false;
        }
        switch(this.gamePhase) {
            case 1: // placing stones
                // check if move has right format and field where to go is empty
                if (move.from !== null || move.to === null || this.FieldIsOccupied(move.to)) {
                    console.error("[AI] game move has wrong values");
                    return false;
                }
                this.stones[this.currentPlayer][move.to] = true;
                this.IncrementAndUpdate(move.to);
                break;
            case 2: // moving stones
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
            case 3: // removing stones
                // check format and if there is an enemy stone that is not in a mill and can be removed
                if (move.from == null || move.to != null || !this.stones[1-this.currentPlayer][move.from] || this.CheckMill(move.from)) {
                    console.error("[AI] game move has wrong values");
                    return false;
                }
                this.stones[1-this.currentPlayer][move.from] = false;
                this.IncrementAndUpdate(move.from);
                break;
            default:
                console.error(`[AI] Move in game phase ${move.phase} could not be performed.`);
                return false;
        }
        return true;
    }
    /**
     * Reverses a performed move and sets the game state to the move before that state.
     * Especially useful if only one GameNode will represent the game state and different
     * options shall be tried.
     * @param {GameMove} move The move to be undone.
     * @returns {boolean} if the move could be undone.
     */
    UndoMove(move : GameMove) : boolean {
        // if a stone should be removed right now the current player closed a mill in the last turn
        // and so no players were switched
        var lastPlayer = this.gamePhase == 3 ? this.currentPlayer : 1-this.currentPlayer;

        switch(move.phase) { 
            case 1: // placing stones
                // check format and if there is a stone that can be unplaced
                if(move.from != null || move.to == null || !this.stones[lastPlayer][move.to]) {
                    console.error("[AI] Move cannot be undone, wrong format. (1)");
                    return false;
                }
                this.stones[lastPlayer][move.to] = false;
                break;
            case 2: // moving stones
                // check format and if stone can moved back 
                if(move.from == null || move.to == null || !this.stones[lastPlayer][move.to]
                        || this.FieldIsOccupied(move.from)) {
                    console.error("[AI] Move cannot be undone, wrong format. (2)");
                    return false;
                }
                this.stones[lastPlayer][move.from] = true;
                this.stones[lastPlayer][move.to] = false;
                break;
            case 3: // removing stones
                // check format and if there is no stone were it was removed
                if(move.from == null || move.to != null || this.FieldIsOccupied(move.from)) {
                    console.error("[AI] Move cannot be undone, wrong format. (3)");
                    return false;
                }
                this.stones[1-lastPlayer][move.from] = true;
                break;
            default:
                console.error("[AI] Move in game phase "+move.phase+" could not be undone.")
                return false;
        }
        
        // otherwise last game state was closing a mill -> no game turn decrement or player switch
        if(this.gamePhase != 3) this.gameTurn--;
        this.currentPlayer = lastPlayer;
        this.gamePhase = move.phase;
        return true;
    }

    /**
     * This function increments the game turn and updates game state.
     * @param {number} field The field the last stone was placed on or removed from.
     */
    IncrementAndUpdate(field : number) : void {
        // check if mill was closed and enemy has any stones to remove or only 3 stones left
        if (this.gamePhase != 3 && this.CheckMill(field) && (
                this.GetFieldsWithStone(1-this.currentPlayer)
                    .some(fieldNum => !this.CheckMill(fieldNum))
                || this.GetFieldsWithStone(1-this.currentPlayer).length <= 3) ) {
            this.gamePhase = 3;
            // no game turn increment / player switch
            return;
        }
        // update game state information
        this.gamePhase = (this.gameTurn < 17) ? 1 : 2;
        this.gameTurn++;
        this.currentPlayer = 1 - this.currentPlayer;
    }

    /**
     * Check if the stone on the current field is involved in a horizontal mill.
     * @param {number} field The field to check.
     * @returns {boolean} if a horizontal mill is found on the field.
     */
    CheckMillHorizontal(field : number) : boolean {
        const color = this.GetColorOnField(field);
        if(color === null) return false; // no stone on field
        // returns if all other fields in the same row carry a stone of the same color
        return GameNode.GetNeighborsRow(field).every(neighbor => this.stones[color][neighbor]);
    }
    /**
     * Check if the stone on the current field is involved in a vertical mill.
     * @param {number} field The field to check.
     * @returns {boolean} if a vertical mill is found on the field.
     */
    CheckMillVertical(field : number) : boolean {
        const color = this.GetColorOnField(field);
        if(color === null) return false; // no stone on field
        // returns if all other fields in the same column carry a stone of the same color
        return GameNode.GetNeighborsColumn(field).every(neighbor => this.stones[color][neighbor]);
    }
    /**
     * Check if the stone on the current field is involved in a mill.
     * @param {number} field The field to check.
     * @returns {boolean} if a mill is found.
     */
    CheckMill(fieldnum : number) : boolean {
        return this.CheckMillHorizontal(fieldnum) || this.CheckMillVertical(fieldnum);
    }
    /**
     * Check if a stone if the given color can be placed on the specified field
     * and if this would result in a closed horizontal mill.
     * @param {number} field The field to check.
     * @param {StoneColor} color The player for which to check for potential mills.
     * @returns {boolean} if a potential horizontal mill is found.
     */
    PotentialMillHorizontal(field : number, color : StoneColor) {
        if (this.FieldIsOccupied(field)) return false; // field has to be empty
        // returns if all other fields in the same row carry a stone of the specified color
        return GameNode.GetNeighborsRow(field).every(neighbor => this.stones[color][neighbor]);
    }
    /**
     * Check if a stone if the given color can be placed on the specified field
     * and if this would result in a closed vertical mill.
     * @param {number} field The field to check.
     * @param {StoneColor} color The player for which to check for potential mills.
     * @returns {boolean} if a potential vertical mill is found.
     */
    PotentialMillVertical(field : number, color : StoneColor) {
        if (this.FieldIsOccupied(field)) return false; // field has to be empty
        // returns if all other fields in the same column carry a stone of the specified color
        return GameNode.GetNeighborsColumn(field).every(neighbor => this.stones[color][neighbor]);
    }
    /**
     * Check if a stone if the given color can be placed on the specified field
     * and if this would result in a closed mill.
     * @param {number} field The field to check.
     * @param {StoneColor} color The player for which to check for potential mills.
     * @returns {boolean} if a potential mill is found.
     */
    PotentialMill(field : number, color : StoneColor) {
        return this.PotentialMillHorizontal(field, color) || this.PotentialMillVertical(field, color);
    }

    /**
     * Gets the winner of the current game if any.
     * @returns {number} The winner or null if none. 
     */
    GetWinner() : StoneColor {
        // check if mill was closed and enemy has only 3 stones left
        if(this.gamePhase == 3 && this.gameTurn > 17 && this.stones[1-this.currentPlayer].filter(b => b).length <= 3)
            return this.currentPlayer;
         
        if(this.gamePhase == 2 && this.stones[this.currentPlayer].filter(b => b).length > 3)
            // check if there are moveable stones left, so if any stone has a free neighbor field
            return this.GetFieldsWithStone(this.currentPlayer).some( fieldNum =>
                GameNode.GetNeighbors(fieldNum).some(neighbor => !this.FieldIsOccupied(neighbor))
            ) ? null : 1-this.currentPlayer; // in the latter no stone can move so other player wins
        
        return null;
    }
    /**
     * Get the rating of the current game state.
     * @param {number} color The color of the player for which the store should be obtained.
     * @returns {number} the score of the game state.
     */
    GetRating(color: StoneColor) : number {
        // Rating procedure follows roughly:
        // https://kartikkukreja.wordpress.com/2014/03/17/heuristicevaluation-function-for-nine-mens-morris/
        // Calculate store always for currentPlayer and switch sign later

        // mill closed for currentPlayer
        var criteria1 = this.gamePhase == 3 ? 1 : 0;
        // difference mills
        var criteria2 = this.NumberOfMills(this.currentPlayer) - this.NumberOfMills(1-this.currentPlayer);
        // difference between blocked stones
        var criteria3 = this.NumberOfBlockedStones(1-this.currentPlayer) - this.NumberOfBlockedStones(this.currentPlayer);
        // difference between number of stones
        var criteria4 = this.stones[this.currentPlayer].filter(b => b).length
                - this.stones[1-this.currentPlayer].filter(b => b).length;
        // difference between number of 2-piece configurations
        var criteria5 = this.NumberOfTwoPieceConfs(this.currentPlayer) - this.NumberOfTwoPieceConfs(1-this.currentPlayer);
        // difference between number of 3-piece configurations
        var criteria6 = this.NumberOfThreePieceConfs(this.currentPlayer) - this.NumberOfThreePieceConfs(1-this.currentPlayer);
        // difference between number of open double mills
        var criteria7 = this.NumberOfOpenDoubleMills(this.currentPlayer) - this.NumberOfOpenDoubleMills(1-this.currentPlayer);
        // difference between number of open mills
        var criteria8 = this.NumberOfOpenMills(this.currentPlayer) - this.NumberOfOpenMills(1-this.currentPlayer);
        // winning configurations
        var winner = this.GetWinner();
        var criteria9 = (winner == null) ? 0 : (winner == this.currentPlayer ? 1 : -1);

        var rating = 0;
        if (this.gamePhase == 1 || (this.gamePhase == 3 && this.gameTurn < 18)) {
            // while placing stones
            rating = 100 * criteria1 + 26 * criteria2 + 30 * criteria3 + 9 * criteria4 + 10 * criteria5 + 7 * criteria6;
        } else if (this.gamePhase == 2 || (this.gamePhase == 3 && this.gameTurn >= 18)) {
            // stones are moving
            rating = 500 * criteria1 + 43 * criteria2 + 30 * criteria3 + 11 * criteria4 + 1000 * criteria7 + 500*criteria8 + 500000 * criteria9;
        }
        if (this.gameTurn >= 18 && (this.GetFieldsWithStone(StoneColor.White).length <= 3  || this.GetFieldsWithStone(StoneColor.Black).length <= 3)) {
            // one player has only 3 stones left additional weighting of some criteria
            rating += 100 * criteria5 + 500 * criteria6;
        }
        // switch sign depending on the player
        rating *= color == this.currentPlayer ? 1 : -1;
        return rating;
    }

    /**
     * Returns the number of two piece configurations a particular player has.
     * A two piece configuration is one that forms a closed mill if a stone is added.
     * @param {number} player The player for which to count the configurations.
     * @returns {number} the number of two piece configurations.
     */
    NumberOfTwoPieceConfs(player : StoneColor) : number {
        return this.GetEmptyFields().filter(fieldNum => this.PotentialMillVertical(fieldNum, player)).length
            + this.GetEmptyFields().filter(fieldNum => this.PotentialMillHorizontal(fieldNum, player)).length;
    }
    /**
     * Returns the number of three piece configurations a particular player has.
     * A three piece configuration is one where there are two possibilities to
     * add a stone that would close a mill.
     * @param {number} player The player for which to count the configurations.
     * @returns {number} the number of three piece configurations.
     */
    NumberOfThreePieceConfs(player : StoneColor) : number {
        // we check if a stone has an empty field in horizontal direction that could cause a mill
        // and if furthermore in vertical direction there is also an empty field that satisfy this
        // take own stones and select those that fulfil this (edge stones)
        return this.GetFieldsWithStone(player).filter(fieldNum =>
            GameNode.GetNeighborsColumn(fieldNum)
                .some(neighbor => this.PotentialMillVertical(neighbor, player))
            && GameNode.GetNeighborsRow(fieldNum)
                .some(neighbor => this.PotentialMillHorizontal(neighbor, player))
        ).length;
    }
    /**
     * Gets the numbers of closed mills a player has.
     * @param {number} player The player from whom to count the mills.
     * @returns {number} the number of closed mills.
     */
    NumberOfMills(player : StoneColor) : number {
        // count each stone that is in a mill and then divide by three
        // as it is possible that a stone is in two mills simultaneously
        // we make them count twice
        return this.GetFieldsWithStone(player)
                .map(field => (this.CheckMillHorizontal(field) ? 1 : 0) + (this.CheckMillVertical(field) ? 1: 0))
                .reduce((a,b) => a + b) / 3;
    }
    /**
     * Returns the number of open mills that may be closed within one move
     * and that cannot be prohibited by a neighbor enemy stone.
     * @param {number} player The player for which to count the open mills.
     * @returns {number} the number of open mills.
     */
    NumberOfOpenMills(player : StoneColor) : number {
        // we check for horizontal and vertical mills (they count separate)
        // if an empty field can be settled to such one
        return this.GetEmptyFields().filter(fieldNum => (
                // can a stone be placed here to get a horizontal mill
                this.PotentialMillHorizontal(fieldNum, player)
                // if so are there any stones of the player in the neighborhood
                && GameNode.GetNeighborsColumn(fieldNum).some(neighbor =>
                    this.GetColorOnField(neighbor) === player)
                // if so are there no enemies that could prohibit this mill
                && GameNode.GetNeighborsColumn(fieldNum).every(neighbor =>
                    this.GetColorOnField(neighbor) !== 1-player) 
            )).length // we count all empty fields satisfying this conditions
            // same check for potential vertical mills
            + this.GetEmptyFields().filter(fieldNum => (
                this.PotentialMillVertical(fieldNum, player)
                && GameNode.GetNeighborsRow(fieldNum).some(neighbor =>
                    this.GetColorOnField(neighbor) === player)
                && GameNode.GetNeighborsRow(fieldNum).every(neighbor =>
                    this.GetColorOnField(neighbor) !== 1-player) 
            )).length;
    }
    /**
     * Gets the number of double mills a particular player has.
     * A double mill in this definition are two closed mills sharing a stone.
     * @param {number} player The player of which to count the double mills.
     * @returns {number} the number of double mills.
     */
    NumberOfDoubleMills(player : StoneColor) : number {
        // returns the number of stones that are in two closed mills simultaneously
        return this.stones[player]
            .filter((b, fieldNum) => b && this.CheckMillHorizontal(fieldNum) && this.CheckMillVertical(fieldNum))
            .length;
    }
    /**
     * Returns the number of open double mills that may be switched within one move.
     * @param {number} player The player for which to count the open double mills.
     * @returns {number} the number of open double mills.
     */
    NumberOfOpenDoubleMills(player : StoneColor) : number {
        return this.GetEmptyFields().filter(fieldNum => 
            // check all empty fields where a mill could be closed
            this.PotentialMill(fieldNum, player)
            // and check if one of the neighboring stones is in a closed mill
            && GameNode.GetNeighbors(fieldNum)
                .some(neighbor => this.stones[player][neighbor] 
                        && this.CheckMill(neighbor)
                )
        ).length;
    }
    /**
     * Gets the number of blocked stones a particular player has.
     * @param {number} player The player of which to count the blocked stones.
     * @returns {number} the number of blocked stones.
     */
    NumberOfBlockedStones(player : StoneColor) : number {
        // get all stones of the player
        return this.GetFieldsWithStone(player).filter(fieldNum => 
            // and select these where all neighbor fields are occupied
            GameNode.GetNeighbors(fieldNum).every(neighbor => 
                this.FieldIsOccupied(neighbor)
            )
        ).length // finally count them
    }

    /**
     * Returns a unique number representing the stones on the current game board.
     * Can be used as a hash to identify the current game board placement.
     * Remark: This is only possible if 64bit number representation is used as 3^24 > 2^32.
     * @returns {number} the unique number of the current game board.
     */
    CurrentStateToNumber() : number {
        return this.stones[0].map((b, fieldNum) => Math.pow(3, fieldNum) * (b ? 1 : 0)).reduce((a, b) => a + b, 0)
                + this.stones[1].map((b, fieldNum) => Math.pow(3, fieldNum) * (b ? 2 : 0)).reduce((a, b) => a + b, 0);
    }
}


/**
 * Stupid AI implementation using random selection among all possibilities.
 */
class EnemyAIMinimax implements EnemyAI {
    /** Color the AI plays for */
    color : StoneColor;
    
    /** How many moves the AI will look in the future */
    private startDepth : number = 4;
    /** If the AI will respect its time limit or take all possible moves into account */
    private respectLimit : boolean = true;

    /** The stored move that will be executed */
    private storedMove : GameMove;
    /** The time when the AI startet thinking */
    private startTime : number;
    /** Avoid looking at the same position two times so build a hashList */
    private hashForRepeat : boolean[];

    /**
     * Creates an instance of an AI using the alpha beta search.
     * @param {number} _color The color as which this AI plays.
     * @param {boolean} [_respectLimit] If the AI respect its time limit. Defaults to true.
     */
    constructor(_color : StoneColor, _respectLimit? : boolean) {
        this.color = _color;
        if (_respectLimit != null)
            this.respectLimit = _respectLimit;
    }
    /**
     * Function that invokes the AI if a move has to be performed.
     * @returns {boolean} if a move could be performed
     */
    MakeMove() : boolean {
        if (Game.currentPlayer != this.color) {
            // this should not be necessary but just in case lets log if it happens
            console.error("[AI] Current player is not AI.");
            return false;
        }

        // reset values for calculation
        this.hashForRepeat = [];
        this.storedMove = null;

        // just wait shortly to give html time to render
        setTimeout(() => {this.MakeMoveIntern();}, 50);
    }

    /**
     * Executes a previously calculated move stored in storedMove.
     * If no move was set a random decision amongst all possibilities will be used.
     */
    ExecuteMove() : void {
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
            this.storedMove = possibleMoves[Math.floor(Math.random()*possibleMoves.length)];
        }
        if (this.storedMove.phase == Game.phase) {
            // for each phase first check format of stored move and if ok call the belonging game board method.
            switch (Game.phase) {
                case 1: // place stones
                    if (this.storedMove.from == null && this.storedMove.to != null)
                        GameBoard.MoveCurrentStoneToField(GameBoard.gameFields[this.storedMove.to]);
                    else
                        console.error("[AI] Stored move is not in the right format.");
                    break;
                case 2: // move stones
                    if (this.storedMove.from != null && this.storedMove.to != null && GameBoard.gameFields[this.storedMove.from].owner)
                        GameBoard.MoveStoneToField(GameBoard.gameFields[this.storedMove.from].owner, GameBoard.gameFields[this.storedMove.to]);
                    else
                        console.error("[AI] Stored move is not in the right format.");
                    break;
                case 3: // remove stones
                    if (this.storedMove.to == null && this.storedMove.from != null && GameBoard.gameFields[this.storedMove.from].owner)
                        GameBoard.RemoveStoneFromField(GameBoard.gameFields[this.storedMove.from].owner);
                    else
                        console.error("[AI] Stored move is not in the right format.");
                    break;
                default:
                    console.error("[AI] No move possible during game phase "+Game.phase+"!");
                    break;
            }
        } else {
            console.error("[AI] Game phase "+this.storedMove.phase+" of suggested move does not fit actual game status (phase "+Game.phase+")!");
        }
    }
    
    /**
     * Calculates the next move and calls execution method.
     */
    MakeMoveIntern() : void {
        // set start time for restriction to a time limit
        this.startTime = Date.now();
        // Start alpha beta search:
        var rating = this.AlphaBeta(GameNode.GetFromCurrentBoard(), this.startDepth, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
        //console.log("[AI] Found move with rating "+rating+".");
        //console.log("[AI] "+(Date.now()-this.startTime)+"ms needed to calculate this move.");

        // AI has some time to move, as the html transition of the previous move might be still ongoing
        // the AI will wait the full time before executing the calculated move
        var remainingTime = Game.aiDecisionTime - (Date.now()-this.startTime);
        if (remainingTime > 10) {
            setTimeout(() => this.ExecuteMove(), remainingTime);
        } else {
            this.ExecuteMove();
        }
    } 

    /**
     * Customized implementation of the alpha beta pruning,
     * an optimization of the minimax algorithm both trying
     * to maximize the minimum possible store you can get by your move.
     * @param {GameNode} node The game state to look at.
     * @param {number} depth How deep the algorithm shall look.
     * @param {number} alpha The maximum rating the AI can get.
     * @param {number} beta The minimum rating the enemy can reach.
     */
    private AlphaBeta(node : GameNode, depth : number, alpha : number, beta : number) : number {
        // check if already a winner exists or final depth is reached
        // or time is up and AI respects it -> base case of the recursive call.
        var winner = node.GetWinner();
        if (winner != null || depth <= 0 
                || (this.respectLimit && Date.now()-this.startTime > Game.aiDecisionTime)) {
            // extra punishment if move causes the enemy to win.
            // it is bad to loose, but it is worse if our next move makes enemy win possible...
            // (cannot put this in GetRating() as depth and this.startDepth not accessible there)
            // second part of condition is for the case that we can take a stone (enemy will only get to move at turn 3 then)
            var punishment = ((winner == 1-this.color  && (depth == this.startDepth-2
                    || (depth == this.startDepth-3 && node.currentPlayer != this.color))) ? 1 : 0)
            
            return node.GetRating(this.color) 
                    - 500000 * punishment;
        }
        
        // get a list of all possible moves at the current game state
        var possibleMoves = node.GetPossibleMoves();
        
        // shortcut if winning is only one step away
        // this does not need much time but is much faster at the end of the game
        // as there typically less stones exist and thus way more possibilites
        if (depth == this.startDepth) {
            for(var move of possibleMoves) {
                // try the move
                node.PerformMove(move);
                // check if it results in the AI winning
                if (node.GetWinner() === this.color) {
                    console.log("[AI] Taking shortcut to win.")
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

        if (node.currentPlayer === this.color) { // ai tries to maximize the score
            var maxValue = alpha; // this value stores the new alpha
            for (var move of possibleMoves) {
                // try the move
                node.PerformMove(move);
                // check if this move results in a game board that we already looked at
                var currState = node.CurrentStateToNumber();
                if (!GameBoard.hashForDraw[currState] && !this.hashForRepeat[currState]) {
                    // if not then we add it to the hashList
                    this.hashForRepeat[currState] = true;
                    // recursively call the algorithm for the next move (depth decreased by one)
                    // also new alpha value is given as parameter
                    var value = this.AlphaBeta(node, depth-1, maxValue, beta);
                    // now as all future moves following on the current are checked
                    // we have not done this move so fare so configuration will be deleted from hashList again
                    this.hashForRepeat = this.hashForRepeat.splice(currState,1);
                } else {
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
                    if (maxValue >= beta) break; 
                    // it is better than previous moves so we will save it as possible candidate
                    if (depth == this.startDepth) {
                        this.storedMove = move;
                    }
                }
            }
            return maxValue;
        } else { // enemy tries to minimize the score
            var minValue = beta; // this value stores the new beta
            for (var move of possibleMoves) {
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
                    if (minValue <= alpha) break;
                }
            }
            return minValue;
        }
    }

    /**
     * Randomize array element order in-place using Durstenfeld shuffle algorithm.
     * @param {Array<any>} array The array that will be shuffled.
     * @returns {Array<any>} the shuffled array.
     */
    shuffleArray(array : Array<any>) : Array<any> {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }
}