const dgram = require('dgram');
const EventEmitter = require('events');

class UdpServer extends EventEmitter {
  constructor(opts) {
    super();
    this.udpPort = opts.port;

    this.udpServer = dgram.createSocket('udp4');
    this.udpServer.on('error', err => {
      console.error(err.stack);
      this.udpServer.close();
      throw new Error(`UDP server error`);
    });
    this.udpServer.on('message', (msg, rinfo) => {
      this.emit('data', msg);
    });
    this.udpServer.on('listening', () => {
      const address = this.udpServer.address();
      console.log(`UDP server listening on ${address.address}:${address.port}`);
    });
  }

  listen() {
    this.udpServer.bind(this.udpPort);
  }
}

module.exports = UdpServer;