var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var point_schema = new Schema({
    _id: { type: String, require: true },
    user_id: { type: String, require: true },
    activity_id: { type: String, require: true },
    date: { type: String, require: true },
    point: { type: Number, default: 0 },
},{
    timestamps: true,
    typeCast: true
});
point_schema.plugin(mongoosePaginate);
point_schema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Points',point_schema);