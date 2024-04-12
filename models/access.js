const { access } = require('fs');
const mongoose = require('mongoose');

const accessSchema = mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    access_token: {
        type: String,
        required: true
    },
    item_id: String,
    request_id: String
});

module.exports = mongoose.model('access', accessSchema);;