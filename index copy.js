
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("dirname: ", __dirname);
console.log("joined dirname: ", path.join(__dirname, '\productimg'));
const app = express();
dotenv.config();


app.use(express.json());
app.use(cors());



// Import auth routes.
import authRoutes from "./routes/auth.js";
app.use('/auth', authRoutes);

// Import pond routes
import pondRoutes from "./routes/pond.js";
app.use('/pond', pondRoutes);

// import esp routes
import espRoutes from "./routes/esp32.js";
app.use('/esp', espRoutes);

// Import Period routes
import periodRoutes from "./routes/period.js";
app.use('/period', periodRoutes);

// Import User Images routes
app.use('/userimg', express.static(path.join(__dirname, 'userimg')));


// Database connection to MongoDB.
const connectMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Database connection successful");
    } catch (error) {
        console.log("Database connection failed");
        throw error;
    }
};

// Start the server and connect to MongoDB.
app.listen(process.env.PORT, () => {
    console.log("Server running on port ", process.env.PORT);
    connectMongoDB();
});