# ARFF Tools for node.js

See the [WEKA wiki](http://weka.wikispaces.com/ARFF+%28developer+version%29) for
details on the file format.

# Usage

First, install node.js and get the `node-arff` NPM module using npm:

    $ npm install node-arff

Then, get yourself an ARFF file (http://axon.cs.byu.edu/data/ has a few) to read.

```javascript
var arff = require('node-arff');

arff.load('data/some-file.arff', function(err, data) {
  if (err) {
    return console.error(err);
  }
  // find out some info about the field "age"
  var oldest = data.max('age');
  var youngest = data.min('age');
  var mostcommon = data.mode('age');
  var average = data.mean('age');

  // normalize the data (scale all numeric values so that they are between 0 and 1)
  data.normalize();

  // randomly sort the data
  data.randomize();
})
```
