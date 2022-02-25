var Activity = require('../models/activity');
var mongo = require('mongodb');
const { query } = require('express');
var ObjectID = mongo.ObjectID;
const { STATUS_CONSTANTS, STATUS_MESSAGES, URL_PATHS, PATH_LOCATIONS, CONSTANTS } = require('../utils/constant');
var ActivityService = {
    add_edit: (activity, callback) => {
        if(!activity.activity && !activity.activity_id){
            callback({ success: false, error: true, message: "Please send activity name to create activity or activity id to update activity" });
        }else{
            Activity.find({activity:activity.activity}).exec(function(err, exists_activity){
                if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                } else if(exists_activity.length > 0 && !activity.activity_id){
                    callback({ success: true, error: false, message: "Activity already exists" });
                } else if(activity.activity_id && exists_activity.length > 1){
                    callback({ success: true, error: false, message: "Activity matched with other activity" });
                } else if(activity.activity_id && exists_activity.length == 1 && activity.activity_id != exists_activity[0]._id){
                    callback({ success: true, error: false, message: "Activity matched with other activity" });
                }  else {
                    var activity_id = '';
                    var activity_status = true;
                    if (activity.is_active == true || activity.is_active == 'true' || activity.is_active == false || activity.is_active == 'false'){                           
                        if(activity.is_active == false || activity.is_active == 'false'){
                            activity_status = false;
                        }
                    }
                    if(activity.activity_id){
                        activity_id = activity.activity_id;
                    }else{
                        activity_id = new ObjectID;
                    }
                    var update_data = {};
                    if(activity.activity){
                        update_data.activity = activity.activity;
                    }
                    if(activity.is_active == false || activity.is_active == true || !activity.activity_id){
                        update_data.is_active = activity_status;
                    }
                    // var new_activity = new Activity(insert_data);
                    // new_activity.save(function (err) {
                    //     if (err) {
                    //         callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                    //     } else {
                    //         callback({ success: true, error: false, message: "Activity created successfully" });
                    //     }
                    // });
                    Activity.updateOne({'_id':activity_id},{ $set:update_data, $setOnInsert:{'_id':activity_id}},{upsert: true}).exec(function (err, result) {
                        if (err) {
                            callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                        } else if(result.n == 1 && result.nModified == 0){
                            callback({ success: true, error: false, message: "Activity created successfully" });
                        } else if(result.n == 1 && result.nModified == 1 && activity.activity){
                            callback({ success: true, error: false, message: "Activity updated successfully" });
                        } else if(result.n == 1 && result.nModified == 1 && !activity.activity && activity_status == true){
                            callback({ success: true, error: false, message: "Activity activated successfully" });
                        } else if(result.n == 1 && result.nModified == 1 && !activity.activity && activity_status == false){
                            callback({ success: true, error: false, message: "Activity inactivated successfully" });
                        } else {
                            callback({ success: false, error: true, message: "Something wrong, please try again" });
                        }
                    });
                }
            })
        }
    },
    /*update: (faqid, faqdata, callback) => {
        Faq.findById(faqid, function (err, faq) {
            if (err) {
                callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            } else if(!faqdata){
                callback({ success: false, error: true, message: "invalid faq id", errors: err });
            }else{
                if (faq.question != faqdata.question)
                    faq.question = faqdata.question;
                if (faq.answer != faqdata.answer)
                    faq.answer = faqdata.answer;
                if (faqdata.is_active == true || faqdata.is_active == 'true' || faqdata.is_active == false || faqdata.is_active == 'false'){                           
                    if(faqdata.is_active == false || faqdata.is_active == 'false'){
                        faq.is_active = false;
                    }else{
                        faq.is_active = true;
                    }
                }
                faq.save(function (err) {
                    if (err) {
                        callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                    } else {
                        callback({ success: true, error: false, message: "FAQ updated" });
                    }
                });
            }
        });
    },*/
    /*delete: (activity_id, callback) => {
        Activity.findOne({ _id: activity_id }, function (err, activity) {
            if (activity) {
                Activity.remove({ _id: activity_id }, function (err) {
                    if (err) {
                        callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                    } else {
                        callback({ success: true, error: false, message: "Activity deleted" });
                    }
                });
            } else {
                callback({ success: false,error: false, message: "invalid faq id" });
            }
        });
    },*/
    getAllActivity: (params, callback)=>{
        var query = {};
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
        if(params.searchkey){
            query.activity = { $regex: params.searchkey, $options: "$i" }
        }
        if(limit){
            //query_option = { sort: { 'createdAt': -1 }, page: page, limit: limit };
        
            Activity.paginate(query, { sort: { 'activity': 1 }, page: page, limit: limit }, function (err, activity, pageCount, count) {
                    if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }
                else {
                    // var responseData = {
                    //     docs: activity,
                    //     pages: pageCount,
                    //     total: count,
                    //     limit: limit,
                    //     page: page
                    // }
                    if(count > 0){
                        callback({ success: true, error: false, message: "Activity list found", response: activity });
                    }else{
                        callback({ success: true, error: false, message: "Activity list not found", response: activity });
                    }
                    
                }
            });
        }else{
            Activity.find(query).sort({ 'activity': 1 }).exec( function (err, activity) {
                if (err) {
                callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }
                else {
                    var count = activity.length;
                    var responseData = {
                        docs : activity,
                        total: count,
                        limit: count,
                        offset: 0,
                        page: 1,
                        pages: 1
                    }
                    if(count > 0){
                        callback({ success: true, error: false, message: "Activity list found", response: responseData });
                    }else{
                        callback({ success: true, error: false, message: "Activity list not found", response: responseData });
                    }
                }
            });
        }
    },
    /*getDetailsById: function (faqId, callback) {
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
module.exports = ActivityService;