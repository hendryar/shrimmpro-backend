import Alert from "../models/Alert.js";
import Pond from "../models/Pond.js";
import { CreateError } from "../utils/error.js";
import { CreateSuccess } from "../utils/success.js";
import mongoose from "mongoose";

// Create and Save a new Alert
export const createAlert = async (pondId, info, socket) => {
  console.log("createalert called");
  try {
    const pond = await Pond.findById(pondId);
    if (!pond) {
      throw new Error("Pond Not Found");
    }

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Use `createdAt` instead of `alertTime` if needed
    const recentAlert = await Alert.findOne({
      pondId: pondId,
      createdAt: { $gte: fifteenMinutesAgo }, // Check against `createdAt`
    });

    if (recentAlert) {
      console.log(`Alert throttled: An alert was already issued within the last 15 minutes for pond ${pondId}.`);
      return null; // Throttle alert creation
    }

    const shouldCreateNewAlert = (type, currentValue, safeMin, safeMax) => {
      const belowSafeLimit = currentValue < safeMin;
      const aboveSafeLimit = currentValue > safeMax;
      const highWarningLimit = 0.15;
      const criticalLimit = 0.05;
      let deviation = 0;

      if (belowSafeLimit) deviation = safeMin - currentValue;
      if (aboveSafeLimit) deviation = currentValue - safeMax;

      if (belowSafeLimit || aboveSafeLimit) {
        if (Math.abs(deviation) >= criticalLimit) {
          return { status: "critical", message: `${type} is ${deviation.toFixed(2)} ${belowSafeLimit ? "below" : "above"} safe limits` };
        }
        if (Math.abs(deviation) >= highWarningLimit) {
          return { status: "warning", message: `${type} is ${deviation.toFixed(2)} ${belowSafeLimit ? "below" : "above"} safe limits` };
        }
      }

      return null;
    };

    const alertTypes = [];
    let alertStatus = "normal";
    let alertMessage = ""; // Initialize the alertMessage variable

    const paramsToCheck = [
      { type: "ph", currentValue: info.ph, safeMin: pond.safeMinPh, safeMax: pond.safeMaxPh },
      { type: "temperature", currentValue: info.temperature, safeMin: pond.safeMinTemperature, safeMax: pond.safeMaxTemperature },
      { type: "height", currentValue: info.height, safeMin: pond.safeMinHeight, safeMax: pond.safeMaxHeight },
      { type: "tds", currentValue: info.tds, safeMin: pond.safeMinTds, safeMax: pond.safeMaxTds },
    ];

    for (let param of paramsToCheck) {
      const result = shouldCreateNewAlert(param.type, param.currentValue, param.safeMin, param.safeMax);
      if (result) {
        alertTypes.push(param.type);
        alertMessage += `${result.message}, `;
        alertStatus = result.status === "critical" ? "critical" : alertStatus;
      }
    }

    // Include the pond name in the alert message
    if (alertMessage.length > 0) {
      alertMessage = `${pond.name}: ${alertMessage.charAt(0).toUpperCase() + alertMessage.slice(1).trim().replace(/,\s*$/, "")}`;
    }

    if (!alertTypes.length) {
      console.log("No alerts to create.");
      return null;
    }

    const newAlert = new Alert({
      alertType: alertTypes.join(", "),
      alertMessage: alertMessage, // Now includes the pond name
      alertStatus: alertStatus,
      alertTime: new Date(),
      pondId: pondId,
    });

    console.log("New alert created: ", newAlert);
    await newAlert.save();

    if (socket && socket.broadcast && typeof socket.broadcast.emit === "function") {
      socket.broadcast.emit("alert", {
        alertType: newAlert.alertType,
        alertStatus: newAlert.alertStatus,
        alertMessage: newAlert.alertMessage,
        pondId: newAlert.pondId,
        timestamp: newAlert.alertTime,
      });
    } else {
      console.warn("Socket object is not valid or not provided.");
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
export const findAll = async (req, res) => {
  try {
    const { pondId, alertStatus } = req.query;

    // Validate and find the pond
    if (!mongoose.Types.ObjectId.isValid(pondId)) {
      return res.status(400).json(CreateError(400, "Invalid Pond ID"));
    }

    const findPond = await Pond.findById(pondId);
    console.log("Found pond: ", findPond);

    if (!findPond) {
      return res.status(404).json(CreateError(404, "Pond Not Found"));
    }

    // Build the match stage for the aggregation pipeline
    let matchStage = {};

    // Match pondId if provided and not "all"
    if (pondId && pondId !== "all") {
      matchStage.pondId = new mongoose.Types.ObjectId(pondId); // Convert to ObjectId
    }

    // Match alertStatus if provided and not "all"
    if (alertStatus && alertStatus !== "all") {
      matchStage.alertStatus = { $regex: new RegExp(`^${alertStatus}$`, "i") };
    }

    console.log("Match stage:", matchStage); // Debugging log

    // Aggregation pipeline
    const alerts = await Alert.aggregate([
      { $match: matchStage }, // Match stage filters the documents
      {
        $addFields: {
          sortOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$alertStatus", "critical"] }, then: 1 },
                { case: { $eq: ["$alertStatus", "warning"] }, then: 2 },
                { case: { $eq: ["$alertStatus", "normal"] }, then: 3 },
              ],
              default: 4, // Any undefined or unexpected alertStatus comes last
            },
          },
        },
      },
      { $sort: { sortOrder: 1, alertTime: -1 } }, // Sort by priority and most recent alertTime
      { $project: { sortOrder: 0 } }, // Remove sortOrder field from the output
    ]);

    console.log("Sorted alerts:", alerts); // Debugging log

    res.status(200).json(CreateSuccess(200, "Alerts retrieved successfully", alerts));
  } catch (err) {
    console.error("Error in findAll:", err);
    res.status(500).json(CreateError(500, "Failed to retrieve alerts"));
  }
};

// Find a single Alert with an id
export const findId = (req, res) => {
  const id = req.query.alertId;

  Alert.findById(id)
    .then((data) => {
      if (!data) res.status(404).send({ message: "Not found Alert with id " + id });
      else res.send(data);
    })
    .catch((err) => {
      res.status(500).send({ message: "Error retrieving Alert with id=" + id });
    });
};

//Retreive all reports for a specific pond within the specified time range
export const alertTime = (req, res) => {
  const pondId = req.params.pondId;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  var condition = { pondId: pondId, alertTime: { $gte: startDate, $lt: endDate } };

  Alert.find(condition)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving alerts.",
      });
    });
};

export const alertWithinDay = async (req, res) => {
  try {
    const pondId = req.query.pondId;

    // Calculate the time range for the past 24 hours
    const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const condition = { createdAt: { $gte: past24Hours } };
    console.log("Match condition:", condition); // Debugging log

    // Count the alerts grouped by status
    const alerts = await Alert.aggregate([
      { $match: condition },
      {
        $group: {
          _id: "$alertStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("Aggregation results:", alerts); // Debugging log

    // Separate counts into critical and warning
    let criticalCount = 0;
    let warningCount = 0;

    alerts.forEach((alert) => {
      if (alert._id === "critical") criticalCount = alert.count;
      if (alert._id === "warning") warningCount = alert.count;
    });

    // Return the counts
    res.status(200).json(
      CreateSuccess(200, "Alert counts retrieved successfully", {
        pondId: pondId || "all",
        criticalCount,
        warningCount,
      })
    );
  } catch (error) {
    console.error("Error in alertWithinDay:", error);
    res.status(500).json(CreateError(500, "Failed to retrieve alert counts"));
  }
};
