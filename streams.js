var stream = require('stream');
var util = require('util');
var zlib = require('zlib');

var gzip = zlib.createGzip();

class StringifyStream extends stream.Transform {
  constructor() {
    super();

    this._readableState.objectMode = false;
    this._writableState.objectMode = true;
  }

  _transform (obj, encoding, cb){
    this.push(`new data part:\n${JSON.stringify(obj)}\n\n`);
    cb();
  };
}

var data = {
  "id": ["wegrwrge", "rgre"]
};

var rs = new stream.Readable({ objectMode: true });
rs.push(data);
rs.push(data);
rs.push(null);

rs.pipe(new StringifyStream()).pipe(gzip).pipe(process.stdout);