// Color instance creation:

function Color(r, g, b, a) {
    // all values are optional, just (r, g, b) is fine
    this.r = r || 0;
    this.g = g || 0;
    this.b = b || 0;
    this.a = a || ((a === 0) ? 0 : 1);
}

// Color string representation: e.g. 'rgba(255,165,0,1)'

Color.prototype.toString = function () {
    return 'rgba(' +
        Math.round(this.r) + ',' +
        Math.round(this.g) + ',' +
        Math.round(this.b) + ',' +
        this.a + ')';
};

Color.prototype.toRGBstring = function () {
    return 'rgb(' +
        Math.round(this.r) + ',' +
        Math.round(this.g) + ',' +
        Math.round(this.b) + ')';
};

Color.fromString = function (aString) {
    // I parse rgb/rgba strings into a Color object
    var components = aString.split(/[\(),]/).slice(1, 5);
    return new Color(components[0], components[1], components[2], components[3]);
};

// Color copying:

Color.prototype.copy = function () {
    return new Color(
        this.r,
        this.g,
        this.b,
        this.a
    );
};

// Color comparison:

Color.prototype.eq = function (aColor) {
    // ==
    return aColor &&
        this.r === aColor.r &&
        this.g === aColor.g &&
        this.b === aColor.b;
};

// Color conversion (hsv):

Color.prototype.hsv = function () {
    // ignore alpha
    var max, min, h, s, v, d,
        rr = this.r / 255,
        gg = this.g / 255,
        bb = this.b / 255;
    max = Math.max(rr, gg, bb);
    min = Math.min(rr, gg, bb);
    h = max;
    s = max;
    v = max;
    d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0;
    } else {
        switch (max) {
            case rr:
                h = (gg - bb) / d + (gg < bb ? 6 : 0);
                break;
            case gg:
                h = (bb - rr) / d + 2;
                break;
            case bb:
                h = (rr - gg) / d + 4;
                break;
        }
        h /= 6;
    }
    return [h, s, v];
};

Color.prototype.set_hsv = function (h, s, v) {
    // ignore alpha, h, s and v are to be within [0, 1]
    var i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            this.r = v;
            this.g = t;
            this.b = p;
            break;
        case 1:
            this.r = q;
            this.g = v;
            this.b = p;
            break;
        case 2:
            this.r = p;
            this.g = v;
            this.b = t;
            break;
        case 3:
            this.r = p;
            this.g = q;
            this.b = v;
            break;
        case 4:
            this.r = t;
            this.g = p;
            this.b = v;
            break;
        case 5:
            this.r = v;
            this.g = p;
            this.b = q;
            break;
    }

    this.r *= 255;
    this.g *= 255;
    this.b *= 255;

};

// Color mixing:

Color.prototype.mixed = function (proportion, otherColor) {
    // answer a copy of this color mixed with another color, ignore alpha
    var frac1 = Math.min(Math.max(proportion, 0), 1),
        frac2 = 1 - frac1;
    return new Color(
        this.r * frac1 + otherColor.r * frac2,
        this.g * frac1 + otherColor.g * frac2,
        this.b * frac1 + otherColor.b * frac2
    );
};

Color.prototype.darker = function (percent) {
    // return an rgb-interpolated darker copy of me, ignore alpha
    var fract = 0.8333;
    if (percent) {
        fract = (100 - percent) / 100;
    }
    return this.mixed(fract, new Color(0, 0, 0));
};

Color.prototype.lighter = function (percent) {
    // return an rgb-interpolated lighter copy of me, ignore alpha
    var fract = 0.8333;
    if (percent) {
        fract = (100 - percent) / 100;
    }
    return this.mixed(fract, new Color(255, 255, 255));
};

Color.prototype.dansDarker = function () {
    // return an hsv-interpolated darker copy of me, ignore alpha
    var hsv = this.hsv(),
        result = new Color(),
        vv = Math.max(hsv[2] - 0.16, 0);
    result.set_hsv(hsv[0], hsv[1], vv);
    return result;
};

Color.prototype.inverted = function () {
    return new Color(
        255 - this.r,
        255 - this.g,
        255 - this.b
    );
};
