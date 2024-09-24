// Index with Websocket
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import http from "http"; // Import for creating an HTTP server
import { Server } from "socket.io"; // Import Socket.io

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();
const server = http.createServer(app); // Create an HTTP server to use with Socket.io

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: '*', // Replace with your frontend URL
  }
});

// Middleware
app.use(express.json());

// Configure CORS for Express
app.use(cors({
  origin: '*', // Replace with your frontend URL
}));

// Make io accessible in request handlers
app.set('socketio', io);

// Import auth routes
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

// Database connection to MongoDB
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Database connection successful");
  } catch (error) {
    console.log("Database connection failed");
    throw error;
  }
};

// Start the server and connect to MongoDB
server.listen(process.env.PORT || 5000, () => { // Default to port 5000 if PORT is not defined
  console.log("Server running on port", process.env.PORT || 5000);
  connectMongoDB();
});

// Handle Socket.io connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for clients joining a pond room
  socket.on('join-pond', ({ pondId }) => {
    socket.join(pondId);
    console.log(`User ${socket.id} joined pond room: ${pondId}`);
  });

  // Handle client disconnections
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
