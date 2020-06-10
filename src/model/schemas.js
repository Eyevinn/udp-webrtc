const schemaConnection = require('./schema_connection.js');

const API_SCHEMA = {
  'GET/connections': {
    description: "Get a list of connections",
    response: {
      200: {
        description: "On success returns an array of connections",
        type: "array",
        items: schemaConnection()
      }
    }
  }
};

const schemas = (method, path) => {
  return API_SCHEMA[method + path] ? { schema: API_SCHEMA[method + path] } : {};
}

module.exports = schemas;