var mongoose = require ('mongoose');
var mongoosePaginate = require ('mongoose-paginate');
var mongooseAggregatePaginate = require ('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var FeedSchema = new Schema({
    _id: { type: String, require: true },
    date: { type: String, require: true },
    name: { type: String },
    description: { type: String },
    link_text: { type: String },
    link_url: { type: String },
    video: { type: String, default: '' },
    audio: { type: String, default: '' },
    feed_type: {type: String, enum: ['text', 'video', 'audio'], default: 'text'},
    is_active: {type: Boolean, default: true},
}, {
    timestamps: true,
    typecast: true
});
FeedSchema.plugin(mongoosePaginate);
FeedSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Feed',FeedSchema);