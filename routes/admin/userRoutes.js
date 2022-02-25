"use strict"
var express = require("express");
var user = express.Router();
var userService = require("../../services/userService");
var commonService = require('../../services/commonService');
/******************************
*  Middleware to check token
******************************/
user.use(function (req, res, next) {
    //console.log(req);
    var token = req.body.token || req.params.token || req.headers['x-access-token'];
    if (token) {
        commonService.checkAdminlogin({ token: token }, function (response) {
            if (response.success) {
                next();
            } else {
                res.send(response);
            }
        });
    }
    else {
        res.send({ success: false, error: true, message: "Token required" });
    }
});
/**************************
 * Add User
 * @method: POST
 * @request params
 *     phone no
 *     name
 * @url: /admin/user/add_user
 **************************/

 user.post("/add_user", function(req, res){
    var userData = req.body;
    //userData.profile_image = req.files;
    console.log(req.files);
    userService.addUser(userData, req.files, function(response){
        res.send(response);
    })
 })

 /**************************
 * lIST User
 * @method: POST
 * @request params
 *      search_key
 *      email
 *      phone
 *      dob
 *      status
 * @url: /admin/user/user_list
 **************************/

user.post("/user_list", function(req, res){
    var userData = req.body;
    //userData.profile_image = req.files;
    console.log(req.files);
    userService.userList(userData, function(response){
        res.send(response);
    })
 })

  /**************************
 * User active inactive
 * @method: POST
 * @request params
 *      user_id
 *      status
 * @url: /admin/user/user_list
 **************************/

user.post("/user_status_change", function(req, res){
    userService.userStatusChange(req.body.user_id, req.body.status, function (response) {
        res.json(response);
    });
 })
 /******************************
 *  User update
 *  @method: POST
 *  @request params:
 *  email
 *  phone
    first_name
    last_name
    profile_image
 *  @url: /admin/user/user_update
 ****************************************/
user.post('/user_update', function (req, res) {
    userService.userEdit(req.body.user_id, req.body, req.files,function (response) {
        res.json(response);
    });
});
/**************************
 * lIST User
 * @method: POST
 * @request params
 *      search_key
 * @url: /admin/user/user_search
 **************************/

user.post("/user_search", function(req, res){
    var userData = req.body;
    userService.userSearch(userData, function(response){
        res.send(response);
    })
 })
 module.exports = user;