var arff = require('./arff.js');

var ArffData = function() {
  this.name = ''
  this.attributes = []
  this.types = {}
  this.data = []
}

ArffData.prototype = {
  // randomly sort the values
  randomize: function() {
    this.data.sort(function(a, b) {
      var rand = Math.random();
      if (rand <= 0.45) return -1;
      if (rand <= 0.9) return 1;
      else return 0;
    });
  },
  // return the lowest value found in col
  min: function(col) {
    var min
      , idx = this.attributes.indexOf(col)

    // no such column, return undefined
    if (idx < 0) return min;
    
    for(var i=0; i<this.data.length; i++) {
      var val = this.data[i][col];
      if (min===undefined || val < min) {
        min = val;
      }
    }
    return min;
  },
  // return the highest value found in col
  max: function(col) {
    var max
      , idx = this.attributes.indexOf(col)

    // no such column, return undefined
    if (idx < 0) return max;

    for(var i=0; i<this.data.length; i++) {
      var val = this.data[i][col];
      if (max===undefined || val > max) {
        max = val;
      }
    }
    return max;
  },
  // return the mean for col
  mean: function(col) {
    var sum = 0
      , count = 0
      , idx = this.attributes.indexOf(col)

    // no such column
    if (idx < 0) return sum;
    
    for(var i=0; i<this.data.length; i++) {
      var val = this.data[i][col];
      sum += val;
      count ++;
    }
    return sum / count;
  },
  // return the most common value for col
  mode: function(col) {
    var counters = {}
      , idx = this.attributes.indexOf(col)
      , mode

    // no such column
    if (idx < 0) return sum;

    for(var i=0; i<this.data.length; i++) {
      var val = this.data[i][col];
      if (counters[val] === undefined)
        counters[val] = 1;
      else
        counters[val]++;

      if (mode===undefined || counters[val] > counters[mode])
        mode = val;
    }
    return mode;
  },
  normalize: function() {
    var data = this;
    data.attributes.forEach(function(field) {
      if (data.types[field].type == 'numeric') {
        var min = data.min(field);
        var max = data.max(field);
        var range = max - min;
        data.data.forEach(function(row) {
          row[field] = (row[field] - min) / range;
        });
      }
    });
  },
  trainingSet: function(opts) {
    if (!opts) opts = {}

    var expect = opts.expect || this.attributes[this.attributes.length-1]
    var fields = opts.fields || this.attributes.slice(0, this.attributes.length-1)
    var limit = opts.limit || this.data.length;

    var set = [];
    var data = this.data;
    for(var i=0; i < limit; i++) {
      var sample = fields.map(function(field) {
        return data[i][field];
      });
      set.push({data: sample, expect: data[i][expect]});
    }
    return set;
  }
}

var arfftools = module.exports = {
  load: function(filename, callback) {
    var file = arff(filename);
    var arffdata = new ArffData();

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
        else if (type.type == 'nominal') {
          datum = type.oneof.indexOf(datum);
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

    return arffdata;
  }
}
