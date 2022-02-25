var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var FaqSchema = new Schema({
    _id: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    //category: { type: String, default: null },
    is_active: { type: Boolean, default: true },
}, {
        timestamps: true,
        typecast: true
    });
FaqSchema.plugin(mongoosePaginate);    
module.exports = mongoose.model('Faq', FaqSchema);