import mongoose from "mongoose";

//Pond model, used to store all relevant information regarding a particular pond.
const PondSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        max: 50,
        unique: true
    },
    area: {
        type: Number,
        required: true,
        min: 6
    },
    shrimpbreed: {
        type: String,
        max: 80
    },
    tonnage: {
        required: true,
        type: Number,
    },
    connectedEsp32Serial: {
        default: null,
        type: String,
        max: 50
    },
    connectedEsp32Passkey: {
        default: null,
        type: String,
        max: 50
    },
    safeMinPh: {
        type: Number,
        default: 6.5,
    },
    safeMaxPh: {
        type: Number,
        default: 8.5,
    },
    safeMinTemperature: {
        type: Number,
        default: 25,
    },
    safeMaxTemperature: {
        type: Number,
        default: 40,
    },
    safeMinHeight: {
        type: Number,
        default: 40,
    },
    safeMaxHeight: {
        type: Number,
        default: 200,
    },
    safeMinTds: {
        type: Number,
        default: 200,
    },
    safeMaxTds: {
        type: Number,
        default: 1000,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }

}, {timestamps: true});

export default mongoose.model("Pond", PondSchema);