import http from "http";
import { app } from "./app";
import WebSocket from "ws";
import { handleWebSocketConnection } from "./websocket";

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", handleWebSocketConnection);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server on port", PORT));
