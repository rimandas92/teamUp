var Faq = require('../models/faqs');
var mongo = require('mongodb');
const { query } = require('express');
var ObjectID = mongo.ObjectID;
const { STATUS_CONSTANTS, STATUS_MESSAGES, URL_PATHS, PATH_LOCATIONS, CONSTANTS } = require('../utils/constant');
var FaqService = {
    create: (faq, callback) => {
        var matching_search_query = {};
        matching_search_query = { question : { $regex: '^'+faq.question+'$', $options: "$i" } };
        Faq.find(matching_search_query).exec(function(matchErr, match_faq){
            if (matchErr) {
                callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: matchErr });
            } else if(match_faq.length > 0){
                callback({ success: false, error: true, message: "Similar faq already exists" });
            } else{
                var faq_status = true;
                if (faq.is_active == true || faq.is_active == 'true' || faq.is_active == false || faq.is_active == 'false'){                           
                    if(faq.is_active == false || faq.is_active == 'false'){
                        faq_status = false;
                    }
                }
                var faq_data = {
                    _id : new ObjectID,
                    question : faq.question,
                    answer : faq.answer,
                    is_active : faq_status
                }
                var insert_data = new Faq(faq_data);
                insert_data.save(function (err) {
                    if (err) {
                        callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                    } else {
                        callback({ success: true, error: false, message: "Faq created successfully" });
                    }
                });
            }
        });
    },
    update: (faqid, faqdata, callback) => {
        Faq.findById(faqid, function (err, faq) {
            if (err) {
                callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            } else if(!faqdata){
                callback({ success: false, error: true, message: "invalid faq id", errors: err });
            }else{
                var matching_search_query = {};
                matching_search_query = { $or: [ { _id: faqid}, { question : { $regex: '^'+faqdata.question+'$', $options: "$i" } }] };
                Faq.find(matching_search_query).exec(function(matchErr, match_faq){
                    if (matchErr) {
                        callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: matchErr });
                    } else if(match_faq.length > 1){
                        callback({ success: false, error: true, message: "Similar faq already exists" });
                    } else if(match_faq.length == 1 && match_faq[0]._id != faqid){
                        callback({ success: false, error: true, message: "Similar faq already exists" });
                    } else{
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
            }
        });
    },
    delete: (faqid, callback) => {
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
                    /*var responseData = {
                        faqs: faqs,
                        pages: pageCount,
                        total: count,
                        limit: limit,
                        page: page
                    }*/
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
    },
};
module.exports = FaqService;