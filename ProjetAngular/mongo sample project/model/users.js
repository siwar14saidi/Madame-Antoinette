const mongoose = require('mongoose');

const User = mongoose.Schema({
    email:String,
    password:String,
    quotes: [{
        id: String
    }]
}, {
    timestamps: true // tzidlek deux champs mba3ed fel table User: wa7da mta3 date de création, w lokhra mta3 date de mise à jour
});

module.exports = mongoose.model('User', User);