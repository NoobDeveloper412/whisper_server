import { Router } from "express";
import { postStream, getIndex, handleIncomingSms } from "../controllers/twilioController";

const router = Router();

router.post("/", postStream);
router.get("/", getIndex);
router.post("/incoming-sms", handleIncomingSms);

export { router as twilioRouter };
