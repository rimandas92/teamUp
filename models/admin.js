var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var AdminSchema = new Schema({
    _id: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String, default: null },
    devicetoken: { type: String },
    image_url: { type: String, efault: '' },
    status: { type: Number, default: 1 },
    is_logged_in: { type: Boolean, default: false },
    last_login: { type: Date, default: null },
    is_active: { type: Boolean, default: true },
    authtoken: { type: String }
}, {
        timestamps: true
    });
AdminSchema.pre('save', function (next) {
    var admin = this;
    console.log(admin);
    if (!admin.isModified('password')) return next();
    bcrypt.hash(admin.password, null, null, function (err, hash) {
        if (err) {
            return next(err);
        }
        admin.password = hash;
        next();
    });
});
AdminSchema.methods.comparePassword = function (password) {
    var admin = this;
    return bcrypt.compareSync(password, admin.password);
}
module.exports = mongoose.model('Admin', AdminSchema);
