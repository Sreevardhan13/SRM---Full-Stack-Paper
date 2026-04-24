const http = require("http");
const fs = require("fs");
const path = require("path");
const { processData } = require("./lib/processor");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(payload, null, 2));
}

function serveStatic(request, response) {
  const requestPath = request.url === "/" ? "/index.html" : request.url;
  const resolvedPath = path.normalize(path.join(PUBLIC_DIR, requestPath));

  if (!resolvedPath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(resolvedPath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const ext = path.extname(resolvedPath);
    const contentTypes = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
    };

    response.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
    });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    response.end();
    return;
  }

  if (request.method === "POST" && request.url === "/bfhl") {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");

        if (!Array.isArray(payload.data)) {
          sendJson(response, 400, {
            error: "Request body must contain a data array.",
          });
          return;
        }

        sendJson(response, 200, processData(payload.data));
      } catch (error) {
        sendJson(response, 400, {
          error: "Invalid JSON request body.",
        });
      }
    });
    return;
  }

  if (request.method === "GET") {
    serveStatic(request, response);
    return;
  }

  response.writeHead(405, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  response.end(JSON.stringify({ error: "Method not allowed." }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`SRM BFHL app running at http://localhost:${PORT}`);
  });
}

module.exports = {
  processData,
  server,
};
