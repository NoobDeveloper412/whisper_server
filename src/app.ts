import express from "express";
import dotenv from "dotenv";
import WebSocket from "ws";
import { WaveFile } from "wavefile";
import path from "path";
import fs from "fs";
import http from "http";
import { v4 as uuidv4 } from "uuid";
import { spawn } from "child_process";

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
let chunks: Buffer[] = [];

wss.on("connection", (ws) => {
  console.log("New WS connection");
  ws.on("message", async (data) => {
    const msg = JSON.parse(data.toString());
    switch (msg.event) {
      case "connected":
        console.log("Call connected");
        break;
      case "start":
        console.log(`Starting media stream ${msg.start?.streamSid}`);
        break;
      case "media": {
        const twilioData = msg.media.payload;
        const wav = new WaveFile();
        wav.fromScratch(1, 8000, "8m", Buffer.from(twilioData, "base64"));
        wav.fromMuLaw();
        const base64Data = wav.toDataURI().split("base64,")[1];
        chunks.push(Buffer.from(base64Data, "base64").slice(44));
        if (chunks.length >= 5) {
          const buffer = Buffer.concat(chunks);
          chunks = [];
          const tempFile = `temp-${uuidv4()}.wav`;
          fs.writeFileSync(tempFile, buffer);

          try {
            const pythonProcess = spawn("python", ["transcribe.py", tempFile]);
            let transcription = "";
            pythonProcess.stdout.on("data", (data) => {
              transcription += data.toString();
            });
            pythonProcess.stderr.on("data", (data) => {
              console.error(`Python error: ${data}`);
            });
            pythonProcess.on("close", (code) => {
              console.log("Local Whisper transcription:", transcription.trim());
              wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(
                    JSON.stringify({
                      event: "partial-transcription",
                      text: transcription.trim(),
                    })
                  );
                }
              });
              fs.unlinkSync(tempFile);
            });
          } catch (err) {
            console.error("Local Whisper transcription error:", err);
            fs.unlinkSync(tempFile);
          }
        }
        break;
      }
      case "stop":
        console.log("Call ended");
        break;
    }
  });
});

app.post("/", (req, res) => {
  res.set("Content-Type", "text/xml");
  res.send(`
    <Response>
      <Start>
        <Stream name="Audio Stream" url="wss://${req.headers.host}" />
      </Start>
      <Say>The stream has started.</Say>
      <Pause length="30" />
    </Response>
  `);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server on port", PORT));
