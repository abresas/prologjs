var prologjs = require( '../main' );

prologjs.load( 'example.pl', function( dialog ) {
    dialog.prove( 'lives(penguin,X).', function( data ) {
        console.log( "Penguins live in: " + data.X.join( ' ' ) );
    } );
} );
