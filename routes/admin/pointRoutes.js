"use strict";
var express = require('express');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var config = require('../../config');
var pointService = require('../../services/pointService');
var commonService = require('../../services/commonService');
var pointAdminRoute = express.Router();
const { STATUS_CONSTANTS, STATUS_MESSAGES } = require('../../utils/constant');

/******************************
*  Middleware to check token
******************************/
pointAdminRoute.use(function (req, res, next) {
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
 *  Log Point
 *  @method : POST
 *  @params : 
 *      user_id
 *      activity_id
 *      date
 *      point
 *  @url: /admin/point/log_point
 ********************************/
pointAdminRoute.post('/log_point', function (req, res) {
    //req.body.user_id = req.decoded.id;
    pointService.logPoint(req.body,function (response) {
        res.json(response);
    });
});

/******************************
 *  Get Point List weekly
 *  @method : POST
 *  @params : 
 *      week_no
 *      user_id
 *  @url: /admin/point/weekly_point
 ********************************/
pointAdminRoute.post('/weekly_point', function (req, res) {
    req.body.user_id = req.decoded.id;
    var substractor = 0;
    /*if(req.body.from_date && req.body.to_date){
    }else if(req.body.from_date && !req.body.to_date){
        //req.body.from_date = moment(new Date(req.body.from_date)).startOf('isoWeek').format('YYYY-MM-DD');
        req.body.to_date = moment(new Date(req.body.from_date)).endOf('isoWeek').format('YYYY-MM-DD');
    }else if(!req.body.from_date && req.body.to_date){
        req.body.from_date = moment(new Date(req.body.to_date)).startOf('isoWeek').format('YYYY-MM-DD');
        //req.body.to_date = moment(new Date(req.body.to_date)).endOf('isoWeek').format('YYYY-MM-DD');
    }else */
    if(req.body.week_no > 1){
        substractor = Number(req.body.week_no) - 1;
        req.body.from_date = moment().subtract(substractor, 'week').startOf('isoWeek').format('YYYY-MM-DD');
        req.body.to_date = moment().subtract(substractor, 'week').endOf('isoWeek').format('YYYY-MM-DD');
    }else if(req.body.date){
        req.body.from_date = moment(new Date(req.body.date)).startOf('isoWeek').format('YYYY-MM-DD');
        req.body.to_date = moment(new Date(req.body.date)).endOf('isoWeek').format('YYYY-MM-DD');
    }else{
        req.body.from_date = moment().startOf('isoWeek').format('YYYY-MM-DD');
        req.body.to_date = moment().endOf('isoWeek').format('YYYY-MM-DD');
    }
    pointService.weeklyUserPoint(req.body,function (response) {
        res.json(response);
    });
});

/******************************
 *  Get Point List
 *  @method : POST
 *  @params : 
 *      user_id
 *      from_date
 *      to_date
 *      activity_id
 *  @url: /admin/point/point_list
 ********************************/
pointAdminRoute.post('/point_list', function (req, res) {
    pointService.pointList(req.body,function (response) {
        res.json(response);
    });
});

// pointAdminRoute.post('/point_list_teamname', function (req, res) {
//     pointService.pointListTeamname(req.body,function (response) {
//         res.json(response);
//     });
// });
/******************************
 *  Removo Point
 *  @method : POST
 *  @params : 
 *      point_id
 *  @url: /admin/point/remove_point
 ********************************/
pointAdminRoute.post('/remove_point', function (req, res) {
    //req.body.user_id = req.decoded.id;
    pointService.removePointAdmin(req.body,function (response) {
        res.json(response);
    });
});
module.exports = pointAdminRoute;