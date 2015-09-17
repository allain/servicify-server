var rpc = require('node-json-rpc');
var Promise = require('bluebird');
var Servicify = require('servicify-core');

function ServicifyServer(opts) {
  if (!(this instanceof ServicifyServer)) return new ServicifyServer(opts);

  opts = opts || {};

  this.servicify = new Servicify(opts);
}

ServicifyServer.prototype.listen = function (opts) {
  var servicify = this.servicify;

  opts = opts || {};

  var port = opts.port || 2020;
  var host = opts.host || '127.0.0.1';

  var server = new rpc.Server({
    port: port,
    host: host,
    path: '/servicify/',
    strict: true
  });

  server.port = port;
  server.host = host;

  server.addMethod('offer', function (args, cb) {
    servicify.offer(args[0]).nodeify(cb);
  });

  server.addMethod('rescind', function (args, cb) {
    servicify.rescind(args[0], args[1]).nodeify(cb);
  });

  server.addMethod('resolve', function (args, cb) {
    servicify.resolve(args[0], args[1]).nodeify(cb);
  });

  return Promise.fromNode(function(cb) {
    server.start(cb);
  }).then(function() {
    return {
      host: host,
      port: port,
      stop: function () {
        return Promise.fromNode(function(cb) {
          server.stop(cb);
        });
      }
    };
  });
};

module.exports = ServicifyServer;
