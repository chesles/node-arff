var fs = require('fs')
  , readline = require('readline')
  , EventEmitter = require('events').EventEmitter

/*
 * returns an EventEmitter that emits the following events as the file is
 * parsed:
 *  - relation - function(relationName) {}
 *  - attribute - function(attribute, type) {}
 *  - data - function(data) {} - called once for each line of data
 *  - error - function(exception) - called when errors occur
 *
 * See http://axon.cs.byu.edu/~martinez/classes/478/stuff/arff.html
 * or http://weka.wikispaces.com/ARFF+%28developer+version%29
 * for a description of the Attribute-Relation File Format
 *
 * Note: This parser conforms more closely to the simplified version used at BYU
 *
 * TODO: handle quoted names with spaces
 * TODO: handle date types
 */
module.exports = function arff(input) {
  var is;
  var emitter = new EventEmitter();
  var section;

  if (typeof input === 'string') {
    is = fs.createReadStream(input);
  }
  // input is a readable stream
  else if (input.readable) {
    is = input;
  }
  else {
    process.nextTick(function() {
      emitter.emit('error', new Error('Unknown input:'+input));
    });
  }
  var handlers = {
    line: function(line) {
      if (!section) section = 'header';

      var chunks = line.trim().split(/[\s]+/);

      // skip blank lines and comments
      if (chunks.length === 1 && chunks[0] === '') return;
      else if (/^%/.test(chunks[0])) {
        return;
      }
      // relation name
      else if (/^@RELATION/i.test(chunks[0])) {
        if (section !== 'header') {
          return emitter.emit('error', new Error('@RELATION found outside of header'));
        }
        emitter.emit('relation', chunks[1])
      }
      // attribute spec
      else if (/^@ATTRIBUTE/i.test(chunks[0])) {
        if (section != 'header') {
          return emitter.emit('error', new Error('@ATTRIBUTE found outside of header section'));
        }
        var name = chunks[1].replace(/['"]|:$/g, '');
        var type = parseAttributeType(chunks.slice(2).join(' '));
        emitter.emit('attribute', name, type);
      }
      else if (/^@DATA/i.test(chunks[0])) {
        if (section == 'data') {
          return emitter.emit('error', new Error('@DATA found after DATA'));
        }
        section = 'data';
      }
      else {
        if (section == 'data') {
          emitter.emit('data', chunks.join('').replace(/['"]/g, '').split(','));
        }
      }
    },
    end: function() {
      emitter.emit('end');
    },
    error: function(err) {
      emitter.emit('error', err);
    }
  }

  lines = readline.createInterface({
    input: is,
    output: fs.createWriteStream('/dev/null')
  });
  lines.on('line', handlers.line);
  lines.on('error', handlers.error);
  lines.on('close', handlers.end);

  return emitter;
}

/*
 * Types can be any of:
 *  - numeric | integer | real | continuous
 *  - string
 *  - date [format]
 *  - nominal
 */
function parseAttributeType(type) {
  var finaltype = { type: type };
  var parts;

  if (/^date/i.test(type)) {
    parts = type.split(/[\s]+/);
    var format = "yyyy-MM-dd'T'HH:mm:ss";
    if (parts.length > 1) {
      format = parts[1];
    }
    finaltype = {
      type: 'date',
      format: format
    }
  }
  else if (parts=type.match(/^{([^}]*)}$/)) {
    finaltype.type = 'nominal';
    finaltype.oneof = parts[1].replace(/[\s'"]/g, '').split(/,/);
  }
  else if (/^numeric|^integer|^real|^continuous/i.test(type)) {
    finaltype.type = 'numeric';
  }
  else if (/string/i.test(type)) {
    finaltype.type = 'string';
  }

  return finaltype;
}
