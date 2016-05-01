var fs = require('fs')
  , EventEmitter = require('events').EventEmitter

module.exports = function stringify(data) {
  var emitter = new EventEmitter();

  if (!isArffData(data)) {
    return emitter.emit('error', new Error('data is not ArffData'));
  }

  var content = "";//TODO probably add some comments

  content += "\n@RELATION " + data.name + "\n";

  data.attributes.forEach(function (field) {
    content += "\n@ATTRIBUTE " + field + " ";
    var type = data.types[field].type;
    if (type === 'nominal') {
      content += "{" + data.types[field].oneof.join(',') + "}";
    }
    else if (type === 'date') {
      content += "date " + data.types[field].format;
    }
    else {
      content += type;
    }
  });

  content += "\n\n@DATA\n";

  data.data.forEach(function (row) {
    var values = [];
    data.attributes.forEach(function (field) {
      var type = data.types[field].type;
      if (type === 'nominal') {
        values.push(data.types[field].oneof[row[field]]);
      }
      else {
        values.push(row[field]);
      }
    });
    content += "\n" + values.join(',');
  });

  process.nextTick(function() {
    emitter.emit('stringified', content);
  });

  process.nextTick(function() {
    emitter.emit('end');
  });

  return emitter;
}

function isArffData(data) {
  if (!data.hasOwnProperty('name')) {
    return false;
  }
  if (!data.hasOwnProperty('attributes')) {
    return false;
  }
  if (!data.hasOwnProperty('types')) {
    return false;
  }
  if (!data.hasOwnProperty('data')) {
    return false;
  }
  return true
}
