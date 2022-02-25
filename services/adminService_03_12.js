var express = require("express");
var mongo = require("mongodb");
var ObjectID = mongo.ObjectID;
var Admin = require("../models/admin");
var jwt = require("jsonwebtoken");
//var mailProperty = require('../modules/sendMail');
var config = require('../config');
var secretKey = config.secret;

var AdminService = {
    adminLogin: (adminData, callback) => {
        Admin.findOne({email: adminData.email})
        .select("email password is_admin first_name last_name")
        .exec(function(err, admin){
            if (err) {
                callback({ success: false, error: true, message: "Internal server error", errors: err });
            }
            if (!admin) {
                callback({ success: false, error: true, message: "Admin doesn't exist", response: {} });
            } else if (admin) {
                var validPassword = admin.comparePassword(adminData.password);
                if (!validPassword) {
                    callback({ success: false, error: true, message: "Invalid password", response: {} });
                } else {
                    var token = jwt.sign({
                        email: adminData.email
                    }, secretKey, { expiresIn: '2h' });
                    Admin.updateOne(
                        { _id: admin._id },
                        {
                            $set: {
                                authtoken: token,
                                last_login: Date.now(),
                                is_logged_in: true
                            }
                        }
                    ).exec(function (err, result) {
                        if (!err) {
                            callback({
                                success: true,
                                error: false,
                                message: 'Login successfully',
                                response: {
                                    email: adminData.email,
                                    token: token
                                }
                            });
                        }
                    })
                }
            }
        })
    }
}

module.exports = AdminService;