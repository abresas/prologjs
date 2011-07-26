exports = module.exports = Term;

function Term( head, list, exclude ) {
    this.name = head;
    this.type = "Term";
    this.exclude = exclude;

    this.partlist = list.slice();
    this.partlist.stringify = function() {
        var i, str = "";
        for ( i = 0; i < this.length; i++ ) {
            str += this[ i ];
            if ( i < this.length - 1 ) {
                str += ", ";
            }
        }

        return str;
    };
}

Term.prototype.toString = function() {
    var str = "";
    if ( this.name == "cons" ) {
        var x = this;
        while ( x.type == "Term" && x.name == "cons" && x.partlist.length == 2 ) {
            x = x.partlist[ 1 ];
        }
        if ( ( x.type == "Atom" && x.name == "nil" ) || x.type == "Variable" ) {
            x = this;
            str += "[";
            var com = false;
            while ( x.type == "Term" && x.name == "cons" && x.partlist.length == 2 ) {
                if ( com ) {
                    str += ", ";
                }
                str += x.partlist[ 0 ];
                x = x.partlist[ 1 ];
            }
            if ( x.type == "Variable" ) {
                str += " | " + x;
            }
            return str + "]";
        }
    }

    return this.name + "(" + this.partlist.stringify() + ")";
};
