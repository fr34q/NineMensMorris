/**
 * Static class providing functions to comfortably draw figures on the canvas.
 */
class PaintHelper
{
    /**
     * Draws a circle with given properties on the canvas.
     * @param {number} centerX - (in px) The x coordinate of the circles middle.
     * @param {number} centerY - (in px) The y coordinate of the circles middle.
     * @param {number} radius - (in px) The radius of the circle.
     * @param {string} filling - The fillStyle property of the context.
     * @param {string} [border] - If set a border is drawn with the strokeStyle property being this value.
     * @param {number} [borderWidth] - (in px) The border width if set, otherwise 3px is chosen.
     */
    static FillCircle(centerX : number, centerY : number, radius : number, filling: string, border?: string, borderWidth?: number) : void {
        var context = canvas.getContext('2d');
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        context.fillStyle = filling;
        context.fill();
        if (border) {
            if (borderWidth) {
                context.lineWidth = borderWidth;
            } else {
                context.lineWidth = 3;
            }
            context.strokeStyle = border;
            context.stroke();
        }
    }

    /**
     * Draws a circle with given properties on the canvas filled by a given pattern.
     * @param {number} centerX - (in px) The x coordinate of the circles middle.
     * @param {number} centerY - (in px) The y coordinate of the circles middle.
     * @param {number} radius - (in px) The radius of the circle.
     * @param {CanvasPattern} pattern - The pattern to fill the circle with.
     * @param {string} [border] - If set a border is drawn with the strokeStyle property being this value.
     * @param {number} [borderWidth] - (in px) The border width if set, otherwise 3px is chosen.
     * @param {Position2} [patternOffset] - (in {px,px}) If specified, sets the offset of the pattern to the given constant value. 
     *      Otherwise pattern is dependent on position on the screen.
     */
    static FillCirclePattern(centerX : number, centerY : number, radius : number, 
            pattern: CanvasPattern, border?: string, borderWidth?: number,
            patternOffset?: Position2) : void {
        var context = canvas.getContext('2d');
        
        if (patternOffset) {
            // By translating the context same offset will result in the same clipping..
            // In the other case same centerX,centerY will result in the same clipping
            // meaning that a moving object will result in a moving cutting but the pattern being fixed in the background.
            context.save();
            context.translate(centerX+patternOffset.x, centerY+patternOffset.y);
        }
        context.beginPath();
        if (patternOffset) {
            context.arc(-patternOffset.x, -patternOffset.y, radius, 0, 2 * Math.PI, false);
        } else {
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        }
        context.fillStyle = pattern;
        context.fill();

        if (border) {
            if (borderWidth) {
                context.lineWidth = borderWidth;
            } else {
                context.lineWidth = 3;
            }
            context.strokeStyle = border;
            context.stroke();
        }

        if (patternOffset) {
            // translate context back to its original position
            context.restore();
        }
    }

    /**
     * Draws a straight line between two points.
     * @param {number} fromX - (in px) The x coordinate of the starting point.
     * @param {number} fromY - (in px) The y coordinate of the starting point.
     * @param {number} toX - (in px) The x coordinate of the ending point.
     * @param {number} toY - (in px) The y coordinate of the ending point.
     * @param {number} [width] - (in px) The width of the line. If none given, default/last value is used.
     * @param {string} [color] - The strokeStyle property of the context, for example a color.
     */
    static DrawLine(fromX : number, fromY : number, toX : number, toY : number, width?: number, color?: string) : void {
        var context = canvas.getContext('2d');
        context.beginPath();
        context.moveTo(fromX, fromY);
        context.lineTo(toX, toY);
        if (width) {
            context.lineWidth = width;
        }
        if (color) {
            context.strokeStyle = color;
        }
        context.stroke();
    }

    /**
     * Draws a filled rectangle on the canvas.
     * @param {number} x - (in px) The x coordinate of the top left corner.
     * @param {number} y - (in px) The y coordinate of the top left corner.
     * @param {number} width - (in px) The width of the rectangle.
     * @param {number} height - (in px) The height of the rectangle.
     * @param {number} width - (in px) The width of the border line.
     * @param {string} [color] - The strokeStyle property of the context, for example a color.
     */
    static FillRectangle(x : number, y : number, width : number, height : number, color?: string) : void {
        var context = canvas.getContext('2d');
        if (color) {
            context.fillStyle = color;
        }
        context.fillRect(x, y, width, height);
    }

    /**
     * Draws text on the canvas.
     * @param {number} x - (in px) The x coordinate where to place the text.
     * @param {number} y - (in px) The y coordinate where to place the text.
     * @param {string} text - The text to be drawn.
     * @param {string} [font] - If given, specifies the font property. Special values 'normal' and 'large' exist.
     * @param {string} [color] - The fillStyle property of the context, for example a color.
     * @param {string} [textAlign] - The textAlign property being able to center text or make it right-aligned.
     */
    static DrawText(x : number, y : number, text : string, font? : string, color? : string, textAlign? : string) : void {
        var context = canvas.getContext('2d');
        if(font) {
            if (font == 'normal')
                context.font = Math.floor(GameBoard.fieldLength*Settings.textSizeNormalMultiplier)+'px Calibri';
            else if (font == 'large') {
                context.font = 'bold '+Math.floor(GameBoard.fieldLength*Settings.textSizeBigMultiplier)+'px Arial';
                text = text.toUpperCase();
            } else
                context.font = font;

        }
        if (textAlign) {
            context.textAlign = textAlign;
        }
        if (color) {
            context.fillStyle = color;
        }
        var realPos = GameBoard.GetRealPosition({x: x, y: y});
        context.fillText(text, realPos.x, realPos.y);
    }

    /**
     * Removes everything drawn onto the canvas.
     */
    static Clear() : void {
        var context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    }
}

