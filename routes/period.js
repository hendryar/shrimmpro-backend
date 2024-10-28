//Routes for periods.
import express from "express";
import bodyparser from "body-parser";
import { addPeriod, findOnePeriod, updatePeriod, removePeriod, findAll, endPeriod, activatePeriod } from "../controllers/period.controller.js";

const router = express.Router();
//Use body-parser to parse the incoming request body (if required).
const jsonParser = bodyparser.json();
//The period routes themselves.
router.post("/", jsonParser, addPeriod);
router.get("/", findOnePeriod);
router.get("/all", findAll);
router.put("/", jsonParser, updatePeriod);
router.delete("/", removePeriod);
router.post("/end", endPeriod);
router.post("/start", activatePeriod);


export default router;