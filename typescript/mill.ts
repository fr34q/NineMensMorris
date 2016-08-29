/**
 * GLOBAL TODO:
 * - FieldPosition und RealPosition interfaces erstellen, die Position2 ersetzen und eindeutiger zuweisbar sind.
 * - let statt var
 */


/**
 * Own primitive datatype for storing positions.
 */
interface Position2 { x: number; y: number; }
interface FieldPosition { x: number; y: number; }

/** Enum for handling the stone color. */
enum StoneColor { Black, White }


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

/** 
 * Helper function to get range [0,1,2,...,len-1] 
 * @param {number} len The length of the range array.
 * @returns {number[]} an array [0,1, ..., len-1].
 */
function indices(len : number) : number[] {
    const arr = new Array<number>(len);
    for (let i=0; i < len; i++) arr[i] = i;
    return arr;
}