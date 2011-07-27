var Prover = require( './prover' ),
    parser = require( './parser' ),
    fs = require( 'fs' );

function load( path, callback ) {
    fs.readFile( path, 'utf-8', function( err, data ) {
        var db = data.split( '\n' );
        var rules = [];
        for ( var i in db ) {
            var prologRule = db[ i ];
            if ( !prologRule || prologRule[ 0 ] == '%' ) {
                continue;
            }

            var parsedRule = parser.getRule( prologRule );

            rules.push( parsedRule );
        }

        callback( new Prover( rules ) );
    } );
}

exports.load = load;
