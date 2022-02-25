var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var schedule_schema = new Schema({
    _id: { type: String, require: true },
    user_id: { type: String, require: true },
    event_name: { type: String, require: true },
    datetime: { type: String, require: true },
    noti_datetime: { type: String, require: true }
},{
    timestamps: true,
    typeCast: true
});
schedule_schema.plugin(mongoosePaginate);
schedule_schema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Schedule',schedule_schema);