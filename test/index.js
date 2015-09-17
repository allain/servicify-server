var ServicifyServer = require('..');
var Promise = require('bluebird');

var test = require('blue-tape');

var rpc = require('node-json-rpc');

test('can be created without options', function (t) {
  var server = new ServicifyServer();
  t.ok(server instanceof ServicifyServer);
  t.end();
});

test('supports lifecycle without arguments', function (t) {
  return new ServicifyServer().listen().then(function (srv) {
    t.ok(srv);
    t.equal(srv.port, 2020);
    t.equal(srv.host, '127.0.0.1');
    return srv.stop();
  });
});

test('is exposed as an rpc endpoint', function (t) {
  return new ServicifyServer().listen().then(function (srv) {
    var client = new rpc.Client({
      port: 2020,
      host: '127.0.0.1',
      path: '/',
      strict: true
    });

    var expiresBefore;

    callRpc(client, 'register', [
      {name: 'a', version: '1.2.3', host: '127.0.0.1', port: 2021}
    ]).then(function (registered) {
      t.equal(registered.name, 'a');
      t.equal(registered.version, '1.2.3');
      t.equal(registered.host, '127.0.0.1');
      t.equal(registered.port, 2021);
      expiresBBefore = registered.expires;

      return callRpc(client, 'heartbeat', [registered.id]);
    }).then(function(touched) {
      t.equal(touched.length, 1);
      t.ok(touched[0].expires, 'touched record has a touched prop');
      return callRpc(client, 'resolve', ['a', '^1.0.0']);
    }).then(function (resolutions) {
      t.equal(resolutions.length, 1);
      t.equal(resolutions[0].name, 'a');
      t.equal(resolutions[0].version, '1.2.3');

      return callRpc(client, 'deregister', ['a', '^1.2.3']);
    }).then(function (deregistered) {
      t.equal(deregistered.length, 1);
      t.equal(deregistered[0].name, 'a');
      t.equal(deregistered[0].version, '1.2.3');
      return callRpc(client, 'resolve', ['a', '^1.0.0']);
    }).then(function (resolutions) {
      t.deepEqual(resolutions, []);
    }).then(srv.stop);
  });
});

function callRpc(client, method, args) {
  return new Promise(function (resolve, reject) {
    client.call({
      'jsonrpc': "2.0",
      'method': method,
      'params': args,
      "id": 1
    }, function (err, res) {
      if (err) return reject(err);

      resolve(res.result);
    });
  });
}
