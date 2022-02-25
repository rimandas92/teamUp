var Program = require('../models/program');
var mongo = require('mongodb');
var moment = require('moment');
var async = require("async");
var ObjectID = mongo.ObjectID;
const { STATUS_CONSTANTS, STATUS_MESSAGES, URL_PATHS, PATH_LOCATIONS, CONSTANTS } = require('../utils/constant');

var ProgramService = {
    programAddEdit: (req_data, callback) => {
        if(!req_data.program_id && !req_data.program_name){
            callback({ success: false, error: true, message: "Program name require" });
        }else if(!req_data.program_id && !req_data.program_datetime){
            callback({ success: false, error: true, message: "Program date and time require" });
        }else if(req_data.program_datetime && new Date(req_data.program_datetime)< new Date()){
            callback({ success: false, error: true, message: "Program time must be greater than now" });
        }else{
            async.waterfall([
                function (nextcb) {
                    if(req_data.program_id){
                        Program.findOne({ _id: req_data.program_id }).exec(function(programerr, match_program){
                            if (programerr) {
                                nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                            } else if(!match_program){
                                nextcb({ success: false, error: true, message: "Program id not found" });
                            } else{
                                nextcb(null);
                            }
                        })
                    }else{
                        nextcb(null);
                    }
                },
                function (nextcb) {
                    var program_id = '';
                    var set_data = {};
                    if(req_data.program_id){ 
                        program_id = req_data.program_id; 
                    }else{ 
                        program_id = new ObjectID;
                    }
                    if(req_data.program_name){
                        set_data.program_name = req_data.program_name;
                    }
                    if(req_data.program_datetime){
                        set_data.datetime = moment(new Date(req_data.program_datetime)).format('YYYY-MM-DD HH:mm:ss');
                    }
                    if(req_data.is_active != undefined && (req_data.is_active == true || req_data.is_active == 'true')){
                        set_data.is_active = true;
                    } else if(req_data.is_active != undefined && (req_data.is_active == false || req_data.is_active == 'false')){
                        set_data.is_active = false;
                    } else if(!req_data.program_id){
                        set_data.is_active = false;
                    }
                    Program.updateOne({ _id: program_id }, { $set: set_data, $setOnInsert: { _id: program_id }}, { upsert: true }).exec(function (err, result) {
                        if (err) {
                            nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                        } else if(result.ok == 1 && result.nModified == 0){
                            nextcb(null,{ success: true, error: false, message: "Program added successfully" });
                        } else if(result.ok == 1 && result.nModified == 1){
                            nextcb(null,{ success: true, error: false, message: "Program updated successfully" });
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
    /*deleteProgram: (program_id, callback) => {
        if(!program_id){
            callback({ success: false, error: true, message: "Program id require" });
        }else {
            Program.findOne({ _id: program_id }, function (err, program_data) {
                if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }
                else if(!program_data){
                    callback({ success: false, error: true, message: "Program not found" });
                } else{
                    Program.deleteOne({ _id: program_id }, function (err) {
                        if (err) {
                            callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                        } else {
                            callback({ success: true, error: false, message: "Program deleted successfully" });
                        }
                    });
                }
            });
        }
    },*/
    programActiveInactive: (program_id, is_active, callback) => {
        if(!program_id){
            callback({ success: false, error: true, message: "Program id require" });
        }else if(is_active == undefined || !(is_active == true || is_active == 'true' || is_active == false || is_active == 'false')){
            callback({ success: false, error: true, message: "Program status must be true or false" });
        }else{
            Program.findById(program_id, function (err, programdata) {
                if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                } else if(!programdata){
                    callback({ success: false, error: true, message: "invalid program id", errors: err });
                }else{                     
                    if(is_active == false || is_active == 'false'){
                        programdata.is_active = false;
                    }else{
                        programdata.is_active = true;
                    }
                    programdata.save(function (err) {
                        if (err) {
                            callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                        } else {
                            callback({ success: true, error: false, message: "Program status updated successfully" });
                        }
                    });
                }
            });
        }
    },
    /*programListAdmin: (params, callback)=>{
        var page = null;
        var limit = null;
        var sortBy = { 'datetime': -1 };
        if (params.page && !params.limit) { 
            page = parseInt(params.page); 
            limit = CONSTANTS.record_per_page; 
        }
        if (params.page && params.limit) { 
            page = parseInt(params.page); 
            limit = parseInt(params.limit); 
        }
        var programAggregate = Program.aggregate();
        if(params.from_date){
            var from_date = moment(new Date(params.from_date)).format('YYYY-MM-DD 00:00:00');
            programAggregate.match({'datetime': {"$gte" : from_date}});
        }
        if(params.to_date){
            var to_date = moment(new Date(params.to_date)).format('YYYY-MM-DD 23:59:59');
            programAggregate.match({'datetime':{"$lte" : to_date}});
        }
        if(params.search_key){
            programAggregate.match({ 'program_name' : { $regex: params.search_key, $options: "$i"} });
        }
        if(limit){
            var options = { page: page, limit: limit, sortBy: sortBy };
            Program.aggregatePaginate(programAggregate, options, function (err, program_list, pageCount, count) {
                if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }
                else {
                    var res_data = {
                        docs: program_list,
                        pages: pageCount,
                        total: count,
                        limit: limit,
                        page: page
                    }
                    callback({ success: true, error: false, message: "Program list", response: res_data });
                }
            });
        }else{
            programAggregate.sort(sortBy);
            programAggregate.exec( function (err, program_list) {
                if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }
                else {
                    var count = program_list.length;
                    var res_data = {
                        docs : program_list,
                        total: count,
                        limit: count,
                        offset: 0,
                        page: 1,
                        pages: 1
                    }
                    callback({ success: true, error: false, message: "Program list", response: res_data });
                }
            });
        }
    },*/
    programList: (params, callback)=>{
        var page = null;
        var limit = null;
        var sortBy = { 'datetime': -1 };
        if (params.page && !params.limit) { 
            page = parseInt(params.page); 
            limit = CONSTANTS.record_per_page; 
        }
        if (params.page && params.limit) { 
            page = parseInt(params.page); 
            limit = parseInt(params.limit); 
        }
        var programAggregate = Program.aggregate();
        if(params.from_date){
            var from_date = moment(new Date(params.from_date)).format('YYYY-MM-DD 00:00:00');
            programAggregate.match({'datetime': {"$gte" : from_date}});
        }
        if(params.to_date){
            var to_date = moment(new Date(params.to_date)).format('YYYY-MM-DD 23:59:59');
            programAggregate.match({'datetime':{"$lte" : to_date}});
        }
        if(params.search_key){
            programAggregate.match({ 'program_name' : { $regex: params.search_key, $options: "$i"} });
        }
        if(params.is_active == true || params.is_active == 'true'){
            programAggregate.match({ 'is_active' : true });
        }else if(params.is_active == false || params.is_active == 'false'){
            programAggregate.match({ 'is_active' : false });
        }
        if(limit){
            var options = { page: page, limit: limit, sortBy: sortBy };
            Program.aggregatePaginate(programAggregate, options, function (err, program_list, pageCount, count) {
                if (err) {
                    nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }
                else {
                    var res_data = {
                        docs: program_list,
                        pages: pageCount,
                        total: count,
                        limit: limit,
                        page: page
                    }
                    callback({ success: true, error: false, message: "Program list", response: res_data });
                }
            });
        }else{
            programAggregate.sort(sortBy);
            programAggregate.exec( function (err, program_list) {
                if (err) {
                    nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }
                else {
                    var count = program_list.length;
                    var res_data = {
                        docs : program_list,
                        total: count,
                        limit: count,
                        offset: 0,
                        page: 1,
                        pages: 1
                    }
                    callback({ success: true, error: false, message: "Program list", response: res_data });
                }
            });
        }
    },
};
module.exports = ProgramService;