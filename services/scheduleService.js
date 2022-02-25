var Schedule = require('../models/schedule');
// var LeagueMember = require('../models/league_member');
// var User = require('../models/user');
//var Activity = require('../models/activity');
var mongo = require('mongodb');
var moment = require('moment');
var async = require("async");
//const { query } = require('express');
var ObjectID = mongo.ObjectID;
const { STATUS_CONSTANTS, STATUS_MESSAGES, URL_PATHS, PATH_LOCATIONS, CONSTANTS } = require('../utils/constant');
//const UserService = require('./userService');
var ScheduleService = {
    scheduleAddEdit: (creator_id, req_data, callback) => {
        if(!creator_id){
            callback({ success: false, error: true, message: "Token invalid" });
        }else if(!req_data.event_id && !req_data.event_name){
            callback({ success: false, error: true, message: "Event name require" });
        }else if(!req_data.event_id && !req_data.event_datetime){
            callback({ success: false, error: true, message: "Event date and time require" });
        }else if(req_data.event_datetime && new Date(req_data.event_datetime)< new Date()){
            callback({ success: false, error: true, message: "Event time must be greater than now" });
        }else if(req_data.noti_datetime && new Date(req_data.event_datetime)< new Date(req_data.noti_datetime)){
            callback({ success: false, error: true, message: "Notification time must be before than event time" });
        }else if(req_data.noti_datetime && new Date(req_data.noti_datetime)< new Date()){
            callback({ success: false, error: true, message: "Notification time must be greater than now" });
        }else{
            //////////
            async.waterfall([
                function (nextcb) {
                    if(req_data.event_id){
                        Schedule.findOne({ _id: req_data.event_id }).exec(function(eventerr, match_event){
                            if (eventerr) {
                                nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                            } else if(!match_event){
                                nextcb({ success: false, error: true, message: "Event id not found" });
                            } else{
                                nextcb(null);
                            }
                        })
                    }else{
                        nextcb(null);
                    }
                },
                function (nextcb) {
                    var event_id = '';
                    var set_data = {};
                    if(req_data.event_id){ 
                        event_id = req_data.event_id; 
                    }else{ 
                        event_id = new ObjectID;
                        //set_data.user_id = creator_id;
                    }
                    if(req_data.event_name){
                        set_data.event_name = req_data.event_name;
                    }
                    if(req_data.event_datetime){
                        set_data.datetime = moment(new Date(req_data.event_datetime)).format('YYYY-MM-DD HH:mm:ss');
                    }
                    if(req_data.noti_datetime){
                        set_data.noti_datetime = moment(new Date(req_data.noti_datetime)).format('YYYY-MM-DD HH:mm:ss');
                    }
                    Schedule.updateOne({ _id: event_id }, { $set: set_data, $setOnInsert: { _id: event_id, user_id: creator_id }}, { upsert: true }).exec(function (err, result) {
                        if (err) {
                            nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                        } else if(result.ok == 1 && result.nModified == 0){
                            nextcb(null,{ success: true, error: false, message: "Schedule added successfully" });
                        } else if(result.ok == 1 && result.nModified == 1){
                            nextcb(null,{ success: true, error: false, message: "Schedule updated successfully" });
                        }
                    });
                }],
            function (err, response) {
                if (err) {
                    callback(err);
                } else {
                    callback(response);
                }
            });
        }
    },
    /*pointList: (params, callback) => {
        var sortBy = { 'date': -1 };
        var sort_by = '';
        var page = null;
        var limit = null;
        if (params.page && !params.limit) { 
            page = parseInt(params.page); 
            limit = CONSTANTS.record_per_page; 
        }
        if (params.page && params.limit) { 
            page = parseInt(params.page); 
            limit = parseInt(params.limit); 
        }
        if(params.sort_by && params.sort_type == 'desc'){
            sort_by = params.sort_by;
            sortBy = { sort_by: -1 };
        }else if(params.sort_by && params.sort_type == 'asc'){
            sort_by = params.sort_by;
            sortBy = { sort_by: 1 };
        }
        var pointAggregate = Point.aggregate();
        if(params.user_id){
            pointAggregate.match({ user_id : params.user_id})
        }
        if(params.activity_id){
            pointAggregate.match({ activity_id : params.activity_id})
        }
        if(params.from_date){
            var from_date = moment(new Date(params.from_date)).format('YYYY-MM-DD');
            pointAggregate.match({'date': {"$gte" : from_date}});
        }
        if(params.to_date){
            var to_date = moment(new Date(params.to_date)).format('YYYY-MM-DD');
            pointAggregate.match({'date':{"$lte" : to_date}});
        }
        pointAggregate.lookup({
            from: 'activities',
            localField: 'activity_id',
            foreignField: '_id',
            as: 'activity'
        })
        pointAggregate.unwind('activity');
        pointAggregate.lookup({
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
        });
        pointAggregate.unwind('user');
        pointAggregate.project({
            _id:1,
            activity_id:1,
            date:1,
            point:1,
            user_id:1,
            createdAt:1,
            updatedAt:1,
            'user.first_name':1,
            'user.last_name':1,
            activity_name: 'activity.activity',
            user_name: { $concat: ['$user.first_name', ' ', '$user.last_name']}
        })

        if(limit){
            var options = { page: page, limit: limit, sortBy: sortBy };
            Point.aggregatePaginate(feedAggregate, options, function (err, point_list, pageCount, count) {
                if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }
                else {
                    var responseData = {
                        docs: point_list,
                        pages: pageCount,
                        total: count,
                        limit: limit,
                        page: page,
                        req:params
                    }
                    callback({ success: true, error: false, message: "Feed list", response: responseData });
                }
            });
        }else{
            //query_option = { sort: { 'createdAt': -1 } };
            pointAggregate.sort(sortBy);
            pointAggregate.exec( function (err, point_list) {
                if (err) {
                callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }
                else {
                    var count = point_list.length;
                    var res_data = {
                        docs : point_list,
                        total: count,
                        limit: count,
                        offset: 0,
                        page: 1,
                        pages: 1,
                        req:params
                    }
                    callback({ success: true, error: false, message: "Feed list", response: res_data });
                }
            });
        }
    },*/
    deleteSchedule: (creator_id, schedule_id, callback) => {
        if(!creator_id){
            callback({ success: false, error: true, message: "Token invalid" });
        }else if(!schedule_id){
            callback({ success: false, error: true, message: "Schedule id require" });
        }else {
            Schedule.findOne({ _id: schedule_id }, function (err, schedule_data) {
                if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }
                else if(!schedule_data){
                    callback({ success: false, error: true, message: "Schedule not found" });
                } 
                else if( schedule_data.user_id != creator_id ){
                    callback({ success: false, error: true, message: "Schedule is not created by this user" });
                } else{
                    Schedule.deleteOne({ _id: schedule_id }, function (err) {
                        if (err) {
                            callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                        } else {
                            callback({ success: true, error: false, message: "Schedule deleted" });
                        }
                    });
                }
            });
        }
    },
    scheduleList: (user_id, params, callback)=>{
        if(!user_id){
            callback({ success: false, error: true, message: "Token invalid" });
        }else{
            //var query = {};
            var page = null;
            var limit = null;
            //var sortBy = { 'createdAt': -1 };
            var sortBy = { 'datetime': -1 };
            if (params.page && !params.limit) { 
                page = parseInt(params.page); 
                limit = CONSTANTS.record_per_page; 
            }
            if (params.page && params.limit) { 
                page = parseInt(params.page); 
                limit = parseInt(params.limit); 
            }
            var scheduleAggregate = Schedule.aggregate();
            scheduleAggregate.match({ user_id : user_id });
            if(params.from_date){
                var from_date = moment(new Date(params.from_date)).format('YYYY-MM-DD 00:00:00');
                scheduleAggregate.match({'datetime': {"$gte" : from_date}});
            }
            if(params.to_date){
                var to_date = moment(new Date(params.to_date)).format('YYYY-MM-DD 23:59:59');
                scheduleAggregate.match({'datetime':{"$lte" : to_date}});
            }
            if(limit){
                var options = { page: page, limit: limit, sortBy: sortBy };
                Schedule.aggregatePaginate(scheduleAggregate, options, function (err, event_list, pageCount, count) {
                    if (err) {
                        nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                    }
                    else {
                        var res_data = {
                            docs: event_list,
                            pages: pageCount,
                            total: count,
                            limit: limit,
                            page: page
                        }
                        callback({ success: true, error: false, message: "Schedule list", response: res_data });
                    }
                });
            }else{
                scheduleAggregate.sort(sortBy);
                scheduleAggregate.exec( function (err, event_list) {
                    if (err) {
                        nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                    }
                    else {
                        var count = event_list.length;
                        var res_data = {
                            docs : event_list,
                            total: count,
                            limit: count,
                            offset: 0,
                            page: 1,
                            pages: 1
                        }
                        callback({ success: true, error: false, message: "Schedule list", response: res_data });
                    }
                });
            }
        }    
    },
    scheduleListAdmin: (params, callback)=>{
        //var query = {};
        var page = null;
        var limit = null;
        //var sortBy = { 'createdAt': -1 };
        var sortBy = { 'datetime': -1 };
        if (params.page && !params.limit) { 
            page = parseInt(params.page); 
            limit = CONSTANTS.record_per_page; 
        }
        if (params.page && params.limit) { 
            page = parseInt(params.page); 
            limit = parseInt(params.limit); 
        }
        var scheduleAggregate = Schedule.aggregate();
        if(params.user_id){
            scheduleAggregate.match({ 'user_id' : params.user_id });
        }
        if(params.from_date){
            var from_date = moment(new Date(params.from_date)).format('YYYY-MM-DD 00:00:00');
            scheduleAggregate.match({'datetime': {"$gte" : from_date}});
        }
        if(params.to_date){
            var to_date = moment(new Date(params.to_date)).format('YYYY-MM-DD 23:59:59');
            scheduleAggregate.match({'datetime':{"$lte" : to_date}});
        }
        if(params.search_key){
            scheduleAggregate.match({ 'event_name' : { $regex: params.search_key, $options: "$i"} });
        }
        scheduleAggregate.lookup({
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
        })
        scheduleAggregate.unwind('user');
        scheduleAggregate.project({
            "_id": 1,
            "user_id": 1,
            "createdAt": 1,
            "event_name": 1,
            "datetime": 1,
            "noti_datetime": 1,
            "updatedAt": 1,
            'user.first_name':1,
            'user.last_name':1,
            'user.email':1,
            'user_name': { $concat: ['$user.first_name', ' ', '$user.last_name']}
        })
        if(limit){
            var options = { page: page, limit: limit, sortBy: sortBy };
            Schedule.aggregatePaginate(scheduleAggregate, options, function (err, event_list, pageCount, count) {
                if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }
                else {
                    var res_data = {
                        docs: event_list,
                        pages: pageCount,
                        total: count,
                        limit: limit,
                        page: page
                    }
                    callback({ success: true, error: false, message: "Schedule list", response: res_data });
                }
            });
        }else{
            scheduleAggregate.sort(sortBy);
            scheduleAggregate.exec( function (err, event_list) {
                if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }
                else {
                    var count = event_list.length;
                    var res_data = {
                        docs : event_list,
                        total: count,
                        limit: count,
                        offset: 0,
                        page: 1,
                        pages: 1
                    }
                    callback({ success: true, error: false, message: "Schedule list", response: res_data });
                }
            });
        }
    },
};
module.exports = ScheduleService;