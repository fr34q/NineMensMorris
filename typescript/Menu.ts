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
        let checkboxStatMode : HTMLInputElement = document.getElementById('statMode') as HTMLInputElement;
        let checkboxClassicDesign : HTMLInputElement = document.getElementById('classicDesign') as HTMLInputElement;

        if (!checkboxStatMode || !checkboxClassicDesign) {
            console.error("Could not find all menu elements!");
            return;
        }

        Game.statMode = checkboxStatMode.checked;

        // Show some info concerning Stat Mode if turned on for the first time
        if (Game.statMode && this.statModeFirstEnabled) {
            this.statModeFirstEnabled = false;
            Menu.ShowInfoOverlay(
                "Statistics Mode is for long term probing of game results between two AI players. " + 
                "Game will automatically restart and results are logged and displayed in the footer. " +
                "Stat Mode can be interrupted by going to the menu.");
        }
        console.log(Game.natureDesign);
        Game.natureDesign = !checkboxClassicDesign.checked;
        console.log(Game.natureDesign);
        this.UpdateNatureDesign();
    }

    /**
     * Called by AI select dropdown, sets the AI for a specified color.
     * @param {number} color - The color for which the AI is altered.
     * @param {number} aiNum - Number describing which AI should be set.
     * @param {HTMLLinkElement} elem - Element that was clicked.
     */
    static SetPlayerAI(color : number, aiNum : number, elem : HTMLLinkElement) : void {
        if (color != 0 && color != 1)
            return; // input invalid
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
        // adjust the button text to fit the new selection
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

    /**
     * Updates the nature design if active.
     */
    static UpdateNatureDesign() : void {
        if (Game.natureDesign) {
            // nature design turned on
            this.ChangeCSS("style/nature.css",0);
        } else {
            // turned off
            this.ChangeCSS("style/normal.css",0);
        }
    }

    /**
     * Changes a CSS style sheet on the fly.
     */
    static ChangeCSS(cssFile, cssLinkIndex) {
        let oldlink : HTMLLinkElement = document.getElementsByTagName("link").item(cssLinkIndex);

        let newlink : HTMLLinkElement = document.createElement("link");
        newlink.setAttribute("rel", "stylesheet");
        newlink.setAttribute("type", "text/css");
        newlink.setAttribute("href", cssFile);

        document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
    }

}