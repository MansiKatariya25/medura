const WebSocket = require('ws');
const port = process.env.WS_PORT || 4000;

const wss = new WebSocket.Server({ port }, () => {
  console.log(`WebSocket server listening on ws://localhost:${port}`);
});

// simple in-memory groups map: groupId -> Set of ws
const groups = new Map();

wss.on('connection', (ws) => {
  ws.userId = null;
  ws.groups = new Set();

  ws.on('message', (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch(e) { return; }
    if (data.type === 'identify') {
      ws.userId = data.userId || 'anon';
      ws.userName = data.userName || ws.userId;
      return;
    }
    if (data.type === 'join') {
      const gid = data.groupId;
      if (!groups.has(gid)) groups.set(gid, new Set());
      groups.get(gid).add(ws);
      ws.groups.add(gid);
      // broadcast joined notification to group
      broadcastToGroup(gid, { type: 'notification', groupId: gid, text: `${ws.userName || 'Someone'} joined ${gid}` });
      return;
    }
    if (data.type === 'leave') {
      const gid = data.groupId;
      if (groups.has(gid)) groups.get(gid).delete(ws);
      ws.groups.delete(gid);
      broadcastToGroup(gid, { type: 'notification', groupId: gid, text: `${ws.userName || 'Someone'} left ${gid}` });
      return;
    }
    if (data.type === 'message') {
      const gid = data.groupId;
      broadcastToGroup(gid, { type: 'message', groupId: gid, from: ws.userName || 'anon', text: data.text, time: Date.now() });
      return;
    }
  });

  ws.on('close', () => {
    for (const gid of ws.groups) {
      if (groups.has(gid)) groups.get(gid).delete(ws);
    }
  });
});

function broadcastToGroup(groupId, payload) {
  const set = groups.get(groupId);
  if (!set) return;
  const str = JSON.stringify(payload);
  for (const client of set) {
    if (client.readyState === WebSocket.OPEN) client.send(str);
  }
}

// Demo: periodic announcements to all groups
setInterval(() => {
  for (const gid of groups.keys()) {
    broadcastToGroup(gid, { type: 'announcement', groupId: gid, text: `Health tip for ${gid}: Drink water regularly`, time: Date.now() });
  }
}, 12000);
