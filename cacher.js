#!/usr/bin/env node
var fs = require('fs'),
  http = require('http'),
  redis = require('redis'),
  client = redis.createClient(),
  exec = require('child_process').exec,
  R = new (require('regex-router'))(),
  argv = require('optimist').default({host: '127.0.0.1', port: 9010}).argv;

Array.prototype.extend = function(l) { return this.push.apply(this, l); };
http.ServerResponse.prototype.string = function(content_type, body) {
  this.writeHead(200, {"Content-Type": content_type});
  this.write(body);
  this.end();
};
// http.ServerResponse.prototype.json = function(obj) {
//   this.string("application/json", JSON.stringify(obj));
// };

R.default = function(m, req, res) {
  res.string("text/plain", "Bad request.");
};
R.post(/(add)/, function(m, req, res) {
  req.on('end', function() {
    var url = req.data.trim();
    client.rpush('htmlcache:queue', url, function(err) {
      if (err)
        res.string('text/plain', 'Failure: ' + err.toString());
      else
        res.string('text/plain', 'Queued url: ' + url);
    });
  });
});

R.post(/(get)/, function(m, req, res) {
  req.on('end', function() {
    var url = req.data.trim();
    client.get('htmlcache:pages:' + url, function(err, text) {
      if (err)
        res.string('text/plain', 'Failure: ' + err.toString());
      else
        res.string('text/plain', text);
    });
  });
});

var app = http.createServer(function(req, res) {
  req.data = ''; req.on('data', function(chunk) { req.data += chunk; });

  console.log('URL: ' + req.url);
  R.route(req, res);
}).listen(argv.port, argv.host);
console.log('Cacher server running at ' + argv.host + ':' + argv.port);
