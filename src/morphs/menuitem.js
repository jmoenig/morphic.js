// I automatically determine my bounds

var MenuItemMorph;

// MenuItemMorph inherits from TriggerMorph:

MenuItemMorph.prototype = new TriggerMorph();
MenuItemMorph.prototype.constructor = MenuItemMorph;
MenuItemMorph.uber = TriggerMorph.prototype;

// MenuItemMorph instance creation:

function MenuItemMorph(
    target,
    action,
    labelString, // can also be a Morph or a Canvas or a tuple: [icon, string]
    fontSize,
    fontStyle,
    environment,
    hint,
    color,
    bold,
    italic,
    doubleClickAction, // optional when used as list morph.jsk item
    shortcut // optional string, Morph, Canvas or tuple: [icon, string]
) {
    // additional properties:
    this.shortcutString = shortcut || null;
    this.shortcut = null;

    // initialize inherited properties:
    this.init(
        target,
        action,
        labelString,
        fontSize,
        fontStyle,
        environment,
        hint,
        color,
        bold,
        italic,
        doubleClickAction
    );
}

MenuItemMorph.prototype.createLabel = function () {
    var w, h;
    if (this.label) {
        this.label.destroy();
    }
    this.label = this.createLabelPart(this.labelString);
    this.add(this.label);
    w = this.label.width();
    h = this.label.height();
    if (this.shortcut) {
        this.shortcut.destroy();
    }
    if (this.shortcutString) {
        this.shortcut = this.createLabelPart(this.shortcutString);
        w += this.shortcut.width() + 4;
        h = Math.max(h, this.shortcut.height());
        this.add(this.shortcut);
    }
    this.silentSetExtent(new Point(w + 8, h));
    this.fixLayout();
};

MenuItemMorph.prototype.fixLayout = function () {
    var cntr = this.center();
    this.label.setCenter(cntr);
    this.label.setLeft(this.left() + 4);
    if (this.shortcut) {
        this.shortcut.setCenter(cntr);
        this.shortcut.setRight(this.right() - 4);
    }
};

MenuItemMorph.prototype.createLabelPart = function (source) {
    var part, icon, lbl;
    if (isString(source)) {
        return this.createLabelString(source);
    }
    if (source instanceof Array) {
        // assume its pattern is: [icon, string]
        part = new Morph();
        part.alpha = 0; // transparent
        icon = this.createIcon(source[0]);
        part.add(icon);
        lbl = this.createLabelString(source[1]);
        part.add(lbl);
        lbl.setCenter(icon.center());
        lbl.setLeft(icon.right() + 4);
        part.bounds = (icon.bounds.merge(lbl.bounds));
        part.drawNew();
        return part;
    }
    // assume it's either a Morph or a Canvas
    return this.createIcon(source);
};

MenuItemMorph.prototype.createIcon = function (source) {
    // source can be either a Morph or an HTMLCanvasElement
    var icon = new Morph(),
        src;
    icon.image = source instanceof Morph ? source.fullImage() : source;
    // adjust shadow dimensions
    if (source instanceof Morph && source.getShadow()) {
        src = icon.image;
        icon.image = newCanvas(
            source.fullBounds().extent().subtract(
                this.shadowBlur * (useBlurredShadows ? 1 : 2)
            )
        );
        icon.image.getContext('2d').drawImage(src, 0, 0);
    }
    icon.silentSetWidth(icon.image.width);
    icon.silentSetHeight(icon.image.height);
    return icon;
};

MenuItemMorph.prototype.createLabelString = function (string) {
    var lbl = new TextMorph(
        string,
        this.fontSize,
        this.fontStyle,
        this.labelBold,
        this.labelItalic
    );
    lbl.setColor(this.labelColor);
    return lbl;
};

// MenuItemMorph events:

MenuItemMorph.prototype.mouseEnter = function () {
    var menu = this.parentThatIsA(MenuMorph);
    if (this.isShowingSubmenu()) {
        return;
    }
    if (menu) {
        menu.closeSubmenu();
    }
    if (!this.isListItem()) {
        this.image = this.highlightImage;
        this.changed();
    }
    if (this.action instanceof MenuMorph) {
        this.delaySubmenu();
    } else if (this.hint) {
        this.bubbleHelp(this.hint);
    }
};

MenuItemMorph.prototype.mouseLeave = function () {
    if (!this.isListItem()) {
        if (this.isShowingSubmenu()) {
            this.image = this.highlightImage;
        } else {
            this.image = this.normalImage;
        }
        this.changed();
    }
    if (this.schedule) {
        this.schedule.isActive = false;
    }
    if (this.hint) {
        this.world().hand.destroyTemporaries();
    }
};

MenuItemMorph.prototype.mouseDownLeft = function (pos) {
    if (this.isListItem()) {
        this.parentThatIsA(MenuMorph).unselectAllItems();
        this.escalateEvent('mouseDownLeft', pos);
    }
    this.image = this.pressImage;
    this.changed();
};

MenuItemMorph.prototype.mouseMove = function () {
    if (this.isListItem()) {
        this.escalateEvent('mouseMove');
    }
};

MenuItemMorph.prototype.mouseClickLeft = function () {
    if (this.action instanceof MenuMorph) {
        this.popUpSubmenu();
    } else {
        if (!this.isListItem()) {
            this.parentThatIsA(MenuMorph).closeRootMenu();
            this.world().activeMenu = null;
        }
        this.trigger();
    }
};

MenuItemMorph.prototype.isListItem = function () {
    var menu = this.parentThatIsA(MenuMorph);
    if (menu) {
        return menu.isListContents;
    }
    return false;
};

MenuItemMorph.prototype.isSelectedListItem = function () {
    if (this.isListItem()) {
        return this.image === this.pressImage;
    }
    return false;
};

MenuItemMorph.prototype.isShowingSubmenu = function () {
    var menu = this.parentThatIsA(MenuMorph);
    if (menu && (this.action instanceof MenuMorph)) {
        return menu.submenu === this.action;
    }
    return false;
};

// MenuItemMorph submenus:

MenuItemMorph.prototype.delaySubmenu = function () {
    var world = this.world(),
        myself = this;
    this.schedule = new Animation(
        nop,
        nop,
        0,
        500,
        nop,
        function () {
            myself.popUpSubmenu();
        }
    );
    world.animations.push(this.schedule);
};

MenuItemMorph.prototype.popUpSubmenu = function () {
    var menu = this.parentThatIsA(MenuMorph);
    if (!(this.action instanceof MenuMorph)) {
        return;
    }
    this.action.drawNew();
    this.action.setPosition(this.topRight().subtract(new Point(0, 5)));
    this.action.addShadow(new Point(2, 2), 80);
    this.action.keepWithin(this.world());
    if (this.action.items.length < 1 && !this.action.title) {
        return;
    }
    menu.add(this.action);
    menu.submenu = this.action;
    menu.submenu.world = menu.world; // keyboard control
    this.action.fullChanged();
};
