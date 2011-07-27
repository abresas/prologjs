var EventWaiter = require( './eventwaiter' ),
    inherits = require( 'util' ).inherits;

var Query = function( queryString, callback ) {
    EventWaiter.call( this );

    this.string = queryString;
    this.results = {};
    this.callback = callback;
    this.completed = false;

    var self = this;

    this.on( 'one', this.extendResults.bind( this ) );
    this.on( 'complete', this.onComplete.bind( this ) );
};

exports = module.exports = Query;

inherits( Query, EventWaiter );

Query.prototype.extendResults = function( variables ) {
    if ( !variables ) {
        return;
    }
    for ( var name in variables ) {
        // console.log( 'var ' + name + ' = ' + variables[ name ] );
        if ( this.results[ name ] ) {
            Array.prototype.push.apply( this.results[ name ], variables[ name ] );
            continue;
        }
        // else 
        this.results[ name ] = variables[ name ].slice();
    }
};

Query.prototype.onComplete = function() {
    if ( this.completed ) {
        return console.warn( 'prologjs: query has been completed again warning' );
    }
    this.completed = true;
    this.callback( this.results );
};

Query.prototype.createResultCallback = function() {
    return this.createCallback();
};
