const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    quantity: Number,
    cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
    items: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'StoreItem' },
    ],
})

const CartItemModel = mongoose.model('CartItem', CartItemSchema);
module.exports = CartItemModel;