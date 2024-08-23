import mongoose from "mongoose";

// Model for ESP32, used to store the ESP readings into the database.
const Esp32Schema = mongoose.Schema({
    serialNumber: {
        type: String,
        required: true,
        max: 50,
    },
    passKey: {
        type: String,
        required: true,
        min: 6
    },
    phReading: {
        type: Number,
        max: 20
    },
    heightReading: {
        type: Number,
        max: 200
    },
    temperatureReading: {
        type: Number,
        max: 80
    },
    tdsReading: {
        type: Number,
        max: 1000
    },
    pondId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pond"
    }

}, {timestamps: true});

export default mongoose.model("Esp32", Esp32Schema);