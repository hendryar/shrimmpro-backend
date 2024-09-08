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
const io = new Server(server, { cors: { origin: '*' } });

// Middleware
app.use(express.json());
app.use(cors({
//   origin: "*", // Replace with your React app's URL
//   methods: ["GET", "POST"],
}));

// Attach io instance as middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});
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




//Cron job setup

import { getLatestPondTds, getLatestPondTemperature } from './controllers/pond.controller.js';
import Esp32 from './models/esp32.js';
//TODO: FIX FETCHING POND IDNYA NANTI
// Use dynamic import for node-cron
// (async () => {
//   const cron = await import('node-cron');

//   // Start the cron job to check for new Esp32 documents every minute
//   cron.schedule('* * * * *', async () => {
//     try {
//       // ... your cron job logic

//       // Assuming you have an API route for fetching temperature data (replace with your actual route)
//       const response = await axios.get('http://127.0.0.1:3000/pond/temp/latest', {
//         data: {
//           // Retrieve pondId from user information or request object based on authentication
//           pondId: '669fd17d8b77f0adef263e19'
//         }
//       });

//       if (response.data.success && response.data.data) { // Check for successful response and data
//         const latestEsp32 = response.data.data; // Assuming response data structure

//         // Call functions for each reading and emit data via WebSocket
//         getLatestPondTemperature(latestEsp32, server.io);
//         getLatestPondPh(latestEsp32, server.io); // Pass io instance here
//         getLatestPondHeight(latestEsp32, server.io); // Pass io instance here
//         getLatestPondTds(latestEsp32, server.io); // Pass io instance here
//       } else {
//         console.error('Error fetching latest Esp32 data:', response.data.error); // Handle error from API response
//       }
//     } catch (error) {
//       console.error('Error:', error); // Catch general errors
//     }
//   });
// })();


//v2
// (async () => {
//     const cron = await import('node-cron');
  
//     cron.schedule('* * * * *', async () => {
//       try {
//         // ... your other logic
  
//         // Retrieve pondId from the request query parameters
//         const pondId = req.body.pondId;
//         console.log("CROOOON POND ID: ", pondId);
  
//         // ... rest of your cron job logic
//         const latestEsp32 = await Esp32.findOne({ pondId }).sort({ createdAt: -1 }).lean();
  
//         // ... emit temperature data
//       } catch (error) {
//         console.error('Error fetching latest Esp32 data:', error);
//       }
//     });
//   })();


// Use dynamic import for node-cron
(async () => {
  const cron = await import('node-cron');

  // Start the cron job to check for new Esp32 documents every minute
  cron.schedule('* * * * *', async () => {
    try {
      // ... your other logic

      // Retrieve pondId from the request query parameters (assuming you're sending it from the front-end)
      const pondId = req.query.pondId;

      // ... rest of your cron job logic
      const latestEsp32 = await Esp32.findOne({ pondId }).sort({ createdAt: -1 }).lean();

      // ... emit temperature data
      getLatestPondTemperature(latestEsp32, server.io);
      getLatestPondPh(latestEsp32, server.io); // Pass io instance here
      getLatestPondHeight(latestEsp32, server.io); // Pass io instance here
      getLatestPondTds(latestEsp32, server.io); // Pass io instance here
    } catch (error) {
      console.error('Error fetching latest Esp32 data:', error);
    }
  });
})();