const Fastify = require('fastify')({ ignoreTrailingSlash: true });
const { v4: uuidv4 } = require('uuid');
const { RTCAudioSource, RTCVideoSource } = require('wrtc').nonstandard;
const debug = require('debug')('connection-manager');

const schemas = require('../model/schemas.js');

const Connection = require('./connection.js');

const routes = (fastify, opts, next) => {
  const connectionManager = opts.connectionManager;

  fastify.post("/connections", schemas("POST", "/connections"), async (request, reply) => {
    try {
      const connection = await connectionManager.createConnection();
      reply.send(connection.asJson());
    } catch (exc) {
      reply.code(500).send({ message: exc.message });
    }
  });

  fastify.get("/connections", schemas("GET", "/connections"), async (request, reply) => {
    try {
      reply.send(connectionManager.getConnections());
    } catch (exc) {
      reply.code(500).send({ message: exc.message });
    }
  });

  fastify.delete("/connections/:id", schemas("DELETE", "/connections/:id"), async (request, reply) => {
    try {
      const { id } = request.params;
      const connection = connectionManager.getConnectionById(id);
      if (!connection) {
        reply.code(404).send();
      } else {
        connection.close();
        reply.send(connection.asJson());
      }
    } catch (exc) {
      reply.code(500).send({ message: exc.message });
    }
  });

  fastify.get("/connections/:id/remote-description", schemas("GET", "/connections/:id/remote-description"), async (request, reply) => {
    try {
      const { id } = request.params;
      const connection = connectionManager.getConnectionById(id);
      if (!connection) {
        reply.code(404).send();
      } else {
        reply.send(connection.asJson().remoteDescription);
      }
    } catch (exc) {
      reply.code(500).send({ message: exc.message });
    }
  });

  fastify.post("/connections/:id/remote-description", schemas("POST", "/connections/:id/remote-description"), async (request, reply) => {
    try {
      const { id } = request.params;
      const connection = connectionManager.getConnectionById(id);
      if (!connection) {
        reply.code(404).send();
      } else {
        await connection.applyAnswer(request.body);
        reply.send(connection.asJson().remoteDescription);
      }
    } catch (exc) {
      reply.code(500).send({ message: exc.message });
    }
  });

  fastify.get("/connections/:id/local-description", schemas("GET", "/connections/:id/local-description"), async (request, reply) => {
    try {
      const { id } = request.params;
      const connection = connectionManager.getConnectionById(id);
      if (!connection) {
        reply.code(404).send();
      } else {
        reply.send(connection.asJson().localDescription);
      }
    } catch (exc) {
      reply.code(500).send({ message: exc.message });
    }
  });

  next();
};

class WebRTCConnectionManager {
  constructor(opts) {
    this.port = opts.port;
    this.udpServerVideo = opts.udpServerVideo;
    this.udpServerAudio = opts.udpServerAudio;

    if (!this.port) {
      throw new Error("opts.port must be provided");
    }

    Fastify.register(require('fastify-swagger'), {
      routePrefix: "/api/docs",
      swagger: {
        info: {
          title: "WebRTC Peer Connection Manager",
          description: "Connection negotiation API to establish a WebRTC peer between client and server",
          version: "0.1.0"
        },
      },
      exposeRoute: true
    });
    Fastify.register(require('fastify-cors'), {});
    Fastify.register(routes, {
      prefix: opts.apiPrefix || "/api/v1",
      connectionManager: this
    });

    Fastify.ready(err => {
      if (err) throw err;
      Fastify.swagger();
    });

    this.connections = {};
    this.closedListeners = {};
  }

  async createConnection() {
    const audioSource = new RTCAudioSource();
    const videoSource = new RTCVideoSource();
    const audioTrack = audioSource.createTrack();
    const videoTrack = videoSource.createTrack();

    this.udpServerVideo.on('data', chunk => {
      debug(`Got data ${chunk.length}`);
      videoSource.onFrame({
        width: 1280,
        height: 720,
        data: new Uint8ClampedArray(chunk)
      });
    });

    const connectionId = uuidv4();
    const connection = new Connection({ 
      connectionId: connectionId,
      audioTrack, 
      videoTrack,
    });
    this.connections[connectionId] = connection;

    debug("Created new connection");
    debug(connection);

    const closedListener = () => { this.deleteConnection(connectionId) }
    this.closedListeners[connectionId] = closedListener;
    connection.once('closed', closedListener);

    await connection.doOffer();

    return this.connections[connectionId];
  }

  deleteConnection(connectionId) {
    debug(`Delete connection ${connectionId}`);

    const closedListener = this.closedListeners[connectionId];
    delete this.closedListeners[connectionId];
    this.connections[connectionId].removeListener(closedListener);

    delete this.connections[connectionId];
  }

  getConnections() {
    return Object.keys(this.connections).map(id => this.connections[id].asJson());
  }

  getConnectionById(connectionId) {
    return this.connections[connectionId];
  }

  async listen() {
    const address = await Fastify.listen(this.port, '0.0.0.0');
    console.log(`Connection Manager listening on ${address}`);
  }
}

module.exports = WebRTCConnectionManager;