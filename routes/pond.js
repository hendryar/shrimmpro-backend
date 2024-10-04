//Pond routes used to handle all pond related requests.
import express from "express";
import bodyParser from "body-parser";

import {
  create,
  setPondMinMax,
  findPond,
  getPondById,
  findAll,
  update,
  addEspToPond,
  getPondReading,
  getPondHighLow,
  deleteOne,
  getPondInfo,
  removeEspFromPond,
  getPondReadingPastWeek,
  getAllPondReadingPastWeek,
  getLatestPondHeight,
  getLatestPondPh,
  getLatestPondReading,
  getLatestPondTds,
  getLatestPondTemperature,
  getPondHeightTime,
  getPondPhTime,
  getPondTdsTime,
  getPondTemperatureTime,
  getPondReadingByDate,
} from "../controllers/pond.controller.js";

const router = express.Router();
//Use body-parser to parse the incoming request body (if required).
const jsonParser = bodyParser.json();
//The pond routes themselves.
router.post("/create", jsonParser, create);
router.post("/minmax", jsonParser, setPondMinMax);
router.get("/:pondId", getPondById);
router.get("/name", findPond);
router.get("/", findAll);
router.put("/update", update);
router.post("/addesp", jsonParser, addEspToPond);
router.get("/r", getPondReading);
router.get("/hl", getPondHighLow);
router.delete("/", jsonParser, deleteOne);
router.get("/info", getPondInfo);
router.delete("/delesp", removeEspFromPond);
router.get("/r/week", getPondReadingPastWeek);
router.get("/r/week/all", getAllPondReadingPastWeek);
router.get("/r/latest", getLatestPondReading);
router.get("/h/latest", getLatestPondHeight);
router.get("/h/time", getPondHeightTime);
router.get("/ph/latest", getLatestPondPh);
router.get("/ph/time", getPondPhTime);
router.get("/tds/latest", getLatestPondTds);
router.get("/tds/time", getPondTdsTime);
router.get("/temp/latest", getLatestPondTemperature);
router.get("/temp/time", getPondTemperatureTime);
router.get("/r/date", getPondReadingByDate);

export default router;
