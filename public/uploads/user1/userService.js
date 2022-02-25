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

createToken = (user) => {
    var tokenData = { id: user._id };
    var token = jwt.sign(tokenData, secretKey, {
        expiresIn: config.expirein
    });
    return token;
};

var UserService = {
    /////////For admin////////////
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
            "fullname": { "$concat" : [ "$first_name", " ", "$last_name" ] },
            "email": 1,
            "image": 1,
            "type": 1,
            "social_login": 1,
            "status": 1,
            "createdAt": 1,
            "updatedAt": 1,
            "user_image": {
                "$switch": {
                  "branches": [
                    { "case": { "$ne": [ "$image", "" ] }, "then": { $concat: [PATH_LOCATIONS.user_profile_pic_path_view, "$image"]} },//"$config.file_base_url"+"$PATH_LOCATIONS.user_profile_pic_path_view"+"$image"
                    { "case": { "$eq": [ "$type", "NORMAL" ] }, "then": "$image" },
                    { "case": { "$eq": [ "$type", "FACEBOOK" ] }, "then": "$social_login.facebook.image" },
                    { "case": { "$eq": [ "$type", "GOOGLE" ] }, "then": "$social_login.google.image" },
                    { "case": { "$eq": [ "$type", "APPLE" ] }, "then": "$social_login.apple.image" }
                  ],
                  "default": ''
                }
            }
        });
        if(req_data.search_key){
            aggregate.match({$or : [
                {'fullname': { $regex: req_data.search_key, $options: "$i" }},
            ]});
        }
        if(req_data.email){
            aggregate.match({'email': req_data.email});
        }
        if(req_data.status != undefined){
            aggregate.match({'status': Number(req_data.status)});
        }
        
        if(limit){
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
                            'user_list':userList, 
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
        }else{
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
                            'user_list':userList, 
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
        if (!user_data.email) {
            callback({ success: false, error: true, message: "User email require", response: {} });
        } else if (!user_data.first_name) {
            callback({ success: false, error: true, message: "First name require", response: {} });
        } else if (!user_data.last_name) {
            callback({ success: false, error: true, message: "Last name require", response: {} });
        } else if (!user_data.md_password) {
            callback({ success: false, error: true, message: "Password require", response: {} });
        } else{
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
                        email : user_data.email
                    });
                    insertData.first_name = user_data.first_name;
                    insertData.last_name = user_data.last_name;
                    //insertData.password = crypto.createHash('md5').update(String(user_data.md_password)).digest("hex");
                    insertData.password = user_data.md_password;
                    insertData.otp = crypto.createHash('md5').update(String(otp)).digest("hex");
                    //insertData.otp_update_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                    insertData.type = "NORMAL";
                    insertData.save(function (err, result) {
                        if (err) {
                            nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                        } else {
                            // var encpMailId = Buffer.from(result.email).toString('base64');
                            // var encpOtp = Buffer.from(String(otp)).toString('base64');
                            // var tokenId = encpMailId + '/' + encpOtp;
                            mailProperty('user_welcome_mail')(result.email, {
                                name: result.first_name,
                                email: result.email,
                                //email_validation_url: `${URL_PATHS.user_verification_url}${tokenId}`
                                otp: otp
                            }).send();
                            res = {};
                            res.success = true;
                            res.error = false;
                            res.status = STATUS_CONSTANTS.REGISTER_SUCCESS;
                            res.message = STATUS_MESSAGES.REGISTER_SUCCESS;
                            res.data = {
                                user_name: result.first_name,
                                email: result.email
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
        }else if (!(user_data.login_type == 'FACEBOOK' || user_data.login_type == 'GOOGLE' || user_data.login_type == 'APPLE')) {
            callback({ success: false, error: true, message: "Please provide correct login type", response: {} });
        }else if(!user_data.social_id){
            callback({ success: false, error: true, message: "Please provide social id", response: {} });
        }else{
            async.waterfall([
                function (nextcb) {
                    var query;
                    if(user_data.login_type == 'FACEBOOK'){
                        query = { 'social_login.facebook.social_id' : user_data.social_id };
                    }else if(user_data.login_type == 'GOOGLE'){
                        query = { 'social_login.google.social_id' : user_data.social_id };
                    }else if(user_data.login_type == 'APPLE'){
                        query = { 'social_login.apple.social_id' : user_data.social_id };
                    }
                    User.find(query).exec(function (err, user) {
                        if (err) {
                            nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                        } else if (user.length == 0) {
                            nextcb(null);
                        }else if(user.length == 1 && !user_data.email){
                            exists_user_data = user[0];
                            nextcb(null);
                        }else if(user.length == 1 && user_data.email && user[0].email == user_data.email){
                            exists_user_data = user[0];
                            nextcb(null);
                        }else{
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
                    if(exists_user_data){
                        nextcb(null);
                    }else{
                        User.find({'email': user_data.email}).exec(function (err, user) {
                            if (err) {
                                nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                            } else if (user.length == 0) {
                                nextcb(null);
                            }else if(user.length == 1 && user[0].email == user_data.email){
                                exists_user_data = user[0];
                                nextcb(null);
                            }else{
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
                    if(exists_user_data){
                        nextcb(null);
                    }else if (!user_data.email) {
                        nextcb({ success: false, error: true, message: "User email require", response: {} });
                    } else if (!user_data.first_name) {
                        nextcb({ success: false, error: true, message: "First name require", response: {} });
                    } else if (!user_data.last_name) {
                        nextcb({ success: false, error: true, message: "Last name require", response: {} });
                    } else {
                        nextcb(null);
                    }
                },
                function (nextcb) {
                    var new_user = false;
                    var insertData;
                    if(exists_user_data){
                        insertData = exists_user_data;
                    }else{
                        new_user = true;
                        var otp = Math.floor(1000 + Math.random() * 9000);
                        insertData = new User({
                            _id: new ObjectID,
                            email : user_data.email,
                            first_name : user_data.first_name,
                            last_name : user_data.last_name,
                            password : crypto.createHash('md5').update(String(otp)).digest("hex"),
                        });
                    }
                    
                    insertData.type = user_data.login_type;
                    if(user_data.login_type == 'FACEBOOK'){
                        insertData.social_login.facebook.social_id = user_data.social_id;
                        insertData.social_login.facebook.image = user_data.social_image;
                    }else if(user_data.login_type == 'GOOGLE'){
                        insertData.social_login.google.social_id = user_data.social_id;
                        insertData.social_login.google.image = user_data.social_image;
                    }else if(user_data.login_type == 'APPLE'){
                        insertData.social_login.apple.social_id = user_data.social_id;
                        insertData.social_login.apple.image = user_data.social_image;
                    }
                    insertData.authtoken = createToken(insertData);
                    insertData.save(function (err, result) {
                        if (err) {
                            nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                        } else {
                            if(new_user){
                                mailProperty('social_signup')(result.email, {
                                    name: result.name,
                                    email: result.email,
                                }).send();
                            }
                            if(result.image){
                                result.image = PATH_LOCATIONS.user_profile_pic_path_view + result.image;
                            }else if(result.type == 'FACEBOOK'){
                                result.image = result.social_login.facebook.image;
                            }else if(result.type == 'GOOGLE'){
                                result.image = result.social_login.google.image;
                            }else if(result.type == 'APPLE'){
                                result.image = result.social_login.apple.image;
                            }else{
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
            ],function (err, response) {
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
            }else if (user.status == 0) {
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
                            authtoken: token
                        },
                        options = { upsert: false };
                        //console.log("fields",fields);
                    User.updateOne(conditions, fields, options, function (err, affected) {
                        if(user.image){
                            user.image = PATH_LOCATIONS.user_profile_pic_path_view + user.image;
                        }else if(user.type == 'FACEBOOK'){
                            user.image = user.social_login.facebook.image;
                        }else if(user.type == 'GOOGLE'){
                            user.image = user.social_login.google.image;
                        }else if(user.type == 'APPLE'){
                            user.image = user.social_login.apple.image;
                        }else{
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
        }else if(verificationData.otp){
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
                        callback({ success: false, error: true, message: "Token does not match" });
                    } else {
                        userDetails.otp = '';
                        userDetails.emailVerify = '1';
                        userDetails.authtoken = token;
                        userDetails.save().then((result) => {
                            callback({ success: true, error: false, message: "Email verification successfully", data: result });
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
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.USER_DOES_NOT_EXIST,
                        message: STATUS_MESSAGES.USER_DOES_NOT_EXIST });
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
                    console.log("user",userRes);
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
                                message: "Password reset mail sent"
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
                        callback({ success: false, error: true, message: "Token does not match" });
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
        }else{
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
                    }else if (userDetails.comparePassword(req_data.new_password)) {
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
        if (!req_data.user_id && !id ) {
            callback({ success: false, error: true, message: "Please provide user id" });
        } else{
            console.log("_id",id);
            var query = { '_id': id };
            var project = {'_id':0, 'password':0, 'authtoken':0,'otp':0,'otp_update_time':0};
            if(req_data.user_id){
                console.log("get by user_id",req_data.user_id);
                query = { '_id': req_data.user_id };
            };
            User.findOne(query, project).exec(function (error, userDetails) {
                if (error) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: error });
                } else if (!userDetails) {
                    callback({ success: false, error: true, message: "User not found" });
                } else {
                    if(userDetails.image){
                        userDetails.image = PATH_LOCATIONS.user_profile_pic_path_view + userDetails.image;
                    }else if(userDetails.type == 'FACEBOOK'){
                        userDetails.image = userDetails.social_login.facebook.image;
                    }else if(userDetails.type == 'GOOGLE'){
                        userDetails.image = userDetails.social_login.google.image;
                    }else if(userDetails.type == 'APPLE'){
                        userDetails.image = userDetails.social_login.apple.image;
                    }else{
                        userDetails.image = '';
                    }
                    var response_data = {
                        user_details: userDetails,
                        //image_path : PATH_LOCATIONS.user_profile_pic_path_view
                    }
                    if (userDetails.emailVerify !== '1') {
                        callback({ success: false, error: true, message: "Email not verified" });
                    } else {
                        callback({ success: true, error: false, message: "User details found", data: response_data });
                    }
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
    userEdit: (id, user_data, user_files, callback) => {
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
                                //console.log("file err",err);
                                fileName = null;
                                //profileimageUrl = "";
                                nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_SERVER_ERROR, message: STATUS_MESSAGES.INTERNAl_SERVER_ERROR, errors: err });
                            }else{
                                //console.log("file ss",fileName);
                                uploaded_pic_name = fileName;
                                nextcb(null);
                            }
                        });
                    }else{
                        //console.log("file not present",fileName);
                        nextcb(null);
                    }
                },
                function (nextcb) {
                    //var user_data;
                    //console.log("userId",id);
                    var otp;
                    User.findOne({ _id: id }).exec(function (err, user) {
                        //console.log("user find", user);
                        if (err) {
                           // console.log("user err" ,err);
                            nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                        } else if (!user) {
                            //console.log("user not found");
                            nextcb({ success: false, error: true, message: 'Something wrong! User not found' });
                        } else {
                            //console.log("user1",user);
                            var email_modify = false;
                            var old_image_name = '';
                            //var updateData = {};
                            if(user_data.email && user_data.email != user.email){
                                otp = Math.floor(1000 + Math.random() * 9000);
                                // updateData.email = user_data.email;
                                // updateData.otp = crypto.createHash('md5').update(String(otp)).digest("hex");
                                // updateData.authtoken = '';
                                // updateData.emailVerify = '0';
                                user.email = user_data.email;
                                user.otp = crypto.createHash('md5').update(String(otp)).digest("hex");
                                user.authtoken = '';
                                user.emailVerify = '0';
                                email_modify = true;
                            }
                            // if(user_data.first_name){ updateData.first_name = user_data.first_name }
                            // if(user_data.last_name){ updateData.last_name = user_data.last_name }
                            if(user_data.first_name){ user.first_name = user_data.first_name }
                            if(user_data.last_name){ user.last_name = user_data.last_name }
                            //console.log("uploaded_pic_name 1",uploaded_pic_name);
                            if(uploaded_pic_name){
                                if(user.image){ old_image_name = user.image; }
                                //updateData.image = uploaded_pic_name 
                                user.image = uploaded_pic_name 
                            }
                            //console.log("updateData",updateData);
                            /*User.updateOne({ _id: id },
                                {
                                    $set: updateData
                                }).exec(function (err, result) {
                                    if (err) {
                                        //console.log("user save err",err);
                                        nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                                    } else {
                                        //console.log("user save ss old_image_name",result);
                                        if(old_image_name != ''){
                                            fs.stat(PATH_LOCATIONS.user_profile_pic_path + old_image_name, function (err, stats) {
                                                fs.unlink(PATH_LOCATIONS.user_profile_pic_path + old_image_name, function (err) {
                                                    //if (err) return console.log(err);
                                                    //else { console.log("unlink success") }
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
                                        //console.log("res",res);
                                        nextcb(null, res);
                                    }
                            })*/
                            user.save(function (err, result) {
                            /*User.updateOne({ _id: id },
                                {
                                    $set: updateData
                                }).exec(function (err, result) {*/
                                if (err) {
                                    //console.log("user save err",err);
                                    nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                                } else {
                                    console.log("result", result);
                                    if(result.image){
                                        result.image = PATH_LOCATIONS.user_profile_pic_path_view + result.image;
                                    }else if(result.type == 'FACEBOOK'){
                                        result.image = result.social_login.facebook.image;
                                    }else if(result.type == 'GOOGLE'){
                                        result.image = result.social_login.google.image;
                                    }else if(result.type == 'APPLE'){
                                        result.image = result.social_login.apple.image;
                                    }else{
                                        result.image = '';
                                    }
                                    //console.log("user save ss old_image_name",result);
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
                                    //console.log("res",res);
                                    nextcb(null, res);
                                }
                            })
                        }
                    })
                }],
                function (err, response) {
                    //console.log("final");
                    if (err) {
                        //callback({ success: false, error: true, message: "Internal server error", errors: err });
                        callback(err);
                    } else {
                        callback(response);
                    }
                });
        }
    },
    userStatusChange: (id, status, callback) => {
        var exists_user_data;
        var uploaded_pic_name = '';
        if (!id) {
            callback({ success: false, error: true, message: "User id require", response: {} });
        }else if (status == undefined) {
            callback({ success: false, error: true, message: "Please provide status", response: {} });
        }else if (!(status == '1' || status == 1 || status == '0' || status == 0)) {
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
                            if(Number(status) == 1){
                                message = "User activated successfully";
                            }
                            callback({ success: true, error: false, message: message });
                        }
                    })
                }
            })
        }
    }
}

module.exports = UserService;