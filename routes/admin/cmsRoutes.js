"use strict";
var express = require('express');
var cmsService = require('../../services/cmsService');
var adminCms = express.Router();
var commonService = require('../../services/commonService');
/******************************
*  Middleware to check token
******************************/
adminCms.use(function (req, res, next) {
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
 *  Create CMS page
 *  @method: POST
 *  @request params:
 *      page_id
 *      title
 *      content
 *  @url: /admin/cms/add_cms
 ********************************/
adminCms.post('/add_cms', function (req, res) {
    cmsService.createCmsAdmin(req.body, req.files, function (response) {
        res.json(response);
    });
});
/******************************
 *  Update CMS page
 *  @method: POST
 *  @request params:
 *      page_id
 *      title
 *      content
 *  @url: /admin/cms/update_cms/:page_id
 ********************************/
adminCms.post('/update_cms/:page_id', function (req, res) {
    var cmsData = req.body;
    var page_id = req.params.page_id;
    cmsService.update(page_id, cmsData,  req.files, function (response) {
        res.json(response);
    });
});
/******************************
 *  Delete CMS page
 *  @method: POST
 *  @request params:
 *      page_id
 *  @url: /admin/cms/remove_cms/:page_id
 ********************************/
adminCms.post('/remove_cms/:page_id', function (req, res) {
    var page_id = req.params.page_id;
    cmsService.delete(page_id, function (response) {
        res.json(response);
    });
});
/******************************
 *  Get CMS page
 *  @method: GET
 *  @request params:
 *      page_id
 *  @url: /admin/cms/cms_details/:page_id
 ********************************/
adminCms.get('/cms_details/:page_id', function (req, res) {
    var page_id = req.params.page_id;
    cmsService.getCms(page_id, function (response) {
        res.json(response);
    });
});
/******************************
 *  Delete image for CMS page
 *  @method: POST
 *  @request params:
 *      page_id
 *  @url: /admin/cms/romove_cms_image/:page_id
 ********************************/
adminCms.post('/romove_cms_image/:page_id', function (req, res) {
    var reqData = { cms_image : '' };
    var page_id = req.params.page_id;
    cmsService.update(page_id, reqData,  null, function (response) {
        res.json(response);
    });
});
module.exports = adminCms;