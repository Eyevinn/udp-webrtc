require('make-promises-safe') // installs an 'unhandledRejection' handler

const WebRTCConnectionManager = require('./server/webrtc_connection_manager.js');
const UdpServer = require('./server/udp_server.js');

class UDPWebRTCServer {
  constructor() {
    const udpServerVideo = new UdpServer({ port: 2234, chunkSize: 320 * 240 * 1.5 });
    const udpServerAudio = new UdpServer({ port: 2235 });
    udpServerVideo.listen();
    udpServerAudio.listen();
    
    this.connectionManager = new WebRTCConnectionManager({ 
      port: process.env.PORT || 3000,
      udpServerVideo,
      udpServerAudio 
    });
  }

  async start() {
    await this.connectionManager.listen();
  }
}

module.exports = UDPWebRTCServer;