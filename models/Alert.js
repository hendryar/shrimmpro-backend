import mongoose from "mongoose";

const AlertSchema = mongoose.Schema({
    alertType: {
        type: String,
        required: true,
        max: 50,
    },
    alertMessage: {
        type: String,
        required: true,
        min: 6
    },
    alertStatus: {
        type: String,
        required: true,
        max: 20
    },
    alertTime: {
        type: Date,
        required: true
    },
    pondId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pond"
    }

}, {timestamps: true});

export default mongoose.model("Alert", AlertSchema);