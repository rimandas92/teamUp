var Cms = require('../models/cms');
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var async = require("async");
var fs = require('fs');
//var moment = require('moment');
const { STATUS_CONSTANTS, STATUS_MESSAGES, URL_PATHS, PATH_LOCATIONS, CONSTANTS } = require('../utils/constant');
var CmsService = {
    createCmsAdmin: (cms, cms_files, callback) => {
        var page_id = cms.page_id.toLowerCase();
        var cms_pic_name = '';
        if(!cms.page_id){
            callback({ success: false, error: true, message: "CMS page id require" });
        }else if(!cms.title){
            callback({ success: false, error: true, message: "CMS page title require" });
        }else{
            var page_active = false;
            var cms_file_name = '';
            //aggregate.match({$or : [{'state_name':{ $regex: reqData.searchKey, $options: "$i" }},{'state_short_name':{ $regex: reqData.searchKey, $options: "$i" }}]});
            Cms.find({$or:[{'page_id':page_id},{'title': { $regex: cms.title, $options: "$i" }}]}).exec(function(err, match_cms) {
                if(err){
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }else if(match_cms.length > 0){
                    callback({ success: false, error: true, message: "CMS page found with same title or same page id" });
                }else{
                    var new_obj_id = new ObjectID;
                    async.waterfall([
                        function (nextcb) {
                            //console.log("length", user_files.length);
                            //console.log("profile_image", user_files.profile_image);
                            if(cms_files && cms_files.cms_image != null){
                                var fileData = cms_files.cms_image;
                                var ext = fileData.name.slice(fileData.name.lastIndexOf('.'));
                                fileName = `${new_obj_id}_${Date.now()}${ext}`;
                                //var profileimageUrl = '';
                                fileData.mv(PATH_LOCATIONS.cms_pic_path + fileName, function (err) {
                                    if (err) {
                                        fileName = null;
                                        nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_SERVER_ERROR, message: STATUS_MESSAGES.INTERNAl_SERVER_ERROR, errors: err });
                                    }else{
                                        cms_file_name = fileName;
                                        nextcb(null);
                                    }
                                });
                            }else{
                                nextcb(null);
                            }
                        },
                        function (nextcb) {
                            if(cms.is_active == true || cms.is_active == 'true'){
                                page_active = true;
                            }
                            var cmsData = new Cms({
                                _id: new_obj_id,
                                page_id: page_id,
                                title: cms.title,
                                content: cms.content,
                                image: cms_file_name,
                                is_active: page_active,
                            });
                            cmsData.save(function (err) {
                                if (err) {
                                    //callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                                    nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                                } else {
                                    //callback({ success: true, error: false, message: "Cms saved successfully" });
                                    nextcb({ success: true, error: false, message: "Cms saved successfully" });
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
                            ///////////////
                    /*if(cms.is_active == true || cms.is_active == 'true'){
                        page_active = true;
                    }
                    var cmsData = new Cms({
                        _id: new_obj_id,
                        page_id: page_id,
                        title: cms.title,
                        content: cms.content,
                        is_active: page_active
                    });
                    cmsData.save(function (err) {
                        if (err) {
                            callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                        } else {
                            callback({ success: true, error: false, message: "Cms saved successfully" });
                        }
                    });*/
                }
            })
        }
    },
    update: (pageid, cmsdata, cms_files, callback) => {
        console.log("cmsdata",cmsdata);
        console.log("cms_files",cms_files);
        var page_id = pageid.toLowerCase();
        var query = {'page_id':page_id};
        if(cmsdata.title){
            query = {$or:[{'page_id':page_id},{'title': { $regex: cmsdata.title, $options: "$i" }}]};
        }
        //find({$or:[{'page_id':page_id},{'title': { $regex: cms.title, $options: "$i" }}]})
        Cms.find(query, function (err, cmsrecords) {
            if (err) {
                callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            } else if(cmsrecords.length == 0){
                callback({ success: false, error: true, message: "CMS page with this page id not found" });
            } else if(cmsrecords.length > 1 || cmsrecords[0].page_id !== page_id){
                callback({ success: false, error: true, message: "Page title match with other page" });
            }else {
                var cms = cmsrecords[0];
                var cms_file_name = '';
                var cms_active = false;
                var old_image_name = '';
                ////new/////
                async.waterfall([
                    function (nextcb) {
                        //console.log("length", user_files.length);
                        //console.log("profile_image", user_files.profile_image);
                        if(cms_files && cms_files.cms_image != null){
                            var fileData = cms_files.cms_image;
                            var ext = fileData.name.slice(fileData.name.lastIndexOf('.'));
                            fileName = `${cms._id}_${Date.now()}${ext}`;
                            //var profileimageUrl = '';
                            fileData.mv(PATH_LOCATIONS.cms_pic_path + fileName, function (err) {
                                if (err) {
                                    fileName = null;
                                    nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_SERVER_ERROR, message: STATUS_MESSAGES.INTERNAl_SERVER_ERROR, errors: err });
                                }else{
                                    cms_file_name = fileName;
                                    nextcb(null);
                                }
                            });
                        }else{
                            nextcb(null);
                        }
                    },
                    function (nextcb) {
                        if (cmsdata.title && cms.title != cmsdata.title)
                            cms.title = cmsdata.title;
                        if (cmsdata.content != undefined && cms.content != cmsdata.content)
                            cms.content = cmsdata.content;
                        if (cmsdata.is_active == true || cmsdata.is_active == 'true' || cmsdata.is_active == false || cmsdata.is_active == 'false'){
                            
                            if(cmsdata.is_active == true || cmsdata.is_active == 'true'){
                                cms_active = true;
                            }
                            if(cms.is_active != cms_active){
                                cms.is_active = cms_active;
                            }
                        }
                        if(cms_file_name){
                            old_image_name = cms.image;
                            cms.image = cms_file_name;
                        }else if(cmsdata.cms_image != undefined && cmsdata.cms_image == ''){
                            old_image_name = cms.image;
                            cms.image = ''; 
                        }
                        cms.save(function (err) {
                            if (err) {
                                //callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                                nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                            } else {
                                if(old_image_name){
                                    fs.stat(PATH_LOCATIONS.cms_pic_path + old_image_name, function (err, stats) {
                                        fs.unlink(PATH_LOCATIONS.cms_pic_path + old_image_name, function (err) {
                                        });
                                    });
                                }
                                //callback({ success: true, error: false, message: "cms updated" });
                                nextcb({ success: true, error: false, message: "cms updated" });
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
                //////////////
                //var cms = cmsrecords[0];
                /*if (cmsdata.title && cms.title != cmsdata.title)
                    cms.title = cmsdata.title;
                if (cmsdata.content != undefined && cms.content != cmsdata.content)
                    cms.content = cmsdata.content;
                if (cmsdata.is_active == true || cmsdata.is_active == 'true' || cmsdata.is_active == false || cmsdata.is_active == 'false'){
                    
                    if(cmsdata.is_active == true || cmsdata.is_active == 'true'){
                        cms_active = true;
                    }
                    if(cms.is_active != cms_active){
                        cms.is_active = cms_active;
                    }
                }
                cms.save(function (err) {
                    if (err) {
                        callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                    } else {
                        callback({ success: true, error: false, message: "cms updated" });
                    }
                });*/
                ///////////////////
            }
        });
    },
    delete: (page_id, callback) => {
        Cms.findOne({ page_id: page_id }, function (err, cms) {
            if (cms) {
                var old_image_name = '';
                if(cms.image){ old_image_name = cms.image; }
                Cms.deleteOne({ page_id: page_id }, function (err) {
                    if (err) {
                        callback({ success: false, error: true, message: "Internal server error", errors: err });
                    } else {
                        if(old_image_name){
                            fs.stat(PATH_LOCATIONS.cms_pic_path + old_image_name, function (err, stats) {
                                fs.unlink(PATH_LOCATIONS.cms_pic_path + old_image_name, function (err) {
                                });
                            });
                        }
                        callback({ success: true, error: false, message: "Cms deleted" });
                    }
                });
            } else {
                callback({ success: false, error: true, message: "invalid cms id" });
            }
        });
    },
    getCms: (page_id, callback) => {
        Cms.findOne({ page_id: page_id }).exec(function (err, cms) {
            if (err) {
                callback({ success: false, error: true, message: "Internal server error", errors: err });
            }
            else {
                var response_data = {
                    cms_data : cms,
                    cms_image_path : PATH_LOCATIONS.cms_pic_path_view
                }
                callback({ success: true, error: false, message: "Cms details", response: response_data });
            }
        });
    },
    getCmsForUser: (page_id, callback) => {
        Cms.findOne({ page_id: page_id }).exec(function (err, cms) {
            if (err) {
                callback({ success: false, error: true, message: "Internal server error", errors: err });
            }
            else if(cms.is_active == false){
                callback({ success: false, error: true, message: "Cms page inactive", response: {} });
            }else{
                var response_data = {
                    cms_data : cms,
                    cms_image_path : PATH_LOCATIONS.cms_pic_path_view
                }
                callback({ success: true, error: false, message: "Cms details", response: response_data });
            }
        });
    },
};
module.exports = CmsService;