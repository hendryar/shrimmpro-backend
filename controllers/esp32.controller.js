import Esp32 from "../models/esp32.js";
import Pond from "../models/Pond.js";
import { CreateSuccess } from "../utils/success.js";
import { CreateError } from "../utils/error.js";
import { createAlert } from "./alert.controller.js";
import jwt from "jsonwebtoken";



// export const addReadingToDatabase = (req, res) => {
//     const { serialNumber, passKey, phReading, heightReading, temperatureReading, tdsReading } = req.body;

//     // Try to find a pond with matching serial number and passkey.
//     Pond.findOne({ connectedEsp32Serial: serialNumber, connectedEsp32Passkey: passKey })
//         .then(async pond => {
//             if (!pond) {
//                 // If pond is not found, return 404 error.
//                 return res.status(404).json(CreateError(404, "Pond not found or incorrect serial number/passkey."));
//             }

//             // Create ESP32 reading with the associated pondId.
//             const esp32 = new Esp32({
//                 serialNumber,
//                 passKey,
//                 phReading,
//                 heightReading,
//                 temperatureReading,
//                 tdsReading,
//                 pondId: pond._id
//             });

//             // Save the ESP32 reading into the database.
//             esp32.save()
//                 .then(async data => {
//                     const pondId = pond._id.toString(); // Ensure pondId is a string
//                     const io = req.app.get('socketio'); // Access the io instance

//                     // Emit the new reading to the pond room
//                     io.to(pondId).emit('new-reading', data);

//                     // Prepare the alert information
//                     const alertInfo = {
//                         ph: phReading,
//                         temperature: temperatureReading,
//                         height: heightReading,
//                         tds: tdsReading
//                     };

//                     // Call createAlert and pass the io instance for emitting
//                     try {
//                         const alert = await createAlert(pondId, alertInfo, io);
//                         if (alert) {
//                             console.log("Alert emitted:", alert);
//                         }
//                     } catch (alertError) {
//                         console.error("Error creating alert:", alertError);
//                     }

//                     // Respond to the client after saving the reading
//                     return res.status(201).json(CreateSuccess(201, "Esp32 reading created successfully!", data));
//                 })
//                 .catch(err => {
//                     console.error("Error saving ESP32 reading:", err);
//                     return res.status(601).json(CreateError(601, "Some error occurred while creating the Esp32 reading.", err));
//                 });
//         })
//         .catch(err => {
//             console.error("Error retrieving pond:", err);
//             return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond."));
//         });
// };


export const addReadingToDatabase = (req, res) => {
    const { serialNumber, passKey, phReading, heightReading, temperatureReading, tdsReading } = req.body;

    // Round readings to the first decimal place
    const roundedPhReading = Math.round(phReading * 10) / 10;
    const roundedHeightReading = Math.round(heightReading * 10) / 10;
    const roundedTemperatureReading = Math.round(temperatureReading * 10) / 10;
    const roundedTdsReading = Math.round(tdsReading * 10) / 10;

    // Try to find a pond with matching serial number and passkey.
    Pond.findOne({ connectedEsp32Serial: serialNumber, connectedEsp32Passkey: passKey })
        .then(async pond => {
            if (!pond) {
                // If pond is not found, return 404 error.
                return res.status(404).json(CreateError(404, "Pond not found or incorrect serial number/passkey."));
            }

            // Create ESP32 reading with the associated pondId.
            const esp32 = new Esp32({
                serialNumber,
                passKey,
                phReading: roundedPhReading,
                heightReading: roundedHeightReading,
                temperatureReading: roundedTemperatureReading,
                tdsReading: roundedTdsReading,
                pondId: pond._id
            });

            // Save the ESP32 reading into the database.
            esp32.save()
                .then(async data => {
                    const pondId = pond._id.toString(); // Ensure pondId is a string
                    const io = req.app.get('socketio'); // Access the io instance

                    // Emit the new reading to the pond room
                    io.to(pondId).emit('new-reading', data);

                    // Prepare the alert information
                    const alertInfo = {
                        ph: roundedPhReading,
                        temperature: roundedTemperatureReading,
                        height: roundedHeightReading,
                        tds: roundedTdsReading
                    };

                    // Call createAlert and pass the io instance for emitting
                    try {
                        const alert = await createAlert(pondId, alertInfo, io);
                        if (alert) {
                            console.log("Alert emitted:", alert);
                        }
                    } catch (alertError) {
                        console.error("Error creating alert:", alertError);
                    }

                    // Respond to the client after saving the reading
                    return res.status(201).json(CreateSuccess(201, "Esp32 reading created successfully!", data));
                })
                .catch(err => {
                    console.error("Error saving ESP32 reading:", err);
                    return res.status(601).json(CreateError(601, "Some error occurred while creating the Esp32 reading.", err));
                });
        })
        .catch(err => {
            console.error("Error retrieving pond:", err);
            return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond."));
        });
};


export const deleteReadingByPondId = async (req, res) => {
    const pondId = req.query.pondId;

    if (!pondId) {
        return res.status(400).json(CreateError(400, "Pond ID is required."));
    }
    if (!req.headers['session_token']) {
        return res.status(403).json(CreateError(403, "Forbidden"));
    }

    try {
        const decoded = jwt.verify(req.headers['session_token'], process.env.TOKEN_SECRET);
        if (decoded.roles !== 'admin') {
            return res.status(403).json(CreateError(403, "Forbidden"));
        }
    } catch (error) {
        return res.status(403).json(CreateError(403, "Forbidden", error));
    }

    try {
        const pond = await Pond.findById(pondId);
        if (!pond) {
            return res.status(404).json(CreateError(404, "Pond not found"));
        }

        // await Esp32.deleteMany({ pondId: pondId });

        // Set connectedEsp32Serial and connectedEsp32Passkey to null
        await Pond.updateOne(
            { _id: pondId },
            { $set: { connectedEsp32Serial: null, connectedEsp32Passkey: null } }
        );

        return res.status(200).json(CreateSuccess(200, "Readings deleted, and ESP32 credentials set to null successfully!"));

    } catch (error) {
        return res.status(500).json(CreateError(500, "Some error occurred while processing the request.", error));
    }
};




//Delete all reading that has the serialNumber and passKey in the req body.
//Used to delete all readings from a specific ESP32.
export const deleteReadingBySerialNumberPasskey = (req, res) => {
    const serialNumber = req.query.serialNumber;
    const passKey = req.query.passKey;
    //Check if serialNumber and passKey are provided.
    if (!serialNumber || !passKey) {
        return res.status(400).json(CreateError(400, "Serial number and passkey are required."));
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
    
   //Finds if there is any ESP32 reading with the serialNumber and passKey
    Esp32.find({serialNumber: serialNumber, passKey: passKey})
        .then(data => {
            if (data.length == 0) {
                return res.status(404).json(CreateError(404, "No readings found with the serialNumber and passKey provided."));
            } else {
                //Deletes the readings
                Esp32.deleteMany({serialNumber: serialNumber, passKey: passKey})
                    .then(data => {
                        return res.status(200).json(CreateSuccess(200, "Readings deleted successfully!", data));
                    })
                    .catch(err => {
                        return res.status(601).json(CreateError(601, "Some error occurred while deleting readings.", err));
                    });
            }
        })
        .catch(err => {
            return res.status(500).json(CreateError(500, "Some error occurred while retrieving readings.", err));
        });

}

