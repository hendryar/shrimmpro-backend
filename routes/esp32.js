//Routes for esp32 readings.
import express from 'express';
import bodyParser from 'body-parser';
import { addReadingToDatabase, deleteReadingByPondId, deleteReadingBySerialNumberPasskey } from '../controllers/esp32.controller.js';

const router = express.Router();
//Use body-parser to parse the incoming request body (if required).
const jsonParser = bodyParser.json();

//The esp32 routes themselves.
router.post('/add', jsonParser, addReadingToDatabase);
router.delete('/serial', jsonParser, deleteReadingBySerialNumberPasskey);
router.delete('/delpond', deleteReadingByPondId);


export default router;