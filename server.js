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

  const emitOnlineCount = async (roomId) => {
    const sockets = await io.in(roomId).allSockets();
    io.to(roomId).emit("online", { groupId: roomId, count: sockets.size });
  };

  io.on("connection", (socket) => {
    socket.data.userName = "anon";

    socket.on("identify", ({ userName }) => {
      socket.data.userName = userName || "anon";
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
    });
  });

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`> Ready on http://localhost:${port}`);
    // eslint-disable-next-line no-console
    console.log(`> Socket.io on http://localhost:${port}/socket.io`);
  });
});
