import Period from "../models/Period.js";
import Pond from "../models/Pond.js";
import { CreateSuccess } from "../utils/success.js";
import { CreateError } from "../utils/error.js";
import jwt from "jsonwebtoken";


//Validated Working
// Retrieve all periods from the database.
export const findAll = (req, res) => {
    Period.find()
        .then(periods => {
            return res.status(200).json(CreateSuccess(200, "Periods retrieved successfully!", periods));
        })
        .catch(err => {
            return res.status(500).json(CreateError(500, "Some error occurred while retrieving periods.", err));
        });
};


//V3 with added validation
//Adds a period to the database.
//The period's start and end date are in Unix timestamps.
//The start date must be before the end date.
//The period name, start date, and end date must be unique.
export const addPeriod = async (req, res) => {
    if(!req.headers['session_token']){
        return res.status(403).json(CreateError(403, "Forbidden"));
      };
    const decoded = jwt.verify(req.headers['session_token'], process.env.TOKEN_SECRET);
    //also check if the decoded token is still valid.
    const currentTime = new Date().getTime();
    if (decoded.exp * 1000 < currentTime) {
      return res.status(403).json(CreateError(403, "Token expired"));
    }
    if (decoded.roles !== 'admin') {
      return res.status(403).json(CreateError(403, "Forbidden"));
    }


    //Request body validation, ensure everything is there.
    if (!req.body.periodName || !req.body.periodStart || !req.body.periodEnd || !req.body.pondId) {
        return res.status(400).json(CreateError(400, "Period name, start date, end date and pond ID are required!"));
    }
    //Converts period start and end date from Unix timestamps to Date objects.
    const startTime = new Date(parseInt(req.body.periodStart) * 1000);
    const endTime = new Date(parseInt(req.body.periodEnd) * 1000);
    //Ensure that the start date is before the end date.
    if (startTime >= endTime) {
        return res.status(601).json(CreateError(601, "Start date must be before end date!"));
    }
    try {
        //Check if pond exists
        const pond = await Pond.findById(req.body.pondId);
        if (!pond) {
            return res.status(404).json(CreateError(404, `Pond with id ${req.body.pondId} not found!`));
        }
        //Check for existing period with the same name
        const existingPeriodByName = await Period.findOne({ periodName: req.body.periodName });
        if (existingPeriodByName) {
            return res.status(602).json(CreateError(602, `Period with name ${req.body.periodName} already exists!`));
        }
        //Check if a period with the same start date and end date already exists in the same pond
        const existingPeriodByDate = await Period.findOne({
            periodStart: startTime,
            periodEnd: endTime,
            pondId: req.body.pondId
        });
        if (existingPeriodByDate) {
            return res.status(603).json(CreateError(603, `Period with start date ${req.body.periodStart} and end date ${req.body.periodEnd} already exists in the same pond!`));
        }
        //Create a period using the request body and the converted start and end date.
        const period = new Period({
            periodName: req.body.periodName,
            periodStart: startTime,
            periodEnd: endTime,
            pondId: req.body.pondId
        });
        //Save period into the db.
        const savedPeriod = await period.save();
        return res.status(201).json(CreateSuccess(201, "Period created successfully!", savedPeriod));
    } catch (err) {
        return res.status(500).json(CreateError(500, "Some error occurred while processing the request.", err));
    }
};

//Validated Working
//Retreive all periods for a specific pond based on the pondId in the req body
export const findAllForPond = (req, res) => {
    const pondId = req.body.id;
    console.log("pondId: ", pondId);
    Period.find({pondId: pondId})
        .then(periods => {
            return res.status(200).json(CreateSuccess(200, "Periods retrieved successfully!", periods));
        })
        .catch(err => {
            return res.status(500).json(CreateError(500, "Some error occurred while retrieving periods.", err));
        });
};

//Validated Working
// Retrieve a specific period based on the periodId in the req body
export const findOnePeriod = (req, res) => {
    const periodId = req.body.id;
    console.log("periodId: ", periodId);
    Period.findById(periodId)
        .then(period => {
            if (!period) {
                return res.status(404).json(CreateError(404, `Period with id ${periodId} not found!`));
            } else {
                return res.status(200).json(CreateSuccess(200, `Period with id ${periodId} retrieved successfully!`, period));
            }
        })
        .catch(err => {
            return res.status(500).json(CreateError(500, "Some error occurred while retrieving period.", err));
        });
};

//Validated Working
// Update a specific period based on the periodId in the req body
export const updatePeriod = async (req, res) => {
    console.log("masuk update");

    //TODO: tambah validasi admin
    // Validate request
    if (!req.body.periodName || !req.body.periodStart || !req.body.periodEnd || !req.body.pondId) {
        return res.status(400).json(CreateError(400, "Period name, start date, end date and pond ID are required!"));
    }

    const startTime = req.body.periodStart;
    const endTime = req.body.periodEnd;
    if (startTime >= endTime) {
        console.log("masuk date time validation");
        return res.status(600).json(CreateError(601, "Start date must be before end date!"));
    }

    try {
        // Check if pond exists
        const pond = await Pond.findById(req.body.pondId);
        if (!pond) {
            return res.status(404).json(CreateError(404, `Pond with id ${req.body.pondId} not found!`));
        }

        // Check if a period with the same name already exists
        const existingPeriodByName = await Period.findOne({ 
            periodName: req.body.periodName,
            _id: { $ne: req.body.id } 
        });
        if (existingPeriodByName) {
            return res.status(400).json(CreateError(400, "Period name already exists!"));
        }

        // Update the period
        const updatedPeriod = await Period.findByIdAndUpdate(req.body.id, req.body, { new: true });
        if (!updatedPeriod) {
            return res.status(404).json(CreateError(404, `Period with id ${req.body.id} not found!`));
        }

        res.json(updatedPeriod);
    } catch (err) {
        console.error(err);
        return res.status(500).json(CreateError(500, "Server Error"));
    }
};


// Delete a specific period based on the periodId in the req body
export const removePeriod = (req, res) => {
    const periodId = req.body.periodId;

    Period.findByIdAndRemove(periodId, {useFindAndModify: false})
        .then(period => {
            if (!period) {
                return res.status(404).json(CreateError(404, `Period with id ${periodId} not found!`));
            } else {
                return res.status(200).json(CreateSuccess(200, `Period with id ${periodId} deleted successfully!`));
            }
        })
        .catch(err => {
            return res.status(500).json(CreateError(500, "Some error occurred while deleting period.", err));
        });
};