const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cartItems: [
        {
            quantity: Number,
            item: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreItem' },
        }
    ],
})

const CartModel = mongoose.model('Cart', CartSchema);
module.exports = CartModel;