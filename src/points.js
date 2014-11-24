// Points //////////////////////////////////////////////////////////////

// Point instance creation:

function Point(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

// Point string representation: e.g. '12@68'

Point.prototype.toString = function () {
    return Math.round(this.x.toString()) +
        '@' + Math.round(this.y.toString());
};

// Point copying:

Point.prototype.copy = function () {
    return new Point(this.x, this.y);
};

// Point comparison:

Point.prototype.eq = function (aPoint) {
    // ==
    return this.x === aPoint.x && this.y === aPoint.y;
};

Point.prototype.lt = function (aPoint) {
    // <
    return this.x < aPoint.x && this.y < aPoint.y;
};

Point.prototype.gt = function (aPoint) {
    // >
    return this.x > aPoint.x && this.y > aPoint.y;
};

Point.prototype.ge = function (aPoint) {
    // >=
    return this.x >= aPoint.x && this.y >= aPoint.y;
};

Point.prototype.le = function (aPoint) {
    // <=
    return this.x <= aPoint.x && this.y <= aPoint.y;
};

Point.prototype.max = function (aPoint) {
    return new Point(Math.max(this.x, aPoint.x),
        Math.max(this.y, aPoint.y));
};

Point.prototype.min = function (aPoint) {
    return new Point(Math.min(this.x, aPoint.x),
        Math.min(this.y, aPoint.y));
};

// Point conversion:

Point.prototype.round = function () {
    return new Point(Math.round(this.x), Math.round(this.y));
};

Point.prototype.abs = function () {
    return new Point(Math.abs(this.x), Math.abs(this.y));
};

Point.prototype.neg = function () {
    return new Point(-this.x, -this.y);
};

Point.prototype.mirror = function () {
    return new Point(this.y, this.x);
};

Point.prototype.floor = function () {
    return new Point(
        Math.max(Math.floor(this.x), 0),
        Math.max(Math.floor(this.y), 0)
    );
};

Point.prototype.ceil = function () {
    return new Point(Math.ceil(this.x), Math.ceil(this.y));
};

// Point arithmetic:

Point.prototype.add = function (other) {
    if (other instanceof Point) {
        return new Point(this.x + other.x, this.y + other.y);
    }
    return new Point(this.x + other, this.y + other);
};

Point.prototype.subtract = function (other) {
    if (other instanceof Point) {
        return new Point(this.x - other.x, this.y - other.y);
    }
    return new Point(this.x - other, this.y - other);
};

Point.prototype.multiplyBy = function (other) {
    if (other instanceof Point) {
        return new Point(this.x * other.x, this.y * other.y);
    }
    return new Point(this.x * other, this.y * other);
};

Point.prototype.divideBy = function (other) {
    if (other instanceof Point) {
        return new Point(this.x / other.x, this.y / other.y);
    }
    return new Point(this.x / other, this.y / other);
};

Point.prototype.floorDivideBy = function (other) {
    if (other instanceof Point) {
        return new Point(Math.floor(this.x / other.x),
            Math.floor(this.y / other.y));
    }
    return new Point(Math.floor(this.x / other),
        Math.floor(this.y / other));
};

// Point polar coordinates:

Point.prototype.r = function () {
    var t = (this.multiplyBy(this));
    return Math.sqrt(t.x + t.y);
};

Point.prototype.degrees = function () {
/*
    answer the angle I make with origin in degrees.
    Right is 0, down is 90
*/
    var tan, theta;

    if (this.x === 0) {
        if (this.y >= 0) {
            return 90;
        }
        return 270;
    }
    tan = this.y / this.x;
    theta = Math.atan(tan);
    if (this.x >= 0) {
        if (this.y >= 0) {
            return degrees(theta);
        }
        return 360 + (degrees(theta));
    }
    return 180 + degrees(theta);
};

Point.prototype.theta = function () {
/*
    answer the angle I make with origin in radians.
    Right is 0, down is 90
*/
    var tan, theta;

    if (this.x === 0) {
        if (this.y >= 0) {
            return radians(90);
        }
        return radians(270);
    }
    tan = this.y / this.x;
    theta = Math.atan(tan);
    if (this.x >= 0) {
        if (this.y >= 0) {
            return theta;
        }
        return radians(360) + theta;
    }
    return radians(180) + theta;
};

// Point functions:

Point.prototype.crossProduct = function (aPoint) {
    return this.multiplyBy(aPoint.mirror());
};

Point.prototype.distanceTo = function (aPoint) {
    return (aPoint.subtract(this)).r();
};

Point.prototype.rotate = function (direction, center) {
    // direction must be 'right', 'left' or 'pi'
    var offset = this.subtract(center);
    if (direction === 'right') {
        return new Point(-offset.y, offset.y).add(center);
    }
    if (direction === 'left') {
        return new Point(offset.y, -offset.y).add(center);
    }
    // direction === 'pi'
    return center.subtract(offset);
};

Point.prototype.flip = function (direction, center) {
    // direction must be 'vertical' or 'horizontal'
    if (direction === 'vertical') {
        return new Point(this.x, center.y * 2 - this.y);
    }
    // direction === 'horizontal'
    return new Point(center.x * 2 - this.x, this.y);
};

Point.prototype.distanceAngle = function (dist, angle) {
    var deg = angle, x, y;
    if (deg > 270) {
        deg = deg - 360;
    } else if (deg < -270) {
        deg = deg + 360;
    }
    if (-90 <= deg && deg <= 90) {
        x = Math.sin(radians(deg)) * dist;
        y = Math.sqrt((dist * dist) - (x * x));
        return new Point(x + this.x, this.y - y);
    }
    x = Math.sin(radians(180 - deg)) * dist;
    y = Math.sqrt((dist * dist) - (x * x));
    return new Point(x + this.x, this.y + y);
};

// Point transforming:

Point.prototype.scaleBy = function (scalePoint) {
    return this.multiplyBy(scalePoint);
};

Point.prototype.translateBy = function (deltaPoint) {
    return this.add(deltaPoint);
};

Point.prototype.rotateBy = function (angle, centerPoint) {
    var center = centerPoint || new Point(0, 0),
        p = this.subtract(center),
        r = p.r(),
        theta = angle - p.theta();
    return new Point(
        center.x + (r * Math.cos(theta)),
        center.y - (r * Math.sin(theta))
    );
};

// Point conversion:

Point.prototype.asArray = function () {
    return [this.x, this.y];
};
