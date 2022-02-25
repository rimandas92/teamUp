var express = require("express");
var jwt = require('jsonwebtoken');
var config = require('../../config');
var feed = express.Router();
var FeedService = require('../../services/feedService');
const { STATUS_CONSTANTS, STATUS_MESSAGES } = require('../../utils/constant');

/******************************
 *  Middleware to check token
 ******************************/
feed.use(function (req, res, next) {
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
 *      date/ from_date & to_date
 *  @url: /admin/feed/feed_list
 ********************************/
adminFeed.post('/feed_list', function (req, res) {
    req.body.is_active = true;
    faqService.getAllFeed(req.body,function (response) {
        res.json(response);
    });
});

module.exports = feed;