// StringMorph /////////////////////////////////////////////////////////

// I am a single line of text

// StringMorph inherits from Morph:

StringMorph.prototype = new Morph();
StringMorph.prototype.constructor = StringMorph;
StringMorph.uber = Morph.prototype;

// StringMorph instance creation:

function StringMorph(
    text,
    fontSize,
    fontStyle,
    bold,
    italic,
    isNumeric,
    shadowOffset,
    shadowColor,
    color,
    fontName
) {
    this.init(
        text,
        fontSize,
        fontStyle,
        bold,
        italic,
        isNumeric,
        shadowOffset,
        shadowColor,
        color,
        fontName
    );
}

StringMorph.prototype.init = function (
    text,
    fontSize,
    fontStyle,
    bold,
    italic,
    isNumeric,
    shadowOffset,
    shadowColor,
    color,
    fontName
) {
    // additional properties:
    this.text = text || ((text === '') ? '' : 'StringMorph');
    this.fontSize = fontSize || 12;
    this.fontName = fontName || MorphicPreferences.globalFontFamily;
    this.fontStyle = fontStyle || 'sans-serif';
    this.isBold = bold || false;
    this.isItalic = italic || false;
    this.isEditable = false;
    this.isNumeric = isNumeric || false;
    this.isPassword = false;
    this.shadowOffset = shadowOffset || new Point(0, 0);
    this.shadowColor = shadowColor || null;
    this.isShowingBlanks = false;
    this.blanksColor = new Color(180, 140, 140);

    // additional properties for text-editing:
    this.isScrollable = true; // scrolls into view when edited
    this.currentlySelecting = false;
    this.startMark = 0;
    this.endMark = 0;
    this.markedTextColor = new Color(255, 255, 255);
    this.markedBackgoundColor = new Color(60, 60, 120);

    // initialize inherited properties:
    StringMorph.uber.init.call(this);

    // override inherited properites:
    this.color = color || new Color(0, 0, 0);
    this.noticesTransparentClick = true;
    this.drawNew();
};

StringMorph.prototype.toString = function () {
    // e.g. 'a StringMorph("Hello World")'
    return 'a ' +
        (this.constructor.name ||
            this.constructor.toString().split(' ')[1].split('(')[0]) +
        '("' + this.text.slice(0, 30) + '...")';
};

StringMorph.prototype.password = function (letter, length) {
    var ans = '',
        i;
    for (i = 0; i < length; i += 1) {
        ans += letter;
    }
    return ans;
};

StringMorph.prototype.font = function () {
    // answer a font string, e.g. 'bold italic 12px sans-serif'
    var font = '';
    if (this.isBold) {
        font = font + 'bold ';
    }
    if (this.isItalic) {
        font = font + 'italic ';
    }
    return font +
        this.fontSize + 'px ' +
        (this.fontName ? this.fontName + ', ' : '') +
        this.fontStyle;
};

StringMorph.prototype.drawNew = function () {
    var context, width, start, stop, i, p, c, x, y,
        shadowOffset = this.shadowOffset || new Point(),
        txt = this.isPassword ?
                this.password('*', this.text.length) : this.text;

    // initialize my surface property
    this.image = newCanvas();
    context = this.image.getContext('2d');
    context.font = this.font();

    // set my extent
    width = Math.max(
        context.measureText(txt).width + Math.abs(shadowOffset.x),
        1
    );
    this.bounds.corner = this.bounds.origin.add(
        new Point(
            width,
            fontHeight(this.fontSize) + Math.abs(shadowOffset.y)
        )
    );
    this.image.width = width;
    this.image.height = this.height();

    // prepare context for drawing text
    context.font = this.font();
    context.textAlign = 'left';
    context.textBaseline = 'bottom';

    // first draw the shadow, if any
    if (this.shadowColor) {
        x = Math.max(shadowOffset.x, 0);
        y = Math.max(shadowOffset.y, 0);
        context.fillStyle = this.shadowColor.toString();
        context.fillText(txt, x, fontHeight(this.fontSize) + y);
    }

    // now draw the actual text
    x = Math.abs(Math.min(shadowOffset.x, 0));
    y = Math.abs(Math.min(shadowOffset.y, 0));
    context.fillStyle = this.color.toString();

    if (this.isShowingBlanks) {
        this.renderWithBlanks(context, x, fontHeight(this.fontSize) + y);
    } else {
        context.fillText(txt, x, fontHeight(this.fontSize) + y);
    }

    // draw the selection
    start = Math.min(this.startMark, this.endMark);
    stop = Math.max(this.startMark, this.endMark);
    for (i = start; i < stop; i += 1) {
        p = this.slotPosition(i).subtract(this.position());
        c = txt.charAt(i);
        context.fillStyle = this.markedBackgoundColor.toString();
        context.fillRect(p.x, p.y, context.measureText(c).width + 1 + x,
            fontHeight(this.fontSize) + y);
        context.fillStyle = this.markedTextColor.toString();
        context.fillText(c, p.x + x, fontHeight(this.fontSize) + y);
    }

    // notify my parent of layout change
    if (this.parent) {
        if (this.parent.fixLayout) {
            this.parent.fixLayout();
        }
    }
};

StringMorph.prototype.renderWithBlanks = function (context, startX, y) {
    var space = context.measureText(' ').width,
        blank = newCanvas(new Point(space, this.height())),
        ctx = blank.getContext('2d'),
        words = this.text.split(' '),
        x = startX || 0,
        isFirst = true;

    // create the blank form
    ctx.fillStyle = this.blanksColor.toString();
    ctx.arc(
        space / 2,
        blank.height / 2,
        space / 2,
        radians(0),
        radians(360)
    );
    ctx.fill();

    function drawBlank() {
        context.drawImage(blank, x, 0);
        x += space;
    }

    // render my text inserting blanks
    words.forEach(function (word) {
        if (!isFirst) {
            drawBlank();
        }
        isFirst = false;
        if (word !== '') {
            context.fillText(word, x, y);
            x += context.measureText(word).width;
        }
    });
};

// StringMorph mesuring:

StringMorph.prototype.slotPosition = function (slot) {
    // answer the position point of the given index ("slot")
    // where the cursor should be placed
    var txt = this.isPassword ?
                this.password('*', this.text.length) : this.text,
        dest = Math.min(Math.max(slot, 0), txt.length),
        context = this.image.getContext('2d'),
        xOffset,
        x,
        y,
        idx;

    xOffset = 0;
    for (idx = 0; idx < dest; idx += 1) {
        xOffset += context.measureText(txt[idx]).width;
    }
    this.pos = dest;
    x = this.left() + xOffset;
    y = this.top();
    return new Point(x, y);
};

StringMorph.prototype.slotAt = function (aPoint) {
    // answer the slot (index) closest to the given point
    // so the cursor can be moved accordingly
    var txt = this.isPassword ?
                this.password('*', this.text.length) : this.text,
        idx = 0,
        charX = 0,
        context = this.image.getContext('2d');

    while (aPoint.x - this.left() > charX) {
        charX += context.measureText(txt[idx]).width;
        idx += 1;
        if (idx === txt.length) {
            if ((context.measureText(txt).width -
                    (context.measureText(txt[idx - 1]).width / 2)) <
                    (aPoint.x - this.left())) {
                return idx;
            }
        }
    }
    return idx - 1;
};

StringMorph.prototype.upFrom = function (slot) {
    // answer the slot above the given one
    return slot;
};

StringMorph.prototype.downFrom = function (slot) {
    // answer the slot below the given one
    return slot;
};

StringMorph.prototype.startOfLine = function () {
    // answer the first slot (index) of the line for the given slot
    return 0;
};

StringMorph.prototype.endOfLine = function () {
    // answer the slot (index) indicating the EOL for the given slot
    return this.text.length;
};

StringMorph.prototype.rawHeight = function () {
    // answer my corrected fontSize
    return this.height() / 1.2;
};

// StringMorph menus:

StringMorph.prototype.developersMenu = function () {
    var menu = StringMorph.uber.developersMenu.call(this);

    menu.addLine();
    menu.addItem("edit", 'edit');
    menu.addItem(
        "font size...",
        function () {
            this.prompt(
                menu.title + '\nfont\nsize:',
                this.setFontSize,
                this,
                this.fontSize.toString(),
                null,
                6,
                500,
                true
            );
        },
        'set this String\'s\nfont point size'
    );
    if (this.fontStyle !== 'serif') {
        menu.addItem("serif", 'setSerif');
    }
    if (this.fontStyle !== 'sans-serif') {
        menu.addItem("sans-serif", 'setSansSerif');
    }
    if (this.isBold) {
        menu.addItem("normal weight", 'toggleWeight');
    } else {
        menu.addItem("bold", 'toggleWeight');
    }
    if (this.isItalic) {
        menu.addItem("normal style", 'toggleItalic');
    } else {
        menu.addItem("italic", 'toggleItalic');
    }
    if (this.isShowingBlanks) {
        menu.addItem("hide blanks", 'toggleShowBlanks');
    } else {
        menu.addItem("show blanks", 'toggleShowBlanks');
    }
    if (this.isPassword) {
        menu.addItem("show characters", 'toggleIsPassword');
    } else {
        menu.addItem("hide characters", 'toggleIsPassword');
    }
    return menu;
};

StringMorph.prototype.toggleIsDraggable = function () {
    // for context menu demo purposes
    this.isDraggable = !this.isDraggable;
    if (this.isDraggable) {
        this.disableSelecting();
    } else {
        this.enableSelecting();
    }
};

StringMorph.prototype.toggleShowBlanks = function () {
    this.isShowingBlanks = !this.isShowingBlanks;
    this.changed();
    this.drawNew();
    this.changed();
};

StringMorph.prototype.toggleWeight = function () {
    this.isBold = !this.isBold;
    this.changed();
    this.drawNew();
    this.changed();
};

StringMorph.prototype.toggleItalic = function () {
    this.isItalic = !this.isItalic;
    this.changed();
    this.drawNew();
    this.changed();
};

StringMorph.prototype.toggleIsPassword = function () {
    this.isPassword = !this.isPassword;
    this.changed();
    this.drawNew();
    this.changed();
};

StringMorph.prototype.setSerif = function () {
    this.fontStyle = 'serif';
    this.changed();
    this.drawNew();
    this.changed();
};

StringMorph.prototype.setSansSerif = function () {
    this.fontStyle = 'sans-serif';
    this.changed();
    this.drawNew();
    this.changed();
};

StringMorph.prototype.setFontSize = function (size) {
    // for context menu demo purposes
    var newSize;
    if (typeof size === 'number') {
        this.fontSize = Math.round(Math.min(Math.max(size, 4), 500));
    } else {
        newSize = parseFloat(size);
        if (!isNaN(newSize)) {
            this.fontSize = Math.round(
                Math.min(Math.max(newSize, 4), 500)
            );
        }
    }
    this.changed();
    this.drawNew();
    this.changed();
};

StringMorph.prototype.setText = function (size) {
    // for context menu demo purposes
    this.text = Math.round(size).toString();
    this.changed();
    this.drawNew();
    this.changed();
};

StringMorph.prototype.numericalSetters = function () {
    // for context menu demo purposes
    return [
        'setLeft',
        'setTop',
        'setAlphaScaled',
        'setFontSize',
        'setText'
    ];
};

// StringMorph editing:

StringMorph.prototype.edit = function () {
    this.root().edit(this);
};

StringMorph.prototype.selection = function () {
    var start, stop;
    start = Math.min(this.startMark, this.endMark);
    stop = Math.max(this.startMark, this.endMark);
    return this.text.slice(start, stop);
};

StringMorph.prototype.selectionStartSlot = function () {
    return Math.min(this.startMark, this.endMark);
};

StringMorph.prototype.clearSelection = function () {
    this.currentlySelecting = false;
    this.startMark = 0;
    this.endMark = 0;
    this.drawNew();
    this.changed();
};

StringMorph.prototype.deleteSelection = function () {
    var start, stop, text;
    text = this.text;
    start = Math.min(this.startMark, this.endMark);
    stop = Math.max(this.startMark, this.endMark);
    this.text = text.slice(0, start) + text.slice(stop);
    this.changed();
    this.clearSelection();
};

StringMorph.prototype.selectAll = function () {
    if (this.isEditable) {
        this.startMark = 0;
        this.endMark = this.text.length;
        this.drawNew();
        this.changed();
    }
};

StringMorph.prototype.mouseDownLeft = function (pos) {
    if (this.isEditable) {
        this.clearSelection();
    } else {
        this.escalateEvent('mouseDownLeft', pos);
    }
};

StringMorph.prototype.mouseClickLeft = function (pos) {
    var cursor;
    if (this.isEditable) {
        if (!this.currentlySelecting) {
            this.edit(); // creates a new cursor
        }
        cursor = this.root().cursor;
        if (cursor) {
            cursor.gotoPos(pos);
        }
        this.currentlySelecting = true;
    } else {
        this.escalateEvent('mouseClickLeft', pos);
    }
};

StringMorph.prototype.enableSelecting = function () {
    this.mouseDownLeft = function (pos) {
        this.clearSelection();
        if (this.isEditable && (!this.isDraggable)) {
            this.edit();
            this.root().cursor.gotoPos(pos);
            this.startMark = this.slotAt(pos);
            this.endMark = this.startMark;
            this.currentlySelecting = true;
        }
    };
    this.mouseMove = function (pos) {
        if (this.isEditable &&
                this.currentlySelecting &&
                (!this.isDraggable)) {
            var newMark = this.slotAt(pos);
            if (newMark !== this.endMark) {
                this.endMark = newMark;
                this.drawNew();
                this.changed();
            }
        }
    };
};

StringMorph.prototype.disableSelecting = function () {
    this.mouseDownLeft = StringMorph.prototype.mouseDownLeft;
    delete this.mouseMove;
};
