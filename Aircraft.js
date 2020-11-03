const mongoose = require('mongoose');

const AircraftSchema = new mongoose.Schema({
    name: String,
})

const AircraftModel = mongoose.model('Aircraft', AircraftSchema);
module.exports = AircraftModel;