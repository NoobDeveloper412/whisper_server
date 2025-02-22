import { Router } from "express";
import { handleSMS } from "../controllers/smsController";

const router = Router();
router.post("/", handleSMS);

export default router;
