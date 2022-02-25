"use strict";
var express = require('express');
var jwt = require('jsonwebtoken');
var config = require('../../config');
var cmsService = require('../../services/cmsService');
var faqService = require('../../services/faqService');
var feedService = require('../../services/feedService');
var activityService = require('../../services/activityService');
var programService = require('../../services/programService');
var common = express.Router();
var commonService = require('../../services/commonService');
const { STATUS_CONSTANTS, STATUS_MESSAGES } = require('../../utils/constant');
/******************************
 *  CMS Page
 *  @method: GET
 *  @request params:
 *  @url: /api/common/cms_details/:page_id
 ********************************/
common.get('/cms_details/:page_id', function (req, res) {
    var page_id = req.params.page_id;
    cmsService.getCmsForUser(page_id, function (response) {
        res.json(response);
    });
});
/******************************
 *  FAQ List
 *  @method: POST
 *  @request params:
 *  page
 *  limit
 *  @url: /api/common/faq_list/
 ********************************/
common.post('/faq_list/', function (req, res) {
    req.body.is_active = true;
    faqService.getAllFaqs(req.body, function (response) {
        res.json(response);
    });
});

/******************************
 *  Middleware to check token
 ******************************/
common.use(function (req, res, next) {
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
 *      date // default today
 *      searchkey
 *      from_date
 *      to_date
 *  @url: /api/common/feed_list
 ********************************/
common.post('/feed_list', function (req, res) {
    if(!req.body.date && !req.body.from_date && !req.body.to_date){
        req.body.date = new Date();
    }
    req.body.is_active = true;
    feedService.getAllFeed(req.body,function (response) {
        res.json(response);
    });
});

common.get('/user_feed_list', function (req, res) {
    feedService.getUserFeed(req.query,function (response) {
        res.json(response);
    });
});

common.get('/all_feed_point_list', function (req, res) {
    feedService.getAllFeedPoint(req.query,function (ServiceResponse) {
        res.json(ServiceResponse);
    });
});






common.get('/user_feed_list_by_id', function (req, res) {
    feedService.getUserFeedById(req.query,function (response) {
        res.json(response);
    });
});

common.post('/like-user-feed', function (req, res) {
    feedService.likeUserFeed(req.body,function (response) {
        res.json(response);
    });
});

common.get('/get-top-performer-of-week', function (req, res) {
    feedService.getPerformerOfWeek(req.query,function (response) {
        res.json(response);
    });
});

// @implemanting push notification to the use when someone comment on their post @Rakesh Vishwakarma
common.post('/add-comment-on-feed', function (req, res) {
    feedService.addCommentOnFeed(req.body,function (response) {
        res.json(response);
    });
});

common.post('/edit-comment-on-feed', function (req, res) {
    feedService.editCommentOnFeed(req.body,function (response) {
        res.json(response);
    });
});
common.post('/delete-comment-on-feed', function (req, res) {
    feedService.deletCommentOnFeed(req.body,function (response) {
        res.json(response);
    });
});
/******************************
 *  Get Activity List
 *  @method : POST
 *  @params : 
 *      page
 *      limit
 *      searchkey
 *  @url: /api/common/activity_list
 ********************************/
common.post('/activity_list', function (req, res) {
    req.body.is_active = true;
    activityService.getAllActivity(req.body,function (response) {
        res.json(response);
    });
});

/******************************
 *  Get Program List
 *  @method : POST
 *  @params : 
 *      page
 *      limit
 *      searchkey
 *      from_date
 *      to_date
 *  @url: /api/common/activity_list
 ********************************/
common.post('/program_list', function (req, res) {
    req.body.is_active = true;
    programService.programList(req.body,function (response) {
        res.json(response);
    });
});
common.post('/add_invited_user', function (req, res) {
    programService.addInvitedUser(req.body,function (response) {
        res.json(response);
    });
});
common.get('/check-invite-status', function (req, res) {
    programService.checkInviteStatus(req.query,function (response) {
        res.json(response);
    });
});
module.exports = common;
