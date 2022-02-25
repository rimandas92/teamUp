"use strict";
var express = require('express');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var config = require('../../config');
var pointService = require('../../services/pointService');
var pointRoute = express.Router();
const { STATUS_CONSTANTS, STATUS_MESSAGES } = require('../../utils/constant');

/******************************
 *  Middleware to check token
 ******************************/
pointRoute.use(function (req, res, next) {
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
 *  Log Point
 *  @method : POST
 *  @params : 
 *      user_id
 *      activity_id
 *      date
 *      point
 *  @url: /api/point/log_point
 ********************************/
pointRoute.post('/log_point', function (req, res) {
    req.body.user_id = req.decoded.id;
    pointService.logPoint(req.body,req.files,function (response) {
        res.json(response);
    });
});

pointRoute.get('/list-points-by-date', function (req, res) {
    pointService.listPointsByDate(req.query,function (response) {
        res.json(response);
    });
});
pointRoute.post('/update-points', function (req, res) {
    pointService.updatePoints(req.body,req.files,function (response) {
        res.json(response);
    });
});
pointRoute.post('/delete-points', function (req, res) {
    pointService.deletePoints(req.body,function (response) {
        res.json(response);
    });
});
/******************************
 *  Get Point List
 *  @method : POST
 *  @params : 
 *      week_no
 *      user_id
 *  @url: /api/point/weekly_point
 ********************************/

pointRoute.post('/weekly_point', function (req, res) {
    req.body.user_id = req.decoded.id;   
    pointService.weeklyUserPoint(req.body, function (response) {
        res.json(response);
    });
});

// @Rakesh Vishwakarma
pointRoute.post('/points_history', function(req, res) {
  req.body.user_id = req.decoded.id;
  pointService.pointHistory(req.body, function(response) {
    res.json(response);
  })
})



module.exports = pointRoute;
