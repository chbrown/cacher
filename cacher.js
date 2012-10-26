#!/usr/bin/env node
var fs = require('fs'),
  http = require('http'),
  redis = require('redis'),
  client = redis.createClient(),
  exec = require('child_process').exec,
  R = new (require('regex-router'))(),
  argv = require('optimist').default({host: '127.0.0.1', port: 8009}).argv;

Array.prototype.extend = function(l) { return this.push.apply(this, l); };
http.ServerResponse.prototype.exit = function(http_code, content_type, body) {
  this.writeHead(http_code, {"Content-Type": content_type});
  this.write(body);
  this.end();
};
http.ServerResponse.prototype.die = function(err) {
  this.exit(500, 'text/plain', 'Failure: ' + err.toString());
};

R.default = function(m, req, res) {
  res.exit(404, "text/plain", "Bad request, not found.");
};
R.post(/add/, function(m, req, res) {
  req.on('end', function() {
    var url = req.data.trim();
    client.rpush('htmlcache:queue', url, function(err) {
      if (err)
        res.exit(500, 'text/plain', 'Failure: ' + err.toString());
      else
        res.exit(200, 'text/plain', 'Queued url: ' + url);
    });
  });
});

R.post(/get/, function(m, req, res) {
  req.on('end', function() {
    var url = req.data.trim();
    client.sismember('htmlcache:fetched', url, function(err, ismember) {
      var result = '';
      if (err) {
        res.die(err);
      }
      else if (!ismember) {
        client.rpush('htmlcache:queue', url, function(err) {
          if (err)
            res.die(err);
          else
            res.exit(404, 'text/plain', 'Not yet fetched, queuing: ' + url);
        });
      }
      else {
        var filename = url
            .replace(/^https?:\/\//, '')
            .replace(/[^-_.a-zA-Z0-9]+/g, '-')
            .slice(0, 255);
        fs.readFile('/usr/local/data/cacher/' + filename, 'utf8', function(err, data) {
          if (err)
            res.die(err);
          else
            res.exit(200, 'text/plain', data);
        });
      }
    });
  });
});

var app = http.createServer(function(req, res) {
  req.data = ''; req.on('data', function(chunk) { req.data += chunk; });

  console.log('URL: ' + req.url);
  R.route(req, res);
}).listen(argv.port, argv.host);
console.log('Cacher server running at ' + argv.host + ':' + argv.port);
