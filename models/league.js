var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var league_schema = new Schema({
    _id: { type: String, require: true },
    league_name: { type: String, require: true },
    creator_id: { type: String, require: true },
    image: { type: String, default: null },
    unique_team_code: { 
        type : String,
        default : null
    },
    //is_active: { type: Boolean, default: true }
},{
    timestamps: true,
    typeCast: true
});
league_schema.plugin(mongoosePaginate);
league_schema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('League',league_schema);