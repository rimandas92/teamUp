var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var userFeedCommentSchema = new Schema({
    _id: { 
        type: String,
        require: true
    },
    feed_user_id: { 
        type: String, 
        require: true 
    },
    commenter_id: {
        type: String, 
        require: true 
    },
    comment: { 
        type: String, 
        default: null 
    },
},{
    timestamps: true,
});
userFeedCommentSchema.plugin(mongoosePaginate);
userFeedCommentSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('feed_comments',userFeedCommentSchema);