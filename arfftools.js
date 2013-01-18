var arff = require('./arff.js');

var arfftools = module.exports = {
  load: function(filename, callback) {
    var file = arff(filename);
    var arffdata = {
      name: '',
      attributes: [],
      types: {},
      data: []
    }

    file.on('relation', function(name) {
      arffdata.name = name;
    });

    file.on('attribute', function(name, type) {
      arffdata.attributes.push(name);
      arffdata.types[name] = type;
    });

    file.on('data', function(data) {
      var obj = {};
      data.forEach(function(datum, i) {
        var field = arffdata.attributes[i];
        var type = arffdata.types[field];
        if (type.type == 'numeric') {
          if (datum.indexOf('.') >= 0) {
            datum = parseFloat(datum);
          }
          else {
            datum = parseInt(datum);
          }
        }
        obj[field] = datum;
      });
      arffdata.data.push(obj);
    });

    file.on('error', function(err) {
      callback(err);
    });

    file.on('end', function() {
      callback(null, arffdata);
    });
  }
}
