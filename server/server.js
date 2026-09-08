import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser"
import { connectToDatabase } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";

const app = express();

connectToDatabase();

const allowedOrigins = (process.env.ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(cookieParser())
app.use(express.json())

app.get("/", (req, res)=> res.send("server is Live!"))
app.use('/api/auth', authRouter)

// centralized error handler
app.use((err, _req, res, _next)=>{
    console.error(`[Error] ${err.message}`);
    res.status(500).json({error: err.message})
})

const port = process.env.PORT || 3000;
app.listen(port, ()=>{
    console.log(`Server is running at http://localhost:${port}`)
})