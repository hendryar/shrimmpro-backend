//Authentication routes used to handle all authentication related requests.
import express from "express";
import { checkEmail, register, login, update, logout, deleteUser, getAllUsers, getUser} from "../controllers/auth.controller.js";
import bodyParser from "body-parser";

const router = express.Router();

//Use body-parser to parse the incoming request body (if required).
const jsonParser = bodyParser.json();
//The auth routes themselves.
router.post('/check', jsonParser, checkEmail);
router.post('/register', register);
router.post('/login', login);
router.put('/update', update);
router.delete('/delete', deleteUser);
router.post('/logout', logout);
router.post('/all', getAllUsers);
router.post('/user', getUser);


export default router;
