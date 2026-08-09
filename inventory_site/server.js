const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const { spawn } = require("child_process");

const root = __dirname;
const dataFile = path.join(root, "data.json");
const usersFile = path.join(root, "users.json");
const port = Number(process.env.PORT || 4173);
const loginUser = process.env.INVENTORY_USER || "admin";
const loginPassword = process.env.INVENTORY_PASSWORD || "1234";
const sessionCookieName = "inventory_session";
const sessions = new Map();

const seedData = {
  settings: {
    warehouseName: "실재고 조사",
    managerName: "Counter",
    currencyUnit: "KRW",
    lowStockDefault: 0
  },
  products: [],
  movements: [],
  stocktake: {
    counts: {},
    updatedAt: ""
  }
};

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function ensureDataFile() {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(seedData, null, 2), "utf8");
  }
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 100_000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, expected] = String(stored || "").split(":");
  if (!salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(String(password), salt, 100_000, 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

function ensureUsersFile() {
  if (!fs.existsSync(usersFile)) {
    const users = [{ username: loginUser, passwordHash: hashPassword(loginPassword), createdAt: new Date().toISOString() }];
    fs.writeFileSync(usersFile, JSON.stringify({ users }, null, 2), "utf8");
  }
}

function readUsers() {
  ensureUsersFile();
  const data = JSON.parse(fs.readFileSync(usersFile, "utf8"));
  return Array.isArray(data.users) ? data.users : [];
}

function writeUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify({ users }, null, 2), "utf8");
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function readBinaryBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 25_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function runExcelImport(excelPath) {
  const scriptPath = path.join(root, "tools", "import_inventory_excel.py");
  const candidates = [process.env.PYTHON, "python", "py"].filter(Boolean);

  return new Promise((resolve, reject) => {
    let index = 0;

    const runNext = () => {
      if (index >= candidates.length) {
        reject(new Error("Python executable not found"));
        return;
      }

      const command = candidates[index++];
      const args = command === "py" ? ["-3", scriptPath, excelPath] : [scriptPath, excelPath];
      const child = spawn(command, args, { cwd: root, windowsHide: true });
      let output = "";
      let errorOutput = "";
      let spawnFailed = false;

      child.stdout.on("data", (chunk) => {
        output += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        errorOutput += chunk.toString();
      });
      child.on("error", () => {
        spawnFailed = true;
        runNext();
      });
      child.on("close", (code) => {
        if (spawnFailed) return;
        if (code === 0) resolve(output);
        else reject(new Error(errorOutput || output || `Excel import failed with code ${code}`));
      });
    };

    runNext();
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || "").split(";").map((pair) => {
    const [key, ...value] = pair.trim().split("=");
    return [key, decodeURIComponent(value.join("="))];
  }).filter(([key]) => key));
}

function getSessionUser(req) {
  const token = parseCookies(req)[sessionCookieName];
  return token ? sessions.get(token) || "" : "";
}

function isAuthenticated(req) {
  return Boolean(getSessionUser(req));
}

function sendUnauthorized(res) {
  sendJson(res, 401, { error: "Unauthorized" });
}

function sendFile(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.resolve(root, `.${pathname}`);

  if (!filePath.startsWith(root + path.sep) && filePath !== root) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": mime[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(data);
  });
}

ensureDataFile();
ensureUsersFile();

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === "/api/session" && req.method === "GET") {
      const username = getSessionUser(req);
      sendJson(res, 200, { authenticated: Boolean(username), username });
      return;
    }

    if (req.url === "/api/login" && req.method === "POST") {
      const data = await readJsonBody(req);
      const username = String(data.username || "").trim();
      const user = readUsers().find((item) => item.username.toLowerCase() === username.toLowerCase());
      if (!user || !verifyPassword(data.password, user.passwordHash)) {
        sendJson(res, 401, { error: "Invalid credentials" });
        return;
      }
      const token = crypto.randomBytes(24).toString("hex");
      sessions.set(token, user.username);
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Set-Cookie": `${sessionCookieName}=${token}; HttpOnly; SameSite=Lax; Path=/`
      });
      res.end(JSON.stringify({ ok: true, username: user.username }));
      return;
    }

    if (req.url === "/api/signup" && req.method === "POST") {
      const data = await readJsonBody(req);
      const username = String(data.username || "").trim();
      const password = String(data.password || "");
      if (!/^[A-Za-z0-9._-]{3,24}$/.test(username) || password.length < 4) {
        sendJson(res, 400, { error: "Invalid signup data" });
        return;
      }
      const users = readUsers();
      if (users.some((item) => item.username.toLowerCase() === username.toLowerCase())) {
        sendJson(res, 409, { error: "User already exists" });
        return;
      }
      users.push({ username, passwordHash: hashPassword(password), createdAt: new Date().toISOString() });
      writeUsers(users);
      sendJson(res, 201, { ok: true });
      return;
    }

    if (req.url === "/api/logout" && req.method === "POST") {
      const token = parseCookies(req)[sessionCookieName];
      if (token) sessions.delete(token);
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Set-Cookie": `${sessionCookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
      });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.url.startsWith("/api/") && !isAuthenticated(req)) {
      sendUnauthorized(res);
      return;
    }

    if (req.url === "/api/state" && req.method === "GET") {
      ensureDataFile();
      sendJson(res, 200, JSON.parse(fs.readFileSync(dataFile, "utf8")));
      return;
    }

    if (req.url === "/api/state" && req.method === "PUT") {
      const data = await readJsonBody(req);
      if (!data || !Array.isArray(data.products) || !Array.isArray(data.movements) || !data.settings) {
        sendJson(res, 400, { error: "Invalid inventory state" });
        return;
      }
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), "utf8");
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.url === "/api/import-excel" && req.method === "POST") {
      const body = await readBinaryBody(req);
      if (!body.length) {
        sendJson(res, 400, { error: "Excel file is required" });
        return;
      }

      const uploadDir = path.join(os.tmpdir(), "inventory-site-uploads");
      fs.mkdirSync(uploadDir, { recursive: true });
      const uploadPath = path.join(uploadDir, `inventory-${Date.now()}.xlsx`);
      fs.writeFileSync(uploadPath, body);

      try {
        await runExcelImport(uploadPath);
        const importedState = JSON.parse(fs.readFileSync(dataFile, "utf8"));
        sendJson(res, 200, { ok: true, state: importedState });
      } finally {
        fs.rm(uploadPath, { force: true }, () => {});
      }
      return;
    }

    if (req.url === "/api/reset" && req.method === "POST") {
      fs.writeFileSync(dataFile, JSON.stringify(seedData, null, 2), "utf8");
      sendJson(res, 200, seedData);
      return;
    }

    sendFile(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Inventory site running at http://0.0.0.0:${port}`);
});
