import Alert from "../models/Alert";
import Pond from "../models/Pond";
import esp32 from "../models/esp32"; 


// Create and Save a new Alert
exports.create = (req, res) => {
    // Validate request
    if (!req.body.alertType) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }

    // Create a Alert
    const alert = new Alert({
        alertType: req.body.alertType,
        alertMessage: req.body.alertMessage,
        alertStatus: req.body.alertStatus,
        alertTime: req.body.alertTime,
        pondId: req.body.pondId
    });

    // Save Alert in the database
    alert
        .save(alert)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the Alert."
            });
        });
};


// Retrieve all Alerts from the database.
exports.findAll = (req, res) => {
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
exports.findOne = (req, res) => {
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
exports.findReports = (req, res) => {
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
