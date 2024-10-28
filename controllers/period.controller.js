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
    try {
        if (!req.headers['session_token']) {
            return res.status(403).json(CreateError(403, "Forbidden"));
        }
        const decoded = jwt.verify(req.headers['session_token'], process.env.TOKEN_SECRET);
        if (decoded.roles !== 'admin') {
            return res.status(403).json(CreateError(403, "Forbidden"));
        }
    } catch (error) {
        return res.status(403).json(CreateError(403, "Forbidden", error));
    }

    // Request body validation
    if (!req.body.periodName || !req.body.periodStart) {
        return res.status(400).json(CreateError(400, "Period name and period start are required!"));
    }

    // Convert period start and end dates from Unix timestamps to Date objects
    const startTime = new Date(parseInt(req.body.periodStart) * 1000);
    let endTime = null;
    if (req.body.periodEnd) {
        endTime = new Date(parseInt(req.body.periodEnd) * 1000);
    }

    // // Ensure that the start date is before the end date
    // if (endTime && startTime >= endTime) {
    //     return res.status(601).json(CreateError(601, "Start date must be before end date!"));
    // }

    try {
        // End any currently active periods by setting isActive to false and updating periodEnd to current timestamp
        await Period.updateMany(
            { isActive: true },
            { isActive: false, 
                // periodEnd: new Date()
             }
        );

        // Check for existing period with the same name
        const existingPeriodByName = await Period.findOne({ periodName: req.body.periodName });
        if (existingPeriodByName) {
            return res.status(602).json(CreateError(602, `Period with name ${req.body.periodName} already exists!`));
        }

        // Check if a period with the same start and end dates already exists
        const existingPeriodByDate = await Period.findOne({
            periodStart: startTime
            // periodEnd: endTime,
        });
        if (existingPeriodByDate) {
            return res.status(603).json(CreateError(603, `Period with the same start date already exists!`));
        }

        // Create and save the new period with isActive set to true
        const period = new Period({
            periodName: req.body.periodName,
            periodStart: startTime,
            periodEnd: null,
            isActive: true
        });

        const savedPeriod = await period.save();
        return res.status(201).json(CreateSuccess(201, "Period created successfully!", savedPeriod));
    } catch (err) {
        return res.status(500).json(CreateError(500, "Some error occurred while processing the request.", err));
    }
};



//Validated Working
// Retrieve a specific period based on the periodId in the req body
export const findOnePeriod = (req, res) => {
    
    const periodId = req.query.periodId;
    if(!periodId){
        return res.status(400).json(CreateError(400, "Please enter a period ID"));
    }
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
    try {
        if(!req.headers['session_token']){
            return res.status(403).json(CreateError(403, "Forbidden"));
          };
        const decoded = jwt.verify(req.headers['session_token'], process.env.TOKEN_SECRET);
        //also check if the decoded token is still valid.
        if (decoded.roles !== 'admin') {
          return res.status(403).json(CreateError(403, "Forbidden"));
        }
      } catch (error) {
           return res.status(403).json(CreateError(403, "Forbidden", error))
      }

    const periodId = req.body.periodId;
    if(!periodId){
        return res.status(400).json(CreateError(400, "Please enter a period ID"));
    }

    if (!req.body.periodName || !req.body.periodStart || !req.body.periodEnd) {
        return res.status(400).json(CreateError(400, "Period name, start date, end date and pond ID are required!"));
    }

    const startTime = req.body.periodStart;
    const endTime = req.body.periodEnd;
    if (startTime >= endTime) {
        console.log("masuk date time validation");
        return res.status(600).json(CreateError(601, "Start date must be before end date!"));
    }

    try {

        // Check if a period with the same name already exists
        const existingPeriodByName = await Period.findOne({ 
            periodName: req.body.periodName,
            _id: { $ne: periodId } 
        });
        if (existingPeriodByName) {
            return res.status(400).json(CreateError(400, "Period name already exists!"));
        }

        // Update the period
        const updatedPeriod = await Period.findByIdAndUpdate(periodId, req.body, { new: true });
        if (!updatedPeriod) {
            return res.status(404).json(CreateError(404, `Period with id ${req.body.id} not found!`));
        }

        // res.json(updatedPeriod);

        return res.status(200).json(CreateSuccess(200, "Period Update Succesfully", updatedPeriod));
    } catch (err) {
        console.error(err);
        return res.status(500).json(CreateError(500, "Server Error"));
    }
};


// Delete a specific period based on the periodId in the req body
export const removePeriod = (req, res) => {
    try {
        if(!req.headers['session_token']){
            return res.status(403).json(CreateError(403, "Forbidden"));
          };
        const decoded = jwt.verify(req.headers['session_token'], process.env.TOKEN_SECRET);
        //also check if the decoded token is still valid.
        if (decoded.roles !== 'admin') {
          return res.status(403).json(CreateError(403, "Forbidden"));
        }
      } catch (error) {
           return res.status(403).json(CreateError(403, "Forbidden", error))
      }

    const periodId = req.query.periodId;
    if(!periodId){
        return res.status(400).json(CreateError(400, "Please enter a period ID"));
    }

    Period.findByIdAndDelete(periodId, {useFindAndModify: false})
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


export const endPeriod = async (req, res) => {
    try {
        if (!req.headers['session_token']) {
            return res.status(403).json(CreateError(403, "Forbidden"));
        }
        
        const decoded = jwt.verify(req.headers['session_token'], process.env.TOKEN_SECRET);
        if (decoded.roles !== 'admin') {
            return res.status(403).json(CreateError(403, "Forbidden"));
        }
    } catch (error) {
        return res.status(403).json(CreateError(403, "Forbidden", error));
    }

    try {
        // Find the currently active period
        const activePeriod = await Period.findOne({ isActive: true });
        if (!activePeriod) {
            return res.status(404).json(CreateError(404, "No active period found!"));
        }

        // Set the current timestamp as the end date and mark isActive as false
        activePeriod.periodEnd = new Date();
        activePeriod.isActive = false;

        const updatedPeriod = await activePeriod.save();
        return res.status(200).json(CreateSuccess(200, "Active period ended successfully!", updatedPeriod));
    } catch (err) {
        return res.status(500).json(CreateError(500, "Some error occurred while ending the period.", err));
    }
};



export const activatePeriod = async (req, res) => {
    console.log("activate period initiated");
    try {
        if (!req.headers['session_token']) {
            return res.status(403).json(CreateError(403, "Forbidden"));
        }

        const decoded = jwt.verify(req.headers['session_token'], process.env.TOKEN_SECRET);
        if (decoded.roles !== 'admin') {
            return res.status(403).json(CreateError(403, "Forbidden"));
        }
    } catch (error) {
        return res.status(403).json(CreateError(403, "Forbidden", error));
    }

    console.log("period ID", req.query.periodId);
    const periodId = req.query.periodId;
    if (!periodId) {
        return res.status(400).json(CreateError(400, "Period ID is required!"));
    }

    try {
        // Set any currently active period's isActive flag to false
        await Period.updateMany({ isActive: true }, { isActive: false });

        // Find and activate the specified period
        const period = await Period.findById(periodId);
        if (!period) {
            return res.status(404).json(CreateError(404, `Period with id ${periodId} not found!`));
        }

        period.isActive = true;
        period.periodEnd = null;  // Reset endDate

        const activatedPeriod = await period.save();
        return res.status(200).json(CreateSuccess(200, "Period activated successfully!", activatedPeriod));
    } catch (err) {
        return res.status(500).json(CreateError(500, "Some error occurred while activating the period.", err));
    }
};
