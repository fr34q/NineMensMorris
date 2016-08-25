/**
 * Interface describing a game move.
 */
interface GameMove {phase: number; from: number; to: number}


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

    lastMove : GameMove;

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
        node.lastMove = this.lastMove;
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

    GetPossibleMoves() : Array<GameNode> {
        var arr = new Array<GameNode>();
        switch (this.gamePhase) {
            case 1: // placing stones
                for (var i = 0; i < 24; i++) {
                    if(this.stones[0][i] || this.stones[1][i]) continue;
                    if (this.stones[0][i] || this.stones[1][i])
                        continue;
                    var node = this.Clone();
                    node.stones[this.currentPlayer][i] = true;
                    node.lastMove = { phase: this.gamePhase, from: -1, to: i };
                    node.IncrementAndUpdate(i);
                    arr.push(node);
                }
                break;
            case 2: // moving stones
                for (var i = 0; i < 24; i++) {
                    if(!this.stones[this.currentPlayer][i]) continue;
                    if(this.stones[this.currentPlayer].filter(b => b).length <= 3) {
                        // can move on any free spot
                        for (var j = 0; j < 24; j++) {
                            if(this.stones[0][j] || this.stones[1][j]) continue;
                            var node = this.Clone();
                            node.stones[this.currentPlayer][i] = false;
                            node.stones[this.currentPlayer][j] = true;
                            node.lastMove = {phase: this.gamePhase, from: i, to: j};
                            node.IncrementAndUpdate(i);
                            arr.push(node);
                        }
                    } else {
                        for (var neighbor of GameNode.GetNeighbors(i)) {
                            if(this.stones[0][neighbor] || this.stones[1][neighbor]) continue;
                            var node = this.Clone();
                            node.stones[this.currentPlayer][i] = false;
                            node.stones[this.currentPlayer][neighbor] = true;
                            node.lastMove = {phase: this.gamePhase, from: i, to: neighbor};
                            node.IncrementAndUpdate(i);
                            arr.push(node);
                        }
                    }
                }
                break;
            case 3: // removing stones
                for (var i = 0; i < 24; i++) {
                    if(!this.stones[1-this.currentPlayer][i]) continue;
                    if(this.CheckMill(i)) continue; // cannot delete stone in mill
                    var node = this.Clone();
                    node.stones[this.currentPlayer][i] = false;
                    node.lastMove = {phase: this.gamePhase, from: i, to: -1};
                    node.IncrementAndUpdate(i);
                    arr.push(node);
                }
                break;
        }
        return arr;
    }

    IncrementAndUpdate(fieldnum : number) : void {
        if (this.CheckMill(fieldnum)) {
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
        if(this.gamePhase == 3 && this.stones[1-this.currentPlayer].filter(b => b).length <= 3)
            return this.currentPlayer;
        if(this.gamePhase == 2) {
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

    GetRating() : number {
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
        
        if (this.gamePhase == 1 || (this.gamePhase == 3 && this.gameTurn < 18)) {
            return 18 * criteria1 + 26 * criteria2 + 1 * criteria3 + 9 * criteria4 + 10 * criteria5 + 7 * criteria6;
        }
        if (this.stones.some(a => a.filter(b => b).length <= 3)) {
            return 16 * criteria1 + 10 * criteria5 + 1 * criteria6 + 1190 * criteria8;
        }
        if (this.gamePhase == 2 || (this.gamePhase == 3 && this.gameTurn >= 18)) {
            return 14 * criteria1 + 43 * criteria2 + 10 * criteria3 + 11 * criteria4 + 8 * criteria7 + 1086 * criteria8;
        }
        console.error("[AI] Could not calculate score for game configuration...");
        return 0;
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
}


/**
 * Stupid AI implementation using random selection among all possibilities.
 */
class EnemyAIMinimax implements EnemyAI {
    color : number;

    private startDepth : number = 4;

    private storedMove : GameMove;

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
        setTimeout(() => this.MakeMoveIntern(), Game.enemyAIRandomSleepTime);

        // Start alpha beta search:
        this.storedMove = null;
        var rating = this.AlphaBeta(GameNode.GetFromCurrentBoard(), this.startDepth, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
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
        console.log("[AI] Time is up alert!");
        
    } 

    private AlphaBeta(node : GameNode, depth : number, alpha : number, beta : number) : number {
        console.log("alpha: "+alpha+" ; beta: "+beta+" ; depth: "+depth);
        var winner = node.GetWinner();
        if (winner != -1 || depth <= 0) {
            return node.currentPlayer == this.color ? node.GetRating() : - node.GetRating();
        }
        
        var children = node.GetPossibleMoves(); // generates children. also rates them and applies move to copy of field. 
        
        if (node.currentPlayer == this.color) { // ai tries to maximize the score
            var maxValue = alpha;
            for (var child of children) {
                console.log(child.lastMove);
                var value = this.AlphaBeta(child, depth-1, maxValue, beta);

                if (value > maxValue) {
                    maxValue = value;
                    if (maxValue >= beta) break; // cutoff
                    if (depth == this.startDepth) {
                        // save potential move
                        this.storedMove = child.lastMove;
                    }
                }
            }
            return maxValue;
        } else { // enemy tries to minimize the score
            var minValue = beta;
            for (var child of children) {
                var value = this.AlphaBeta(child, depth - 1, alpha, minValue);
                if (value < minValue) {
                    minValue = value;
                    if (minValue <= alpha) break; // cutoff
                }
            }
            return minValue;
        }
    }
}