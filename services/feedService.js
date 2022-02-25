var Feed = require('../models/feeds');
var Team = require('../models/league');
var teamMemberSchema = require('../models/league_member');
var pointSchema = require('../models/point');
var userFeedCommentSchema = require('../models/user_feed_comments');
var userSchema = require('../models/user');

// Imported pushNotification 
var pushNotification = require('../modules/pushNotification');

var mongo = require('mongodb');
//const { query } = require('express');
var async = require("async");
var moment = require('moment');
var ObjectID = mongo.ObjectID;
var fs = require('fs');
const { STATUS_CONSTANTS, STATUS_MESSAGES, URL_PATHS, PATH_LOCATIONS, CONSTANTS } = require('../utils/constant');
var FeedService = {
  /*create: (feed, feed_files, callback) => {
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
          var matching_search_query = {};
          matching_search_query = { name : { $regex: '^'+feed.name+'$', $options: "$i" }, date : feed.date, feed_type : feed.feed_type };
          Feed.find(matching_search_query).exec(function(matchErr, match_feed){
              if (matchErr) {
                  callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: matchErr });
              } else if(match_feed.length > 0){
                  callback({ success: false, error: true, message: "Feed already exists with this type and title" });
              } else{
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
          });
      }
  },*/
  create: async (feed, feed_files, callback) => {
    if (!feed.name) {
      callback({ success: false, error: true, message: "Feed title is required" });
    } else if ((feed.feed_type == 'text' || feed.feed_type == '') && !feed.description) {
      callback({ success: false, error: true, message: "Feed description is required for text type feed" });
    } else if (feed.feed_type == 'video' && (!feed_files || feed_files.video == null)) {
      callback({ success: false, error: true, message: "Video file is required for video type feed" });
    } else if (feed.feed_type == 'audio' && (!feed_files || feed_files.audio == null)) {
      callback({ success: false, error: true, message: "Audio file is required for audio type feed" });
    } else if (!feed.date) {
      callback({ success: false, error: true, message: "Feed date is required" });
    } else if (!feed.link_text) {
      callback({ success: false, error: true, message: "Link Text is required" });
    } else if (!feed.link_url) {
      callback({ success: false, error: true, message: "Link URL is required" });
    } else {
      var matching_search_query = {};
      matching_search_query = { name: { $regex: '^' + feed.name + '$', $options: "$i" }, date: feed.date, feed_type: feed.feed_type };
      Feed.find(matching_search_query).exec(function (matchErr, match_feed) {
        if (matchErr) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: matchErr });
        } else if (match_feed.length > 0) {
          callback({ success: false, error: true, message: "Feed already exists with this type and title" });
        } else {
          var feed_status = true;
          var feed_type = 'text';
          if (feed.is_active == false || feed.is_active == 'false') {
            feed_status = false;
          }
          if (feed.feed_type == 'video') {
            feed_type = 'video';
          } else if (feed.feed_type == 'audio') {
            feed_type = 'audio';
          }
          var insert_data = new Feed({
            _id: new ObjectID,
            date: moment(new Date(feed.date)).format('YYYY-MM-DD'),
            name: feed.name,
            link_text: feed.link_text,
            link_url: feed.link_url,
            description: feed.description,
            video: '',
            audio: '',
            feed_type: feed_type,
            is_active: feed_status
          });
          if (feed.feed_type == 'video' && feed_files && feed_files.video != null) {
            var video_file_name = '';
            var video_file = feed_files.video;
            if (video_file.mimetype.split('/')[0] == 'video') {
              var ext = video_file.name.slice(video_file.name.lastIndexOf('.'));
              video_file_name = `${insert_data._id}_${Date.now()}${ext}`;
              video_file.mv(PATH_LOCATIONS.feed_video_path + video_file_name, function (err) {
                if (err) {
                  video_file_name = '';
                  callback({ success: false, error: true, message: "Error occurred to upload video file", errors: err });
                } else {
                  console.log("Video uploaded");
                  insert_data.video = video_file_name;
                  insert_data.save(function (err, new_data) {
                    if (err) {
                      callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                    } else if (new_data) {
                      callback({ success: true, error: false, message: "Feed created successfully", data: new_data });
                    } else {
                      callback({ success: false, error: true, message: "Some error occurred, please try again" });
                    }
                  });
                }
              });
            } else {
              callback({ success: false, error: true, message: 'Video file type must be video' });
            }
          } else if (feed.feed_type == 'audio' && feed_files && feed_files.audio != null) {
            var audio_file = feed_files.audio;
            if (audio_file.mimetype.split('/')[0] == 'audio') {
              var ext = audio_file.name.slice(audio_file.name.lastIndexOf('.'));
              audio_file_name = `${insert_data._id}_${Date.now()}${ext}`;
              audio_file.mv(PATH_LOCATIONS.feed_audio_path + audio_file_name, function (err) {
                if (err) {
                  audio_file_name = '';
                  callback({ success: false, error: true, message: "Error occurred to upload audio file", errors: err });
                } else {
                  console.log("Audio uploaded");
                  insert_data.audio = audio_file_name;
                  insert_data.save(function (err, new_data) {
                    if (err) {
                      callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                    } else if (new_data) {
                      callback({ success: true, error: false, message: "Feed created successfully", data: new_data });
                    } else {
                      callback({ success: false, error: true, message: "Some error occurred, please try again" });
                    }
                  });
                }
              });
            } else {
              callback({ success: false, error: true, message: "Audio file type must be audio", errors: err });
            }
          } else if (feed.feed_type == 'text') {
            insert_data.save(function (err, new_data) {
              if (err) {
                callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
              } else if (new_data) {
                callback({ success: true, error: false, message: "Feed created successfully", data: new_data });
              } else {
                callback({ success: false, error: true, message: "Some error occurred, please try again" });
              }
            });
          }
        }
      });
    }
  },
  update: (feed, feed_files, callback) => {
    if (!feed.feed_id) {
      callback({ success: false, error: true, message: "Feed id is required" });
    } else if ((feed.feed_type == 'text' || feed.feed_type == '') && !feed.description) {
      callback({ success: false, error: true, message: "Feed sescription is required for text type feed" });
      // } else if(feed.feed_type == 'video' && (!feed_files || feed_files.video == null)){
      //     callback({ success: false, error: true, message: "Video file is required for video type feed" });
      // } else if(feed.feed_type == 'audio' && (!feed_files || feed_files.audio == null)){
      //     callback({ success: false, error: true, message: "Audio file is required for audio type feed" });
    } else if ((feed.link_text == '') && !feed.link_text) {
      callback({ success: false, error: true, message: "Feed link text is required" });
    } else if ((feed.link_url == '') && !feed.link_url) {
      callback({ success: false, error: true, message: "Feed link url is required" });
    } else {
      var matching_search_query = {};
      matching_search_query = { $or: [{ _id: feed.feed_id }, { name: { $regex: '^' + feed.name + '$', $options: "$i" }, date: feed.date, feed_type: feed.feed_type }] };
      Feed.find(matching_search_query).exec(function (matchErr, match_feed) {
        if (matchErr) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: matchErr });
        } else if (match_feed.length > 1) {
          callback({ success: false, error: true, message: "Feed type and title matched with other feed" });
        } else {
          Feed.findOne({ _id: feed.feed_id }).exec(function (err, feed_data) {
            if (err) {
              callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            } else if (!feed_data) {
              callback({ success: false, error: true, message: "Feed not found" });
            } else {
              var video_file_name = '';
              var audio_file_name = feed_data.audio;
              async.waterfall([
                function (nextcb) {
                  if (feed.feed_type == 'video' && feed_files && feed_files.video != null) {

                    fs.unlink(PATH_LOCATIONS.feed_video_path + feed_data.video, function (err) {
                      if (err) {
                        console.log('error while deleting old file', err);
                      } else {
                        console.log('old file deleted successfully');
                      }
                    });

                    var video_file = feed_files.video;
                    if (video_file.mimetype.split('/')[0] == 'video') {
                      var ext = video_file.name.slice(video_file.name.lastIndexOf('.'));
                      video_file_name = `${feed.feed_id}_${Date.now()}${ext}`;
                      video_file.mv(PATH_LOCATIONS.feed_video_path + video_file_name, function (err) {
                        if (err) {
                          video_file_name = '';
                          nextcb(err);
                        } else {
                          nextcb(null);
                        }
                      });
                    } else {
                      nextcb('Video file type must be video');
                    }
                  } else if (feed.feed_type == 'video' && (!feed_files || feed_files.video == null)) {
                    // nextcb('Video file is required');
                    video_file_name = feed_data.video;
                    nextcb(null);

                  } else {
                    nextcb(null);
                  }
                },
                function (nextcb) {
                  if (feed.feed_type == 'audio' && feed_files && feed_files.audio != null) {

                    fs.unlink(PATH_LOCATIONS.feed_audio_path + feed_data.audio, function (err) {
                      if (err) {
                        console.log('error while deleting old file', err);
                      } else {
                        console.log('old audio file deleted successfully');
                      }
                    });

                    var audio_file = feed_files.audio;
                    if (audio_file.mimetype.split('/')[0] == 'audio') {
                      var ext = audio_file.name.slice(audio_file.name.lastIndexOf('.'));
                      audio_file_name = `${feed.feed_id}_${Date.now()}${ext}`;
                      audio_file.mv(PATH_LOCATIONS.feed_audio_path + audio_file_name, function (err) {
                        if (err) {
                          audio_file_name = '';
                          nextcb(err);
                        } else {
                          nextcb(null);
                        }
                      });
                    } else {
                      nextcb('Audio file type must be audio');
                    }
                  } else if (feed.feed_type == 'audio' && (!feed_files || feed_files.audio == null)) {
                    // nextcb('Audio file is required');
                    audio_file_name = feed_data.audio;
                    nextcb(null);
                  } else {
                    nextcb(null);
                  }
                }],
                function (err, response) {
                  if (err) {
                    callback({ success: false, error: true, message: "Some error occure to upload file", error: err });
                  } else {
                    var update_data = {};
                    if (feed.date) {
                      update_data.date = moment(new Date(feed.date)).format('YYYY-MM-DD');
                    }
                    if (feed.name) {
                      update_data.name = feed.name;
                    }
                    if (feed.description) {
                      update_data.description = feed.description;
                    }
                    if (feed.link_text) {
                      update_data.link_text = feed.link_text;
                    }
                    if (feed.link_url) {
                      update_data.link_url = feed.link_url;
                    }
                    if (feed.feed_type) {
                      update_data.feed_type = feed.feed_type;
                    }
                    if (feed.is_active == false || feed.is_active == 'false') {
                      update_data.is_active = false;
                    } else if (feed.is_active == true || feed.is_active == 'true') {
                      update_data.is_active = true;
                    }
                    if (video_file_name != '') {
                      update_data.video = video_file_name;
                    } else if (feed.feed_type) {
                      update_data.video = '';
                    }
                    if (audio_file_name != '') {
                      update_data.audio = audio_file_name;
                    } else if (feed.feed_type) {
                      update_data.audio = '';
                    }
                    Feed.findOneAndUpdate({ '_id': feed.feed_id }, { $set: update_data }, { returnNewDocument: true, upsert: false, useFindAndModify: false }).exec(function (err, result) {
                      if (err) {
                        callback({ success: false, error: true, message: "Some error occure, please try again", error: err });
                      } else {

                        if (feed.feed_type == 'text' || feed.feed_type == 'video' || feed.feed_type == 'audio') { //checking for type change
                          if (feed_data.video != '' && feed_data.audio == '') {
                            fs.stat(PATH_LOCATIONS.feed_video_path + feed_data.video, function (err, stats) {
                              // fs.unlink(PATH_LOCATIONS.feed_video_path + feed_data.video, function (err) {
                              callback({ success: true, error: false, message: "Feed updated successfully", data: result });
                              // });
                            });
                          } else if (feed_data.video == '' && feed_data.audio != '') {
                            fs.stat(PATH_LOCATIONS.feed_audio_path + feed_data.audio, function (err, stats) {
                              // fs.unlink(PATH_LOCATIONS.feed_audio_path + feed_data.audio, function (err) {
                              callback({ success: true, error: false, message: "Feed updated successfully", data: result });
                              // });
                            });
                          } else if (feed.feed_type == 'text') {
                            // fs.stat(PATH_LOCATIONS.feed_audio_path + feed_data.audio, function (err, stats) {
                            //     fs.unlink(PATH_LOCATIONS.feed_audio_path + feed_data.audio, function (err) {
                            //         fs.stat(PATH_LOCATIONS.feed_video_path + feed_data.video, function (err, stats) {
                            //             fs.unlink(PATH_LOCATIONS.feed_video_path + feed_data.video, function (err) {
                            callback({ success: true, error: false, message: "Feed updated successfully", data: result });
                            //         });
                            //     });
                            // });
                            // });
                          }
                        } else {
                          callback({ success: true, error: false, message: "Feed updated successfully", data: result });
                        }
                      }
                    })
                  }
                });
            }
          })
        }
      });
    }
  },
  delete: (feedid, callback) => {
    Feed.findOne({ _id: feedid }, function (err, feed) {
      if (feed) {
        Feed.remove({ _id: feedid }, function (err) {
          if (err) {
            callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
          } else {
            if (feed.video != '' && feed.audio == '') {
              fs.stat(PATH_LOCATIONS.feed_video_path + feed.video, function (err, stats) {
                fs.unlink(PATH_LOCATIONS.feed_video_path + feed.video, function (err) {
                  callback({ success: true, error: false, message: "Feed deleted" });
                });
              });
            } else if (feed.video == '' && feed.audio != '') {
              fs.stat(PATH_LOCATIONS.feed_audio_path + feed.audio, function (err, stats) {
                fs.unlink(PATH_LOCATIONS.feed_audio_path + feed.audio, function (err) {
                  callback({ success: true, error: false, message: "Feed deleted" });
                });
              });
            } else if (feed.video != '' && feed.audio != '') {
              fs.stat(PATH_LOCATIONS.feed_video_path + feed.video, function (err, stats) {
                fs.unlink(PATH_LOCATIONS.feed_video_path + feed.video, function (err) {
                  fs.stat(PATH_LOCATIONS.feed_audio_path + feed.audio, function (err, stats) {
                    fs.unlink(PATH_LOCATIONS.feed_audio_path + feed.audio, function (err) {
                      callback({ success: true, error: false, message: "Feed deleted" });
                    });
                  });
                });
              });
            } else {
              callback({ success: true, error: false, message: "Feed deleted" });
            }

          }
        });
      } else {
        callback({ success: false, error: false, message: "invalid feed id" });
      }
    });
  },
  getAllFeed: (params, callback) => {
    // var sortBy = { 'date': -1 };
    var sortBy = { 'createdAt': -1 };
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
    if (params.is_active == false || params.is_active == 'false') {
      feedAggregate.match({ is_active: false });
    } else if (params.is_active == true || params.is_active == 'true') {
      feedAggregate.match({ is_active: true });
    }
    if (params.searchkey) {
      feedAggregate.match({
        $or: [
          { name: { $regex: params.searchkey, $options: "$i" } },
          { description: { $regex: params.searchkey, $options: "$i" } }
        ]
      });
    }
    if (params.feed_type && (params.feed_type == 'text' || params.feed_type == 'video' || params.feed_type == 'audio')) {
      feedAggregate.match({ feed_type: params.feed_type });
    }
    if (params.date) {
      feedAggregate.match({ date: moment(new Date(params.date)).format('YYYY-MM-DD') });
    } else if (params.from_date || params.to_date) {
      var from_date = moment(new Date()).format('YYYY-MM-DD');
      var to_date = moment(new Date()).format('YYYY-MM-DD');
      if (params.from_date) {
        from_date = moment(new Date(params.from_date)).format('YYYY-MM-DD');
      }
      if (params.to_date) {
        to_date = moment(new Date(params.to_date)).format('YYYY-MM-DD');
      }
      feedAggregate.match({ 'date': { "$gte": from_date } });
      feedAggregate.match({ 'date': { "$lte": to_date } });
    }
    feedAggregate.project({
      _id: 1,
      date: 1,
      name: 1,
      description: 1,
      link_text: 1,
      link_url: 1,
      video: 1,
      audio: 1,
      feed_type: 1,
      is_active: 1,
      video_path: { $cond: [{ $eq: ["$video", ''] }, '', { "$concat": [PATH_LOCATIONS.feed_video_path_view, "$video"] }] },
      audio_path: { $cond: [{ $eq: ["$audio", ''] }, '', { "$concat": [PATH_LOCATIONS.feed_audio_path_view, "$audio"] }] },
      //video_path: { "$concat" : [ PATH_LOCATIONS.feed_video_path_view, "$video" ] },
      //audio_path: { "$concat" : [ PATH_LOCATIONS.feed_audio_path_view, "$audio" ] } 
      createdAt: 1,
      updatedAt: 1
    })
    if (limit) {
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
    } else {
      //query_option = { sort: { 'createdAt': -1 } };
      feedAggregate.sort(sortBy);
      feedAggregate.exec(function (err, feeds) {
        if (err) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
        }
        else {
          var count = feeds.length;
          var res_data = {
            docs: feeds,
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

  getUserFeed: async (data, callback) => {
    console.log("data", data);
    if (data) {
      teamMemberSchema.find(
        {
          member_id: data.user_id,
        }, { member_id: 1, league_id: 1 },
        function (err, resDetails) {
          if (err) {
            callback({
              success: false,
              error: true,
              response_code: 5005,
              message: "INTERNAL DB ERROR",
              response: err
            });
          } else {
            if (resDetails.length > 0) {

              // console.log("resDetails==>",resDetails);

              let team_ids = [];

              resDetails.map(element => {
                team_ids.push(element.league_id)
              })

              // console.log('team_ids',team_ids);
              teamMemberSchema.find(
                {
                  league_id: { '$in': team_ids },
                  // member_id : {'$nin' : data.user_id }
                }, function (err, res) {

                  if (err) {
                    callback({
                      success: false,
                      error: true,
                      response_code: 5005,
                      message: "INTERNAL DB ERROR",
                      response: err
                    });
                  } else {
                    // console.log('res==>',res);
                    let user_ids = [];

                    res.map(element => {
                      user_ids.push(element.member_id)
                    })
                    // console.log('user_ids==>',user_ids);

                    var page = 1,
                      limit = 20,
                      query = {};

                    if (data.page) {
                      page = parseInt(data.page);
                    }
                    if (data.limit) {
                      limit = parseInt(data.limit);
                    }
                    if (user_ids) {
                      query['user_id'] = { '$in': user_ids };
                    }


                    var date = new Date();
                    date.setDate(date.getDate() - 7);
                    var finalDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
                    var startDate = new Date(finalDate);
                    startDate.setHours(0, 0, 0, 0);
                    var endDate = new Date();
                    endDate.setHours(23, 59, 59, 999);

                    console.log("ccstartc", startDate);
                    console.log("endDate", endDate);

                    query['createdAt'] = { $gte: startDate, $lt: endDate };
                    //    query['date'] =  { $gte: startDate, $lt: endDate };

                    var aggregate = pointSchema.aggregate();
                    aggregate.match(query);

                    aggregate.lookup({
                      from: 'users',
                      localField: 'user_id',
                      foreignField: '_id',
                      as: 'user_details'
                    });
                    aggregate.lookup({
                      from: 'activities',
                      localField: 'activity_id',
                      foreignField: '_id',
                      as: 'activity_details'
                    });

                    aggregate.unwind({
                      path: "$user_details",
                      preserveNullAndEmptyArrays: true
                    })
                    aggregate.unwind({
                      path: "$activity_details",
                      preserveNullAndEmptyArrays: true
                    })

                    aggregate.sort({
                      'date': -1
                    })
                    aggregate.project({
                      _id: 1,
                      createdAt: 1,
                      activity_id: 1,
                      date: 1,
                      others_activity: 1,
                      point: 1,
                      image: { $concat: [PATH_LOCATIONS.user_point_image_path_view, "$image"] },
                      likes: 1,
                      note: 1,
                      comments: 1,
                      data_type: 1,
                      sent_notification: 1,
                      user_id: 1,
                      user_details: {
                        _id: "$user_details._id",
                        prfile_image: { $concat: [PATH_LOCATIONS.user_profile_pic_path_view, "$user_details.image"] },
                        social_login: "$user_details.social_login",
                        first_name: "$user_details.first_name",
                        last_name: "$user_details.last_name"
                      },
                      activity_details: {
                        _id: "$activity_details._id",
                        activity: "$activity_details.activity",
                        is_active: "$activity_details.is_active",
                        order: "$activity_details.order",
                      },

                    });
                    var options = {
                      page: page,
                      limit: limit,
                    }

                    pointSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
                      if (err) {
                        callback({
                          "response_code": 5005,
                          "response_message": err,
                          "response_data": {}
                        });
                      } else {
                        var data = {
                          docs: results,
                          pages: pageCount,
                          total: count,
                          limit: limit,
                          page: page
                        }
                        callback({
                          "response_code": 2000,
                          "response_message": "User feed list",
                          "response_data": data
                        });
                      }
                    });
                  }

                })
            } else if (resDetails.length == 0) {
              pointSchema.find(
                {
                  user_id: data.user_id
                })
                // .populate("user_id")
                // .populate("activity_id")
                // .sort({ createdAt: -1 })
                .exec(function (er, pointLogRes) {
                  if (er) {
                    callback({
                      success: false,
                      error: true,
                      response_code: 5005,
                      message: "No Point Log Found",
                      response: err
                    });
                  } else {
                    let user_ids = [];

                    pointLogRes.map(element => {
                      user_ids.push(element.user_id)
                    })

                    var page = 1,
                      limit = 20,
                      query = {};

                    if (data.page) {
                      page = parseInt(data.page);
                    }
                    if (data.limit) {
                      limit = parseInt(data.limit);
                    }
                    if (user_ids) {
                      query['user_id'] = { '$in': user_ids };
                    }

                    var date = new Date();
                    date.setDate(date.getDate() - 7);
                    var finalDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
                    var startDate = new Date(finalDate);
                    startDate.setHours(0, 0, 0, 0);
                    var endDate = new Date();
                    endDate.setHours(23, 59, 59, 999);

                    console.log("ccstartc", startDate);
                    console.log("endDate", endDate);

                    query['createdAt'] = { $gte: startDate, $lt: endDate };
                    //    query['date'] =  { $gte: startDate, $lt: endDate };

                    var aggregate = pointSchema.aggregate();
                    aggregate.match(query);

                    aggregate.lookup({
                      from: 'users',
                      localField: 'user_id',
                      foreignField: '_id',
                      as: 'user_details'
                    });
                    aggregate.lookup({
                      from: 'activities',
                      localField: 'activity_id',
                      foreignField: '_id',
                      as: 'activity_details'
                    });

                    aggregate.unwind({
                      path: "$user_details",
                      preserveNullAndEmptyArrays: true
                    })
                    aggregate.unwind({
                      path: "$activity_details",
                      preserveNullAndEmptyArrays: true
                    })

                    aggregate.sort({
                      // 'date': -1
                      'createdAt': -1
                    })
                    aggregate.project({
                      _id: 1,
                      createdAt: 1,
                      activity_id: 1,
                      date: 1,
                      others_activity: 1,
                      point: 1,
                      image: { $concat: [PATH_LOCATIONS.user_point_image_path_view, "$image"] },
                      likes: 1,
                      note: 1,
                      comments: 1,
                      data_type: 1,
                      sent_notification: 1,
                      user_id: 1,
                      user_details: {
                        _id: "$user_details._id",
                        prfile_image: { $concat: [PATH_LOCATIONS.user_profile_pic_path_view, "$user_details.image"] },
                        social_login: "$user_details.social_login",
                        first_name: "$user_details.first_name",
                        last_name: "$user_details.last_name"
                      },
                      activity_details: {
                        _id: "$activity_details._id",
                        activity: "$activity_details.activity",
                        is_active: "$activity_details.is_active",
                        order: "$activity_details.order",
                      },

                    });
                    var options = {
                      page: page,
                      limit: limit,
                    }

                    pointSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
                      if (err) {
                        callback({
                          "response_code": 5005,
                          "response_message": err,
                          "response_data": {}
                        });
                      } else {
                        var data = {
                          docs: results,
                          pages: pageCount,
                          total: count,
                          limit: limit,
                          page: page
                        }
                        callback({
                          "response_code": 2000,
                          "response_message": "User feed list",
                          "response_data": data
                        });
                      }
                    });
                  }
                })
            } else {
              callback({
                success: true,
                response_code: 2000,
                error: false,
                message: "No feed available because You have not join any team till now ",
                response: resDetails
              });
            }
          }
        });
    } else {
      callback({
        "response_code": 5005,
        "response_message": "INTERNAL DB ERROR",
        "response_data": {}
      });
    }

  },

  // getUserFeedById: async (data, callback) => {
  //   console.log("data", data);
  //   if(data) {
  //     pointSchema.find(
  //       {
  //         _id: data.point_id
  //       })
  //       .exec(function (er, pointLogRes) {
  //         console.log("pointLogRes", pointLogRes);
  //         if (er) {
  //           callback({
  //             success: false,
  //             error: true,
  //             response_code: 5005,
  //             message: "No Point Log Found",
  //             response: err
  //           });
  //         } else {
  //           let user_ids = [];

  //           pointLogRes.map(element => {
  //             user_ids.push(element.user_id)
  //           })
  //           console.log("user_ids", user_ids);
  //           var page = 1,
  //             limit = 20,
  //             query = {};

  //           if (data.page) {
  //             page = parseInt(data.page);
  //           }
  //           if (data.limit) {
  //             limit = parseInt(data.limit);
  //           }
  //           if (user_ids) {
  //             query['user_id'] = user_ids;
  //           }

  //           var date = new Date();
  //           date.setDate(date.getDate() - 7);
  //           var finalDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
  //           var startDate = new Date(finalDate);
  //           startDate.setHours(0, 0, 0, 0);
  //           var endDate = new Date();
  //           endDate.setHours(23, 59, 59, 999);

  //           console.log("ccstartc", startDate);
  //           console.log("endDate", endDate);

  //           query['createdAt'] = { $gte: startDate, $lt: endDate };
  //           //    query['date'] =  { $gte: startDate, $lt: endDate };

  //           var aggregate = pointSchema.aggregate();
  //           aggregate.match(query);
  //           console.log("query", query);

  //           aggregate.lookup({
  //             from: 'users',
  //             localField: 'user_id',
  //             foreignField: '_id',
  //             as: 'user_details'
  //           });
  //           aggregate.lookup({
  //             from: 'activities',
  //             localField: 'activity_id',
  //             foreignField: '_id',
  //             as: 'activity_details'
  //           });

  //           aggregate.unwind({
  //             path: "$user_details",
  //             preserveNullAndEmptyArrays: true
  //           })
  //           aggregate.unwind({
  //             path: "$activity_details",
  //             preserveNullAndEmptyArrays: true
  //           })

  //           aggregate.sort({
  //             'date': -1
  //           })
  //           aggregate.project({
  //             _id: 1,
  //             createdAt: 1,
  //             activity_id: 1,
  //             date: 1,
  //             others_activity: 1,
  //             point: 1,
  //             image: { $concat: [PATH_LOCATIONS.user_point_image_path_view, "$image"] },
  //             likes: 1,
  //             note: 1,
  //             comments: 1,
  //             data_type: 1,
  //             sent_notification: 1,
  //             user_id: 1,
  //             user_details: {
  //               _id: "$user_details._id",
  //               prfile_image: { $concat: [PATH_LOCATIONS.user_profile_pic_path_view, "$user_details.image"] },
  //               social_login: "$user_details.social_login",
  //               first_name: "$user_details.first_name",
  //               last_name: "$user_details.last_name"
  //             },
  //             activity_details: {
  //               _id: "$activity_details._id",
  //               activity: "$activity_details.activity",
  //               is_active: "$activity_details.is_active",
  //               order: "$activity_details.order",
  //             },

  //           });
  //           var options = {
  //             page: page,
  //             limit: limit,
  //           }

  //           pointSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
  //             if (err) {
  //               callback({
  //                 "response_code": 5005,
  //                 "response_message": err,
  //                 "response_data": {}
  //               });
  //             } else {
  //               var data = {
  //                 docs: results,
  //                 pages: pageCount,
  //                 total: count,
  //                 limit: limit,
  //                 page: page
  //               }
  //               callback({
  //                 "response_code": 2000,
  //                 "response_message": "User feed list",
  //                 "response_data": data
  //               });
  //             }
  //           });
  //         }
  //       })
  //   } else {
  //     callback({
  //       "response_code": 5005,
  //       "response_message": "INTERNAL DB ERROR",
  //       "response_data": {}
  //     });
  //   }
  // },
  
  // Created By @Srijan
  // getAllFeedPoint: async (callback) => {
    
  //   var FeedData = [];
  //   var pointData = [];
  //   var date = new Date();
  //   date.setDate(date.getDate() - 7);
  //   var finalDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
  //   var startDate = new Date(finalDate);
  //   startDate.setHours(0, 0, 0, 0);
  //   var endDate = new Date();
  //   endDate.setHours(23, 59, 59, 999);

  //   console.log("ccstartc", startDate);
  //   console.log("endDate", endDate);
  //   // query['createdAt'] = { $gte: startDate, $lt: endDate };

  //   // var feedAggregate = Feed.aggregate();
  //   // feedAggregate.match({ 'date': { "$gte": startDate } });
  //   // feedAggregate.match({ 'date': { "$lte": endDate } });
  //   // // feedAggregate.match(query);
  //   Feed.aggregate([
  //     { "$match": { "createdAt": { "$gte": startDate, "$lte": endDate } } }]

  //   ).exec(function (err, feeds) {
  //     if (err) {
  //       callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
  //     }
  //     else {
  //       var newFeeds = [];
  //       feeds.forEach((item) => {
  //         var newObj = {
  //           feed_category: "feed",
  //           _id: item._id,
  //           video: item.video,
  //           audio: item.audio,
  //           feed_type: item.feed_type,
  //           is_active: item.is_active,
  //           date: item.date,
  //           name: item.name,
  //           link_text: item.link_text,
  //           link_url: item.link_url,
  //           description: item.description,
  //           createdAt: item.createdAt,
  //           updatedAt: item.updatedAt,
  //           __v: 0
  //         };
  //         newFeeds.push(newObj);
  //       });
  //       // console.log("===============newFeeeedsssss========", newFeeds);
  //       // console.log("================feeeds=========",feeds);
  //       // FeedData.push(feeds);
  //       pointSchema.aggregate([
  //         { "$match": { "createdAt": { "$gte": startDate } } },
  //         { "$match": { "createdAt": { "$lte": endDate } } }]
  //       )
  //       .lookup({
  //         from: 'users',
  //         localField: 'user_id',
  //         foreignField: '_id',
  //         as: 'user_details'
  //       })
  //       .lookup({
  //         from: 'activities',
  //         localField: 'activity_id',
  //         foreignField: '_id',
  //         as: 'activity_details'
  //       })
  //       .unwind({
  //         path: "$user_details",
  //         preserveNullAndEmptyArrays: true
  //       })
  //       .unwind({
  //         path: "$activity_details",
  //         preserveNullAndEmptyArrays: true
  //       })
  //       .project({
  //         _id: 1,
  //         createdAt: 1,
  //         activity_id: 1,
  //         date: 1,
  //         others_activity: 1,
  //         point: 1,
  //         image: { $concat: [PATH_LOCATIONS.user_point_image_path_view, "$image"] },
  //         likes: 1,
  //         note: 1,
  //         comments: 1,
  //         data_type: 1,
  //         sent_notification: 1,
  //         user_id: 1,
  //         user_details: {
  //           _id: "$user_details._id",
  //           prfile_image: { $concat: [PATH_LOCATIONS.user_profile_pic_path_view, "$user_details.image"] },
  //           social_login: "$user_details.social_login",
  //           first_name: "$user_details.first_name",
  //           last_name: "$user_details.last_name"
  //         },
  //         activity_details: {
  //           _id: "$activity_details._id",
  //           activity: "$activity_details.activity",
  //           is_active: "$activity_details.is_active",
  //           order: "$activity_details.order",
  //         },
  //       })
  //       .exec(function (err, points) {
  //         if (err) {
  //           callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
  //         }
  //         else {
  //           console.log("============================poiiiiiiiiiiiiiiintssss logggg=======",points)

  //           // var newPoints=[];
  //           points.forEach((item) => {
  //           var newObjPoint = {
  //             feed_category: "point",
  //             _id: item._id,
  //             point: item.point,
  //             note: item.note,
  //             data_type: item.data_type,
  //             sent_notification: item.sent_notification,
  //             image: item.image,
  //             others_activity: item.activity,
  //             likes: item.likes,
  //             user_id: item.user_id,
  //             activity_id: item.activity_id,
  //             date: item.date,
  //             comments: item.comments,
  //             createdAt: item.createdAt,
  //             updatedAt: item.updatedAt,
  //             __v: 0,
  //             user_details: item.user_details,
  //             activity_details:item.activity_details
  //         }
  //         newFeeds.push(newObjPoint);
  //       });
  //         // console.log("============newFeeds=============",newFeeds);



  //           // console.log("=============point data==============", points);

  //           // // FeedData.push(points);
  //           // const all_Data = feeds.concat(points);
  //           // console.log("=============all Data===========", all_Data);
  //         const resultFinal=newFeeds.sort((a,b)=>{
  //           return b.createdAt - a.createdAt
  //         })
  //         callback(
  //           {
  //             "success": true,
  //             "message": "Feed list",
  //             "response_data": {docs:resultFinal}
  //           }
  //         )

  //         }

  //       });
  //     }

  //   });



  //   // console.log("=============feedData==============", FeedData);

  //   // console.log( "=============pointdata==============", pointData) ;

  //   // var totalAllFeedPoints = [...FeedData, ...pointData];
  //   // console.log("=============totaldata", totalAllFeedPoints);
  //   // feedAggregate.exec(function (err, result) {
  //   //   if (err) {
  //   //     callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
  //   //   }
  //   //   else {
  //   //     console.log("===========result=========",result);
  //   //     var FeedData=result;
  //   //   }
  //   // });

  //   // console.log("======================feed dataaaaaaaaaaaa=====================",FeedData)


  //   // var pointAggregate = pointSchema.aggregate();
  //   // pointAggregate.match({ 'date': { "$gte": startDate } });
  //   // pointAggregate.match({ 'date': { "$lte": endDate } });
  //   // // pointAggregate.match(query);


  //   // pointAggregate.exec(function (err, result) {
  //   //   if (err) {
  //   //     callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
  //   //   }
  //   //   else {

  //   //     var pointData=result;
  //   //   }
  //   // });
  //   // console.log("======================point dataaaaaaaaaaaa=====================",pointData);




  //   // var total_feed_point=allFeed.concat(allPoints);
  //   // console.log("==========================================alllllllllllll=====================",total_feed_point);
  //   // var aggregate = total_feed_point.aggregate();
  //   // aggregate.match({ 'date': { "$gte": startDate } });
  //   // aggregate.match({ 'date': { "$lte": endDate } });
  //   // aggregate.sort({
  //   //   // 'date': -1
  //   //   'createdAt': -1
  //   // })
  //   // aggregate.exec(function (err, result) {
  //   //   if (err) {
  //   //     callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
  //   //   }
  //   //   else {

  //   //     callback({ success: true, error: false, message: "Feed list", response: result });
  //   //   }
  //   // });


  // },
// Created By @Srijan // End

// Created by @Riman 

getAllFeedPoint: async (data, callback) => { 
  if (data) {
      teamMemberSchema.find(
      {
          member_id: data.user_id,
      }, { member_id: 1, league_id: 1 },
      function (err, resDetails) {
          if (err) {
          callback({
              success: false,
              error: true,
              response_code: 5005,
              message: "INTERNAL DB ERROR 1",
              response: err
          });
          } else {
              if (resDetails.length > 0) {
                  let team_ids = [];

                  resDetails.map(element => {
                      team_ids.push(element.league_id)
                  })

                  teamMemberSchema.find(
                      {
                      league_id: { '$in': team_ids },
                      // member_id : {'$nin' : data.user_id }
                      }, function (err, res) {

                      if (err) {
                          callback({
                          success: false,
                          error: true,
                          response_code: 5005,
                          message: "INTERNAL DB ERROR 2",
                          response: err
                          });
                      } else {

                          let user_ids = [];

                          res.map(element => {
                          user_ids.push(element.member_id)
                          })
                          // console.log('user_ids==>',user_ids);

                          var page = 1,
                          limit = 20,
                          query = {};

                          if (data.page) {
                          page = parseInt(data.page);
                          }
                          if (data.limit) {
                          limit = parseInt(data.limit);
                          }
                          if (user_ids) {
                          query['user_id'] = { '$in': user_ids };
                          }

                          var options = {
                              page: page,
                              limit: limit,
                          }
                              
                          var date = new Date();
                          date.setDate(date.getDate() - 7);
                          var finalDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
                          var startDate = new Date(finalDate);
                          startDate.setHours(0, 0, 0, 0);
                          var endDate = new Date();
                          endDate.setHours(23, 59, 59, 999);


                          // query['createdAt'] = { $gte: startDate, $lt: endDate };
                          //    query['date'] =  { $gte: startDate, $lt: endDate };

                          pointSchema.aggregate([
                            { "$match": { "createdAt": { "$gte": startDate, "$lte": endDate } } },
                            { "$match": { "user_id": { '$in': user_ids } } }
                          ])
                          .lookup({
                              from: 'users',
                              localField: 'user_id',
                              foreignField: '_id',
                              as: 'user_details'
                          })
                          .lookup({
                              from: 'activities',
                              localField: 'activity_id',
                              foreignField: '_id',
                              as: 'activity_details'
                          })
                          .unwind({
                              path: "$user_details",
                              preserveNullAndEmptyArrays: true
                          })
                          .unwind({
                              path: "$activity_details",
                              preserveNullAndEmptyArrays: true
                          })
                          .project({
                              _id: 1,
                              createdAt: 1,
                              activity_id: 1,
                              date: 1,
                              others_activity: 1,
                              point: 1,
                              image: { $concat: [PATH_LOCATIONS.user_point_image_path_view, "$image"] },
                              likes: 1,
                              note: 1,
                              comments: 1,
                              data_type: 1,
                              sent_notification: 1,
                              user_id: 1,
                              user_details: {
                                  _id: "$user_details._id",
                                  prfile_image: { $concat: [PATH_LOCATIONS.user_profile_pic_path_view, "$user_details.image"] },
                                  social_login: "$user_details.social_login",
                                  first_name: "$user_details.first_name",
                                  last_name: "$user_details.last_name"
                              },
                              activity_details: {
                                  _id: "$activity_details._id",
                                  activity: "$activity_details.activity",
                                  is_active: "$activity_details.is_active",
                                  order: "$activity_details.order",
                              },
                          })
                          .exec(function (err, pointLogsResult) {
                              if (err) {
                                callback({
                                  success: false,
                                  error: true,
                                  response_code: 5005,
                                  message: "INTERNAL DB ERROR 3",
                                  response: err
                              });
                              } else {
                                  var newFeeds = [];
                                  pointLogsResult.forEach((item) => {
                                      var newObjPoint = {
                                        feed_category: "point",
                                        _id: item._id,
                                        point: item.point,
                                        note: item.note,
                                        data_type: item.data_type,
                                        sent_notification: item.sent_notification,
                                        image: item.image,
                                        others_activity: item.others_activity,
                                        likes: item.likes,
                                        user_id: item.user_id,
                                        activity_id: item.activity_id,
                                        date: item.date,
                                        comments: item.comments,
                                        createdAt: item.createdAt,
                                        updatedAt: item.updatedAt,
                                        __v: 0,
                                        user_details: item.user_details,
                                        activity_details:item.activity_details
                                    }
                                    newFeeds.push(newObjPoint);
                                  });

                                  var newDate = new Date();
                                  newDate.setDate(newDate.getDate() - 14);
                                  var finalDateFeed = newDate.getFullYear() + '-' + (newDate.getMonth() + 1) + '-' + newDate.getDate();
                                  var startDateFeed = new Date(finalDateFeed);
                                  startDateFeed.setHours(0, 0, 0, 0);
                                  var endDateFeed = new Date();
                                  endDateFeed.setHours(23, 59, 59, 999);

                                  Feed.find({ is_active: true, "createdAt": { "$gte": startDateFeed, "$lte": endDateFeed } })
                                      .exec(function (err, admiFeedsResult) {
                                      if (err) {
                                        callback({
                                          success: false,
                                          error: true,
                                          response_code: 5005,
                                          message: "INTERNAL DB ERROR 4",
                                          response: err
                                        });
                                      } else {
                                          admiFeedsResult.forEach((item) => {
                                              var newObj = {
                                              feed_category: "feed",
                                              _id: item._id,
                                              video: item.video,
                                              audio: item.audio,
                                              feed_type: item.feed_type,
                                              is_active: item.is_active,
                                              date: item.date,
                                              name: item.name,
                                              link_text: item.link_text,
                                              link_url: item.link_url,
                                              description: item.description,
                                              createdAt: item.createdAt,
                                              updatedAt: item.updatedAt,
                                              __v: 0
                                              };
                                              newFeeds.push(newObj);
                                          });
                                          const resultFinal=newFeeds.sort((a,b)=>{
                                          return b.createdAt - a.createdAt
                                          })
                                          callback({
                                            "success": true,
                                            "message": "Feed list",
                                            "response_data": {docs:resultFinal}
                                          })
                                      }
                                  });
                              }
                          });
                      }
                  })
              } else if(resDetails.length == 0){
                  pointSchema.find(
                  {
                      user_id: data.user_id
                  })
                  .exec(function (er, pointLogRes) {
                      if (er) {
                          callback({
                              success: false,
                              error: true,
                              response_code: 5005,
                              message: "No Point Log Found",
                              response: err
                          });
                      } else {
                          let user_ids = [];

                          pointLogRes.map(element => {
                          user_ids.push(element.user_id)
                          })
                          // console.log('user_ids==>',user_ids);

                          var page = 1,
                          limit = 20,
                          query = {};

                          if (data.page) {
                          page = parseInt(data.page);
                          }
                          if (data.limit) {
                          limit = parseInt(data.limit);
                          }
                          if (user_ids) {
                          query['user_id'] = { '$in': user_ids };
                          }

                          var options = {
                              page: page,
                              limit: limit,
                          }
                              
                          var date = new Date();
                          date.setDate(date.getDate() - 7);
                          var finalDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
                          var startDate = new Date(finalDate);
                          startDate.setHours(0, 0, 0, 0);
                          var endDate = new Date();
                          endDate.setHours(23, 59, 59, 999);

                          query['createdAt'] = { $gte: startDate, $lt: endDate };
                          //    query['date'] =  { $gte: startDate, $lt: endDate };

                          pointSchema.aggregate([
                            { "$match": { "createdAt": { "$gte": startDate, "$lte": endDate } } },
                            { "$match": { "user_id": { '$in': user_ids } } }
                          ])
                          .lookup({
                              from: 'users',
                              localField: 'user_id',
                              foreignField: '_id',
                              as: 'user_details'
                          })
                          .lookup({
                              from: 'activities',
                              localField: 'activity_id',
                              foreignField: '_id',
                              as: 'activity_details'
                          })
                          .unwind({
                              path: "$user_details",
                              preserveNullAndEmptyArrays: true
                          })
                          .unwind({
                              path: "$activity_details",
                              preserveNullAndEmptyArrays: true
                          })
                          .project({
                              _id: 1,
                              createdAt: 1,
                              activity_id: 1,
                              date: 1,
                              others_activity: 1,
                              point: 1,
                              image: { $concat: [PATH_LOCATIONS.user_point_image_path_view, "$image"] },
                              likes: 1,
                              note: 1,
                              comments: 1,
                              data_type: 1,
                              sent_notification: 1,
                              user_id: 1,
                              user_details: {
                                  _id: "$user_details._id",
                                  prfile_image: { $concat: [PATH_LOCATIONS.user_profile_pic_path_view, "$user_details.image"] },
                                  social_login: "$user_details.social_login",
                                  first_name: "$user_details.first_name",
                                  last_name: "$user_details.last_name"
                              },
                              activity_details: {
                                  _id: "$activity_details._id",
                                  activity: "$activity_details.activity",
                                  is_active: "$activity_details.is_active",
                                  order: "$activity_details.order",
                              },
                          })
                          .exec(function (err, pointLogsResult) {
                              if (err) {
                                callback({
                                  success: false,
                                  error: true,
                                  response_code: 5005,
                                  message: "INTERNAL DB ERROR 5",
                                  response: err
                                });
                              } else {
                                  var newFeeds = [];
                                  pointLogsResult.forEach((item) => {
                                      var newObjPoint = {
                                        feed_category: "point",
                                        _id: item._id,
                                        point: item.point,
                                        note: item.note,
                                        data_type: item.data_type,
                                        sent_notification: item.sent_notification,
                                        image: item.image,
                                        others_activity: item.activity,
                                        likes: item.likes,
                                        user_id: item.user_id,
                                        activity_id: item.activity_id,
                                        date: item.date,
                                        comments: item.comments,
                                        createdAt: item.createdAt,
                                        updatedAt: item.updatedAt,
                                        __v: 0,
                                        user_details: item.user_details,
                                        activity_details:item.activity_details
                                    }
                                    newFeeds.push(newObjPoint);
                                  });

                                  var newDate = new Date();
                                  newDate.setDate(newDate.getDate() - 14);
                                  var finalDateFeed = newDate.getFullYear() + '-' + (newDate.getMonth() + 1) + '-' + newDate.getDate();
                                  var startDateFeed = new Date(finalDateFeed);
                                  startDateFeed.setHours(0, 0, 0, 0);
                                  var endDateFeed = new Date();
                                  endDateFeed.setHours(23, 59, 59, 999);

                                  Feed.find({ is_active: true, "createdAt": { "$gte": startDateFeed, "$lte": endDateFeed } })
                                      .exec(function (err, admiFeedsResult) {
                                      if (err) {
                                        callback({
                                          success: false,
                                          error: true,
                                          response_code: 5005,
                                          message: "INTERNAL DB ERROR 6",
                                          response: err
                                        });
                                      } else {
                                          admiFeedsResult.forEach((item) => {
                                              var newObj = {
                                              feed_category: "feed",
                                              _id: item._id,
                                              video: item.video,
                                              audio: item.audio,
                                              feed_type: item.feed_type,
                                              is_active: item.is_active,
                                              date: item.date,
                                              name: item.name,
                                              link_text: item.link_text,
                                              link_url: item.link_url,
                                              description: item.description,
                                              createdAt: item.createdAt,
                                              updatedAt: item.updatedAt,
                                              __v: 0
                                              };
                                              newFeeds.push(newObj);
                                          });
                                          const resultFinal=newFeeds.sort((a,b)=>{
                                          return b.createdAt - a.createdAt
                                          })
                                          callback({
                                            "success": true,
                                            "message": "Feed list",
                                            "response_data": {docs:resultFinal}
                                          });
                                      }
                                  })
                              }
                          });
                      }
                  }) 
              } else {
                  var newFeedsData = [];
                  var newDate = new Date();
                  newDate.setDate(newDate.getDate() - 14);
                  var finalDateFeed = newDate.getFullYear() + '-' + (newDate.getMonth() + 1) + '-' + newDate.getDate();
                  var startDateFeed = new Date(finalDateFeed);
                  startDateFeed.setHours(0, 0, 0, 0);
                  var endDateFeed = new Date();
                  endDateFeed.setHours(23, 59, 59, 999);

                  Feed.find({ is_active: true, "createdAt": { "$gte": startDateFeed, "$lte": endDateFeed } })
                  .sort({ createdAt: -1 })
                  .exec(function (err, admiFeedsResult) {
                      if (err) {
                          callback({
                              success: false,
                              error: true,
                              status: STATUS_CONSTANTS.INTERNAl_DB_ERROR,
                              message: STATUS_MESSAGES.INTERNAl_DB_ERROR,
                              errors: err
                          });
                      } else {
                          admiFeedsResult.forEach((item) => {
                              var newObj = {
                              feed_category: "feed",
                              _id: item._id,
                              video: item.video,
                              audio: item.audio,
                              feed_type: item.feed_type,
                              is_active: item.is_active,
                              date: item.date,
                              name: item.name,
                              link_text: item.link_text,
                              link_url: item.link_url,
                              description: item.description,
                              createdAt: item.createdAt,
                              updatedAt: item.updatedAt,
                              __v: 0
                              };
                              newFeedsData.push(newObj);
                          });
                          callback({
                              "success": true,
                              "message": "Feed list",
                              "response_data": {docs:newFeedsData}
                          });
                      }
                  })
              }
          }
      })
  } else {
      callback({
      "response_code": 5005,
      "response_message": "INTERNAL DB ERROR 7",
      "response_data": {}
      });
  }
},
// Created by @Riman  End 

  getUserFeedById: async (data, callback) => {
    console.log("data", data);
    if (data) {
      pointSchema.find(
        {
          _id: data.point_id
        })
        .populate('user_id')
        .populate('activity_id')
        .exec(function (er, pointLogRes) {
          console.log("pointLogRes", pointLogRes);
          if (er) {
            callback({
              success: false,
              error: true,
              response_code: 5005,
              message: "No Point Log Found",
              response: err
            });
          } else {
            var page = 1,
              limit = 20;

            var data = {
              docs: pointLogRes,
              pages: page,
              total: pointLogRes.length,
              limit: limit,
              page: page
            }
            callback({
              "response_code": 2000,
              "response_message": "User feed list",
              "response_data": data
            });
          }
        })
    } else {
      callback({
        "response_code": 5005,
        "response_message": "INTERNAL DB ERROR",
        "response_data": {}
      });
    }
  },

  // like/dislike feed 
  likeUserFeed_old: async (data, callback) => {
    if (data) {
      pointSchema.findOne(
        {
          _id: data.point_id,
        },
        function (err, resDetails) {
          if (err) {
            callback({
              success: false,
              response_code: 5005,
              message: "INTERNAL DB ERROR",
              response: err
            });
          } else {
            if (resDetails == null) {
              callback({
                success: false,
                response_code: 5002,
                message: "Point not found is not available ",
                response: {}
              });
            } else {
              var user_likes = resDetails.likes;
              const index = user_likes.indexOf(data.user_id);
              console.log("index===>", index);

              if (index == -1) {
                user_likes.push(data.user_id);
              } else {
                user_likes.splice(index, 1)
              }
              pointSchema.updateOne({
                _id: data.point_id
              }, {
                $set: {
                  likes: user_likes
                }
              }, function (err, result) {
                if (err) {
                  callback({
                    success: false,
                    response_code: 5005,
                    message: "INTERNAL DB ERROR",
                    response: err
                  });
                } else {
                  callback({
                    success: true,
                    response_code: 2000,
                    message: "Liked  successfully.",
                  });
                }
              });
              // }
              // else
              // {
              //     callback({
              //         success: true,
              //         response_code: 2000,
              //         message: "User already  blocked in this room successfully.",
              //     });
              // }

            }
          }
        });
    } else {
      callback({
        "response_code": 5005,
        "response_message": "INTERNAL DB ERROR",
        "response_data": {}
      });
    }
  },
  //like and increase the count of each click dublicate user id enter in array now
  likeUserFeed: async (data, callback) => {
    if (data) {
      pointSchema.findOne(
        {
          _id: data.point_id,
        },
        function (err, resDetails) {
          if (err) {
            callback({
              success: false,
              response_code: 5005,
              message: "INTERNAL DB ERROR",
              response: err
            });
          } else {
            if (resDetails == null) {
              callback({
                success: false,
                response_code: 5002,
                message: "Point not found is not available ",
                response: {}
              });
            } else {
              var user_likes = resDetails.likes;

              user_likes.push(data.user_id);

              pointSchema.updateOne({
                _id: data.point_id
              }, {
                $set: {
                  likes: user_likes
                }
              }, function (err, result) {
                if (err) {
                  callback({
                    success: false,
                    response_code: 5005,
                    message: "INTERNAL DB ERROR",
                    response: err
                  });
                } else {
                  callback({
                    success: true,
                    response_code: 2000,
                    message: "Liked  successfully.",
                  });
                }
              });

            }
          }
        });
    } else {
      callback({
        "response_code": 5005,
        "response_message": "INTERNAL DB ERROR",
        "response_data": {}
      });
    }
  },
  feedActiveInactive: (feedid, feeddata, callback) => {
    if (!feedid) {
      callback({ success: false, error: true, message: "Feed id require" });
    } else if (feeddata.is_active == undefined || !(feeddata.is_active == true || feeddata.is_active == 'true' || feeddata.is_active == false || feeddata.is_active == 'false')) {
      callback({ success: false, error: true, message: "Faeed status must be true or false" });
    } else {
      Feed.findById(feedid, function (err, feed) {
        if (err) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
        } else if (!feeddata) {
          callback({ success: false, error: true, message: "invalid feed id", errors: err });
        } else {
          if (feeddata.is_active == false || feeddata.is_active == 'false') {
            feed.is_active = false;
          } else {
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
  getPerformerOfWeek: async (data, callback) => {
    if (data) {
      teamMemberSchema.find(
        {
          member_id: data.user_id,
        }, { member_id: 1, league_id: 1 },
        function (err, resDetails) {
          if (err) {
            callback({
              success: false,
              error: true,
              response_code: 5005,
              message: "INTERNAL DB ERROR",
              response: err
            });
          } else {
            if (resDetails.length > 0) {
              // console.log("resDetails==>",resDetails);
              let team_ids = [];

              resDetails.map(element => {
                team_ids.push(element.league_id)
              })

              // console.log('team_ids',team_ids);
              teamMemberSchema.find(
                {
                  league_id: { '$in': team_ids },
                  // member_id : {'$nin' : data.user_id }
                }, function (err, res) {

                  if (err) {
                    callback({
                      success: false,
                      error: true,
                      response_code: 5005,
                      message: "INTERNAL DB ERROR",
                      response: err
                    });
                  } else {
                    // console.log('res==>',res);
                    let user_ids = [];

                    res.map(element => {
                      user_ids.push(element.member_id)
                    })
                    // console.log('user_ids==>',user_ids);

                    var page = 1,
                      limit = 20,
                      query = {};

                    if (data.page) {
                      page = parseInt(data.page);
                    }
                    if (data.limit) {
                      limit = parseInt(data.limit);
                    }
                    if (user_ids) {
                      query['user_id'] = { '$in': user_ids };
                    }

                    //******************************************************************
                    // get  data of this week , start day of this week[8th march to 14th march ]
                    // Is monday and end day is sunday
                    //*******************************************************************
                    var now = moment();
                    var WeekStartDate = now.clone().weekday(1);
                    WeekStartDate = new Date(WeekStartDate);
                    WeekStartDate.setHours(0, 0, 0, 0);
                    var weekEndDate = now.clone().weekday(7);
                    weekEndDate = new Date(weekEndDate);
                    weekEndDate.setHours(23, 59, 59, 999);

                    // console.log(`now: ${now}`);
                    // console.log(`WeekStartDate: ${WeekStartDate}`);
                    // console.log(`friday: ${weekEndDate}`);

                    query['createdAt'] = { $gte: WeekStartDate, $lt: weekEndDate };
                    //    query['date'] =  { $gte: startDate, $lt: endDate };

                    var aggregate = pointSchema.aggregate();
                    aggregate.match(query);

                    aggregate.lookup({
                      from: 'users',
                      localField: 'user_id',
                      foreignField: '_id',
                      as: 'user_details'
                    });
                    aggregate.unwind({
                      path: "$user_details",
                      preserveNullAndEmptyArrays: true
                    })
                    aggregate.sort({
                      'date': -1
                    })
                    aggregate.project({
                      _id: 1,
                      point: 1,
                      user_id: 1,
                      user_details: {
                        _id: "$user_details._id",
                        prfile_image: "$user_details.image",
                        completeImagePath: { $concat: [PATH_LOCATIONS.user_profile_pic_path_view, "$user_details.image"] },
                        social_login: "$user_details.social_login",
                        first_name: "$user_details.first_name",
                        last_name: "$user_details.last_name"
                      },
                    });
                    var options = {
                      page: page,
                      limit: limit,
                    }

                    pointSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
                      if (err) {
                        callback({
                          "response_code": 5005,
                          "response_message": err,
                          "response_data": {}
                        });

                      } else {



                        //******************************************************************
                        // put user_id with their point in seperate array
                        //*******************************************************************
                        const groups = results.reduce((groups, game) => {
                          if (!groups[game.user_id]) {
                            groups[game.user_id] = [];
                          }
                          groups[game.user_id].push(game);
                          return groups;
                        }, {});

                        // Edit: to add it in the array format instead
                        const groupArrays = Object.keys(groups).map((user_id) => {
                          return {
                            user_id,
                            userPoints: groups[user_id]
                          };
                        });

                        groupArrays.map(element => {
                          let sum = 0;
                          element.userPoints.map(element2 => {
                            console.log('element2', element2);
                            sum = sum + element2.point;
                          });

                          element.sumOfPoints = sum;
                        })
                        console.log('groupArrays', groupArrays);


                        // console.log('results \n',results);
                        // console.log('groupArrays \n',groupArrays);

                        var user_ids = [];
                        groupArrays.map(ele => {
                          if (ele.sumOfPoints >= 150) {
                            console.log('element4', ele);
                            user_ids.push(ele);
                          }
                        });
                        // console.log('user_ids',user_ids);

                        // var data = {
                        //     docs: results,
                        //     pages: pageCount,
                        //     total: count,
                        //     limit: limit,
                        //     page: page
                        // }
                        callback({
                          "response_code": 2000,
                          "response_message": "Top Performer of the week list",
                          "response_data": user_ids
                        });
                      }
                    });
                  }
                })
            } else {
              callback({
                success: true,
                response_code: 2000,
                error: false,
                message: "No data found because You have not join any team till now",
                response: resDetails
              });
            }
          }
        });
    } else {
      callback({
        "response_code": 5005,
        "response_message": "INTERNAL DB ERROR",
        "response_data": {}
      });
    }

  },
  //@Rakesh Vishwakarma: Comment is added 2 times even in a single API request
  addCommentOnFeed: async (data, callback) => {
    console.log("======================Data==============" + JSON.stringify(data));

    if (!data.point_id || typeof data.point_id === undefined) {
      callback({
        "response_code": 5002,
        "response_message": "please provide point Id",
        "response_data": {},
        'success': false,
        'error': true,
      });
    } else if (!data.commenter_id || typeof data.commenter_id === undefined) {
      callback({
        "response_code": 5002,
        "response_message": "please provide commenter user Id",
        "response_data": {},
        'success': false,
        'error': true,
      });
    } else if (!data.comment || typeof data.comment === undefined) {
      callback({
        "response_code": 5002,
        "response_message": "please provide comment",
        "response_data": {},
        'success': false,
        'error': true,
      });

    } else {

      let commenterDetails = await userSchema.findOne({ _id: data.commenter_id });

      if (commenterDetails == null) {
        callback({
          "response_code": 5002,
          "response_message": "User not found",
          "response_data": {},
          'success': false,
          'error': true,
        });
      }

      var profileImage = '';
      if (commenterDetails.image) {
        profileImage = PATH_LOCATIONS.user_profile_pic_path_view + commenterDetails.image;
      }

      let commentData = {
        _id: new ObjectID,
        commenter_id: data.commenter_id,
        date: new Date(),
        comment: data.comment,
        commenterName: commenterDetails.first_name + ' ' + commenterDetails.last_name,
        commenterProfile: profileImage,
        social_login: commenterDetails.social_login
      }

      await pointSchema.updateOne(
        { _id: data.point_id },
        {
          $push: {
            "comments": commentData
          }
        }
      ).exec(err => {
        if (err) {
          callback({
            success: false,
            error: true,
            response_code: 5005,
            message: "INTERNAL DB ERROR",
            response: err
          });
        }
      })

      callback({
        success: true,
        error: false,
        response_code: 2000,
        message: "Comment added successfully.",
      })

      // TASK 1: Here, point_id is unique id of this post/point and commenter_id is the unique id for user who comments on that post. Need to send a notification to the point.user_id with the name of commenter  

      // Gettting the user_id of the relavent author of the post/point
      const pointAuthor = await pointSchema.findOne({
        _id: data.point_id
      }, { user_id: 1, });

      // Getting the appType and devicetoken of the relavent author of the point/post
      const userAuthor = await userSchema.findOne({
        _id: pointAuthor.user_id
      }, { devicetoken: 1, apptype: 1, image: 1 });

      // Assiging the value of the user to send push notification

      var pushData = {
        deviceId: userAuthor.devicetoken,
        user_id: userAuthor._id,
        point_id: data.point_id,
        title: "Got a comment",
        type: "added_comment",
        message: `${commentData.commenterName} has commented on your activities – take a look.`,
        // profile_image: PATH_LOCATIONS.user_profile_pic_path_view + userAuthor.image,            srijan 27/1/2022
        profile_image: profileImage,
        // Added a new paramater for sending point_id and comment_id to navigate to the correct comment.
        result: {
          point_id: data.point_id,
          comment_id: commentData._id
        }
      }
      console.log("=========================pushData================================", pushData);
      if (pointAuthor.user_id !== commentData.commenter_id) {
        // Send Notification as per app type.
        if (userAuthor.apptype == 'IOS' && userAuthor.apptype != '' && userAuthor.apptype != 'undefined' && userAuthor.apptype != null) {

          pushNotification.iosPushNotificationUser(pushData, function (pushStatus) {
            console.log('pushStatus', pushStatus);
          });

        } else if (userAuthor.apptype = 'ANDROID' && userAuthor.apptype != '' && userAuthor.apptype != 'undefined' && userAuthor.apptype != null) {

          pushNotification.androidPushNotification(pushData, function (pushStatus) {
            console.log('pushStatus', pushStatus);
          });
        }

      }




    }
  },
  editCommentOnFeed: async (data, callback) => {

    if (!data.comment_id || typeof data.comment_id === undefined) {
      callback({
        "response_code": 5002,
        "response_message": "please provide comment id",
        "response_data": {},
        'success': false,
        'error': true,
      });

    } else if (!data.comment || typeof data.comment === undefined) {
      callback({
        "response_code": 5002,
        "response_message": "please provide comment",
        "response_data": {},
        'success': false,
        'error': true,
      });

    } else {

      pointSchema.updateOne({ 'comments._id': data.comment_id },
        {
          '$set': {
            'comments.$.comment': data.comment,
          }
        },
        function (err, model) {
          if (err) {
            callback({
              success: false,
              error: true,
              response_code: 5005,
              message: "INTERNAL DB ERROR",
              response: err
            });
          } else {
            callback({
              success: true,
              error: false,
              response_code: 2000,
              message: "Comment updated successfully.",
            })
          }
        });

    }
  },
  deletCommentOnFeed: async (data, callback) => {

    if (!data.point_id || typeof data.point_id === undefined) {
      callback({
        "response_code": 5002,
        "response_message": "please provide point Id",
        "response_data": {},
        'success': false,
        'error': true,
      });
    } else if (!data.comment_id || typeof data.comment_id === undefined) {
      callback({
        "response_code": 5002,
        "response_message": "please provide comment id",
        "response_data": {},
        'success': false,
        'error': true,
      });

    } else {

      pointSchema.findByIdAndUpdate(
        data.point_id,
        { $pull: { 'comments': { _id: data.comment_id } } }, function (err, model) {
          console.log('err', err);
          console.log('model', model);

          if (err) {
            callback({
              success: false,
              error: true,
              response_code: 5005,
              message: "INTERNAL DB ERROR",
              response: err
            });
          } else {
            callback({
              success: true,
              error: false,
              response_code: 2000,
              message: "Comment deleted successfully.",
            })
          }
        });

    }
  },


};
module.exports = FeedService;
