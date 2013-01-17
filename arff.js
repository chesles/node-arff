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
 */
module.exports = function arff(input) {
  var is;
  var emitter = new EventEmitter();
  var state;

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
      var chunks = line.trim().split(/[\s]+/);
      if (chunks.length < 1) return;
      // comments
      else if (/^%/.test(chunks[0])) {
        return;
      }
      // relation name
      else if (/^@RELATION/i.test(chunks[0])) {
        if (state == 'data') {
          return emitter.emit('error', new Error('@RELATION found after DATA'));
        }
        emitter.emit('relation', chunks[1])
      }
      // attribute spec
      else if (/^@ATTRIBUTE/i.test(chunks[0])) {
        if (state == 'data') {
          return emitter.emit('error', new Error('@ATTRIBUTE found after DATA'));
        }
        emitter.emit('attribute', chunks[1], chunks.slice(2).join(' '));
      }
      else if (/^@DATA/i.test(chunks[0])) {
        if (state == 'data') {
          return emitter.emit('error', new Error('@DATA found after DATA'));
        }
        state = 'data';
      }
      else {
        if (state == 'data') {
          emitter.emit('data', chunks.join('').split(','));
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
  lines.on('end', handlers.end);

  return emitter;
}
