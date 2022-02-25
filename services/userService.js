var express = require("express");
var mongo = require("mongodb");
var ObjectID = mongo.ObjectID;
var User = require("../models/user");
var jwt = require("jsonwebtoken");
var config = require('../config');
var secretKey = config.secret;
var async = require("async");
//var moment = require('moment');
var crypto = require('crypto');
var mailProperty = require("../modules/sendMail");
var fs = require('fs');
const { STATUS_CONSTANTS, STATUS_MESSAGES, URL_PATHS, PATH_LOCATIONS, CONSTANTS } = require('../utils/constant');
const mailchimp = config.mailchimp;
const request = require('superagent');
const mailchimpClient = require("@mailchimp/mailchimp_marketing");

createToken = (user) => {
  var tokenData = { id: user._id };
  var token = jwt.sign(tokenData, secretKey, {
    expiresIn: config.expirein
  });
  return token;
};

var UserService = {
  userList: (req_data, callback) => {
    var page = 1;
    var limit = null;
    if (req_data.page && !req_data.limit) {
      page = req_data.page;
      limit = CONSTANTS.record_per_page;
    }
    if (req_data.page && req_data.limit) {
      page = req_data.page;
      limit = req_data.limit;
    }
    var sortBy = { 'first_name': 1, 'last_name': 1 };

    var aggregate = User.aggregate();
    aggregate.project({
      "_id": 1,
      "first_name": 1,
      "last_name": 1,
      "fullname": { "$concat": ["$first_name", " ", "$last_name"] },
      "email": 1,
      "phone_no": 1,
      "image": 1,
      "type": 1,
      "social_login": 1,
      "status": 1,
      "createdAt": 1,
      "updatedAt": 1,
      "user_image": {
        "$switch": {
          "branches": [
            { "case": { "$ne": ["$image", ""] }, "then": { $concat: [PATH_LOCATIONS.user_profile_pic_path_view, "$image"] } },//"$config.file_base_url"+"$PATH_LOCATIONS.user_profile_pic_path_view"+"$image"
            { "case": { "$eq": ["$type", "NORMAL"] }, "then": "$image" },
            { "case": { "$eq": ["$type", "FACEBOOK"] }, "then": "$social_login.facebook.image" },
            { "case": { "$eq": ["$type", "GOOGLE"] }, "then": "$social_login.google.image" },
            { "case": { "$eq": ["$type", "APPLE"] }, "then": "$social_login.apple.image" }
          ],
          "default": ''
        }
      }
    });
    if (req_data.search_key) {
      aggregate.match({ 'fullname': { $regex: req_data.search_key, $options: "$i" } });
    }
    if (req_data.email) {
      aggregate.match({ 'email': { $regex: req_data.email, $options: "$i" } });
    }
    if (req_data.phone_no) {
      aggregate.match({ 'phone_no': { $regex: req_data.phone_no, $options: "$i" } });
    }
    if (req_data.status != undefined) {
      aggregate.match({ 'status': Number(req_data.status) });
    }

    if (limit) {
      var options = { page: page, limit: limit, sortBy: sortBy };
      User.aggregatePaginate(aggregate, options, function (err, userList, pageCount, count) {
        if (err) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
        } else {
          var message = 'User list found';
          if (userList.length == 0) { message = 'No user list found'; }
          var responseData = {
            //docs: userList,
            docs: {
              'user_list': userList,
              //'user_image_path': PATH_LOCATIONS.user_profile_pic_path_view //config.file_base_url + PATH_LOCATIONS.user_profile_pic_path
            },
            pages: pageCount,
            total: count,
            limit: limit,
            page: page
          }
          callback({ success: true, error: false, message: message, data: responseData });
        }
      });
    } else {
      aggregate.sort(sortBy);
      aggregate.exec(function (err, userList) {
        if (err) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
        } else {
          var message = 'User list found';
          if (userList.length == 0) { message = 'No user list found'; }
          var noOfRecords = userList.length;
          var responseData = {
            //docs: userList,
            docs: {
              'user_list': userList,
              //'user_image_path': PATH_LOCATIONS.user_profile_pic_path_view //config.file_base_url + PATH_LOCATIONS.user_profile_pic_path
            },
            pages: 1,
            total: noOfRecords,
            limit: noOfRecords,
            page: 1
          }
          callback({ success: true, error: false, message: message, data: responseData });
        }
      });
    }
  },
  /////////for user/////////////
  ////modified///////////
  register_user: (user_data, callback) => {
    console.log("user_data", user_data);
    if (!user_data.email) {
      callback({ success: false, error: true, message: "User email require", response: {} });
    } else if (!user_data.first_name) {
      callback({ success: false, error: true, message: "First name require", response: {} });
    } else if (!user_data.last_name) {
      callback({ success: false, error: true, message: "Last name require", response: {} });
    } else if (!user_data.md_password) {
      callback({ success: false, error: true, message: "Password require", response: {} });
    } else if (!user_data.devicetoken) {
      callback({ success: false, error: true, message: "Device token require", response: {} });
    } else if (!user_data.apptype) {
      callback({ success: false, error: true, message: "App type require", response: {} });
    } else {
      async.waterfall([
        function (nextcb) {
          User.findOne({ "email": user_data.email }).exec(function (err, user) {
            if (err) {
              nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            } else if (user) {
              nextcb({
                success: false,
                error: true,
                status: STATUS_CONSTANTS.USER_ALREADY_EXIST,
                message: STATUS_MESSAGES.USER_ALREADY_EXIST,
                data: { 'login_type': user.type }
              });
            } else {
              nextcb(null);
            }
          })
        },
        function (nextcb) {
          var otp = Math.floor(1000 + Math.random() * 9000);
          var insertData;
          insertData = new User({
            _id: new ObjectID,
            email: user_data.email
          });
          insertData.first_name = user_data.first_name;
          insertData.last_name = user_data.last_name;
          insertData.phone_no = user_data.phone_no;
          //insertData.password = crypto.createHash('md5').update(String(user_data.md_password)).digest("hex");
          insertData.password = user_data.md_password;
          insertData.otp = crypto.createHash('md5').update(String(otp)).digest("hex");
          //insertData.otp_update_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
          insertData.type = "NORMAL";
          insertData.devicetoken = user_data.devicetoken;
          insertData.apptype = user_data.apptype;
          insertData.save(function (err, result) {
            if (err) {
              nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            } else {
              // var encpMailId = Buffer.from(result.email).toString('base64');
              // var encpOtp = Buffer.from(String(otp)).toString('base64');
              // var tokenId = encpMailId + '/' + encpOtp;

              
              // mailProperty('user_welcome_mail')(result.email, {
              //   name: result.first_name,
              //   email: result.email,
              //   //email_validation_url: `${URL_PATHS.user_verification_url}${tokenId}`
              //   otp: otp
              // }).send();

              // mailchimp TASK 4: Add email and name to the mailchimp
              var mailchimpInstance = 'us1',
                listUniqueId = mailchimp.audienceId,
                mailchimpApiKey = mailchimp.key;
              // request.post('https://' + mailchimpInstance + '.api.mailchimp.com/3.0/lists/' + listUniqueId + '/members/')
              //   .set('Content-Type', 'application/json;charset=utf-8')
              //   .set('Authorization', 'Basic ' + new Buffer.from('any:' + mailchimpApiKey).toString('base64'))
              //   .send({
              //     'email_address': result.email,
              //     'status': 'subscribed',
              //     'merge_fields': {
              //       'FNAME': result.first_name,
              //       'LNAME': result.last_name
              //     }
              //   })

              mailchimpClient.setConfig({
                apiKey: mailchimpApiKey,
                server: mailchimpInstance,
              });
              const run = async () => {
                const response = await mailchimpClient.lists.addListMember(listUniqueId, {
                  email_address: result.email,
                  status: "subscribed",
                  merge_fields: {
                    'FNAME': result.first_name,
                    'LNAME': result.last_name
                  }
                });
                // console.log(response);
              };
              run();

              res = {};
              res.success = true;
              res.error = false;
              res.status = STATUS_CONSTANTS.REGISTER_SUCCESS;
              res.message = STATUS_MESSAGES.REGISTER_SUCCESS;
              res.data = {
                user_name: result.first_name,
                email: result.email,
                _id: result._id
              };
              nextcb(null, res);
            }
          })
        }],
        function (err, response) {
          if (err) {
            callback(err);
          } else {
            callback(response);
          }
        });
    }
  },
  ////modified///////////
  socialRegister: (user_data, callback) => {
    var exists_user_data;
    if (!user_data.login_type) {
      callback({ success: false, error: true, message: "Please provide login type", response: {} });
    } else if (!(user_data.login_type == 'FACEBOOK' || user_data.login_type == 'GOOGLE' || user_data.login_type == 'APPLE')) {
      callback({ success: false, error: true, message: "Please provide correct login type", response: {} });
    } else if (!user_data.social_id) {
      callback({ success: false, error: true, message: "Please provide social id", response: {} });
    } else {
      async.waterfall([
        function (nextcb) {
          var query;
          if (user_data.login_type == 'FACEBOOK') {
            query = { 'social_login.facebook.social_id': user_data.social_id };
          } else if (user_data.login_type == 'GOOGLE') {
            query = { 'social_login.google.social_id': user_data.social_id };
          } else if (user_data.login_type == 'APPLE') {
            query = { 'social_login.apple.social_id': user_data.social_id };
          }
          User.find(query).exec(function (err, user) {
            if (err) {
              nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            } else if (user.length == 0) {
              nextcb(null);
            } else if (user.length == 1 && !user_data.email) {
              exists_user_data = user[0];
              nextcb(null);
            } else if (user.length == 1 && user_data.email && user[0].email == user_data.email) {
              exists_user_data = user[0];
              nextcb(null);
            } else {
              nextcb({
                success: false,
                error: true,
                status: STATUS_CONSTANTS.USER_ALREADY_EXIST,
                message: STATUS_MESSAGES.USER_ALREADY_EXIST
              });
            }
          })
        },
        function (nextcb) {
          if (exists_user_data) {
            nextcb(null);
          } else {
            User.find({ 'email': user_data.email }).exec(function (err, user) {
              if (err) {
                nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
              } else if (user.length == 0) {
                nextcb(null);
              } else if (user.length == 1 && user[0].email == user_data.email) {
                exists_user_data = user[0];
                nextcb(null);
              } else {
                nextcb({
                  success: false,
                  error: true,
                  status: STATUS_CONSTANTS.USER_ALREADY_EXIST,
                  message: STATUS_MESSAGES.USER_ALREADY_EXIST
                });
              }
            })
          }
        },
        function (nextcb) {
          if (exists_user_data) {
            nextcb(null);
          } else if (!user_data.email) {
            nextcb({ success: false, error: true, message: "User email require", response: {} });
          } else if (!user_data.first_name) {
            nextcb({ success: false, error: true, message: "First name require", response: {} });
          } else if (!user_data.last_name) {
            nextcb({ success: false, error: true, message: "Last name require", response: {} });
          } else if (!user_data.phone_no) {
            callback({ success: false, error: true, message: "Phone number require", response: {} });
          } else {
            nextcb(null);
          }
        },
        function (nextcb) {
          var new_user = false;
          var insertData;
          if (exists_user_data) {
            insertData = exists_user_data;
          } else {
            new_user = true;
            var otp = Math.floor(1000 + Math.random() * 9000);
            insertData = new User({
              _id: new ObjectID,
              email: user_data.email,
              emailVerify: 1,
              first_name: user_data.first_name,
              last_name: user_data.last_name,
              devicetoken: user_data.devicetoken,
              apptype: user_data.apptype,
              password: crypto.createHash('md5').update(String(otp)).digest("hex"),
            });
          }

          insertData.type = user_data.login_type;
          if (user_data.login_type == 'FACEBOOK') {
            insertData.social_login.facebook.social_id = user_data.social_id;
            insertData.social_login.facebook.image = user_data.social_image;
          } else if (user_data.login_type == 'GOOGLE') {
            insertData.social_login.google.social_id = user_data.social_id;
            insertData.social_login.google.image = user_data.social_image;
          } else if (user_data.login_type == 'APPLE') {
            insertData.social_login.apple.social_id = user_data.social_id;
            insertData.social_login.apple.image = user_data.social_image;
          }
          if (user_data.fcm_token) {
            insertData.fcm_token = user_data.fcm_token;
          }
          if (user_data.phone_no) {
            insertData.phone_no = user_data.phone_no;
          }
          insertData.authtoken = createToken(insertData);
          insertData.save(function (err, result) {
            if (err) {
              nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            } else {
              if (new_user) {
                mailProperty('social_signup')(result.email, {
                  name: result.name,
                  email: result.email,
                }).send();
              }
              if (result.image) {
                result.image = PATH_LOCATIONS.user_profile_pic_path_view + result.image;
              } else if (result.type == 'FACEBOOK') {
                result.image = result.social_login.facebook.image;
              } else if (result.type == 'GOOGLE') {
                result.image = result.social_login.google.image;
              } else if (result.type == 'APPLE') {
                result.image = result.social_login.apple.image;
              } else {
                result.image = '';
              }

              var res = {
                success: true,
                status: STATUS_CONSTANTS.USER_AUTHENTICATED,
                message: STATUS_MESSAGES.USER_AUTHENTICATED,
                data: {
                  user_details: result,
                  token: result.authtoken
                }
              }
              nextcb(null, res);
            }
          })
        }
      ], function (err, response) {
        if (err) {
          callback(err);
        } else {
          callback(response);
        }
      });
    }
  },
  ////modified///////////
  doLogin: (user_data, callback) => {
    User.findOne({ email: user_data.email }).exec(function (err, user) {
      if (err) {
        callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
      }
      if (!user) {
        callback({
          success: false,
          error: true,
          status: STATUS_CONSTANTS.USER_DOES_NOT_EXIST,
          message: STATUS_MESSAGES.USER_DOES_NOT_EXIST
        });
      } else if (user.status == 0) {
        callback({
          success: false,
          error: true,
          message: "User inactive"
        });
      }
      else {
        if (!user.comparePassword(user_data.md_password)) {
          callback({
            success: false,
            error: true,
            status: STATUS_CONSTANTS.AUTHENTICATION_FAILED,
            message: STATUS_MESSAGES.AUTHENTICATION_FAILED
          });
        }
        else if (user.emailVerify !== '1') {
          callback({
            success: false,
            error: true,
            status: STATUS_CONSTANTS.ACCOUNT_NOT_VERIFIED,
            message: STATUS_MESSAGES.ACCOUNT_NOT_VERIFIED
          });
        }
        else if (user.status != 1) {
          callback({
            success: false,
            error: true,
            message: 'User is inactive'
          });
        }
        else {
          var token = createToken(user);
          var conditions = { _id: user._id },
            fields = {
              loginStatus: 'yes',
              authtoken: token,
              devicetoken: user_data.devicetoken,
              apptype: user_data.apptype,
            };
          if (user_data.fcm_token) {
            fields.fcm_token = user_data.fcm_token;
          }
          user.authtoken = token;
          options = { upsert: false };
          //console.log("fields",fields);
          User.updateOne(conditions, fields, options, function (err, affected) {
            if (user.image) {
              user.image = PATH_LOCATIONS.user_profile_pic_path_view + user.image;
            } else if (user.type == 'FACEBOOK') {
              user.image = user.social_login.facebook.image;
            } else if (user.type == 'GOOGLE') {
              user.image = user.social_login.google.image;
            } else if (user.type == 'APPLE') {
              user.image = user.social_login.apple.image;
            } else {
              user.image = '';
            }
            callback({
              success: true,
              error: false,
              status: STATUS_CONSTANTS.USER_AUTHENTICATED,
              message: STATUS_MESSAGES.USER_AUTHENTICATED,
              data: {
                user_details: user,
                //image_path : PATH_LOCATIONS.user_profile_pic_path_view,
                token: token
              }
            });
          });
        }
      }
    });
  },
  ////modified///////////
  verifyUserEmail: (verificationData, callback) => {
    var email = '';
    var otpMd = '';
    var otp = '';
    if (verificationData.email) {
      email = verificationData.email;
    }
    if (verificationData.md_otp) {
      otpMd = verificationData.md_otp;
    } else if (verificationData.otp) {
      otp = verificationData.otp;
      otpMd = crypto.createHash('md5').update(String(otp)).digest("hex");
    }
    if (!email) {
      callback({ success: false, error: true, message: "Please provide email id" });
    } else if (!otpMd) {
      callback({ success: false, error: true, message: "Please provide otp" });
    } else {
      User.findOne({ 'email': email }).exec(function (error, userDetails) {
        if (error) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: error });
        } else if (!userDetails) {
          callback({ success: false, error: true, message: "User not found" });
        } else {
          var token = createToken(userDetails);
          if (userDetails.emailVerify == '1') {
            callback({ success: false, error: true, message: "Email already verified" });
          }
          else if (!userDetails.compareOtp(otpMd)) {
            callback({ success: false, error: true, message: "Verification code incorrect" });
          } else {
            userDetails.otp = '';
            userDetails.emailVerify = '1';
            userDetails.authtoken = token;
            userDetails.save().then((result) => {
              callback({ success: true, error: false, message: "Email verification successful", data: result });
            }).catch((err) => {
              callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            })
          }
        }
      })
    }
  },
  ////modified///////////
  resendVerificationEmail: (data, callback) => {
    User.findOne({ email: data.email }, (err, user) => {
      if (err) {
        callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
      } else {
        if (user) {
          if (user.emailVerify === '0') {
            var otp = Math.floor(1000 + Math.random() * 9000);
            user.otp = crypto.createHash('md5').update(String(otp)).digest("hex");
            //user.otp_update_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            user.save(function (err, result) {
              if (err) {
                nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
              } else {
                var encpMailId = Buffer.from(result.email).toString('base64');
                var encpOtp = Buffer.from(String(otp)).toString('base64');
                var tokenId = encpMailId + '/' + encpOtp;
                mailProperty('user_welcome_mail')(result.email, {
                  name: result.first_name,
                  email: result.email,
                  //email_validation_url: `${URL_PATHS.user_verification_url}${tokenId}`
                  otp: otp
                }).send();
                //nextcb(null, result);
                res = {};
                res.success = true;
                res.error = false;
                res.status = STATUS_CONSTANTS.REGISTER_SUCCESS;
                res.message = "Verification Email Sent";
                res.data = {
                  user_name: result.first_name,
                  email: result.email
                };
                callback(res);
              }
            })
          } else {
            callback({ success: false, error: true, message: "Email Already Verified" });
          }
        } else {
          callback({
            success: false, error: true, status: STATUS_CONSTANTS.USER_DOES_NOT_EXIST,
            message: STATUS_MESSAGES.USER_DOES_NOT_EXIST
          });
        }
      }
    })

  },
  ////modified///////////
  forgotPass: (req_data, callback) => {
    async.waterfall([
      function (nextcb) {
        User.findOne({ email: req_data.email })
          .exec(function (err, userRes) {
            if (err) {
              nextcb(err);
            } else {
              nextcb(null, userRes);
            }
          });
      },
      function (userRes, nextcb) {
        if (userRes) {
          var otp = Math.floor(1000 + Math.random() * 9000);
          userRes.otp = crypto.createHash('md5').update(String(otp)).digest("hex");
          //userRes.otp_update_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
          console.log("user", userRes);
          userRes.save(function (err, result) {
            if (err) {
              nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            } else {
              //var encpMailId = Buffer.from(result.email).toString('base64');
              //var encpOtp = Buffer.from(String(otp)).toString('base64');
              //var tokenId = encpMailId + '/' + encpOtp;
              mailProperty('forgot_password_mail')(result.email, {
                name: result.first_name,
                email: result.email,
                //password_reset_url: `${URL_PATHS.user_reset_password_url}${tokenId}`
                otp: otp
              }).send();
              let data = {
                status: STATUS_CONSTANTS.REGISTER_SUCCESS,
                message: "An otp verification mail is sent to your email id",
                success: true,
                error: false
              };
              nextcb(null, data);
            }
          })
        } else {
          nextcb(null, {
            status: STATUS_CONSTANTS.USER_DOES_NOT_EXIST,
            message: STATUS_MESSAGES.USER_DOES_NOT_EXIST
          });
        }
      }
    ], function (err, data) {
      if (err) {
        callback({
          success: false,
          error: true,
          status: STATUS_CONSTANTS.INTERNAl_DB_ERROR,
          message: "some internal error has occurred",
          errors: err
        });
      }
      else {
        callback(data);
      }
    });
  },
  ////modified///////////
  resetPassword: (verificationData, callback) => {
    var email = '';
    var otp = '';
    var otpMd = '';
    var mdPassword = '';
    if (verificationData.email) {
      email = verificationData.email;
    }
    if (verificationData.otp) {
      otp = verificationData.otp;
      otpMd = crypto.createHash('md5').update(String(otp)).digest("hex");
    }
    if (verificationData.md_otp) {
      otpMd = verificationData.md_otp;
    }
    if (verificationData.md_password) {
      mdPassword = verificationData.md_password;
    }
    if (!email) {
      callback({ success: false, error: true, message: "Please provide email id" });
    } else if (!otpMd) {
      callback({ success: false, error: true, message: "Please provide otp" });
    } else if (!mdPassword) {
      callback({ success: false, error: true, message: "Please provide password" });
    } else {
      User.findOne({ 'email': email }).exec(function (error, userDetails) {
        if (error) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: error });
        } else if (!userDetails) {
          callback({ success: false, error: true, message: "User not found" });
        } else {
          if (userDetails.emailVerify !== '1') {
            callback({ success: false, error: true, message: "Email not verified" });
          }
          else if (!userDetails.compareOtp(otpMd)) {
            callback({ success: false, error: true, message: "OTP does not match,Please try again" });
          } else {
            userDetails.password = mdPassword;
            userDetails.otp = '';
            userDetails.save().then((result) => {
              callback({ success: true, error: false, message: "Password reset successfully" });
            }).catch((err) => {
              callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            })
          }
        }
      })
    }
  },
  ////modified///////////
  changePassword: (id, req_data, callback) => {
    if (!id) {
      callback({ success: false, error: true, message: "Please provide token" });
    } else if (!req_data.old_password) {
      callback({ success: false, error: true, message: "Please provide old password" });
    } else if (!req_data.new_password) {
      callback({ success: false, error: true, message: "Please provide new password" });
    } else {
      User.findOne({ '_id': id }).exec(function (error, userDetails) {
        if (error) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: error });
        } else if (!userDetails) {
          callback({ success: false, error: true, message: "User not found" });
        } else {
          if (userDetails.emailVerify !== '1') {
            callback({ success: false, error: true, message: "Email not verified" });
          }
          else if (!userDetails.comparePassword(req_data.old_password)) {
            callback({ success: false, error: true, message: "Old password does not match" });
          } else if (userDetails.comparePassword(req_data.new_password)) {
            callback({ success: false, error: true, message: "New password can not be same" });
          } else {
            userDetails.password = req_data.new_password;
            userDetails.save().then((result) => {
              callback({ success: true, error: false, message: "Password change successfully" });
            }).catch((err) => {
              callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            })
          }
        }
      })
    }
  },
  ////modified///////////
  userDetails: (id, req_data, callback) => {
    if (!req_data.user_id && !id) {
      callback({ success: false, error: true, message: "Please provide user id" });
    } else {
      console.log("_id", id);
      var query = { '_id': id };
      var project = { '_id': 0, 'password': 0, 'authtoken': 0, 'otp': 0, 'otp_update_time': 0 };
      if (req_data.user_id) {
        console.log("get by user_id", req_data.user_id);
        query = { '_id': req_data.user_id };
      };
      User.findOne(query, project).exec(function (error, userDetails) {
        if (error) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: error });
        } else if (!userDetails) {
          callback({ success: false, error: true, message: "User not found" });
        } else {
          if (userDetails.image) {
            userDetails.image = PATH_LOCATIONS.user_profile_pic_path_view + userDetails.image;
          } else if (userDetails.type == 'FACEBOOK') {
            userDetails.image = userDetails.social_login.facebook.image;
          } else if (userDetails.type == 'GOOGLE') {
            userDetails.image = userDetails.social_login.google.image;
          } else if (userDetails.type == 'APPLE') {
            userDetails.image = userDetails.social_login.apple.image;
          } else {
            userDetails.image = '';
          }
          var response_data = {
            user_details: userDetails,
            //image_path : PATH_LOCATIONS.user_profile_pic_path_view
          }
          /*if (userDetails.emailVerify !== '1') {
              callback({ success: false, error: true, message: "Email not verified" });
          } else {
              callback({ success: true, error: false, message: "User details found", data: response_data });
          }*/
          callback({ success: true, error: false, message: "User details found", data: response_data });
        }
      })
    }
  },
  ////modified///////////
  /*userEdit: (id, user_data, user_files, callback) => {
      var exists_user_data;
      var uploaded_pic_name = '';
      if (!id) {
          callback({ success: false, error: true, message: "User id require", response: {} });
      }
      else {
          async.waterfall([
              function (nextcb) {
                  if(!user_data.email){
                      nextcb(null);
                  }else{
                      User.findOne({ "email": user_data.email }).exec(function (err, user) {
                          if (err) {
                              nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                          } else if (user == null || user._id == id) {
                              nextcb(null);
                          } else {
                              nextcb({
                                  success: false,
                                  error: true,
                                  message: "Email id already used by other user. Please change.",
                                  data: {}
                              });
                          }
                      })
                  }
              },
              function (nextcb) {
                  if(user_files && user_files.profile_image != null){
                      var profileimage;
                      var fileData = user_files.profile_image;
                      var ext = fileData.name.slice(fileData.name.lastIndexOf('.'));
                      fileName = `${id}_${Date.now()}${ext}`;
                      //var profileimageUrl = '';
                      fileData.mv(PATH_LOCATIONS.user_profile_pic_path + fileName, function (err) {
                          if (err) {
                              console.log("file err",err);
                              fileName = null;
                              //profileimageUrl = "";
                              nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_SERVER_ERROR, message: STATUS_MESSAGES.INTERNAl_SERVER_ERROR, errors: err });
                          }else{
                              console.log("file ss",fileName);
                              uploaded_pic_name = fileName;
                              nextcb(null);
                          }
                      });
                  }else{
                      console.log("file not present",fileName);
                      nextcb(null);
                  }
              },
              function (nextcb) {
                  //var user_data;
                  console.log("userId",id);
                  var otp;
                  User.findOne({ "_id": id }).exec(function (err, user) {
                      console.log("user find", user);
                      if (err) {
                          console.log("user err" ,err);
                          nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                      } else if (!user) {
                          console.log("user not found");
                          nextcb({ success: false, error: true, message: 'Something wrong! User not found' });
                      } else {
                          console.log("user1",user);
                          var email_modify = false;
                          var old_image_name = '';
                          if(user_data.email && user_data.email != user.email){
                              otp = Math.floor(1000 + Math.random() * 9000);
                              user.email = user_data.email;
                              user.otp = crypto.createHash('md5').update(String(otp)).digest("hex");
                              user.authtoken = '';
                              user.emailVerify = '0';
                              email_modify = true;
                          }
                          if(user_data.first_name){ user.first_name = user_data.first_name }
                          if(user_data.last_name){ user.last_name = user_data.last_name }
                          console.log("uploaded_pic_name 1",uploaded_pic_name);
                          if(uploaded_pic_name){
                              if(user.image){ old_image_name = user.image; }
                              user.image = uploaded_pic_name 
                          }
                          console.log("updated user",user);
                          user.save(function (err, result) {
                              if (err) {
                                  console.log("user save err",err);
                                  nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                              } else {
                                  console.log("user save ss old_image_name",result);
                                  if(old_image_name){
                                      fs.stat(PATH_LOCATIONS.user_profile_pic_path + old_image_name, function (err, stats) {
                                          fs.unlink(PATH_LOCATIONS.user_profile_pic_path + old_image_name, function (err) {
                                              //if (err) return console.log(err);
                                              //else { userDetails.trade_license = null; }
                                          });
                                      });
                                  }
                                  if(email_modify){
                                      // var encpMailId = Buffer.from(result.email).toString('base64');
                                      // var encpOtp = Buffer.from(String(otp)).toString('base64');
                                      // var tokenId = encpMailId + '/' + encpOtp;
                                      mailProperty('user_welcome_mail')(result.email, {
                                          name: result.first_name,
                                          email: result.email,
                                          //email_validation_url: `${URL_PATHS.user_verification_url}${tokenId}`
                                          otp: otp
                                      }).send();
                                  }
                                  res = {};
                                  res.success = true;
                                  res.error = false;
                                  res.message = "Profile updated successfully";
                                  if(email_modify){
                                      res.message = "Profile updated successfully with email. Please verify your email.";
                                  }
                                  res.data = {
                                      user_data : result,
                                      image_path : PATH_LOCATIONS.user_profile_pic_path_view
                                  }
                                  console.log("res",res);
                                  nextcb(null, res);
                              }
                          })
                      }
                  })
              }],
              function (err, response) {
                  console.log("final");
                  if (err) {
                      //callback({ success: false, error: true, message: "Internal server error", errors: err });
                      callback(err);
                  } else {
                      callback(response);
                  }
              });
      }
  },*/

  userEdit: (_id, data, fileData, callback) => {

    if (!_id || typeof _id === undefined) {
      callback({
        "response_code": 5002,
        "response_message": "please provide id",
        "response_data": {},
        "success": false,
        "error": true,
      });
    } else if (!data.first_name || typeof data.first_name === undefined) {
      callback({
        "response_code": 5002,
        "response_message": "please provide firstname",
        "response_data": {},
        "success": false,
        "error": true,
      });
    } else if (!data.last_name || typeof data.last_name === undefined) {
      callback({
        "response_code": 5002,
        "response_message": "please provide firstname",
        "response_data": {},
        "success": false,
        "error": true,
      });
    } else {
      if (!fileData || typeof fileData === undefined) {
        User.updateOne({
          _id: _id
        }, {
          $set: {
            first_name: data.first_name,
            last_name: data.last_name
          }
        }, function (err, resUpdate) {
          if (err) {
            callback({
              "response_code": 5005,
              "response_message": "INTERNAL DB ERROR",
              "error": err,
              "success": false,
              "error": true,
            });
          } else {

            User.findOne({ _id: _id }, function (err2, res) {
              if (err) {
                callback({
                  "response_code": 5005,
                  "response_message": "INTERNAL DB ERROR",
                  "error": err,
                  "success": false,
                  "error": true,
                });
              } else {
                console.log('user == \n ', res);

                res.image = PATH_LOCATIONS.user_profile_pic_path_view + res.image;

                callback({
                  success: true,
                  error: false,
                  response_code: 2000,
                  status: STATUS_CONSTANTS.USER_AUTHENTICATED,
                  message: "Profile updated successfully",
                  data: {
                    user_details: res,
                    token: res.authtoken
                  }
                });

              }
            });
          }
        });

      } else {
        function removePreviousImage() {
          var imageFile = fileData.profile_image;
          var timeStamp = Date.now();
          var fileName = timeStamp + imageFile.name;
          var folderpath = PATH_LOCATIONS.user_profile_pic_path;
          // let profilepicPath = config.profilepicPath;
          let split = imageFile
            .mimetype
            .split("/");

          if (split[1] = "jpeg" || "png" || "jpg") {
            imageFile.mv(
              folderpath + fileName,
              function (err) {
                if (err) {
                  callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": err,
                    "success": false,
                    "error": true,
                  });
                } else {

                  User.findOne({
                    _id: _id
                  }, {
                    image: 1
                  },
                    function (err, result) {

                      if (result != null) {
                        if (result.image !== null) {

                          let pf_image = `./public/uploads/user/${result.image}`;
                          fs.unlink(pf_image, (err) => {
                            if (err) {
                              console.log('error while image delete===>', err);
                            } else {
                              console.log(result.image + ' was deleted');
                            }
                          });
                        }
                      }

                    });

                  data.profile_image = fileName;
                  data._id = _id;
                  updateProfileImage(data);
                }
              }
            )
          } else {
            callback({
              status: 5002,
              message: "MIME type not allowed please upload jpg or png file"
            })
          }

        };
        function updateProfileImage(data) {

          User.updateOne({
            _id: data._id
          }, {
            $set: {
              image: data.profile_image,
              first_name: data.first_name,
              last_name: data.last_name
            }
          }, function (err, resUpdate) {
            if (err) {
              callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "error": err,
                "success": false,
                "error": true,
              });
            } else {

              User.findOne({ _id: _id }, function (err2, res) {
                if (err) {
                  callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "error": err,
                    "success": false,
                    "error": true,
                  });
                } else {
                  console.log('user == \n ', res);

                  res.image = PATH_LOCATIONS.user_profile_pic_path_view + res.image;

                  callback({
                    success: true,
                    error: false,
                    response_code: 2000,
                    status: STATUS_CONSTANTS.USER_AUTHENTICATED,
                    message: "Profile updated successfully",
                    data: {
                      user_details: res,
                      token: res.authtoken
                    }
                  });
                }
              });
            }
          });

        };
        async function callmethods() {
          await removePreviousImage();
        }
        callmethods();
      }

    }
  },

  userStatusChange: (id, status, callback) => {
    var exists_user_data;
    var uploaded_pic_name = '';
    if (!id) {
      callback({ success: false, error: true, message: "User id require", response: {} });
    } else if (status == undefined) {
      callback({ success: false, error: true, message: "Please provide status", response: {} });
    } else if (!(status == '1' || status == 1 || status == '0' || status == 0)) {
      callback({ success: false, error: true, message: "Status must be 1 or 0", response: {} });
    }
    else {
      User.findOne({ "_id": id }).exec(function (err, user) {
        if (err) {
          nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
        } else if (!user) {
          nextcb({ success: false, error: true, message: 'Something wrong! User not found' });
        } else {
          user.status = Number(status);
          user.save(function (err, result) {
            if (err) {
              callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            } else {
              var message = "User deactivated successfully";
              if (Number(status) == 1) {
                message = "User activated successfully";
              }
              callback({ success: true, error: false, message: message });
            }
          })
        }
      })
    }
  },

  userSearch: (req_data, callback) => {
    var sortBy = { 'first_name': 1, 'last_name': 1 };
    var aggregate = User.aggregate();
    aggregate.project({
      "_id": 1,
      "first_name": 1,
      "last_name": 1,
      "fullname": { "$concat": ["$first_name", " ", "$last_name"] },
      "email": 1,
      "phone_no": 1,
      "image": 1,
      "type": 1,
      "social_login": 1,
      "status": 1,
      "createdAt": 1,
      "updatedAt": 1,
      "user_image": {
        "$switch": {
          "branches": [
            { "case": { "$ne": ["$image", ""] }, "then": { $concat: [PATH_LOCATIONS.user_profile_pic_path_view, "$image"] } },//"$config.file_base_url"+"$PATH_LOCATIONS.user_profile_pic_path_view"+"$image"
            { "case": { "$eq": ["$type", "NORMAL"] }, "then": "$image" },
            { "case": { "$eq": ["$type", "FACEBOOK"] }, "then": "$social_login.facebook.image" },
            { "case": { "$eq": ["$type", "GOOGLE"] }, "then": "$social_login.google.image" },
            { "case": { "$eq": ["$type", "APPLE"] }, "then": "$social_login.apple.image" }
          ],
          "default": ''
        }
      }
    });
    if (req_data.search_key) {
      aggregate.match({
        $or: [
          { 'fullname': { $regex: req_data.search_key, $options: "$i" } },
          { 'email': { $regex: req_data.search_key, $options: "$i" } },
          { 'phone_no': { $regex: req_data.search_key, $options: "$i" } }
        ]
      });
    }
    if (req_data.user_id) {
      aggregate.match({ '_id': req_data.user_id });
    }
    if (req_data.user_id_eleminate) {
      aggregate.match({ '_id': { $ne: req_data.user_id_eleminate } });
    }
    if (req_data.status != undefined) {
      aggregate.match({ 'status': Number(req_data.status) });
    }
    aggregate.sort(sortBy);
    aggregate.exec(function (err, userList) {
      if (err) {
        callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
      } else {
        var message = 'User list found';
        if (userList.length == 0) { message = 'No user list found'; }
        var responseData = {
          docs: {
            'user_list': userList
          }
        }
        callback({ success: true, error: false, message: message, data: responseData });
      }
    });
  },

  existsUserCheckingSocial: (user_data, callback) => {
    if (!user_data.login_type) {
      callback({ success: false, error: true, message: "Please provide login type", response: {} });
    } else if (!(user_data.login_type == 'FACEBOOK' || user_data.login_type == 'GOOGLE' || user_data.login_type == 'APPLE')) {
      callback({ success: false, error: true, message: "Please provide correct login type", response: {} });
    } else if (!user_data.social_id) {
      callback({ success: false, error: true, message: "Please provide social id", response: {} });
    } else {
      var find_query = {};
      if (user_data.login_type == 'FACEBOOK') {
        find_query = { "type": user_data.login_type, "social_login.facebook.social_id": user_data.social_id };
      } else if (user_data.login_type == 'GOOGLE') {
        find_query = { "type": user_data.login_type, "social_login.google.social_id": user_data.social_id };
      } else if (user_data.login_type == 'APPLE') {
        find_query = { "type": user_data.login_type, "social_login.apple.social_id": user_data.social_id };
      }
      User.findOne(find_query).exec(function (err, user) {
        if (err) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
        } else if (user) {
          callback({
            success: true,
            error: false,
            status: STATUS_CONSTANTS.USER_ALREADY_EXIST,
            message: "User already exists",
            data: { 'user_data': user }
          });
        } else {
          callback({
            success: false,
            error: true,
            message: "User not exists with this social platform and social id",
            data: { 'user_data': {} }
          });
        }
      })
    }
  },
  userUnsubscribe: (id, callback) => {
    try {
      const email = User.findOne({ '_id': id }, { email: 1 });
      var mailchimpInstance = 'us1',
        listUniqueId = mailchimp.audienceId,
        mailchimpApiKey = mailchimp.key;

      request.post('https://' + mailchimpInstance + '.api.mailchimp.com/3.0/lists/' + listUniqueId + '/members/')
        .set('Content-Type', 'application/json;charset=utf-8')
        .set('Authorization', 'Basic ' + new Buffer('any:' + mailchimpApiKey).toString('base64'))
        .send({
          'email_address': result.email,
          'status': 'unsubscribed'
        })

      callback({ success: true, error: false, message: "you have successfully unsubscribed" });
    } catch (error) {
      callback({ success: false, error: true, message: error.msg });
    }
  },

  userImageUpload: async (userId, fileData, callback) => {
   // console.log("userId="+userId);
    if(fileData){
      var imageFile = fileData.image;
      var timeStamp = Date.now();
      var fileName = timeStamp + imageFile.name;
      var folderpath = PATH_LOCATIONS.user_profile_pic_path;
      let split = imageFile
        .mimetype
        .split("/");

      if (split[1] = "jpeg" || "png" || "jpg") {
        imageFile.mv(
          folderpath + fileName,
          function (err) {
            if (err) {
              callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "error": err,
                "success": false,
                "error": true,
              });
            } else {
              User.updateOne({
                _id: userId
              }, {
                $set: {
                  image: fileName
                }
              }, function (err1, resUpdate) {
                if (err1) {
                  callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "error": err,
                    "success": false,
                    "error": true,
                  });
                } else {
                  User.findOne({ _id: userId }, function (err2, res) {
                    if (err2) {
                      callback({
                        "success": false,
                        "error": true,
                      });
                    } else {
                      res.image = PATH_LOCATIONS.user_profile_pic_path_view + res.image;
    
                      callback({
                        success: true,
                        error: false,
                        response_code: 2000,
                        status: STATUS_CONSTANTS.USER_AUTHENTICATED,
                        message: "Profile Image uploaded successfully",
                        data: {
                          user_details: res
                        }
                      });
                    }
                  });
                }
              });
            }
          }
        )
      } else {
        callback({
          status: 5002,
          message: "MIME type not allowed please upload jpg or png file"
        })
      }
    } else {
      callback({
        status: 5002,
        message: "Please select image file"
      })
    }
  }


}

module.exports = UserService;
