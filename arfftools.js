var arff = require('./arff.js'),
    seed = require('seed-random');

var ArffData = function() {
  this.name = ''
  this.attributes = []
  this.types = {}
  this.data = []
}

ArffData.prototype = {
  getRandom: function() {
    if (!this.randomSeed) {
      return Math.random();
    } else {
      return this.randomSeed();
    }
  },
  setRandomSeed: function(s) {
    this.randomSeed = seed(s);
  },
  // randomly sort the values
  randomize: function() {
    this.randomizeArray(this.data)
  },
  randomizeArray: function(arr) {
    var self = this;
    arr.sort(function(a, b) {
      var rand = self.getRandom();
      if (rand <= 0.45) return -1;
      if (rand <= 0.9) return 1;
      else return 0;
    });
    return arr;
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
  // create a training set from the data
  // options:
  //  - expect: the field that contains the expected value (default=the last field)
  //  - fields: fields to include in the data set (default=all fields)
  //  - limit: limit the training set to this size (default none, includes all data)
  //  - isolate: name of an output class to isolate; sets the 'expect' field to
  //    1 if the expect value matches that output class, and to 0 if not
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
      var expected = data[i][expect];
      if ('isolate' in opts) {
        if (expected == this.types[expect].oneof.indexOf(opts.isolate)) {
          expected = 1;
        }
        else {
          expected = 0;
        }
      }
      set.push({data: sample, expect: expected});
    }
    return set;
  },
  // create two training sets by randomly splitting a full training set
  // according to some ratio
  randomSplit: function(opts) {
    var training = this.trainingSet(opts);
    var split = [[], []]
    while (training.length > 0) {
      var set = this.getRandom() < opts.ratio ? 0 : 1
      split[set].push(training.pop());
    }
    return split;
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
