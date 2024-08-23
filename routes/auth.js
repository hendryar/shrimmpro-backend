//Authentication routes used to handle all authentication related requests.
import express from "express";
import { checkEmail, register, login, update} from "../controllers/auth.controller.js";
import bodyParser from "body-parser";

const router = express.Router();

//Use body-parser to parse the incoming request body (if required).
const jsonParser = bodyParser.json();
//The auth routes themselves.
router.post('/check', jsonParser, checkEmail);
router.post('/register', register);
router.post('/login', login);
router.post('/update', update)

export default router;
