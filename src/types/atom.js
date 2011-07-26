exports = module.exports = Atom;

function Atom( name ) {
    this.name = name;
    this.type = "Atom";
}

Atom.prototype.toString = function () { 
    return "" + this.name;
};
