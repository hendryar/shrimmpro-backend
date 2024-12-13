import Pond from "../models/Pond.js";
import { CreateSuccess } from "../utils/success.js";
import { CreateError } from "../utils/error.js";
import Esp32 from "../models/esp32.js";
import dotenv from "dotenv";
import Period from "../models/Period.js";
import { minmaxvalidator } from "../utils/paramsminmax.js";
import { removePeriod } from "./period.controller.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

//Verified Working
//Add pond to the database.

export const create = async (req, res) => {
    try {
      console.log("req.body: ", req.body);
  
      // Request validation, ensure its not empty
      if (req.body.connectedEsp32Serial && !req.body.connectedEsp32Passkey) {
        return res.status(400).json(CreateError(400, "Passkey is required!"));
      }
      if (!req.body.connectedEsp32Serial && req.body.connectedEsp32Passkey) {
        return res.status(400).json(CreateError(400, "Serial Number is required!"));
      }
  
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
  
      // Validate if an esp32 is already connected to the pond
      if (req.body.connectedEsp32Serial && req.body.connectedEsp32Passkey) {
        const existingEsp32 = await Pond.findOne({
          connectedEsp32Serial: req.body.connectedEsp32Serial,
          connectedEsp32Passkey: req.body.connectedEsp32Passkey,
        });
  
        if (existingEsp32) {
          console.log("ESP32 already connected to another Pond!");
          return res.status(400).json(CreateError(400, "ESP32 already connected to another Pond!"));
        }
      }
  
      // Validate if req.body.name is already in the database
      const existingPond = await Pond.findOne({ name: req.body.name });
      if (existingPond) {
        console.log("Name already exists!");
        return res.status(400).json(CreateError(400, "Name already exists!"));
      }
  
      // Continue with validation
      const minmax = minmaxvalidator(req, res);
      if (minmax) {
        return minmax;
      }
  
      const pond = new Pond({
        name: req.body.name,
        area: req.body.area,
        shrimpbreed: req.body.shrimpbreed,
        tonnage: req.body.tonnage,
        connectedEsp32Serial: req.body.connectedEsp32Serial || null,
        connectedEsp32Passkey: req.body.connectedEsp32Passkey || null,
        safeMinPh: req.body.safeMinPh || 6.5,
        safeMaxPh: req.body.safeMaxPh || 8.5,
        safeMinTemperature: req.body.safeMinTemperature || 25,
        safeMaxTemperature: req.body.safeMaxTemperature || 40,
        safeMinHeight: req.body.safeMinHeight || 40,
        safeMaxHeight: req.body.safeMaxHeight || 200,
        safeMinTds: req.body.safeMinTds || 200,
        safeMaxTds: req.body.safeMaxTds || 1000,
        userId: req.body.userId,
      });
  
      console.log("Saving pond:", pond);
  
      // Save the pond entity to the database
      const savedPond = await pond.save();
      return res.status(201).json(CreateSuccess(201, "Pond created successfully!", savedPond));
  
    } catch (err) {
      console.error("Error occurred:", err);
      return res.status(500).json(CreateError(500, "Some error occurred while creating the Pond.", err));
    }
  };
  

//Working
//Set the minimum 
export const setPondMinMax = (req, res) => {
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

    if(!req.body.pondId || !req.body.safeMinPh || !req.body.safeMaxPh || !req.body.safeMinTemperature || !req.body.safeMaxTemperature || !req.body.safeMinHeight || !req.body.safeMaxPh || !req.body.safeMinTds || !req.body.safeMaxTds){
        return res.status(400).json(CreateError(400, "Parameters should be filled"))
    }
    //Read the values from the request body.
    const id = req.body.pondId;
    const safeMinPh = req.body.safeMinPh;
    const safeMaxPh = req.body.safeMaxPh;
    const safeMinTemperature = req.body.safeMinTemperature;
    const safeMaxTemperature = req.body.safeMaxTemperature;
    const safeMinHeight = req.body.safeMinHeight;
    const safeMaxHeight = req.body.safeMaxHeight;
    const safeMinTds = req.body.safeMinTds;
    const safeMaxTds = req.body.safeMaxTds;
    //Validate if the id is empty
    if (!id) {
        return res.status(400).json(CreateError(400, "Id can not be empty!"));
    }

    //Find a pond with the specified id.
    Pond.findById(id)
        .then(pond => {
            if (!pond) {
                //Return null if the pond is not found.
                return res.status(404).json(CreateError(404, "Pond not found!", err));
            } else {
                //Update the pond with the new values
                Pond.findByIdAndUpdate(id, {
                    safeMinPh: safeMinPh || 6.5,
                    safeMaxPh: safeMaxPh || 8.5,
                    safeMinTemperature: safeMinTemperature || 25,
                    safeMaxTemperature: safeMaxTemperature || 40,
                    safeMinHeight: safeMinHeight || 40,
                    safeMaxHeight: safeMaxHeight || 200,
                    safeMinTds: safeMinTds || 200,
                    safeMaxTds: safeMaxTds || 1000
                }, {useFindAndModify: false})
                    .then(data => {
                        if (!data) {
                            return res.status(404).json(CreateError(404, `Cannot update Pond with id=${id}. Maybe Pond was not found!`));
                        } else 
                        return res.status(200).json(CreateSuccess(200, "Pond min max values updated successfully!", data));
                    })
                    .catch(err => {
                        return res.status(500).json(CreateError(500, "Error updating Pond with id=" + id));
                    });
            }
        })
        .catch(err => {
            return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
        });
}

//Validated Working
//Finds a single pond by name
export const findPond = (req, res) => {
    const name = req.body.name;
    var condition = name ? {name: {$regex: new RegExp(name), $options: "i"}} : {};

    Pond.find(condition)
        .then(data => {
            return res.status(200).json(CreateSuccess(200, "Pond retrieved successfully!", data));
        })
        .catch(err => {
            return res.status(500).json(CreateError(500, err.message || "Some error occurred while retrieving Ponds.", err));
        }
    );
}

//Validated Working
//Finds a single pond by ID
export const getPondById = (req, res) => {
    const id = req.query.pondId;
    console.log("masuk id: ", id);
    Pond.findById(id).then(data => {
        console.log("data: ", data);
        if (data){
            return res.status(200).json(CreateSuccess(200, "Pond retrieved successfully!", data));   
        }
        else {
            console.log("Not found Pond with id " + id);
            return res.status(404).json(CreateError(404, "No Corresponding Pond Found.", null ));
        }
    })
    .catch(err => {
        return res.status(500).json(CreateError(500, "Error retrieving Pond with id=" + id, err));
    });
}

//Validated Working
//Retrieve all Ponds from the database.
export const findAll = (req, res) => {
    console.log("finding all ponds kepanggil");
    Pond.find()
        .then(data => {
            return res.status(200).json(CreateSuccess(200, "Pond retrieved successfully!", data));
        })
        .catch(err => {
            return res.status(500).json(CreateError(500, err.message || "Some error occurred while retrieving Ponds.", err));
        });
}

//Untested
// Update a Pond by the id in the request
export const update = async (req, res) => {

    console.log("DATA MASUK UPDATE: ", req.body);
    try {
        // Check session token and role
        if (!req.headers['session_token']) {
            return res.status(403).json(CreateError(403, "Forbidden"));
        }
        const decoded = jwt.verify(req.headers['session_token'], process.env.TOKEN_SECRET);
        if (decoded.roles !== 'admin') {
            return res.status(403).json(CreateError(403, "Forbidden"));
        }

        // Check if the request body is not empty
        if (!req.body) {
            return res.status(400).json(CreateError(400, "Data to update cannot be empty!"));
        }

        const { pondId, connectedEsp32Serial, connectedEsp32Passkey, name } = req.body;

        // Validate ESP32 pairing
        if (connectedEsp32Serial && !connectedEsp32Passkey) {
            return res.status(400).json(CreateError(400, "Passkey is required!"));
        }
        if (!connectedEsp32Serial && connectedEsp32Passkey) {
            return res.status(400).json(CreateError(400, "Serial Number is required!"));
        }

        // Check if the ESP32 serial and passkey are already connected to another pond
        if (connectedEsp32Serial && connectedEsp32Passkey) {
            const existingEsp32 = await Pond.findOne({
                connectedEsp32Serial,
                _id: { $ne: pondId }  // Exclude the current pond from the check
            });

            if (existingEsp32) {
                return res.status(400).json(CreateError(400, "ESP32 already connected to another Pond!"));
            }
        }

        // Check if the pond name is unique (if updating the name)
        if (name) {
            const existingPond = await Pond.findOne({ name, _id: { $ne: pondId } });
            if (existingPond) {
                return res.status(400).json(CreateError(400, "Name already exists!"));
            }
        }

        // Min/Max validation
        const minmax = minmaxvalidator(req, res);
        if (minmax) {
            return minmax;
        }

        // Update the pond
        const updatedPond = await Pond.findByIdAndUpdate(pondId, req.body, { new: true, useFindAndModify: false });

        if (!updatedPond) {
            return res.status(404).json(CreateError(404, `Cannot update Pond with id=${pondId}. Maybe Pond was not found!`));
        }

        return res.status(200).json(CreateSuccess(200, "Pond was updated successfully.", updatedPond));
    } catch (err) {
        console.error("Error updating pond: ", err);
        return res.status(500).json(CreateError(500, "Error updating Pond.", err.toString()));
    }
};


//Validated Working
// Delete a Pond with the specified id in the request
export const deleteOne = (req, res) => {
    //validation to check that id and session token is not empty
    if(!req.query.pondId) {
        return res.status(400).json(CreateError(400, "Id can not be empty!"));
    }
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
    try { 
    const id = req.query.pondId;
    //Finds the pond with the specified id, then find the appropriate Esp32 and Period data associated with the Pond
    Pond.findById(id)
        .then(pond => {
            if (!pond) {
                return res.status(404).json(CreateError(404, `Cannot delete Pond with id=${id}. Maybe Pond was not found!`));
            } else {
                //Delete all Esp32 data associated with the Pond
                //Removes serialNumber and passKey from the Pond first, then delete the Esp32 data
                if (pond.connectedEsp32Serial) {
                    Pond.findByIdAndUpdate(id, {
                        connectedEsp32Serial: null,
                        connectedEsp32Passkey: null
                    }, {useFindAndModify: false})
                        .then(data => {
                            console.log("Set the serial and passkey to null");
                        })
                        .catch(err => {
                            console.log("Error removing Esp32 from Pond with id=" + id);
                        });
                }
                Esp32.deleteMany({pondId: id})
                    .then(data => {
                        console.log("Deleted Esp32 data associated with Pond with id=" + id);
                    })
                    .catch(err => {
                        console.log("Error deleting Esp32 data associated with Pond with id=" + id);
                    });
                //Delete all Period data associated with the Pond
                Period.deleteMany({pondId: id})
                    .then(data => {
                        console.log("Deleted Period data associated with Pond with id=" + id);
                    })
                    .catch(err => {
                        console.log("Error deleting Period data associated with Pond with id=" + id);
                    });
                //Finally, delete the Pond
                Pond.deleteOne({_id : id})
                    .then(data => {
                        if (!data) {
                            return res.status(404).json(CreateError(404, `Cannot delete Pond with id=${id}. Maybe Pond was not found!`));
                        } else {
                            return res.status(200).json(CreateSuccess(200, "Pond deleted successfully!", data));
                        }
                    })
                    .catch(err => {
                        return res.status(500).json(CreateError(500, "Error deleting Pond with id=" + id));
                    });
            }
        })
        .catch(err => {
            return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
        });
    } catch (error) {
      return res.status(500).json(CreateError(500, "Error Deleting Pond",error)); 
    }
}




export const addEspToPond = async (req, res) => {
    console.log("masuk add esp to pond");

    const { pondId, esp32Serial, esp32Passkey } = req.body;

    if (!pondId || !esp32Serial || !esp32Passkey) {
        return res.status(400).json({ status: 400, message: "Missing required fields: pondId, esp32Serial, or esp32Passkey" });
    }

    try {
        // Check if any pond has the same ESP32 serial number and passkey
        const existingPond = await Pond.findOne({ connectedEsp32Serial: esp32Serial});
        
        if (existingPond) {
            // If found, respond with an error and exit
            return res.status(400).json({ status: 400, message: "ESP32 already connected to another Pond!" });
        }

        console.log("start find and update");

        // Update pond with the new ESP32 details
        const updatedPond = await Pond.findByIdAndUpdate(pondId, {
            connectedEsp32Serial: esp32Serial,
            connectedEsp32Passkey: esp32Passkey
        }, { new: true, useFindAndModify: false });

        if (!updatedPond) {
            // If no pond was found with the provided ID
            return res.status(404).json({ status: 404, message: `Cannot add ESP32 to Pond with id=${pondId}. Maybe Pond was not found!` });
        }

        // Successfully updated
        return res.status(200).json({ status: 200, message: "ESP32 added to Pond successfully!", data: updatedPond });

    } catch (err) {
        console.error("Error adding ESP32 to pond: ", err.toString());
        return res.status(500).json({ status: 500, message: `Error adding ESP32 to Pond with id=${pondId}: ${err.toString()}` });
    }
};

//Start and end date harus di set juga nanti
export const getPondReading = (req, res) => {
    const id = req.query.pondId;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;

    console.log("id: ", id);

    Pond.findById(id)
        .then(pond => {
            if (!pond) {
                return res.status(404).json(CreateError(404, "Pond not found!"));
            } else {
              //Find Esp32 with the same pondId as the id specified
              //Also sort by startTime and endTime
                Esp32.find({pondId: id, time: {$gte: startTime, $lte: endTime}})
                    .then(data => {
                        return res.status(200).json(CreateSuccess(200, "Pond reading retrieved successfully!", data));
                    })
                    .catch(err => {
                        console.log("error adding reading: ",err );
                        return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
                    });
            }
        })
        .catch(err => {
            console.log("error adding reading: ",err );
            return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
        });

}


// Get esp reading for a specific pond with the timestamp within the past week
// First it will get the last 7 days from the current date
// then it will find all esp32 readings within that time frame
export const getPondReadingPastWeek = (req, res) => {
    const id = req.body.pondId;
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    Pond.findById(id)
        .then(pond => {
            if (!pond) {
                return res.status(404).json(CreateError(404, "Pond not found!", null));
            } else {
                Esp32.find({pondId: id, createdAt: {$gte: lastWeek, $lte: now}})
                    .then(data => {
                        // If there's no readings within the past week, return an error code 603
                        if (data.length === 0) {
                            return res.status(603).json(CreateError(603, "No readings found for the past week.", null));
                        }
                        return res.status(200).json(CreateSuccess(200, "Pond readings retrieved successfully!", data));
                    })
                    .catch(err => {
                        console.log("error retrieving readings: ", err);
                        return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond readings.", err));
                    });
            }
        })
        .catch(err => {
            console.log("error retrieving pond: ", err);
            return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
        });
};





//Get Esp Reading for all Ponds within the past week (aggregate)

export const getAllPondReadingPastWeek = (req, res) => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    Pond.find()
        .then(ponds => {
            const pondDataPromises = ponds.map(pond => {
                return Esp32.find({pondId: pond._id, createdAt: {$gte: lastWeek, $lte: now}})
                    .then(data => ({
                        pondId: pond._id,
                        pondName: pond.name,
                        data: data
                    }))
                    .catch(err => {
                        console.log("error retrieving data: ", err);
                        throw new Error("Some error occurred while retrieving data.");
                    });
            });

            Promise.all(pondDataPromises)
                .then(pondData => {
                    return res.status(200).json(CreateSuccess(200, "Pond readings retrieved successfully!", pondData));
                })
                .catch(err => {
                    console.log("error processing pond data: ", err);
                    return res.status(500).json(CreateError(500, "Some error occurred while processing pond data.", err));
                });
        })
        .catch(err => {
            console.log("error retrieving ponds: ", err);
            return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Ponds.", err));
        });
};


//Get summary of report of a single pond within the past week (aggregate)
//(inc. high low, average, etc.)
//v1 without WS
export const getPondHighLow = (req, res) => {
    const id = req.body.pondId;
    // const startTime = req.body.startTime;
    // const endTime = req.body.endTime;

    console.log("id: ", id);

    Pond.findById(id)
        .then(pond => {
            if (!pond) {
                res.status(404).json(CreateError(404, "Pond not found!", err));
            } else {
                // Esp32.find({pondId: id, createdAt: {$gte: startTime, $lte: endTime}})
                Esp32.find({pondId: id})
                    .then(data => {
                        const highLowReadings = {
                            highest: {},
                            lowest: {}
                        };

                        const parameters = process.env.WTR_PARAMS.split(',');
                        console.log("parameters: ", parameters);


                        // Initialize highest and lowest readings with the first data entry
                        parameters.forEach(param => {
                            highLowReadings.highest[param] = { value: data[0][param], timestamp: data[0].createdAt };
                            highLowReadings.lowest[param] = { value: data[0][param], timestamp: data[0].createdAt };
                        });

                        // Iterate through the data to find the highest and lowest readings for each parameter
                        data.forEach(entry => {
                            parameters.forEach(param => {
                                if (entry[param] > highLowReadings.highest[param].value) {
                                    highLowReadings.highest[param] = { value: entry[param], timestamp: entry.createdAt };
                                }
                                if (entry[param] < highLowReadings.lowest[param].value) {
                                    highLowReadings.lowest[param] = { value: entry[param], timestamp: entry.createdAt };
                                }
                            });
                        });

                        return res.json(highLowReadings);
                    })
                    .catch(err => {
                        console.log("error retrieving data: ", err);
                        return res.status(500).json(CreateError(500, "Some error occurred while retrieving data.", err));
                    });
            }
        })
        .catch(err => {
            console.log("error retrieving pond: ", err);
            return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
        });
}




export const getLatestPondReading = (req, res) => {
    const id = req.body.pondId;

    Pond.findById(id)
        .then(pond => {
            if (!pond) {
                return res.status(404).json(CreateError(404, "Pond not found!", null));
            } else {
                Esp32.findOne({pondId: id}).sort({createdAt: -1})
                    .then(data => {
                        if (!data) {
                            return res.status(603).json(CreateError(603, "No readings found for the pond.", null));
                        }

                        // Emit the latest reading to WebSocket clients
                        const io = req.app.get('socketio');
                        io.emit('latestPondReading', { pondId: id, data });

                        return res.status(200).json(CreateSuccess(200, "Pond reading retrieved successfully!", data));
                    })
                    .catch(err => {
                        console.log("error retrieving reading: ", err);
                        return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond reading.", err));
                    });
            }
        })
        .catch(err => {
            console.log("error retrieving pond: ", err);
            return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
        });
};

export const getLatestPondTemperature = (req, res) => {
    console.log("DATA IN: ", req.body.pondId);
    // const pondId = req.body.pondId;
    const pondId = req.querry.pondId;
    console.log("kepanggil getLatestPondTemperature, pondId: ", pondId);
  
    Pond.findById(pondId)
      .then(pond => {
        if (!pond) {
          return res.status(404).json({ error: "Pond not found!" });
        } else {
          Esp32.findOne({ pondId }).sort({ createdAt: -1 })
            .then(data => {
              if (!data) {
                return res.status(603).json({ error: "No temperature readings found for the pond." });
              }
  
              // Emit the temperature reading via WebSocket
              const io = req.io;// Accessing the io instance correctly
              console.log("Emitting latest temperature update");
              io.emit('temperatureUpdate', { pondId, temperature: data.temperatureReading });
  
              // Optionally return HTTP response
              return res.status(200).json({ message: "Pond temperature retrieved successfully!", temperature: data.temperatureReading });
            })
            .catch(err => {
              console.log("Error retrieving temperature reading: ", err);
              return res.status(500).json({ error: "Some error occurred while retrieving the Pond temperature reading.", details: err });
            });
        }
      })
      .catch(err => {
        console.log("Error retrieving pond: ", err);
        return res.status(500).json({ error: "Some error occurred while retrieving the Pond.", details: err });
      });
  };
  

  

// Get only the latest esp32 pH reading of a specific pond
export const getLatestPondPh = (req, res) => {
    const id = req.body.pondId;

    Pond.findById(id)
        .then(pond => {
            if (!pond) {
                return res.status(404).json(CreateError(404, "Pond not found!", null));
            } else {
                Esp32.findOne({ pondId: id }).sort({ createdAt: -1 })
                    .then(data => {
                        if (!data) {
                            return res.status(603).json(CreateError(603, "No pH readings found for the pond.", null));
                        }

                        // Emit the pH update via WebSocket
                        io.emit(`pond-${id}-ph-update`, {
                            pondId: id,
                            phReading: data.phReading,
                            timestamp: data.createdAt
                        });

                        return res.status(200).json(CreateSuccess(200, "Pond pH retrieved successfully!", data.phReading));
                    })
                    .catch(err => {
                        console.log("error retrieving pH reading: ", err);
                        return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond pH reading.", err));
                    });
            }
        })
        .catch(err => {
            console.log("error retrieving pond: ", err);
            return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
        });
};

// Get only the latest esp32 height reading of a specific pond
export const getLatestPondHeight = (req, res) => {
    const id = req.body.pondId;

    Pond.findById(id)
        .then(pond => {
            if (!pond) {
                return res.status(404).json(CreateError(404, "Pond not found!", null));
            } else {
                Esp32.findOne({ pondId: id }).sort({ createdAt: -1 })
                    .then(data => {
                        if (!data) {
                            return res.status(603).json(CreateError(603, "No height readings found for the pond.", null));
                        }

                        // Emit the height update via WebSocket
                        io.emit(`pond-${id}-height-update`, {
                            pondId: id,
                            heightReading: data.heightReading,
                            timestamp: data.createdAt
                        });

                        return res.status(200).json(CreateSuccess(200, "Pond height retrieved successfully!", data.heightReading));
                    })
                    .catch(err => {
                        console.log("error retrieving height reading: ", err);
                        return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond height reading.", err));
                    });
            }
        })
        .catch(err => {
            console.log("error retrieving pond: ", err);
            return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
        });
};

// Get only the latest esp32 TDS reading of a specific pond
export const getLatestPondTds = (req, res) => {
    const id = req.body.pondId;

    Pond.findById(id)
        .then(pond => {
            if (!pond) {
                return res.status(404).json(CreateError(404, "Pond not found!", null));
            } else {
                Esp32.findOne({ pondId: id }).sort({ createdAt: -1 })
                    .then(data => {
                        if (!data) {
                            return res.status(603).json(CreateError(603, "No TDS readings found for the pond.", null));
                        }

                        // Emit the TDS update via WebSocket
                        io.emit(`pond-${id}-tds-update`, {
                            pondId: id,
                            tdsReading: data.tdsReading,
                            timestamp: data.createdAt
                        });

                        return res.status(200).json(CreateSuccess(200, "Pond TDS retrieved successfully!", data.tdsReading));
                    })
                    .catch(err => {
                        console.log("error retrieving TDS reading: ", err);
                        return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond TDS reading.", err));
                    });
            }
        })
        .catch(err => {
            console.log("error retrieving pond: ", err);
            return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
        });
};



//Set Pond owner by the specified user ID
//Set the user ID of the pond to the specified user ID
export const setPondOwner = (req, res) => {
    const id = req.body.pondId;
    const userId = req.body.userId;
    Pond.findByIdAndUpdate(id, {
        userId: userId
    }, {useFindAndModify: false})
        .then(data => {
            if (!data) {
                return res.status(404).json(CreateError(404, `Cannot update Pond with id=${id}. Maybe Pond was not found!`));
            } else 
            return res.send({message: "Pond owner updated successfully."});
        })
        .catch(err => {
            return res.status(500).json(CreateError(500, "Error updating Pond owner with id=" + id));
        });

}

//Retreive the pond name, shrimp breed, tonnage, area, and userId.
export const getPondInfo= (req, res) => {
    Pond.find({}, {name: 1, shrimpbreed: 1, tonnage: 1, area: 1, userId: 1})
        .then(data => {
            res.status(200).json(CreateSuccess(200, "Pond info retrieved successfully!", data));
        })
        .catch(err => {
            res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
        });
}

export const getPondReadingByDate = (req, res) => {
    const id = req.body.pondId;
    const startTime = new Date(parseInt(req.body.startTime) * 1000);
    const endTime = new Date(parseInt(req.body.endTime) * 1000);
    console.log("Start TIme: ", startTime);
    console.log("End Time: ", endTime);

    Pond.findById(id)
        .then(pond => {
            if (!pond) {
                res.status(404).json(CreateError(404, "Pond not found!", err));
            } else {
                Esp32.find({pondId: id, createdAt: {$gte: startTime, $lte: endTime}})
                    .then(data => {
                        console.log("data: ", data);
                        res.status(200).json(CreateSuccess(200, "Pond reading retrieved successfully!", data));
                    })
                    .catch(err => {
                        console.log("error adding reading: ",err );
                        res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
                    });
            }
        })
        .catch(err => {
            console.log("error adding reading: ",err );
            res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
        });

}


//V2 of get by date down below
// Helper function to map data to required fields
const mapData = (data, field) => {
    return data.map(item => {
        return {
            _id: item._id,
            pondId: item.pondId,
            createdAt: item.createdAt,
            [field]: item[field]
        };
    });
};

// Retrieve pond TDS based on the timestamps provided (start date and end date, can be used accordingly)
export const getPondTdsTime = (req, res) => {
    const id = req.body.pondId;
    const startTime = new Date(parseInt(req.body.startTime) * 1000);
    const endTime = new Date(parseInt(req.body.endTime) * 1000);
    if (startTime >= endTime) {
        return res.status(601).json(CreateError(601, "Start date must be before end date!"));
    }

    Pond.findById(id)
        .then(pond => {
            if (!pond) {
                res.status(404).json(CreateError(404, "Pond not found!"));
            } else {
                Esp32.find({pondId: id, createdAt: {$gte: startTime, $lte: endTime}})
                    .then(data => {
                        const filteredData = mapData(data, 'tdsReading');
                        res.status(200).json(CreateSuccess(200, "Pond TDS retrieved successfully!", filteredData));
                    })
                    .catch(err => {
                        console.log("error adding reading: ", err);
                        res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
                    });
            }
        })
        .catch(err => {
            console.log("error adding reading: ", err);
            res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
        });
}

// Retrieve pond temperature based on the timestamps provided (start date and end date, can be used accordingly)
export const getPondTemperatureTime = (req, res) => {
    const id = req.body.pondId;
    const startTime = new Date(parseInt(req.body.startTime) * 1000);
    const endTime = new Date(parseInt(req.body.endTime) * 1000);
    if (startTime >= endTime) {
        return res.status(601).json(CreateError(601, "Start date must be before end date!"));
    }

    Pond.findById(id)
        .then(pond => {
            if (!pond) {
                res.status(404).json(CreateError(404, "Pond not found!"));
            } else {
                Esp32.find({pondId: id, createdAt: {$gte: startTime, $lte: endTime}})
                    .then(data => {
                        const filteredData = mapData(data, 'temperatureReading');
                        res.status(200).json(CreateSuccess(200, "Pond temperature retrieved successfully!", filteredData));
                    })
                    .catch(err => {
                        console.log("error adding reading: ", err);
                        res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
                    });
            }
        })
        .catch(err => {
            console.log("error adding reading: ", err);
            res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
        });
}

// Retrieve pond pH based on the timestamps provided (start date and end date, can be used accordingly)
export const getPondPhTime = (req, res) => {
    const id = req.body.pondId;
    const startTime = new Date(parseInt(req.body.startTime) * 1000);
    const endTime = new Date(parseInt(req.body.endTime) * 1000);
    if (startTime >= endTime) {
        return res.status(601).json(CreateError(601, "Start date must be before end date!"));
    }

    Pond.findById(id)
        .then(pond => {
            if (!pond) {
                res.status(404).json(CreateError(404, "Pond not found!"));
            } else {
                Esp32.find({pondId: id, createdAt: {$gte: startTime, $lte: endTime}})
                    .then(data => {
                        const filteredData = mapData(data, 'phReading');
                        res.status(200).json(CreateSuccess(200, "Pond pH retrieved successfully!", filteredData));
                    })
                    .catch(err => {
                        console.log("error adding reading: ", err);
                        res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
                    });
            }
        })
        .catch(err => {
            console.log("error adding reading: ", err);
            res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
        });
}

// Retrieve pond height based on the timestamps provided (start date and end date, can be used accordingly)
export const getPondHeightTime = (req, res) => {
    const id = req.body.pondId;
    const startTime = new Date(parseInt(req.body.startTime) * 1000);
    const endTime = new Date(parseInt(req.body.endTime) * 1000);
    if (startTime >= endTime) {
        return res.status(601).json(CreateError(601, "Start date must be before end date!"));
    }

    Pond.findById(id)
        .then(pond => {
            if (!pond) {
                res.status(404).json(CreateError(404, "Pond not found!"));
            } else {
                Esp32.find({pondId: id, createdAt: {$gte: startTime, $lte: endTime}})
                    .then(data => {
                        const filteredData = mapData(data, 'heightReading');
                        res.status(200).json(CreateSuccess(200, "Pond height retrieved successfully!", filteredData));
                    })
                    .catch(err => {
                        console.log("error adding reading: ", err);
                        res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
                    });
            }
        })
        .catch(err => {
            console.log("error adding reading: ", err);
            res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
        });
}


export const getReadingById = (req, res) => {
    const id = req.body.readingId;

    Esp32.findById(id)
        .then(data => {
            res.status(200).json(CreateSuccess(200, "Reading retrieved successfully!", data));
        })
        .catch(err => {
            console.log("error adding reading: ",err );
            res.status(500).json(CreateError(500, "Some error occurred while retrieving the Reading.", err));
        });
}