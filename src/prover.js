var EventWaiter = require( './eventwaiter' );

var Prover = function( rules ) {
    this.userFunctions = {};
    this.userData = [];
    this.rules = rules.slice();
};

exports = module.exports = Prover;

Prover.prototype.addRule = function( ruleString ) {
    this.rules.push( parser.getRule( ruleString ) );
};

Prover.prototype.getRules = function() {
    return this.rules;
};

Prover.prototype.setData = function( data ) {
    this.userData = data.slice();
};

Prover.prototype.clearData = function() {
    this.userData = [];
};

Prover.prototype.addFunction = function( name, func ) {
    this.userFunctions[ name ] = func;
};

Prover.prototype.removeFunction = function( name ) {
    delete this.userFunctions[ name ];
};

Prover.prototype._unify = function( rule, target, callback ) {
    var head = rule.head;

    // basic checks
    if ( head.name != target.name || head.partlist.length != target.partlist.length ) {
        return callback( false );
    }

    var variables = {};
    // check if arguments match
    for ( var i = 0; i < head.partlist.length; ++i ) {
        var t_arg = target.partlist[ i ];
        var r_arg = head.partlist[ i ];
        if ( t_arg.type != r_arg.type && t_arg.type != 'Variable' ) {
            return callback( false );
        }
        if ( t_arg.type == 'Atom' ) {
            if ( t_arg.name == r_arg.name ) { 
                continue;
            }
            // else 
            return callback( false );
        }
        if ( t_arg.type == 'Variable' && r_arg.type != 'Variable' ) {
            if ( t_arg.name == '_' ) {
                continue;
            }
            if ( variables[ t_arg.name ] ) {
                variables[ t_arg.name ].push( r_arg.toString() );
                continue;
            }
            // else
            variables[ t_arg.name ] = [ r_arg.toString() ];
        }
        // should check for (Atom/Term,Variable) and (Variable,Variable) too but not needed for now
    }

    // so far so good with the head, now check body
    
    if ( !rule.body ) {
        // easy one, no conditions
        return callback( variables );
    }

    // will check one condition for now, and will assume it is not a built-in
    var rule = rule.body.list[ 0 ];
    var func = this.userFunctions[ rule.name ];
    if ( !func ) {
        console.log( 'unknown condition: ' + rule.name );
        return callback( false );
    }
    
    var args = [];
    for ( var i = 0; i < rule.partlist.length; ++i ) {
        args.push( rule.partlist[ i ].name );
    }

    args.push( this.userData.slice() );

    args.push( function( result ) {
        if ( rule.negative ) {
            result = !result;
        }
        if ( result ) {
            return callback( variables );
        }
        // else
        callback( false );
    } );

    func.apply( {}, args );
};

Prover.prototype.prove = function( query, cb ) {
    var results = {};

    var waiter = new EventWaiter();
    waiter.disable();
    waiter.on( 'one', function( variables ) {
        if ( !variables ) {
            return;
        }
        for ( var name in variables ) {
            // console.log( 'var ' + name + ' = ' + variables[ name ] );
            if ( results[ name ] ) {
                Array.prototype.push.apply( results[ name ], variables[ name ] );
                continue;
            }
            // else 
            results[ name ] = variables[ name ].slice();
        }
    } );
    waiter.on( 'complete', function() {
        cb( results );
    } );

    var target = parser.getBody( query ).list[ 0 ];
    for ( var i in this.rules ) {
        var rule = this.rules[ i ];
        if ( !rule.head ) {
            console.log( "NO RULE HEAD ERROR: " + rule );
            break;
        }
        this._unify( rule, target, waiter.createCallback() );
    }

    waiter.enable();
};
