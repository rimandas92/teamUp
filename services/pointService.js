var Point = require("../models/point");
var User = require("../models/user");
var Activity = require("../models/activity");
var pushNotification = require("../modules/pushNotification");
var teamMemberSchema = require("../models/league_member");
var mailProperty = require("../modules/sendMail");
var league = require("../models/league_member");

var mongo = require("mongodb");
var moment = require("moment");
const { query } = require("express");
var ObjectID = mongo.ObjectID;
const {
  STATUS_CONSTANTS,
  STATUS_MESSAGES,
  URL_PATHS,
  PATH_LOCATIONS,
  CONSTANTS,
} = require("../utils/constant");
const point = require("../models/point");
var fs = require("fs");
var PointService = {
  logPoint_old: (pointlog_data, callback) => {
    //callback({ success: false, error: true, message: "Please send valid date", result: moment(new Date(pointlog_data.date)).format('YYYY-MM-DD') });
    if (!pointlog_data.point) {
      callback({ success: false, error: true, message: "Please send point" });
    } else if (!pointlog_data.date) {
      callback({ success: false, error: true, message: "Please send date" });
    } else if (
      moment(new Date(pointlog_data.date)).format("YYYY-MM-DD") ==
      "Invalid date"
    ) {
      callback({
        success: false,
        error: true,
        message: "Please send valid date",
      });
    } else if (!pointlog_data.activity_id) {
      callback({
        success: false,
        error: true,
        message: "Please send activity id",
      });
    } else if (!pointlog_data.user_id) {
      callback({ success: false, error: true, message: "Token invalid" });
    } else {
      User.findOne({ _id: pointlog_data.user_id }).exec(function (
        usererr,
        userdata
      ) {
        if (usererr) {
          callback({
            success: false,
            error: true,
            status: STATUS_CONSTANTS.INTERNAl_DB_ERROR,
            message: STATUS_MESSAGES.INTERNAl_DB_ERROR,
            errors: err,
          });
        } else if (!userdata) {
          callback({ success: false, error: true, message: "User not found" });
        } else if (!userdata.status) {
          callback({ success: false, error: true, message: "User not active" });
        } else {
          Activity.findOne({ _id: pointlog_data.activity_id }).exec(function (
            activityerr,
            activitydata
          ) {
            if (activityerr) {
              callback({
                success: false,
                error: true,
                status: STATUS_CONSTANTS.INTERNAl_DB_ERROR,
                message: STATUS_MESSAGES.INTERNAl_DB_ERROR,
                errors: err,
              });
            } else if (!activitydata) {
              callback({
                success: false,
                error: true,
                message: "Activity not found",
              });
            } else if (!activitydata.is_active) {
              callback({
                success: false,
                error: true,
                message: "Activity not active",
              });
            } else {
              /*var update_data = {
                  user_id : pointlog_data.user_id,
                  activity_id : pointlog_data.activity_id,
                  date : moment(new Date(pointlog_data.date)).format('YYYY-MM-DD')
              }
              var setData = {};
              if(pointlog_data.others_activity){
                  setData.point = Number(pointlog_data.point);
                  setData.others_activity = pointlog_data.others_activity;
              }else{
                  setData.point = Number(pointlog_data.point);
                  setData.others_activity = '';
              }*/
              var update_data = {
                _id: new ObjectID(),
              };
              if (pointlog_data.point_id) {
                update_data._id = pointlog_data.point_id;
              }
              var setData = {
                user_id: pointlog_data.user_id,
                activity_id: pointlog_data.activity_id,
                date: moment(new Date(pointlog_data.date)).format("YYYY-MM-DD"),
                point: Number(pointlog_data.point),
              };
              if (pointlog_data.others_activity) {
                setData.others_activity = pointlog_data.others_activity;
              } else {
                setData.others_activity = "";
              }
              Point.updateOne(
                update_data,
                { $set: setData },
                { upsert: true }
              ).exec(function (err, result) {
                if (err) {
                  callback({
                    success: false,
                    error: true,
                    status: STATUS_CONSTANTS.INTERNAl_DB_ERROR,
                    message: STATUS_MESSAGES.INTERNAl_DB_ERROR,
                    errors: err,
                  });
                } else if (result.ok == 1 && result.nModified == 0) {
                  callback({
                    success: true,
                    error: false,
                    message: "Point logged successfully",
                  });
                } else if (result.ok == 1 && result.nModified == 1) {
                  callback({
                    success: true,
                    error: false,
                    message: "Logged point updated successfully",
                  });
                }
              });
            }
          });
        }
      });
    }
  },
  logPoint: async (pointlog_data, fileData, callback) => {
    var userDetails = await User.findOne({ _id: pointlog_data.user_id });
    // var checkLeaugeMember = await teamMemberSchema.findOne({ member_id: pointlog_data.user_id });

    if (!pointlog_data.point) {
      callback({ success: false, error: true, message: "Please send point" });
    } else if (!pointlog_data.date) {
      callback({ success: false, error: true, message: "Please send date" });
    } else if (moment(new Date(pointlog_data.date)) == "Invalid date") {
      callback({
        success: false,
        error: true,
        message: "Please send valid date",
      });
    } else if (!pointlog_data.activity_id) {
      callback({
        success: false,
        error: true,
        message: "Please send activity id",
      });
    } else if (!pointlog_data.user_id) {
      callback({ success: false, error: true, message: "Token invalid" });
    } else if (!pointlog_data.weekStartDate) {
      callback({ success: false, error: true, message: "Week date missing" });
    } else {
      User.findOne({ _id: pointlog_data.user_id }).exec(function (
        usererr,
        userdata
      ) {
        if (usererr) {
          callback({
            success: false,
            error: true,
            status: STATUS_CONSTANTS.INTERNAl_DB_ERROR,
            message: STATUS_MESSAGES.INTERNAl_DB_ERROR,
            errors: err,
          });
        } else if (!userdata) {
          callback({ success: false, error: true, message: "User not found" });
        } else if (!userdata.status) {
          callback({ success: false, error: true, message: "User not active" });
        } else {
          if (!fileData || typeof fileData === undefined) {
            data = {
              _id: new ObjectID(),
              user_id: pointlog_data.user_id,
              activity_id: pointlog_data.activity_id,
              date: pointlog_data.date,
              point: Number(pointlog_data.point),
              others_activity: pointlog_data.others_activity
                ? pointlog_data.others_activity
                : null,
              note: pointlog_data.note,
              // leauge_id: checkLeaugeMember.league_id ? checkLeaugeMember.league_id : null
            };

            new point(data).save(function (err, result) {
              if (err) {
                callback({
                  response_code: 5005,
                  response_message: "INTERNAL DB ERROR",
                  error: err,
                  success: false,
                  error: true,
                });
              } else {
                let query = {};
                query["user_id"] = pointlog_data.user_id;

                //******************************************************************
                // get  data of this week , start day of this week[8th march to 14th march ]
                // Is monday and end day is sunday
                //*******************************************************************
                var now = moment();
                var WeekStartDate = pointlog_data.weekStartDate;
                WeekStartDate = new Date(WeekStartDate);
                WeekStartDate.setHours(0, 0, 0, 0);
                var weekEndDate = pointlog_data.weekEndDate;
                weekEndDate = new Date(weekEndDate);
                weekEndDate.setHours(23, 59, 59, 999);

                // console.log(`now: ${now}`);
                // console.log(`WeekStartDate: ${WeekStartDate}`);
                // console.log(`friday: ${weekEndDate}`);

                query["date"] = { $gte: WeekStartDate, $lte: weekEndDate };

                point.find(query, function (err, result) {
                  if (err) {
                    callback({
                      response_code: 5005,
                      message: "INTERNAL DB ERROR",
                      response_data: {},
                      success: false,
                      error: true,
                    });
                  } else {
                    // console.log('result =======\n',result);

                    let sum = 0;
                    let sent_notification = "no";
                    let totalWeekPoint = result.map((element) => {
                      sum = sum + element.point;
                      if (element.sent_notification == "yes") {
                        sent_notification = "yes";
                      }
                    });
                    console.log("sum =======\n", sum);
                    console.log(
                      "sent_notification =======\n",
                      sent_notification
                    );

                    if (sum >= 150 && sent_notification == "no") {
                      data = {
                        _id: new ObjectID(),
                        user_id: pointlog_data.user_id,
                        activity_id: null,
                        date: new Date(),
                        point: 0,
                        others_activity: null,
                        note: null,
                        sent_notification: "yes",
                        data_type: "congratulations",
                      };

                      new point(data).save(function (err, result) {
                        if (err) {
                          callback({
                            response_code: 5005,
                            response_message: "INTERNAL DB ERROR",
                            error: err,
                            success: false,
                            error: true,
                          });
                        } else {
                          // Defining push data to send push notification
                          var pushData = {
                            deviceId: userDetails.devicetoken,
                            user_id: userDetails._id,
                            title: "150 points completed",
                            message:
                              "Congratulations you have completed 150 point this week.",
                            profile_image:
                              PATH_LOCATIONS.user_profile_pic_path_view +
                              userDetails.image,
                          };

                          // checking if deive is IOS or Android.
                          if (
                            userDetails.apptype == "IOS" &&
                            userDetails.apptype != "" &&
                            userDetails.apptype != "undefined" &&
                            userDetails.apptype != null
                          ) {
                            pushNotification.iosPushNotificationUser(
                              pushData,
                              function (pushStatus) {
                                console.log("pushStatus", pushStatus);
                              }
                            );
                          } else if (
                            (userDetails.apptype =
                              "ANDROID" &&
                              userDetails.apptype != "" &&
                              userDetails.apptype != "undefined" &&
                              userDetails.apptype != null)
                          ) {
                            pushNotification.androidPushNotification(
                              pushData,
                              function (pushStatus) {
                                console.log("pushStatus", pushStatus);
                              }
                            );
                          }

                          mailProperty("point_completed_mail")(
                            userDetails.email,
                            {
                              name:
                                userDetails.first_name +
                                " " +
                                userDetails.last_name,
                            }
                          ).send();

                          callback({
                            success: true,
                            error: false,
                            message: "point added successfully",
                            response_code: 2000,
                            response_data:
                              PATH_LOCATIONS.user_point_image_path_view +
                              data.image,
                          });
                        }
                      });
                    } else {
                      callback({
                        success: true,
                        error: false,
                        message: "point added successfully",
                        response_code: 2000,
                        response_data:
                          PATH_LOCATIONS.user_point_image_path_view +
                          data.image,
                      });
                    }
                  }
                });
              }
            });
          } else {
            var imageFile = fileData.image;
            var picSize = fileData.image.size;
            console.log(
              "========================Picsizeeee========================",
              picSize
            );
            var timeStamp = Date.now();
            var fileName = timeStamp + imageFile.name;
            var folderpath = PATH_LOCATIONS.user_point_image_path;
            let split = imageFile.mimetype.split("/");
              if ((split[1] = "jpeg" || "png" || "jpg")) {
                imageFile.mv(folderpath + fileName, function (err) {
                  if (err) {
                    callback({
                      response_code: 5005,
                      response_message: "INTERNAL DB ERROR",
                      response_data: err,
                      success: false,
                      error: true,
                    });
                  } else {
                    pointlog_data.image = fileName;

                    data = {
                      _id: new ObjectID(),
                      image: pointlog_data.image,
                      user_id: pointlog_data.user_id,
                      activity_id: pointlog_data.activity_id,
                      date: pointlog_data.date,
                      point: Number(pointlog_data.point),
                      others_activity: pointlog_data.others_activity
                        ? pointlog_data.others_activity
                        : null,
                      note: pointlog_data.note,
                    };

                    new point(data).save(function (err, result) {
                      if (err) {
                        callback({
                          response_code: 5005,
                          response_message: "INTERNAL DB ERROR",
                          error: err,
                          success: false,
                          error: true,
                        });
                      } else {
                        let query = {};
                        query["user_id"] = pointlog_data.user_id;

                        //******************************************************************
                        // get  data of this week , start day of this week[8th march to 14th march ]
                        // Is monday and end day is sunday
                        //*******************************************************************
                        var now = moment();
                        var WeekStartDate = pointlog_data.weekStartDate;
                        WeekStartDate = new Date(WeekStartDate);
                        WeekStartDate.setHours(0, 0, 0, 0);
                        var weekEndDate = pointlog_data.weekEndDate;
                        weekEndDate = new Date(weekEndDate);
                        weekEndDate.setHours(23, 59, 59, 999);

                        // console.log(`now: ${now}`);
                        // console.log(`WeekStartDate: ${WeekStartDate}`);
                        // console.log(`friday: ${weekEndDate}`);

                        query["date"] = {
                          $gte: WeekStartDate,
                          $lte: weekEndDate,
                        };

                        point.find(query, function (err, result) {
                          if (err) {
                            callback({
                              response_code: 5005,
                              message: "INTERNAL DB ERROR",
                              response_data: {},
                              success: false,
                              error: true,
                            });
                          } else {
                            // console.log('result =======\n',result);

                            let sum = 0;
                            let sent_notification = "no";
                            let totalWeekPoint = result.map((element) => {
                              sum = sum + element.point;
                              if (element.sent_notification == "yes") {
                                sent_notification = "yes";
                              }
                            });
                            console.log("sum =======\n", sum);
                            console.log(
                              "sent_notification =======\n",
                              sent_notification
                            );

                            if (sum >= 150 && sent_notification == "no") {
                              data = {
                                _id: new ObjectID(),
                                user_id: pointlog_data.user_id,
                                activity_id: null,
                                date: new Date(),
                                point: 0,
                                others_activity: null,
                                note: null,
                                sent_notification: "yes",
                                data_type: "congratulations",
                              };

                              new point(data).save(function (err, result) {
                                if (err) {
                                  callback({
                                    response_code: 5005,
                                    response_message: "INTERNAL DB ERROR",
                                    error: err,
                                    success: false,
                                    error: true,
                                  });
                                } else {
                                  var pushData = {
                                    deviceId: userDetails.devicetoken,
                                    user_id: userDetails._id,
                                    title: "150 points completed",
                                    message:
                                      "Congratulations you have completed 150 point this week",
                                    profile_image:
                                      PATH_LOCATIONS.user_profile_pic_path_view +
                                      userDetails.image,
                                    // profile_image: config.liveUrl+'uploads/email_template/logo.png'
                                  };

                                  if (
                                    userDetails.apptype == "IOS" &&
                                    userDetails.apptype != "" &&
                                    userDetails.apptype != "undefined" &&
                                    userDetails.apptype != null
                                  ) {
                                    pushNotification.iosPushNotificationUser(
                                      pushData,
                                      function (pushStatus) {
                                        console.log("pushStatus", pushStatus);
                                      }
                                    );
                                  } else if (
                                    (userDetails.apptype =
                                      "ANDROID" &&
                                      userDetails.apptype != "" &&
                                      userDetails.apptype != "undefined" &&
                                      userDetails.apptype != null)
                                  ) {
                                    pushNotification.androidPushNotification(
                                      pushData,
                                      function (pushStatus) {
                                        console.log("pushStatus", pushStatus);
                                      }
                                    );
                                  }

                                  mailProperty("point_completed_mail")(
                                    userDetails.email,
                                    {
                                      name:
                                        userDetails.first_name +
                                        " " +
                                        userDetails.last_name,
                                      otp: "13424",
                                    }
                                  ).send();

                                  callback({
                                    success: true,
                                    error: false,
                                    message: "point added successfully",
                                    response_code: 2000,
                                    response_data:
                                      PATH_LOCATIONS.user_point_image_path_view +
                                      data.image,
                                    _id: data._id,
                                  });
                                }
                              });
                            } else {
                              callback({
                                success: true,
                                error: false,
                                message: "point added successfully",
                                response_code: 2000,
                                response_data:
                                  PATH_LOCATIONS.user_point_image_path_view +
                                  data.image,
                                _id: data._id,
                              });
                            }
                          }
                        });
                      }
                    });
                  }
                });
              } else {
                callback({
                  status: 5002,
                  message:
                    "MIME type not allowed please upload jpg or png file",
                });
              }
            
          }
        }
      });
    }
  },

  pointList: async (params, callback) => {
    console.log("===pointListTeamname===", params);

    var sortBy = { date: -1 };
    var sort_by = "";
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
    if (params.sort_by && params.sort_type == "desc") {
      sort_by = params.sort_by;
      sortBy = { sort_by: -1 };
    } else if (params.sort_by && params.sort_type == "asc") {
      sort_by = params.sort_by;
      sortBy = { sort_by: 1 };
    }

    if (params.league_id != null && params.league_id != "") {
      console.log("===== League Id ======");
      teamMemberSchema.find(
        {
          league_id: params.league_id,
        },
        { member_id: 1, league_id: 1 },
        function (err, resDetails) {
          if (err) {
            callback({
              success: false,
              error: true,
              response_code: 5005,
              message: "INTERNAL DB ERROR",
              response: err,
            });
          } else {
            if (resDetails.length > 0) {
              let user_ids = [];

              resDetails.map((element) => {
                user_ids.push(element.member_id);
              });
              console.log("user_ids======", user_ids);
              var query = {};

              if (user_ids) {
                query["user_id"] = { $in: user_ids };
              }

              if (params.from_date && params.to_date) {
                var from_date = new Date(params.from_date);
                var to_date = new Date(params.to_date);
                query["date"] = { $gte: from_date, $lte: to_date };
              }

              var pointAggregate = Point.aggregate();
              pointAggregate.match(query);

              if (params.user_id) {
                pointAggregate.match({ user_id: params.user_id });
              }
              if (params.activity_id) {
                pointAggregate.match({ activity_id: params.activity_id });
              }

              pointAggregate.lookup({
                from: "activities",
                localField: "activity_id",
                foreignField: "_id",
                as: "activity",
              });

              pointAggregate.unwind("activity");
              pointAggregate.lookup({
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user",
              });
              pointAggregate.unwind("user");

              pointAggregate.project({
                _id: 1,
                activity_id: 1,
                date: 1,
                point: 1,
                user_id: 1,
                createdAt: 1,
                updatedAt: 1,
                others_activity: 1,
                "user.first_name": 1,
                "user.last_name": 1,
                "user.email": 1,
                //'activity.activity':1,
                activity: 1,
                //activity_name: '$activity.activity',
                //activity_name: { $cond: { if: { $eq: [ "$others_activity", '' ] }, then: "$activity.activity", else: "$others_activity" } },
                activity_name: {
                  $cond: {
                    if: { $eq: ["$activity.is_other", true] },
                    then: {
                      $concat: [
                        "$activity.activity",
                        " (",
                        "$others_activity",
                        ")",
                      ],
                    },
                    else: "$activity.activity",
                  },
                },
                user_name: {
                  $concat: ["$user.first_name", " ", "$user.last_name"],
                },
              });

              if (limit) {
                var options = { page: page, limit: limit, sortBy: sortBy };
                Point.aggregatePaginate(
                  pointAggregate,
                  options,
                  function (err, point_list, pageCount, count) {
                    if (err) {
                      callback({
                        success: false,
                        error: true,
                        status: STATUS_CONSTANTS.INTERNAl_DB_ERROR,
                        message: STATUS_MESSAGES.INTERNAl_DB_ERROR,
                        errors: err,
                      });
                    } else {
                      console.log("=========point_list", point_list);
                      var responseData = {
                        docs: point_list,
                        pages: pageCount,
                        total: count,
                        limit: limit,
                        page: page,
                        req: params,
                      };
                      callback({
                        success: true,
                        error: false,
                        message: "Point list found",
                        response: responseData,
                      });
                    }
                  }
                );
              } else {
                pointAggregate.sort(sortBy);
                pointAggregate.exec(function (err, point_list) {
                  if (err) {
                    callback({
                      success: false,
                      error: true,
                      status: STATUS_CONSTANTS.INTERNAl_DB_ERROR,
                      message: STATUS_MESSAGES.INTERNAl_DB_ERROR,
                      errors: err,
                    });
                  } else {
                    var count = point_list.length;
                    var res_data = {
                      docs: point_list,
                      total: count,
                      limit: count,
                      offset: 0,
                      page: 1,
                      pages: 1,
                      req: params,
                    };
                    callback({
                      success: true,
                      error: false,
                      message: "Point list found",
                      response: res_data,
                    });
                  }
                });
              }
            }
          }
        }
      );
    } else {
      console.log("===== Not League Id ======");
      var pointAggregate = Point.aggregate();

      if (params.user_id) {
        pointAggregate.match({ user_id: params.user_id });
      }
      if (params.activity_id) {
        pointAggregate.match({ activity_id: params.activity_id });
      }
      if (params.from_date) {
        var from_date = new Date(params.from_date);
        // var from_date = moment(new Date(params.from_date)).format('YYYY-MM-DD');
        console.log("==========fromdate===============", from_date);
        pointAggregate.match({ date: { $gte: from_date } });
      }
      if (params.to_date) {
        var to_date = new Date(params.to_date);
        // var to_date = moment(new Date(params.to_date)).format('YYYY-MM-DD');
        console.log("==========to_date===============", to_date);
        pointAggregate.match({ date: { $lte: to_date } });
      }

      pointAggregate.lookup({
        from: "activities",
        localField: "activity_id",
        foreignField: "_id",
        as: "activity",
      });

      pointAggregate.unwind("activity");
      pointAggregate.lookup({
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user",
      });
      pointAggregate.unwind("user");

      pointAggregate.project({
        _id: 1,
        activity_id: 1,
        date: 1,
        point: 1,
        user_id: 1,
        createdAt: 1,
        updatedAt: 1,
        others_activity: 1,
        "user.first_name": 1,
        "user.last_name": 1,
        "user.email": 1,
        //'activity.activity':1,
        activity: 1,
        //activity_name: '$activity.activity',
        //activity_name: { $cond: { if: { $eq: [ "$others_activity", '' ] }, then: "$activity.activity", else: "$others_activity" } },
        activity_name: {
          $cond: {
            if: { $eq: ["$activity.is_other", true] },
            then: {
              $concat: ["$activity.activity", " (", "$others_activity", ")"],
            },
            else: "$activity.activity",
          },
        },
        user_name: { $concat: ["$user.first_name", " ", "$user.last_name"] },
      });

      if (limit) {
        var options = { page: page, limit: limit, sortBy: sortBy };
        Point.aggregatePaginate(
          pointAggregate,
          options,
          function (err, point_list, pageCount, count) {
            if (err) {
              callback({
                success: false,
                error: true,
                status: STATUS_CONSTANTS.INTERNAl_DB_ERROR,
                message: STATUS_MESSAGES.INTERNAl_DB_ERROR,
                errors: err,
              });
            } else {
              console.log("=========point_list", point_list);
              var responseData = {
                docs: point_list,
                pages: pageCount,
                total: count,
                limit: limit,
                page: page,
                req: params,
              };
              callback({
                success: true,
                error: false,
                message: "Point list found",
                response: responseData,
              });
            }
          }
        );
      } else {
        //query_option = { sort: { 'createdAt': -1 } };
        pointAggregate.sort(sortBy);
        pointAggregate.exec(function (err, point_list) {
          if (err) {
            callback({
              success: false,
              error: true,
              status: STATUS_CONSTANTS.INTERNAl_DB_ERROR,
              message: STATUS_MESSAGES.INTERNAl_DB_ERROR,
              errors: err,
            });
          } else {
            var count = point_list.length;
            var res_data = {
              docs: point_list,
              total: count,
              limit: count,
              offset: 0,
              page: 1,
              pages: 1,
              req: params,
            };
            callback({
              success: true,
              error: false,
              message: "Point list found",
              response: res_data,
            });
          }
        });
      }
    }
  },

  pointList_old: (params, callback) => {
    console.log("======", params);

    var sortBy = { date: -1 };
    var sort_by = "";
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
    if (params.sort_by && params.sort_type == "desc") {
      sort_by = params.sort_by;
      sortBy = { sort_by: -1 };
    } else if (params.sort_by && params.sort_type == "asc") {
      sort_by = params.sort_by;
      sortBy = { sort_by: 1 };
    }

    var pointAggregate = Point.aggregate();

    if (params.user_id) {
      pointAggregate.match({ user_id: params.user_id });
    }
    if (params.activity_id) {
      pointAggregate.match({ activity_id: params.activity_id });
    }
    if (params.from_date) {
      var from_date = new Date(params.from_date);
      // var from_date = moment(new Date(params.from_date)).format('YYYY-MM-DD');
      console.log("==========fromdate===============", from_date);
      pointAggregate.match({ date: { $gte: from_date } });
    }
    if (params.to_date) {
      var to_date = new Date(params.to_date);
      // var to_date = moment(new Date(params.to_date)).format('YYYY-MM-DD');
      console.log("==========to_date===============", to_date);
      pointAggregate.match({ date: { $lte: to_date } });
    }

    pointAggregate.lookup({
      from: "activities",
      localField: "activity_id",
      foreignField: "_id",
      as: "activity",
    });

    pointAggregate.unwind("activity");
    pointAggregate.lookup({
      from: "users",
      localField: "user_id",
      foreignField: "_id",
      as: "user",
    });
    pointAggregate.unwind("user");

    pointAggregate.project({
      _id: 1,
      activity_id: 1,
      date: 1,
      point: 1,
      user_id: 1,
      createdAt: 1,
      updatedAt: 1,
      others_activity: 1,
      "user.first_name": 1,
      "user.last_name": 1,
      "user.email": 1,
      //'activity.activity':1,
      activity: 1,
      //activity_name: '$activity.activity',
      //activity_name: { $cond: { if: { $eq: [ "$others_activity", '' ] }, then: "$activity.activity", else: "$others_activity" } },
      activity_name: {
        $cond: {
          if: { $eq: ["$activity.is_other", true] },
          then: {
            $concat: ["$activity.activity", " (", "$others_activity", ")"],
          },
          else: "$activity.activity",
        },
      },
      user_name: { $concat: ["$user.first_name", " ", "$user.last_name"] },
    });

    /*if(params.sum){
        pointAggregate.group({ _id : {
                point_date: "$date",
            },
            count:{$sum: "$point"}
        })
    }*/

    if (limit) {
      var options = { page: page, limit: limit, sortBy: sortBy };
      Point.aggregatePaginate(
        pointAggregate,
        options,
        function (err, point_list, pageCount, count) {
          if (err) {
            callback({
              success: false,
              error: true,
              status: STATUS_CONSTANTS.INTERNAl_DB_ERROR,
              message: STATUS_MESSAGES.INTERNAl_DB_ERROR,
              errors: err,
            });
          } else {
            /*if(params.sum){
              point_list.map((value) => {
                  value.date = new Date(value._id.point_date);
                  value.day = new Date(value._id.point_date).getDay();
              })
          }*/ console.log("=========point_list", point_list);
            var responseData = {
              docs: point_list,
              pages: pageCount,
              total: count,
              limit: limit,
              page: page,
              req: params,
            };
            callback({
              success: true,
              error: false,
              message: "Point list found",
              response: responseData,
            });
          }
        }
      );
    } else {
      //query_option = { sort: { 'createdAt': -1 } };
      pointAggregate.sort(sortBy);
      pointAggregate.exec(function (err, point_list) {
        if (err) {
          callback({
            success: false,
            error: true,
            status: STATUS_CONSTANTS.INTERNAl_DB_ERROR,
            message: STATUS_MESSAGES.INTERNAl_DB_ERROR,
            errors: err,
          });
        } else {
          /*if(params.sum){
              point_list.map((value) => {
                  value.date = new Date(value._id.point_date);
                  value.day = new Date(value._id.point_date).getDay();
              })
          }*/
          var count = point_list.length;
          var res_data = {
            docs: point_list,
            total: count,
            limit: count,
            offset: 0,
            page: 1,
            pages: 1,
            req: params,
          };
          callback({
            success: true,
            error: false,
            message: "Point list found",
            response: res_data,
          });
        }
      });
    }
  },
  weeklyUserPoint_backup: (data, callback) => {
    var page = 1,
      limit = 200,
      query = {};

    if (data.page) {
      page = parseInt(data.page);
    }
    if (data.limit) {
      limit = parseInt(data.limit);
    }
    if (data.user_id) {
      query["user_id"] = data.user_id;
    }

    //******************************************************************
    // get  data of this week , start day of this week[8th march to 14th march ]
    // Is monday and end day is sunday
    //*******************************************************************
    var now = moment();
    var WeekStartDate = now.clone().weekday(1);
    WeekStartDate = new Date(WeekStartDate).toISOString();
    WeekStartDate.setHours(0, 0, 0, 0);
    var weekEndDate = now.clone().weekday(7);
    weekEndDate = new Date(weekEndDate).toISOString();
    weekEndDate.setHours(23, 59, 59, 999);

    console.log(`now: ${now}`);
    console.log(`WeekStartDate: ${WeekStartDate}`);
    console.log(`friday: ${weekEndDate}`);

    query["date"] = { $gte: WeekStartDate, $lt: weekEndDate };
    //    query['date'] =  { $gte: startDate, $lt: endDate };

    var aggregate = Point.aggregate();
    aggregate.match(query);

    aggregate.lookup({
      from: "activities",
      localField: "activity_id",
      foreignField: "_id",
      as: "activity",
    });
    aggregate.unwind("activity");

    aggregate.sort({
      createdAt: -1,
    });
    aggregate.project({
      createdAt: 1,
      date: 1,
      _id: 1,
      point: 1,
      user_id: 1,
    });
    var options = {
      page: page,
      limit: limit,
    };

    point.aggregatePaginate(
      aggregate,
      options,
      function (err, results, pageCount, count) {
        if (err) {
          callback({
            response_code: 5005,
            response_message: err,
            response_data: {},
          });
        } else {
          thisWeekTotalPoint = 0;
          results.map((elem) => {
            thisWeekTotalPoint = thisWeekTotalPoint + elem.point;
          });

          weekdata = [];
          for (i = 0; i < 7; i++) {
            obj = {};

            if (i == 6) {
              obj.date = weekEndDate;
              obj.day = i;
              obj.point = 0;
              weekdata.push(obj);
            } else if (i == 0) {
              obj.date = WeekStartDate;
              obj.day = i;
              obj.point = 0;
              weekdata.push(obj);
            } else {
              let date = new Date(WeekStartDate);
              date.setDate(date.getDate() + i);
              obj.date = date;
              obj.day = i;
              obj.point = 0;
              weekdata.push(obj);
            }
          }
          // console.log('weekdata  == \n',weekdata);
          // console.log('res \n ' , results);
          weekdata.map((weekElement) => {
            results.map((pointElement) => {
              let day = pointElement.date.getDay() - 1;
              if (weekElement.day == day) {
                // console.log('pointElement',day);
                // console.log('weekElement.day ',weekElement.day);
                weekElement.point = weekElement.point + pointElement.point;
              }
              if (day < 0 && weekElement.day == 6) {
                weekElement.point = weekElement.point + pointElement.point;
              }
            });
          });

          var res_data = {
            docs: weekdata,
            sum: thisWeekTotalPoint,
            from_date: WeekStartDate,
            to_date: weekEndDate,
          };
          callback({
            success: true,
            error: false,
            message: "Weekly point list",
            response: res_data,
          });
        }
      }
    );
  },
  weeklyUserPoint: async (data, callback) => {
    //pinki

    var page = 1,
      limit = 200,
      query = {};

    if (data.page) {
      page = parseInt(data.page);
    }
    if (data.limit) {
      limit = parseInt(data.limit);
    }
    if (data.user_id) {
      query["user_id"] = data.user_id;
    }

    //******************************************************************
    // get  data of this week , start day of this week[8th march to 14th march ]
    // Is monday and end day is sunday
    //*******************************************************************
    var now = moment();
    //var WeekStartDate = now.clone().weekday(0);
    var WeekStartDate = data.weekStartDate;
    WeekStartDate = new Date(WeekStartDate);
    WeekStartDate.setHours(0, 0, 0, 0);
    //var weekEndDate = now.clone().weekday(6);
    var weekEndDate = data.weekEndDate;
    weekEndDate = new Date(weekEndDate);
    // weekEndDate.setHours(23, 59, 59, 999);

    console.log(`WeekStartDate: ${WeekStartDate}`);
    console.log(`End Date: ${weekEndDate}`);

    query["date"] = { $gte: WeekStartDate, $lte: weekEndDate }; // $lte: weekEndDate

    var weekEndDate2 = weekEndDate;
    weekEndDate2 = new Date(weekEndDate2);
    // weekEndDate2.setHours(0, 0, 0, 0);
    //    query['date'] =  { $gte: startDate, $lt: endDate };

    var aggregate = Point.aggregate();
    aggregate.match(query);

    // aggregate.lookup({
    //   from: 'activities',
    //   localField: 'activity_id',
    //   foreignField: '_id',
    //   as: 'activity'
    // })
    // aggregate.unwind('activity');

    aggregate.sort({
      createdAt: -1,
    });
    // aggregate.group({
    //   _id: "$_id",
    //   point: {
    //     "$sum": 1
    //   }
    // })
    aggregate.project({
      createdAt: 1,
      date: 1,
      _id: 1,
      point: 1,
      user_id: 1,
    });
    var options = {
      page: page,
      limit: limit,
    };

    point.aggregatePaginate(
      aggregate,
      options,
      function (err, results, pageCount, count) {
        if (err) {
          callback({
            response_code: 5005,
            response_message: err,
            response_data: {},
          });
        } else {
          thisWeekTotalPoint = 0;
          console.log(results);
          results.map((elem) => {
            thisWeekTotalPoint = thisWeekTotalPoint + elem.point;
          });

          weekdata = [];
          for (i = 0; i <= 6; i++) {
            obj = {};
            if (i == 6) {
              //sunday
              obj.date = weekEndDate2;
              obj.day = 0;
              obj.point = 0;
              weekdata.push(obj);
            } else if (i == 0) {
              obj.date = WeekStartDate;
              obj.day = 1;
              obj.point = 0;
              weekdata.push(obj);
            } else {
              let date = new Date(WeekStartDate);
              date.setDate(date.getDate() + i);
              obj.date = date;
              obj.day = i + 1;
              obj.point = 0;
              weekdata.push(obj);
            }
          }
          console.log("weekdata", weekdata);
          weekdata.map((weekElement) => {
            results.map((pointElement) => {
              let day = pointElement.date.getDay();
              console.log("day==>", day);

              if (weekElement.day == day) {
                // console.log('pointElement',day);
                // console.log('weekElement.day ',weekElement.day);
                weekElement.point = weekElement.point + pointElement.point;
              }

              if (day < 0 && weekElement.day == 6) {
                //not sunday
                weekElement.point = weekElement.point + pointElement.point;
              }
            });
          });

          var res_data = {
            docs: weekdata,
            sum: thisWeekTotalPoint,
            from_date: WeekStartDate,
            to_date: weekEndDate,
          };
          callback({
            success: true,
            error: false,
            message: "Weekly point list",
            response: res_data,
          });
        }
      }
    );
  },
  removePointAdmin: (pointlog_data, callback) => {
    //callback({ success: false, error: true, message: "Please send valid date", result: moment(new Date(pointlog_data.date)).format('YYYY-MM-DD') });
    /*if(!pointlog_data.date){
        callback({ success: false, error: true, message: "Please send date" });
    }else if(moment(new Date(pointlog_data.date)).format('YYYY-MM-DD') == "Invalid date"){
        callback({ success: false, error: true, message: "Please send valid date" });
    }else if(!pointlog_data.activity_id){
        callback({ success: false, error: true, message: "Please send activity id" });
    }else if(!pointlog_data.user_id){
        callback({ success: false, error: true, message: "Please send user id" });
    }*/
    if (!pointlog_data.point_id) {
      callback({
        success: false,
        error: true,
        message: "Please send point id",
      });
    } else {
      var search_data = {
        // user_id : pointlog_data.user_id,
        // activity_id : pointlog_data.activity_id,
        // date : moment(new Date(pointlog_data.date)).format('YYYY-MM-DD')
        _id: pointlog_data.point_id,
      };
      Point.findOne(search_data).exec(function (err, pointentry) {
        if (err) {
          callback({
            success: false,
            error: true,
            status: STATUS_CONSTANTS.INTERNAl_DB_ERROR,
            message: STATUS_MESSAGES.INTERNAl_DB_ERROR,
            errors: err,
          });
        } else if (!pointentry) {
          callback({
            success: true,
            error: false,
            message: "Point logged not found",
          });
        } else {
          Point.deleteOne({ _id: pointentry._id }).exec(function (err) {
            if (err) {
              callback({
                success: false,
                error: true,
                status: STATUS_CONSTANTS.INTERNAl_DB_ERROR,
                message: STATUS_MESSAGES.INTERNAl_DB_ERROR,
                errors: err,
              });
            } else {
              callback({
                success: true,
                error: false,
                message: "Point deleted successfully",
              });
            }
          });
        }
      });
    }
  },
  listPointsByDate: async (data, callback) => {
    if (!data.user_id || typeof data.user_id === undefined) {
      callback({
        response_code: 5002,
        message: "please provide user id",
        response_data: {},
      });
    } else if (!data.date || typeof data.date === undefined) {
      callback({
        response_code: 5002,
        message: "please provide date",
        response_data: {},
      });
    } else {
      var page = 1,
        limit = 300,
        query = {};

      // query['date']= data.date;
      query["user_id"] = data.user_id;
      query["data_type"] = "points";

      // ISSUES TIMEZONE
      var startDate = new Date(data.date);
      // startDate.setHours(0, 0, 0, 0);
      var endDate = new Date(data.date);
      // endDate.setHours(23, 59, 59, 999);

      console.log(startDate.getDate());
      query["date"] = { $gte: startDate, $lte: endDate };

      console.log("startDate", startDate);
      console.log("endDate", endDate);

      var aggregate = point.aggregate();
      aggregate.match(query);

      aggregate.lookup({
        from: "activities",
        localField: "activity_id",
        foreignField: "_id",
        as: "activity",
      });

      aggregate.unwind({
        path: "$activity",
        preserveNullAndEmptyArrays: true,
      });

      aggregate.project({
        _id: 1,
        point: 1,
        activity_id: 1,
        date: 1,
        _id: 1,
        others_activity: 1,
        note: 1,
        image: {
          $concat: [PATH_LOCATIONS.user_point_image_path_view, "$image"],
        },
        user_id: 1,
        activity: {
          _id: "$activity._id",
          name: "$activity.activity",
        },
      });
      aggregate.sort({
        createdAt: -1,
      });
      var options = {
        page: page,
        limit: limit,
        // sortBy: sortBy
      };
      point.aggregatePaginate(
        aggregate,
        options,
        function (err, results, pageCount, count) {
          if (err) {
            callback({
              response_code: 5005,
              response_message: err,
              response_data: {},
              success: false,
              error: true,
            });
          } else {
            // var data = {
            //     docs: results,
            //     pages: pageCount,
            //     total: count,
            //     limit: limit,
            //     page: page
            // }
            console.log(results);
            callback({
              response_data: results,
              response_code: 2000,
              message: "Points list",
              success: true,
              error: false,
            });
          }
        }
      );
    }
  },
  updatePoints_old: async (data, callback) => {
    if (!data.user_id || typeof data.user_id === undefined) {
      callback({
        response_code: 5002,
        message: "please provide user id",
        response_data: {},
      });
    } else if (!data._id || typeof data._id === undefined) {
      callback({
        response_code: 5002,
        message: "please provide point id",
        response_data: {},
      });
    } else if (!data.point || typeof data.point === undefined) {
      callback({
        response_code: 5002,
        message: "please provide points",
        response_data: {},
      });
    } else if (!data.activity_id || typeof data.activity_id === undefined) {
      callback({
        response_code: 5002,
        message: "please provide activity id",
        response_data: {},
      });
    } else {
      point.updateOne(
        {
          _id: data._id,
          user_id: data.user_id,
        },
        {
          $set: {
            point: data.point,
            activity_id: data.activity_id,
          },
        },
        function (err, resUpdate) {
          if (err) {
            callback({
              response_code: 5005,
              message: "INTERNAL DB ERROR",
              error: err,
              success: false,
              error: true,
            });
          } else {
            callback({
              response_code: 2000,
              message: "Points updated successfully",
              success: true,
              error: false,
            });
          }
        }
      );
    }
  },

  // isPreviousImage:async (data,result)=>{
  //   let _id= data._id;
  //   let user_id= data.user_id;
  // },

  updatePoints: async (data, fileData, callback) => {
    console.log("========================data===============>", data);
     console.log("========================fileData===============>", fileData);

    if (!data.user_id || typeof data.user_id === undefined) {
      callback({
        "response_code": 5002,
        "message": "please provide user id",
        "response_data": {}
      });

    } else if (!data._id || typeof data._id === undefined) {
      callback({
        "response_code": 5002,
        "message": "please provide point id",
        "response_data": {}
      });
    } else if (!data.point || typeof data.point === undefined) {
      callback({
        "response_code": 5002,
        "message": "please provide points",
        "response_data": {}
      });
    } else if (!data.activity_id || typeof data.activity_id === undefined) {
      callback({
        "response_code": 5002,
        "message": "please provide activity id",
        "response_data": {}
      });
    }
    else {
      if (!fileData || typeof fileData === undefined) {
         console.log("========================fileData===============>", fileData);

        // console.log("filedata not ", fileData);
        point.updateOne({
          _id: data._id,
          user_id: data.user_id
        }, {
          $set: {
            point: data.point,
            activity_id: data.activity_id,
            note: data.note,
            others_activity: data.others_activity == "null" ? null : data.others_activity
          }
        }, function (err, resUpdate) {

          //console.log("====================no file ddata====resUpdate===============>", resUpdate);

          if (err) {
            callback({
              "response_code": 5005,
              "message": "INTERNAL DB ERROR",
              "error": err,
              "success": false,
              "error": true
            });
          } else {
            callback({
              "response_code": 2000,
              "message": "Points updated successfully",
              "success": true,
              "error": false
            });
          }
        });

      } else {
        //console.log("========================fileData= available==============>", fileData);
       function removePreviousImage(){
        point.findOne({
          _id: data._id,
          user_id: data.user_id
        }, {
          image: 1
        },
          function (err, result) {
            console.log("result---->", result);

            if (result != null) {
              if (result.image !== null) {

                let pf_image = `./public/uploads/point_image/${result.image}`;
                fs.unlink(pf_image, (err) => {
                  if (err) {
                    console.log('error while image delete===>', err);
                  } else {
                    console.log(result.image + ' was deleted');
                    point.updateOne({
                      _id: data._id
                    }, {
                      $set: {
                        image: null
                        // point: data.point,
                        // activity_id: data.activity_id,
                        // note: data.note,
                        // others_activity: data.others_activity == "null" ? null : data.others_activity
                      }
                    }, function (err, resUpdate) {
                      //console.log("====================with file ddata====resUpdate===============>", resUpdate);
          
                      if (err) {
                        callback({
                          "response_code": 5005,
                          "response_message": "INTERNAL DB ERROR",
                          "error": err,
                          "success": false,
                          "error": true,
                        });
                      } else {
                        callback({
                          "success": true,
                          "error": false,
                          "message": "Point updated successfully",
                          "response_code": 2000,
                          "response_data": PATH_LOCATIONS.user_point_image_path_view + data.image
                        });
                      }
                    });
                    
                  }
                });

              }
            }
          });

       }
        function removePreviousImageAndUpdate() {
          var imageFile = fileData.image;
          var timeStamp = Date.now();
          var fileName = timeStamp + imageFile.name;
          var folderpath = PATH_LOCATIONS.user_point_image_path;
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

                  point.findOne({
                    _id: data._id,
                    user_id: data.user_id
                  }, {
                    image: 1
                  },
                    function (err, result) {
                      console.log("result---->", result);

                      if (result != null) {
                        if (result.image !== null) {

                          let pf_image = `./public/uploads/point_image/${result.image}`;
                          fs.unlink(pf_image, (err) => {
                            if (err) {
                              console.log('error while image delete===>', err);
                            } else {
                              console.log(result.image + ' was deleted');
                              data.image = fileName;
                               updateProfileImage(data);
                            }
                          });
                        }
                      }

                    });

                   data.image = fileName;
                   updateProfileImage(data);
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
        function newImageUpdate(){
          var imageFile = fileData.image;
          var timeStamp = Date.now();
          var fileName = timeStamp + imageFile.name;
          var folderpath = PATH_LOCATIONS.user_point_image_path;
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
                    data.image = fileName;
                  updateProfileImage(data);
                    
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
        function updateProfileImage(fileName) {
          //console.log("fileName---->", fileName);

          point.updateOne({
            _id: data._id
          }, {
            $set: {
              image: fileName.image,
              point: data.point,
              activity_id: data.activity_id,
              note: data.note,
              others_activity: data.others_activity == "null" ? null : data.others_activity
            }
          }, function (err, resUpdate) {
            //console.log("====================with file ddata====resUpdate===============>", resUpdate);

            if (err) {
              callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "error": err,
                "success": false,
                "error": true,
              });
            } else {
              callback({
                "success": true,
                "error": false,
                "message": "Point updated successfully",
                "response_code": 2000,
                "response_data": PATH_LOCATIONS.user_point_image_path_view + data.image
              });
            }
          });

        };


         function callmethods() {
           let newPic=0;

          point.findOne({
            _id: data._id,
            user_id: data.user_id
          }, {
            image: 1
          },
            function (err, result) {
              console.log("result---->", result);

              if (result !== null) {
                if (result.image === null) {

                 newPic=1;
                 
                }
              }

            });

           console.log("===========imageflag===========",typeof data.imageFlag);
           if(newPic==1)
              newImageUpdate();

          else if (data.imageFlag=='false')
              removePreviousImage();
          else if(data.imageFlag=='true')
              removePreviousImageAndUpdate();
           
        }
        callmethods();
      }

    }
  },


  // updatePointsDemo:async (data, fileData, callback) => {
  //   if (!data.user_id || typeof data.user_id === undefined) {
  //     callback({
  //       "response_code": 5002,
  //       "message": "please provide user id",
  //       "response_data": {}
  //     });

  //   } else if (!data._id || typeof data._id === undefined) {
  //     callback({
  //       "response_code": 5002,
  //       "message": "please provide point id",
  //       "response_data": {}
  //     });
  //   } else if (!data.point || typeof data.point === undefined) {
  //     callback({
  //       "response_code": 5002,
  //       "message": "please provide points",
  //       "response_data": {}
  //     });
  //   } else if (!data.activity_id || typeof data.activity_id === undefined) {
  //     callback({
  //       "response_code": 5002,
  //       "message": "please provide activity id",
  //       "response_data": {}
  //     });
  //   }
  //   else{
  //     if (!fileData || typeof fileData === undefined && imageFlag==true) {
  //       console.log("========================fileData===============>", fileData);

  //      // console.log("filedata not ", fileData);
  //      point.updateOne({
  //        _id: data._id,
  //        user_id: data.user_id
  //      }, {
  //        $set: {
  //          point: data.point,
  //          activity_id: data.activity_id,
  //          note: data.note,
  //          others_activity: data.others_activity == "null" ? null : data.others_activity
  //        }
  //      }, function (err, resUpdate) {

  //        //console.log("====================no file ddata====resUpdate===============>", resUpdate);

  //        if (err) {
  //          callback({
  //            "response_code": 5005,
  //            "message": "INTERNAL DB ERROR",
  //            "error": err,
  //            "success": false,
  //            "error": true
  //          });
  //        } else {
  //          callback({
  //            "response_code": 2000,
  //            "message": "Points updated successfully",
  //            "success": true,
  //            "error": false
  //          });
  //        }
  //      });
  //   }
  //   else{

  //   }
  // }
  // },



  // deletePoints: async function (data, callback) {
  //   if (!data._id || typeof data._id === undefined) {
  //     callback({
  //       response_code: 5002,
  //       message: "please provide point id",
  //       response_data: {},
  //     });
  //   } else {
  //     point.findOne(
  //       {
  //         _id: data._id,
  //       },
  //       function (err, result) {
  //         if (err) {
  //           callback({
  //             response_code: 5005,
  //             message: "INTERNAL DB ERROR",
  //             response_data: {},
  //             success: false,
  //             error: true,
  //           });
  //         } else {
  //           if (result == null) {
  //             callback({
  //               response_code: 2008,
  //               message: "data not exist",
  //               response_data: result,
  //             });
  //           } else {
  //             point.remove(
  //               {
  //                 _id: data._id,
  //               },
  //               function (err, result) {
  //                 if (err) {
  //                   callback({
  //                     response_code: 5005,
  //                     message: "INTERNAL DB ERROR",
  //                     response_data: err,
  //                     success: false,
  //                     error: true,
  //                   });
  //                 } else {
  //                   callback({
  //                     response_code: 2000,
  //                     message: "Points deleted successfully.",
  //                     success: true,
  //                     error: false,
  //                   });
  //                 }
  //               }
  //             );
  //           }
  //         }
  //       }
  //     );
  //   }
  // },
  pointHistory: async (data, callback) => {
    try {
      if (!data.user_id || typeof data.user_id === undefined) {
        callback({
          response_code: 5002,
          message: "please provide user id",
          response_data: {},
        });
      }

      var weeks = [],
        startDate = "",
        endDate = "",
        weeklyPoint = [],
        query = {};

      var weekStartDate = data.weekStartDate;
      weekStartDate = new Date(weekStartDate);
      weekStartDate.setHours(0, 0, 0, 0);
      var weekEndDate = data.weekEndDate;
      weekEndDate = new Date(weekEndDate);
      weekEndDate.setHours(23, 59, 59, 999);
      // console.log(`WeekStartDate:--------- ${weekStartDate}`);
      //   console.log(`End Date:--------- ${weekEndDate}`);
      for (let i = 0; i < 8; i++) {
        startDate = new Date(weekStartDate.setDate(weekStartDate.getDate()));
        startDate = new Date(startDate.setDate(startDate.getDate() - i * 7));
        endDate = new Date(weekEndDate.setDate(weekEndDate.getDate()));
        endDate = new Date(endDate.setDate(endDate.getDate() - i * 7));
        // console.log(`WeekStartDate: ${startDate}`);
        // console.log(`End Date: ${endDate}`);
        weeks.push({
          title: `Week-${i + 1}`,
          start: startDate,
          end: endDate,
        });
      }

      if (weeks.length > 0) {
        for (i = 0; i < weeks.length; i++) {
          var WstartDate = weeks[i].start;
          var WendDate = weeks[i].end;

          query["user_id"] = data.user_id;
          query["date"] = { $gte: WstartDate, $lte: WendDate };

          let pointLog = await Point.find(query).sort({
            date: -1,
          });
          var totalPoint = 0;
          if (pointLog.length > 0) {
            pointLog.map((item) => {
              totalPoint += item.point;
            });
          }
          var point_history = {};
          point_history["total_point"] = totalPoint;
          point_history["start_date"] = weeks[i].start;
          weeklyPoint.push(point_history);
        }
      }

      // var days = 70; // 10 weeks
      // var todayDate = new Date();
      // var last = new Date(todayDate.getTime() - (days * 24 * 60 * 60 * 1000));
      // var day = last.getDate();
      // var month = last.getMonth() + 1;
      // var year = last.getFullYear();

      // const tenWeekAgoDate = new Date(year, month - 1, day + 1);

      // const allPoints = await Point.find(
      //   {
      //     $and: [
      //       { user_id: data.user_id },
      //       {
      //         date: {
      //           $gt: tenWeekAgoDate,
      //           $lt: todayDate
      //         }
      //       }
      //     ]
      //   }
      // )

      // var totalPoint = 0;
      // allPoints.forEach(key => {
      //   totalPoint += key.point;
      // })
      callback({
        response_data: weeklyPoint,
        response_code: 2000,
        message: "Weekly point of last 8 weeks.",
        success: true,
        error: false,
      });
    } catch (error) {
      console.log(error);
      callback({
        response_code: 5005,
        message: "INTERNAL DB ERROR",
        response_data: error,
        success: false,
        error: true,
      });
    }
  },
};

module.exports = PointService;
