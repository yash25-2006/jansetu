const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const origLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  origLookup(hostname, options, (err, address, family) => {
    if (err) {
      dns.resolve4(hostname, (err2, addresses) => {
        if (!err2 && addresses && addresses.length > 0) {
          if (options && options.all) {
            return callback(
              null,
              addresses.map((a) => ({ address: a, family: 4 }))
            );
          }
          return callback(null, addresses[0], 4);
        }
        callback(err, address, family);
      });
    } else {
      callback(null, address, family);
    }
  });
};
