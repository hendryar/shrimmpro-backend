import Alert from "../models/Alert.js";
import Pond from "../models/Pond.js"
import { CreateError } from "../utils/error.js";
import { CreateSuccess } from "../utils/success.js";


// Create and Save a new Alert

//semua alert yang dibuat harus cek pond idnya dulu, ada warning sama critical state
//kalau misalnya ada alert dalam 15 menit terakhir untuk pond tersebut gaperlu di alert lagi, kespam coeg
//kalau misalnya params mendekati 15% safe limit, keluarin alert dengan status warning.
//kalau misalnya params melewati safe limit, itu masuk critical
//JIKA warning sudah tembus ke 10%, regarless readingnya dalam 15 menit terakhir, keluarin warning baru.
//this also applies to 5% limit, keluarin alert bodo amat.
//Kalau dia critical, langsung keluarin alert, dan ini untuk throttle cek 15 menit terakhir, kan ada timestamp
//jangan lupa pond id disimpen biar bisa di sort ambil per pond.


// export const createAlert = async (pondId, info) => {
//     try {
//         // Find the pond by ID and retrieve the safe limits
//         const pond = await Pond.findById(pondId);
//         if (!pond) {
//             return res.status(404).json({ message: "Pond Not Found" });
//         }

//         // Check for alerts within the last 15 minutes for this pond
//         const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
//         const recentAlerts = await Alert.find({
//             pondId: pondId,
//             alertTime: { $gte: fifteenMinutesAgo }
//         });

//         // Helper function to determine if a new alert is needed
//         const shouldCreateNewAlert = (type, currentValue, safeMin, safeMax, lastStatus) => {
//             const belowSafeLimit = currentValue < safeMin;
//             const aboveSafeLimit = currentValue > safeMax;
//             const warningLimit = 0.15; // 15% limit
//             const highWarningLimit = 0.1; // 10% limit
//             const criticalLimit = 0.05; // 5% limit

//             if (belowSafeLimit || aboveSafeLimit) {
//                 // Check critical state
//                 if (Math.abs(currentValue - (belowSafeLimit ? safeMin : safeMax)) >= criticalLimit) {
//                     return { status: 'critical', message: `${type} is out of normal range` };
//                 }

//                 // Check warning state
//                 if (Math.abs(currentValue - (belowSafeLimit ? safeMin : safeMax)) >= highWarningLimit) {
//                     return { status: 'warning', message: `${type} is approaching safe limits` };
//                 }

//                 // Check if the warning has already been raised
//                 if (Math.abs(currentValue - (belowSafeLimit ? safeMin : safeMax)) >= warningLimit) {
//                     if (lastStatus !== 'warning' || new Date(lastStatus.alertTime) < fifteenMinutesAgo) {
//                         return { status: 'warning', message: `${type} is approaching 15% limit` };
//                     }
//                 }
//             }

//             return null;
//         };

//         const alertTypes = [];
//         let alertStatus = 'normal';
//         let alertMessage = '';

//         // Process each parameter to determine if an alert should be raised
//         const paramsToCheck = [
//             { type: 'ph', currentValue: info.ph, safeMin: pond.safeMinPh, safeMax: pond.safeMaxPh },
//             { type: 'temperature', currentValue: info.temperature, safeMin: pond.safeMinTemperature, safeMax: pond.safeMaxTemperature },
//             { type: 'height', currentValue: info.height, safeMin: pond.safeMinHeight, safeMax: pond.safeMaxHeight },
//             { type: 'tds', currentValue: info.tds, safeMin: pond.safeMinTds, safeMax: pond.safeMaxTds },
//         ];

//         for (let param of paramsToCheck) {
//             const existingAlert = recentAlerts.find(alert => alert.alertType === param.type);
//             const lastStatus = existingAlert ? existingAlert.alertStatus : null;

//             const result = shouldCreateNewAlert(param.type, param.currentValue, param.safeMin, param.safeMax, lastStatus);
//             if (result) {
//                 alertTypes.push(param.type);
//                 alertMessage += `${param.type} ${result.message}. `;
//                 alertStatus = result.status;
//             }
//         }

//         // If no alerts are needed, exit the function
//         if (!alertTypes.length) {
//             return res.status(200).json({ message: "No alerts generated" });
//         }

//         // Create a new alert entry
//         const newAlert = new Alert({
//             alertType: alertTypes.join(', '),
//             alertMessage: alertMessage.trim(),
//             alertStatus: alertStatus,
//             alertTime: new Date(),
//             pondId: pondId
//         });

//         await newAlert.save();
//         res.status(201).json(newAlert);
//     } catch (error) {
//         res.status(500).json({ message: "Unable to create alert", error });
//     }
// };


//v2
// export const createAlert = async (pondId, info, socket) => {
//     console.log("createalert kepanggil");
//     try {
//         const pond = await Pond.findById(pondId);
//         if (!pond) {
//             throw new Error("Pond Not Found");
//         }

//         const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
//         const recentAlerts = await Alert.find({
//             pondId: pondId,
//             alertTime: { $gte: fifteenMinutesAgo }
//         });

//         const shouldCreateNewAlert = (type, currentValue, safeMin, safeMax, lastStatus) => {
//             const belowSafeLimit = currentValue < safeMin;
//             const aboveSafeLimit = currentValue > safeMax;
//             const warningLimit = 0.15;
//             const highWarningLimit = 0.1;
//             const criticalLimit = 0.05;

//             if (belowSafeLimit || aboveSafeLimit) {
//                 if (Math.abs(currentValue - (belowSafeLimit ? safeMin : safeMax)) >= criticalLimit) {
//                     return { status: 'critical', message: `${type} is out of normal range` };
//                 }
//                 if (Math.abs(currentValue - (belowSafeLimit ? safeMin : safeMax)) >= highWarningLimit) {
//                     return { status: 'warning', message: `${type} is approaching safe limits` };
//                 }
//                 if (Math.abs(currentValue - (belowSafeLimit ? safeMin : safeMax)) >= warningLimit) {
//                     if (lastStatus !== 'warning' || new Date(lastStatus.alertTime) < fifteenMinutesAgo) {
//                         return { status: 'warning', message: `${type} is approaching 15% limit` };
//                     }
//                 }
//             }

//             return null;
//         };

//         const alertTypes = [];
//         let alertStatus = 'normal';
//         let alertMessage = '';

//         const paramsToCheck = [
//             { type: 'ph', currentValue: info.ph, safeMin: pond.safeMinPh, safeMax: pond.safeMaxPh },
//             { type: 'temperature', currentValue: info.temperature, safeMin: pond.safeMinTemperature, safeMax: pond.safeMaxTemperature },
//             { type: 'height', currentValue: info.height, safeMin: pond.safeMinHeight, safeMax: pond.safeMaxHeight },
//             { type: 'tds', currentValue: info.tds, safeMin: pond.safeMinTds, safeMax: pond.safeMaxTds },
//         ];

//         for (let param of paramsToCheck) {
//             const existingAlert = recentAlerts.find(alert => alert.alertType === param.type);
//             const lastStatus = existingAlert ? existingAlert.alertStatus : null;

//             const result = shouldCreateNewAlert(param.type, param.currentValue, param.safeMin, param.safeMax, lastStatus);
//             if (result) {
//                 alertTypes.push(param.type);
//                 alertMessage += `${param.type} ${result.message}. `;
//                 alertStatus = result.status;
//             }
//         }

//         if (!alertTypes.length) {
//             return null;
//         }

//         const newAlert = new Alert({
//             alertType: alertTypes.join(', '),
//             alertMessage: alertMessage.trim(),
//             alertStatus: alertStatus,
//             alertTime: new Date(),
//             pondId: pondId
//         });

//         await newAlert.save();

//         // Emit the alert via WebSocket if a socket instance is provided
//         if (socket) {
//             socket.to(pondId).emit('alert', {
//                 alertType: newAlert.alertType,
//                 alertStatus: newAlert.alertStatus,
//                 alertMessage: newAlert.alertMessage,
//                 pondId: newAlert.pondId,
//                 timestamp: newAlert.alertTime
//             });
//         }

//         return newAlert;
//     } catch (error) {
//         console.error("Error in createAlert:", error);
//         throw error;
//     }
// };


export const createAlert = async (pondId, info, socket) => {
    console.log("createalert kepanggil");
    try {
        const pond = await Pond.findById(pondId);
        if (!pond) {
            throw new Error("Pond Not Found");
        }

        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentAlerts = await Alert.find({
            pondId: pondId,
            alertTime: { $gte: fifteenMinutesAgo }
        });

        const shouldCreateNewAlert = (type, currentValue, safeMin, safeMax, lastStatus) => {
            const belowSafeLimit = currentValue < safeMin;
            const aboveSafeLimit = currentValue > safeMax;
            const warningLimit = 0.15;
            const highWarningLimit = 0.1;
            const criticalLimit = 0.05;
            let deviation = 0;

            if (belowSafeLimit) deviation = safeMin - currentValue;
            if (aboveSafeLimit) deviation = currentValue - safeMax;

            if (belowSafeLimit || aboveSafeLimit) {
                if (Math.abs(deviation) >= criticalLimit) {
                    return { status: 'critical', message: `${type} is ${deviation.toFixed(2)} ${belowSafeLimit ? 'below' : 'above'} safe limits` };
                }
                if (Math.abs(deviation) >= highWarningLimit) {
                    return { status: 'warning', message: `${type} is ${deviation.toFixed(2)} ${belowSafeLimit ? 'below' : 'above'} safe limits` };
                }
                if (Math.abs(deviation) >= warningLimit) {
                    if (lastStatus !== 'warning' || new Date(lastStatus.alertTime) < fifteenMinutesAgo) {
                        return { status: 'warning', message: `${type} is ${deviation.toFixed(2)} ${belowSafeLimit ? 'below' : 'above'} the 15% limit` };
                    }
                }
            }

            return null;
        };

        const alertTypes = [];
        let alertStatus = 'normal';
        let alertMessage = '';

        const paramsToCheck = [
            { type: 'ph', currentValue: info.ph, safeMin: pond.safeMinPh, safeMax: pond.safeMaxPh },
            { type: 'temperature', currentValue: info.temperature, safeMin: pond.safeMinTemperature, safeMax: pond.safeMaxTemperature },
            { type: 'height', currentValue: info.height, safeMin: pond.safeMinHeight, safeMax: pond.safeMaxHeight },
            { type: 'tds', currentValue: info.tds, safeMin: pond.safeMinTds, safeMax: pond.safeMaxTds },
        ];

        for (let param of paramsToCheck) {
            const existingAlert = recentAlerts.find(alert => alert.alertType === param.type);
            const lastStatus = existingAlert ? existingAlert.alertStatus : null;

            const result = shouldCreateNewAlert(param.type, param.currentValue, param.safeMin, param.safeMax, lastStatus);
            if (result) {
                alertTypes.push(param.type);
                alertMessage += `${result.message}. `;
                alertStatus = result.status;
            }
        }

        if (!alertTypes.length) {
            return null;
        }

        const newAlert = new Alert({
            alertType: alertTypes.join(', '),
            alertMessage: alertMessage.trim(),
            alertStatus: alertStatus,
            alertTime: new Date(),
            pondId: pondId
        });

        await newAlert.save();

        // Emit the alert via WebSocket if a socket instance is provided
        if (socket) {
            socket.to(pondId).emit('alert', {
                alertType: newAlert.alertType,
                alertStatus: newAlert.alertStatus,
                alertMessage: newAlert.alertMessage,
                pondId: newAlert.pondId,
                timestamp: newAlert.alertTime
            });
        }

        // Exclude __v and updatedAt from the response
        const { __v, updatedAt, ...alertWithoutVAndUpdated } = newAlert.toObject();
        return alertWithoutVAndUpdated;
    } catch (error) {
        console.error("Error in createAlert:", error);
        throw error;
    }
};



// Retrieve all Alerts from the database.
export const findAll = (req, res) => {
    const alertType = req.query.alertType;
    var condition = alertType ? { alertType: { $regex: new RegExp(alertType), $options: "i" } } : {};

    Alert.find(condition)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving alerts."
            });
        });
};

// Find a single Alert with an id
export const findId = (req, res) => {
    const id = req.params.id;

    Alert.findById(id)
        .then(data => {
            if (!data)
                res.status(404).send({ message: "Not found Alert with id " + id });
            else res.send(data);
        })
        .catch(err => {
            res
                .status(500)
                .send({ message: "Error retrieving Alert with id=" + id });
        });
};


//Retreive all reports for a specific pond within the specified time range
export const alertTime = (req, res) => {
    const pondId = req.params.pondId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    var condition = { pondId: pondId, alertTime: { $gte: startDate, $lt: endDate } };

    Alert.find(condition)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving alerts."
            });
        });
};


//Cron jobs to automatically check for alerts
