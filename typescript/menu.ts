/**
 * Implementing functions necessary for the menu.
 */
class Menu {
    /**
     * Start new game and show game canvas.
     */
    static StartGame() : void {
        Game.Start();
        gameMenu.style.display = 'none';
        canvas.style.display = 'block';
    }

    /**
     * Reset game and show menu.
     */
    static ReturnToMenu() : void {
        Game.Reset();
        gameMenu.style.display = 'block';
        canvas.style.display = 'none';
    }

    /**
     * This function is called if a menu setting is changed and updates the game values.
     */
    static ReadSettings() : void {
        // get input elements from the menu
        var checkboxWhite = <HTMLInputElement> document.getElementById('whiteAI');
        var checkboxBlack = <HTMLInputElement> document.getElementById('blackAI');
        var inputAITime = <HTMLInputElement> document.getElementById('AItime');

        if (!checkboxWhite || !checkboxBlack || !inputAITime) {
            console.error("Could not find all menu elements!");
            return;
        }

        if (checkboxWhite.checked) {
            // White is played by AI
            if (!Game.playerAI[1])
                Game.playerAI[1] = new EnemyAIPrimitive(1);
        } else {
            Game.playerAI[1] = null;
        }

        if (checkboxBlack.checked) {
            // Black is played by AI
            if (!Game.playerAI[0])
                Game.playerAI[0] = new EnemyAIPrimitive(0);
        } else {
            Game.playerAI[0] = null;
        }

        var time = Number(inputAITime.value);
        if (!isNaN(time)) {
            if (time < 0) { // no negative values
                inputAITime.value = "0";
                time = 0;
            } else if (time > 9999) { // no values >= 10s
                inputAITime.value = "9999";
                time = 9999;
            } else if (Math.floor(time) != time) { // only integer numbers
                inputAITime.value = Math.floor(time).toString();
                time = Math.floor(time);
            }
            Settings.enemyAIRandomSleepTime = time;
        } else {
            // no valid number -> reset field
            inputAITime.value = "";
        }
    }
}