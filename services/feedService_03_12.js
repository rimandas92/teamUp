var Feed = require('../models/feeds');
var mongo = require('mongodb');
//const { query } = require('express');
var async = require("async");
var moment = require('moment');
var ObjectID = mongo.ObjectID;
var fs = require('fs');
const { STATUS_CONSTANTS, STATUS_MESSAGES, URL_PATHS, PATH_LOCATIONS, CONSTANTS } = require('../utils/constant');
var FeedService = {
    create: (feed, feed_files, callback) => {
        if(!feed.name){
            callback({ success: false, error: true, message: "Feed title is required" });
        } else if((feed.feed_type == 'text' || feed.feed_type == '') && !feed.description){
            callback({ success: false, error: true, message: "Feed sescription is required for text type feed" });
        } else if(feed.feed_type == 'video' && (!feed_files || feed_files.video == null)){
            callback({ success: false, error: true, message: "Video file is required for video type feed" });
        } else if(feed.feed_type == 'audio' && (!feed_files || feed_files.audio == null)){
            callback({ success: false, error: true, message: "Audio file is required for audio type feed" });
        } else if(!feed.date){
            callback({ success: false, error: true, message: "Feed date is required" });
        } else {
            var feed_status = true;
            var feed_type = 'text';
            if(feed.is_active == false || feed.is_active == 'false'){
                feed_status = false;
            }
            if(feed.feed_type == 'video'){
                feed_type = 'video';
            }else if(feed.feed_type == 'audio'){
                feed_type = 'audio';
            }
            var insert_data = new Feed({
                _id: new ObjectID,
                date: moment(new Date(feed.date)).format('YYYY-MM-DD'),
                name: feed.name,
                description: feed.description,
                video: '',
                audio: '',
                feed_type: feed_type,
                is_active: feed_status
            });
            insert_data.save(function(err, new_data){
                if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                } else if(feed.feed_type == 'video' || feed.feed_type == 'audio'){
                    var video_file_name = '';
                    var audio_file_name = '';
                    async.waterfall([
                        function (nextcb) {
                            if(feed.feed_type == 'video' && feed_files && feed_files.video != null){
                                var video_file = feed_files.video;
                                if(video_file.mimetype.split('/')[0] == 'video'){
                                    var ext = video_file.name.slice(video_file.name.lastIndexOf('.'));
                                    video_file_name = `${insert_data._id}_${Date.now()}${ext}`;
                                    video_file.mv(PATH_LOCATIONS.feed_video_path + video_file_name, function (err) {
                                        if (err) {
                                            video_file_name = '';
                                            nextcb(err);
                                        }else{
                                            nextcb(null);
                                        }
                                    });
                                }else{
                                    nextcb('Video file type must be video');
                                }
                            }else if(feed.feed_type == 'video' && (!feed_files || feed_files.video == null)){
                                nextcb('Video file is required');
                            }else{
                                nextcb(null);
                            }
                        },
                        function (nextcb) {
                            if(feed.feed_type == 'audio' && feed_files && feed_files.audio != null){
                                var audio_file = feed_files.audio;
                                if(audio_file.mimetype.split('/')[0] == 'audio'){
                                    var ext = audio_file.name.slice(audio_file.name.lastIndexOf('.'));
                                    audio_file_name = `${insert_data._id}_${Date.now()}${ext}`;
                                    audio_file.mv(PATH_LOCATIONS.feed_audio_path + audio_file_name, function (err) {
                                        if (err) {
                                            audio_file_name = '';
                                            nextcb(err);
                                        }else{
                                            nextcb(null);
                                        }
                                    });
                                }else{
                                    nextcb('Audio file type must be audio');
                                }
                            }else if(feed.feed_type == 'audio' && (!feed_files || feed_files.audio == null)){
                                nextcb('Audio file is required');
                            }else{
                                nextcb(null);
                            }
                    }],
                    function (err, response) {
                        if (err) {
                            callback({ success: false, error: true, message: "Some error occure to upload file", error: err });
                        } else {
                            var update_data = {};
                            if( video_file_name != '' ){ update_data.video = video_file_name; }
                            if( audio_file_name != '' ){ update_data.audio = audio_file_name; }
                            Feed.findOneAndUpdate({ '_id': insert_data._id},{ $set: update_data},{returnNewDocument: true, upsert: false, useFindAndModify:false}).exec(function(err, result){
                                if(err){
                                    callback({ success: false, error: true, message: "Feed created but some error occure to upload file", error: err });
                                }else {
                                    // if( video_file_name ){ 
                                    //     result.video = PATH_LOCATIONS.feed_video_path_view + video_file_name;
                                    // }else{ result.video = ''; }
                                    // if( audio_file_name ){ 
                                    //     result.audio = PATH_LOCATIONS.feed_audio_path_view + audio_file_name;
                                    // }else{ result.audio = ''; }
                                    callback({ success: true, error: false, message: "Feed created successfully", data: result });
                                }
                            })
                        }
                    });
                }else{
                    callback({ success: true, error: false, message: "Feed created successfully", data: new_data });
                }
            });
        }
    },
    update: (feed, feed_files, callback) => {
        if(!feed.feed_id){
            callback({ success: false, error: true, message: "Feed id is required" });
        } else if((feed.feed_type == 'text' || feed.feed_type == '') && !feed.description){
            callback({ success: false, error: true, message: "Feed sescription is required for text type feed" });
        } else if(feed.feed_type == 'video' && (!feed_files || feed_files.video == null)){
            callback({ success: false, error: true, message: "Video file is required for video type feed" });
        } else if(feed.feed_type == 'audio' && (!feed_files || feed_files.audio == null)){
            callback({ success: false, error: true, message: "Audio file is required for audio type feed" });
        } else {
            Feed.findOne({_id:feed.feed_id }).exec(function(err, feed_data){
                if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                } else if(!feed_data){
                    callback({ success: false, error: true, message: "Feed not found" });
                }else{
                    var video_file_name = '';
                    var audio_file_name = '';
                    async.waterfall([
                        function (nextcb) {
                            if(feed.feed_type == 'video' && feed_files && feed_files.video != null){
                                var video_file = feed_files.video;
                                if(video_file.mimetype.split('/')[0] == 'video'){
                                    var ext = video_file.name.slice(video_file.name.lastIndexOf('.'));
                                    video_file_name = `${feed.feed_id}_${Date.now()}${ext}`;
                                    video_file.mv(PATH_LOCATIONS.feed_video_path + video_file_name, function (err) {
                                        if (err) {
                                            video_file_name = '';
                                            nextcb(err);
                                        }else{
                                            nextcb(null);
                                        }
                                    });
                                }else{
                                    nextcb('Video file type must be video');
                                }
                            }else if(feed.feed_type == 'video' && (!feed_files || feed_files.video == null)){
                                nextcb('Video file is required');
                            }else{
                                nextcb(null);
                            }
                        },
                        function (nextcb) {
                            if(feed.feed_type == 'audio' && feed_files && feed_files.audio != null){
                                var audio_file = feed_files.audio;
                                if(audio_file.mimetype.split('/')[0] == 'audio'){
                                    var ext = audio_file.name.slice(audio_file.name.lastIndexOf('.'));
                                    audio_file_name = `${feed.feed_id}_${Date.now()}${ext}`;
                                    audio_file.mv(PATH_LOCATIONS.feed_audio_path + audio_file_name, function (err) {
                                        if (err) {
                                            audio_file_name = '';
                                            nextcb(err);
                                        }else{
                                            nextcb(null);
                                        }
                                    });
                                }else{
                                    nextcb('Audio file type must be audio');
                                }
                            }else if(feed.feed_type == 'audio' && (!feed_files || feed_files.audio == null)){
                                nextcb('Audio file is required');
                            }else{
                                nextcb(null);
                            }
                    }],
                    function (err, response) {
                        if (err) {
                            callback({ success: false, error: true, message: "Some error occure to upload file", error: err });
                        } else {
                            var update_data = {};
                            if(feed.date){
                                update_data.date = moment(new Date(feed.date)).format('YYYY-MM-DD');
                            }
                            if(feed.name){
                                update_data.name = feed.name;
                            }
                            if(feed.description){
                                update_data.description = feed.description;
                            }
                            if(feed.feed_type){
                                update_data.feed_type = feed.feed_type;
                            }
                            if(feed.is_active == false || feed.is_active == 'false'){
                                update_data.is_active = false;
                            } else if(feed.is_active == true || feed.is_active == 'true'){
                                update_data.is_active = true;
                            }
                            if( video_file_name != '' ){ 
                                update_data.video = video_file_name; 
                            }else if(feed.feed_type){
                                update_data.video = '';
                            }
                            if( audio_file_name != '' ){ 
                                update_data.audio = audio_file_name; 
                            }else if(feed.feed_type){
                                update_data.audio = '';
                            }
                            Feed.findOneAndUpdate({ '_id': feed.feed_id},{ $set: update_data},{returnNewDocument: true, upsert: false, useFindAndModify:false}).exec(function(err, result){
                                if(err){
                                    callback({ success: false, error: true, message: "Some error occure, please try again", error: err });
                                }else {
                                    if(feed.feed_type == 'text' || feed.feed_type == 'video' || feed.feed_type == 'audio'){ //checking for type change
                                        if(feed_data.video != '' && feed_data.audio == ''){
                                            fs.stat(PATH_LOCATIONS.feed_video_path + feed_data.video, function (err, stats) {
                                                fs.unlink(PATH_LOCATIONS.feed_video_path + feed_data.video, function (err) {
                                                    callback({ success: true, error: false, message: "Feed updated successfully", data: result });
                                                });
                                            });
                                        } else if(feed_data.video == '' && feed_data.audio != ''){
                                            fs.stat(PATH_LOCATIONS.feed_audio_path + feed_data.audio, function (err, stats) {
                                                fs.unlink(PATH_LOCATIONS.feed_audio_path + feed_data.audio, function (err) {
                                                    callback({ success: true, error: false, message: "Feed updated successfully", data: result });
                                                });
                                            });
                                        } else if(feed_data.video != '' && feed_data.audio != ''){
                                            fs.stat(PATH_LOCATIONS.feed_audio_path + feed_data.audio, function (err, stats) {
                                                fs.unlink(PATH_LOCATIONS.feed_audio_path + feed_data.audio, function (err) {
                                                    fs.stat(PATH_LOCATIONS.feed_video_path + feed_data.video, function (err, stats) {
                                                        fs.unlink(PATH_LOCATIONS.feed_video_path + feed_data.video, function (err) {
                                                            callback({ success: true, error: false, message: "Feed updated successfully", data: result });
                                                        });
                                                    });
                                                });
                                            });
                                        }
                                    }else{
                                        callback({ success: true, error: false, message: "Feed updated successfully", data: result });   
                                    }
                                }
                            })
                        }
                    });
                }
            })
        }
    },
    delete: (feedid, callback) => {
        Feed.findOne({ _id: feedid }, function (err, feed) {
            if (feed) {
                Feed.remove({ _id: feedid }, function (err) {
                    if (err) {
                        callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                    } else {
                        if(feed.video != '' && feed.audio == ''){
                            fs.stat(PATH_LOCATIONS.feed_video_path + feed.video, function (err, stats) {
                                fs.unlink(PATH_LOCATIONS.feed_video_path + feed.video, function (err) {
                                    callback({ success: true, error: false, message: "Feed deleted" });
                                });
                            });
                        } else if(feed.video == '' && feed.audio != ''){
                            fs.stat(PATH_LOCATIONS.feed_audio_path + feed.audio, function (err, stats) {
                                fs.unlink(PATH_LOCATIONS.feed_audio_path + feed.audio, function (err) {
                                    callback({ success: true, error: false, message: "Feed deleted" });
                                });
                            });
                        } else if(feed.video != '' && feed.audio != ''){
                            fs.stat(PATH_LOCATIONS.feed_video_path + feed.video, function (err, stats) {
                                fs.unlink(PATH_LOCATIONS.feed_video_path + feed.video, function (err) {
                                    fs.stat(PATH_LOCATIONS.feed_audio_path + feed.audio, function (err, stats) {
                                        fs.unlink(PATH_LOCATIONS.feed_audio_path + feed.audio, function (err) {
                                            callback({ success: true, error: false, message: "Feed deleted" });
                                        });
                                    });
                                });
                            });
                        }else {
                            callback({ success: true, error: false, message: "Feed deleted" });
                        }
                        
                    }
                });
            } else {
                callback({ success: false,error: false, message: "invalid feed id" });
            }
        });
    },
    getAllFeed: (params, callback)=>{
        var sortBy = { 'date': -1 };
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
        var feedAggregate = Feed.aggregate();
        /*if (params.is_active == true || params.is_active == 'true' || params.is_active == false || params.is_active == 'false'){                           
            if(params.is_active == false || params.is_active == 'false'){
                feedAggregate.match({ is_active : false });
            }else {
                feedAggregate.match({ is_active : true });
            }
        }*/
        if(params.is_active == false || params.is_active == 'false'){
            feedAggregate.match({ is_active : false });
        }else if(params.is_active == true || params.is_active == 'true'){
            feedAggregate.match({ is_active : true });
        }
        if(params.searchkey){
            feedAggregate.match({$or: [
                {name : { $regex: params.searchkey, $options: "$i" } },
                {description : { $regex: params.searchkey, $options: "$i" } }
            ]});
        }
        if(params.feed_type && (params.feed_type == 'text' || params.feed_type == 'video' || params.feed_type == 'audio')){
            feedAggregate.match({feed_type : params.feed_type});
        }
        if(params.date){
            feedAggregate.match({ date : moment(new Date(params.date)).format('YYYY-MM-DD') });
        }else if(params.from_date || params.to_date){
            var from_date = moment(new Date()).format('YYYY-MM-DD');
            var to_date = moment(new Date()).format('YYYY-MM-DD');
            if(params.from_date){
                from_date = moment(new Date(params.from_date)).format('YYYY-MM-DD');
            }
            if(params.to_date){
                to_date = moment(new Date(params.to_date)).format('YYYY-MM-DD');
            }
            feedAggregate.match({'date': {"$gte" : from_date}});
            feedAggregate.match({'date':{"$lte" : to_date}});
        }
        feedAggregate.project({
            _id: 1,
            date: 1,
            name: 1,
            description: 1,
            video: 1,
            audio: 1,
            feed_type: 1,
            is_active: 1,
            video_path: { $cond: [ { $eq: [ "$video", '' ] }, '', { "$concat" : [ PATH_LOCATIONS.feed_video_path_view, "$video" ] }] },
            audio_path: { $cond: [ { $eq: [ "$audio", '' ] }, '', { "$concat" : [ PATH_LOCATIONS.feed_audio_path_view, "$audio" ] }] },
            //video_path: { "$concat" : [ PATH_LOCATIONS.feed_video_path_view, "$video" ] },
            //audio_path: { "$concat" : [ PATH_LOCATIONS.feed_audio_path_view, "$audio" ] } 
            createdAt: 1,
            updatedAt: 1
        })
        if(limit){
            var options = { page: page, limit: limit, sortBy: sortBy };
            Feed.aggregatePaginate(feedAggregate, options, function (err, feeds, pageCount, count) {
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
                    callback({ success: true, error: false, message: "Feed list", response: responseData });
                }
            });
        }else{
            //query_option = { sort: { 'createdAt': -1 } };
            feedAggregate.sort(sortBy);
            feedAggregate.exec( function (err, feeds) {
                if (err) {
                callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                }
                else {
                    var count = feeds.length;
                    var res_data = {
                        docs : feeds,
                        total: count,
                        limit: count,
                        offset: 0,
                        page: 1,
                        pages: 1
                    }
                    callback({ success: true, error: false, message: "Feed list", response: res_data });
                }
            });
        }
    },
    feedActiveInactive: (feedid, feeddata, callback) => {
        if(!feedid){
            callback({ success: false, error: true, message: "Feed id require" });
        }else if(feeddata.is_active == undefined || !(feeddata.is_active == true || feeddata.is_active == 'true' || feeddata.is_active == false || feeddata.is_active == 'false')){
            callback({ success: false, error: true, message: "Faeed status must be true or false" });
        }else{
            Feed.findById(feedid, function (err, feed) {
                if (err) {
                    callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                } else if(!feeddata){
                    callback({ success: false, error: true, message: "invalid feed id", errors: err });
                }else{                     
                    if(feeddata.is_active == false || feeddata.is_active == 'false'){
                        feed.is_active = false;
                    }else{
                        feed.is_active = true;
                    }
                    feed.save(function (err) {
                        if (err) {
                            callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                        } else {
                            callback({ success: true, error: false, message: "Feed status updated successfully" });
                        }
                    });
                }
            });
        }
    },
};
module.exports = FeedService;