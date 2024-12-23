import Alert from "../models/Alert.js";
import Pond from "../models/Pond.js"
import Esp32 from "../models/esp32.js"
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


//v2 bermasalah di period gamau masuk bulan pertama.
// export const generateReport = async (req, res) => {
//     const { pondId, type } = req.query; // Removed periodId
//     let startDate, endDate;

//     try {
//         const now = new Date();
//         const timezoneOffset = parseInt(process.env.TIMEZONE || 0, 10); // Default to GMT if TIMEZONE is not set

//         // Determine the date range based on type
//         if (type === "daily") {
//             startDate = new Date(now.setHours(now.getHours() - 24));
//         } else if (type === "weekly") {
//             startDate = new Date(now.setDate(now.getDate() - 7));
//         } else if (type === "monthly") {
//             startDate = new Date(now.setMonth(now.getMonth() - 1));
//         } else if (type === "period") {
//             const activePeriod = await Period.findOne({ isActive: true }); // Find active period
//             if (!activePeriod) {
//                 return res.status(404).json(CreateError(404, "No active period found."));
//             }
//             startDate = activePeriod.periodStart;
//             endDate = activePeriod.periodEnd || now; // Use current date if periodEnd is not defined
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

//         // Aggregation logic based on report type
//         let groupStage = {};
//         let sortStage = {};

//         if (type === "daily") {
//             // Group by hour for daily reports
//             groupStage = {
//                 _id: {
//                     pondId: "$pondId",
//                     year: { $year: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } },
//                     month: { $month: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } },
//                     day: { $dayOfMonth: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } },
//                     hour: { $hour: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } }
//                 }
//             };
//             sortStage = { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 };
//         } else if (type === "weekly") {
//             // Group by day for weekly reports
//             groupStage = {
//                 _id: {
//                     pondId: "$pondId",
//                     year: { $year: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } },
//                     month: { $month: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } },
//                     day: { $dayOfMonth: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } }
//                 }
//             };
//             sortStage = { "_id.year": 1, "_id.month": 1, "_id.day": 1 };
//         } else if (type === "monthly") {
//             // Group by week for monthly reports
//             groupStage = {
//                 _id: {
//                     pondId: "$pondId",
//                     year: { $year: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } },
//                     month: { $month: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } },
//                     week: { $week: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } }
//                 }
//             };
//             sortStage = { "_id.year": 1, "_id.month": 1, "_id.week": 1 };
//         } else if (type === "period") {
//             // Group by month for period reports
//             groupStage = {
//                 _id: {
//                     pondId: "$pondId",
//                     year: { $year: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } },
//                     month: { $month: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } }
//                 }
//             };
//             sortStage = { "_id.year": 1, "_id.month": 1 };
//         }

//         // Perform the aggregation
//         const readings = await Esp32.aggregate([
//             {
//                 $match: {
//                     pondId: { $in: pondIds },
//                     createdAt: { $gte: startDate, ...(endDate ? { $lte: endDate } : {}) }
//                 }
//             },
//             {
//                 $group: {
//                     ...groupStage,
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
//             { $sort: sortStage }
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

//         // Round all numerical fields in readings and alerts
//         const roundToFirstDecimal = (num) => Math.round(num * 10) / 10;

//         const roundedReadings = readings.map((reading) => ({
//             ...reading,
//             minTemperature: roundToFirstDecimal(reading.minTemperature),
//             maxTemperature: roundToFirstDecimal(reading.maxTemperature),
//             avgTemperature: roundToFirstDecimal(reading.avgTemperature),
//             minPh: roundToFirstDecimal(reading.minPh),
//             maxPh: roundToFirstDecimal(reading.maxPh),
//             avgPh: roundToFirstDecimal(reading.avgPh),
//             minHeight: roundToFirstDecimal(reading.minHeight),
//             maxHeight: roundToFirstDecimal(reading.maxHeight),
//             avgHeight: roundToFirstDecimal(reading.avgHeight),
//             minTds: roundToFirstDecimal(reading.minTds),
//             maxTds: roundToFirstDecimal(reading.maxTds),
//             avgTds: roundToFirstDecimal(reading.avgTds)
//         }));

//         const roundedAlerts = alerts.map((alert) => ({
//             ...alert,
//             totalAlerts: roundToFirstDecimal(alert.totalAlerts),
//             criticalAlerts: roundToFirstDecimal(alert.criticalAlerts),
//             warningAlerts: roundToFirstDecimal(alert.warningAlerts)
//         }));

//         // Combine rounded readings and alerts
//         const report = ponds.map((pond) => ({
//             pond: pond.name,
//             readings: roundedReadings.filter((r) => r._id.pondId.toString() === pond._id.toString()),
//             alerts: roundedAlerts.filter((a) => a._id.toString() === pond._id.toString())
//         }));

//         res.status(200).json(CreateSuccess(200, "Report generated successfully", report));
//     } catch (error) {
//         console.error("Error in generateReport:", error);
//         res.status(500).json(CreateError(500, error.message));
//     }
// };


export const generateReport = async (req, res) => {
    const { pondId, type } = req.query; // Removed periodId
    let startDate, endDate;

    try {
        const now = new Date();
        const timezoneOffset = parseInt(process.env.TIMEZONE || 0, 10); // Default to GMT if TIMEZONE is not set

        // Determine the date range based on type
        if (type === "daily") {
            startDate = new Date(now.setHours(now.getHours() - 24));
        } else if (type === "weekly") {
            startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (type === "monthly") {
            startDate = new Date(now.setMonth(now.getMonth() - 1));
        } else if (type === "period") {
            const activePeriod = await Period.findOne({ isActive: true }); // Find active period
            if (!activePeriod) {
                return res.status(404).json(CreateError(404, "No active period found."));
            }
            startDate = activePeriod.periodStart;
            endDate = activePeriod.periodEnd || now; // Use current date if periodEnd is not defined
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

        // Aggregation logic based on report type
        let groupStage = {};
        let sortStage = {};

        if (type === "daily") {
            // Group by hour for daily reports
            groupStage = {
                _id: {
                    pondId: "$pondId",
                    year: { $year: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } },
                    month: { $month: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } },
                    day: { $dayOfMonth: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } },
                    hour: { $hour: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } }
                }
            };
            sortStage = { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 };
        } else if (type === "weekly") {
            // Group by day for weekly reports
            groupStage = {
                _id: {
                    pondId: "$pondId",
                    year: { $year: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } },
                    month: { $month: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } },
                    day: { $dayOfMonth: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } }
                }
            };
            sortStage = { "_id.year": 1, "_id.month": 1, "_id.day": 1 };
        } else if (type === "monthly") {
            // Group by week for monthly reports
            groupStage = {
                _id: {
                    pondId: "$pondId",
                    year: { $year: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } },
                    month: { $month: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } },
                    week: { $week: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } }
                }
            };
            sortStage = { "_id.year": 1, "_id.month": 1, "_id.week": 1 };
        } else if (type === "period") {
            // Group by month for period reports
            groupStage = {
                _id: {
                    pondId: "$pondId",
                    year: { $year: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } },
                    month: { $month: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: timezoneOffset } } }
                }
            };
            sortStage = { "_id.year": 1, "_id.month": 1 };
        }

        // Perform the aggregation
        const readings = await Esp32.aggregate([
            {
                $match: {
                    pondId: { $in: pondIds },
                    createdAt: { $gte: startDate, ...(endDate ? { $lte: endDate } : {}) }
                }
            },
            {
                $group: {
                    ...groupStage,
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
                    avgTds: { $avg: "$tdsReading" }
                }
            },
            { $sort: sortStage }
        ]);

        // Retrieve alerts
        const alerts = await Alert.aggregate([
            {
                $match: {
                    pondId: { $in: pondIds },
                    createdAt: { $gte: startDate, ...(endDate ? { $lte: endDate } : {}) }
                }
            },
            {
                $group: {
                    _id: "$pondId",
                    totalAlerts: { $sum: 1 },
                    criticalAlerts: { $sum: { $cond: [{ $eq: ["$alertStatus", "critical"] }, 1, 0] } },
                    warningAlerts: { $sum: { $cond: [{ $eq: ["$alertStatus", "warning"] }, 1, 0] } }
                }
            }
        ]);

        // Round all numerical fields in readings and alerts
        const roundToFirstDecimal = (num) => Math.round(num * 10) / 10;

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
            avgTds: roundToFirstDecimal(reading.avgTds)
        }));

        const roundedAlerts = alerts.map((alert) => ({
            ...alert,
            totalAlerts: roundToFirstDecimal(alert.totalAlerts),
            criticalAlerts: roundToFirstDecimal(alert.criticalAlerts),
            warningAlerts: roundToFirstDecimal(alert.warningAlerts)
        }));

        // Combine rounded readings and alerts
        const report = ponds.map((pond) => ({
            pond: pond.name,
            readings: roundedReadings.filter((r) => r._id.pondId.toString() === pond._id.toString()),
            alerts: roundedAlerts.filter((a) => a._id.toString() === pond._id.toString())
        }));

        res.status(200).json(CreateSuccess(200, "Report generated successfully", report));
    } catch (error) {
        console.error("Error in generateReport:", error);
        res.status(500).json(CreateError(500, error.message));
    }
};




