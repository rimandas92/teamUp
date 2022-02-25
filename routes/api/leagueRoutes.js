"use strict";
var express = require('express');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var config = require('../../config');
var leagueService = require('../../services/leagueService');
var leagueRoute = express.Router();
const { STATUS_CONSTANTS, STATUS_MESSAGES } = require('../../utils/constant');

/******************************
 *  Middleware to check token
 ******************************/
leagueRoute.use(function (req, res, next) {
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
 *  AddEdit League
 *  @method : POST
 *  @params : 
 *      league_name
 *      league_id
 *  @url: /api/league/league_add_edit
 ********************************/
leagueRoute.post('/league_add_edit', function (req, res) {
    leagueService.leagueAddEdit(req.files,req.decoded.id, req.body, function (response) {
        res.json(response);
    });
});
leagueRoute.get('/get-unique-team-code', function (req, res) {
    leagueService.getUniqueTeamCode(req.query, function (response) {
        res.send(response);
    })
});
leagueRoute.post('/join-member-by-unique-team-code', function (req, res) {
    leagueService.addMemberByUniqueTeamCode(req.body,function (response) {
        res.json(response);
    });
});
/******************************
 *  Delete league
 *  @method : POST
 *  @params : 
 *      league_id
 *  @url: /api/league/delete_league
 ********************************/
leagueRoute.post('/delete_league', function (req, res) {
    leagueService.deleteLeague(req.decoded.id, req.body.league_id,function (response) {
        res.json(response);
    });
});

/******************************
 *  Add mmember
 *  @method : POST
 *  @params : 
 *      league_id
 *      user_id
 *  @url: /api/league/add_member
 ********************************/
leagueRoute.post('/add_member', function (req, res) {
    leagueService.addMember(req.decoded.id, req.body,function (response) {
        res.json(response);
    });
});

/******************************
 *  Delete member
 *  @method : POST
 *  @params : 
 *      league_id
 *      user_id
 *  @url: /api/league/delete_member
 ********************************/
leagueRoute.post('/delete_member', function (req, res) {
    leagueService.deleteMember(req.decoded.id, req.body,function (response) {
        res.json(response);
    });
});

/******************************
 *  League List
 *  @method : POST
 *  @params : 
 *      page
 *      limit
 *      //league_id
 *      //user_id
 *      creator_id
 *      league_name
 *  @url: /api/league/league_list
 ********************************/
leagueRoute.post('/league_list', function (req, res) {
    //req.body.is_active = true;
    leagueService.leagueList(req.decoded.id, req.body,function (response) {
        res.json(response);
    });
});

/******************************
 *  League membe List
 *  @method : POST
 *  @params : 
 *      league_id
 *  @url: /api/league/league_list
 ********************************/
leagueRoute.post('/league_member_list', function (req, res) {
    //req.body.is_active = true;
    leagueService.leagueMemberList(req.decoded.id, req.body,function (response) {
        res.json(response);
    });
});


leagueRoute.post('/user-leave-team', function (req, res) {
    leagueService.userLeaveTeam(req.body, function (response) {
        res.json(response);
    });
});
module.exports = leagueRoute;