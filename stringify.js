var fs = require('fs')
  , EventEmitter = require('events').EventEmitter

module.exports = function stringify(data) {
  var emitter = new EventEmitter();

  if (typeof data !== 'ArffData') {
    return emitter.emit('error', new Error('data is not ArffData'));
  }

  var content = "";//TODO probably add some comments

  content += "\n@RELATION " + data.name;

  data.attributes.forEach(function (field) {
    content += "\n@ATTRIBUTE " + field + " ";
    var type = data.types[field].type;
    if (type === 'nominal') {
      content += "{" + data.types[field].oneof.join(',') + "}";
    }
    else {
      content += type;
    }
  });

  content += "\n@DATA";

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

  emitter.emit('end', content);

  return emitter;
}
