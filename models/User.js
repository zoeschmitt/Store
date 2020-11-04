const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    firstName: String,
    lastName: String,
    email: String,
    carts: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' }
    ]
})

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;