var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var point_schema = new Schema({
    _id: { type: String, require: true },
    user_id: { type: String, require: true, ref: 'User' },
    activity_id: { type: String, require: false, ref: 'Activity' },
    date: {
          type: Date,
          require: true 
     },
    point: { 
        type: Number, 
        default: 0 
    },
    note: {
      type: String,
      default: ""
    },
    data_type:{
        type : String,
        enum: ['points','congratulations'],
        default: 'points'
    },
    // leauge_id: {
    //     type: String,
    //     default: null
    //   },
    
    // send notification when sum of current week points reached to 150 , only one time user will get notification in this week
    comments:[
        {
            _id:{
                type:String,
                require : require
            },
            commenter_id:{
                type:String,
                require : null
            },
            comment: {
                type:String,
                default : null
            },
            commenterName:{
                type:String,
                default : null
            },
            commenterProfile:{
                type:String,
                default : null
            },
            social_login:{
                type: Array,
                default : []
            }
        }
    ],

     // send notification when sum of current week points reached to 150 , only one time user will get notification in this week
     sent_notification:{
        type : String,
        enum: ['yes','no'],
        default: 'no'
    },
    
    image: { 
        type: String, 
        default: null
    },
    others_activity: { 
        type: String, 
        require: false,
        default: null
    },
    likes:[{
        type: String,
        default:[]
    }],
},{
    timestamps: true,
    typeCast: true
});
point_schema.plugin(mongoosePaginate);
point_schema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Points',point_schema);
