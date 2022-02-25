var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var program_schema = new Schema({
    _id: { type: String, require: true },
    program_name: { type: String, require: true },
    datetime: { type: String, require: true },
    is_active: { type: Boolean, require: true, default: true }
},{
    timestamps: true,
    typeCast: true
});
program_schema.plugin(mongoosePaginate);
program_schema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Program',program_schema);