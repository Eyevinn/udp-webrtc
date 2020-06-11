const dgram = require('dgram');
const EventEmitter = require('events');
const debug = require('debug')('udp-server');

class UdpServer extends EventEmitter {
  constructor(opts) {
    super();
    this.udpPort = opts.port;

    let buffer = new Buffer.alloc(200, 0);
    const chunkSize = opts.chunkSize || 1280 * 720 * 1.5; // I420 frame

    this.socket = dgram.createSocket('udp4');
    this.socket.on('error', err => {
      console.error(err.stack);
      this.socket.close();
      throw new Error(`UDP server error`);
    });
    this.socket.on('message', (msg, rinfo) => {
      const allData = Buffer.concat([buffer, msg]);
      const totalLength = allData.length;
      const remainder = totalLength % chunkSize;
      const cutOff = totalLength - remainder;
      debug(`message ${msg.length} chunkSize=${chunkSize} cutOff=${cutOff} totalLength=${totalLength} remainder=${remainder}`);
      for (let i = 0; i < cutOff; i += chunkSize) {
        let chunk = allData.slice(i, i + chunkSize);
        debug(`emit data ${chunk.length}`);
        this.emit('data', chunk);
      }
      buffer = allData.slice(cutOff, totalLength);
    });
    this.socket.on('listening', () => {
      const address = this.socket.address();
      console.log(`UDP server listening on ${address.address}:${address.port}`);
    });
  }

  listen() {
    this.socket.bind(this.udpPort);
  }
}

module.exports = UdpServer;