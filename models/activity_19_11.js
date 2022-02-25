var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var ActivitySchema = new Schema({
    _id: { type: String, required: true},
    activity: { type: String, required: true},
    is_active: { type: Boolean, default: true}
},{
    timestamps: true,
    typecast: true
});
ActivitySchema.plugin(mongoosePaginate);
ActivitySchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Activity',ActivitySchema);