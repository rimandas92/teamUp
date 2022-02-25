"use strict";
var express = require('express');
var adminFaq = express.Router();
var faqService = require('../../services/faqService');
var commonService = require('../../services/commonService');
/******************************
*  Middleware to check token
******************************/
adminFaq.use(function (req, res, next) {
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
 *  Create FAQ
 *  @method : POST
 *  @params : 
 *      question
 *      answer
 *  @url: /admin/faq/add_faq/
 ********************************/
adminFaq.post('/add_faq', function (req, res) {
    var faqData = req.body;
    faqService.create(faqData, function (response) {
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
 *  @url: /admin/faq/update_faq/:faqId
 ********************************/
adminFaq.post('/update_faq/:faqId', function (req, res) {
    var faqData = req.body;
    var faqId = req.params.faqId;
    faqService.update(faqId, faqData, function (response) {
        res.json(response);
    });
});
/******************************
 *  Delete FAQ
 *  @method : GET
 *  @params : 
 *     faqId
 *  @url: /admin/faq/delete_faq/:faqId
 ********************************/
adminFaq.get('/delete_faq/:faqId', function (req, res) {
    var faqId = req.params.faqId;
    faqService.delete(faqId, function (response) {
        res.json(response);
    });
});
/******************************
 *  Get FAQ List
 *  @method : POST
 *  @params : 
 *    page
 *    limit
 *  @url: /admin/faq/faq_list
 ********************************/
adminFaq.post('/faq_list', function (req, res) {
    faqService.getAllFaqs(req.body,function (response) {
        res.json(response);
    });
});
/******************************
 *  Get FAQ Detail
 *  @method : GET
 *  @params : 
 *      faqId
 *  @url: /admin/faq/faq_details/:faqId
 ********************************/
adminFaq.get('/faq_details/:faqId', function (req, res) {
    faqService.getDetailsById(req.params.faqId, function (response) {
        res.json(response);
    });
});
/******************************
 *  Active inactive FAQ
 *  @method : POST
 *  @params : 
 *      faqId
 *      is_active
 *  @url: /admin/faq/active_inactive_faq/:faqId
 ********************************/
adminFaq.post('/active_inactive_faq/:faqId', function (req, res) {
    var faqData = req.body;
    var faqId = req.params.faqId;
    faqService.faqActiveInactive(faqId, faqData, function (response) {
        res.json(response);
    });
});
module.exports = adminFaq;