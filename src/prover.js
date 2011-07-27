var Query = require( './query' );

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

Prover.prototype._unify = function( rule, target ) {
    var head = rule.head;

    // basic checks
    if ( head.name != target.name || head.partlist.length != target.partlist.length ) {
        return false;
    }

    var variables = {};
    // check if arguments match
    for ( var i = 0; i < head.partlist.length; ++i ) {
        var t_arg = target.partlist[ i ];
        var r_arg = head.partlist[ i ];
        if ( t_arg.type != r_arg.type && t_arg.type != 'Variable' ) {
            return false;
        }
        if ( t_arg.type == 'Atom' ) {
            if ( t_arg.name == r_arg.name ) { 
                continue;
            }
            // else 
            return false;
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

    return variables;
};

Prover.prototype.proveBody = function( query, variables, rule ) {
    // will check one condition for now, and will assume it is not a built-in
    var rule = rule.body.list[ 0 ],
        func = this.userFunctions[ rule.name ],
        args = [],
        rCallback;

    if ( !func ) {
         console.warn( 'prologjs: unknown condition: ' + rule.name );
         return;
    }
    
    for ( i = 0; i < rule.partlist.length; ++i ) {
        args.push( rule.partlist[ i ].name );
    }

    args.push( this.userData.slice() );

    rCallback = query.createResultCallback();

    args.push( function( result ) {
        /*
        console.log( 'prologjs: got callback result' );
        console.log( result );
        console.log( 'variables are' );
        console.log( variables );
        */
        if ( rule.negative ) {
            result = !result;
        }
        if ( result ) {
            return rCallback( variables );
        }
        // else do nothing
        rCallback( false );
    } );

    func.apply( {}, args );
};

Prover.prototype.proveRule = function( query, rule ) {
    var variables = this._unify( rule, query.currentRule );

    if ( !variables ) {
        return;
    }
    // so far so good with the head, now check body
    
    if ( !rule.body ) {
        // easy one, no conditions
        query.extendResults( variables );
        return;
   }

    this.proveBody( query, variables, rule );
};

Prover.prototype.prove = function( queryString, cb ) {
    var query = new Query( queryString, cb );

    query.currentRule = parser.getBody( query.string ).list[ 0 ];
    for ( var i in this.rules ) {
        this.proveRule( query, this.rules[ i ]  );
    }

    setTimeout( function() {
        // in case no callback was needed and complete wasn't fired
        // this could be better if query api was always async
        // but that would have its own quirks too
        if ( !query.waiting ) {
            query.emit( 'complete' );
        }
    }, 0 );
};
