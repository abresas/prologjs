exports = module.exports = Tokenizer;

function Tokenizer( string ) {
    this.remainder = string;
    this.current = null;
    this.type = null;	// "eof", "id", "var", "punc" etc.
    this.consume();	// Load up the first token.
}

Tokenizer.prototype.punctuation = [ '(', ')', '.', ',', '[', ']', '!', ':', ':-', '\\+', '\\' ];

Tokenizer.prototype.consumeEmpty = function() {
    if ( this.remainder ) {
        return false;
    }

    this.current = null;
    this.type = "eof";
    return true;
};

Tokenizer.prototype.consumePunctuation = function() {
    var length = 0;
    var l = this.remainder.length;
    while ( length < l && this.punctuation.indexOf( this.remainder.substring( 0, length + 1 ) ) != -1 ) {
        ++length;
    }

    if ( !length ) {
        return false;
    }

    this.current = this.remainder.substring( 0, length );
    this.remainder = this.remainder.substring( length );
    this.type = "punc";

    return true;
};

Tokenizer.prototype.consumeVariable = function() {
    // check for uppercase letter
    if ( !isUppercase( this.remainder[ 0 ] ) && this.remainder[ 0 ] != '_' ) {
        return false;
    }
    var end = 0;
    var l = this.remainder.length;
    while ( end < l - 1 && isAlphanum( this.remainder[ end + 1 ] ) ) {
        ++end;
    }

    this.current = this.remainder.substring( 0, end + 1 );
    this.remainder = this.remainder.substring( end + 1 );
    this.type = "var";

    return true;
};

Tokenizer.prototype.consumeString = function() {
    if ( this.remainder[ 0 ] != '"' && this.remainder[ 0 ] != "'" ) {
        return false;
    }

    var type = this.remainder[ 0 ];
    var start = 1;

    while ( true ) {
        var closeIndex = this.remainder.indexOf( type, start );
        if ( closeIndex == -1 ) {
            return false;
        }
        if ( this.remainder[ closeIndex - 1 ] == "\\" ) {
            start = closeIndex + 1;
        }
        else {
            break;
        }
    }

    this.current = this.remainder.substring( 0, closeIndex + 1 );
    this.remainder = this.remainder.substring( closeIndex + 1 );
    this.type = "id";

    return true;
};

Tokenizer.prototype.consumeAlphanumeric = function() {
    var end = -1;
    var l = this.remainder.length;
    while ( end < l - 1 && ( isAlphanum( this.remainder[ end + 1 ] ) || this.remainder[ end + 1 ] == '.' ) ) {
        ++end;
    }
    if ( end == -1 ) {
        return false;
    }
    this.current = this.remainder.substring( 0, end + 1 );
    this.remainder = this.remainder.substring( end + 1 );
    this.type = "id";
    return true;
};

// lexical analysis
Tokenizer.prototype.consume = function() {
    if ( this.type == "eof" ) {
        return;
    }

    this.remainder = this.remainder.trim();
    var checkTypes = [ 'empty', 'punctuation', 'variable', 'string', 'alphanumeric' ];
    var foundType = false;

    for ( var i = 0; i < checkTypes.length; ++i ) {
        var type = checkTypes[ i ];
        var method = 'consume' + type[ 0 ].toUpperCase() + type.substring( 1 );
        if ( this[ method ]() ) {
            foundType = true;
            break;
        }
    }

    if ( !foundType ) {
        this.current = null;
        this.type = "eof";
    }
};

function isUppercase( c ) {
    var code = c.charCodeAt( 0 );
    return 65 <= code && code <= 90;
}

function isAlphanum( c ) {
    var code = c.charCodeAt( 0 );
    return ( 48 <= code && code <= 57 ) || // number
           ( 65 <= code && code <= 90 ) || // uppercase
           ( 97 <= code && code <= 122 );  // lowercase
}

