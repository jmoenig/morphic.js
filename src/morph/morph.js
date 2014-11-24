// Morphs //////////////////////////////////////////////////////////////

// Morph: referenced constructors

var Morph;
var WorldMorph;
var HandMorph;
var ShadowMorph;
var FrameMorph;
var MenuMorph;
var HandleMorph;
var StringFieldMorph;
var ColorPickerMorph;
var SliderMorph;
var ScrollFrameMorph;
var InspectorMorph;
var StringMorph;
var TextMorph;

// Morph inherits from Node:

Morph.prototype = new Node();
Morph.prototype.constructor = Morph;
Morph.uber = Node.prototype;

// Morph settings:

/*
    damage list housekeeping

    the trackChanges property of the Morph prototype is a Boolean switch
    that determines whether the World's damage list ('broken' rectangles)
    tracks changes. By default the switch is always on. If set to false
    changes are not stored. This can be very useful for housekeeping of
    the damage list in situations where a large number of (sub-) morphs
    are changed more or less at once. Instead of keeping track of every
    single submorph's changes tremendous performance improvements can be
    achieved by setting the trackChanges flag to false before propagating
    the layout changes, setting it to true again and then storing the full
    bounds of the surrounding morph. An an example refer to the

        fixLayout()

    method of InspectorMorph, or the

        startLayout()
        endLayout()

    methods of SyntaxElementMorph in the Snap application.
*/

Morph.prototype.trackChanges = true;
Morph.prototype.shadowBlur = 4;

// Morph instance creation:

function Morph() {
    this.init();
}

// Morph initialization:

Morph.prototype.init = function () {
    Morph.uber.init.call(this);
    this.isMorph = true;
    this.bounds = new Rectangle(0, 0, 50, 40);
    this.color = new Color(80, 80, 80);
    this.texture = null; // optional url of a fill-image
    this.cachedTexture = null; // internal cache of actual bg image
    this.alpha = 1;
    this.isVisible = true;
    this.isDraggable = false;
    this.isTemplate = false;
    this.acceptsDrops = false;
    this.noticesTransparentClick = false;
    this.drawNew();
    this.fps = 0;
    this.customContextMenu = null;
    this.lastTime = Date.now();
    this.onNextStep = null; // optional function to be run once
};

// Morph string representation: e.g. 'a Morph 2 [20@45 | 130@250]'

Morph.prototype.toString = function () {
    return 'a ' +
        (this.constructor.name ||
            this.constructor.toString().split(' ')[1].split('(')[0]) +
        ' ' +
        this.children.length.toString() + ' ' +
        this.bounds;
};

// Morph deleting:

Morph.prototype.destroy = function () {
    if (this.parent !== null) {
        this.fullChanged();
        this.parent.removeChild(this);
    }
};

// Morph stepping:

Morph.prototype.stepFrame = function () {
    if (!this.step) {
        return null;
    }
    var current, elapsed, leftover, nxt;
    current = Date.now();
    elapsed = current - this.lastTime;
    if (this.fps > 0) {
        leftover = (1000 / this.fps) - elapsed;
    } else {
        leftover = 0;
    }
    if (leftover < 1) {
        this.lastTime = current;
        if (this.onNextStep) {
            nxt = this.onNextStep;
            this.onNextStep = null;
            nxt.call(this);
        }
        this.step();
        this.children.forEach(function (child) {
            child.stepFrame();
        });
    }
};

Morph.prototype.nextSteps = function (arrayOfFunctions) {
    var lst = arrayOfFunctions || [],
        nxt = lst.shift(),
        myself = this;
    if (nxt) {
        this.onNextStep = function () {
            nxt.call(myself);
            myself.nextSteps(lst);
        };
    }
};

Morph.prototype.step = function () {
    nop();
};

// Morph accessing - geometry getting:

Morph.prototype.left = function () {
    return this.bounds.left();
};

Morph.prototype.right = function () {
    return this.bounds.right();
};

Morph.prototype.top = function () {
    return this.bounds.top();
};

Morph.prototype.bottom = function () {
    return this.bounds.bottom();
};

Morph.prototype.center = function () {
    return this.bounds.center();
};

Morph.prototype.bottomCenter = function () {
    return this.bounds.bottomCenter();
};

Morph.prototype.bottomLeft = function () {
    return this.bounds.bottomLeft();
};

Morph.prototype.bottomRight = function () {
    return this.bounds.bottomRight();
};

Morph.prototype.boundingBox = function () {
    return this.bounds;
};

Morph.prototype.corners = function () {
    return this.bounds.corners();
};

Morph.prototype.leftCenter = function () {
    return this.bounds.leftCenter();
};

Morph.prototype.rightCenter = function () {
    return this.bounds.rightCenter();
};

Morph.prototype.topCenter = function () {
    return this.bounds.topCenter();
};

Morph.prototype.topLeft = function () {
    return this.bounds.topLeft();
};

Morph.prototype.topRight = function () {
    return this.bounds.topRight();
};
Morph.prototype.position = function () {
    return this.bounds.origin;
};

Morph.prototype.extent = function () {
    return this.bounds.extent();
};

Morph.prototype.width = function () {
    return this.bounds.width();
};

Morph.prototype.height = function () {
    return this.bounds.height();
};

Morph.prototype.fullBounds = function () {
    var result;
    result = this.bounds;
    this.children.forEach(function (child) {
        if (child.isVisible) {
            result = result.merge(child.fullBounds());
        }
    });
    return result;
};

Morph.prototype.fullBoundsNoShadow = function () {
    // answer my full bounds but ignore any shadow
    var result;
    result = this.bounds;
    this.children.forEach(function (child) {
        if (!(child instanceof ShadowMorph) && (child.isVisible)) {
            result = result.merge(child.fullBounds());
        }
    });
    return result;
};

Morph.prototype.visibleBounds = function () {
    // answer which part of me is not clipped by a Frame
    var visible = this.bounds,
        frames = this.allParents().filter(function (p) {
            return p instanceof FrameMorph;
        });
    frames.forEach(function (f) {
        visible = visible.intersect(f.bounds);
    });
    return visible;
};

// Morph accessing - simple changes:

Morph.prototype.moveBy = function (delta) {
    this.changed();
    this.bounds = this.bounds.translateBy(delta);
    this.children.forEach(function (child) {
        child.moveBy(delta);
    });
    this.changed();
};

Morph.prototype.silentMoveBy = function (delta) {
    this.bounds = this.bounds.translateBy(delta);
    this.children.forEach(function (child) {
        child.silentMoveBy(delta);
    });
};

Morph.prototype.setPosition = function (aPoint) {
    var delta = aPoint.subtract(this.topLeft());
    if ((delta.x !== 0) || (delta.y !== 0)) {
        this.moveBy(delta);
    }
};

Morph.prototype.silentSetPosition = function (aPoint) {
    var delta = aPoint.subtract(this.topLeft());
    if ((delta.x !== 0) || (delta.y !== 0)) {
        this.silentMoveBy(delta);
    }
};

Morph.prototype.setLeft = function (x) {
    this.setPosition(
        new Point(
            x,
            this.top()
        )
    );
};

Morph.prototype.setRight = function (x) {
    this.setPosition(
        new Point(
            x - this.width(),
            this.top()
        )
    );
};

Morph.prototype.setTop = function (y) {
    this.setPosition(
        new Point(
            this.left(),
            y
        )
    );
};

Morph.prototype.setBottom = function (y) {
    this.setPosition(
        new Point(
            this.left(),
            y - this.height()
        )
    );
};

Morph.prototype.setCenter = function (aPoint) {
    this.setPosition(
        aPoint.subtract(
            this.extent().floorDivideBy(2)
        )
    );
};

Morph.prototype.setFullCenter = function (aPoint) {
    this.setPosition(
        aPoint.subtract(
            this.fullBounds().extent().floorDivideBy(2)
        )
    );
};

Morph.prototype.keepWithin = function (aMorph) {
    // make sure I am completely within another Morph's bounds
    var leftOff, rightOff, topOff, bottomOff;
    leftOff = this.fullBounds().left() - aMorph.left();
    if (leftOff < 0) {
        this.moveBy(new Point(-leftOff, 0));
    }
    rightOff = this.fullBounds().right() - aMorph.right();
    if (rightOff > 0) {
        this.moveBy(new Point(-rightOff, 0));
    }
    topOff = this.fullBounds().top() - aMorph.top();
    if (topOff < 0) {
        this.moveBy(new Point(0, -topOff));
    }
    bottomOff = this.fullBounds().bottom() - aMorph.bottom();
    if (bottomOff > 0) {
        this.moveBy(new Point(0, -bottomOff));
    }
};

// Morph accessing - dimensional changes requiring a complete redraw

Morph.prototype.setExtent = function (aPoint) {
    if (!aPoint.eq(this.extent())) {
        this.changed();
        this.silentSetExtent(aPoint);
        this.changed();
        this.drawNew();
    }
};

Morph.prototype.silentSetExtent = function (aPoint) {
    var ext, newWidth, newHeight;
    ext = aPoint.round();
    newWidth = Math.max(ext.x, 0);
    newHeight = Math.max(ext.y, 0);
    this.bounds.corner = new Point(
        this.bounds.origin.x + newWidth,
        this.bounds.origin.y + newHeight
    );
};

Morph.prototype.setWidth = function (width) {
    this.setExtent(new Point(width || 0, this.height()));
};

Morph.prototype.silentSetWidth = function (width) {
    // do not drawNew() just yet
    var w = Math.max(Math.round(width || 0), 0);
    this.bounds.corner = new Point(
        this.bounds.origin.x + w,
        this.bounds.corner.y
    );
};

Morph.prototype.setHeight = function (height) {
    this.setExtent(new Point(this.width(), height || 0));
};

Morph.prototype.silentSetHeight = function (height) {
    // do not drawNew() just yet
    var h = Math.max(Math.round(height || 0), 0);
    this.bounds.corner = new Point(
        this.bounds.corner.x,
        this.bounds.origin.y + h
    );
};

Morph.prototype.setColor = function (aColor) {
    if (aColor) {
        if (!this.color.eq(aColor)) {
            this.color = aColor;
            this.changed();
            this.drawNew();
        }
    }
};

// Morph displaying:

Morph.prototype.drawNew = function () {
    // initialize my surface property
    this.image = newCanvas(this.extent());
    var context = this.image.getContext('2d');
    context.fillStyle = this.color.toString();
    context.fillRect(0, 0, this.width(), this.height());
    if (this.cachedTexture) {
        this.drawCachedTexture();
    } else if (this.texture) {
        this.drawTexture(this.texture);
    }
};

Morph.prototype.drawTexture = function (url) {
    var myself = this;
    this.cachedTexture = new Image();
    this.cachedTexture.onload = function () {
        myself.drawCachedTexture();
    };
    this.cachedTexture.src = this.texture = url; // make absolute
};

Morph.prototype.drawCachedTexture = function () {
    var bg = this.cachedTexture,
        cols = Math.floor(this.image.width / bg.width),
        lines = Math.floor(this.image.height / bg.height),
        x,
        y,
        context = this.image.getContext('2d');

    for (y = 0; y <= lines; y += 1) {
        for (x = 0; x <= cols; x += 1) {
            context.drawImage(bg, x * bg.width, y * bg.height);
        }
    }
    this.changed();
};

/*
Morph.prototype.drawCachedTexture = function () {
    var context = this.image.getContext('2d'),
        pattern = context.createPattern(this.cachedTexture, 'repeat');
    context.fillStyle = pattern;
    context.fillRect(0, 0, this.image.width, this.image.height);
    this.changed();
};
*/

Morph.prototype.drawOn = function (aCanvas, aRect) {
    var rectangle, area, delta, src, context, w, h, sl, st;
    if (!this.isVisible) {
        return null;
    }
    rectangle = aRect || this.bounds();
    area = rectangle.intersect(this.bounds).round();
    if (area.extent().gt(new Point(0, 0))) {
        delta = this.position().neg();
        src = area.copy().translateBy(delta).round();
        context = aCanvas.getContext('2d');
        context.globalAlpha = this.alpha;

        sl = src.left();
        st = src.top();
        w = Math.min(src.width(), this.image.width - sl);
        h = Math.min(src.height(), this.image.height - st);

        if (w < 1 || h < 1) {
            return null;
        }

        context.drawImage(
            this.image,
            src.left(),
            src.top(),
            w,
            h,
            area.left(),
            area.top(),
            w,
            h
        );

    /* "for debugging purposes:"

        try {
            context.drawImage(
                this.image,
                src.left(),
                src.top(),
                w,
                h,
                area.left(),
                area.top(),
                w,
                h
            );
        } catch (err) {
            alert('internal error\n\n' + err
                + '\n ---'
                + '\n canvas: ' + aCanvas
                + '\n canvas.width: ' + aCanvas.width
                + '\n canvas.height: ' + aCanvas.height
                + '\n ---'
                + '\n image: ' + this.image
                + '\n image.width: ' + this.image.width
                + '\n image.height: ' + this.image.height
                + '\n ---'
                + '\n w: ' + w
                + '\n h: ' + h
                + '\n sl: ' + sl
                + '\n st: ' + st
                + '\n area.left: ' + area.left()
                + '\n area.top ' + area.top()
                );
        }
    */

    }
};

Morph.prototype.fullDrawOn = function (aCanvas, aRect) {
    var rectangle;
    if (!this.isVisible) {
        return null;
    }
    rectangle = aRect || this.fullBounds();
    this.drawOn(aCanvas, rectangle);
    this.children.forEach(function (child) {
        child.fullDrawOn(aCanvas, rectangle);
    });
};

Morph.prototype.hide = function () {
    this.isVisible = false;
    this.changed();
    this.children.forEach(function (child) {
        child.hide();
    });
};

Morph.prototype.show = function () {
    this.isVisible = true;
    this.changed();
    this.children.forEach(function (child) {
        child.show();
    });
};

Morph.prototype.toggleVisibility = function () {
    this.isVisible = (!this.isVisible);
    this.changed();
    this.children.forEach(function (child) {
        child.toggleVisibility();
    });
};

// Morph full image:

Morph.prototype.fullImageClassic = function () {
    // why doesn't this work for all Morphs?
    var fb = this.fullBounds(),
        img = newCanvas(fb.extent()),
        ctx = img.getContext('2d');
    ctx.translate(-this.bounds.origin.x, -this.bounds.origin.y);
    this.fullDrawOn(img, fb);
    img.globalAlpha = this.alpha;
    return img;
};

Morph.prototype.fullImage = function () {
    var img, ctx, fb;
    img = newCanvas(this.fullBounds().extent());
    ctx = img.getContext('2d');
    fb = this.fullBounds();
    this.allChildren().forEach(function (morph) {
        if (morph.isVisible) {
            ctx.globalAlpha = morph.alpha;
            if (morph.image.width && morph.image.height) {
                ctx.drawImage(
                    morph.image,
                    morph.bounds.origin.x - fb.origin.x,
                    morph.bounds.origin.y - fb.origin.y
                );
            }
        }
    });
    return img;
};

// Morph shadow:

Morph.prototype.shadowImage = function (off, color) {
    // fallback for Windows Chrome-Shadow bug
    var fb, img, outline, sha, ctx,
        offset = off || new Point(7, 7),
        clr = color || new Color(0, 0, 0);
    fb = this.fullBounds().extent();
    img = this.fullImage();
    outline = newCanvas(fb);
    ctx = outline.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(
        img,
        -offset.x,
        -offset.y
    );
    sha = newCanvas(fb);
    ctx = sha.getContext('2d');
    ctx.drawImage(outline, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = clr.toString();
    ctx.fillRect(0, 0, fb.x, fb.y);
    return sha;
};

Morph.prototype.shadowImageBlurred = function (off, color) {
    var fb, img, sha, ctx,
        offset = off || new Point(7, 7),
        blur = this.shadowBlur,
        clr = color || new Color(0, 0, 0);
    fb = this.fullBounds().extent().add(blur * 2);
    img = this.fullImage();
    sha = newCanvas(fb);
    ctx = sha.getContext('2d');
    ctx.shadowOffsetX = offset.x;
    ctx.shadowOffsetY = offset.y;
    ctx.shadowBlur = blur;
    ctx.shadowColor = clr.toString();
    ctx.drawImage(
        img,
        blur - offset.x,
        blur - offset.y
    );
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(
        img,
        blur - offset.x,
        blur - offset.y
    );
    return sha;
};

Morph.prototype.shadow = function (off, a, color) {
    var shadow = new ShadowMorph(),
        offset = off || new Point(7, 7),
        alpha = a || ((a === 0) ? 0 : 0.2),
        fb = this.fullBounds();
    shadow.setExtent(fb.extent().add(this.shadowBlur * 2));
    if (useBlurredShadows && !MorphicPreferences.isFlat) {
        shadow.image = this.shadowImageBlurred(offset, color);
        shadow.alpha = alpha;
        shadow.setPosition(fb.origin.add(offset).subtract(this.shadowBlur));
    } else {
        shadow.image = this.shadowImage(offset, color);
        shadow.alpha = alpha;
        shadow.setPosition(fb.origin.add(offset));
    }
    return shadow;
};

Morph.prototype.addShadow = function (off, a, color) {
    var shadow,
        offset = off || new Point(7, 7),
        alpha = a || ((a === 0) ? 0 : 0.2);
    shadow = this.shadow(offset, alpha, color);
    this.addBack(shadow);
    this.fullChanged();
    return shadow;
};

Morph.prototype.getShadow = function () {
    var shadows;
    shadows = this.children.slice(0).reverse().filter(
        function (child) {
            return child instanceof ShadowMorph;
        }
    );
    if (shadows.length !== 0) {
        return shadows[0];
    }
    return null;
};

Morph.prototype.removeShadow = function () {
    var shadow = this.getShadow();
    if (shadow !== null) {
        this.fullChanged();
        this.removeChild(shadow);
    }
};

// Morph pen trails:

Morph.prototype.penTrails = function () {
    // answer my pen trails canvas. default is to answer my image
    return this.image;
};

// Morph updating:

Morph.prototype.changed = function () {
    if (this.trackChanges) {
        var w = this.root();
        if (w instanceof WorldMorph) {
            w.broken.push(this.visibleBounds().spread());
        }
    }
    if (this.parent) {
        this.parent.childChanged(this);
    }
};

Morph.prototype.fullChanged = function () {
    if (this.trackChanges) {
        var w = this.root();
        if (w instanceof WorldMorph) {
            w.broken.push(this.fullBounds().spread());
        }
    }
};

Morph.prototype.childChanged = function () {
    // react to a  change in one of my children,
    // default is to just pass this message on upwards
    // override this method for Morphs that need to adjust accordingly
    if (this.parent) {
        this.parent.childChanged(this);
    }
};

// Morph accessing - structure:

Morph.prototype.world = function () {
    var root = this.root();
    if (root instanceof WorldMorph) {
        return root;
    }
    if (root instanceof HandMorph) {
        return root.world;
    }
    return null;
};

Morph.prototype.add = function (aMorph) {
    var owner = aMorph.parent;
    if (owner !== null) {
        owner.removeChild(aMorph);
    }
    this.addChild(aMorph);
};

Morph.prototype.addBack = function (aMorph) {
    var owner = aMorph.parent;
    if (owner !== null) {
        owner.removeChild(aMorph);
    }
    this.addChildFirst(aMorph);
};

Morph.prototype.topMorphSuchThat = function (predicate) {
    var next;
    if (predicate.call(null, this)) {
        next = detect(
            this.children.slice(0).reverse(),
            predicate
        );
        if (next) {
            return next.topMorphSuchThat(predicate);
        }
        return this;
    }
    return null;
};

Morph.prototype.morphAt = function (aPoint) {
    var morphs = this.allChildren().slice(0).reverse(),
        result = null;
    morphs.forEach(function (m) {
        if (m.fullBounds().containsPoint(aPoint) &&
                (result === null)) {
            result = m;
        }
    });
    return result;
};

/*
    alternative -  more elegant and possibly more
    performant - solution for morphAt.
    Has some issues, commented out for now

Morph.prototype.morphAt = function (aPoint) {
    return this.topMorphSuchThat(function (m) {
        return m.fullBounds().containsPoint(aPoint);
    });
};
*/

Morph.prototype.overlappedMorphs = function () {
    //exclude the World
    var world = this.world(),
        fb = this.fullBounds(),
        myself = this,
        allParents = this.allParents(),
        allChildren = this.allChildren(),
        morphs;

    morphs = world.allChildren();
    return morphs.filter(function (m) {
        return m.isVisible &&
            m !== myself &&
            m !== world &&
            !contains(allParents, m) &&
            !contains(allChildren, m) &&
            m.fullBounds().intersects(fb);
    });
};

// Morph pixel access:

Morph.prototype.getPixelColor = function (aPoint) {
    var point, context, data;
    point = aPoint.subtract(this.bounds.origin);
    context = this.image.getContext('2d');
    data = context.getImageData(point.x, point.y, 1, 1);
    return new Color(
        data.data[0],
        data.data[1],
        data.data[2],
        data.data[3]
    );
};

Morph.prototype.isTransparentAt = function (aPoint) {
    var point, context, data;
    if (this.bounds.containsPoint(aPoint)) {
        if (this.texture) {
            return false;
        }
        point = aPoint.subtract(this.bounds.origin);
        context = this.image.getContext('2d');
        data = context.getImageData(
            Math.floor(point.x),
            Math.floor(point.y),
            1,
            1
        );
        return data.data[3] === 0;
    }
    return false;
};

// Morph duplicating:

Morph.prototype.copy = function () {
    var c = copy(this);
    c.parent = null;
    c.children = [];
    c.bounds = this.bounds.copy();
    return c;
};

Morph.prototype.fullCopy = function () {
    /*
    Produce a copy of me with my entire tree of submorphs. Morphs
    mentioned more than once are all directed to a single new copy.
    Other properties are also *shallow* copied, so you must override
    to deep copy Arrays and (complex) Objects
    */
    var dict = {}, c;
    c = this.copyRecordingReferences(dict);
    c.forAllChildren(function (m) {
        m.updateReferences(dict);
    });
    return c;
};

Morph.prototype.copyRecordingReferences = function (dict) {
    /*
    Recursively copy this entire composite morph, recording the
    correspondence between old and new morphs in the given dictionary.
    This dictionary will be used to update intra-composite references
    in the copy. See updateReferences().
    Note: This default implementation copies ONLY morphs in the
    submorph hierarchy. If a morph stores morphs in other properties
    that it wants to copy, then it should override this method to do so.
    The same goes for morphs that contain other complex data that
    should be copied when the morph is duplicated.
    */
    var c = this.copy();
    dict[this] = c;
    this.children.forEach(function (m) {
        c.add(m.copyRecordingReferences(dict));
    });
    return c;
};

Morph.prototype.updateReferences = function (dict) {
    /*
    Update intra-morph references within a composite morph that has
    been copied. For example, if a button refers to morph X in the
    orginal composite then the copy of that button in the new composite
    should refer to the copy of X in new composite, not the original X.
    */
    var property;
    for (property in this) {
        if (this[property] && this[property].isMorph && dict[property]) {
            this[property] = dict[property];
        }
    }
};

// Morph dragging and dropping:

Morph.prototype.rootForGrab = function () {
    if (this instanceof ShadowMorph) {
        return this.parent.rootForGrab();
    }
    if (this.parent instanceof ScrollFrameMorph) {
        return this.parent;
    }
    if (this.parent === null ||
            this.parent instanceof WorldMorph ||
            this.parent instanceof FrameMorph ||
            this.isDraggable === true) {
        return this;
    }
    return this.parent.rootForGrab();
};

Morph.prototype.wantsDropOf = function (aMorph) {
    // default is to answer the general flag - change for my heirs
    if ((aMorph instanceof HandleMorph) ||
            (aMorph instanceof MenuMorph) ||
            (aMorph instanceof InspectorMorph)) {
        return false;
    }
    return this.acceptsDrops;
};

Morph.prototype.pickUp = function (wrrld) {
    var world = wrrld || this.world();
    this.setPosition(
        world.hand.position().subtract(
            this.extent().floorDivideBy(2)
        )
    );
    world.hand.grab(this);
};

Morph.prototype.isPickedUp = function () {
    return this.parentThatIsA(HandMorph) !== null;
};

Morph.prototype.situation = function () {
    // answer a dictionary specifying where I am right now, so
    // I can slide back to it if I'm dropped somewhere else
    if (this.parent) {
        return {
            origin: this.parent,
            position: this.position().subtract(this.parent.position())
        };
    }
    return null;
};

Morph.prototype.slideBackTo = function (situation, inSteps) {
    var steps = inSteps || 5,
        pos = situation.origin.position().add(situation.position),
        xStep = -(this.left() - pos.x) / steps,
        yStep = -(this.top() - pos.y) / steps,
        stepCount = 0,
        oldStep = this.step,
        oldFps = this.fps,
        myself = this;

    this.fps = 0;
    this.step = function () {
        myself.fullChanged();
        myself.silentMoveBy(new Point(xStep, yStep));
        myself.fullChanged();
        stepCount += 1;
        if (stepCount === steps) {
            situation.origin.add(myself);
            if (situation.origin.reactToDropOf) {
                situation.origin.reactToDropOf(myself);
            }
            myself.step = oldStep;
            myself.fps = oldFps;
        }
    };
};

// Morph utilities:

Morph.prototype.nop = function () {
    nop();
};

Morph.prototype.resize = function () {
    this.world().activeHandle = new HandleMorph(this);
};

Morph.prototype.move = function () {
    this.world().activeHandle = new HandleMorph(
        this,
        null,
        null,
        null,
        null,
        'move'
    );
};

Morph.prototype.hint = function (msg) {
    var m, text;
    text = msg;
    if (msg) {
        if (msg.toString) {
            text = msg.toString();
        }
    } else {
        text = 'NULL';
    }
    m = new MenuMorph(this, text);
    m.isDraggable = true;
    m.popUpCenteredAtHand(this.world());
};

Morph.prototype.inform = function (msg) {
    var m, text;
    text = msg;
    if (msg) {
        if (msg.toString) {
            text = msg.toString();
        }
    } else {
        text = 'NULL';
    }
    m = new MenuMorph(this, text);
    m.addItem("Ok");
    m.isDraggable = true;
    m.popUpCenteredAtHand(this.world());
};

Morph.prototype.prompt = function (
    msg,
    callback,
    environment,
    defaultContents,
    width,
    floorNum,
    ceilingNum,
    isRounded
) {
    var menu, entryField, slider, isNumeric;
    if (ceilingNum) {
        isNumeric = true;
    }
    menu = new MenuMorph(
        callback || null,
        msg || '',
        environment || null
    );
    entryField = new StringFieldMorph(
        defaultContents || '',
        width || 100,
        MorphicPreferences.prompterFontSize,
        MorphicPreferences.prompterFontName,
        false,
        false,
        isNumeric
    );
    menu.items.push(entryField);
    if (ceilingNum || MorphicPreferences.useSliderForInput) {
        slider = new SliderMorph(
            floorNum || 0,
            ceilingNum,
            parseFloat(defaultContents),
            Math.floor((ceilingNum - floorNum) / 4),
            'horizontal'
        );
        slider.alpha = 1;
        slider.color = new Color(225, 225, 225);
        slider.button.color = menu.borderColor;
        slider.button.highlightColor = slider.button.color.copy();
        slider.button.highlightColor.b += 100;
        slider.button.pressColor = slider.button.color.copy();
        slider.button.pressColor.b += 150;
        slider.setHeight(MorphicPreferences.prompterSliderSize);
        if (isRounded) {
            slider.action = function (num) {
                entryField.changed();
                entryField.text.text = Math.round(num).toString();
                entryField.text.drawNew();
                entryField.text.changed();
                entryField.text.edit();
            };
        } else {
            slider.action = function (num) {
                entryField.changed();
                entryField.text.text = num.toString();
                entryField.text.drawNew();
                entryField.text.changed();
            };
        }
        menu.items.push(slider);
    }

    menu.addLine(2);
    menu.addItem('Ok', function () {
        return entryField.string();
    });
    menu.addItem('Cancel', function () {
        return null;
    });
    menu.isDraggable = true;
    menu.popUpAtHand(this.world());
    entryField.text.edit();
};

Morph.prototype.pickColor = function (
    msg,
    callback,
    environment,
    defaultContents
) {
    var menu, colorPicker;
    menu = new MenuMorph(
        callback || null,
        msg || '',
        environment || null
    );
    colorPicker = new ColorPickerMorph(defaultContents);
    menu.items.push(colorPicker);
    menu.addLine(2);
    menu.addItem('Ok', function () {
        return colorPicker.getChoice();
    });
    menu.addItem('Cancel', function () {
        return null;
    });
    menu.isDraggable = true;
    menu.popUpAtHand(this.world());
};

Morph.prototype.inspect = function (anotherObject) {
    var world = this.world instanceof Function ?
            this.world() : this.root() || this.world,
        inspector,
        inspectee = this;

    if (anotherObject) {
        inspectee = anotherObject;
    }
    inspector = new InspectorMorph(inspectee);
    inspector.setPosition(world.hand.position());
    inspector.keepWithin(world);
    world.add(inspector);
    inspector.changed();
};

// Morph menus:

Morph.prototype.contextMenu = function () {
    var world;

    if (this.customContextMenu) {
        return this.customContextMenu;
    }
    world = this.world instanceof Function ? this.world() : this.world;
    if (world && world.isDevMode) {
        if (this.parent === world) {
            return this.developersMenu();
        }
        return this.hierarchyMenu();
    }
    return this.userMenu() ||
        (this.parent && this.parent.userMenu());
};

Morph.prototype.hierarchyMenu = function () {
    var parents = this.allParents(),
        world = this.world instanceof Function ? this.world() : this.world,
        menu = new MenuMorph(this, null);

    parents.forEach(function (each) {
        if (each.developersMenu && (each !== world)) {
            menu.addItem(each.toString().slice(0, 50), function () {
                each.developersMenu().popUpAtHand(world);
            });
        }
    });
    return menu;
};

Morph.prototype.developersMenu = function () {
    // 'name' is not an official property of a function, hence:
    var world = this.world instanceof Function ? this.world() : this.world,
        userMenu = this.userMenu() ||
            (this.parent && this.parent.userMenu()),
        menu = new MenuMorph(this, this.constructor.name ||
            this.constructor.toString().split(' ')[1].split('(')[0]);
    if (userMenu) {
        menu.addItem(
            'user features...',
            function () {
                userMenu.popUpAtHand(world);
            }
        );
        menu.addLine();
    }
    menu.addItem(
        "color...",
        function () {
            this.pickColor(
                menu.title + '\ncolor:',
                this.setColor,
                this,
                this.color
            );
        },
        'choose another color \nfor this morph'
    );
    menu.addItem(
        "transparency...",
        function () {
            this.prompt(
                menu.title + '\nalpha\nvalue:',
                this.setAlphaScaled,
                this,
                (this.alpha * 100).toString(),
                null,
                1,
                100,
                true
            );
        },
        'set this morph\'s\nalpha value'
    );
    menu.addItem(
        "resize...",
        'resize',
        'show a handle\nwhich can be dragged\nto change this morph\'s' +
            ' extent'
    );
    menu.addLine();
    menu.addItem(
        "duplicate",
        function () {
            this.fullCopy().pickUp(this.world());
        },
        'make a copy\nand pick it up'
    );
    menu.addItem(
        "pick up",
        'pickUp',
        'disattach and put \ninto the hand'
    );
    menu.addItem(
        "attach...",
        'attach',
        'stick this morph\nto another one'
    );
    menu.addItem(
        "move...",
        'move',
        'show a handle\nwhich can be dragged\nto move this morph'
    );
    menu.addItem(
        "inspect...",
        'inspect',
        'open a window\non all properties'
    );
    menu.addItem(
        "pic...",
        function () {
            window.open(this.fullImageClassic().toDataURL());
        },
        'open a new window\nwith a picture of this morph'
    );
    menu.addLine();
    if (this.isDraggable) {
        menu.addItem(
            "lock",
            'toggleIsDraggable',
            'make this morph\nunmovable'
        );
    } else {
        menu.addItem(
            "unlock",
            'toggleIsDraggable',
            'make this morph\nmovable'
        );
    }
    menu.addItem("hide", 'hide');
    menu.addItem("delete", 'destroy');
    if (!(this instanceof WorldMorph)) {
        menu.addLine();
        menu.addItem(
            "World...",
            function () {
                world.contextMenu().popUpAtHand(world);
            },
            'show the\nWorld\'s menu'
        );
    }
    return menu;
};

Morph.prototype.userMenu = function () {
    return null;
};

// Morph menu actions

Morph.prototype.setAlphaScaled = function (alpha) {
    // for context menu demo purposes
    var newAlpha, unscaled;
    if (typeof alpha === 'number') {
        unscaled = alpha / 100;
        this.alpha = Math.min(Math.max(unscaled, 0.1), 1);
    } else {
        newAlpha = parseFloat(alpha);
        if (!isNaN(newAlpha)) {
            unscaled = newAlpha / 100;
            this.alpha = Math.min(Math.max(unscaled, 0.1), 1);
        }
    }
    this.changed();
};

Morph.prototype.attach = function () {
    var choices = this.overlappedMorphs(),
        menu = new MenuMorph(this, 'choose new parent:'),
        myself = this;

    choices.forEach(function (each) {
        menu.addItem(each.toString().slice(0, 50), function () {
            each.add(myself);
            myself.isDraggable = false;
        });
    });
    if (choices.length > 0) {
        menu.popUpAtHand(this.world());
    }
};

Morph.prototype.toggleIsDraggable = function () {
    // for context menu demo purposes
    this.isDraggable = !this.isDraggable;
};

Morph.prototype.colorSetters = function () {
    // for context menu demo purposes
    return ['color'];
};

Morph.prototype.numericalSetters = function () {
    // for context menu demo purposes
    return [
        'setLeft',
        'setTop',
        'setWidth',
        'setHeight',
        'setAlphaScaled'
    ];
};

// Morph entry field tabbing:

Morph.prototype.allEntryFields = function () {
    return this.allChildren().filter(function (each) {
        return each.isEditable &&
            (each instanceof StringMorph ||
                each instanceof TextMorph);
    });
};

Morph.prototype.nextEntryField = function (current) {
    var fields = this.allEntryFields(),
        idx = fields.indexOf(current);
    if (idx !== -1) {
        if (fields.length > idx + 1) {
            return fields[idx + 1];
        }
    }
    return fields[0];
};

Morph.prototype.previousEntryField = function (current) {
    var fields = this.allEntryFields(),
        idx = fields.indexOf(current);
    if (idx !== -1) {
        if (idx > 0) {
            return fields[idx - 1];
        }
        return fields[fields.length - 1];
    }
    return fields[0];
};

Morph.prototype.tab = function (editField) {
/*
    the <tab> key was pressed in one of my edit fields.
    invoke my "nextTab()" function if it exists, else
    propagate it up my owner chain.
*/
    if (this.nextTab) {
        this.nextTab(editField);
    } else if (this.parent) {
        this.parent.tab(editField);
    }
};

Morph.prototype.backTab = function (editField) {
/*
    the <back tab> key was pressed in one of my edit fields.
    invoke my "previousTab()" function if it exists, else
    propagate it up my owner chain.
*/
    if (this.previousTab) {
        this.previousTab(editField);
    } else if (this.parent) {
        this.parent.backTab(editField);
    }
};

/*
    the following are examples of what the navigation methods should
    look like. Insert these at the World level for fallback, and at lower
    levels in the Morphic tree (e.g. dialog boxes) for a more fine-grained
    control over the tabbing cycle.

Morph.prototype.nextTab = function (editField) {
    var next = this.nextEntryField(editField);
    editField.clearSelection();
    next.selectAll();
    next.edit();
};

Morph.prototype.previousTab = function (editField) {
    var prev = this.previousEntryField(editField);
    editField.clearSelection();
    prev.selectAll();
    prev.edit();
};

*/

// Morph events:

Morph.prototype.escalateEvent = function (functionName, arg) {
    var handler = this.parent;
    while (!handler[functionName] && handler.parent !== null) {
        handler = handler.parent;
    }
    if (handler[functionName]) {
        handler[functionName](arg);
    }
};

// Morph eval:

Morph.prototype.evaluateString = function (code) {
    var result;

    try {
        result = eval(code);
        this.drawNew();
        this.changed();
    } catch (err) {
        this.inform(err);
    }
    return result;
};

// Morph collision detection:

Morph.prototype.isTouching = function (otherMorph) {
    var oImg = this.overlappingImage(otherMorph),
        data = oImg.getContext('2d')
            .getImageData(1, 1, oImg.width, oImg.height)
            .data;
    return detect(
        data,
        function (each) {
            return each !== 0;
        }
    ) !== null;
};

Morph.prototype.overlappingImage = function (otherMorph) {
    var fb = this.fullBounds(),
        otherFb = otherMorph.fullBounds(),
        oRect = fb.intersect(otherFb),
        oImg = newCanvas(oRect.extent()),
        ctx = oImg.getContext('2d');
    if (oRect.width() < 1 || oRect.height() < 1) {
        return newCanvas(new Point(1, 1));
    }
    ctx.drawImage(
        this.fullImage(),
        oRect.origin.x - fb.origin.x,
        oRect.origin.y - fb.origin.y
    );
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(
        otherMorph.fullImage(),
        otherFb.origin.x - oRect.origin.x,
        otherFb.origin.y - oRect.origin.y
    );
    return oImg;
};
