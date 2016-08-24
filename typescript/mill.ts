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
interface FieldPosition { x: number; y: number; }

// Define variables to globally gameBoard and gameMenu
let gameMenu : HTMLDivElement;
let gameBoard : HTMLDivElement;

/**
 * This function is called when page finished loading.
 */
function onLoad() : void {
    gameMenu = <HTMLDivElement> document.getElementById("gameMenu");
    gameBoard = <HTMLDivElement> document.getElementById("gameBoard");

    // TODO Maybe not necessary anymore -> chekc later
    // reset game and start the game loop where canvas is redrawn etc.
    Game.Reset();
    window.setInterval(Game.Loop, Settings.gameLoopInterval);
}