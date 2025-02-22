import { Request, Response } from "express";
import twilio from "twilio";

export const handleVoice = (req: Request, res: Response) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  response.say("Please wait while we connect your call.");
  response.connect().stream({ url: process.env.MEDIA_STREAM_URL || "" });

  res.type("text/xml").send(response.toString());
};
