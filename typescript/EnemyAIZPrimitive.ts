/**
 * Primitive AI implementing some basic rules for creating mills etc.
 */
class EnemyAIPrimitive extends EnemyAIRandom {
    // as extending random AI wie only need to override this function
    MakeMoveIntern() : boolean {
        switch (Game.phase) {
            case 1: // place stones
            case 2: // move stones
                let moveableStones : Array<GameStone>; 
                if (Game.phase == 1 && (GameBoard.activeStone && GameBoard.activeStone.color == this.color)) {
                    moveableStones = [GameBoard.activeStone];
                } else if (Game.phase == 2) {
                    moveableStones = GameBoard.GetStonesOnField(this.color).filter(s => s.isMoveable);
                } else {
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
                let preferredStone : GameStone = null;
                let preferredField : GameField = null;
                for(var stone of moveableStones) {
                    var possibleFields = GameBoard.gameFields.filter(f => f.CanStoneMoveTo(stone));
                    for (var field of possibleFields) {
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
                var enemyStones = GameBoard.stones[1-this.color]; // need all stones (not only the placed ones)
                var badFields = new Array<GameField>();
                for(var stone of enemyStones) {
                    var possibleFields = GameBoard.gameFields.filter(f => f.CanStoneMoveTo(stone));
                    for (var field of possibleFields) {
                        if (EnemyAIPrimitive.wouldBeMuehle(field, stone)) {
                            badFields.push(field);
                        }
                    }
                }
                // Check all own moveable stones if one can prohibit this
                preferredStone = null;
                preferredField = null;
                for (var field of badFields) {
                    for (var stone of moveableStones) {
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
                if(Game.phase == 1) { // only do this while still placing stones having the full field selection
                    var possibleFields = new Array<GameField>();
                    // Get all fields who are empty and have one own stone and another free field in its row/column
                    GameBoard.GetStonesOnField(this.color).forEach(stone => {
                        // check for horizontal candidates
                        if(stone.field.neighborLeft) {
                            if(stone.field.neighborRight) {
                                // current stone is placed in the middle of a row
                                if(!stone.field.neighborLeft.owner && !stone.field.neighborRight.owner) {
                                    // left and right neighbors are empty -> possible candidates
                                    possibleFields.push(stone.field.neighborLeft);
                                    possibleFields.push(stone.field.neighborRight);
                                }
                            } else if (stone.field.neighborLeft.neighborLeft) {
                                // stone is placed on the right field of a row
                                if(!stone.field.neighborLeft.owner && !stone.field.neighborLeft.neighborLeft.owner) {
                                    // both fields on the left are empty -> possible candidates
                                    possibleFields.push(stone.field.neighborLeft);
                                    possibleFields.push(stone.field.neighborLeft.neighborLeft);
                                }
                            }
                        } else if (stone.field.neighborRight && stone.field.neighborRight.neighborRight) {
                            // stone is placed on the left field of a row
                            if(!stone.field.neighborRight.owner && !stone.field.neighborRight.neighborRight.owner) {
                                // both right neighbors are empty -> possible candidates
                                possibleFields.push(stone.field.neighborRight);
                                possibleFields.push(stone.field.neighborRight.neighborRight);
                            }
                        }
                        // check for vertical candidates
                        if(stone.field.neighborTop) {
                            if(stone.field.neighborBottom) {
                                // current stone is placed in the middle of a column
                                if(!stone.field.neighborTop.owner && !stone.field.neighborBottom.owner) {
                                    //top and bottom neighbors are empty -> possible candidates
                                    possibleFields.push(stone.field.neighborTop);
                                    possibleFields.push(stone.field.neighborBottom);
                                }
                            } else if (stone.field.neighborTop.neighborTop) {
                                // stone is placed at the bottom of a column
                                if(!stone.field.neighborTop.owner && !stone.field.neighborTop.neighborTop.owner) {
                                    // both fields at the top are empty -> possible candidates
                                    possibleFields.push(stone.field.neighborTop);
                                    possibleFields.push(stone.field.neighborTop.neighborTop);
                                }
                            }
                        } else if (stone.field.neighborBottom && stone.field.neighborBottom.neighborBottom) {
                            // stone is placed at the top of a column
                            if(!stone.field.neighborBottom.owner && !stone.field.neighborBottom.neighborBottom.owner) {
                                // both bottom neighbors are empty -> possible candidates
                                possibleFields.push(stone.field.neighborBottom);
                                possibleFields.push(stone.field.neighborBottom.neighborBottom);
                            }
                        }
                    });
                    // if a possible field is found select one randomly and move stone there
                    if (possibleFields.length > 1) {
                        var field = possibleFields[Math.floor(Math.random()*possibleFields.length)];
                        return GameBoard.MoveCurrentStoneToField(field);
                    }
                }
                break;
        }
        // if no preferable moves were found just call the method from the random AI this class extends
        return super.MakeMoveIntern();
    } 

    /**
     * Helper method to determine if placing/moving a stone onto a field would cause a horizontal mill.
     * @param {GameField} field - The field on which the stone may be placed.
     * @param {GameStone} stone - The stone that may be placed on the field.
     * @returns {boolean} indicating if moving stone on field would create a horizontal mill.
     */
    static WouldBeMuehleHorizontal(field : GameField, stone : GameStone) : boolean {
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
    }
    /**
     * Helper method to determine if placing/moving a stone onto a field would cause a vertical mill.
     * @param {GameField} field - The field on which the stone may be placed.
     * @param {GameStone} stone - The stone that may be placed on the field.
     * @returns {boolean} indicating if moving stone on field would create a vertical mill.
     */
    static wouldBeMuehleVertical(field : GameField, stone : GameStone) : boolean {
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
    }
    /**
     * Helper method to determine if placing/moving a stone onto a field would cause a mill.
     * @param {GameField} field - The field on which the stone may be placed.
     * @param {GameStone} stone - The stone that may be placed on the field.
     * @returns {boolean} indicating if moving stone on field would create a mill.
     */
    static wouldBeMuehle(field : GameField, stone : GameStone) : boolean {
        return this.WouldBeMuehleHorizontal(field, stone) || this.wouldBeMuehleVertical(field, stone);
    }
}