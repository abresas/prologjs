var inherits = require( 'util' ).inherits,
    EventEmitter = require( 'events' ).EventEmitter;

var EventWaiter = function() {
    this.waiting = 0;
    this.enabled = true;

    EventEmitter.call( this );
};

inherits( EventWaiter, EventEmitter );

exports = module.exports = EventWaiter;

EventWaiter.prototype.enable = function() {
    if ( !this.waiting ) {
        this.emit( 'complete' );
    }
};

EventWaiter.prototype.disable = function() {
    this.enabled = false;
};

EventWaiter.prototype.createCallback = function() {
    ++this.waiting;

    var self = this;
    return function() {
        --self.waiting;
        var args = [ 'one' ];
        for ( var i in arguments ) {
            args.push( arguments[ i ] );
        }
        self.emit.apply( self, args );
        if ( self.enabled ) {
            self.emit( 'complete' );
        }
    };
};

exports.EventWaiter = EventWaiter;
