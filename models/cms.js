
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Cms = new Schema({
    _id: { type: String, required: true },
    page_id: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, default: null },
    image: { type: String, default: null },
    is_active: { type: Boolean, default: false },
}, {
        timestamps: true,
        typecast: true
    });
module.exports = mongoose.model('Cms', Cms);