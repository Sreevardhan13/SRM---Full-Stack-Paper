const { processData } = require("../lib/processor");

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.end(JSON.stringify(payload, null, 2));
}

module.exports = function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    response.end();
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const payload = request.body || {};

  if (!Array.isArray(payload.data)) {
    sendJson(response, 400, {
      error: "Request body must contain a data array.",
    });
    return;
  }

  sendJson(response, 200, processData(payload.data));
};
