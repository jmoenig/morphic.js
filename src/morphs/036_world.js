// I represent the <canvas> element

// WorldMorph inherits from FrameMorph:

WorldMorph.prototype = new FrameMorph();
WorldMorph.prototype.constructor = WorldMorph;
WorldMorph.uber = FrameMorph.prototype;

// WorldMorph instance creation:

function WorldMorph(aCanvas, fillPage) {
    this.init(aCanvas, fillPage);
}

// WorldMorph initialization:

WorldMorph.prototype.init = function (aCanvas, fillPage) {
    WorldMorph.uber.init.call(this);
    this.color = new Color(205, 205, 205); // (130, 130, 130)
    this.alpha = 1;
    this.bounds = new Rectangle(0, 0, aCanvas.width, aCanvas.height);
    this.drawNew();
    this.isVisible = true;
    this.isDraggable = false;
    this.currentKey = null; // currently pressed key code
    this.worldCanvas = aCanvas;
    this.noticesTransparentClick = true;

    // additional properties:
    this.stamp = Date.now(); // reference in multi-world setups
    while (this.stamp === Date.now()) {
        nop();
    }
    this.stamp = Date.now();

    this.useFillPage = fillPage;
    if (this.useFillPage === undefined) {
        this.useFillPage = true;
    }
    this.isDevMode = false;
    this.broken = [];
    this.animations = [];
    this.hand = new HandMorph(this);
    this.keyboardReceiver = null;
    this.cursor = null;
    this.lastEditedText = null;
    this.activeMenu = null;
    this.activeHandle = null;
    this.virtualKeyboard = null;

    this.initEventListeners();
};

// World Morph display:

WorldMorph.prototype.brokenFor = function (aMorph) {
    // private
    var fb = aMorph.fullBounds();
    return this.broken.filter(function (rect) {
        return rect.intersects(fb);
    });
};

WorldMorph.prototype.fullDrawOn = function (aCanvas, aRect) {
    WorldMorph.uber.fullDrawOn.call(this, aCanvas, aRect);
    this.hand.fullDrawOn(aCanvas, aRect);
};

WorldMorph.prototype.updateBroken = function () {
    var myself = this;
    this.condenseDamages();
    this.broken.forEach(function (rect) {
        if (rect.extent().gt(new Point(0, 0))) {
            myself.fullDrawOn(myself.worldCanvas, rect);
        }
    });
    this.broken = [];
};

WorldMorph.prototype.stepAnimations = function () {
    this.animations.forEach(function (anim) {
        anim.step();
    });
    this.animations = this.animations.filter(function (anim) {
        return anim.isActive;
    });
};

WorldMorph.prototype.condenseDamages = function () {
    // collapse clustered damaged rectangles into their unions,
    // thereby reducing the array of brokens to a manageable size

    function condense(src) {
        var trgt = [], hit;
        src.forEach(function (rect) {
            hit = detect(
                trgt,
                function (each) {
                    return each.isNearTo(rect, 20);
                }
            );
            if (hit) {
                hit.mergeWith(rect);
            } else {
                trgt.push(rect);
            }
        });
        return trgt;
    }

    var again = true, size = this.broken.length;
    while (again) {
        this.broken = condense(this.broken);
        again = (this.broken.length < size);
        size = this.broken.length;
    }
};

WorldMorph.prototype.doOneCycle = function () {
    this.stepFrame();
    this.stepAnimations();
    this.updateBroken();
};

WorldMorph.prototype.fillPage = function () {
    var clientHeight = window.innerHeight,
        clientWidth = window.innerWidth,
        myself = this;

    this.worldCanvas.style.position = "absolute";
    this.worldCanvas.style.left = "0px";
    this.worldCanvas.style.right = "0px";
    this.worldCanvas.style.width = "100%";
    this.worldCanvas.style.height = "100%";

    if (document.documentElement.scrollTop) {
        // scrolled down b/c of viewport scaling
        clientHeight = document.documentElement.clientHeight;
    }
    if (document.documentElement.scrollLeft) {
        // scrolled left b/c of viewport scaling
        clientWidth = document.documentElement.clientWidth;
    }
    if (this.worldCanvas.width !== clientWidth) {
        this.worldCanvas.width = clientWidth;
        this.setWidth(clientWidth);
    }
    if (this.worldCanvas.height !== clientHeight) {
        this.worldCanvas.height = clientHeight;
        this.setHeight(clientHeight);
    }
    this.children.forEach(function (child) {
        if (child.reactToWorldResize) {
            child.reactToWorldResize(myself.bounds.copy());
        }
    });
};

// WorldMorph global pixel access:

WorldMorph.prototype.getGlobalPixelColor = function (point) {
    // answer the color at the given point.

    /*
        // original method, now deprecated as of 4/4/2017 because Chrome
        // "taints" the on-screen canvas as soon as its image data is
        // requested, significantly slowing down subsequent blittings

        var dta = this.worldCanvas.getContext('2d').getImageData(
            point.x,
            point.y,
            1,
            1
        ).data;
        return new Color(dta[0], dta[1], dta[2]);
    */

    var clr = this.hand.morphAtPointer().getPixelColor(this.hand.position());
    // IMPORTANT:
    // all callers of getGlobalPixelColor should make provisions for retina
    // display support, which gets null-pixels interlaced with non-null ones:
    // if (!clr.a) {/* ignore */ }
    return clr;
};

// WorldMorph events:

WorldMorph.prototype.initVirtualKeyboard = function () {
    var myself = this;

    if (this.virtualKeyboard) {
        document.body.removeChild(this.virtualKeyboard);
        this.virtualKeyboard = null;
    }
    if (!MorphicPreferences.isTouchDevice
        || !MorphicPreferences.useVirtualKeyboard) {
        return;
    }
    this.virtualKeyboard = document.createElement("input");
    this.virtualKeyboard.type = "text";
    this.virtualKeyboard.style.color = "transparent";
    this.virtualKeyboard.style.backgroundColor = "transparent";
    this.virtualKeyboard.style.border = "none";
    this.virtualKeyboard.style.outline = "none";
    this.virtualKeyboard.style.position = "absolute";
    this.virtualKeyboard.style.top = "0px";
    this.virtualKeyboard.style.left = "0px";
    this.virtualKeyboard.style.width = "0px";
    this.virtualKeyboard.style.height = "0px";
    this.virtualKeyboard.autocapitalize = "none"; // iOS specific
    document.body.appendChild(this.virtualKeyboard);

    this.virtualKeyboard.addEventListener(
        "keydown",
        function (event) {
            // remember the keyCode in the world's currentKey property
            myself.currentKey = event.keyCode;
            if (myself.keyboardReceiver) {
                myself.keyboardReceiver.processKeyDown(event);
            }
            // supress backspace override
            if (event.keyCode === 8) {
                event.preventDefault();
            }
            // supress tab override and make sure tab gets
            // received by all browsers
            if (event.keyCode === 9) {
                if (myself.keyboardReceiver) {
                    myself.keyboardReceiver.processKeyPress(event);
                }
                event.preventDefault();
            }
        },
        false
    );

    this.virtualKeyboard.addEventListener(
        "keyup",
        function (event) {
            // flush the world's currentKey property
            myself.currentKey = null;
            // dispatch to keyboard receiver
            if (myself.keyboardReceiver) {
                if (myself.keyboardReceiver.processKeyUp) {
                    myself.keyboardReceiver.processKeyUp(event);
                }
            }
            event.preventDefault();
        },
        false
    );

    this.virtualKeyboard.addEventListener(
        "keypress",
        function (event) {
            if (myself.keyboardReceiver) {
                myself.keyboardReceiver.processKeyPress(event);
            }
            event.preventDefault();
        },
        false
    );
};

WorldMorph.prototype.initEventListeners = function () {
    var canvas = this.worldCanvas, myself = this;

    if (myself.useFillPage) {
        myself.fillPage();
    } else {
        this.changed();
    }

    canvas.addEventListener(
        "mousedown",
        function (event) {
            event.preventDefault();
            canvas.focus();
            myself.hand.processMouseDown(event);
        },
        false
    );

    canvas.addEventListener(
        "touchstart",
        function (event) {
            myself.hand.processTouchStart(event);
        },
        false
    );

    canvas.addEventListener(
        "mouseup",
        function (event) {
            event.preventDefault();
            myself.hand.processMouseUp(event);
        },
        false
    );

    canvas.addEventListener(
        "dblclick",
        function (event) {
            event.preventDefault();
            myself.hand.processDoubleClick(event);
        },
        false
    );

    canvas.addEventListener(
        "touchend",
        function (event) {
            myself.hand.processTouchEnd(event);
        },
        false
    );

    canvas.addEventListener(
        "mousemove",
        function (event) {
            myself.hand.processMouseMove(event);
        },
        false
    );

    canvas.addEventListener(
        "touchmove",
        function (event) {
            myself.hand.processTouchMove(event);
        },
        false
    );

    canvas.addEventListener(
        "contextmenu",
        function (event) {
            // suppress context menu for Mac-Firefox
            event.preventDefault();
        },
        false
    );

    canvas.addEventListener(
        "keydown",
        function (event) {
            // remember the keyCode in the world's currentKey property
            myself.currentKey = event.keyCode;
            if (myself.keyboardReceiver) {
                myself.keyboardReceiver.processKeyDown(event);
            }
            // supress backspace override
            if (event.keyCode === 8) {
                event.preventDefault();
            }
            // supress tab override and make sure tab gets
            // received by all browsers
            if (event.keyCode === 9) {
                if (myself.keyboardReceiver) {
                    myself.keyboardReceiver.processKeyPress(event);
                }
                event.preventDefault();
            }
            if ((event.ctrlKey && (!event.altKey) || event.metaKey) &&
                (event.keyCode !== 86)) { // allow pasting-in
                event.preventDefault();
            }
        },
        false
    );

    canvas.addEventListener(
        "keyup",
        function (event) {
            // flush the world's currentKey property
            myself.currentKey = null;
            // dispatch to keyboard receiver
            if (myself.keyboardReceiver) {
                if (myself.keyboardReceiver.processKeyUp) {
                    myself.keyboardReceiver.processKeyUp(event);
                }
            }
            event.preventDefault();
        },
        false
    );

    canvas.addEventListener(
        "keypress",
        function (event) {
            if (myself.keyboardReceiver) {
                myself.keyboardReceiver.processKeyPress(event);
            }
            event.preventDefault();
        },
        false
    );

    canvas.addEventListener( // Safari, Chrome
        "mousewheel",
        function (event) {
            myself.hand.processMouseScroll(event);
            event.preventDefault();
        },
        false
    );
    canvas.addEventListener( // Firefox
        "DOMMouseScroll",
        function (event) {
            myself.hand.processMouseScroll(event);
            event.preventDefault();
        },
        false
    );

    document.body.addEventListener(
        "paste",
        function (event) {
            var txt = event.clipboardData.getData("Text");
            if (txt && myself.cursor) {
                myself.cursor.insert(txt);
            }
        },
        false
    );

    window.addEventListener(
        "dragover",
        function (event) {
            event.preventDefault();
        },
        false
    );
    window.addEventListener(
        "drop",
        function (event) {
            myself.hand.processDrop(event);
            event.preventDefault();
        },
        false
    );

    window.addEventListener(
        "resize",
        function () {
            if (myself.useFillPage) {
                myself.fillPage();
            }
        },
        false
    );

    window.onbeforeunload = function (evt) {
        var e = evt || window.event,
            msg = "Are you sure you want to leave?";
        // For IE and Firefox
        if (e) {
            e.returnValue = msg;
        }
        // For Safari / chrome
        return msg;
    };
};

WorldMorph.prototype.mouseDownLeft = nop;

WorldMorph.prototype.mouseClickLeft = nop;

WorldMorph.prototype.mouseDownRight = nop;

WorldMorph.prototype.mouseClickRight = nop;

WorldMorph.prototype.wantsDropOf = function () {
    // allow handle drops if any drops are allowed
    return this.acceptsDrops;
};

WorldMorph.prototype.droppedImage = function () {
    return null;
};

WorldMorph.prototype.droppedSVG = function () {
    return null;
};

// WorldMorph text field tabbing:

WorldMorph.prototype.nextTab = function (editField) {
    var next = this.nextEntryField(editField);
    if (next) {
        editField.clearSelection();
        next.selectAll();
        next.edit();
    }
};

WorldMorph.prototype.previousTab = function (editField) {
    var prev = this.previousEntryField(editField);
    if (prev) {
        editField.clearSelection();
        prev.selectAll();
        prev.edit();
    }
};

// WorldMorph menu:

WorldMorph.prototype.contextMenu = function () {
    var menu;

    if (this.isDevMode) {
        menu = new MenuMorph(this, this.constructor.name ||
            this.constructor.toString().split(' ')[1].split('(')[0]);
    } else {
        menu = new MenuMorph(this, 'Morphic');
    }
    if (this.isDevMode) {
        menu.addItem("demo...", 'userCreateMorph', 'sample morphs');
        menu.addLine();
        menu.addItem("hide all...", 'hideAll');
        menu.addItem("show all...", 'showAllHiddens');
        menu.addItem(
            "move all inside...",
            'keepAllSubmorphsWithin',
            'keep all submorphs\nwithin and visible'
        );
        menu.addItem(
            "inspect...",
            'inspect',
            'open a window on\nall properties'
        );
        menu.addItem(
            "screenshot...",
            function () {
                window.open(this.fullImageClassic().toDataURL());
            },
            'open a new window\nwith a picture of this morph.jsk'
        );
        menu.addLine();
        menu.addItem(
            "restore display",
            'changed',
            'redraw the\nscreen once'
        );
        menu.addItem(
            "fill page...",
            'fillPage',
            'let the World automatically\nadjust to browser resizing'
        );
        if (useBlurredShadows) {
            menu.addItem(
                "sharp shadows...",
                'toggleBlurredShadows',
                'sharp drop shadows\nuse for old browsers'
            );
        } else {
            menu.addItem(
                "blurred shadows...",
                'toggleBlurredShadows',
                'blurry shades,\n use for new browsers'
            );
        }
        menu.addItem(
            "color...",
            function () {
                this.pickColor(
                    menu.title + localize('\ncolor:'),
                    this.setColor,
                    this,
                    this.color
                );
            },
            'choose the World\'s\nbackground color'
        );
        if (MorphicPreferences === standardSettings) {
            menu.addItem(
                "touch screen settings",
                'togglePreferences',
                'bigger menu fonts\nand sliders'
            );
        } else {
            menu.addItem(
                "standard settings",
                'togglePreferences',
                'smaller menu fonts\nand sliders'
            );
        }
        menu.addLine();
    }
    if (this.isDevMode) {
        menu.addItem(
            "user mode...",
            'toggleDevMode',
            'disable developers\'\ncontext menus'
        );
    } else {
        menu.addItem("development mode...", 'toggleDevMode');
    }
    menu.addItem("about morphic.js...", 'about');
    return menu;
};

WorldMorph.prototype.userCreateMorph = function () {
    var myself = this, menu, newMorph;

    function create(aMorph) {
        aMorph.isDraggable = true;
        aMorph.pickUp(myself);
    }

    menu = new MenuMorph(this, 'make a morph.jsk');
    menu.addItem('rectangle', function () {
        create(new Morph());
    });
    menu.addItem('box', function () {
        create(new BoxMorph());
    });
    menu.addItem('circle box', function () {
        create(new CircleBoxMorph());
    });
    menu.addLine();
    menu.addItem('slider', function () {
        create(new SliderMorph());
    });
    menu.addItem('dial', function () {
        newMorph = new DialMorph();
        newMorph.pickUp(this);
    });
    menu.addItem('frame', function () {
        newMorph = new FrameMorph();
        newMorph.setExtent(new Point(350, 250));
        create(newMorph);
    });
    menu.addItem('scroll frame', function () {
        newMorph = new ScrollFrameMorph();
        newMorph.contents.acceptsDrops = true;
        newMorph.contents.adjustBounds();
        newMorph.setExtent(new Point(350, 250));
        create(newMorph);
    });
    menu.addItem('handle', function () {
        create(new HandleMorph());
    });
    menu.addLine();
    menu.addItem('string', function () {
        newMorph = new StringMorph('Hello, World!');
        newMorph.isEditable = true;
        create(newMorph);
    });
    menu.addItem('text', function () {
        newMorph = new TextMorph(
            "Ich wei\u00DF nicht, was soll es bedeuten, dass ich so " +
            "traurig bin, ein M\u00E4rchen aus uralten Zeiten, das " +
            "kommt mir nicht aus dem Sinn. Die Luft ist k\u00FChl " +
            "und es dunkelt, und ruhig flie\u00DFt der Rhein; der " +
            "Gipfel des Berges funkelt im Abendsonnenschein. " +
            "Die sch\u00F6nste Jungfrau sitzet dort oben wunderbar, " +
            "ihr gold'nes Geschmeide blitzet, sie k\u00E4mmt ihr " +
            "goldenes Haar, sie k\u00E4mmt es mit goldenem Kamme, " +
            "und singt ein Lied dabei; das hat eine wundersame, " +
            "gewalt'ge Melodei. Den Schiffer im kleinen " +
            "Schiffe, ergreift es mit wildem Weh; er schaut " +
            "nicht die Felsenriffe, er schaut nur hinauf in " +
            "die H\u00F6h'. Ich glaube, die Wellen verschlingen " +
            "am Ende Schiffer und Kahn, und das hat mit ihrem " +
            "Singen, die Loreley getan."
        );
        newMorph.isEditable = true;
        newMorph.maxWidth = 300;
        newMorph.drawNew();
        create(newMorph);
    });
    menu.addItem('speech bubble', function () {
        newMorph = new SpeechBubbleMorph('Hello, World!');
        create(newMorph);
    });
    menu.addLine();
    menu.addItem('gray scale palette', function () {
        create(new GrayPaletteMorph());
    });
    menu.addItem('color palette', function () {
        create(new ColorPaletteMorph());
    });
    menu.addItem('color picker', function () {
        create(new ColorPickerMorph());
    });
    menu.addLine();
    menu.addItem('sensor demo', function () {
        newMorph = new MouseSensorMorph();
        newMorph.setColor(new Color(230, 200, 100));
        newMorph.edge = 35;
        newMorph.border = 15;
        newMorph.borderColor = new Color(200, 100, 50);
        newMorph.alpha = 0.2;
        newMorph.setExtent(new Point(100, 100));
        create(newMorph);
    });
    menu.addItem('animation demo', function () {
        var foo, bar, baz, garply, fred;

        foo = new BouncerMorph();
        foo.setPosition(new Point(50, 20));
        foo.setExtent(new Point(300, 200));
        foo.alpha = 0.9;
        foo.speed = 3;

        bar = new BouncerMorph();
        bar.setColor(new Color(50, 50, 50));
        bar.setPosition(new Point(80, 80));
        bar.setExtent(new Point(80, 250));
        bar.type = 'horizontal';
        bar.direction = 'right';
        bar.alpha = 0.9;
        bar.speed = 5;

        baz = new BouncerMorph();
        baz.setColor(new Color(20, 20, 20));
        baz.setPosition(new Point(90, 140));
        baz.setExtent(new Point(40, 30));
        baz.type = 'horizontal';
        baz.direction = 'right';
        baz.speed = 3;

        garply = new BouncerMorph();
        garply.setColor(new Color(200, 20, 20));
        garply.setPosition(new Point(90, 140));
        garply.setExtent(new Point(20, 20));
        garply.type = 'vertical';
        garply.direction = 'up';
        garply.speed = 8;

        fred = new BouncerMorph();
        fred.setColor(new Color(20, 200, 20));
        fred.setPosition(new Point(120, 140));
        fred.setExtent(new Point(20, 20));
        fred.type = 'vertical';
        fred.direction = 'down';
        fred.speed = 4;

        bar.add(garply);
        bar.add(baz);
        foo.add(fred);
        foo.add(bar);

        create(foo);
    });
    menu.addItem('pen', function () {
        create(new PenMorph());
    });
    if (myself.customMorphs) {
        menu.addLine();
        myself.customMorphs().forEach(function (morph) {
            menu.addItem(morph.toString(), function () {
                create(morph);
            });
        });
    }
    menu.popUpAtHand(this);
};

WorldMorph.prototype.toggleDevMode = function () {
    this.isDevMode = !this.isDevMode;
};

WorldMorph.prototype.hideAll = function () {
    this.children.forEach(function (child) {
        child.hide();
    });
};

WorldMorph.prototype.showAllHiddens = function () {
    this.forAllChildren(function (child) {
        if (!child.isVisible) {
            child.show();
        }
    });
};

WorldMorph.prototype.about = function () {
    var versions = '', module;

    for (module in modules) {
        if (Object.prototype.hasOwnProperty.call(modules, module)) {
            versions += ('\n' + module + ' (' + modules[module] + ')');
        }
    }
    if (versions !== '') {
        versions = '\n\nmodules:\n\n' +
            'morphic (' + morphicVersion + ')' +
            versions;
    }

    this.inform(
        'morphic.js\n\n' +
        'a lively Web GUI\ninspired by Squeak\n' +
        morphicVersion +
        '\n\nwritten by Jens M\u00F6nig\njens@moenig.org' +
        versions
    );
};

WorldMorph.prototype.edit = function (aStringOrTextMorph) {
    var pos = getDocumentPositionOf(this.worldCanvas);

    if (!aStringOrTextMorph.isEditable) {
        return null;
    }
    if (this.cursor) {
        this.cursor.destroy();
    }
    this.cursor = new CursorMorph(aStringOrTextMorph);
    aStringOrTextMorph.parent.add(this.cursor);
    this.keyboardReceiver = this.cursor;

    this.initVirtualKeyboard();
    if (MorphicPreferences.isTouchDevice
        && MorphicPreferences.useVirtualKeyboard) {
        this.virtualKeyboard.style.top = this.cursor.top() + pos.y + "px";
        this.virtualKeyboard.style.left = this.cursor.left() + pos.x + "px";
        this.virtualKeyboard.focus();
    }

    if (MorphicPreferences.useSliderForInput) {
        if (!aStringOrTextMorph.parentThatIsA(MenuMorph)) {
            this.slide(aStringOrTextMorph);
        }
    }

    if (this.lastEditedText !== aStringOrTextMorph) {
        aStringOrTextMorph.escalateEvent('freshTextEdit', aStringOrTextMorph);
    }
    this.lastEditedText = aStringOrTextMorph;
};

WorldMorph.prototype.slide = function (aStringOrTextMorph) {
    // display a slider for numeric text entries
    var val = parseFloat(aStringOrTextMorph.text),
        menu,
        slider;

    if (isNaN(val)) {
        val = 0;
    }
    menu = new MenuMorph();
    slider = new SliderMorph(
        val - 25,
        val + 25,
        val,
        10,
        'horizontal'
    );
    slider.alpha = 1;
    slider.color = new Color(225, 225, 225);
    slider.button.color = menu.borderColor;
    slider.button.highlightColor = slider.button.color.copy();
    slider.button.highlightColor.b += 100;
    slider.button.pressColor = slider.button.color.copy();
    slider.button.pressColor.b += 150;
    slider.silentSetHeight(MorphicPreferences.scrollBarSize);
    slider.silentSetWidth(MorphicPreferences.menuFontSize * 10);
    slider.drawNew();
    slider.action = function (num) {
        aStringOrTextMorph.changed();
        aStringOrTextMorph.text = Math.round(num).toString();
        aStringOrTextMorph.drawNew();
        aStringOrTextMorph.changed();
        aStringOrTextMorph.escalateEvent(
            'reactToSliderEdit',
            aStringOrTextMorph
        );
    };
    menu.items.push(slider);
    menu.popup(this, aStringOrTextMorph.bottomLeft().add(new Point(0, 5)));
};

WorldMorph.prototype.stopEditing = function () {
    if (this.cursor) {
        this.cursor.target.escalateEvent('reactToEdit', this.cursor.target);
        this.cursor.target.clearSelection();
        this.cursor.destroy();
        this.cursor = null;
    }
    if (this.keyboardReceiver && this.keyboardReceiver.stopEditing) {
        this.keyboardReceiver.stopEditing();
    }
    this.keyboardReceiver = null;
    if (this.virtualKeyboard) {
        this.virtualKeyboard.blur();
        document.body.removeChild(this.virtualKeyboard);
        this.virtualKeyboard = null;
    }
    this.lastEditedText = null;
    this.worldCanvas.focus();
};

WorldMorph.prototype.toggleBlurredShadows = function () {
    useBlurredShadows = !useBlurredShadows;
};

WorldMorph.prototype.togglePreferences = function () {
    if (MorphicPreferences === standardSettings) {
        MorphicPreferences = touchScreenSettings;
    } else {
        MorphicPreferences = standardSettings;
    }
};
