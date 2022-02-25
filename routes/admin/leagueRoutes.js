"use strict";
var express = require('express');
var adminLeague = express.Router();
var leagueService = require('../../services/leagueService');
var commonService = require('../../services/commonService');
/******************************
*  Middleware to check token
******************************/
adminLeague.use(function (req, res, next) {
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
 *  Create League
 *  @method : POST
 *  @params : 
 *      league_name
 *      league_creator_id
 *      league_id
 *  @url: /admin/league/league_add_edit/
 ********************************/
adminLeague.post('/league_add_edit', function (req, res) {
    leagueService.leagueAddEdit(req.files, req.body.creator_id, req.body, function (response) {
        res.json(response);
    });
});
/******************************
 *  Delete League
 *  @method : GET
 *  @params : 
 *     league_id
 *  @url: /admin/league/delete_feed/:league_id
 ********************************/
adminLeague.get('/delete_league/:league_id', function (req, res) {
    leagueService.deleteLeagueAdmin(req.params.league_id, function (response) {
        res.json(response);
    });
});
/******************************
 *  Get League List
 *  @method : POST
 *  @params : 
 *      page
 *      limit
 *      league_name
 *      date
 *      creator_id
 *      is_active
 *  @url: /admin/league/league_list
 ********************************/
adminLeague.post('/league_list', function (req, res) {
    leagueService.leagueListForAdmin(req.body,function (response) {
        res.json(response);
    });
});
///////ffor member/////////
/******************************
 *  Add mmember
 *  @method : POST
 *  @params : 
 *      league_id
 *      user_id
 *      creator_id
 *  @url: /admin/league/add_member
 ********************************/
adminLeague.post('/add_member', function (req, res) {
    leagueService.addMember(req.body.creator_id, req.body,function (response) {
        res.json(response);
    });
});

/******************************
 *  Delete member
 *  @method : POST
 *  @params : 
 *      league_id
 *      user_id
 *      creator_id
 *  @url: /admin/league/delete_member
 ********************************/
adminLeague.post('/delete_member', function (req, res) {
    leagueService.deleteMember(req.body.creator_id, req.body,function (response) {
        res.json(response);
    });
});

/******************************
 *  League membe List
 *  @method : POST
 *  @params : 
 *      league_id
 *      creator_id
 *  @url: /admin/league/league_list
 ********************************/
adminLeague.post('/league_member_list', function (req, res) {
    //req.body.is_active = true;
    leagueService.leagueMemberList(req.body.creator_id, req.body,function (response) {
        res.json(response);
    });
});
module.exports = adminLeague;