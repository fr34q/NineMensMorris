/**
 * Interface describing a game move.
 */
interface GameMove {
    /** Phase where the move can be performed. */
    phase: number;
    /** From which field a stone is moved or -1 if stone is placed. */
    from: number; 
    /** To which field a stone is moved or -1 if stone is removed. */
    to: number
}


/**
 * Class for storing game information for the alpha beta algorithm.
 */
class GameNode {
    /** The left neighbor for each field or -1 if none. */
    static neighborLeft : number[] = [-1,0,1,-1,3,4,-1,6,7,-1,9,10,-1,12,13,-1,15,16,-1,18,19,-1,21,22];
    /** The right neighbor for each field or -1 if none. */
    static neighborRight : number[] = [1,2,-1,4,5,-1,7,8,-1,10,11,-1,13,14,-1,16,17,-1,19,20,-1,22,23,-1];
    /** The top neighbor for each field or -1 if none. */
    static neighborTop : number[] = [-1,-1,-1,-1,1,-1,-1,4,-1,0,3,6,8,5,2,11,-1,12,10,16,13,9,19,14];
    /** The bottom neighbor for each field or -1 if none. */
    static neighborBottom : number[] = [9,4,14,10,7,13,11,-1,12,21,18,15,17,20,23,-1,19,-1,-1,22,-1,-1,-1,-1];

    /** Tells if a stone of a certain color sits on a specific field, e.g. stones[color][field] */
    stones : Array<boolean[]>;
    /** The current player */
    currentPlayer : number;
    /** The current number of game turns */
    gameTurn : number;
    /** The current game phase */
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
     * @param {number} fieldnum Field number to determine the neighbors of.
     * @returns {Array<number>} all neighbors of the given field.
     */
    static GetNeighbors(fieldnum : number) : Array<number> {
        var arr = new Array<number>();
        if(GameNode.neighborLeft[fieldnum] != -1) arr.push(GameNode.neighborLeft[fieldnum]);
        if(GameNode.neighborRight[fieldnum] != -1) arr.push(GameNode.neighborRight[fieldnum]);
        if(GameNode.neighborTop[fieldnum] != -1) arr.push(GameNode.neighborTop[fieldnum]);
        if(GameNode.neighborBottom[fieldnum] != -1) arr.push(GameNode.neighborBottom[fieldnum]);
        return arr;
    }

    /**
     * Get list of all possible moves at the current game state.
     * @returns {Array<GameMove>} all possible moves.
     */
    GetPossibleMoves() : Array<GameMove> {
        var arr = new Array<GameMove>();
        if (this.GetWinner() != -1) return arr; // game ended -> no more moves
        switch (this.gamePhase) {
            case 1: // placing stones
                for (var fieldNum = 0; fieldNum < 24; fieldNum++) {
                    // check if field has already stone on it
                    if(this.stones[0][fieldNum] || this.stones[1][fieldNum]) continue;
                    arr.push({phase: this.gamePhase, from: -1, to: fieldNum });
                }
                break;
            case 2: // moving stones
                for (var fieldNum = 0; fieldNum < 24; fieldNum++) {
                    // current player needs a stone on the field
                    if(!this.stones[this.currentPlayer][fieldNum]) continue;
                    // if only 3 stones left player can move to any free spot
                    if(this.stones[this.currentPlayer].filter(b => b).length <= 3) {
                        for (var fieldNumTo = 0; fieldNumTo < 24; fieldNumTo++) {
                            // sort out all fields with stones on them
                            if(this.stones[0][fieldNumTo] || this.stones[1][fieldNumTo]) continue;
                            arr.push({phase: this.gamePhase, from: fieldNum, to: fieldNumTo});
                        }
                    } else {
                        // more than 3 stones so only take free neighbors into account
                        for (var neighbor of GameNode.GetNeighbors(fieldNum)) {
                            if(this.stones[0][neighbor] || this.stones[1][neighbor]) continue;
                            arr.push({phase: this.gamePhase, from: fieldNum, to: neighbor});
                        }
                    }
                }
                break;
            case 3: // removing stones
                for (var fieldNum = 0; fieldNum < 24; fieldNum++) {
                    // enemy needs a stone on the field
                    if(!this.stones[1-this.currentPlayer][fieldNum]) continue;
                    // cannot delete stone in mill
                    if(this.CheckMill(fieldNum)) continue; 
                    arr.push({phase: this.gamePhase, from: fieldNum, to: -1});
                }
                break;
        }
        return arr;
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
        if(this.GetWinner() != -1) {
            console.error("[AI] game already ended so no more moves possible.");
            return false;
        }
        switch(this.gamePhase) {
            case 1: // placing stones
                // check if move has right format and field where to go is empty
                if (move.from != -1 || move.to == -1 || this.stones[0][move.to] || this.stones[1][move.to]) {
                    console.error("[AI] game move has wrong values");
                    return false;
                }
                this.stones[this.currentPlayer][move.to] = true;
                this.IncrementAndUpdate(move.to);
                break;
            case 2: // moving stones
                // check format and if there is a stone that can be moved onto an empty field
                if (move.from == -1 || move.to == -1 || this.stones[0][move.to] || this.stones[1][move.to]
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
                if (move.from == -1 || move.to != -1 || !this.stones[1-this.currentPlayer][move.from] || this.CheckMill(move.from)) {
                    console.error("[AI] game move has wrong values");
                    return false;
                }
                this.stones[1-this.currentPlayer][move.from] = false;
                this.IncrementAndUpdate(move.from);
                break;
            default:
                console.error("[AI] Move in game phase "+move.phase+" could not be performed.")
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
                if(move.from != -1 || move.to == -1 || !this.stones[lastPlayer][move.to]) {
                    console.error("[AI] Move cannot be undone, wrong format. (1)");
                    return false;
                }
                this.stones[lastPlayer][move.to] = false;
                break;
            case 2: // moving stones
                // check format and if stone can moved back 
                if(move.from == -1 || move.to == -1 || !this.stones[lastPlayer][move.to]
                        || this.stones[0][move.from] || this.stones[1][move.from]) {
                    console.error("[AI] Move cannot be undone, wrong format. (2)");
                    return false;
                }
                this.stones[lastPlayer][move.from] = true;
                this.stones[lastPlayer][move.to] = false;
                break;
            case 3: // removing stones
                // check format and if there is no stone were it was removed
                if(move.from == -1 || move.to != -1 || this.stones[0][move.from] || this.stones[1][move.from]) {
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
        if (this.gamePhase != 3 && this.CheckMill(field)
                && (this.stones[1-this.currentPlayer]
                    .some((b,fieldNum) => b && !this.CheckMill(fieldNum))
                || this.stones[1-this.currentPlayer]
                    .filter(b=>b).length <= 3)) {
            
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
        var color = 0;
        if(this.stones[0][field]) color = 0;
        else if(this.stones[1][field]) color = 1
        else return false; // no stone on field

        if(GameNode.neighborLeft[field] != -1 && GameNode.neighborRight[field] != -1)
            // OXO <- field in center
            return this.stones[color][GameNode.neighborLeft[field]] && 
                    this.stones[color][GameNode.neighborRight[field]];
        if(GameNode.neighborLeft[field] != -1 && GameNode.neighborLeft[GameNode.neighborLeft[field]] != -1)
            // OOX <- field on right
            return this.stones[color][GameNode.neighborLeft[field]] && 
                    this.stones[color][GameNode.neighborLeft[GameNode.neighborLeft[field]]];
        if(GameNode.neighborRight[field] != -1 && GameNode.neighborRight[GameNode.neighborRight[field]] != -1)
            // XOO <- field on left
            return this.stones[color][GameNode.neighborRight[field]] && 
                    this.stones[color][GameNode.neighborRight[GameNode.neighborRight[field]]];
        return false;
    }
    /**
     * Check if the stone on the current field is involved in a vertical mill.
     * @param {number} field The field to check.
     * @returns {boolean} if a vertical mill is found on the field.
     */
    CheckMillVertical(field : number) : boolean {
        var color = 0;
        if(this.stones[0][field]) color = 0;
        else if(this.stones[1][field]) color = 1
        else return false; // no stone on field

        if(GameNode.neighborTop[field] != -1 && GameNode.neighborBottom[field] != -1)
            // OXO <- field in middle
            return this.stones[color][GameNode.neighborTop[field]] && 
                    this.stones[color][GameNode.neighborBottom[field]];
        if(GameNode.neighborTop[field] != -1 && GameNode.neighborTop[GameNode.neighborTop[field]] != -1)
            // OOX <- field on bottom
            return this.stones[color][GameNode.neighborTop[field]] && 
                    this.stones[color][GameNode.neighborTop[GameNode.neighborTop[field]]];
        if(GameNode.neighborBottom[field] != -1 && GameNode.neighborBottom[GameNode.neighborBottom[field]] != -1)
            // XOO <- field on top
            return this.stones[color][GameNode.neighborBottom[field]] && 
                    this.stones[color][GameNode.neighborBottom[GameNode.neighborBottom[field]]];
        return false;
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
     * Gets the winner of the current game if any.
     * @returns {number} The winner or -1 if none. 
     */
    GetWinner() : number {
        // check if mill was closed and enemy has only 3 stones left
        if(this.gamePhase == 3 && this.gameTurn > 17 && this.stones[1-this.currentPlayer].filter(b => b).length <= 3)
            return this.currentPlayer;
         
        if(this.gamePhase == 2) {
            if (this.stones[this.currentPlayer].filter(b => b).length <= 3)
                return -1; // player can jump
            // check if there are moveable stones left
            for (var fieldNum = 0; fieldNum < 24; fieldNum++) {
                // only look at fields where the current player has a stone
                if (!this.stones[this.currentPlayer][fieldNum]) continue;
                // check if some neighbor field are unoccupied
                if (GameNode.GetNeighbors(fieldNum).some(n => !this.stones[0][n] && !this.stones[1][n]))
                    return -1; // move possible
            }
            // if we have not returned yet no possible move was found
            // -> the other player wins
            return 1-this.currentPlayer;
        }
        return -1;
    }
    /**
     * Get the rating of the current game state.
     * @param {number} color The color of the player for which the store should be obtained.
     * @returns {number} the score of the game state.
     */
    GetRating(color: number) : number {
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
        // difference between number of double mills
        var criteria7 = this.NumberOfDoubleMills(this.currentPlayer) - this.NumberOfDoubleMills(1-this.currentPlayer);
        // winning configurations
        var winner = this.GetWinner();
        var criteria8 = (winner == -1) ? 0 : (winner == this.currentPlayer ? 1 : -1);

        var rating = 0;
        if (this.gamePhase == 1 || (this.gamePhase == 3 && this.gameTurn < 18)) {
            // while placing stones
            rating = 100 * criteria1 + 26 * criteria2 + 30 * criteria3 + 9 * criteria4 + 10 * criteria5 + 7 * criteria6;
        } else if (this.stones.some(a => a.filter(b => b).length <= 3)) {
            // one player has only 3 stones left
            rating = 300 * criteria1 + 10 * criteria5 + 1 * criteria6 + 500000 * criteria8;
        } else if (this.gamePhase == 2 || (this.gamePhase == 3 && this.gameTurn >= 18)) {
            // stones are moving
            rating = 500 * criteria1 + 43 * criteria2 + 30 * criteria3 + 11 * criteria4 + 8 * criteria7 + 500000 * criteria8;
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
    NumberOfTwoPieceConfs(player : number) : number {
        var count = 0;
        for (var fieldNum = 0; fieldNum < 24; fieldNum++) {
            // if stone on field move on
            if (this.stones[0][fieldNum] || this.stones[1][fieldNum]) continue;
            // set stone on field temporarily
            this.stones[player][fieldNum] = true;
            // check if this caused one or two mills to be created
            if (this.CheckMillHorizontal(fieldNum)) count++;
            if (this.CheckMillVertical(fieldNum)) count++;
            // remove stone again
            this.stones[player][fieldNum] = false;
        }
        return count;
    }
    /**
     * Returns the number of three piece configurations a particular player has.
     * A three piece configuration is one where there are two possibilities to
     * add a stone that would close a mill.
     * @param {number} player The player for which to count the configurations.
     * @returns {number} the number of three piece configurations.
     */
    NumberOfThreePieceConfs(player : number) : number {
        var count = 0;
        for (var fieldNum = 0; fieldNum < 24; fieldNum++) {
            if (this.stones[player][fieldNum]) continue;
            this.stones[player][fieldNum] = true;
            if (this.CheckMillHorizontal(fieldNum)) {
                // check if one of the placedstones can lead to a vertical mill
                // first get the other stones involved in the horizontal mill
                var placedStones = new Array<number>(2);
                if (GameNode.neighborLeft[fieldNum] != -1) {
                    placedStones.push(GameNode.neighborLeft[fieldNum]);
                    if(GameNode.neighborLeft[GameNode.neighborLeft[fieldNum]] != -1)
                        placedStones.push(GameNode.neighborLeft[GameNode.neighborLeft[fieldNum]]);
                    else if(GameNode.neighborRight[fieldNum] != -1)
                        placedStones.push(GameNode.neighborRight[fieldNum]);
                } else if (GameNode.neighborRight[fieldNum] != -1) {
                    placedStones.push(GameNode.neighborRight[fieldNum]);
                    if(GameNode.neighborRight[GameNode.neighborRight[fieldNum]] != -1)
                        placedStones.push(GameNode.neighborRight[GameNode.neighborRight[fieldNum]]);
                }
                // then check if these may result in a vertical mill (one stone placed, the other field empty)
                for (var j of placedStones) {
                    if (GameNode.neighborTop[j] != -1) {
                        if(GameNode.neighborTop[GameNode.neighborTop[j]] != -1) {
                            if ((this.stones[player][GameNode.neighborTop[GameNode.neighborTop[j]]] 
                                    && !this.stones[player][GameNode.neighborTop[j]]
                                    && !this.stones[1-player][GameNode.neighborTop[j]]) || 
                                    (!this.stones[player][GameNode.neighborTop[GameNode.neighborTop[j]]] 
                                    && !this.stones[1-player][GameNode.neighborTop[GameNode.neighborTop[j]]] 
                                    && this.stones[player][GameNode.neighborTop[j]])) {
                                count++;
                                break;
                            }
                        } else if(GameNode.neighborBottom[j] != -1) {
                            if ((this.stones[player][GameNode.neighborTop[j]] 
                                    && !this.stones[player][GameNode.neighborBottom[j]]
                                    && !this.stones[1-player][GameNode.neighborBottom[j]]) || 
                                    (!this.stones[player][GameNode.neighborTop[j]] 
                                    && !this.stones[1-player][GameNode.neighborTop[j]] 
                                    && this.stones[player][GameNode.neighborBottom[j]])) {
                                count++;
                                break;
                            }
                        }
                    } else if (GameNode.neighborBottom[j] != -1 && GameNode.neighborBottom[GameNode.neighborBottom[j]] != -1) {
                        if ((this.stones[player][GameNode.neighborBottom[GameNode.neighborBottom[j]]] 
                                && !this.stones[player][GameNode.neighborBottom[j]]
                                && !this.stones[1-player][GameNode.neighborBottom[j]]) || 
                                (!this.stones[player][GameNode.neighborBottom[GameNode.neighborBottom[j]]] 
                                && !this.stones[1-player][GameNode.neighborBottom[GameNode.neighborBottom[j]]] 
                                && this.stones[player][GameNode.neighborBottom[j]])) {
                            count++;
                            break;
                        }
                    }
                }
            }
            // do the same if the stone was in a vertical mill
            if (this.CheckMillVertical(fieldNum)) {
                // check if one of the placedstones can lead to a horizontal mill
                var placedStones = new Array<number>(2);
                if (GameNode.neighborTop[fieldNum] != -1) {
                    placedStones.push(GameNode.neighborTop[fieldNum]);
                    if(GameNode.neighborTop[GameNode.neighborTop[fieldNum]] != -1)
                        placedStones.push(GameNode.neighborTop[GameNode.neighborTop[fieldNum]]);
                    else if(GameNode.neighborBottom[fieldNum] != -1)
                        placedStones.push(GameNode.neighborBottom[fieldNum]);
                } else if (GameNode.neighborBottom[fieldNum] != -1) {
                    placedStones.push(GameNode.neighborBottom[fieldNum]);
                    if(GameNode.neighborBottom[GameNode.neighborBottom[fieldNum]] != -1)
                        placedStones.push(GameNode.neighborBottom[GameNode.neighborBottom[fieldNum]]);
                }
                for (var j of placedStones) {
                    if (GameNode.neighborLeft[j] != -1) {
                        if(GameNode.neighborLeft[GameNode.neighborLeft[j]] != -1) {
                            if ((this.stones[player][GameNode.neighborLeft[GameNode.neighborLeft[j]]] 
                                    && !this.stones[player][GameNode.neighborLeft[j]]
                                    && !this.stones[1-player][GameNode.neighborLeft[j]]) || 
                                    (!this.stones[player][GameNode.neighborLeft[GameNode.neighborLeft[j]]] 
                                    && !this.stones[1-player][GameNode.neighborLeft[GameNode.neighborLeft[j]]] 
                                    && this.stones[player][GameNode.neighborLeft[j]])) {
                                count++;
                                break;
                            }
                        } else if(GameNode.neighborRight[j] != -1) {
                            if ((this.stones[player][GameNode.neighborLeft[j]] 
                                    && !this.stones[player][GameNode.neighborRight[j]]
                                    && !this.stones[1-player][GameNode.neighborRight[j]]) || 
                                    (!this.stones[player][GameNode.neighborLeft[j]] 
                                    && !this.stones[1-player][GameNode.neighborLeft[j]] 
                                    && this.stones[player][GameNode.neighborRight[j]])) {
                                count++;
                                break;
                            }
                        }
                    } else if (GameNode.neighborRight[j] != -1 && GameNode.neighborRight[GameNode.neighborRight[j]] != -1) {
                        if ((this.stones[player][GameNode.neighborRight[GameNode.neighborRight[j]]] 
                                && !this.stones[player][GameNode.neighborRight[j]]
                                && !this.stones[1-player][GameNode.neighborRight[j]]) || 
                                (!this.stones[player][GameNode.neighborRight[GameNode.neighborRight[j]]] 
                                && !this.stones[1-player][GameNode.neighborRight[GameNode.neighborRight[j]]] 
                                && this.stones[player][GameNode.neighborRight[j]])) {
                            count++;
                            break;
                        }
                    }
                }
            }
            this.stones[player][fieldNum] = false;
        }
        // as there are two possibilities to close a mill
        // all three piece confs have been counted two times
        return count / 2;
    }
    /**
     * Gets the numbers of closed mills a player has.
     * @param {number} player The player from whom to count the mills.
     * @returns {number} the number of closed mills.
     */
    NumberOfMills(player : number) : number {
        // as we check all stones each mill would have counted three times
        // but two mills that share a stone would count as 5 stones
        // so we cannot divide by 3 in the end. Thus it will be saved if
        // a certain field is in a mill that was already counted.
        var alreadyHorizMill = new Array<boolean>(24);
        var alreadyVertiMill = new Array<boolean>(24);
        
        var count = 0;
        for (var fieldNum = 0; fieldNum < 24; fieldNum++) {
            // if this player has no stone there move on
            if (!this.stones[player][fieldNum]) continue;
            // check if there is a mill that has not been counted already
            if (this.CheckMillHorizontal(fieldNum) && !alreadyHorizMill[fieldNum]) {
                // mark the stones in the horizontal mill
                alreadyHorizMill[fieldNum] = true;
                if (GameNode.neighborLeft[fieldNum] != -1) {
                    alreadyHorizMill[GameNode.neighborLeft[fieldNum]] = true; 
                    if (GameNode.neighborLeft[GameNode.neighborLeft[fieldNum]] != -1) {
                        alreadyHorizMill[GameNode.neighborLeft[GameNode.neighborLeft[fieldNum]]] = true; 
                    }
                }
                if (GameNode.neighborRight[fieldNum] != -1) {
                    alreadyHorizMill[GameNode.neighborRight[fieldNum]] = true; 
                    if (GameNode.neighborRight[GameNode.neighborRight[fieldNum]] != -1) {
                        alreadyHorizMill[GameNode.neighborRight[GameNode.neighborRight[fieldNum]]] = true; 
                    }
                }
                // one mill found
                count++;
            }
            // check and do the same for vertical mills
            if (this.CheckMillVertical(fieldNum) && !alreadyVertiMill[fieldNum]) {
                alreadyVertiMill[fieldNum] = true;
                if (GameNode.neighborTop[fieldNum] != -1) {
                    alreadyVertiMill[GameNode.neighborTop[fieldNum]] = true; 
                    if (GameNode.neighborTop[GameNode.neighborTop[fieldNum]] != -1) {
                        alreadyVertiMill[GameNode.neighborTop[GameNode.neighborTop[fieldNum]]] = true; 
                    }
                }
                if (GameNode.neighborBottom[fieldNum] != -1) {
                    alreadyVertiMill[GameNode.neighborBottom[fieldNum]] = true; 
                    if (GameNode.neighborBottom[GameNode.neighborBottom[fieldNum]] != -1) {
                        alreadyVertiMill[GameNode.neighborBottom[GameNode.neighborBottom[fieldNum]]] = true; 
                    }
                }
                count++;
            }
        }
        return count;
    }
    /**
     * Gets the number of double mills a particular player has.
     * A double mill in this definition are two closed mills sharing a stone.
     * @param {number} player The player of which to count the double mills.
     * @returns {number} the number of double mills.
     */
    NumberOfDoubleMills(player : number) : number {
        // returns the number of stones that are in two closed mills simultaneously
        return this.stones[player]
            .filter((b, fieldNum) => b && this.CheckMillHorizontal(fieldNum) && this.CheckMillVertical(fieldNum))
            .length;
    }
    /**
     * Gets the number of blocked stones a particular player has.
     * @param {number} player The player of which to count the blocked stones.
     * @returns {number} the number of blocked stones.
     */
    NumberOfBlockedStones(player : number) : number {
        return this.stones[player].filter((b,fieldNum) => GameNode.GetNeighbors(fieldNum)
                .every(n => this.stones[0][n] || this.stones[1][n])).length
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
    color : number;
    
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
    constructor(_color : number, _respectLimit? : boolean) {
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
                    if (this.storedMove.from == -1 && this.storedMove.to != -1)
                        GameBoard.MoveCurrentStoneToField(GameBoard.gameFields[this.storedMove.to]);
                    else
                        console.error("[AI] Stored move is not in the right format.");
                    break;
                case 2: // move stones
                    if (this.storedMove.from != -1 && this.storedMove.to != -1 && GameBoard.gameFields[this.storedMove.from].owner)
                        GameBoard.MoveStoneToField(GameBoard.gameFields[this.storedMove.from].owner, GameBoard.gameFields[this.storedMove.to]);
                    else
                        console.error("[AI] Stored move is not in the right format.");
                    break;
                case 3: // remove stones
                    if (this.storedMove.to == -1 && this.storedMove.from != -1 && GameBoard.gameFields[this.storedMove.from].owner)
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
        console.log("[AI] Found move with rating "+rating+".");
        console.log("[AI] "+(Date.now()-this.startTime)+"ms needed to calculate this move.");

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
        if (winner != -1 || depth <= 0 
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
                if (node.GetWinner() == this.color) {
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

        if (node.currentPlayer == this.color) { // ai tries to maximize the score
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