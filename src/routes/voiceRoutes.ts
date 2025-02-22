import { Router } from "express";
import { handleVoice } from "../controllers/voiceController";

const router = Router();
router.post("/", handleVoice);

export default router;
