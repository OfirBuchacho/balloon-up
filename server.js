/* Balloon Up! — Game server (stage 4a)
 * Rooms with 4-letter invite codes, host-authoritative balloon physics relay.
 * Run: node server.js  →  http://localhost:3000
 */
"use strict";

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

/* rooms[code] = {
     code, hostId, settings,
     players: { socketId: { name, color, num } },
     started: false
   } */
const rooms = {};

function makeCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O to avoid confusion
  let code;
  do {
    code = Array.from({ length: 4 }, () =>
      letters[Math.floor(Math.random() * letters.length)]
    ).join("");
  } while (rooms[code]);
  return code;
}

function roomOf(socket) {
  for (const code of socket.rooms) {
    if (rooms[code]) return rooms[code];
  }
  return null;
}

function playerList(room) {
  return Object.entries(room.players).map(([id, p]) => ({
    id, name: p.name, color: p.color, num: p.num
  }));
}

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  /* Host creates a room with chosen settings */
  socket.on("createRoom", ({ name, color, settings }, cb) => {
    const code = makeCode();
    rooms[code] = {
      code,
      hostId: socket.id,
      settings: settings || {},
      players: { [socket.id]: { name: name || "Player 1", color: color || 0, num: 1 } },
      started: false
    };
    socket.join(code);
    cb({ ok: true, code, you: 1 });
    console.log("room created:", code);
  });

  /* Guest joins with a code */
  socket.on("joinRoom", ({ code, name, color }, cb) => {
    code = (code || "").toUpperCase().trim();
    const room = rooms[code];
    if (!room) return cb({ ok: false, error: "Room not found" });
    if (Object.keys(room.players).length >= 2)
      return cb({ ok: false, error: "Room is full" });
    if (room.started) return cb({ ok: false, error: "Match already started" });

    room.players[socket.id] = { name: name || "Player 2", color: color ?? 1, num: 2 };
    socket.join(code);
    cb({ ok: true, code, you: 2, settings: room.settings });
    io.to(code).emit("roomUpdate", { players: playerList(room), settings: room.settings });
    console.log("player joined:", code);
  });

  /* Host can change settings in the lobby */
  socket.on("updateSettings", (settings) => {
    const room = roomOf(socket);
    if (!room || room.hostId !== socket.id) return;
    room.settings = settings;
    socket.to(room.code).emit("roomUpdate", { players: playerList(room), settings });
  });

  /* Host starts the match */
  socket.on("startMatch", () => {
    const room = roomOf(socket);
    if (!room || room.hostId !== socket.id) return;
    if (Object.keys(room.players).length < 2) return;
    room.started = true;
    io.to(room.code).emit("matchStarted", { settings: room.settings });
  });

  /* Fast-path relays: sender -> other player in the room */
  socket.on("state", (data) => {          // player position/anim, ~20Hz
    const room = roomOf(socket);
    if (room) socket.to(room.code).emit("state", data);
  });
  socket.on("balloon", (data) => {        // balloon physics from host, ~20Hz
    const room = roomOf(socket);
    if (room) socket.to(room.code).emit("balloon", data);
  });
  socket.on("event", (data) => {          // slaps, points, timer, match end
    const room = roomOf(socket);
    if (room) socket.to(room.code).emit("event", data);
  });

  socket.on("disconnecting", () => {
    for (const code of socket.rooms) {
      const room = rooms[code];
      if (!room) continue;
      delete room.players[socket.id];
      socket.to(code).emit("peerLeft");
      if (Object.keys(room.players).length === 0 || room.hostId === socket.id) {
        delete rooms[code];
        console.log("room closed:", code);
      }
    }
  });
});

server.listen(PORT, () => console.log("Balloon Up! server on port " + PORT));
