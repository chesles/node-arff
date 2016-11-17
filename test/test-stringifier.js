var arfftools = require('../arfftools.js')

module.exports = {
  setUp: function(done) {
    var data = {
      name: 'hypo',
      attributes: [ 'length', 'color', 'age', 'neighbors', 'class' ],
      types: {
        length: { type: 'numeric' },
        color: { type: 'nominal', oneof: ["Red", "Green", "Blue"] },
        age: { type: 'numeric' },
        neighbors: { type: 'nominal', oneof: ["1", "2-to-4", "5-to-9", "more-than-10"] },
        class: { type: 'nominal', oneof: ["True", "False"] }
      },
      data: [
        { length: 5.1, color: 0, age: 4, neighbors: 1, class: 0 },
        { length: 4.9, color: 2, age: 4, neighbors: 0, class: 0 },
        { length: 4.7, color: 0, age: 3, neighbors: 3, class: 1 },
        { length: 4.6, color: 1, age: 5, neighbors: 1, class: 0 },
        { length: 5.0, color: 2, age: 4, neighbors: 2, class: 1 },
        { length: 5.4, color: 0, age: 7, neighbors: 2, class: 0 }
      ]
    };
    var me = this;
    arfftools.toString(data, function(err, content) {
      me.contentString = content;
      done();
    });
  },
  'data was stringified correctly': function(test) {
    test.equal(this.contentString, "\n@RELATION hypo\n\n@ATTRIBUTE length numeric\n@ATTRIBUTE color {Red,Green,Blue}\n@ATTRIBUTE age numeric\n@ATTRIBUTE neighbors {1,2-to-4,5-to-9,more-than-10}\n@ATTRIBUTE class {True,False}\n\n@DATA\n\n5.1,Red,4,2-to-4,True\n4.9,Blue,4,1,True\n4.7,Red,3,more-than-10,False\n4.6,Green,5,2-to-4,True\n5,Blue,4,5-to-9,False\n5.4,Red,7,5-to-9,True");
    test.done();
  }
}
