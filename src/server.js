require('make-promises-safe') // installs an 'unhandledRejection' handler

const WebRTCConnectionManager = require('./webrtc_connection_manager.js');

class SRTWebRTCServer {
  constructor() {
    this.connectionManager = new WebRTCConnectionManager({ port: process.env.PORT || 3000 });
  }

  async start() {
    await this.connectionManager.listen();
  }
}

module.exports = SRTWebRTCServer;