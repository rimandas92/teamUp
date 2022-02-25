var express = require("express");
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var Admin = require('../models/admin');
var checkAdminlogin = (adminData, callback) => {
    Admin.findOne({ authtoken: adminData.token })
        .select('email is_admin first_name last_name phone_number')
        .exec(function (err, admin) {
            if (err) {
                callback({ success: false, error: true, message: "Internal server error", errors: err });
            }
            if (!admin) {
                callback({ success: false, error: true, message: "Access denied", response: {} });
            } else if (admin) {
                callback({ success: true, error: false, message: "Admin access granted", response: admin });
            }
        });
};
module.exports = {
    checkAdminlogin
};