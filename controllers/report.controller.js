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


// Utility to calculate median
const calculateMedian = (numbers) => {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};


// Express route handler to generate the report
// export const generateReport = async (req, res) => {
//     const { pondId, type, periodId } = req.query;
//     let startDate, endDate;

//     try {
//         const now = new Date();

//         // Set date range based on the type of report
//         if (type === 'daily') {
//             startDate = new Date(now.setHours(now.getHours() - 24));
//         } else if (type === 'weekly') {
//             startDate = new Date(now.setDate(now.getDate() - 7));
//         } else if (type === 'monthly') {
//             startDate = new Date(now.setMonth(now.getMonth() - 1));
//         } else if (type === 'period') {
//             // Check for periodId and retrieve period details from database
//             if (!periodId) {
//                 return res.status(400).json(CreateError(400, "Period ID is required for 'period' type."));
//             }
//             const period = await Period.findById(periodId);
//             if (!period) {
//                 return res.status(404).json(CreateError(404, "Period not found."));
//             }
//             startDate = period.periodStart;
//             endDate = period.periodEnd || new Date(); // If no periodEnd, use current date
//         } else {
//             return res.status(400).json(CreateError(400, "Invalid report type."));
//         }

//         // Fetch pond(s)
//         const pondQuery = pondId === 'all' ? {} : { _id: mongoose.Types.ObjectId(pondId) };
//         const ponds = await Pond.find(pondQuery);
//         const pondIds = ponds.map((pond) => pond._id);

//         // Retrieve sensor readings within the date range
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
//                         timeFrame: {
//                             $cond: {
//                                 if: { $eq: [type, "daily"] },
//                                 then: { $hour: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } },
//                                 else: {
//                                     $cond: {
//                                         if: { $eq: [type, "weekly"] },
//                                         then: { $dayOfWeek: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } },
//                                         else: {
//                                             $cond: {
//                                                 if: { $eq: [type, "monthly"] },
//                                                 then: { $week: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } },
//                                                 else: { $month: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } }
//                                             }
//                                         }
//                                     }
//                                 }
//                             }
//                         }
//                     },
//                     temperatureReadings: { $push: "$temperatureReading" },
//                     phReadings: { $push: "$phReading" },
//                     heightReadings: { $push: "$heightReading" },
//                     tdsReadings: { $push: "$tdsReading" },
//                     minTemperature: { $min: "$temperatureReading" },
//                     maxTemperature: { $max: "$temperatureReading" },
//                     minPh: { $min: "$phReading" },
//                     maxPh: { $max: "$phReading" },
//                     minHeight: { $min: "$heightReading" },
//                     maxHeight: { $max: "$heightReading" },
//                     minTds: { $min: "$tdsReading" },
//                     maxTds: { $max: "$tdsReading" },
//                     avgTemperature: { $avg: "$temperatureReading" },
//                     avgPh: { $avg: "$phReading" },
//                     avgHeight: { $avg: "$heightReading" },
//                     avgTds: { $avg: "$tdsReading" },
//                 }
//             },
//             { $sort: { "_id.timeFrame": 1 } } // Sort by timeFrame in ascending order
//         ]);

//         // Calculate medians for each pond
//         const report = readings.map((r) => {
//             const medianTemperature = calculateMedian(r.temperatureReadings);
//             const medianPh = calculateMedian(r.phReadings);
//             const medianHeight = calculateMedian(r.heightReadings);
//             const medianTds = calculateMedian(r.tdsReadings);

//             return {
//                 pondId: r._id.pondId,
//                 timeFrame: r._id.timeFrame,
//                 medianTemperature,
//                 medianPh,
//                 medianHeight,
//                 medianTds,
//                 avgTemperature: r.avgTemperature,
//                 avgPh: r.avgPh,
//                 avgHeight: r.avgHeight,
//                 avgTds: r.avgTds,
//                 minTemperature: r.minTemperature,
//                 maxTemperature: r.maxTemperature,
//                 minPh: r.minPh,
//                 maxPh: r.maxPh,
//                 minHeight: r.minHeight,
//                 maxHeight: r.maxHeight,
//                 minTds: r.minTds,
//                 maxTds: r.maxTds,
//             };
//         });

//         const alerts = await Alert.aggregate([
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
//                         timeFrame: {
//                             $cond: {
//                                 if: { $eq: [type, "daily"] },
//                                 then: { $hour: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } },
//                                 else: {
//                                     $cond: {
//                                         if: { $eq: [type, "weekly"] },
//                                         then: { $dayOfWeek: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } },
//                                         else: {
//                                             $cond: {
//                                                 if: { $eq: [type, "monthly"] },
//                                                 then: { $week: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } },
//                                                 else: { $month: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } }
//                                             }
//                                         }
//                                     }
//                                 }
//                             }
//                         }
//                     },
//                     totalAlerts: { $sum: 1 },
//                     criticalAlerts: { $sum: { $cond: [{ $eq: ["$alertStatus", "critical"] }, 1, 0] } },
//                     warningAlerts: { $sum: { $cond: [{ $eq: ["$alertStatus", "warning"] }, 1, 0] } }
//                 }
//             },
//             { $sort: { "_id.timeFrame": 1 } } // Sort by timeFrame in ascending order
//         ]);
        
//         // Combine readings and alerts in the report
//         const result = ponds.map((pond) => ({
//             pond: pond.name,
//             readings: report.filter((r) => r.pondId.toString() === pond._id.toString()),
//             alerts: alerts.filter((a) => a._id.pondId.toString() === pond._id.toString()),
//         }));

//         res.status(200).json(CreateSuccess(200, "Report generated successfully", result));
//     } catch (error) {
//         res.status(500).json(CreateError(500, error.message));
//     }
// };


// Express route handler to generate the report
export const generateReport = async (req, res) => {
    const { pondId, type, periodId } = req.query;
    let startDate, endDate;

    try {
        const now = new Date();

        // Determine the date range based on type
        if (type === "daily") {
            startDate = new Date(now.setHours(now.getHours() - 24));
        } else if (type === "weekly") {
            startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (type === "monthly") {
            startDate = new Date(now.setMonth(now.getMonth() - 1));
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

        // Retrieve sensor readings
        const readings = await Esp32.aggregate([
            {
                $match: {
                    pondId: { $in: pondIds },
                    createdAt: { $gte: startDate, ...(endDate ? { $lte: endDate } : {}) }
                }
            },
            {
                $group: {
                    _id: {
                        pondId: "$pondId",
                        timeFrame: {
                            $cond: {
                                if: { $eq: [type, "daily"] },
                                then: { $hour: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } },
                                else: {
                                    $cond: {
                                        if: { $eq: [type, "weekly"] },
                                        then: { $dayOfWeek: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } },
                                        else: {
                                            $cond: {
                                                if: { $eq: [type, "monthly"] },
                                                then: { $week: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } },
                                                else: { $month: { $dateAdd: { startDate: "$createdAt", unit: "hour", amount: 8 } } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    // temperatureReadings: { $push: "$temperatureReading" },
                    // phReadings: { $push: "$phReading" },
                    // heightReadings: { $push: "$heightReading" },
                    // tdsReadings: { $push: "$tdsReading" },
                    minTemperature: { $min: "$temperatureReading" },
                    maxTemperature: { $max: "$temperatureReading" },
                    minPh: { $min: "$phReading" },
                    maxPh: { $max: "$phReading" },
                    minHeight: { $min: "$heightReading" },
                    maxHeight: { $max: "$heightReading" },
                    minTds: { $min: "$tdsReading" },
                    maxTds: { $max: "$tdsReading" },
                    avgTemperature: { $avg: "$temperatureReading" },
                    avgPh: { $avg: "$phReading" },
                    avgHeight: { $avg: "$heightReading" },
                    avgTds: { $avg: "$tdsReading" },
                }
            },
            { $sort: { "_id.timeFrame": 1 } }
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

        // Combine readings and alerts
        const report = ponds.map((pond) => ({
            pond: pond.name,
            readings: readings.filter((r) => r._id.pondId.toString() === pond._id.toString()),
            alerts: alerts.filter((a) => a._id.toString() === pond._id.toString())
        }));

        res.status(200).json(CreateSuccess(200, "Report generated successfully", report));
    } catch (error) {
        console.error("Error in generateReport:", error);
        res.status(500).json(CreateError(500, error.message));
    }
};
