var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var userschema = new Schema({
  _id: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, createIndexes: { unique: true } },
  password: { type: String, required: false },
  phone_no: { type: String, required: false },
  image: { type: String, default: '' },
  type: { type: String, enum: ['FACEBOOK', 'GOOGLE', 'APPLE', 'NORMAL'], default: 'NORMAL' },
  social_login: {
    facebook: {
      social_id: { type: String, default: '' },
      image: { type: String, default: '' }
    },
    google: {
      social_id: { type: String, default: '' },
      image: { type: String, default: '' }
    },
    apple: {
      social_id: { type: String, default: '' },
      image: { type: String, default: '' }
    }
  },
  otp: { type: String, default: '', required: false },
  authtoken: { type: String, default: '', required: false },
  // emailVerify: { 
  //   type: String,
  //   enum: ['0', '1',],
  //   default: '0' 
  // },
  emailVerify: { type: String, enum: ['0', '1',], default: '1' },
  status: { type: Number, default: 1 },
  devicetoken: {
    type: String,
    default: ''
  },
  apptype: {
    type: String,
    enum: ['IOS', 'ANDROID', 'WEB'],
    default: 'ANDROID'
  },
  fcm_token: { type: String, default: '', required: false },
}, {
  timestamps: true,
  typecast: true
});
userschema.pre('save', function (next) {
  var user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.hash(user.password, null, null, function (err, hash) {
    if (err) { return next(err); }
    user.password = hash;
    next();
  });
});
userschema.pre('save', function (next) {
  var user = this;
  if (!user.isModified('otp')) { return next(); }
  bcrypt.hash(user.otp, null, null, function (err, hash) {
    if (err) { return next(err); }
    user.otp = hash;
    next();
  });
});
userschema.methods.comparePassword = function (password) {
  var user = this;
  return bcrypt.compareSync(password, user.password);
}
userschema.methods.compareOtp = function (otp) {
  var user = this;
  return bcrypt.compareSync(otp, user.otp);
};
userschema.plugin(mongoosePaginate);
userschema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('User', userschema);
