var League = require('../models/league');
var LeagueMember = require('../models/league_member');
var pushNotification = require('../modules/pushNotification');
var User = require('../models/user');
//var Activity = require('../models/activity');
var mongo = require('mongodb');
var moment = require('moment');
var async = require("async");
var fs = require('fs');
var mailProperty = require("../modules/sendMail");

//const { query } = require('express');
var ObjectID = mongo.ObjectID;
const { STATUS_CONSTANTS, STATUS_MESSAGES, URL_PATHS, PATH_LOCATIONS, CONSTANTS } = require('../utils/constant');
//const UserService = require('./userService');


function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000);
}
function generateString(length) {
console.log(length);
  let result = '';
  let characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  let charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

var LeagueService = {

  // leagueAddEdit: (creator_id, req_data, callback) => {
  //     var generateUniqueNum = generateString(4);

  //     if(!creator_id){
  //         callback({ success: false, error: true, message: "Token invalid" });
  //     }else if(!req_data.league_name){
  //         callback({ success: false, error: true, message: "Team name require" });
  //     }else{
  //         var search_query = {};
  //         if(req_data.league_id){ 
  //             search_query = { $or: [ { _id: req_data.league_id}, { league_name : { $regex: '^'+req_data.league_name+'$', $options: "$i" } }] };    
  //         }else{
  //             search_query = { league_name : { $regex: '^'+req_data.league_name+'$', $options: "$i" } };
  //         }
  //         League.find(search_query).exec(function(leagueerr, match_league){
  //             if (leagueerr) {
  //                 callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: leagueerr });
  //             } 
  //             // else if(!req_data.league_id && match_league.length > 0)
  //             // {
  //             //     callback({ success: false, error: true, message: "League name match with other league name" });
  //             // }
  //              else if(req_data.league_id && match_league.length == 0){
  //                 callback({ success: false, error: true, message: "Team id not found" });
  //             } 
  //             // else if(req_data.league_id && ( match_league.length > 1 || req_data.league_id != match_league[0]._id))
  //             // {
  //             //     callback({ success: false, error: true, message: "League name match with other league name" });
  //             // }
  //              else if(req_data.league_id  && creator_id != match_league[0].creator_id){
  //                 callback({ success: false, error: true, message: "Team is not created by this user" });
  //             } else{
  //                 var league_id = '';
  //                 if(req_data.league_id){ league_id = req_data.league_id; }else{ league_id = new ObjectID; }
  //                 League.update({ _id: league_id }, { $set: {league_name : req_data.league_name}, $setOnInsert: { _id: league_id, creator_id: creator_id, unique_team_code: generateUniqueNum }}, { upsert: true }).exec(function (err, result) {
  //                     if (err) {
  //                         callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
  //                     } else if(result.ok == 1 && result.nModified == 0){
  //                         var league_member_data = new LeagueMember({
  //                             _id: new ObjectID,
  //                             league_id: league_id,
  //                             member_id: creator_id
  //                         })
  //                         league_member_data.save();
  //                         callback({ success: true, error: false, message: "Team added successfully" });
  //                     } else if(result.ok == 1 && result.nModified == 1){
  //                         callback({ success: true, error: false, message: "Team updated successfully" });
  //                     }
  //                 });
  //             }
  //         })
  //     }
  // },

  // leagueAdd: async (fileData, req_data, callback) => {

  // },

  leagueAddEdit: async (fileData, creator_id, req_data, callback) => {
    // console.log("creator_id_Rim", creator_id);
    // console.log("file_data_rim", fileData);
    // console.log("req_data_rim", req_data);
    // var creator_id = req_data.creator_id;
    var userDetails = await User.findOne({ "_id": creator_id }).exec();
    // console.log("User", userDetails);
    var generateUniqueNum = generateString(4);

    if (!creator_id || typeof creator_id === undefined) {
      callback({
        "response_code": 5002,
        "message": "Please select member",
        "response_data": {}
      });
    } else if (!req_data.league_name || typeof req_data.league_name === undefined) {
      callback({
        "response_code": 5002,
        "message": "please provide team name",
        "response_data": {}
      });
    } else {
      //********If league_id presence go for update data if not go for add data *************** */
      if (!req_data.league_id || req_data.league_id === undefined) {
        //*********************** */
        // To add a new team  code here
        //*********************** */

        if (!fileData || typeof fileData === undefined) {
          //************dont have file data or image execute this code*********** */
          let data = {};
          data._id = new ObjectID;
          data.league_name = req_data.league_name;
          data.creator_id = creator_id;
          data.unique_team_code = generateUniqueNum;

          await new League(data).save(function (err, result) {
            if (err) {
              callback({
                "response_code": 5005,
                "message": "INTERNAL DB ERROR",
                "response_data": { 'error': err },
                "success": false,
                "error": true,
              });
            } else {
              var league_member_data = new LeagueMember({
                _id: new ObjectID,
                league_id: data._id,
                member_id: creator_id,
              })

              league_member_data.save();

              // ==================  send push notification to the user who created the team ===========//
              var pushData = {
                deviceId: userDetails.devicetoken,
                user_id: userDetails._id,
                league_id: data._id,
                unique_team_code: data.unique_team_code,
                title: "Team created successfully",
                message: 'Well done creating a new team! Now go ahead and invite some people by sharing your team code',
                profile_image: PATH_LOCATIONS.user_profile_pic_path_view + userDetails.image
                // profile_image: config.liveUrl+'uploads/email_template/logo.png'
              }

              // if (userDetails.apptype == 'IOS' && userDetails.apptype != '' && userDetails.apptype != 'undefined' && userDetails.apptype != null) {
              //   pushNotification.iosPushNotificationUser(pushData, function (pushStatus) {
              //     console.log('pushStatus', pushStatus);
              //   });
              // } else if (userDetails.apptype = 'ANDROID' && userDetails.apptype != '' && userDetails.apptype != 'undefined' && userDetails.apptype != null) {
              //   pushNotification.androidPushNotification(pushData, function (pushStatus) {
              //     console.log('pushStatus', pushStatus);
              //   });
              // }
              // sending email to the members (create-team-mail.js)
              // @Riman 02.02.2022 
              // mailProperty('create-team-mail')(userDetails.email, {
              //   name: userDetails.first_name,
              //   email: userDetails.email
              // }).send();

              callback({
                "response_code": 2000,
                "message": "Team added successfully",
                "response_data": null,
                "success": true,
                "error": false,
                
              });
            }
          });
        } else {
          console.log("filedata", fileData);
          //************ haveing  file data or image execute this code*********** */

          var imageFile = fileData.image;
          var timeStamp = Date.now();
          var fileName = timeStamp + imageFile.name;
          var folderpath = PATH_LOCATIONS.team_image_path;
          let split = imageFile
            .mimetype
            .split("/");

          if (split[1] = "jpeg" || "png" || "jpg") {
            imageFile.mv(
              folderpath + fileName,
              function (err) {
                if (err) {
                  callback({
                    "response_code": 5005,
                    "message": "INTERNAL DB ERROR",
                    "response_data": err,
                    "success": false,
                    "error": true,
                  });
                } else {

                  req_data.image = fileName;

                  let data = {};
                  data._id = new ObjectID;
                  data.league_name = req_data.league_name;
                  data.creator_id = creator_id;
                  data.unique_team_code = generateUniqueNum;
                  data.image = PATH_LOCATIONS.team_image_path_view + req_data.image,

                    new League(data).save(function (err, result) {
                      if (err) {
                        callback({
                          "response_code": 5005,
                          "message": "INTERNAL DB ERROR",
                          "response_data": { 'error': err },
                          "success": false,
                          "error": true,
                        });
                      } else {
                        var league_member_data = new LeagueMember({
                          _id: new ObjectID,
                          league_id: data._id,
                          member_id: creator_id,
                        })
                        league_member_data.save();

                        // ==================  send push notification to the user who created the team ===========//
                        var pushData = {
                          deviceId: userDetails.devicetoken,
                          user_id: userDetails._id,
                          league_id: data._id,
                          unique_team_code: data.unique_team_code,
                          title: "Team created successfully",
                          message: 'Well done creating a new team! Now go ahead and invite some people by sharing your team code',
                          profile_image: PATH_LOCATIONS.user_profile_pic_path_view + userDetails.image
                          // profile_image: config.liveUrl+'uploads/email_template/logo.png'
                        }

                        console.log('pushData', pushData);

                        // if (userDetails.apptype == 'IOS' && userDetails.apptype != '' && userDetails.apptype != 'undefined' && userDetails.apptype != null) {
                        //   pushNotification.iosPushNotificationUser(pushData, function (pushStatus) {
                        //     console.log('pushStatus', pushStatus);
                        //   });
                        // } else if (userDetails.apptype = 'ANDROID' && userDetails.apptype != '' && userDetails.apptype != 'undefined' && userDetails.apptype != null) {
                        //   pushNotification.androidPushNotification(pushData, function (pushStatus) {
                        //     console.log('pushStatus', pushStatus);
                        //   });
                        // }
                        //======================================================================================//

                        callback({
                          "response_code": 2000,
                          "message": "Team added successfully",
                          "success": true,
                          "error": false,
                          "response_data": PATH_LOCATIONS.team_image_path_view + req_data.image
                        });
                      }
                    });

                }
              }
            )
          } else {
            callback({
              status: 5002,
              message: "MIME type not allowed please upload jpg or png file"
            })
          }
        }

      } else {

        //*********************** */
        // To update a existing team ,code here  
        //*********************** */

        if (!fileData || typeof fileData === undefined) {
          //***********Update without filedata************ */

          League.findOne({
            _id: req_data.league_id,
            creator_id: creator_id
          }, {
            _id: 1,
            league_name: 1,
            creator_id: 1,
          },
            async function (err, result) {
              console.log("res", result);
              console.log("err", err);

              if (err) {
                callback({
                  "response_code": 5005,
                  "message": "INTERNAL DB ERROR",
                  "response_data": { 'error': err },
                  "success": false,
                  "error": true,
                });
              } else {
                if (result != null) {
                  League.updateOne({
                    _id: req_data.league_id
                  }, {
                    $set: {
                      league_name: req_data.league_name,
                    }
                  }, function (error, resUpdate) {
                    if (error) {
                      callback({
                        "response_code": 5005,
                        "message": "INTERNAL DB ERROR",
                        "error": error,
                        "success": false,
                        "error": true,
                      });
                    } else {
                      callback({
                        "response_code": 2000,
                        "message": "Team updated successfully.",
                        "success": true,
                        "error": false,
                        "response_data": null,
                      });
                    }
                  });
                } else {
                  callback({
                    "response_code": 2008,
                    "message": "Team not create by this user",
                    "success": false,
                    "error": true,
                  });
                }
              }
            });

        } else {
          //***********Update with filedata************ */
          console.log("filedata available ", fileData);

          function removePreviousImage() {
            var imageFile = fileData.image;
            var timeStamp = Date.now();
            var fileName = timeStamp + imageFile.name;
            var folderpath = PATH_LOCATIONS.team_image_path;
            let split = imageFile
              .mimetype
              .split("/");

            if (split[1] = "jpeg" || "png" || "jpg") {
              imageFile.mv(
                folderpath + fileName,
                function (err) {
                  if (err) {
                    callback({
                      "response_code": 5005,
                      "response_message": "INTERNAL DB ERROR",
                      "response_data": err,
                      "success": false,
                      "error": true,
                    });
                  } else {

                    League.findOne({
                      _id: req_data.league_id,
                      creator_id: creator_id
                    }, {
                      image: 1
                    },
                      function (err, result) {
                        console.log("result---->", result);

                        if (result != null) {
                          if (result.image !== null) {

                            let pf_image = `./public/uploads/team_image/${result.image}`;
                            fs.unlink(pf_image, (err) => {
                              if (err) {
                                console.log('error while image delete===>', err);
                              } else {
                                console.log(result.image + ' was deleted');
                              }
                            });
                          }
                        }

                      });

                    req_data.image = fileName;
                    updateProfileImage(req_data);
                  }
                }
              )
            } else {
              callback({
                status: 5002,
                message: "MIME type not allowed please upload jpg or png file"
              })
            }

          };
          function updateProfileImage(fileName) {
            console.log("fileName---->", fileName);

            League.findOne({
              _id: req_data.league_id,
              creator_id: creator_id
            }, {
              _id: 1,
              league_name: 1,
              creator_id: 1,
            },
              async function (err, result) {
                console.log("res", result);
                console.log("err", err);

                if (err) {
                  callback({
                    "response_code": 5005,
                    "message": "INTERNAL DB ERROR",
                    "response_data": { 'error': err },
                    "success": false,
                    "error": true,
                  });
                } else {
                  if (result != null) {
                    League.updateOne({
                      _id: req_data.league_id
                    }, {
                      $set: {
                        league_name: req_data.league_name,
                        image: PATH_LOCATIONS.team_image_path_view + fileName.image,


                      }
                    }, function (error, resUpdate) {
                      if (error) {
                        callback({
                          "response_code": 5005,
                          "message": "INTERNAL DB ERROR",
                          "error": error,
                          "success": false,
                          "error": true,
                        });
                      } else {
                        callback({
                          "response_code": 2000,
                          "message": "Team updated successfully.",
                          "response_data": PATH_LOCATIONS.team_image_path_view + fileName.image,
                          "success": true,
                          "error": false,
                        });
                      }
                    });
                  } else {
                    callback({
                      "response_code": 2008,
                      "message": "Team not create by this user",
                      "success": false,
                      "error": true,
                    });
                  }
                }
              });

          };
          async function callmethods() {
            await removePreviousImage();
          }
          callmethods();
        }

      }
    }
  },
  getUniqueTeamCode: async function (data, callback) {
    let teamDetails = await League.findOne({
      _id: data.league_id
    }, { league_name: 1, unique_team_code: 1, _id: 1 }, function (err, result) {
      if (err) {
        callback({
          "response_code": 5005,
          "message": err,
          "response": {},
          'success': false,
          'error': true,
        });
      } else {
        callback({
          'success': true,
          "response_code": 2000,
          'error': false,
          'message': "Your unique team id ",
          'response': result
        });
      }
    });
  },
  addMemberByUniqueTeamCode: async function (data, callback) {

    if (data) {
      let teamDetails = await League.findOne({
        unique_team_code: data.unique_team_code
      }, function (err, result) {
        if (err) {
          callback({
            "response_code": 5005,
            "message": err,
            'success': false,
            'error': true,
            "response": {}
          });
        }
      });


      if (teamDetails === null) {
        callback({
          "response_code": 5002,
          "message": "Code is not valid.",
          "response": {},
          'success': false,
          'error': true,
        });
      } else {

        //======= get User info who created this team by creator id================================//

        let teamCreatorDetails = await User.findOne({
          _id: teamDetails.creator_id
        }, function (err, result) {
          if (err) {
            callback({
              "response_code": 5005,
              "message": err,
              'success': false,
              'error': true,
              "response": {}
            });
          }
        });

        //======= get user details who joining the team (new member ) ================================//

        let newMemberDetails = await User.findOne({
          _id: data.member_id
        }, function (err, result) {
          if (err) {
            callback({
              "response_code": 5005,
              "message": err,
              'success': false,
              'error': true,
              "response": {}
            });
          }
        });

        // console.log('teamCreatorDetails \n ',teamCreatorDetails);
        // console.log('newMemberDetails \n ',newMemberDetails);

        let teamMemberDetails = await LeagueMember.findOne({
          league_id: teamDetails._id,
          member_id: data.member_id
        }, function (err2, result) {
          if (err2) {
            callback({
              "response_code": 5005,
              "message": err2,
              "response_data": {},
              'success': false,
              'error': true,
            });
          }
        });
        // console.log('teamMemberDetails',teamMemberDetails);

        if (teamMemberDetails === null) {
          obj = {
            _id: new ObjectID,
            league_id: teamDetails._id,
            member_id: data.member_id,
          }
          new LeagueMember(obj).save(function (err3, result) {
            if (err3) {
              callback({
                "response_code": 5005,
                "message": err3,
                'success': false,
                'error': true,
                "response_data": {}
              });
            } else {

              // ==================  send push notification to the user who created the team ===========//
              var pushData = {
                deviceId: teamCreatorDetails.devicetoken,
                user_id: teamCreatorDetails._id,
                league_id: teamDetails._id,
                title: "New member joined your team",
                message: `${newMemberDetails.first_name} ${newMemberDetails.last_name} has accepted your invitation to be in the ${teamDetails.league_name} Team`,
                profile_image: PATH_LOCATIONS.user_profile_pic_path_view + teamCreatorDetails.image
                // profile_image: config.liveUrl+'uploads/email_template/logo.png'
              }

              console.log('pushData', pushData);

              if (teamCreatorDetails.apptype == 'IOS' && teamCreatorDetails.apptype != '' && teamCreatorDetails.apptype != 'undefined' && teamCreatorDetails.apptype != null) {
                pushNotification.iosPushNotificationUser(pushData, function (pushStatus) {
                  console.log('pushStatus', pushStatus);
                });
              } else if (teamCreatorDetails.apptype = 'ANDROID' && teamCreatorDetails.apptype != '' && teamCreatorDetails.apptype != 'undefined' && teamCreatorDetails.apptype != null) {
                pushNotification.androidPushNotification(pushData, function (pushStatus) {
                  console.log('pushStatus', pushStatus);
                });
              }
              //======================================================================================//
              callback({
                "response_code": 2000,
                "message": "Team joined successfully.",
                'success': true,
                'error': false,
              });
            }
          });
        } else {
          callback({
            "response_code": 5002,
            "message": "You have already joined in this team try different team code.",
            "response_data": {},
            'success': false,
            'error': true,
          });
        }

      }

    } else {
      callback({
        "response_code": 5005,
        "message": "INTERNAL DB ERROR",
        "response_data": {},
        'success': false,
        'error': true,
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
  addMember: (creator_id, req_data, callback) => {
    if (!creator_id) {
      callback({ success: false, error: true, message: "Token invalid" });
    } else if (!req_data.user_id) {
      callback({ success: false, error: true, message: "User id require" });
    } else if (!req_data.league_id) {
      callback({ success: false, error: true, message: "Team id require" });
    } else {
      League.findOne({ _id: req_data.league_id }).exec(function (err, league_data) {
        if (err) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
        } else if (!league_data) {
          callback({ success: false, error: true, message: "Team not found" });
        } else if (league_data.creator_id != creator_id) {
          callback({ success: false, error: true, message: "Team is not created by this user" });
        } else {
          LeagueMember.find({ league_id: req_data.league_id, member_id: req_data.user_id }).exec(function (err, leage_data) {
            if (err) {
              callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            } else if (leage_data.length > 0) {
              callback({ success: false, error: true, message: "Member already added in this team" });
            } else {
              var league_member_data = new LeagueMember({
                _id: new ObjectID,
                league_id: req_data.league_id,
                member_id: req_data.user_id
              })
              league_member_data.save(function (err) {
                if (err) {
                  callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
                } else {
                  callback({ success: true, error: false, message: "Member added successfully" });
                }
              });
            }
          })
        }
      })
    }
  },
  deleteLeague: (creator_id, league_id, callback) => {
    if (!creator_id) {
      callback({ success: false, error: true, message: "Token invalid" });
    } else if (!league_id) {
      callback({ success: false, error: true, message: "Team id require" });
    } else {
      League.findOne({ _id: league_id }, function (err, league_data) {
        if (err) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
        }
        else if (!league_data) {
          callback({ success: false, error: true, message: "Team not found" });
        }
        else if (league_data.creator_id != creator_id) {
          callback({ success: false, error: true, message: "Team is not created by this user" });
        } else {
          League.deleteOne({ _id: league_id }, function (err) {
            if (err) {
              callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            } else {
              LeagueMember.deleteMany({ league_id: league_id }, function (merr, mres) { });
              callback({ success: true, error: false, message: "Team deleted" });
            }
          });
        }
      });
    }
  },
  deleteMember: (creator_id, req_data, callback) => {
    if (!creator_id) {
      callback({ success: false, error: true, message: "Token invalid" });
    } else if (!req_data.league_id) {
      callback({ success: false, error: true, message: "Team id require" });
    } else if (!req_data.member_id) {
      callback({ success: false, error: true, message: "Member id require" });
    } else {
      League.findOne({ _id: req_data.league_id }, function (err, league_data) {
        if (err) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
        }
        else if (!league_data) {
          callback({ success: false, error: true, message: "Team not found" });
        }
        else if (league_data.creator_id != creator_id) {
          callback({ success: false, error: true, message: "Team is not created by this user" });
        } else {
          LeagueMember.deleteOne({ league_id: req_data.league_id, member_id: req_data.member_id }, function (err, result) {
            if (err) {
              callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            } else if (result.deletedCount > 0) {
              callback({ success: true, error: false, message: "Member removed from this Team" });
            } else {
              callback({ success: false, error: true, message: "Member is not exists in this Team" });
            }
          });
        }
      });
    }
  },

  leagueList: (user_id, params, callback) => {    //pinki1
    if (!user_id) {
      callback({ success: false, error: true, message: "Token invalid" });
    } else {
      //var query = {};
      var page = null;
      var limit = null;
      var sortBy = { 'createdAt': -1 };
      if (params.page && !params.limit) {
        page = parseInt(params.page);
        limit = CONSTANTS.record_per_page;
      }
      if (params.page && params.limit) {
        page = parseInt(params.page);
        limit = parseInt(params.limit);
      }
      var memberAggregate = LeagueMember.aggregate();
      memberAggregate.match({ member_id: user_id });
      memberAggregate.lookup({
        from: 'leagues',
        localField: 'league_id',
        foreignField: '_id',
        as: 'league'
      })
      memberAggregate.unwind('league');

      memberAggregate.lookup({
        from: 'users',
        localField: 'league.creator_id',
        foreignField: '_id',
        as: 'userDetails'
      })
      memberAggregate.unwind({
        path: "$userDetails",
        preserveNullAndEmptyArrays: true
      });

      if (params.creator_id) {
        memberAggregate.match({ 'league.creator_id': params.creator_id });
      }
      if (params.league_name) {
        memberAggregate.match({ 'league.league_name': params.league_name });
      }

    }
    var league_list_response = {};

    async.waterfall([
      function (nextcb) {
        if (limit) {
          var options = { page: page, limit: limit, sortBy: sortBy };
          LeagueMember.aggregatePaginate(memberAggregate, options, function (err, league_list, pageCount, count) {
            if (err) {
              nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            }
            else {
              var res_data = {
                docs: league_list,
                pages: pageCount,
                total: count,
                limit: limit,
                page: page,
              }

              league_list_response = res_data;
              nextcb(null);
            }
          });
        } else {
          memberAggregate.sort(sortBy);
          memberAggregate.exec(function (err, league_list) {
            if (err) {
              nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            }
            else {
              var count = league_list.length;
              var res_data = {
                docs: league_list,
                total: count,
                limit: count,
                offset: 0,
                page: 1,
                pages: 1,

              }

              league_list_response = res_data;
              nextcb(null);
            }
          });
        }
      },
      function (nextcb) {

        if (league_list_response.docs.length > 0) {

          //******************************************************************
          // get  data of this week , start day of this week[8th march to 14th march ]
          // Is monday and end day is sunday
          //*******************************************************************
          
          // ================== Riman 03.02.2022 ==========================//
          // var now = moment();
          // var today_day = 0;  
          // //var today_day = now.clone().day();  
          // console.log('today=>',today_day);
          // var WeekStartDate = now.clone().weekday(1);
          // WeekStartDate = new Date(WeekStartDate);
          // WeekStartDate.setHours(00, 01, 01, 000);
          // var weekEndDate = now.clone().weekday(7);
          // weekEndDate = new Date(weekEndDate);
          // weekEndDate.setHours(23, 59, 59, 999);

          // console.log(`now: ${now}`);
          // console.log(`WeekStartDate: ${WeekStartDate}`);
          // console.log(`friday: ${weekEndDate}`);

          // ================== Riman 03.02.2022 ==========================//
          var now = moment();
          var WeekStartDate = now.clone().weekday(1);
          WeekStartDate = new Date(WeekStartDate);
          WeekStartDate.setHours(0, 0, 0, 0);
          var weekEndDate = now.clone().weekday(7);
          weekEndDate = new Date(weekEndDate);
          weekEndDate.setHours(23, 59, 59, 999);

          var counter = 0;
          league_list_response.docs.map((value, key) => {

            var leagueAggregate = LeagueMember.aggregate();
            leagueAggregate.match({ league_id: value.league_id });
            leagueAggregate.lookup({
              from: 'points',
              localField: 'member_id',
              foreignField: 'user_id',
              as: 'point'
            })
            leagueAggregate.unwind('point');
            leagueAggregate.lookup({
              from: 'users',
              localField: 'member_id',
              foreignField: '_id',
              as: 'user'
            })
            leagueAggregate.unwind('user');
            leagueAggregate.match({ 'point.date': { "$gte": WeekStartDate } });
            leagueAggregate.match({ 'point.date': { "$lte": weekEndDate } });
            //leagueAggregate.match({ today_day: { "$ne": 0 } });
            leagueAggregate.match({ 'user.status': 1 });


            //point: { $cond: { if: { "$and": [{ "$gte": ['$point.date', WeekStartDate] }, { "$lte": ['$point.date', weekEndDate] }, { "$ne": [today_day,0] }] }, then: "$point", else: 0 } }

            leagueAggregate.group({
              _id: "$member_id",
              total_point: { $sum: "$point.point" },

            })

            leagueAggregate.sort({ "total_point": -1 });
            leagueAggregate.limit(1);

            leagueAggregate.exec(function (err, point_result) {

              if (err) {
                nextcb({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
              } else if (point_result.length > 0) {

                User.findOne({ _id: point_result[0]._id }).exec(function (err, user_details) {

                  var profile_image = '';
                  if (user_details.image) {
                    profile_image = PATH_LOCATIONS.user_profile_pic_path_view + user_details.image;
                  } else if (user_details.type == 'FACEBOOK') {
                    profile_image = user_details.social_login.facebook.image;
                  } else if (user_details.type == 'GOOGLE') {
                    profile_image = user_details.social_login.google.image;
                  } else if (user_details.type == 'APPLE') {
                    profile_image = user_details.social_login.apple.image;
                  }
                  value.winner = {
                    user_id: user_details._id,
                    name: user_details.first_name + ' ' + user_details.last_name,
                    image: profile_image,
                    point: point_result[0].total_point
                  }

                  counter = counter + 1;

                  if (counter == (league_list_response.docs.length)) {
                    nextcb(null, { success: true, error: false, message: "Team list found", data: league_list_response });
                  }
                })

              } else {
                counter = counter + 1;
                value.winner = {};
                if (counter == (league_list_response.docs.length)) {
                  nextcb(null, { success: true, error: false, message: "Team list found", data: league_list_response });
                }
              }
            })
          })

        } else {
          nextcb(null, { success: true, error: false, message: "You have not added with any Team", data: league_list_response });
        }
      }],
      function (err, response) {
        if (err) {
          callback(err);
        } else {
          callback(response);
        }
      });


  },

  leagueMemberList: (user_id, params, callback) => {    //pinki2
    if (!params.league_id) {
      callback({ success: false, error: true, message: "League id require" });
    }
    // else if (!params.weekStartDate) {
    //   callback({ success: false, error: true, message: "week start date require" });
    // }
    // else if (!params.weekEndDate) {
    //   callback({ success: false, error: true, message: "week end date require" });
    // }
     else {
      League.findOne({ '_id': params.league_id }).exec(function (err, league_details) {
        if (err) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
        } else if (!league_details) {
          callback({ success: false, error: true, message: "Team not found" });
        } else {
          var page = null;
          var limit = null;
          var sortBy = { 'createdAt': -1 };

          //******************************************************************
          // get  data of this week , start day of this week[8th march to 14th march ]
          // Is monday and end day is sunday
          //*******************************************************************
        //   var now = moment();
        //   //var today_day = 0;  
        //   var today_day = now.clone().day();  
        //   console.log('today=>',today_day);
        //   var WeekStartDate = now.clone().weekday(1);  
        //  // var WeekStartDate = params.weekStartDate; 
        //   WeekStartDate = new Date(WeekStartDate);    console.log('WeekStartDate=>',WeekStartDate);
        //   WeekStartDate.setHours(0, 0, 0, 0);

        //   var weekEndDate = now.clone().weekday(7);
        //   //var weekEndDate = params.weekEndDate;
        //   weekEndDate = new Date(weekEndDate);        console.log('weekEndDate=>',weekEndDate);
        //   weekEndDate.setHours(23, 59, 59, 999);

          // console.log(`now: ${now}`);
          // console.log(`WeekStartDate: ${WeekStartDate}`);
          // console.log(`friday: ${weekEndDate}`);

          var now = moment();
          var WeekStartDate = params.weekStartDate;
          WeekStartDate = new Date(WeekStartDate);
          WeekStartDate.setHours(0, 0, 0, 0);
          var weekEndDate = params.weekEndDate;
          weekEndDate = new Date(weekEndDate);
          weekEndDate.setHours(23, 59, 59, 999);

          console.log(`now: ${now}`);
          console.log(`WeekStartDate: ${WeekStartDate}`);
          console.log(`End Date: ${weekEndDate}`);

          if (params.page && !params.limit) {
            page = parseInt(params.page);
            limit = CONSTANTS.record_per_page;
          }
          if (params.page && params.limit) {
            page = parseInt(params.page);
            limit = parseInt(params.limit);
          }
          var memberAggregate = LeagueMember.aggregate();
          memberAggregate.match({ league_id: params.league_id });
          memberAggregate.lookup({
            from: 'points',
            localField: 'member_id',
            foreignField: 'user_id',
            as: 'point'
          })
          memberAggregate.unwind({
            path: '$point',
            preserveNullAndEmptyArrays: true
          });
          memberAggregate.project({
            member_id: "$member_id",
            joining_date: "$createdAt",
            // point: { $cond: { if: { "$and": [{ "$gte": ['$point.date', WeekStartDate] }, { "$lte": ['$point.date', weekEndDate] }, { "$ne": [today_day,0] }] }, then: "$point", else: 0 } }
            point: { $cond: { if: { "$and": [{ "$gte": ['$point.date', WeekStartDate] }, { "$lte": ['$point.date', weekEndDate] }] }, then: "$point", else: 0 } }
          });
          
          memberAggregate.group({
            _id: { member_id: "$member_id", joining_date: "$joining_date" },
            total_point: { $sum: "$point.point" }
            //total_point:{$sum: { $ifNull: [ "$point.point", 'No points' ] } }
          })
          memberAggregate.sort({ "total_point": -1 });
          memberAggregate.lookup({
            from: 'users',
            localField: '_id.member_id',
            foreignField: '_id',
            as: 'user'
          })
          memberAggregate.unwind('user');
          memberAggregate.match({ 'user.status': 1 });
          memberAggregate.project({
            member_id: "$user._id",
            total_point: "$total_point",
            name: { $concat: ["$user.first_name", " ", "$user.last_name"] },
            joining_date: '$_id.joining_date'
          });
          if (limit) {
            var options = { page: page, limit: limit, sortBy: sortBy };
            LeagueMember.aggregatePaginate(memberAggregate, options, function (err, league_list, pageCount, count) {
              if (err) {
                callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
              }
              else {
                var res_data = {
                  docs: league_list,
                  pages: pageCount,
                  total: count,
                  limit: limit,
                  page: page
                }
                callback({ success: true, error: false, message: "Member list", response: res_data });
              }
            });
          } else {
            memberAggregate.sort(sortBy);
            memberAggregate.exec(function (err, league_list) {
              if (err) {
                callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
              }
              else {
                var count = league_list.length;
                var res_data = {
                  docs: league_list,
                  total: count,
                  limit: count,
                  offset: 0,
                  page: 1,
                  pages: 1
                }
                callback({ success: true, error: false, message: "Member list", response: res_data });
              }
            });
          }
        }
      })
    }
  },

  leagueListForAdmin: (params, callback) => {
    //var query = {};
    var page = null;
    var limit = null;
    var sortBy = { 'createdAt': -1 };
    if (params.page && !params.limit) {
      page = parseInt(params.page);
      limit = CONSTANTS.record_per_page;
    }
    if (params.page && params.limit) {
      page = parseInt(params.page);
      limit = parseInt(params.limit);
    }
    var leagueAggregate = League.aggregate();
    leagueAggregate.lookup({
      from: 'users',
      localField: 'creator_id',
      foreignField: '_id',
      as: 'creator'
    })
    leagueAggregate.unwind('creator');
    leagueAggregate.lookup({
      from: 'league_members',
      localField: '_id',
      foreignField: 'league_id',
      as: 'member'
    })
    //leagueAggregate.unwind('member');
    if (params.creator_id) {
      leagueAggregate.match({ 'creator_id': params.creator_id });
    }
    if (params.creator_email) {
      leagueAggregate.match({ 'creator.email': { $regex: params.creator_email, $options: "$i" } });
    }
    if (params.league_name) {
      leagueAggregate.match({ 'league_name': { $regex: params.league_name, $options: "$i" } });
    }
    if (params.unique_team_code) {
      leagueAggregate.match({ 'unique_team_code': { $regex: params.unique_team_code, $options: "$i" } });
    }
    if (params.date) {
      //leagueAggregate.match({ 'createdAt' : new Date(params.date) });
      leagueAggregate.match({ 'createdAt': { $gte: new Date(params.date + ' 00:00:00'), $lte: new Date(params.date + ' 23:59:59') } });

    }
    leagueAggregate.project({
      _id: 1,
      league_name: 1,
      unique_team_code: 1,
      creator_id: 1,
      createdAt: 1,
      updatedAt: 1,
      'creator._id': 1,
      'creator.type': 1,
      'creator.email': 1,
      'creator.first_name': 1,
      'creator.last_name': 1,
      //'member':1,
      'member_count': { $size: "$member" },
      "creator.user_image": {
        "$switch": {
          "branches": [
            { "case": { "$ne": ["$creator.image", ""] }, "then": { $concat: [PATH_LOCATIONS.user_profile_pic_path_view, "$creator.image"] } },//"$config.file_base_url"+"$PATH_LOCATIONS.user_profile_pic_path_view"+"$image"
            { "case": { "$eq": ["$creator.type", "NORMAL"] }, "then": "$creator.image" },
            { "case": { "$eq": ["$creator.type", "FACEBOOK"] }, "then": "$creator.social_login.facebook.image" },
            { "case": { "$eq": ["$creator.type", "GOOGLE"] }, "then": "$creator.social_login.google.image" },
            { "case": { "$eq": ["$creator.type", "APPLE"] }, "then": "$creator.social_login.apple.image" }
          ],
          "default": ''
        }
      }
    })

    if (limit) {
      var options = { page: page, limit: limit, sortBy: sortBy };
      League.aggregatePaginate(leagueAggregate, options, function (err, league_list, pageCount, count) {
        if (err) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
        }
        else {
          var res_data = {
            docs: league_list,
            pages: pageCount,
            total: count,
            limit: limit,
            page: page
          }
          callback({ success: true, error: false, message: "Team list", response: res_data });
          // league_list_response = res_data;
          // nextcb(null);
        }
      });
    } else {
      leagueAggregate.sort(sortBy);
      leagueAggregate.exec(function (err, league_list) {
        if (err) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
        }
        else {
          var count = league_list.length;
          var res_data = {
            docs: league_list,
            total: count,
            limit: count,
            offset: 0,
            page: 1,
            pages: 1,
            //req:params
          }
          callback({ success: true, error: false, message: "Team list", response: res_data });
          // league_list_response = res_data;
          // nextcb(null);
        }
      });
    }
  },
  deleteLeagueAdmin: (league_id, callback) => {
    if (!league_id) {
      callback({ success: false, error: true, message: "Team id require" });
    } else {
      League.findOne({ _id: league_id }, function (err, league_data) {
        if (err) {
          callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
        }
        else if (!league_data) {
          callback({ success: false, error: true, message: "Team not found" });
        } else {
          League.deleteOne({ _id: league_id }, function (err) {
            if (err) {
              callback({ success: false, error: true, status: STATUS_CONSTANTS.INTERNAl_DB_ERROR, message: STATUS_MESSAGES.INTERNAl_DB_ERROR, errors: err });
            } else {
              LeagueMember.deleteMany({ league_id: league_id }, function (merr, mres) { });
              callback({ success: true, error: false, message: "Team deleted" });
            }
          });
        }
      });
    }
  },
  userLeaveTeam: (data, callback) => {

    if (!data.user_id || typeof data.user_id === undefined) {
      callback({
        "response_code": 5002,
        "message": "please provide user id",
        'success': false,
        'error': true,
      });
    } else if (!data.team_id || typeof data.team_id === undefined) {
      callback({
        "response_code": 5002,
        "message": "please provide team id",
        'success': false,
        'error': true,
      });

    } else {

      League.findOne(
        {
          _id: data.team_id,
        },
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
            if (resDetails == null) {
              callback({
                success: false,
                error: true,
                response_code: 5002,
                message: "Team does not exists",
              });
            } else {
              LeagueMember.findOne(
                {
                  league_id: data.team_id,
                  member_id: data.user_id,
                },
                function (err, resDetails2) {
                  if (err) {
                    callback({
                      success: false,
                      error: true,
                      response_code: 5005,
                      message: "INTERNAL DB ERROR",
                      response: err
                    });
                  } else {
                    if (resDetails2 == null) {
                      callback({
                        success: false,
                        error: true,
                        response_code: 5002,
                        message: "you are not belongs to this team",
                      });
                    } else {
                      LeagueMember.deleteMany(
                        {
                          member_id: data.user_id,
                          league_id: data.team_id,
                        }, function (err, result) {
                          if (err) {
                            callback({
                              success: false,
                              error: true,
                              response_code: 5005,
                              message: "INTERNAL DB ERROR",
                              response: err,
                            });
                          } else {
                            callback({
                              success: true,
                              error: false,
                              message: "you have left the team successfully"
                            });
                          }
                        });
                    }
                  }
                })
            }
          }
        })
    };

  },
};
module.exports = LeagueService;
