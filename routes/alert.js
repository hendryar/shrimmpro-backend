import express from 'express';
import {findAll, findId, alertTime} from "../controllers/alert.controller.js";


const router = express.Router();
router.get('/', findId);
router.get('/all',findAll);
router.get('/time', alertTime);

export default router;