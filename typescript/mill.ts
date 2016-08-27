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

// Declare variables to globally access gameBoard and gameMenu
let gameMenu : HTMLDivElement;
let gameBoard : HTMLDivElement;
let winnerScreen : HTMLDivElement;
let winnerScreenText : HTMLSpanElement;
let footer : HTMLParagraphElement;

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

    // Needed for menu:
    // Close the dropdown menu if the user clicks outside of it
    window.onclick = function(event) {
        if (!(<HTMLElement> event.target).matches('.dropbtn')) {
            var dropdowns = document.getElementsByClassName("dropdown-content");
            for (var i = 0; i < dropdowns.length; i++)
                dropdowns[i].classList.remove('show');
        }
    }
}