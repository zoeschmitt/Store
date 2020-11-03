const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    items: String,
})

const CartModel = mongoose.model('Cart', CartSchema);
module.exports = CartModel;