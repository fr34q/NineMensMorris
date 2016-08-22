/**
 * Static class that stores all settings for the game in a central place.
 */
class Settings {
    /** How long between two calls of Game.Loop() */
    static gameLoopInterval = 100; // ms
    
    /** How long AI will sleep before deciding its next move */
    static enemyAIRandomSleepTime = 500; // ms

    /** Path to pattern image of black stone */
    static stoneBlackImageSource = 'pictures/marmor3s.jpg';
    /** Path to pattern image of white stone */
    static stoneWhiteImageSource = 'pictures/marmor4s.jpg';
    /** Radius of stones in units of 1 fieldLength */
    static stoneRadiusFactor = 0.4; // in fieldLength
    /** Width of stone border in units of 1 fieldLength */
    static stoneBorderWidthFactor = 0.02; // in fieldLength
    /** Factor to which the stone borders increase if marked */
    static stoneBorderMarkedFactor = 3; // in normal thickness
    /** Border color of normal white stones */
    static stoneWhiteBorderColor = '#000000';
    /** Border color of normal black stones */
    static stoneBlackBorderColor = '#ffffff';
    /** Border color of the active stone */
    static stoneBorderColorActive = '#ff7700';
    /** Border color of hovered stones */
    static stoneBorderColorHovered = '#dd4400';
    /** Border color of stones marked to be moveable */
    static stoneBorderColorMoveable = '#00ff00';
    /** Border color of stones that can be removed */
    static stoneBorderColorRemoveable = '#ff0000';
    /** Border color of stones that can be removed and are hovered */
    static stoneBorderColorRemoveableHovered = '#ff7777';

    /** Radius of game fields in units of 1 fieldLength */
    static fieldRadiusFactor = 0.1; // in fieldLength
    /** Width of game board lines in units of 1 fieldLength */
    static fieldLineWidthFactor = 0.05; // in fieldLength
    /** Color of normal game fields */
    static fieldColor = '#000000';
    /** Color of hovered fields */
    static fieldColorHover = '#00aa00';
    /** Color of fields where stones can move to */
    static fieldColorMoveable = '#44ff00';

    /** Number of stones per player at the beginning */
    static stoneCountPerPlayer = 9;

    /** Text size of big text in units of 1 fieldLength */
    static textSizeBigMultiplier = 0.85; // in fieldLength
    /** Text size of normal text in units of 1 fieldLength */
    static textSizeNormalMultiplier = 0.46; // in fieldLength
}