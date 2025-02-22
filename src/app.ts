import express from "express";
import dotenv from "dotenv";
import { twilioRouter } from "./routes/twilioRoutes";

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/", twilioRouter);

export { app };
