// I clip my submorphs at my bounds

// Frames inherit from Morph:

FrameMorph.prototype = new Morph();
FrameMorph.prototype.constructor = FrameMorph;
FrameMorph.uber = Morph.prototype;

function FrameMorph(aScrollFrame) {
    this.init(aScrollFrame);
}

FrameMorph.prototype.init = function (aScrollFrame) {
    this.scrollFrame = aScrollFrame || null;

    FrameMorph.uber.init.call(this);
    this.color = new Color(255, 250, 245);
    this.drawNew();
    this.acceptsDrops = true;

    if (this.scrollFrame) {
        this.isDraggable = false;
        this.noticesTransparentClick = false;
        this.alpha = 0;
    }
};

FrameMorph.prototype.fullBounds = function () {
    var shadow = this.getShadow();
    if (shadow !== null) {
        return this.bounds.merge(shadow.bounds);
    }
    return this.bounds;
};

FrameMorph.prototype.fullImage = function () {
    // use only for shadows
    return this.image;
};

FrameMorph.prototype.fullDrawOn = function (aCanvas, aRect) {
    var rectangle, dirty;
    if (!this.isVisible) {
        return null;
    }
    rectangle = aRect || this.fullBounds();
    dirty = this.bounds.intersect(rectangle);
    if (!dirty.extent().gt(new Point(0, 0))) {
        return null;
    }
    this.drawOn(aCanvas, dirty);
    this.children.forEach(function (child) {
        if (child instanceof ShadowMorph) {
            child.fullDrawOn(aCanvas, rectangle);
        } else {
            child.fullDrawOn(aCanvas, dirty);
        }
    });
};

// FrameMorph navigation:

FrameMorph.prototype.topMorphAt = function (point) {
    var i, result;
    if (!(this.isVisible && this.bounds.containsPoint(point))) {
        return null;
    }
    for (i = this.children.length - 1; i >= 0; i -= 1) {
        result = this.children[i].topMorphAt(point);
        if (result) {
            return result;
        }
    }
    return this.noticesTransparentClick ||
    !this.isTransparentAt(point) ? this : null;
};

// FrameMorph scrolling support:

FrameMorph.prototype.submorphBounds = function () {
    var result = null;

    if (this.children.length > 0) {
        result = this.children[0].bounds;
        this.children.forEach(function (child) {
            result = result.merge(child.fullBounds());
        });
    }
    return result;
};

FrameMorph.prototype.keepInScrollFrame = function () {
    if (this.scrollFrame === null) {
        return null;
    }
    if (this.left() > this.scrollFrame.left()) {
        this.moveBy(
            new Point(this.scrollFrame.left() - this.left(), 0)
        );
    }
    if (this.right() < this.scrollFrame.right()) {
        this.moveBy(
            new Point(this.scrollFrame.right() - this.right(), 0)
        );
    }
    if (this.top() > this.scrollFrame.top()) {
        this.moveBy(
            new Point(0, this.scrollFrame.top() - this.top())
        );
    }
    if (this.bottom() < this.scrollFrame.bottom()) {
        this.moveBy(
            0,
            new Point(this.scrollFrame.bottom() - this.bottom(), 0)
        );
    }
};

FrameMorph.prototype.adjustBounds = function () {
    var subBounds,
        newBounds,
        myself = this;

    if (this.scrollFrame === null) {
        return null;
    }

    subBounds = this.submorphBounds();
    if (subBounds && (!this.scrollFrame.isTextLineWrapping)) {
        newBounds = subBounds
            .expandBy(this.scrollFrame.padding)
            .growBy(this.scrollFrame.growth)
            .merge(this.scrollFrame.bounds);
    } else {
        newBounds = this.scrollFrame.bounds.copy();
    }
    if (!this.bounds.eq(newBounds)) {
        this.bounds = newBounds;
        this.drawNew();
        this.keepInScrollFrame();
    }

    if (this.scrollFrame.isTextLineWrapping) {
        this.children.forEach(function (morph) {
            if (morph instanceof TextMorph) {
                morph.setWidth(myself.width());
                myself.setHeight(
                    Math.max(morph.height(), myself.scrollFrame.height())
                );
            }
        });
    }

    this.scrollFrame.adjustScrollBars();
};

// FrameMorph dragging & dropping of contents:

FrameMorph.prototype.reactToDropOf = function () {
    this.adjustBounds();
};

FrameMorph.prototype.reactToGrabOf = function () {
    this.adjustBounds();
};

// FrameMorph menus:

FrameMorph.prototype.developersMenu = function () {
    var menu = FrameMorph.uber.developersMenu.call(this);
    if (this.children.length > 0) {
        menu.addLine();
        menu.addItem(
            "move all inside...",
            'keepAllSubmorphsWithin',
            'keep all submorphs\nwithin and visible'
        );
    }
    return menu;
};

FrameMorph.prototype.keepAllSubmorphsWithin = function () {
    var myself = this;
    this.children.forEach(function (m) {
        m.keepWithin(myself);
    });
};
