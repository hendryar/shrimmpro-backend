import Alert from "../models/Alert.js";
import Pond from "../models/Pond.js";
import Esp32 from "../models/esp32.js";
import Period from "../models/Period.js";
import { CreateError } from "../utils/error.js";
import { CreateSuccess } from "../utils/success.js";
import mongoose from "mongoose";

//create a new report
//one function to create a report for daily, weekly, monthly, and period.
//on the request takes in pond ID from the request body if its for a singular pond.
//if the pond ID is "all", retreive all ponds.
//also takes in the type, weekly, daily, monthly or period.
//a report consists of the median, average, higs and lows of the esp32 reading.
//the data will be presented as an array, each array contains the different types of datas.
//the data is also sorted according to the timestamps, earliest starts from the first index.
//for daily data, present an average data of each hour within the past 24 hours. for weekly, presents data of the past week, for monthly presents data within the past month, and period presents data according to the 'periodStart' and 'periodEnd' of the period in which the id was supplied.

// Utility to calculate median
const calculateMedian = (numbers) => {
  const sorted = numbers.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// export const generateReport = async (req, res) => {
//     const { pondId, type, periodId } = req.query;
//     let startDate, endDate;

//     try {
//         const now = new Date();

//         // Determine the date range based on type
//         if (type === "daily") {
//             startDate = new Date(now.setHours(now.getHours() - 24));
//         } else if (type === "weekly") {
//             startDate = new Date(now.setDate(now.getDate() - 7));
//         } else if (type === "monthly") {
//             startDate = new Date(now.setMonth(now.getMonth() - 1));
//         } else if (type === "period") {
//             if (!periodId) {
//                 return res.status(400).json(CreateError(400, "Period ID is required for 'period' type."));
//             }
//             const period = await Period.findById(periodId);
//             if (!period) {
//                 return res.status(404).json(CreateError(404, "Period not found."));
//             }
//             startDate = period.periodStart;
//             endDate = period.periodEnd || new Date();
//         } else {
//             return res.status(400).json(CreateError(400, "Invalid report type."));
//         }

//         // Fetch pond(s)
//         let pondQuery;
//         if (pondId === "all") {
//             pondQuery = {}; // Fetch all ponds
//         } else {
//             if (!mongoose.Types.ObjectId.isValid(pondId)) {
//                 return res.status(400).json(CreateError(400, "Invalid Pond ID."));
//             }
//             pondQuery = { _id: new mongoose.Types.ObjectId(pondId) }; // Correctly construct ObjectId
//         }

//         const ponds = await Pond.find(pondQuery);
//         const pondIds = ponds.map((pond) => pond._id);

//         // Ensure there are ponds to report on
//         if (!ponds.length) {
//             return res.status(404).json(CreateError(404, "No ponds found matching the criteria."));
//         }

//         // Retrieve sensor readings grouped by month
//         const readings = await Esp32.aggregate([
//             {
//                 $match: {
//                     pondId: { $in: pondIds },
//                     createdAt: { $gte: startDate, ...(endDate ? { $lte: endDate } : {}) }
//                 }
//             },
//             {
//                 $group: {
//                     _id: {
//                         pondId: "$pondId",
//                         year: { $year: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } },
//                         month: { $month: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } }
//                     },
//                     minTemperature: { $min: "$temperatureReading" },
//                     maxTemperature: { $max: "$temperatureReading" },
//                     avgTemperature: { $avg: "$temperatureReading" },
//                     minPh: { $min: "$phReading" },
//                     maxPh: { $max: "$phReading" },
//                     avgPh: { $avg: "$phReading" },
//                     minHeight: { $min: "$heightReading" },
//                     maxHeight: { $max: "$heightReading" },
//                     avgHeight: { $avg: "$heightReading" },
//                     minTds: { $min: "$tdsReading" },
//                     maxTds: { $max: "$tdsReading" },
//                     avgTds: { $avg: "$tdsReading" }
//                 }
//             },
//             { $sort: { "_id.year": 1, "_id.month": 1 } }
//         ]);

//         // Retrieve alerts
//         const alerts = await Alert.aggregate([
//             {
//                 $match: {
//                     pondId: { $in: pondIds },
//                     createdAt: { $gte: startDate, ...(endDate ? { $lte: endDate } : {}) }
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$pondId",
//                     totalAlerts: { $sum: 1 },
//                     criticalAlerts: { $sum: { $cond: [{ $eq: ["$alertStatus", "critical"] }, 1, 0] } },
//                     warningAlerts: { $sum: { $cond: [{ $eq: ["$alertStatus", "warning"] }, 1, 0] } }
//                 }
//             }
//         ]);

//         // Combine readings and alerts
//         const report = ponds.map((pond) => ({
//             pond: pond.name,
//             readings: readings.filter((r) => r._id.pondId.toString() === pond._id.toString()),
//             alerts: alerts.filter((a) => a._id.toString() === pond._id.toString())
//         }));

//         res.status(200).json(CreateSuccess(200, "Report generated successfully", report));
//     } catch (error) {
//         console.error("Error in generateReport:", error);
//         res.status(500).json(CreateError(500, error.message));
//     }
// };

// export const generateReport = async (req, res) => {
//   const { pondId, type, periodId } = req.query;
//   let startDate, endDate;

//   try {
//     const now = new Date();

//     // Determine the date range based on type
//     if (type === "daily") {
//       startDate = new Date(now.setHours(now.getHours() - 24));
//     } else if (type === "weekly") {
//       startDate = new Date(now.setDate(now.getDate() - 7));
//     } else if (type === "monthly") {
//       startDate = new Date(now.setMonth(now.getMonth() - 1));
//     } else if (type === "period") {
//       if (!periodId) {
//         return res.status(400).json(CreateError(400, "Period ID is required for 'period' type."));
//       }
//       const period = await Period.findById(periodId);
//       if (!period) {
//         return res.status(404).json(CreateError(404, "Period not found."));
//       }
//       startDate = period.periodStart;
//       endDate = period.periodEnd || new Date();
//     } else {
//       return res.status(400).json(CreateError(400, "Invalid report type."));
//     }

//     // Fetch pond(s)
//     let pondQuery;
//     if (pondId === "all") {
//       pondQuery = {}; // Fetch all ponds
//     } else {
//       if (!mongoose.Types.ObjectId.isValid(pondId)) {
//         return res.status(400).json(CreateError(400, "Invalid Pond ID."));
//       }
//       pondQuery = { _id: new mongoose.Types.ObjectId(pondId) }; // Correctly construct ObjectId
//     }

//     const ponds = await Pond.find(pondQuery);
//     const pondIds = ponds.map((pond) => pond._id);

//     // Ensure there are ponds to report on
//     if (!ponds.length) {
//       return res.status(404).json(CreateError(404, "No ponds found matching the criteria."));
//     }

//     // Retrieve sensor readings grouped by month
//     const readings = await Esp32.aggregate([
//       {
//         $match: {
//           pondId: { $in: pondIds },
//           createdAt: { $gte: startDate, ...(endDate ? { $lte: endDate } : {}) },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             pondId: "$pondId",
//             year: { $year: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } },
//             month: { $month: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } },
//           },
//           minTemperature: { $min: "$temperatureReading" },
//           maxTemperature: { $max: "$temperatureReading" },
//           avgTemperature: { $avg: "$temperatureReading" },
//           minPh: { $min: "$phReading" },
//           maxPh: { $max: "$phReading" },
//           avgPh: { $avg: "$phReading" },
//           minHeight: { $min: "$heightReading" },
//           maxHeight: { $max: "$heightReading" },
//           avgHeight: { $avg: "$heightReading" },
//           minTds: { $min: "$tdsReading" },
//           maxTds: { $max: "$tdsReading" },
//           avgTds: { $avg: "$tdsReading" },
//         },
//       },
//       { $sort: { "_id.year": 1, "_id.month": 1 } },
//     ]);

//     // Retrieve alerts
//     const alerts = await Alert.aggregate([
//       {
//         $match: {
//           pondId: { $in: pondIds },
//           createdAt: { $gte: startDate, ...(endDate ? { $lte: endDate } : {}) },
//         },
//       },
//       {
//         $group: {
//           _id: "$pondId",
//           totalAlerts: { $sum: 1 },
//           criticalAlerts: { $sum: { $cond: [{ $eq: ["$alertStatus", "critical"] }, 1, 0] } },
//           warningAlerts: { $sum: { $cond: [{ $eq: ["$alertStatus", "warning"] }, 1, 0] } },
//         },
//       },
//     ]);

//     // Round all numerical fields in readings and alerts
//     const roundToFirstDecimal = (num) => Math.round(num * 10) / 10;

//     const roundedReadings = readings.map((reading) => ({
//       ...reading,
//       minTemperature: roundToFirstDecimal(reading.minTemperature),
//       maxTemperature: roundToFirstDecimal(reading.maxTemperature),
//       avgTemperature: roundToFirstDecimal(reading.avgTemperature),
//       minPh: roundToFirstDecimal(reading.minPh),
//       maxPh: roundToFirstDecimal(reading.maxPh),
//       avgPh: roundToFirstDecimal(reading.avgPh),
//       minHeight: roundToFirstDecimal(reading.minHeight),
//       maxHeight: roundToFirstDecimal(reading.maxHeight),
//       avgHeight: roundToFirstDecimal(reading.avgHeight),
//       minTds: roundToFirstDecimal(reading.minTds),
//       maxTds: roundToFirstDecimal(reading.maxTds),
//       avgTds: roundToFirstDecimal(reading.avgTds),
//     }));

//     const roundedAlerts = alerts.map((alert) => ({
//       ...alert,
//       totalAlerts: roundToFirstDecimal(alert.totalAlerts),
//       criticalAlerts: roundToFirstDecimal(alert.criticalAlerts),
//       warningAlerts: roundToFirstDecimal(alert.warningAlerts),
//     }));

//     // Combine rounded readings and alerts
//     const report = ponds.map((pond) => ({
//       pond: pond.name,
//       readings: roundedReadings.filter((r) => r._id.pondId.toString() === pond._id.toString()),
//       alerts: roundedAlerts.filter((a) => a._id.toString() === pond._id.toString()),
//     }));

//     const data =

//     res.status(200).json(CreateSuccess(200, "Report generated successfully", report));
//   } catch (error) {
//     console.error("Error in generateReport:", error);
//     res.status(500).json(CreateError(500, error.message));
//   }
// };

// export const generateReport = async (req, res) => {
//   const { pondId, type, periodId } = req.query;
//   let startDate, endDate;

//   try {
//     const now = new Date();

//     // Determine the date range based on type
//     if (type === "daily") {
//       startDate = new Date(now.setHours(now.getHours() - 24));
//     } else if (type === "weekly") {
//       startDate = new Date(now.setDate(now.getDate() - 7));
//     } else if (type === "monthly") {
//       startDate = new Date(now.setMonth(now.getMonth() - 1));
//     } else if (type === "period") {
//       if (!periodId) {
//         return res.status(400).json(CreateError(400, "Period ID is required for 'period' type."));
//       }
//       const period = await Period.findById(periodId);
//       if (!period) {
//         return res.status(404).json(CreateError(404, "Period not found."));
//       }
//       startDate = period.periodStart;
//       endDate = period.periodEnd || new Date();
//     } else {
//       return res.status(400).json(CreateError(400, "Invalid report type."));
//     }

//     // Fetch pond(s)
//     let pondQuery;
//     if (pondId === "all") {
//       pondQuery = {}; // Fetch all ponds
//     } else {
//       if (!mongoose.Types.ObjectId.isValid(pondId)) {
//         return res.status(400).json(CreateError(400, "Invalid Pond ID."));
//       }
//       pondQuery = { _id: new mongoose.Types.ObjectId(pondId) }; // Correctly construct ObjectId
//     }

//     const ponds = await Pond.find(pondQuery);
//     const pondIds = ponds.map((pond) => pond._id);

//     // Ensure there are ponds to report on
//     if (!ponds.length) {
//       return res.status(404).json(CreateError(404, "No ponds found matching the criteria."));
//     }

//     // Retrieve sensor readings grouped by month
//     const readings = await Esp32.aggregate([
//       {
//         $match: {
//           pondId: { $in: pondIds },
//           createdAt: { $gte: startDate, ...(endDate ? { $lte: endDate } : {}) },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             pondId: "$pondId",
//             year: { $year: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } },
//             month: { $month: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } },
//           },
//           minTemperature: { $min: "$temperatureReading" },
//           maxTemperature: { $max: "$temperatureReading" },
//           avgTemperature: { $avg: "$temperatureReading" },
//           minPh: { $min: "$phReading" },
//           maxPh: { $max: "$phReading" },
//           avgPh: { $avg: "$phReading" },
//           minHeight: { $min: "$heightReading" },
//           maxHeight: { $max: "$heightReading" },
//           avgHeight: { $avg: "$heightReading" },
//           minTds: { $min: "$tdsReading" },
//           maxTds: { $max: "$tdsReading" },
//           avgTds: { $avg: "$tdsReading" },
//         },
//       },
//       { $sort: { "_id.year": 1, "_id.month": 1 } },
//     ]);

//     // Retrieve alerts
//     const alerts = await Alert.aggregate([
//       {
//         $match: {
//           pondId: { $in: pondIds },
//           createdAt: { $gte: startDate, ...(endDate ? { $lte: endDate } : {}) },
//         },
//       },
//       {
//         $group: {
//           _id: "$pondId",
//           totalAlerts: { $sum: 1 },
//           criticalAlerts: { $sum: { $cond: [{ $eq: ["$alertStatus", "critical"] }, 1, 0] } },
//           warningAlerts: { $sum: { $cond: [{ $eq: ["$alertStatus", "warning"] }, 1, 0] } },
//         },
//       },
//     ]);

//     // Calculate the global timeframe
//     const earliestReading = await Esp32.findOne({ pondId: { $in: pondIds } })
//       .sort({ createdAt: 1 })
//       .select("createdAt")
//       .exec();
//     const latestReading = await Esp32.findOne({ pondId: { $in: pondIds } })
//       .sort({ createdAt: -1 })
//       .select("createdAt")
//       .exec();

//     const earliestAlert = await Alert.findOne({ pondId: { $in: pondIds } })
//       .sort({ createdAt: 1 })
//       .select("createdAt")
//       .exec();
//     const latestAlert = await Alert.findOne({ pondId: { $in: pondIds } })
//       .sort({ createdAt: -1 })
//       .select("createdAt")
//       .exec();

//     const globalTimeframe = {
//       earliest: new Date(Math.min(earliestReading?.createdAt || Infinity, earliestAlert?.createdAt || Infinity)),
//       latest: new Date(Math.max(latestReading?.createdAt || 0, latestAlert?.createdAt || 0)),
//     };

//     // Round all numerical fields in readings and alerts
//     const roundToFirstDecimal = (num) => Math.round(num * 10) / 10;

//     const roundedReadings = readings.map((reading) => ({
//       ...reading,
//       minTemperature: roundToFirstDecimal(reading.minTemperature),
//       maxTemperature: roundToFirstDecimal(reading.maxTemperature),
//       avgTemperature: roundToFirstDecimal(reading.avgTemperature),
//       minPh: roundToFirstDecimal(reading.minPh),
//       maxPh: roundToFirstDecimal(reading.maxPh),
//       avgPh: roundToFirstDecimal(reading.avgPh),
//       minHeight: roundToFirstDecimal(reading.minHeight),
//       maxHeight: roundToFirstDecimal(reading.maxHeight),
//       avgHeight: roundToFirstDecimal(reading.avgHeight),
//       minTds: roundToFirstDecimal(reading.minTds),
//       maxTds: roundToFirstDecimal(reading.maxTds),
//       avgTds: roundToFirstDecimal(reading.avgTds),
//     }));

//     const roundedAlerts = alerts.map((alert) => ({
//       ...alert,
//       totalAlerts: roundToFirstDecimal(alert.totalAlerts),
//       criticalAlerts: roundToFirstDecimal(alert.criticalAlerts),
//       warningAlerts: roundToFirstDecimal(alert.warningAlerts),
//     }));

//     // Combine rounded readings and alerts
//     const report = ponds.map((pond) => ({
//       pond: pond.name,
//       readings: roundedReadings.filter((r) => r._id.pondId.toString() === pond._id.toString()),
//       alerts: roundedAlerts.filter((a) => a._id.toString() === pond._id.toString()),
//     }));

//     // Add global timeframe to the response
//     res.status(200).json(CreateSuccess(200, "Report generated successfully", { report, globalTimeframe }));
//   } catch (error) {
//     console.error("Error in generateReport:", error);
//     res.status(500).json(CreateError(500, error.message));
//   }
// };

// export const generateReport = async (req, res) => {
//   const { pondId, type, periodId } = req.query;
//   let startDate, endDate;

//   try {
//     const now = new Date();

//     // Determine the date range based on type
//     if (type === "daily") {
//       startDate = new Date(now.setHours(now.getHours() - 24));
//     } else if (type === "weekly") {
//       startDate = new Date(now.setDate(now.getDate() - 7));
//     } else if (type === "monthly") {
//       startDate = new Date(now.setMonth(now.getMonth() - 1));
//     } else if (type === "period") {
//       if (!periodId) {
//         return res.status(400).json(CreateError(400, "Period ID is required for 'period' type."));
//       }
//       const period = await Period.findById(periodId);
//       if (!period) {
//         return res.status(404).json(CreateError(404, "Period not found."));
//       }
//       startDate = period.periodStart;
//       endDate = period.periodEnd || new Date();
//     } else {
//       return res.status(400).json(CreateError(400, "Invalid report type."));
//     }

//     // Fetch pond(s)
//     let pondQuery;
//     if (pondId === "all") {
//       pondQuery = {}; // Fetch all ponds
//     } else {
//       if (!mongoose.Types.ObjectId.isValid(pondId)) {
//         return res.status(400).json(CreateError(400, "Invalid Pond ID."));
//       }
//       pondQuery = { _id: new mongoose.Types.ObjectId(pondId) }; // Correctly construct ObjectId
//     }

//     const ponds = await Pond.find(pondQuery);
//     const pondIds = ponds.map((pond) => pond._id);

//     // Ensure there are ponds to report on
//     if (!ponds.length) {
//       return res.status(404).json(CreateError(404, "No ponds found matching the criteria."));
//     }

//     // Retrieve sensor readings grouped by month
//     const readings = await Esp32.aggregate([
//       {
//         $match: {
//           pondId: { $in: pondIds },
//           createdAt: { $gte: startDate, ...(endDate ? { $lte: endDate } : {}) },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             pondId: "$pondId",
//             year: { $year: "$createdAt" },
//             month: { $month: "$createdAt" },
//           },
//           minTemperature: { $min: "$temperatureReading" },
//           maxTemperature: { $max: "$temperatureReading" },
//           avgTemperature: { $avg: "$temperatureReading" },
//           minPh: { $min: "$phReading" },
//           maxPh: { $max: "$phReading" },
//           avgPh: { $avg: "$phReading" },
//           minHeight: { $min: "$heightReading" },
//           maxHeight: { $max: "$heightReading" },
//           avgHeight: { $avg: "$heightReading" },
//           minTds: { $min: "$tdsReading" },
//           maxTds: { $max: "$tdsReading" },
//           avgTds: { $avg: "$tdsReading" },
//         },
//       },
//       { $sort: { "_id.year": 1, "_id.month": 1 } },
//     ]);

//     // Retrieve alerts
//     const alerts = await Alert.aggregate([
//       {
//         $match: {
//           pondId: { $in: pondIds },
//           createdAt: { $gte: startDate, ...(endDate ? { $lte: endDate } : {}) },
//         },
//       },
//       {
//         $group: {
//           _id: "$pondId",
//           totalAlerts: { $sum: 1 },
//           criticalAlerts: { $sum: { $cond: [{ $eq: ["$alertStatus", "critical"] }, 1, 0] } },
//           warningAlerts: { $sum: { $cond: [{ $eq: ["$alertStatus", "warning"] }, 1, 0] } },
//         },
//       },
//     ]);

//     // Calculate the global timeframe from fetched data
//     let earliestTimestamp = Infinity;
//     let latestTimestamp = 0;

//     // Extract earliest and latest timestamps from readings
//     readings.forEach((reading) => {
//       const readingDate = new Date(reading._id.year, reading._id.month - 1).getTime(); // Convert to timestamp
//       console.log(new Date(readingDate));
//       if (readingDate < earliestTimestamp) earliestTimestamp = readingDate;
//       if (readingDate > latestTimestamp) latestTimestamp = readingDate;
//     });

//     // Extract earliest and latest timestamps from alerts
//     alerts.forEach((alert) => {
//       const alertDate = new Date(alert.createdAt).getTime();
//       if (alertDate < earliestTimestamp) earliestTimestamp = alertDate;
//       if (alertDate > latestTimestamp) latestTimestamp = alertDate;
//     });

//     const globalTimeframe = {
//       earliest: earliestTimestamp === Infinity ? null : new Date(earliestTimestamp),
//       latest: latestTimestamp === 0 ? null : new Date(latestTimestamp),
//     };

//     console.log(globalTimeframe);

//     // Round all numerical fields in readings and alerts
//     const roundToFirstDecimal = (num) => Math.round(num * 10) / 10;

//     const roundedReadings = readings.map((reading) => ({
//       ...reading,
//       minTemperature: roundToFirstDecimal(reading.minTemperature),
//       maxTemperature: roundToFirstDecimal(reading.maxTemperature),
//       avgTemperature: roundToFirstDecimal(reading.avgTemperature),
//       minPh: roundToFirstDecimal(reading.minPh),
//       maxPh: roundToFirstDecimal(reading.maxPh),
//       avgPh: roundToFirstDecimal(reading.avgPh),
//       minHeight: roundToFirstDecimal(reading.minHeight),
//       maxHeight: roundToFirstDecimal(reading.maxHeight),
//       avgHeight: roundToFirstDecimal(reading.avgHeight),
//       minTds: roundToFirstDecimal(reading.minTds),
//       maxTds: roundToFirstDecimal(reading.maxTds),
//       avgTds: roundToFirstDecimal(reading.avgTds),
//     }));

//     const roundedAlerts = alerts.map((alert) => ({
//       ...alert,
//       totalAlerts: roundToFirstDecimal(alert.totalAlerts),
//       criticalAlerts: roundToFirstDecimal(alert.criticalAlerts),
//       warningAlerts: roundToFirstDecimal(alert.warningAlerts),
//     }));

//     // Combine rounded readings and alerts
//     const report = ponds.map((pond) => ({
//       pond: pond.name,
//       readings: roundedReadings.filter((r) => r._id.pondId.toString() === pond._id.toString()),
//       alerts: roundedAlerts.filter((a) => a._id.toString() === pond._id.toString()),
//     }));

//     // Add global timeframe to the response
//     res.status(200).json(CreateSuccess(200, "Report generated successfully", { report, globalTimeframe }));
//   } catch (error) {
//     console.error("Error in generateReport:", error);
//     res.status(500).json(CreateError(500, error.message));
//   }
// };

// export const generateReport = async (req, res) => {
//   const { pondId, type, periodId } = req.query;
//   let startDate, endDate;

//   try {
//     const now = new Date();

//     // Determine the date range based on type
//     if (type === "daily") {
//       startDate = new Date(now.setHours(0, 0, 0, 0)); // Start of the day
//       endDate = new Date(now.setHours(23, 59, 59, 999)); // End of the day
//     } else if (type === "weekly") {
//       const startOfWeek = new Date(now);
//       startOfWeek.setDate(now.getDate() - now.getDay()); // Start of the week
//       startDate = new Date(startOfWeek.setHours(0, 0, 0, 0));
//       endDate = new Date(now.setHours(23, 59, 59, 999)); // End of the current day
//     } else if (type === "monthly") {
//       const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // Start of the month
//       startDate = new Date(startOfMonth.setHours(0, 0, 0, 0));
//       const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of the month
//       endDate = new Date(endOfMonth.setHours(23, 59, 59, 999));
//     } else if (type === "period") {
//       if (!periodId) {
//         return res.status(400).json(CreateError(400, "Period ID is required for 'period' type."));
//       }
//       const period = await Period.findById(periodId);
//       if (!period) {
//         return res.status(404).json(CreateError(404, "Period not found."));
//       }
//       startDate = period.periodStart;
//       endDate = period.periodEnd || new Date();
//     } else {
//       return res.status(400).json(CreateError(400, "Invalid report type."));
//     }

//     // Fetch pond(s)
//     let pondQuery;
//     if (pondId === "all") {
//       pondQuery = {}; // Fetch all ponds
//     } else {
//       if (!mongoose.Types.ObjectId.isValid(pondId)) {
//         return res.status(400).json(CreateError(400, "Invalid Pond ID."));
//       }
//       pondQuery = { _id: new mongoose.Types.ObjectId(pondId) }; // Correctly construct ObjectId
//     }

//     const ponds = await Pond.find(pondQuery);
//     const pondIds = ponds.map((pond) => pond._id);

//     // Ensure there are ponds to report on
//     if (!ponds.length) {
//       return res.status(404).json(CreateError(404, "No ponds found matching the criteria."));
//     }

//     // Retrieve sensor readings grouped by month
//     const readings = await Esp32.aggregate([
//       {
//         $match: {
//           pondId: { $in: pondIds },
//           createdAt: { $gte: startDate, $lte: endDate },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             pondId: "$pondId",
//             year: { $year: "$createdAt" },
//             month: { $month: "$createdAt" },
//           },
//           createdAt: { $first: "$createdAt" }, // Include exact createdAt for the group
//           minTemperature: { $min: "$temperatureReading" },
//           maxTemperature: { $max: "$temperatureReading" },
//           avgTemperature: { $avg: "$temperatureReading" },
//           minPh: { $min: "$phReading" },
//           maxPh: { $max: "$phReading" },
//           avgPh: { $avg: "$phReading" },
//           minHeight: { $min: "$heightReading" },
//           maxHeight: { $max: "$heightReading" },
//           avgHeight: { $avg: "$heightReading" },
//           minTds: { $min: "$tdsReading" },
//           maxTds: { $max: "$tdsReading" },
//           avgTds: { $avg: "$tdsReading" },
//         },
//       },
//       { $sort: { "_id.year": 1, "_id.month": 1 } },
//     ]);

//     // Retrieve alerts
//     const alerts = await Alert.aggregate([
//       {
//         $match: {
//           pondId: { $in: pondIds },
//           createdAt: { $gte: startDate, $lte: endDate },
//         },
//       },
//       {
//         $group: {
//           _id: "$pondId",
//           createdAt: { $first: "$createdAt" }, // Include exact createdAt for alerts
//           totalAlerts: { $sum: 1 },
//           criticalAlerts: { $sum: { $cond: [{ $eq: ["$alertStatus", "critical"] }, 1, 0] } },
//           warningAlerts: { $sum: { $cond: [{ $eq: ["$alertStatus", "warning"] }, 1, 0] } },
//         },
//       },
//     ]);

//     // Helper function for rounding
//     const roundToFirstDecimal = (num) => Math.round(num * 10) / 10;

//     // Apply rounding to readings
//     const roundedReadings = readings.map((reading) => ({
//       ...reading,
//       minTemperature: roundToFirstDecimal(reading.minTemperature),
//       maxTemperature: roundToFirstDecimal(reading.maxTemperature),
//       avgTemperature: roundToFirstDecimal(reading.avgTemperature),
//       minPh: roundToFirstDecimal(reading.minPh),
//       maxPh: roundToFirstDecimal(reading.maxPh),
//       avgPh: roundToFirstDecimal(reading.avgPh),
//       minHeight: roundToFirstDecimal(reading.minHeight),
//       maxHeight: roundToFirstDecimal(reading.maxHeight),
//       avgHeight: roundToFirstDecimal(reading.avgHeight),
//       minTds: roundToFirstDecimal(reading.minTds),
//       maxTds: roundToFirstDecimal(reading.maxTds),
//       avgTds: roundToFirstDecimal(reading.avgTds),
//     }));

//     // Apply rounding to alerts
//     const roundedAlerts = alerts.map((alert) => ({
//       ...alert,
//       totalAlerts: roundToFirstDecimal(alert.totalAlerts),
//       criticalAlerts: roundToFirstDecimal(alert.criticalAlerts),
//       warningAlerts: roundToFirstDecimal(alert.warningAlerts),
//     }));

//     // Check if the endDate > current date then set endDate to current date
//     if (endDate > new Date()) {
//       endDate = new Date();
//     }

//     // Define global timeframe based on the requested period
//     const globalTimeframe = {
//       earliest: startDate,
//       latest: endDate,
//     };

//     // Combine readings and alerts into the report
//     const report = ponds.map((pond) => ({
//       pond: pond.name,
//       readings: roundedReadings.filter((r) => r._id.pondId.toString() === pond._id.toString()),
//       alerts: roundedAlerts.filter((a) => a._id.toString() === pond._id.toString()),
//     }));

//     // Return the response
//     res.status(200).json(CreateSuccess(200, "Report generated successfully", { report, globalTimeframe }));
//   } catch (error) {
//     console.error("Error in generateReport:", error);
//     res.status(500).json(CreateError(500, error.message));
//   }
// };

export const generateReport = async (req, res) => {
  const { pondId, type, periodId } = req.query;
  let startDate, endDate;

  try {
    const now = new Date();

    // Determine the date range based on type
    if (type === "daily") {
      startDate = new Date(now.setHours(0, 0, 0, 0)); // Start of the day
      endDate = new Date(now.setHours(23, 59, 59, 999)); // End of the day
    } else if (type === "weekly") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of the week
      startDate = new Date(startOfWeek.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999)); // End of the current day
    } else if (type === "monthly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // Start of the month
      startDate = new Date(startOfMonth.setHours(0, 0, 0, 0));
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of the month
      endDate = new Date(endOfMonth.setHours(23, 59, 59, 999));
    } else if (type === "period") {
      if (!periodId) {
        return res.status(400).json(CreateError(400, "Period ID is required for 'period' type."));
      }
      const period = await Period.findById(periodId);
      if (!period) {
        return res.status(404).json(CreateError(404, "Period not found."));
      }
      startDate = period.periodStart;
      endDate = period.periodEnd || new Date();
    } else {
      return res.status(400).json(CreateError(400, "Invalid report type."));
    }

    // Fetch pond(s)
    let pondQuery;
    if (pondId === "all") {
      pondQuery = {}; // Fetch all ponds
    } else {
      if (!mongoose.Types.ObjectId.isValid(pondId)) {
        return res.status(400).json(CreateError(400, "Invalid Pond ID."));
      }
      pondQuery = { _id: new mongoose.Types.ObjectId(pondId) }; // Correctly construct ObjectId
    }

    const ponds = await Pond.find(pondQuery);
    const pondIds = ponds.map((pond) => pond._id);

    // Ensure there are ponds to report on
    if (!ponds.length) {
      return res.status(404).json(CreateError(404, "No ponds found matching the criteria."));
    }

    // Retrieve sensor readings grouped by month
    const readings = await Esp32.aggregate([
      {
        $match: {
          pondId: { $in: pondIds },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            pondId: "$pondId",
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          createdAt: { $first: "$createdAt" },
          minTemperature: { $min: "$temperatureReading" },
          maxTemperature: { $max: "$temperatureReading" },
          avgTemperature: { $avg: "$temperatureReading" },
          minPh: { $min: "$phReading" },
          maxPh: { $max: "$phReading" },
          avgPh: { $avg: "$phReading" },
          minHeight: { $min: "$heightReading" },
          maxHeight: { $max: "$heightReading" },
          avgHeight: { $avg: "$heightReading" },
          minTds: { $min: "$tdsReading" },
          maxTds: { $max: "$tdsReading" },
          avgTds: { $avg: "$tdsReading" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Retrieve alerts
    const alerts = await Alert.aggregate([
      {
        $match: {
          pondId: { $in: pondIds },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$pondId",
          createdAt: { $first: "$createdAt" },
          totalAlerts: { $sum: 1 },
          criticalAlerts: { $sum: { $cond: [{ $eq: ["$alertStatus", "critical"] }, 1, 0] } },
          warningAlerts: { $sum: { $cond: [{ $eq: ["$alertStatus", "warning"] }, 1, 0] } },
        },
      },
    ]);

    // Check if the endDate > current date then set endDate to current date
    if (endDate > new Date()) {
      endDate = new Date();
    }

    // Helper function for rounding
    const roundToFirstDecimal = (num) => Math.round(num * 10) / 10;

    // Round readings
    const roundedReadings = readings.map((reading) => ({
      ...reading,
      minTemperature: roundToFirstDecimal(reading.minTemperature),
      maxTemperature: roundToFirstDecimal(reading.maxTemperature),
      avgTemperature: roundToFirstDecimal(reading.avgTemperature),
      minPh: roundToFirstDecimal(reading.minPh),
      maxPh: roundToFirstDecimal(reading.maxPh),
      avgPh: roundToFirstDecimal(reading.avgPh),
      minHeight: roundToFirstDecimal(reading.minHeight),
      maxHeight: roundToFirstDecimal(reading.maxHeight),
      avgHeight: roundToFirstDecimal(reading.avgHeight),
      minTds: roundToFirstDecimal(reading.minTds),
      maxTds: roundToFirstDecimal(reading.maxTds),
      avgTds: roundToFirstDecimal(reading.avgTds),
    }));

    // Round alerts
    const roundedAlerts = alerts.map((alert) => ({
      ...alert,
      totalAlerts: roundToFirstDecimal(alert.totalAlerts),
      criticalAlerts: roundToFirstDecimal(alert.criticalAlerts),
      warningAlerts: roundToFirstDecimal(alert.warningAlerts),
    }));

    // Combine pond safety values with rounding
    const pondSafetyMap = ponds.reduce((acc, pond) => {
      acc[pond._id.toString()] = {
        safeMinPh: roundToFirstDecimal(pond.safeMinPh),
        safeMaxPh: roundToFirstDecimal(pond.safeMaxPh),
        safeMinTemperature: roundToFirstDecimal(pond.safeMinTemperature),
        safeMaxTemperature: roundToFirstDecimal(pond.safeMaxTemperature),
        safeMinHeight: roundToFirstDecimal(pond.safeMinHeight),
        safeMaxHeight: roundToFirstDecimal(pond.safeMaxHeight),
        safeMinTds: roundToFirstDecimal(pond.safeMinTds),
        safeMaxTds: roundToFirstDecimal(pond.safeMaxTds),
      };
      return acc;
    }, {});

    // Combine readings, alerts, and pond safety values into the report
    const report = ponds.map((pond) => ({
      pond: pond.name,
      safety: pondSafetyMap[pond._id.toString()],
      readings: roundedReadings.filter((r) => r._id.pondId.toString() === pond._id.toString()),
      alerts: roundedAlerts.filter((a) => a._id.toString() === pond._id.toString()),
    }));

    // Define global timeframe
    const globalTimeframe = {
      earliest: startDate,
      latest: endDate,
    };

    // Return the response
    res.status(200).json(CreateSuccess(200, "Report generated successfully", { report, globalTimeframe }));
  } catch (error) {
    console.error("Error in generateReport:", error);
    res.status(500).json(CreateError(500, error.message));
  }
};
