var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var league_member_schema = new Schema({
    _id: { type: String, require: true },
    league_id: { type: String, require: true },
    member_id: { type: String, require: true }
},{
    timestamps: true,
    typeCast: true
});
league_member_schema.plugin(mongoosePaginate);
league_member_schema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('League_member',league_member_schema);