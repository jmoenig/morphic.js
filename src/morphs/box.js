// I can have an optionally rounded border

var BoxMorph;

// BoxMorph inherits from Morph:

BoxMorph.prototype = new Morph();
BoxMorph.prototype.constructor = BoxMorph;
BoxMorph.uber = Morph.prototype;

// BoxMorph instance creation:

function BoxMorph(edge, border, borderColor) {
    this.init(edge, border, borderColor);
}

BoxMorph.prototype.init = function (edge, border, borderColor) {
    this.edge = edge || 4;
    this.border = border || ((border === 0) ? 0 : 2);
    this.borderColor = borderColor || new Color();
    BoxMorph.uber.init.call(this);
};

// BoxMorph drawing:

BoxMorph.prototype.drawNew = function () {
    var context;

    this.image = newCanvas(this.extent());
    context = this.image.getContext('2d');
    if ((this.edge === 0) && (this.border === 0)) {
        BoxMorph.uber.drawNew.call(this);
        return null;
    }
    context.fillStyle = this.color.toString();
    context.beginPath();
    this.outlinePath(
        context,
        Math.max(this.edge - this.border, 0),
        this.border
    );
    context.closePath();
    context.fill();
    if (this.border > 0) {
        context.lineWidth = this.border;
        context.strokeStyle = this.borderColor.toString();
        context.beginPath();
        this.outlinePath(context, this.edge, this.border / 2);
        context.closePath();
        context.stroke();
    }
};

BoxMorph.prototype.outlinePath = function (context, radius, inset) {
    var offset = radius + inset,
        w = this.width(),
        h = this.height();

    // top left:
    context.arc(
        offset,
        offset,
        radius,
        radians(-180),
        radians(-90),
        false
    );
    // top right:
    context.arc(
        w - offset,
        offset,
        radius,
        radians(-90),
        radians(-0),
        false
    );
    // bottom right:
    context.arc(
        w - offset,
        h - offset,
        radius,
        radians(0),
        radians(90),
        false
    );
    // bottom left:
    context.arc(
        offset,
        h - offset,
        radius,
        radians(90),
        radians(180),
        false
    );
};


// BoxMorph menus:

BoxMorph.prototype.developersMenu = function () {
    var menu = BoxMorph.uber.developersMenu.call(this);
    menu.addLine();
    menu.addItem(
        "border width...",
        function () {
            this.prompt(
                menu.title + '\nborder\nwidth:',
                this.setBorderWidth,
                this,
                this.border.toString(),
                null,
                0,
                100,
                true
            );
        },
        'set the border\'s\nline size'
    );
    menu.addItem(
        "border color...",
        function () {
            this.pickColor(
                menu.title + '\nborder color:',
                this.setBorderColor,
                this,
                this.borderColor
            );
        },
        'set the border\'s\nline color'
    );
    menu.addItem(
        "corner size...",
        function () {
            this.prompt(
                menu.title + '\ncorner\nsize:',
                this.setCornerSize,
                this,
                this.edge.toString(),
                null,
                0,
                100,
                true
            );
        },
        'set the corner\'s\nradius'
    );
    return menu;
};

BoxMorph.prototype.setBorderWidth = function (size) {
    // for context menu demo purposes
    var newSize;
    if (typeof size === 'number') {
        this.border = Math.max(size, 0);
    } else {
        newSize = parseFloat(size);
        if (!isNaN(newSize)) {
            this.border = Math.max(newSize, 0);
        }
    }
    this.drawNew();
    this.changed();
};

BoxMorph.prototype.setBorderColor = function (color) {
    // for context menu demo purposes
    if (color) {
        this.borderColor = color;
        this.drawNew();
        this.changed();
    }
};

BoxMorph.prototype.setCornerSize = function (size) {
    // for context menu demo purposes
    var newSize;
    if (typeof size === 'number') {
        this.edge = Math.max(size, 0);
    } else {
        newSize = parseFloat(size);
        if (!isNaN(newSize)) {
            this.edge = Math.max(newSize, 0);
        }
    }
    this.drawNew();
    this.changed();
};

BoxMorph.prototype.colorSetters = function () {
    // for context menu demo purposes
    return ['color', 'borderColor'];
};

BoxMorph.prototype.numericalSetters = function () {
    // for context menu demo purposes
    var list = BoxMorph.uber.numericalSetters.call(this);
    list.push('setBorderWidth', 'setCornerSize');
    return list;
};
