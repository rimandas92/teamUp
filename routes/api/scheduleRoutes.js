var express = require("express");
var jwt = require('jsonwebtoken');
var config = require('../../config');
var scheduleRoute = express.Router();
var scheduleService = require('../../services/scheduleService');
const { STATUS_CONSTANTS, STATUS_MESSAGES } = require('../../utils/constant');

/******************************
 *  Middleware to check token
 ******************************/
scheduleRoute.use(function (req, res, next) {
    var token = req.body.token || req.params.token || req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, config.secret, function (err, decoded) {
            if (err) {
                res.send({
                    success: false,
                    error: true,
                    status: STATUS_CONSTANTS.AUTHENTICATION_FAILED, 
                    message: "Failed to authenticate or token expired."
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        res.send({
            success: false,
            error: true,
            message: "Please provide token"
        });
    }
});

/******************************
 *  Get Feed List
 *  @method : POST
 *  @params : 
 *    page
 *    limit
 *  @url: /admin/feed/league_add_edit
 ********************************/
scheduleRoute.post('/schedule_list', function (req, res) {
    scheduleService.scheduleList(req.decoded.id, req.body,function (response) {
        res.json(response);
    });
});

/******************************
 *  AddEdit Schedule
 *  @method : POST
 *  @params : 
 *      event_id
 *      event_name
 *      event_datetime
 *      noti_datetime
 *  @url: /api/schedule/schedule_add_edit
 ********************************/
scheduleRoute.post('/schedule_add_edit', function (req, res) {
    scheduleService.scheduleAddEdit(req.decoded.id, req.body,function (response) {
        res.json(response);
    });
});
/******************************
 *  Delete schedule
 *  @method : POST
 *  @params : 
 *      schedule_id
 *  @url: /api/schedule/delete_schedule
 ********************************/
scheduleRoute.post('/delete_schedule', function (req, res) {
    scheduleService.deleteSchedule(req.decoded.id, req.body.schedule_id,function (response) {
        res.json(response);
    });
});

module.exports = scheduleRoute;