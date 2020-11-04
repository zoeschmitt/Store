const mongoose = require('mongoose');

const StoreItemSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
})

const StoreItemModel = mongoose.model('StoreItem', StoreItemSchema);
module.exports = StoreItemModel;