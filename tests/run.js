/**
 * Test runner cho Node.  Chạy:  node tests/run.js
 * (Máy không cài Node thì mở tests/index.html bằng trình duyệt, kết quả y hệt.)
 * Thoát với mã 1 nếu có test hỏng -> dùng được trong CI.
 */
'use strict';

var V = require('../assets/js/validate.js');
var spec = require('./spec.js');

var results = spec.run(V);
var pass = results.filter(function (r) { return r.ok; }).length;
var fail = results.length - pass;

var group = '';
results.forEach(function (r) {
  if (r.group !== group) {
    group = r.group;
    console.log('\n  ' + group);
  }
  if (r.ok) console.log('    ✓ ' + r.name);
  else console.log('    ✗ ' + r.name + '\n        ' + r.message);
});

console.log('\n  ' + pass + ' pass, ' + fail + ' fail, ' + results.length + ' test\n');
process.exit(fail ? 1 : 0);
