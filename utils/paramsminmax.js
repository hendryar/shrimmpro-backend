
import { CreateError } from './error.js';
//TODO: put in docs

export const minmaxvalidator = (req, res) => {
    if(parseFloat(req.body.safeMinPh) > parseFloat(req.body.safeMaxPh)){
        console.log("PH VAL RUSAK");
        return res.status(601).json(CreateError(601, "Minimum pH cannot be greater than Maximum pH", req.body))
    }
    if(parseFloat(req.body.safeMinTemperature) > parseFloat(req.body.safeMaxTemperature)){
        return res.status(602).json(CreateError(602, "Minimum Temperature cannot be greater than Maximum Temperature", req.body))
    }
    if(parseFloat(req.body.safeMinHeight) > parseFloat(req.body.safeMaxHeight)){
        return res.status(603).json(CreateError(603, "Minimum Height cannot be greater than Maximum Height", req.body))
    }
    if(parseFloat(req.body.safeMinTds) > parseFloat(req.body.safeMaxTds)){
        return res.status(604).json(CreateError(604, "Minimum TDS cannot be greater than Maximum TDS", req.body))
    }
}
