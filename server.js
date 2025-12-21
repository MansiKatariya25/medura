/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const next = require("next");
const { Server } = require("socket.io");

const port = Number(process.env.PORT || 3000);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
app.prepare().then(() => {
  const server = http.createServer((req, res) => handle(req, res));
  const io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: "*",
    },
  });

  const userSockets = new Map();
  const onlineUsers = new Set();

  const emitOnlineCount = async (roomId) => {
    const sockets = await io.in(roomId).allSockets();
    io.to(roomId).emit("online", { groupId: roomId, count: sockets.size });
  };

  io.on("connection", (socket) => {
    socket.data.userName = "anon";
    socket.data.userId = null;

    socket.on("identify", ({ userName }) => {
      socket.data.userName = userName || "anon";
      if (socket.data.userId) {
        userSockets.set(socket.data.userId, socket.id);
      }
    });

    socket.on("identify-user", ({ userId, userName, role }) => {
      socket.data.userId = userId || null;
      socket.data.userName = userName || "anon";
      socket.data.role = role || null;
      if (userId) {
        userSockets.set(userId, socket.id);
        onlineUsers.add(userId);
        io.emit("presence:update", { userId, status: "online" });
      }
    });

    socket.on("join", async ({ groupId }) => {
      if (!groupId) return;
      await socket.join(groupId);
      io.to(groupId).emit("notification", {
        groupId,
        text: `${socket.data.userName || "Someone"} joined`,
        time: Date.now(),
      });
      emitOnlineCount(groupId);
    });

    socket.on("leave", async ({ groupId }) => {
      if (!groupId) return;
      await socket.leave(groupId);
      io.to(groupId).emit("notification", {
        groupId,
        text: `${socket.data.userName || "Someone"} left`,
        time: Date.now(),
      });
      emitOnlineCount(groupId);
    });

    socket.on("message", ({ groupId, text, messageId, authorId }) => {
      if (!groupId || !text) return;
      io.to(groupId).emit("message", {
        groupId,
        from: socket.data.userName || "anon",
        text,
        messageId: messageId || null,
        authorId: authorId || null,
        time: Date.now(),
      });
    });

    socket.on("call:invite", ({ toUserId, roomName, pricePerMinute, callerName, callerId }) => {
      const target = toUserId ? userSockets.get(toUserId) : null;
      if (target) {
        io.to(target).emit("call:incoming", {
          roomName,
          pricePerMinute,
          callerName: callerName || socket.data.userName || "Caller",
          callerId: callerId || socket.data.userId || null,
        });
      }
    });

    socket.on("call:answer", ({ toUserId, roomName }) => {
      const target = toUserId ? userSockets.get(toUserId) : null;
      if (target) {
        io.to(target).emit("call:answered", { roomName });
      }
    });

    socket.on("call:signal", ({ toUserId, roomName, signal }) => {
      const target = toUserId ? userSockets.get(toUserId) : null;
      if (target) {
        io.to(target).emit("call:signal", {
          roomName,
          signal,
          fromUserId: socket.data.userId || null,
        });
      }
    });

    socket.on("call:decline", ({ toUserId, roomName }) => {
      const target = toUserId ? userSockets.get(toUserId) : null;
      if (target) {
        io.to(target).emit("call:declined", { roomName });
      }
    });

    socket.on("call:end", ({ toUserId, roomName }) => {
      const target = toUserId ? userSockets.get(toUserId) : null;
      if (target) {
        io.to(target).emit("call:ended", { roomName });
      }
    });

    socket.on("call:offer", ({ toUserId, roomName, sdp, callerId, callerName }) => {
      const target = toUserId ? userSockets.get(toUserId) : null;
      if (target) {
        io.to(target).emit("call:offer", {
          roomName,
          sdp,
          callerId: callerId || socket.data.userId || null,
          callerName: callerName || socket.data.userName || "Caller",
        });
      }
    });

    socket.on("call:answer", ({ toUserId, roomName, sdp }) => {
      const target = toUserId ? userSockets.get(toUserId) : null;
      if (target) {
        io.to(target).emit("call:answer", { roomName, sdp });
      }
    });

    socket.on("call:ice", ({ toUserId, roomName, candidate }) => {
      const target = toUserId ? userSockets.get(toUserId) : null;
      if (target && candidate) {
        io.to(target).emit("call:ice", { roomName, candidate });
      }
    });

    socket.on("disconnecting", () => {
      const rooms = Array.from(socket.rooms).filter((roomId) => roomId !== socket.id);
      rooms.forEach((roomId) => {
        io.to(roomId).emit("notification", {
          groupId: roomId,
          text: `${socket.data.userName || "Someone"} left`,
          time: Date.now(),
        });
      });
      rooms.forEach((roomId) => emitOnlineCount(roomId));
      if (socket.data.userId) {
        userSockets.delete(socket.data.userId);
        onlineUsers.delete(socket.data.userId);
        io.emit("presence:update", { userId: socket.data.userId, status: "offline" });
      }
    });

    socket.on("presence:request", () => {
      socket.emit("presence:online-list", { userIds: Array.from(onlineUsers) });
    });
  });

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`> Ready on http://localhost:${port}`);
    // eslint-disable-next-line no-console
    console.log(`> Socket.io on http://localhost:${port}/socket.io`);
  });
});
