
/*
    Animations handle gradual transitions between one state and another over a
    period of time. Transition effects can be specified using easing functions.
    An easing function maps a fraction of the transition time to a fraction of
    the state delta. This way accelerating / decelerating and bouncing sliding
    effects can be accomplished.

    Animations are generic and not limited to motion, i.e. they can also handle
    other transitions such as color changes, transparency fadings, growing,
    shrinking, turning etc.

    Animations need to be stepped by a scheduler, e. g. an interval function.
    In Morphic the preferred way to run an animation is to register it with
    the World by adding it to the World's animation queue. The World steps each
    registered animation once per display cycle independently of the Morphic
    stepping mechanism.

    For an example how to use animations look at how the Morph's methods

        glideTo()
        fadeTo()

    and

        slideBackTo()

    are implemented.
*/

// Animation instance creation:

function Animation(setter, getter, delta, duration, easing, onComplete) {
    this.setter = setter; // function
    this.getter = getter; // function
    this.delta = delta || 0; // number
    this.duration = duration || 0; // milliseconds
    this.easing = isString(easing) ? // string or function
        this.easings[easing] || this.easings.sinusoidal
        : easing || this.easings.sinusoidal;
    this.onComplete = onComplete || null; // optional callback
    this.endTime = null;
    this.destination = null;
    this.isActive = false;
    this.start();
}

Animation.prototype.easings = {
    // dictionary of a few pre-defined easing functions used to transition
    // two states

    // ease both in and out:
    linear: function (t) {return t; },
    sinusoidal: function (t) {return 1 - Math.cos(radians(t * 90)); },
    quadratic: function (t) {
        return t < 0.5 ?
            2 * t * t
            : ((4 - (2 * t)) * t) - 1;
    },
    cubic: function (t) {
        return t < 0.5 ?
            4 * t * t * t
            : ((t - 1) * ((2 * t) - 2) * ((2 * t) - 2)) + 1;
    },
    elastic: function (t) {
        return (t -= 0.5) < 0 ?
            (0.01 + 0.01 / t) * Math.sin(50 * t)
            : (0.02 - 0.01 / t) * Math.sin(50 * t) + 1;
    },

    // ease in only:
    sine_in: function (t) {return 1 - Math.sin(radians(90 + (t * 90))); },
    quad_in: function (t) {return t * t; },
    cubic_in: function (t) {return t * t * t; },
    elastic_in: function (t) {
        return (0.04 - 0.04 / t) * Math.sin(25 * t) + 1;
    },

    // ease out only:
    sine_out: function (t) {return Math.sin(radians(t * 90)); },
    quad_out: function (t) {return t * (2 - t); },
    elastic_out: function (t) {return 0.04 * t / (--t) * Math.sin(25 * t); }
};

Animation.prototype.start = function () {
    // (re-) activate the animation, e.g. if is has previously completed,
    // make sure to plug it into something that repeatedly triggers step(),
    // e.g. the World's animations queue
    this.endTime = Date.now() + this.duration;
    this.destination = this.getter.call(this) + this.delta;
    this.isActive = true;
};

Animation.prototype.step = function () {
    if (!this.isActive) {return; }
    var now = Date.now();
    if (now > this.endTime) {
        this.setter(this.destination);
        this.isActive = false;
        if (this.onComplete) {this.onComplete(); }
    } else {
        this.setter(
            this.destination -
            (this.delta * this.easing((this.endTime - now) / this.duration))
        );
    }
};
