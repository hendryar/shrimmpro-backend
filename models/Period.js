import mongoose from "mongoose";

//Model for period, used to define a period of time for the pond.
//Used mainly for easier book-keeping of the pond's data.
const PeriodSchema = mongoose.Schema({
    periodName: {
        type: String,
        required: true,
        max: 50,
    },
    periodStart: {
        type: Date,
        required: true,
    },
    periodEnd: {
        type: Date,
        required: false,
    },
    pondId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pond"
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true,
    }

}, {timestamps: true});

export default mongoose.model("Period", PeriodSchema);