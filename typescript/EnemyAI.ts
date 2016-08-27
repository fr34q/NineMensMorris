/**
 * Interface defining which methods and properties an AI has to implement
 */
interface EnemyAI {
    /** Color the enemy AI plays for */
    color : number;
    /**
     * Method that is called if AI has to perform a move.
     * Depending on Game.phase a move should be done using functions:
     * - GameBoard.MoveCurrentStoneToField(field)
     * - GameBoard.MoveStoneToField(stone, field)
     * - GameBoard.RemoveStoneFromField(stone)
     */
    MakeMove() : boolean;

    // Class additionally has to provide a constructor where the color is provided.
}