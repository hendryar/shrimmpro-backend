//Index with Websocket
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import http from "http"; // Import for creating an HTTP server
import { Server } from "socket.io"; // Import Socket.io

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("dirname: ", __dirname);
console.log("joined dirname: ", path.join(__dirname, '\productimg'));

dotenv.config();

const app = express();
const server = http.createServer(app); // Create an HTTP server to use with Socket.io
// const io = new Server(server); // Initialize Socket.io

// BARRUUU TODO: tolong we

const io = new Server(server, { cors: { origin: '*' } });

// Middleware
app.use(express.json());
// app.use(cors({
//     origin: "*", // Replace with your React app's URL
//     methods: ["GET", "POST"],
//   }));

// WebSocket connection handler
io.on('connection', (socket) => {
    console.log('A client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Make `io` accessible in your routes
app.set('socketio', io);

// Import auth routes.
import authRoutes from "./routes/auth.js";
app.use('/auth', authRoutes);

// Import pond routes
import pondRoutes from "./routes/pond.js";
app.use('/pond', pondRoutes);

// Import esp32 routes
import espRoutes from "./routes/esp32.js";
app.use('/esp', espRoutes);

// Import period routes
import periodRoutes from "./routes/period.js";
app.use('/period', periodRoutes);

// Serve user images statically
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
server.listen(process.env.PORT, () => { // Use `server.listen` instead of `app.listen`
    console.log("Server running on port ", process.env.PORT);
    connectMongoDB();
});
