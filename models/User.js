import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },

    image: {
        type: String,
    },
}, {
    timestamps: true,
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;