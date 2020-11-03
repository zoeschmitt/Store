const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    carts: {
        type: mongoose.ObjectId,
        ref: 'Cart'
    }
})

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;