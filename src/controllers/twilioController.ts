import path from "path";
import { Request, Response } from "express";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "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",
});

export const postStream = (req: Request, res: Response) => {
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
};

export const getIndex = (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
};

export const handleIncomingSms = async (req: Request, res: Response) => {
  const messageBody = req.body.Body || "";
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Check if the user's message includes 'win' or 'scam'.",
        },
        { role: "user", content: `Message: "${messageBody}"` },
      ],
    });
    res.send(
      `OpenAI result: ${completion.data.choices[0].message?.content || ""}`
    );
  } catch (error) {
    res.status(500).send("Error using OpenAI");
  }
};
