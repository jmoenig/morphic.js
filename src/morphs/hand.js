// I represent the Mouse cursor

// HandMorph inherits from Morph:

HandMorph.prototype = new Morph();
HandMorph.prototype.constructor = HandMorph;
HandMorph.uber = Morph.prototype;

// HandMorph instance creation:

function HandMorph(aWorld) {
    this.init(aWorld);
}

// HandMorph initialization:

HandMorph.prototype.init = function (aWorld) {
    HandMorph.uber.init.call(this, true);
    this.bounds = new Rectangle();

    // additional properties:
    this.world = aWorld;
    this.mouseButton = null;
    this.mouseOverList = [];
    this.morphToGrab = null;
    this.grabPosition = null;
    this.grabOrigin = null;
    this.temporaries = [];
    this.touchHoldTimeout = null;
    this.contextMenuEnabled = false;
};

HandMorph.prototype.changed = function () {
    var b;
    if (this.world !== null) {
        b = this.fullBounds();
        if (!b.extent().eq(new Point())) {
            this.world.broken.push(b.spread());
        }
    }
};

HandMorph.prototype.fullChanged = HandMorph.prototype.changed;

// HandMorph navigation:

HandMorph.prototype.morphAtPointer = function () {
    return this.world.topMorphAt(this.bounds.origin) || this.world;
};

HandMorph.prototype.allMorphsAtPointer = function () {
    var morphs = this.world.allChildren(),
        myself = this;
    return morphs.filter(function (m) {
        return m.isVisible &&
            m.visibleBounds().containsPoint(myself.bounds.origin);
    });
};

// HandMorph dragging and dropping:
/*
    drag 'n' drop events, method(arg) -> receiver:

        prepareToBeGrabbed(handMorph) -> grabTarget
        reactToGrabOf(grabbedMorph) -> oldParent
        wantsDropOf(morphToDrop) ->  newParent
        justDropped(handMorph) -> droppedMorph
        reactToDropOf(droppedMorph, handMorph) -> newParent
*/

HandMorph.prototype.dropTargetFor = function (aMorph) {
    var target = this.morphAtPointer();
    while (!target.wantsDropOf(aMorph)) {
        target = target.parent;
    }
    return target;
};

HandMorph.prototype.grab = function (aMorph) {
    var oldParent = aMorph.parent;
    if (aMorph instanceof WorldMorph) {
        return null;
    }
    if (this.children.length === 0) {
        this.world.stopEditing();
        this.grabOrigin = aMorph.situation();
        if (!(aMorph instanceof MenuMorph)) {
            aMorph.addShadow();
        }
        if (aMorph.prepareToBeGrabbed) {
            aMorph.prepareToBeGrabbed(this);
        }
        aMorph.cachedFullImage = aMorph.fullImageClassic();
        aMorph.cachedFullBounds = aMorph.fullBounds();
        this.add(aMorph);
        this.changed();
        if (oldParent && oldParent.reactToGrabOf) {
            oldParent.reactToGrabOf(aMorph);
        }
    }
};

HandMorph.prototype.drop = function () {
    var target, morphToDrop;
    if (this.children.length !== 0) {
        morphToDrop = this.children[0];
        target = this.dropTargetFor(morphToDrop);
        target = target.selectForEdit ? target.selectForEdit() : target;
        this.changed();
        target.add(morphToDrop);
        morphToDrop.cachedFullImage = null;
        morphToDrop.cachedFullBounds = null;
        morphToDrop.changed();
        if (!(morphToDrop instanceof MenuMorph)) {
            morphToDrop.removeShadow();
        }
        this.children = [];
        this.setExtent(new Point());
        if (morphToDrop.justDropped) {
            morphToDrop.justDropped(this);
        }
        if (target.reactToDropOf) {
            target.reactToDropOf(morphToDrop, this);
        }
    }
};

// HandMorph event dispatching:
/*
    mouse events:

        mouseDownLeft
        mouseDownRight
        mouseClickLeft
        mouseClickRight
        mouseDoubleClick
        mouseEnter
        mouseLeave
        mouseEnterDragging
        mouseLeaveDragging
        mouseMove
        mouseScroll
*/

HandMorph.prototype.processMouseDown = function (event) {
    var morph, actualClick;

    this.destroyTemporaries();
    this.contextMenuEnabled = true;
    this.morphToGrab = null;
    this.grabPosition = null;
    if (this.children.length !== 0) {
        this.drop();
        this.mouseButton = null;
    } else {
        morph = this.morphAtPointer();
        if (this.world.activeMenu) {
            if (!contains(
                morph.allParents(),
                this.world.activeMenu
            )) {
                this.world.activeMenu.destroy();
            } else {
                clearInterval(this.touchHoldTimeout);
            }
        }
        if (this.world.activeHandle) {
            if (morph !== this.world.activeHandle) {
                this.world.activeHandle.destroy();
            }
        }
        if (this.world.cursor) {
            if (morph !== this.world.cursor.target) {
                this.world.stopEditing();
            }
        }
        if (!morph.mouseMove) {
            this.morphToGrab = morph.rootForGrab();
            this.grabPosition = this.bounds.origin.copy();
        }
        if (event.button === 2 || event.ctrlKey) {
            this.mouseButton = 'right';
            actualClick = 'mouseDownRight';
        } else {
            this.mouseButton = 'left';
            actualClick = 'mouseDownLeft';
        }
        while (!morph[actualClick]) {
            morph = morph.parent;
        }
        morph[actualClick](this.bounds.origin);
    }
};

HandMorph.prototype.processTouchStart = function (event) {
    var myself = this;
    MorphicPreferences.isTouchDevice = true;
    clearInterval(this.touchHoldTimeout);
    if (event.touches.length === 1) {
        this.touchHoldTimeout = setInterval( // simulate mouseRightClick
            function () {
                myself.processMouseDown({button: 2});
                myself.processMouseUp({button: 2});
                event.preventDefault();
                clearInterval(myself.touchHoldTimeout);
            },
            400
        );
        this.processMouseMove(event.touches[0]); // update my position
        this.processMouseDown({button: 0});
        event.preventDefault();
    }
};

HandMorph.prototype.processTouchMove = function (event) {
    MorphicPreferences.isTouchDevice = true;
    if (event.touches.length === 1) {
        var touch = event.touches[0];
        this.processMouseMove(touch);
        clearInterval(this.touchHoldTimeout);
    }
};

HandMorph.prototype.processTouchEnd = function (event) {
    MorphicPreferences.isTouchDevice = true;
    clearInterval(this.touchHoldTimeout);
    nop(event);
    this.processMouseUp({button: 0});
};

HandMorph.prototype.processMouseUp = function () {
    var morph = this.morphAtPointer(),
        context,
        contextMenu,
        expectedClick;

    this.destroyTemporaries();
    if (this.children.length !== 0) {
        this.drop();
    } else {
        if (this.mouseButton === 'left') {
            expectedClick = 'mouseClickLeft';
        } else {
            expectedClick = 'mouseClickRight';
            if (this.mouseButton && this.contextMenuEnabled) {
                context = morph;
                contextMenu = context.contextMenu();
                while ((!contextMenu) &&
                context.parent) {
                    context = context.parent;
                    contextMenu = context.contextMenu();
                }
                if (contextMenu) {
                    contextMenu.popUpAtHand(this.world);
                }
            }
        }
        while (!morph[expectedClick]) {
            morph = morph.parent;
        }
        morph[expectedClick](this.bounds.origin);
    }
    this.mouseButton = null;
};

HandMorph.prototype.processDoubleClick = function () {
    var morph = this.morphAtPointer();

    this.destroyTemporaries();
    if (this.children.length !== 0) {
        this.drop();
    } else {
        while (morph && !morph.mouseDoubleClick) {
            morph = morph.parent;
        }
        if (morph) {
            morph.mouseDoubleClick(this.bounds.origin);
        }
    }
    this.mouseButton = null;
};

HandMorph.prototype.processMouseMove = function (event) {
    var pos,
        posInDocument = getDocumentPositionOf(this.world.worldCanvas),
        mouseOverNew,
        myself = this,
        morph,
        topMorph;

    pos = new Point(
        event.pageX - posInDocument.x,
        event.pageY - posInDocument.y
    );

    this.setPosition(pos);

    // determine the new mouse-over-list:
    // mouseOverNew = this.allMorphsAtPointer();
    mouseOverNew = this.morphAtPointer().allParents();

    if (!this.children.length && this.mouseButton) {
        topMorph = this.morphAtPointer();
        morph = topMorph.rootForGrab();
        if (topMorph.mouseMove) {
            topMorph.mouseMove(pos, this.mouseButton);
            if (this.mouseButton === 'right') {
                this.contextMenuEnabled = false;
            }
        }

        // if a morph.jsk is marked for grabbing, just grab it
        if (this.mouseButton === 'left' &&
            this.morphToGrab &&
            (this.grabPosition.distanceTo(this.bounds.origin) >
                MorphicPreferences.grabThreshold)) {
            this.setPosition(this.grabPosition);
            if (this.morphToGrab.isDraggable) {
                morph = this.morphToGrab.selectForEdit ?
                    this.morphToGrab.selectForEdit() : this.morphToGrab;
                this.grab(morph);
            } else if (this.morphToGrab.isTemplate) {
                this.world.stopEditing();
                morph = this.morphToGrab.fullCopy();
                morph.isTemplate = false;
                morph.isDraggable = true;
                if (morph.reactToTemplateCopy) {
                    morph.reactToTemplateCopy();
                }
                this.grab(morph);
                this.grabOrigin = this.morphToGrab.situation();
            }
            this.setPosition(pos);
        }
    }

    this.mouseOverList.forEach(function (old) {
        if (!contains(mouseOverNew, old)) {
            if (old.mouseLeave) {
                old.mouseLeave();
            }
            if (old.mouseLeaveDragging && myself.mouseButton) {
                old.mouseLeaveDragging();
            }
        }
    });
    mouseOverNew.forEach(function (newMorph) {
        if (!contains(myself.mouseOverList, newMorph)) {
            if (newMorph.mouseEnter) {
                newMorph.mouseEnter();
            }
            if (newMorph.mouseEnterDragging && myself.mouseButton) {
                newMorph.mouseEnterDragging();
            }
        }

        // autoScrolling support:
        if (myself.children.length > 0) {
            if (newMorph instanceof ScrollFrameMorph &&
                newMorph.enableAutoScrolling &&
                newMorph.contents.allChildren().some(function (any) {
                    return any.wantsDropOf(myself.children[0]);
                })
            ) {
                if (!newMorph.bounds.insetBy(
                    MorphicPreferences.scrollBarSize * 3
                ).containsPoint(myself.bounds.origin)) {
                    newMorph.startAutoScrolling();
                }
            }
        }
    });
    this.mouseOverList = mouseOverNew;
};

HandMorph.prototype.processMouseScroll = function (event) {
    var morph = this.morphAtPointer();
    while (morph && !morph.mouseScroll) {
        morph = morph.parent;
    }
    if (morph) {
        morph.mouseScroll(
            (event.detail / -3) || (
                Object.prototype.hasOwnProperty.call(
                    event,
                    'wheelDeltaY'
                ) ?
                    event.wheelDeltaY / 120 :
                    event.wheelDelta / 120
            ),
            event.wheelDeltaX / 120 || 0
        );
    }
};

/*
    drop event:

        droppedImage
        droppedSVG
        droppedAudio
        droppedText
*/

HandMorph.prototype.processDrop = function (event) {
    /*
        find out whether an external image or audio file was dropped
        onto the world canvas, turn it into an offscreen canvas or audio
        element and dispatch the

            droppedImage(canvas, name)
            droppedSVG(image, name)
            droppedAudio(audio, name)

        events to interested Morphs at the mouse pointer
    */
    var files = event instanceof FileList ? event
        : event.target.files || event.dataTransfer.files,
        file,
        url = event.dataTransfer ?
            event.dataTransfer.getData('URL') : null,
        txt = event.dataTransfer ?
            event.dataTransfer.getData('Text/HTML') : null,
        suffix,
        src,
        target = this.morphAtPointer(),
        img = new Image(),
        canvas,
        i;

    function readSVG(aFile) {
        var pic = new Image(),
            frd = new FileReader();
        while (!target.droppedSVG) {
            target = target.parent;
        }
        pic.onload = function () {
            target.droppedSVG(pic, aFile.name);
        };
        frd = new FileReader();
        frd.onloadend = function (e) {
            pic.src = e.target.result;
        };
        frd.readAsDataURL(aFile);
    }

    function readImage(aFile) {
        var pic = new Image(),
            frd = new FileReader();
        while (!target.droppedImage) {
            target = target.parent;
        }
        pic.onload = function () {
            canvas = newCanvas(new Point(pic.width, pic.height), true);
            canvas.getContext('2d').drawImage(pic, 0, 0);
            target.droppedImage(canvas, aFile.name);
        };
        frd = new FileReader();
        frd.onloadend = function (e) {
            pic.src = e.target.result;
        };
        frd.readAsDataURL(aFile);
    }

    function readAudio(aFile) {
        var snd = new Audio(),
            frd = new FileReader();
        while (!target.droppedAudio) {
            target = target.parent;
        }
        frd.onloadend = function (e) {
            snd.src = e.target.result;
            target.droppedAudio(snd, aFile.name);
        };
        frd.readAsDataURL(aFile);
    }

    function readText(aFile) {
        var frd = new FileReader();
        while (!target.droppedText) {
            target = target.parent;
        }
        frd.onloadend = function (e) {
            target.droppedText(e.target.result, aFile.name);
        };
        frd.readAsText(aFile);
    }

    function readBinary(aFile) {
        var frd = new FileReader();
        while (!target.droppedBinary) {
            target = target.parent;
        }
        frd.onloadend = function (e) {
            target.droppedBinary(e.target.result, aFile.name);
        };
        frd.readAsArrayBuffer(aFile);
    }

    function readURL(url, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', url);
        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                if (request.responseText) {
                    callback(request.responseText);
                } else {
                    throw new Error('unable to retrieve ' + url);
                }
            }
        };
        request.send();
    }

    function parseImgURL(html) {
        var iurl = '',
            idx,
            c,
            start = html.indexOf('<img src="');
        if (start === -1) {
            return null;
        }
        start += 10;
        for (idx = start; idx < html.length; idx += 1) {
            c = html[idx];
            if (c === '"') {
                return iurl;
            }
            iurl = iurl.concat(c);
        }
        return null;
    }

    if (files.length > 0) {
        for (i = 0; i < files.length; i += 1) {
            file = files[i];
            if (file.type.indexOf("svg") !== -1
                && !MorphicPreferences.rasterizeSVGs) {
                readSVG(file);
            } else if (file.type.indexOf("image") === 0) {
                readImage(file);
            } else if (file.type.indexOf("audio") === 0) {
                readAudio(file);
            } else if (file.type.indexOf("text") === 0) {
                readText(file);
            } else { // assume it's meant to be binary
                readBinary(file);
            }
        }
    } else if (url) {
        suffix = url.slice(url.lastIndexOf('.') + 1).toLowerCase();
        if (
            contains(
                ['gif', 'png', 'jpg', 'jpeg', 'bmp'],
                suffix
            )
        ) {
            while (!target.droppedImage) {
                target = target.parent;
            }
            img = new Image();
            img.onload = function () {
                canvas = newCanvas(new Point(img.width, img.height), true);
                canvas.getContext('2d').drawImage(img, 0, 0);
                target.droppedImage(canvas);
            };
            img.src = url;
        } else if (suffix === 'svg' && !MorphicPreferences.rasterizeSVGs) {
            while (!target.droppedSVG) {
                target = target.parent;
            }
            readURL(
                url,
                function (txt) {
                    var pic = new Image();
                    pic.onload = function () {
                        target.droppedSVG(
                            pic,
                            url.slice(
                                url.lastIndexOf('/') + 1,
                                url.lastIndexOf('.')
                            )
                        );
                    };
                    pic.src = 'data:image/svg+xml;utf8,' +
                        encodeURIComponent(txt);
                }
            );
        }
    } else if (txt) {
        while (!target.droppedImage) {
            target = target.parent;
        }
        img = new Image();
        img.onload = function () {
            canvas = newCanvas(new Point(img.width, img.height), true);
            canvas.getContext('2d').drawImage(img, 0, 0);
            target.droppedImage(canvas);
        };
        src = parseImgURL(txt);
        if (src) {
            img.src = src;
        }
    }
};

// HandMorph tools

HandMorph.prototype.destroyTemporaries = function () {
    /*
        temporaries are just an array of morphs which will be deleted upon
        the next mouse click, or whenever another temporary Morph decides
        that it needs to remove them. The primary purpose of temporaries is
        to display tools tips of speech bubble help.
    */
    var myself = this;
    this.temporaries.forEach(function (morph) {
        if (!(morph.isClickable
            && morph.bounds.containsPoint(myself.position()))) {
            morph.destroy();
            myself.temporaries.splice(myself.temporaries.indexOf(morph), 1);
        }
    });
};
