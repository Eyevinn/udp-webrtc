# UDP-WEBRTC

This NPM library provides you with a WebRTC server that listens on UDP ports to receive audio and video and re-stream this using WebRTC to a browser. Together with an SRT to UDP gateway that can be accomplished using `ffmpeg` you would solve the use case: SRT to WebRTC.

## Install

```
npm install --save @eyevinn/udp-webrtc
```

## Example

Example client / server implementation in the `example` folder in this repository.

```
const Server = require('@eyevinn/udp-webrtc');

const server = new Server();
server.start();
```

The server provides a REST API for the RTC connection negotiation between the client and server. The UDP server listens on two ports, one for video and another one for audio. Default ports are 2234 and 2235.

Example when using ffmpeg as an SRT to UDP gateway.

```
ffmpeg -i srt://0.0.0.0:1234?pkt_size=1316&mode=listener -c:v rawvideo -an -pix_fmt yuv420p -f rawvideo udp://<IP>:2234?pkt_size=1316
```

## LICENSE

This project is still *work in progress* but will be made available under Apache-2.0 open source license.