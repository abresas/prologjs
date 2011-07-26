exports = module.exports = Variable;

function Variable( name ) {
    this.name = name;
    this.type = "Variable";
}

Variable.prototype.print = function() {
    return "" + this.name;
}
