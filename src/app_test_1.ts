import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

dotenv.config();
const app = express();
const recordingsDir = path.join(__dirname, "recordings");

// Transcribe a single file by filename
app.get("/transcribe/:filename", (req, res) => {
  const filePath = path.join(recordingsDir, req.params.filename);
  console.log(filePath)
  if (!fs.existsSync(filePath)) return res.status(404).send("Recording not found");

  const pythonProcess = spawn("python", ["transcribe.py", filePath]);
  let transcription = "";
  pythonProcess.stdout.on("data", data => transcription += data.toString());
  pythonProcess.stderr.on("data", data => console.error(`Python error: ${data}`));
  pythonProcess.on("close", code => {
    if (code !== 0) return res.status(500).send("Transcription failed.");
    res.json({ transcription: transcription.trim() });
  });
});

// Transcribe all recordings in the folder
app.get("/transcribe-all", async (req, res) => {
  try {
    const files = fs.readdirSync(recordingsDir);
    const results = await Promise.all(files.map(file => {
      return new Promise((resolve, reject) => {
        const filePath = path.join(recordingsDir, file);
        const proc = spawn("python", ["transcribe.py", filePath]);
        let text = "";
        proc.stdout.on("data", data => text += data.toString());
        proc.stderr.on("data", data => console.error(`Python error: ${data}`));
        proc.on("close", code => {
          if (code !== 0) return reject(new Error(`Transcription failed for ${file}`));
          resolve({ file, transcription: text.trim() });
        });
      });
    }));
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
