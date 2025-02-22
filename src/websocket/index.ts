import WebSocket from "ws";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { spawn } from "child_process";
import { WaveFile } from "wavefile";

let chunks: Buffer[] = [];

export function handleWebSocketConnection(ws: WebSocket) {
  console.log("New WS connection");
  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString());
    switch (msg.event) {
      case "connected":
        console.log("Call connected");
        break;
      case "start":
        console.log(`Starting media stream ${msg.start?.streamSid}`);
        break;
      case "media":
        handleMedia(msg, ws);
        break;
      case "stop":
        console.log("Call ended");
        break;
    }
  });
}

function handleMedia(msg: any, ws: WebSocket) {
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
      pythonProcess.stdout.on(
        "data",
        (data) => (transcription += data.toString())
      );
      pythonProcess.stderr.on("data", (data) =>
        console.error(`Python error: ${data}`)
      );
      pythonProcess.on("close", () => {
        console.log("Local Whisper transcription:", transcription.trim());
        ws.server.clients.forEach((client) => {
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
}
