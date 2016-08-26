/**
 * Implementing functions necessary for the menu.
 */
class Menu {
    /** If stat mode was never enabled before. For displaying infoOverlay. */
    private static statModeFirstEnabled : boolean = true;

    /**
     * Start new game and show game canvas.
     */
    static StartGame() : void {
        Game.Start();
        gameMenu.style.display = 'none';
        gameBoard.style.display = 'block';
        winnerScreen.style.display = 'none';

        // initializing statistics mode
        if(Game.statMode) {
            Game.StartStatMode();
            footer.innerHTML = "Statistics Mode - Auto Restart and Result Logging enabled."
        } else {
            footer.innerHTML = "Enjoy the game!";
        }
    }

    /**
     * Reset game and show menu.
     */
    static ReturnToMenu() : void {
        Game.Reset();
        gameMenu.style.display = 'block';
        gameBoard.style.display = 'none';
        winnerScreen.style.display = 'none';
    }

    /**
     * This function is called if a menu setting is changed and updates the game values.
     */
    static ReadSettings() : void {
        // get input elements from the menu
        var checkboxStatMode = <HTMLInputElement> document.getElementById('statMode');
        
        if (!checkboxStatMode) {
            console.error("Could not find all menu elements!");
            return;
        }

        Game.statMode = checkboxStatMode.checked;

        if (Game.statMode && this.statModeFirstEnabled) {
            this.statModeFirstEnabled = false;
            Menu.ShowInfoOverlay(
                "Statistics Mode is thought for long term probing of game results between " + 
                "two AI players. Game will automatically restart and results are logged " +
                "and displayed in the footer. Stat Mode can be interrupted by going to the menu.");
        }
    }

    /**
     * Called by AI select dropdown, sets the AI for a specified color.
     * @param {number} color - The color for which the AI is altered.
     * @param {number} aiNum - Number describing which AI should be set.
     * @param {HTMLLinkElement} elem - Element that was clicked.
     */
    static SetPlayerAI(color : number, aiNum : number, elem : HTMLLinkElement) : void {
        if (color != 0 && color != 1)
            return; // iput invalid
        switch(aiNum) {
            case 0: // playerAI
            case 1: // random
            case 2: // easy
            case 3: // middle
            case 4: // hard
                break;
            default:
                return; // not a valid input
        }
        Game.playerAINumber[color] = aiNum;
        [
            <HTMLButtonElement> document.getElementById('blackAI'),
            <HTMLButtonElement> document.getElementById('whiteAI')
        ][color].innerHTML = elem.innerHTML;
        
    }

    /**
     * Triggered if clicked on button to toggle dropdown list.
     * @param {HTMLButtonElement} elem - The element clicked on.
     */
    static ToggleDropdown(elem : HTMLButtonElement) : void {
        var content = <HTMLDivElement> elem.nextElementSibling;
        if(content) {
            content.classList.toggle("show");
            // make all others disappear:
            var dropdowns = document.getElementsByClassName("dropdown-content");
            for (var i = 0; i < dropdowns.length; i++) {
                if(dropdowns[i] != content) {
                    dropdowns[i].classList.remove('show');
                }
            }
        } else {
            console.error("Dropdown content could not be found.");
        }
    }

    /**
     * Shows an information overlay with given text.
     * @param {string} text - The text to print on the screen.
     */
    static ShowInfoOverlay(text : string) : void {
        let disp = document.getElementById('infoOverlay') as HTMLDivElement;
        (disp.getElementsByTagName('p')[0] as HTMLParagraphElement)
            .innerHTML = text;
        disp.style.display = 'table';
    }
    /**
     * Hides the information overlay.
     */
    static HideInfoOverlay() : void {
        (document.getElementById('infoOverlay') as HTMLDivElement)
            .style.display = 'none';
    }
}