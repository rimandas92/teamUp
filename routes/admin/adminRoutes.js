"use strict"
var express = require("express");
var admin = express.Router();
var adminService = require("../../services/adminService");
var commonService = require('../../services/commonService');

/**************************
 * ADMIN LOGIN
 * @method: POST
 * @request params
 *     email
 *     password
 * @url: /admin/login
 **************************/

 admin.post("/login", function(req, res){
    var adminData = req.body;
    adminService.adminLogin(adminData, function(response){
        res.send(response);
    })
 })

/******************************
*  Middleware to check token
******************************/
/*admin.use(function (req, res, next) {
    var token = req.body.token || req.params.token || req.headers['x-access-token'];
    if (token) {
        commonService.checkAdminlogin({ token: token }, function (response) {
            if (response.success) {
                //req.body.token = token;
                next();
            } else {
                res.send(response);
            }
        });
    }
    else {
        res.send({ success: false, error: true, message: "Token required" });
    }
});*/

 /**************************
 * ADMIN LOGIN
 * @method: POST
 * @request params
 *     token
 * @url: /admin/check_login
 **************************/

admin.post("/check_login", function(req, res){
    var token = req.body.token || req.params.token || req.headers['x-access-token'];
    commonService.checkAdminlogin({ token: token }, function (response) {
        /*if (response.success) {
            //req.body.token = token;
            next();
        } else {
            res.send(response);
        }*/
        res.send(response);
    });
 })
 module.exports = admin;