"use strict";
var express = require('express');
var adminProgram = express.Router();
var programService = require('../../services/programService');
var commonService = require('../../services/commonService');
/******************************
*  Middleware to check token
******************************/
adminProgram.use(function (req, res, next) {
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
 *  Create Update program
 *  @method : POST
 *  @params :
 *      program_id
 *      program_name
 *      program_datetime
 *  @url: /admin/program/program_add_edit/
 ********************************/
adminProgram.post('/program_add_edit', function (req, res) {
    var programData = req.body;
    programService.programAddEdit(programData, function (response) {
        res.json(response);
    });
});
/******************************
 *  Delete Program
 *  @method : GET
 *  @params : 
 *     program_id
 *  @url: /admin/program/delete_program/:program_id
 ********************************/
/*adminProgram.get('/delete_program/:program_id', function (req, res) {
    var program_id = req.params.program_id;
    programService.deleteProgram(program_id, function (response) {
        res.json(response);
    });
});*/
/******************************
 *  Get Program List
 *  @method : POST
 *  @params : 
 *      page
 *      limit
 *      searchkey
 *      from_date
 *      to_date
 *      is_active
 *  @url: /admin/program/program_list
 ********************************/
adminProgram.post('/program_list', function (req, res) {
    programService.programList(req.body,function (response) {
        res.json(response);
    });
});
/******************************
 *  Active inactive Program
 *  @method : POST
 *  @params : 
 *      program_id
 *      is_active
 *  @url: /admin/faq/active_inactive_program/
 ********************************/
adminProgram.post('/active_inactive_program/', function (req, res) {
    var programData = req.body;
    programService.programActiveInactive(programData.program_id, programData.is_active, function (response) {
        res.json(response);
    });
});
module.exports = adminProgram;