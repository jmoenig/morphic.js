// Nodes ///////////////////////////////////////////////////////////////

// Node instance creation:

function Node(parent, childrenArray) {
    this.init(parent || null, childrenArray || []);
}

Node.prototype.init = function (parent, childrenArray) {
    this.parent = parent || null;
    this.children = childrenArray || [];
};

// Node string representation: e.g. 'a Node[3]'

Node.prototype.toString = function () {
    return 'a Node' + '[' + this.children.length.toString() + ']';
};

// Node accessing:

Node.prototype.addChild = function (aNode) {
    this.children.push(aNode);
    aNode.parent = this;
};

Node.prototype.addChildFirst = function (aNode) {
    this.children.splice(0, null, aNode);
    aNode.parent = this;
};

Node.prototype.removeChild = function (aNode) {
    var idx = this.children.indexOf(aNode);
    if (idx !== -1) {
        this.children.splice(idx, 1);
    }
};

// Node functions:

Node.prototype.root = function () {
    if (this.parent === null) {
        return this;
    }
    return this.parent.root();
};

Node.prototype.depth = function () {
    if (this.parent === null) {
        return 0;
    }
    return this.parent.depth() + 1;
};

Node.prototype.allChildren = function () {
    // includes myself
    var result = [this];
    this.children.forEach(function (child) {
        result = result.concat(child.allChildren());
    });
    return result;
};

Node.prototype.forAllChildren = function (aFunction) {
    if (this.children.length > 0) {
        this.children.forEach(function (child) {
            child.forAllChildren(aFunction);
        });
    }
    aFunction.call(null, this);
};

Node.prototype.allLeafs = function () {
    var result = [];
    this.allChildren().forEach(function (element) {
        if (element.children.length === 0) {
            result.push(element);
        }
    });
    return result;
};

Node.prototype.allParents = function () {
    // includes myself
    var result = [this];
    if (this.parent !== null) {
        result = result.concat(this.parent.allParents());
    }
    return result;
};

Node.prototype.siblings = function () {
    var myself = this;
    if (this.parent === null) {
        return [];
    }
    return this.parent.children.filter(function (child) {
        return child !== myself;
    });
};

Node.prototype.parentThatIsA = function (constructor) {
    // including myself
    if (this instanceof constructor) {
        return this;
    }
    if (!this.parent) {
        return null;
    }
    return this.parent.parentThatIsA(constructor);
};

Node.prototype.parentThatIsAnyOf = function (constructors) {
    // including myself
    var yup = false,
        myself = this;
    constructors.forEach(function (each) {
        if (myself.constructor === each) {
            yup = true;
            return;
        }
    });
    if (yup) {
        return this;
    }
    if (!this.parent) {
        return null;
    }
    return this.parent.parentThatIsAnyOf(constructors);
};
