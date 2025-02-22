import { Request, Response } from "express";
import twilio from "twilio";

export const handleSMS = (req: Request, res: Response) => {
  const incomingMessage = req.body.Body || "";
  console.log("Received SMS:", incomingMessage);

  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();
  res.type("text/xml").send(twiml.toString());
};
