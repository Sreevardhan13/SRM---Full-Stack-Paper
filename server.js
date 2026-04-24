const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const identity = {
  user_id: process.env.USER_ID || "fullname_ddmmyyyy",
  email_id: process.env.EMAIL_ID || "your.email@college.edu",
  college_roll_number: process.env.COLLEGE_ROLL_NUMBER || "YOUR_ROLL_NUMBER",
};

function normalizeEntry(entry) {
  return String(entry ?? "").trim();
}

function isValidEdge(edge) {
  return /^[A-Z]->[A-Z]$/.test(edge) && edge[0] !== edge[3];
}

function buildNestedTree(root, childrenByParent) {
  const children = childrenByParent.get(root) || [];
  const branch = {};

  for (const child of children) {
    Object.assign(branch, buildNestedTree(child, childrenByParent));
  }

  return { [root]: branch };
}

function getDepth(root, childrenByParent) {
  const children = childrenByParent.get(root) || [];
  if (children.length === 0) return 1;
  return 1 + Math.max(...children.map((child) => getDepth(child, childrenByParent)));
}

function hasDirectedCycle(nodes, childrenByParent) {
  const visiting = new Set();
  const visited = new Set();

  function visit(node) {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;

    visiting.add(node);
    for (const child of childrenByParent.get(node) || []) {
      if (visit(child)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  }

  return [...nodes].some((node) => visit(node));
}

function getComponents(nodes, undirectedNeighbors) {
  const seen = new Set();
  const components = [];

  for (const node of [...nodes].sort()) {
    if (seen.has(node)) continue;

    const stack = [node];
    const component = new Set();
    seen.add(node);

    while (stack.length > 0) {
      const current = stack.pop();
      component.add(current);

      for (const next of undirectedNeighbors.get(current) || []) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }

    components.push(component);
  }

  return components;
}

function processData(input) {
  const invalid_entries = [];
  const duplicate_edges = [];
  const duplicateReported = new Set();
  const seenEdges = new Set();
  const parentByChild = new Map();
  const acceptedEdges = [];

  for (const rawEntry of input) {
    const edge = normalizeEntry(rawEntry);

    if (!isValidEdge(edge)) {
      invalid_entries.push(edge);
      continue;
    }

    if (seenEdges.has(edge)) {
      if (!duplicateReported.has(edge)) {
        duplicate_edges.push(edge);
        duplicateReported.add(edge);
      }
      continue;
    }

    seenEdges.add(edge);

    const parent = edge[0];
    const child = edge[3];

    if (parentByChild.has(child)) {
      continue;
    }

    parentByChild.set(child, parent);
    acceptedEdges.push({ parent, child });
  }

  const nodes = new Set();
  const childrenByParent = new Map();
  const undirectedNeighbors = new Map();

  function ensureNode(node) {
    nodes.add(node);
    if (!childrenByParent.has(node)) childrenByParent.set(node, []);
    if (!undirectedNeighbors.has(node)) undirectedNeighbors.set(node, []);
  }

  for (const { parent, child } of acceptedEdges) {
    ensureNode(parent);
    ensureNode(child);
    childrenByParent.get(parent).push(child);
    undirectedNeighbors.get(parent).push(child);
    undirectedNeighbors.get(child).push(parent);
  }

  for (const children of childrenByParent.values()) {
    children.sort();
  }

  const hierarchies = [];
  const components = getComponents(nodes, undirectedNeighbors);

  for (const component of components) {
    const sortedNodes = [...component].sort();
    const roots = sortedNodes.filter((node) => !parentByChild.has(node));
    const root = roots[0] || sortedNodes[0];
    const cyclic = hasDirectedCycle(component, childrenByParent);

    if (cyclic) {
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
      });
      continue;
    }

    hierarchies.push({
      root,
      tree: buildNestedTree(root, childrenByParent),
      depth: getDepth(root, childrenByParent),
    });
  }

  let largest_tree_root = "";
  let largestDepth = -1;
  for (const hierarchy of hierarchies) {
    if (hierarchy.has_cycle) continue;
    if (
      hierarchy.depth > largestDepth ||
      (hierarchy.depth === largestDepth && hierarchy.root < largest_tree_root)
    ) {
      largestDepth = hierarchy.depth;
      largest_tree_root = hierarchy.root;
    }
  }

  return {
    ...identity,
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees: hierarchies.filter((hierarchy) => !hierarchy.has_cycle).length,
      total_cycles: hierarchies.filter((hierarchy) => hierarchy.has_cycle).length,
      largest_tree_root,
    },
  };
}

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
