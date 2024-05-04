import express from "express";
import http from "http";
import { Server } from "socket.io";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


io.on("connection", (socket) => {
  console.log("a user connected : " + socket.id);
  socket.on("userMessage", (data) => {
    console.log("user IP : " + data.ip);
    socket.broadcast.emit("serverMessage", data);
  });

  socket.on("joined", (data) => {
    console.log("user IP : " + data.ip);
    console.log("joined : ", data);
    socket.broadcast.emit("joinedMessage", data);
  });
  socket.on("Rejoined", (data) => {
    console.log("Rejoined : ", data);
    socket.broadcast.emit("joinedMessage", data);
  });
  socket.on("left", (data) => {
    console.log("left : ", data);
    socket.broadcast.emit("leftMessage", data);
  });
  socket.on("typing", (data) => {
    console.log("typing : ", data);
    socket.broadcast.emit("typingChat", data);
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
