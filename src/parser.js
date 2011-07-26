var Body = require( './types/body' ),
    Rule = require( './types/rule' ),
    Term = require( './types/term' ),
    Atom = require( './types/atom' ),
    Variable = require( './types/variable' ),
    Tokenizer = require( './tokenizer' );

exports = module.exports = parser = {};

parser.getBody = function( tokenizer ) {
    if ( typeof tokenizer == 'string' ) {
        tokenizer = new Tokenizer( tokenizer ); // got body as a string
    }

    var term, list = [], string = tokenizer.remainder;

    while ( ( term = parser.getTerm( tokenizer ) ) !== null ) {
        list.push( term );
        if ( tokenizer.current != "," ) { 
            break;
        }
        tokenizer.consume();
    }

    if ( !list.length ) {
        throw 'Failed to parse body: "' + string + '".';
    }

    return new Body( list );
};

parser.getRule = function( ruleString ) {
    var tokenizer = new Tokenizer( ruleString ),
        head = parser.getTerm( tokenizer ),
        body;

    if ( tokenizer.current == ':-' ) {
        tokenizer.consume();
        body = this.getBody( tokenizer );
        
        if ( tokenizer.current != '.' ) {
            throw 'error parsing rule "' + ruleString + '". expected "." after body, got: "' + tokenizer.current + '"';
        }
    }
    else if ( tokenizer.current == '.' ) {
        // simple rule
        body = null;
    }
    else {
        throw 'error parsing rule "' + ruleString + '". expected "." or ":-", got: "' + tokenizer.current + '"';
    }

    return new Rule( head, body );
};

// parse term of the form id( param1, param2, ... )
parser.getTerm = function( tokenizer ) {
    if ( tokenizer.type == "punc" && tokenizer.current == "!" ) {
        tokenizer.consume();
        return new Term( "cut", [] );
    }

    var negative = false;
    if ( tokenizer.type == 'punc' && tokenizer.current == '\\+' ) {
        tokenizer.consume();
        negative = true;
    }

    var notthis = false;
    if ( tokenizer.current == "NOTTHIS" ) {
        notthis = true;
        tokenizer.consume();
    }

    if ( tokenizer.type != "id" ) {
        return null;
    }

    var name = tokenizer.current;
    tokenizer.consume();

    if ( tokenizer.current != "(" ) {
        // fail shorthand for fail(), ie, fail/0
        if (name == "fail") {
            return new Term(name, []);
        }
        return null;
    }

    tokenizer.consume();
    var parts = [];
    while ( tokenizer.current != ")" ) {
        if ( tokenizer.type == "eof" ) {
            return null;
        }

        var part = parser.getParameters( tokenizer );
        if ( !part ) {
            return null;
        }

        if ( tokenizer.current == "," ) {
            tokenizer.consume();
        }
        else if ( tokenizer.current != ")" ) {
            return null;
        }

        parts.push( part );
    }

    tokenizer.consume();

   var t = new Term( name, parts, notthis );
   if ( negative ) {
       t.negative = true;
   }
   return t;
};

parser.getVariable = function( tokenizer ) {
    var name = tokenizer.current;
    tokenizer.consume();
    return new Variable( name );
};

parser.getList = function( tokenizer ) {
    if ( tokenizer.current != "[" ) {
        return null;
    }

    tokenizer.consume();

    // special case, [] = new atom( nil )
    
    if ( tokenizer.type == "punc" && tokenizer.current == "]" ) {
        tokenizer.consume();
        return new Atom( "nil" );
    }

    var l = [], i = 0;

    while ( true ) {
        var t = parser.getParameters( tokenizer );
        if ( !t ) {
            return null;
        }

        l[ i++ ] = t;
        if ( tokenizer.current != "," ) {
            break;
        }
        tokenizer.consume();
    }

    var append;
    if ( tokenizer.current == "|" ) {
        tokenizer.consume();
        if ( tokenizer.type != "var" ) {
            return null;
        }
        append = new Variable( tokenizer.current );
        tokenizer.consume();
    } 
    else {
        append = new Atom( "nil" );
    }
    if ( tokenizer.current != "]" ) {
        return null;
    }
    tokenizer.consume();

    for ( --i; i >=0; i--) {
        append = new Term( "cons", [ l[i], append ] );
    }

    return append;
};

parser.getParameters = function( tokenizer ) {
    // Part -> var | id | id(optParamList)
    // Part -> [ listBit ] ::-> cons(...)
    
    switch ( tokenizer.type ) {
        case "var":
            return parser.getVariable( tokenizer );
        case "id":
            var name = tokenizer.current;
            tokenizer.consume();

            if ( tokenizer.current != "(" ) {
                return new Atom( name );
            }
            tokenizer.consume();

            var p = [];
            var i = 0;
            while ( tokenizer.current != ")" ) {
                if ( tokenizer.type == "eof" ) {
                    return null;
                }

                var part = parser.getParameters( tokenizer );
                if ( !part ) {
                    return null;
                }

                if ( tokenizer.current == "," ) {
                    tokenizer.consume();
                }
                else if ( tokenizer.current != ")" ) {
                    return null;
                }

                p[ i++ ] = part;
            }
            tokenizer.consume();

            return new Term(name, p);
        case "punc":
            if ( tokenizer.current == "[" ) {
                return parser.getList( tokenizer );
            }
            // else fall
        default:
            throw "unexpected token in parameters " + tokenizer.type + " " + tokenizer.current;
    }
};
