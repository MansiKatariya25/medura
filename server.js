/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const next = require("next");
const WebSocket = require("ws");

const port = Number(process.env.PORT || 3000);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const groups = new Map();

function broadcastToGroup(groupId, payload) {
  const set = groups.get(groupId);
  if (!set) return;
  const message = JSON.stringify(payload);
  for (const client of set) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

app.prepare().then(() => {
  const server = http.createServer((req, res) => handle(req, res));
  const wss = new WebSocket.Server({ noServer: true });

  const upgradeHandler = typeof app.getUpgradeHandler === "function"
    ? app.getUpgradeHandler()
    : null;

  wss.on("connection", (ws) => {
    ws.userName = "anon";
    ws.groups = new Set();

    ws.on("message", (msg) => {
      let data;
      try {
        data = JSON.parse(msg);
      } catch {
        return;
      }
      if (data.type === "identify") {
        ws.userName = data.userName || "anon";
        return;
      }
      if (data.type === "join") {
        const gid = data.groupId;
        if (!groups.has(gid)) groups.set(gid, new Set());
        groups.get(gid).add(ws);
        ws.groups.add(gid);
        broadcastToGroup(gid, {
          type: "notification",
          groupId: gid,
          text: `${ws.userName || "Someone"} joined`,
          time: Date.now(),
        });
        return;
      }
      if (data.type === "leave") {
        const gid = data.groupId;
        if (groups.has(gid)) groups.get(gid).delete(ws);
        ws.groups.delete(gid);
        broadcastToGroup(gid, {
          type: "notification",
          groupId: gid,
          text: `${ws.userName || "Someone"} left`,
          time: Date.now(),
        });
        return;
      }
      if (data.type === "message") {
        const gid = data.groupId;
        broadcastToGroup(gid, {
          type: "message",
          groupId: gid,
          from: ws.userName || "anon",
          text: data.text,
          messageId: data.messageId || null,
          authorId: data.authorId || null,
          time: Date.now(),
        });
      }
    });

    ws.on("close", () => {
      for (const gid of ws.groups) {
        if (groups.has(gid)) groups.get(gid).delete(ws);
      }
    });
  });

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    if (pathname === "/ws/community") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
      return;
    }
    if (upgradeHandler) {
      upgradeHandler(req, socket, head);
    } else {
      socket.destroy();
    }
  });

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`> Ready on http://localhost:${port}`);
    // eslint-disable-next-line no-console
    console.log(`> WS on ws://localhost:${port}/ws/community`);
  });
});
