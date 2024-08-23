import mongoose from "mongoose";

//User model for the user, used to store the user's data into the database.
const UserSchema = mongoose.Schema({
    
    email: {
        type: String,
        required: true,
        max: 50,
        unique: true
    },
    password: {
        type: String,
        required: true,
        min: 6
    },
    address: {
        type: String,
        max: 80
    },
    name: {
        required: true,
        type: String,
        max: 40
    },
    roles:{
        required: true,
        type: String,
        max: 40,
        default: "manager"
    },
    phoneNo:{
        type: String,
        max: 20,
        required: true,
    },
    employeeId:{
        type: String,
        max: 300,
    },
    userimg: {
        type: String
    }

}, {timestamps: true});


export default mongoose.model("User", UserSchema);
