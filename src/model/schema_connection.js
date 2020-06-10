module.exports = () => ({
  description: "A connection",
  type: "object",
  properties: {
    id: { type: "string" },
    localDescription: {
      type: "object",
      properties: {
        type: { type: "string" },
        sdp: { type: "string" }
      }
    },
    remoteDescription: {
      type: "object",
      properties: {
        type: { type: "string" },
        sdp: { type: "string" }
      }
    },
  }
})