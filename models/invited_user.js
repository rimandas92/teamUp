var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var invited_user_Schema = new Schema({
    _id: { 
            type: String,
            require: true
         },
    team_id: { 
            type: String,
            require: true
         },
    // user_id: { 
    //         type: String,
    //         require: true
    //     },
    phone_no: { 
            type: String,
            require: true
        },
    email: { 
            type: String,
            default: null
        },
},{
    timestamps: true,
    typeCast: true
});
invited_user_Schema.plugin(mongoosePaginate);
invited_user_Schema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('invited_user',invited_user_Schema);