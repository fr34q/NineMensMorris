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
let winnerScreen : HTMLDivElement;
let winnerScreenText : HTMLSpanElement;
let footer : HTMLElement;

/**
 * This function is called when page finished loading.
 */
function onLoad() : void {
    gameMenu = <HTMLDivElement> document.getElementById("gameMenu");
    gameBoard = <HTMLDivElement> document.getElementById("gameBoard");
    winnerScreen = <HTMLDivElement> document.getElementById("winnerScreen");
    winnerScreenText = <HTMLSpanElement> document.getElementById("winnerScreenText");
    footer = document.getElementsByTagName('footer')[0].getElementsByTagName('p')[0];
    Game.Reset();

    Game.AutoPlayStatistics(100); // NOT IN THE FINAL VERSION!
}