var arfftools = require('../arfftools.js')

module.exports = {
  setUp: function(done) {
    this.dataset = arfftools.load(__dirname + '/test.arff', function(err, data) {
      done();
    })
  },
  'file was parsed correctly': function(test) {
    test.equal(this.dataset.name, "hypo");
    test.equal(this.dataset.attributes.length, 5);
    test.equal(this.dataset.data.length, 6);
    test.done();
  },
  'max returns highest value': function(test) {
    var maxLength = this.dataset.max('length');
    var maxAge = this.dataset.max('age');
    test.equal(maxLength, 5.4);
    test.equal(maxAge, 7);
    test.done();
  },
  'min returns smallest value': function(test) {
    var minLength = this.dataset.min('length');
    var minAge = this.dataset.min('age');
    test.equal(minLength, 4.6);
    test.equal(minAge, 3);
    test.done();
  },
  'mean returns average value': function(test) {
    var meanLength = this.dataset.mean('length');
    var meanAge = this.dataset.mean('age');

    // this actually returns something like 4.94999999...
    test.ok(Math.abs(meanLength - 4.95) < 0.00001);
    test.equal(meanAge, 4.5);
    test.done();
  },
  'mode returns the most common value (or the first if all are equally common)': function(test) {
    var modeLength = this.dataset.mode('length');
    var modeAge = this.dataset.mode('age');
    test.equal(modeLength, 5.1);
    test.equal(modeAge, 4);
    test.done();
  },
  'normalize puts all values between 0 and 1': function(test) {
    this.dataset.normalize();
    var minlen = this.dataset.min('length');
    var minage = this.dataset.min('age');
    var maxlen = this.dataset.max('length');
    var maxage = this.dataset.max('age');
    test.equal(minlen, 0);
    test.equal(minage, 0);
    test.equal(maxlen, 1);
    test.equal(maxage, 1);
    test.done();
  },
  'randomize changes the order of the data': function(test) {
    var orig = this.dataset.data.slice();
    this.dataset.randomize();
    test.equal(orig.length, this.dataset.data.length);

    var moved = 0;
    for(var i=0; i<orig.length; i++) {
      var h = this.dataset.data.indexOf(orig[i]);
      if (h !== i) {
        moved++;
      }
    }
    test.ok(moved > 0);
    test.ok(moved <= orig.length);
    test.done();
  },
  'trainingSet': function(test) {
    var training = this.dataset.trainingSet({limit: 3})
    test.equal(training.length, 3);
    test.equal(training[0].expect, 0);
    test.equal(training[1].expect, 0);
    test.equal(training[2].expect, 1);
    test.done();
  },
  'isolate an output class': function(test) {
    // normally true would have a value of 0 because of the way test.arff is
    // formatted, but if we isolate the output class 'True', all the other
    // output classes get set to 0, and 'True' gets set to 1
    var training = this.dataset.trainingSet({isolate: 'True'})
    test.equal(training[0].expect, 1);
    test.equal(training[1].expect, 1);
    test.equal(training[2].expect, 0);
    test.equal(training[3].expect, 1);
    test.equal(training[4].expect, 0);
    test.equal(training[5].expect, 1);
    test.done();
  },
  'random number can be seeded to get consistent results': function(test) {
    // should still get a random numbers that are consistent from run to run
    this.dataset.setRandomSeed("boop");
    var num1 = this.dataset.getRandom();
    // reset the seed
    this.dataset.setRandomSeed("boop");
    var num2 = this.dataset.getRandom();
    test.ok(num1 === num2);
    var num3 = this.dataset.getRandom();
    test.ok(num1 !== num3);
    test.done();
  }
}
