import express from 'express';
import {findAll, findId, alertTime, alertWithinDay} from "../controllers/alert.controller.js";


const router = express.Router();
router.get('/', findId);
router.get('/all',findAll);
router.get('/time', alertTime);
router.get('/count', alertWithinDay);

export default router;