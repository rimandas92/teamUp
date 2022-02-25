"use strict";
var express = require('express');
var adminActivity = express.Router();
var activityService = require('../../services/activityService');
var commonService = require('../../services/commonService');
/******************************
*  Middleware to check token
******************************/
adminActivity.use(function (req, res, next) {
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
 *  Create Update activity
 *  @method : POST
 *  @params :
 *      activity_id
 *      activity
 *      is_active
 *  @url: /admin/activity/activity_add_edit/
 ********************************/
adminActivity.post('/activity_add_edit', function (req, res) {
    var activityData = req.body;
    activityService.add_edit(activityData, function (response) {
        res.json(response);
    });
});
/******************************
 *  Activity order change
 *  @method : POST
 *  @params :
 *      activity_id
 *      order
 *  @url: /admin/activity/activity_order_change/
 ********************************/
adminActivity.post('/activity_order_change', function (req, res) {
    var activityData = req.body;
    activityService.changeOrder(activityData, function (response) {
        res.json(response);
    });
});
/******************************
 *  Update FAQ
 *  @method : POST
 *  @params : 
 *      faqId
 *      question
 *      answer
 *  @url: /admin/activity/update_faq/:faqId
 ********************************/
/*adminActivity.post('/update_faq/:faqId', function (req, res) {
    var faqData = req.body;
    var faqId = req.params.faqId;
    activityService.update(faqId, faqData, function (response) {
        res.json(response);
    });
});*/
/******************************
 *  Delete FAQ
 *  @method : GET
 *  @params : 
 *     faqId
 *  @url: /admin/activity/delete_faq/:faqId
 ********************************/
/*adminActivity.get('/delete_faq/:faqId', function (req, res) {
    var faqId = req.params.faqId;
    activityService.delete(faqId, function (response) {
        res.json(response);
    });
});*/
/******************************
 *  Get Activity List
 *  @method : POST
 *  @params : 
 *      page
 *      limit
 *      searchkey
 *      is_active
 *  @url: /admin/activity/activity_list
 ********************************/
adminActivity.post('/activity_list', function (req, res) {
    activityService.getAllActivity(req.body,function (response) {
        res.json(response);
    });
});
/******************************
 *  Get FAQ Detail
 *  @method : GET
 *  @params : 
 *      faqId
 *  @url: /admin/activity/faq_details/:faqId
 ********************************/
/*adminActivity.get('/faq_details/:faqId', function (req, res) {
    activityService.getDetailsById(req.params.faqId, function (response) {
        res.json(response);
    });
});*/
/******************************
 *  Active inactive FAQ
 *  @method : POST
 *  @params : 
 *      faqId
 *      is_active
 *  @url: /admin/activity/active_inactive_faq/:faqId
 ********************************/
/*adminActivity.post('/active_inactive_faq/:faqId', function (req, res) {
    var faqData = req.body;
    var faqId = req.params.faqId;
    activityService.faqActiveInactive(faqId, faqData, function (response) {
        res.json(response);
    });
});*/
module.exports = adminActivity;