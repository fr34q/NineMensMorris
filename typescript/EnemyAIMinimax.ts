/**
 * Interface describing a game move.
 */
interface GameMove {phase: number; from: number; to: number}

class GameMoveNode {
    move : GameMove;
    parentNode : GameMoveNode;

    nextMoves : GameMoveNode[];

    private _rating : number;
    get rating() : number {return this._rating;}
    set rating(newRating : number) {
        this._rating = newRating;
        if(this.nextMaxRating < newRating) this.nextMaxRating = newRating;
        if(this.nextMinRating > newRating) this.nextMinRating = newRating;
        if (this.parentNode) 
            this.parentNode.NextRatingChanged(this.nextMinRating, this.nextMaxRating);
    }

    nextMinRating : number = Number.POSITIVE_INFINITY;
    nextMaxRating : number = Number.NEGATIVE_INFINITY;

    private childrenRated : boolean = false;

    constructor(_move : GameMove, _parentNode : GameMoveNode) {
        this.move = _move;
        this.parentNode = _parentNode;
        this.nextMoves = [];
    }

    NextRatingChanged(min: number, max: number) : void {
        var push = false;
        if (min < this.nextMinRating || !this.childrenRated) { this.nextMinRating = min; push = true; }
        if (max > this.nextMaxRating || !this.childrenRated) { this.nextMaxRating = max; push = true; }
         // will be changed on first call so nodes with childs have nextMin/MaxRating accordingly
         // and those without return their own rating
        this.childrenRated = true;
        if (push && this.parentNode) 
            this.parentNode.NextRatingChanged(this.nextMinRating, this.nextMaxRating); 
    }

    AddNextMove(move : GameMove) : GameMoveNode {
        var node = new GameMoveNode(move,this);
        this.nextMoves.push(node);
        return node;
    }
}


/**
 * Class for storing game information for the alpha beta algorithm.
 */
class GameNode {
    static neighborLeft : number[] = [-1,0,1,-1,3,4,-1,6,7,-1,9,10,-1,12,13,-1,15,16,-1,18,19,-1,21,22];
    static neighborRight : number[] = [1,2,-1,4,5,-1,7,8,-1,10,11,-1,13,14,-1,16,17,-1,19,20,-1,22,23,-1];
    static neighborTop : number[] = [-1,-1,-1,-1,1,-1,-1,4,-1,0,3,6,8,5,2,11,-1,12,10,16,13,9,19,14];
    static neighborBottom : number[] = [9,4,14,10,7,13,11,-1,12,21,18,15,17,20,23,-1,19,-1,-1,22,-1,-1,-1,-1];

    stones : Array<boolean[]>;
    currentPlayer : number;
    gameTurn : number;
    gamePhase : number;

    /**
     *  Creates a class for storing a game state.
     */
    constructor() {
        this.stones = [new Array<boolean>(24), new Array<boolean>(24)];
        // if undefined !(..) will result as true like expected from false -> can leave out explicit definition
        /*
        for (var i = 0; i < 24; i++) {
            this.stones[0][i] = false;
            this.stones[1][i] = false;
        }
        */
    }

    Clone() : GameNode {
        var node = new GameNode();
        node.stones = [this.stones[0].slice(0), this.stones[1].slice(0)];
        node.currentPlayer = this.currentPlayer;
        node.gameTurn = this.gameTurn;
        node.gamePhase = this.gamePhase;
        return node;
    }

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

    static GetNeighbors(fieldnum : number) : Array<number> {
        var arr = new Array<number>();
        if(GameNode.neighborLeft[fieldnum] != -1) arr.push(GameNode.neighborLeft[fieldnum]);
        if(GameNode.neighborRight[fieldnum] != -1) arr.push(GameNode.neighborRight[fieldnum]);
        if(GameNode.neighborTop[fieldnum] != -1) arr.push(GameNode.neighborTop[fieldnum]);
        if(GameNode.neighborBottom[fieldnum] != -1) arr.push(GameNode.neighborBottom[fieldnum]);
        return arr;
    }

    GetPossibleMoves() : Array<GameMove> {
        var arr = new Array<GameMove>();
        if(this.GetWinner() != -1) return arr; // game ended -> no more moves
        switch (this.gamePhase) {
            case 1: // placing stones
                for (var i = 0; i < 24; i++) {
                    if(this.stones[0][i] || this.stones[1][i]) continue;
                    if (this.stones[0][i] || this.stones[1][i])
                        continue;
                    arr.push({phase: this.gamePhase, from: -1, to: i });
                }
                break;
            case 2: // moving stones
                for (var i = 0; i < 24; i++) {
                    if(!this.stones[this.currentPlayer][i]) continue;
                    if(this.stones[this.currentPlayer].filter(b => b).length <= 3) {
                        // can move on any free spot
                        for (var j = 0; j < 24; j++) {
                            if(this.stones[0][j] || this.stones[1][j]) continue;
                            arr.push({phase: this.gamePhase, from: i, to: j});
                        }
                    } else {
                        for (var neighbor of GameNode.GetNeighbors(i)) {
                            if(this.stones[0][neighbor] || this.stones[1][neighbor]) continue;
                            arr.push({phase: this.gamePhase, from: i, to: neighbor});
                        }
                    }
                }
                break;
            case 3: // removing stones
                for (var i = 0; i < 24; i++) {
                    if(!this.stones[1-this.currentPlayer][i]) continue;
                    if(this.CheckMill(i)) continue; // cannot delete stone in mill
                    arr.push({phase: this.gamePhase, from: i, to: -1});
                }
                break;
        }
        return arr;
    }

    PerformMove(move : GameMove) : boolean {
        if(move.phase != this.gamePhase) {
            console.error("[AI] move not fitting to current game node. ("+move.phase+" =/= "+this.gamePhase+")");
            return false;
        }
        switch(this.gamePhase) {
            case 1: // placing stones
                if (move.from != -1 || move.to == -1 || this.stones[0][move.to] || this.stones[1][move.to]) {
                    console.error("[AI] game move has wrong values");
                    return false;
                }
                this.stones[this.currentPlayer][move.to] = true;
                this.IncrementAndUpdate(move.to);
                break;
            case 2: // moving stones
                if (move.from == -1 || move.to == -1 || this.stones[0][move.to] || this.stones[1][move.to]
                        || !this.stones[this.currentPlayer][move.from]) {
                    console.error("[AI] game move has wrong values");
                    console.log(move);
                    return false;
                }
                this.stones[this.currentPlayer][move.from] = false;
                this.stones[this.currentPlayer][move.to] = true;
                this.IncrementAndUpdate(move.to);
                break;
            case 3: // removing stones
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
    UndoMove(move : GameMove) : boolean {
        var lastPlayer = this.gamePhase == 3 ? this.currentPlayer : 1-this.currentPlayer;

        switch(move.phase) { 
            case 1: // placing stones
                if(move.from != -1 || move.to == -1 || !this.stones[lastPlayer][move.to]) {
                    console.error("[AI] Move cannot be undone, wrong format. (1)");
                    return false;
                }
                this.stones[lastPlayer][move.to] = false;
                break;
            case 2: // moving stones
                if(move.from == -1 || move.to == -1 || !this.stones[lastPlayer][move.to]
                        || this.stones[0][move.from] || this.stones[1][move.from]) {
                    console.error("[AI] Move cannot be undone, wrong format. (2)");
                    return false;
                }
                this.stones[lastPlayer][move.from] = true;
                this.stones[lastPlayer][move.to] = false;
                break;
            case 3: // removing stones
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

    IncrementAndUpdate(fieldnum : number) : void {
        if (this.gamePhase != 3 && this.CheckMill(fieldnum)) {
            this.gamePhase = 3;
            // no game turn increment / player switch
            return;
        }
        this.gamePhase = (this.gameTurn < 17) ? 1 : 2;
        this.gameTurn++;
        this.currentPlayer = 1 - this.currentPlayer;
    }

    CheckMillHorizontal(fieldnum : number) : boolean {
        var color = 0;
        if(this.stones[0][fieldnum]) color = 0;
        else if(this.stones[1][fieldnum]) color = 1
        else return false; // no stone on field

        if(GameNode.neighborLeft[fieldnum] != -1 && GameNode.neighborRight[fieldnum] != -1)
            return this.stones[color][GameNode.neighborLeft[fieldnum]] && 
                    this.stones[color][GameNode.neighborRight[fieldnum]];
        if(GameNode.neighborLeft[fieldnum] != -1 && GameNode.neighborLeft[GameNode.neighborLeft[fieldnum]] != -1)
            return this.stones[color][GameNode.neighborLeft[fieldnum]] && 
                    this.stones[color][GameNode.neighborLeft[GameNode.neighborLeft[fieldnum]]];
        if(GameNode.neighborRight[fieldnum] != -1 && GameNode.neighborRight[GameNode.neighborRight[fieldnum]] != -1)
            return this.stones[color][GameNode.neighborRight[fieldnum]] && 
                    this.stones[color][GameNode.neighborRight[GameNode.neighborRight[fieldnum]]];
        return false;
    }
    CheckMillVertical(fieldnum : number) : boolean {
        var color = 0;
        if(this.stones[0][fieldnum]) color = 0;
        else if(this.stones[1][fieldnum]) color = 1
        else return false; // no stone on field

        if(GameNode.neighborTop[fieldnum] != -1 && GameNode.neighborBottom[fieldnum] != -1)
            return this.stones[color][GameNode.neighborTop[fieldnum]] && 
                    this.stones[color][GameNode.neighborBottom[fieldnum]];
        if(GameNode.neighborTop[fieldnum] != -1 && GameNode.neighborTop[GameNode.neighborTop[fieldnum]] != -1)
            return this.stones[color][GameNode.neighborTop[fieldnum]] && 
                    this.stones[color][GameNode.neighborTop[GameNode.neighborTop[fieldnum]]];
        if(GameNode.neighborBottom[fieldnum] != -1 && GameNode.neighborBottom[GameNode.neighborBottom[fieldnum]] != -1)
            return this.stones[color][GameNode.neighborBottom[fieldnum]] && 
                    this.stones[color][GameNode.neighborBottom[GameNode.neighborBottom[fieldnum]]];
        return false;
    }
    CheckMill(fieldnum : number) : boolean {
        return this.CheckMillHorizontal(fieldnum) || this.CheckMillVertical(fieldnum);
    }

    GetWinner() : number {
        if(this.gamePhase == 3 && this.gameTurn > 17 && this.stones[1-this.currentPlayer].filter(b => b).length <= 3)
            return this.currentPlayer;
        if(this.gamePhase == 2) {
            if (this.stones[this.currentPlayer].filter(b => b).length <= 3)
                return -1; // player can jump
            // check if there are moveable stones left
            for (var i = 0; i < 24; i++) {
                if (!this.stones[this.currentPlayer][i]) continue;
                if (GameNode.GetNeighbors(i).some(n => !this.stones[0][n] && !this.stones[1][n]))
                    return -1; // move possible
            }
            return 1-this.currentPlayer;
        }
        return -1;
    }

    GetRating(color : number) : number {
        // Rating procedure follows roughly:
        // https://kartikkukreja.wordpress.com/2014/03/17/heuristicevaluation-function-for-nine-mens-morris/

        // mill closed for currentPlayer
        var criteria1 = this.gamePhase == 3 ? 1 : 0;
        // difference mills
        var criteria2 = this.NumberOfMills(this.currentPlayer) - this.NumberOfMills(1-this.currentPlayer);
        // difference between blocked stones
        var criteria3 = this.NumberOfBlockedStones(this.currentPlayer) - this.NumberOfBlockedStones(1-this.currentPlayer);
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
        // punishment for draw / repeating sequences
        var criteria9 = GameBoard.hashForDraw[this.CurrentStateToNumber()] || this.gameTurn-GameBoard.lastTurnMill > 45 ? -1 : 0;

        var rating = 0;        
        if (this.gamePhase == 1 || (this.gamePhase == 3 && this.gameTurn < 18)) {
            rating = 100 * criteria1 + 30 * criteria2 + 5 * criteria3 + 10 * criteria4 + 30 * criteria5 + 50 * criteria6;
        }
        if (this.stones.some(a => a.filter(b => b).length <= 3)) {
            rating = 300 * criteria1 + 30 * criteria5 + 40 * criteria6 + 500000 * criteria8;
        }
        if (this.gamePhase == 2 || (this.gamePhase == 3 && this.gameTurn >= 18)) {
            rating = 500 * criteria1 + 60 * criteria2 + 15 * criteria3 + 20 * criteria4 + 40 * criteria7 + 500000 * criteria8;
        }
        rating *= (color == this.currentPlayer) ? 1 : -1;
        return rating + criteria9*100000;
    }

    NumberOfTwoPieceConfs(player : number) : number {
        var count = 0;
        for (var i = 0; i < 24; i++) {
            if (this.stones[player][i]) continue;
            this.stones[player][i] = true;
            if ((this.CheckMillHorizontal(i) && !this.CheckMillVertical(i)) ||
                    (this.CheckMillVertical(i) && !this.CheckMillHorizontal(i)))
                count++;
            this.stones[player][i] = false;
        }
        return count;
    }
    NumberOfThreePieceConfs(player : number) : number {
        var count = 0;
        for (var i = 0; i < 24; i++) {
            if (this.stones[player][i]) continue;
            this.stones[player][i] = true;
            if (this.CheckMillHorizontal(i)) {
                // check if one of the placedstones can lead to a vertical mill
                var placedStones = new Array<number>(2);
                if (GameNode.neighborLeft[i] != -1) {
                    placedStones.push(GameNode.neighborLeft[i]);
                    if(GameNode.neighborLeft[GameNode.neighborLeft[i]] != -1)
                        placedStones.push(GameNode.neighborLeft[GameNode.neighborLeft[i]]);
                    else if(GameNode.neighborRight[i] != -1)
                        placedStones.push(GameNode.neighborRight[i]);
                } else if (GameNode.neighborRight[i] != -1) {
                    placedStones.push(GameNode.neighborRight[i]);
                    if(GameNode.neighborRight[GameNode.neighborRight[i]] != -1)
                        placedStones.push(GameNode.neighborRight[GameNode.neighborRight[i]]);
                }
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
            if (this.CheckMillVertical(i)) {
                // check if one of the placedstones can lead to a horizontal mill
                var placedStones = new Array<number>(2);
                if (GameNode.neighborTop[i] != -1) {
                    placedStones.push(GameNode.neighborTop[i]);
                    if(GameNode.neighborTop[GameNode.neighborTop[i]] != -1)
                        placedStones.push(GameNode.neighborTop[GameNode.neighborTop[i]]);
                    else if(GameNode.neighborBottom[i] != -1)
                        placedStones.push(GameNode.neighborBottom[i]);
                } else if (GameNode.neighborBottom[i] != -1) {
                    placedStones.push(GameNode.neighborBottom[i]);
                    if(GameNode.neighborBottom[GameNode.neighborBottom[i]] != -1)
                        placedStones.push(GameNode.neighborBottom[GameNode.neighborBottom[i]]);
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
            this.stones[player][i] = false;
        }
        return count;
    }
    /*
    NumberOfMills(player : number) : number {
        var alreadyHorizMill = new Array<boolean>(24);
        var alreadyVertiMill = new Array<boolean>(24);
        
        var count = 0;
        for (var i = 0; i < 24; i++) {
            if (!this.stones[player][i]) continue;
            if (this.CheckMillHorizontal(i) && !alreadyHorizMill[i]) {
                alreadyHorizMill[i] = true;
                if (GameNode.neighborLeft[i] != -1) {
                    alreadyHorizMill[GameNode.neighborLeft[i]] = true; 
                    if (GameNode.neighborLeft[GameNode.neighborLeft[i]] != -1) {
                        alreadyHorizMill[GameNode.neighborLeft[GameNode.neighborLeft[i]]] = true; 
                    }
                }
                if (GameNode.neighborRight[i] != -1) {
                    alreadyHorizMill[GameNode.neighborRight[i]] = true; 
                    if (GameNode.neighborRight[GameNode.neighborRight[i]] != -1) {
                        alreadyHorizMill[GameNode.neighborRight[GameNode.neighborRight[i]]] = true; 
                    }
                }
                count++;
            }
            if (this.CheckMillVertical(i) && !alreadyVertiMill[i]) {
                alreadyVertiMill[i] = true;
                if (GameNode.neighborTop[i] != -1) {
                    alreadyVertiMill[GameNode.neighborTop[i]] = true; 
                    if (GameNode.neighborTop[GameNode.neighborTop[i]] != -1) {
                        alreadyVertiMill[GameNode.neighborTop[GameNode.neighborTop[i]]] = true; 
                    }
                }
                if (GameNode.neighborBottom[i] != -1) {
                    alreadyVertiMill[GameNode.neighborBottom[i]] = true; 
                    if (GameNode.neighborBottom[GameNode.neighborBottom[i]] != -1) {
                        alreadyVertiMill[GameNode.neighborBottom[GameNode.neighborBottom[i]]] = true; 
                    }
                }
                count++;
            }
        }
        return count;
    }
    */
    NumberOfMills(player : number) : number {
        var count = 0;
        for (var i = 0; i < 24; i++) {
            if (!this.stones[player][i]) continue;
            if (this.CheckMillHorizontal(i)) count++;
            if (this.CheckMillVertical(i)) count++;
        }
        return count/3; // only rough approximation but better than nothing
    }
    NumberOfDoubleMills(player : number) : number {
        var count = 0;
        for (var i = 0; i < 24; i++) {
            if (!this.stones[player][i]) continue;
            if (this.CheckMillHorizontal(i) && this.CheckMillVertical(i)) {
                count++;
            }
        }
        return count;
    }
    NumberOfBlockedStones(player : number) : number {
        return this.stones[player].filter((b,i) => GameNode.GetNeighbors(i)
                .every(n => this.stones[0][n] || this.stones[1][n])).length
    }

    CurrentStateToNumber() : number {
        return this.stones[0].map((b, i) => Math.pow(3, i) * (b ? 1 : 0)).reduce((a, b) => a + b, 0)
                + this.stones[1].map((b, i) => Math.pow(3, i) * (b ? 2 : 0)).reduce((a, b) => a + b, 0);
    }
}


/**
 * Stupid AI implementation using random selection among all possibilities.
 */
class EnemyAIMinimax implements EnemyAI {
    color : number;

    private storedMove : GameMove;
    private finished : boolean;
    private startTime : number;
    private timeUp : boolean;
    private timoutHandler : number;
    private hashForRepeat : boolean[];

    constructor(_color : number) {
        this.color = _color;
    }

    MakeMove() : boolean {
        if (Game.currentPlayer != this.color) {
            // this should not be necessary but just in case lets log if it happens
            console.error("[AI] Current player is not AI.");
            return false;
        }

        // Wait the given time before executing actual move calculation
        // just wait shortly to give html time to render
        setTimeout(() => {this.MakeMoveIntern();}, 50);

        this.hashForRepeat = [];
        this.finished = false;
        this.timeUp = false;
        this.startTime = Date.now();
    }

    ExecuteMove() : void {
        if (this.storedMove == null) {
            console.error("[AI] No moves could be calculated! This should not have happened.");
        } else if (this.storedMove.phase == Game.phase) {
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
            console.error("[AI] Game phase of suggested move does not fit actual game status!");
        }
    }

    MakeMoveIntern() : void {
        //console.log("[AI] Time is up alert!");
        // Start alpha beta search:
        this.storedMove = null;
        var rating = this.BFS();
        clearTimeout(this.timoutHandler); // clear timeout so it will not be triggered during the next run
        console.log("[AI] Found move with rating "+rating+".");
        //console.log(this.storedMove);
        this.finished = true;
        this.ExecuteMove();
    } 

    
    private BFS() : number {
        var gameMoveNodeSource = new GameMoveNode(null, null);
        var gameNode = GameNode.GetFromCurrentBoard();

        var currentNodes : GameMoveNode[] = [gameMoveNodeSource];
        var nextNodes : GameMoveNode[] = [];
        var level = 0;

        while ((currentNodes.length > 0 || nextNodes.length > 0) && Date.now()-this.startTime <= Game.enemyAIRandomSleepTime) {
            if (currentNodes.length == 0) {
                currentNodes = nextNodes;
                currentNodes.sort((n1,n2) => n2.rating - n1.rating); // high ratings to the end
                // limit currentNodes (take the best ratings) -> no guarantees anymore but faster
                currentNodes = currentNodes.slice(currentNodes.length-200);
                nextNodes = [];
                level++;
            }
            var moveNode = currentNodes.pop();
            //console.log(level+": "+moveNode.rating);
            //console.log(moveNode.move);

            
            var moveStack : GameMove[] = []
            var moveBack = moveNode;
            while (moveBack.parentNode) {
                moveStack.push(moveBack.move);
                moveBack = moveBack.parentNode;
            }
            for (var i = moveStack.length-1; i >= 0; i--) {
                gameNode.PerformMove(moveStack[i]);
            }

            var possibleMoves = gameNode.GetPossibleMoves();
            for (var move of possibleMoves) {
                var node = moveNode.AddNextMove(move);
                gameNode.PerformMove(move);
                node.rating = gameNode.GetRating(this.color);
                gameNode.UndoMove(move);
                nextNodes.push(node);
            }

            for (var i = 0; i < moveStack.length; i++) {
                gameNode.UndoMove(moveStack[i]);
            }
        }

        var maxMinRating = Number.NEGATIVE_INFINITY;
        let bestMove : GameMove;
        // shuffle to make AI a bit more non-deterministic
        this.shuffleArray(gameMoveNodeSource.nextMoves).forEach(node => {
            if(node.nextMinRating > maxMinRating) {
                maxMinRating = node.nextMinRating;
                bestMove = node.move;
            }
        });

        // if for some reason no move could be obtained
        if(!bestMove) {
            var possibleMoves = GameNode.GetFromCurrentBoard().GetPossibleMoves();
            if (possibleMoves.length) {
                console.error("[AI] No possible moves found...");
                return undefined;
            }
            bestMove = possibleMoves[Math.floor(Math.random()*possibleMoves.length)];
            console.log("[AI] No move could be obtained, making random decision.")
        }
        this.storedMove = bestMove;

        //console.log(gameMoveNodeSource);
        console.log("[AI] "+(Date.now()-this.startTime)+"ms needed to calculate this move, reaching level "+level+".");

        return maxMinRating;
    }

    /**
     * Randomize array element order in-place.
     * Using Durstenfeld shuffle algorithm.
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