/**
 * GLOBAL TODO:
 * - Langfristig Canvas durch reine HTML Objekte ersetzen -> Alle Anzeigeeigenschaften in CSS, hover etc
 * - Regeln in eigene Klasse ausgliedern -> besserer Überblick / Struktur
 * - FieldPosition und RealPosition interfaces erstellen, die Position2 ersetzen und eindeutiger zuweisbar sind.
 */


/**
 * Own primitive datatype for storing positions.
 */
interface Position2 { x: number; y: number; }

// Define variables to globally access canvas, context and gameMenu
let canvas : HTMLCanvasElement;
let context : CanvasRenderingContext2D;
let gameMenu : HTMLDivElement;

// Store if images have been loaded -> start game only if finished loading
var elementLoaded = new Array<boolean>();
var imgStone = [new Image(200,200), new Image(200,200)];
let imgStonePattern : Array<CanvasPattern>;

/**
 * This function is called when page finished loading.
 */
function onLoad() : void {
    gameMenu = <HTMLDivElement> document.getElementById("gameMenu");
    canvas = <HTMLCanvasElement> document.getElementById("myCanvas");
    context = canvas.getContext("2d");
    
    // need to initially set width and height property of canvas correctly
    Game.ResizeScreen();
    
    // load necessary images
    imgStone.forEach(e => e.onload = addElementToLoad());
    imgStone[0].src = Settings.stoneBlackImageSource;
    imgStone[1].src = Settings.stoneWhiteImageSource;

    // check if images are already loaded
    checkLoadedFinish();
}

/**
 * Function checks if all elements are loaded and if so, onAllElementsLoaded() is called.
 * Otherwise 100ms later another check will be performed.
 */
function checkLoadedFinish() : void {
    if(everyElementLoaded()) {
        onAllElementsLoaded();
    } else {
        setTimeout(checkLoadedFinish, 100);
    }
}

/**
 * Function is executed if checkLoadedFinish() was called and all images/resources are loaded.
 */
function onAllElementsLoaded() : void {
    // create patterns from loaded images
    imgStonePattern = imgStone.map(img => context.createPattern(img, 'repeat'));

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
function addElementToLoad() : () => void {
    elementLoaded.push(false);
    var idx = elementLoaded.length - 1;
    return function() {elementLoaded[idx] = true;};
}

/**
 * Checks if all elements added finished loading.
 * @returns {boolean} true iff all elements added by addElementToLoad() called the belonging onload event handler.
 */
function everyElementLoaded() : boolean {
    return elementLoaded.map(e => e ? 1 : 0).reduce((a, b) => a + b) == elementLoaded.length;
}