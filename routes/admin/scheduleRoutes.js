"use strict";
var express = require('express');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var config = require('../../config');
var scheduleService = require('../../services/scheduleService');
var commonService = require('../../services/commonService');
var schrduleAdminRoute = express.Router();
const { STATUS_CONSTANTS, STATUS_MESSAGES } = require('../../utils/constant');

/******************************
*  Middleware to check token
******************************/
schrduleAdminRoute.use(function (req, res, next) {
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

/******************************
 *  AddEdit Schedule
 *  @method : POST
 *  @params : 
 *      user_id
 *      event_id
 *      event_name
 *      event_datetime
 *      noti_datetime
 *  @url: /admin/schedule/schedule_add_edit
 ********************************/
schrduleAdminRoute.post('/schedule_add_edit', function (req, res) {
    scheduleService.scheduleAddEdit(req.body.user_id, req.body,function (response) {
        res.json(response);
    });
});

/******************************
 *  Delete schedule
 *  @method : POST
 *  @params : 
 *      schedule_id
 *      user_id
 *  @url: /admin/schedule/delete_schedule
 ********************************/
schrduleAdminRoute.post('/delete_schedule', function (req, res) {
    scheduleService.deleteSchedule(req.body.user_id, req.body.schedule_id,function (response) {
        res.json(response);
    });
});

/******************************
 *  Get Schedule List
 *  @method : POST
 *  @params : 
 *      user_id
 *      from_date
 *      to_date
 *      search_key
 *  @url: /admin/point/schedule_list
 ********************************/
schrduleAdminRoute.post('/schedule_list', function (req, res) {
    scheduleService.scheduleListAdmin(req.body,function (response) {
        res.json(response);
    });
});
module.exports = schrduleAdminRoute;