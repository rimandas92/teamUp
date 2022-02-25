var Point = require('../models/point');
var User = require('../models/user');
var Activity = require('../models/activity');
var mongo = require('mongodb');
var moment = require('moment');
const { query } = require('express');
var ObjectID = mongo.ObjectID;
const { STATUS_CONSTANTS, STATUS_MESSAGES, URL_PATHS, PATH_LOCATIONS, CONSTANTS } = require('../utils/constant');
var PointService = {
    logPoint: (pointlog_data, callback) => {
        //callback({ success: false, error: true, message: "Please send valid date", result: moment(new Date(pointlog_data.date)).format('YYYY-MM-DD') });
        if(!pointlog_data.point){
            callback({ success: false, error: true, message: "Please send point" });
        }else if(!pointlog_data.date){
            callback({ success: false, error: true, message: "Please send date" });
        }else if(moment(new Date(pointlog_data.date)).format('YYYY-MM-DD') == "Invalid date"){
            callback({ success: false, error: true, message: "Please send valid date" });
        }else if(!pointlog_data.activity_id){
            callback({ success: false, error: true, message: "Please send activity id" });
        }else if(!pointlog_data.user_id){
            callback({ success: false, error: true, message: "Token invalid" });
        }else{
            User.findOne({ _id: pointlog_data.user_id}).exec(function(usererr, userdata){
                if (usererr) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                } else if(!userdata){
                    callback({ success: false, error: true, message: "User not found" });
                } else if(!userdata.status){
                    callback({ success: false, error: true, message: "User not active" });
                }else{
                    Activity.findOne({ _id: pointlog_data.activity_id}).exec(function(activityerr, activitydata){
                        if (activityerr) {
                            callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                        } else if(!activitydata){
                            callback({ success: false, error: true, message: "Activity not found" });
                        } else if(!activitydata.is_active){
                            callback({ success: false, error: true, message: "Activity not active" });
                        }else{
                            var update_data = {
                                user_id : pointlog_data.user_id,
                                activity_id : pointlog_data.activity_id,
                                date : moment(new Date(pointlog_data.date)).format('YYYY-MM-DD')
                            }
                            Point.update(update_data, { $set: {point: Number(pointlog_data.point)}, $setOnInsert: { _id: new ObjectID }}, { upsert: true }).exec(function (err, result) {
                                if (err) {
                                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                                } else if(result.ok == 1 && result.nModified == 0){
                                    callback({ success: true, error: false, message: "Point logged successfully" });
                                } else if(result.ok == 1 && result.nModified == 1){
                                    callback({ success: true, error: false, message: "Logged point updated successfully" });
                                }
                            });
                        }
                    })
                }
            })
        }
    },
    pointList: (params, callback) => {
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
            'user.email':1,
            activity_name: '$activity.activity',
            user_name: { $concat: ['$user.first_name', ' ', '$user.last_name']}
        })
        /*if(params.sum){
            pointAggregate.group({ _id : {
                    point_date: "$date",
                },
                count:{$sum: "$point"}
            })
        }*/

        if(limit){
            var options = { page: page, limit: limit, sortBy: sortBy };
            Point.aggregatePaginate(pointAggregate, options, function (err, point_list, pageCount, count) {
                if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }
                else {
                    /*if(params.sum){
                        point_list.map((value) => {
                            value.date = new Date(value._id.point_date);
                            value.day = new Date(value._id.point_date).getDay();
                        })
                    }*/
                    var responseData = {
                        docs: point_list,
                        pages: pageCount,
                        total: count,
                        limit: limit,
                        page: page,
                        req:params
                    }
                    callback({ success: true, error: false, message: "Point list found", response: responseData });
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
                    /*if(params.sum){
                        point_list.map((value) => {
                            value.date = new Date(value._id.point_date);
                            value.day = new Date(value._id.point_date).getDay();
                        })
                    }*/
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
                    callback({ success: true, error: false, message: "Point list found", response: res_data });
                }
            });
        }
    },
    weeklyUserPoint: (params, callback) => {
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
        pointAggregate.group({ _id : {
                point_date: "$date",
            },
            count:{$sum: "$point"},
        })
        pointAggregate.exec( function (err, point_list) {
            if (err) {
            callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            }
            else {
                var weeklyPointSum = 0;
                var weekPointArray = [];
                // var fromDateObj = new Date(params.from_date);
                // var calculateDateObj = new Date();
                var calculateDateObj;
                for( var i=0; i<7; i++){
                    calculateDateObj = new Date(moment(new Date(params.from_date)).add(i,'days'));
                    //calculateDateObj.setDate(fromDateObj.getDate() + i);
                    if(calculateDateObj.getDay() == 0){
                        weekPointArray[i] = {
                            date: calculateDateObj,
                            day: 6,
                            point: 0
                        }
                    }else{
                        weekPointArray[i] = {
                            date: calculateDateObj,
                            day: calculateDateObj.getDay() - 1,
                            point: 0
                        }
                    }
                }
                point_list.map((value) => {
                    // value.date = new Date(value._id.point_date);
                    // if(new Date(value._id.point_date).getDay() == 0){
                    //     value.day = 6;
                    //     weekPointArray[value.day] = value;
                    // }else{
                    //     value.day = new Date(value._id.point_date).getDay() - 1;
                    //     weekPointArray[value.day] = value;
                    // }
                    if(new Date(value._id.point_date).getDay() == 0){
                        weekPointArray[6].point = value.count;
                    }else{
                        var dayNo = new Date(value._id.point_date).getDay() - 1;
                        weekPointArray[dayNo].point = value.count;
                    }
                    weeklyPointSum += value.count 
                })
                var res_data = {
                    docs : weekPointArray,
                    sum: weeklyPointSum,
                    from_date: new Date(params.from_date),
                    to_date: new Date(params.to_date)
                }
                callback({ success: true, error: false, message: "Weekly point list", response: res_data });
            }
        });
    },
    removePointAdmin: (pointlog_data, callback) => {
        //callback({ success: false, error: true, message: "Please send valid date", result: moment(new Date(pointlog_data.date)).format('YYYY-MM-DD') });
        if(!pointlog_data.date){
            callback({ success: false, error: true, message: "Please send date" });
        }else if(moment(new Date(pointlog_data.date)).format('YYYY-MM-DD') == "Invalid date"){
            callback({ success: false, error: true, message: "Please send valid date" });
        }else if(!pointlog_data.activity_id){
            callback({ success: false, error: true, message: "Please send activity id" });
        }else if(!pointlog_data.user_id){
            callback({ success: false, error: true, message: "Please send user id" });
        }else{
            var search_data = {
                user_id : pointlog_data.user_id,
                activity_id : pointlog_data.activity_id,
                date : moment(new Date(pointlog_data.date)).format('YYYY-MM-DD')
            }
            Point.findOne(search_data).exec(function (err, pointentry) {
                if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                } else if(!pointentry){
                    callback({ success: true, error: false, message: "Point logged not found" });
                } else {
                    Point.deleteOne({ _id: pointentry._id}).exec(function (err) {
                        if (err) {
                            callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                        } else {
                            callback({ success: true, error: false, message: "Point deleted successfully" });
                        }
                    });
                }
            });
        }
    },
    /*delete: (faqid, callback) => {
        Faq.findOne({ _id: faqid }, function (err, faq) {
            if (faq) {
                Faq.remove({ _id: faqid }, function (err) {
                    if (err) {
                        callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                    } else {
                        callback({ success: true, error: false, message: "FAQ deleted" });
                    }
                });
            } else {
                callback({ success: false,error: false, message: "invalid faq id" });
            }
        });
    },
    getAllFaqs: (params, callback)=>{
        var query = {};
        var query_option = {};
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
        if (params.is_active == true || params.is_active == 'true' || params.is_active == false || params.is_active == 'false'){                           
            if(params.is_active == false || params.is_active == 'false'){
                query = { is_active : false};
            }else{
                query = { is_active : true};
            }
        }
        if(limit){
            //query_option = { sort: { 'createdAt': -1 }, page: page, limit: limit };
        
            Faq.paginate(query, { sort: { 'createdAt': -1 }, page: page, limit: limit }, function (err, faqs, pageCount, count) {
                    if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }
                else {
                    var responseData = {
                        docs: feeds,
                        pages: pageCount,
                        total: count,
                        limit: limit,
                        page: page
                    }
                    callback({ success: true, error: false, message: "FAQ list", response: faqs });
                }
            });
        }else{
            //query_option = { sort: { 'createdAt': -1 } };
            Faq.find(query).sort({ 'createdAt': -1 }).exec( function (err, faqs) {
                if (err) {
                callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }
                else {
                    var count = faqs.length;
                    var res_data = {
                        docs : faqs,
                        total: count,
                        limit: count,
                        offset: 0,
                        page: 1,
                        pages: 1
                    }
                    callback({ success: true, error: false, message: "FAQ list", response: res_data });
                }
            });
        }
    },
    getDetailsById: function (faqId, callback) {
        Faq.findOne({ _id: faqId }).exec(function (err, faq) {
            if (err) {
                callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            }
            else if(!faq){
                callback({ success: false, error: true, message: "FAQ not found", response: {} });
            }else{
                callback({ success: true, error: false, message: "FAQ Details", response: faq });
            }
        });
    },
    faqActiveInactive: (faqid, faqdata, callback) => {
        if(!faqid){
            callback({ success: false, error: true, message: "Faq id require" });
        }else if(faqdata.is_active == undefined || !(faqdata.is_active == true || faqdata.is_active == 'true' || faqdata.is_active == false || faqdata.is_active == 'false')){
            callback({ success: false, error: true, message: "Faq status must be true or false" });
        }else{
            Faq.findById(faqid, function (err, faq) {
                if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                } else if(!faqdata){
                    callback({ success: false, error: true, message: "invalid faq id", errors: err });
                }else{                     
                    if(faqdata.is_active == false || faqdata.is_active == 'false'){
                        faq.is_active = false;
                    }else{
                        faq.is_active = true;
                    }
                    faq.save(function (err) {
                        if (err) {
                            callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                        } else {
                            callback({ success: true, error: false, message: "FAQ status updated successfully" });
                        }
                    });
                }
            });
        }
    },*/
};
module.exports = PointService;