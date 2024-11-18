const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/signatureproject");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]  // Example of posts if needed
}, 
{
    timestamps: true  // Adds createdAt and updatedAt fields
});

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;
