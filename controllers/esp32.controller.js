import Esp32 from "../models/esp32.js";
import Pond from "../models/Pond.js";
import { CreateSuccess } from "../utils/success.js";
import { CreateError } from "../utils/error.js";
import { createAlert } from "./alert.controller.js";
import jwt from "jsonwebtoken";
//v2
// export const addReadingToDatabase = (req, res) => {
//     const { serialNumber, passKey, phReading, heightReading, temperatureReading, tdsReading } = req.body;
  
//     // Try to find a pond with matching serial number and passkey.
//     Pond.findOne({ connectedEsp32Serial: serialNumber, connectedEsp32Passkey: passKey })
//       .then(pond => {
//         if (!pond) {
//           // If pond is not found, return 404 error.
//           // The readings will not be processed nor added into the database.
//           return res.status(404).json(CreateError(404, "Pond not found or incorrect serial number/passkey."));
//         }
  
//         const alarmings = [];
//         // Check if the parameters are within the safe range.
//         if (pond.safeMinPh > phReading || pond.safeMaxPh < phReading) {
//           alarmings.push("ph");
//         }
//         if (pond.safeMinTemperature > temperatureReading || pond.safeMaxTemperature < temperatureReading) {
//           alarmings.push("temperature");
//         }
//         if (pond.safeMinHeight > heightReading || pond.safeMaxHeight < heightReading) {
//           alarmings.push("height");
//         }
//         if (pond.safeMinTds > tdsReading || pond.safeMaxTds < tdsReading) {
//           alarmings.push("tds");
//         }
  
//         // If a pond is found, proceed with creating the ESP32 reading.
//         // The pondId is also associated with the ESP32 reading here.
//         const esp32 = new Esp32({
//           serialNumber,
//           passKey,
//           phReading,
//           heightReading,
//           temperatureReading,
//           tdsReading,
//           pondId: pond._id
//         });
//         console.log("esp32 data: ", esp32);
  
//         // The created ESP32 reading will then be saved into the database.
//         esp32.save()
//           .then(data => {
//             // Emit the new reading to connected clients
//             const pondId = pond._id.toString(); // Ensure pondId is a string
  
//             // Access the io instance
//             const io = req.app.get('socketio');
  
//             // Emit the new reading to the pond room
//             io.to(pondId).emit('new-reading', data);
  
//             // If there are any alarming parameters, emit an alert
//             if (alarmings.length > 0) {
//               io.to(pondId).emit('alert', {
//                 pondId: pondId,
//                 message: 'Reading out of safe range',
//                 parameters: alarmings,
//                 reading: data
//               });
//             }
  
//             console.log("Saving reading");
//             return res.status(201).json(CreateSuccess(201, "Esp32 reading created successfully!", data));
//           })
//           .catch(err => {
//             console.log("err diatas: ", err);
//             return res.status(601).json(CreateError(601, "Some error occurred while creating the Esp32 reading.", err));
//           });
//       })
//       .catch(err => {
//         console.log("error adding reading: ", err);
//         return res.status(500).json(CreateError(500, "Some error occurred while retrieving the Pond.", err));
//       });
//   };
  

//Deletes all reading that has the pondId in the req body
//This is used when a pond is deleted, all readings associated with the pond should also be deleted.
//This is to prevent orphaned readings in the database.


//v3
export const addReadingToDatabase = (req, res) => {
    const { serialNumber, passKey, phReading, heightReading, temperatureReading, tdsReading } = req.body;

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
                phReading,
                heightReading,
                temperatureReading,
                tdsReading,
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
                        ph: phReading,
                        temperature: temperatureReading,
                        height: heightReading,
                        tds: tdsReading
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



export const deleteReadingByPondId = (req, res) => {
    //This works by simply finding all ESP32 that has the pondId and deleting them.
    const pondId = req.query.pondId;
    if (!pondId) {
        return res.status(400).json(CreateError(400, "Pond ID is required."));
    }
    if(!req.headers['session_token']){
      return res.status(403).json(CreateError(403, "Forbidden"));
    };
    const pond = Pond.findById(pondId);
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
    if (!pond) {
      return res.status(404).json(CreateError(404, "Pond not found"));
    }
    if(Esp32.find({pondId: pondId}).length == 0){
        return res.status(404).json(CreateError(404, "No readings found with the pondId provided."));
    }
    try {
        Esp32.deleteMany({pondId: pondId})
        .then(data => {
            return res.status(200).json(CreateSuccess(200, "Readings deleted successfully!", data));
        })
        .catch(err => {
            return res.status(500).json(CreateError(500, "Some error occurred while deleting readings.", err));
        });
    } catch (error) {
      return res.status(500).json(CreateError(500, "Error Deleting Pond",error)); 
    }
    
}

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

