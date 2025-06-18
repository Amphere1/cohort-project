import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: [true, "username is required"],
        unique: true,
        trim: true,
        lowercase: true
    },
    email:{
        type: String,
        required: [true, "email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password:{
        type: String,
        required: [true, "password is required"],
        minLength: [6, "password must be atleast 6 characters long"]
    },
    CreatedAt:{
        type: Date,
        default: Date.now
    },
    UpdatedAt:{
        type: Date,
        default: Date.now
    }
});



const User = mongoose.model('User', userSchema);

export default User;