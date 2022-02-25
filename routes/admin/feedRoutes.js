"use strict";
var express = require("express");
var adminFeed = express.Router();
var feedService = require("../../services/feedService");
var commonService = require("../../services/commonService");
/******************************
 *  Middleware to check token
 ******************************/
// adminFeed.use(function (req, res, next) {
//   //console.log(req);
//   var token =
//     req.body.token || req.params.token || req.headers["x-access-token"];
//   if (token) {
//     commonService.checkAdminlogin({ token: token }, function (response) {
//       if (response.success) {
//         next();
//       } else {
//         res.send(response);
//       }
//     });
//   } else {
//     res.send({ success: false, error: true, message: "Token required" });
//   }
// });
/******************************
 *  Create Feed
 *  @method : POST
 *  @params :
 *      date
 *      name
 *      description
 *      feed_type
 *      is_active
 *  @url: /admin/feed/feed_add/
 ********************************/
adminFeed.post("/feed_add", function (req, res) {
  feedService.create(req.body, req.files, function (response) {
    res.json(response);
  });
  // feedService.create(req.body, function (response) {
  //     res.json(response);
  // });
});
/******************************
 *  Update Feed
 *  @method : POST
 *  @params :
 *      feed_id
 *      date
 *      name
 *      description
 *      feed_type
 *      is_active
 *  @url: /admin/feed/feed_edit/
 ********************************/
adminFeed.post("/feed_edit", function (req, res) {
  feedService.update(req.body, req.files, function (response) {
    res.json(response);
  });
});
/******************************
 *  Delete feed
 *  @method : GET
 *  @params :
 *     feedId
 *  @url: /admin/feed/delete_feed/:feedId
 ********************************/
adminFeed.get("/delete_feed/:feedId", function (req, res) {
  var feedId = req.params.feedId;
  feedService.delete(feedId, function (response) {
    res.json(response);
  });
});
/******************************
 *  Get Feed List
 *  @method : POST
 *  @params :
 *      page
 *      limit
 *      date
 *      searchkey
 *      is_active
 *      feed_type //need to send if file is changed
 *  @url: /admin/feed/feed_list
 ********************************/
adminFeed.post("/feed_list", function (req, res) {
  feedService.getAllFeed(req.body, function (response) {
    res.json(response);
  });
});
/******************************
 *  Active inactive feed
 *  @method : POST
 *  @params :
 *      feedId
 *      is_active
 *  @url: /admin/feed/feed_active_inactive/:feedId
 ********************************/
adminFeed.post("/feed_active_inactive/:feedId", function (req, res) {
  var feedData = req.body;
  var feedId = req.params.feedId;
  feedService.feedActiveInactive(feedId, feedData, function (response) {
    res.json(response);
  });
});

adminFeed.get("/imageDownload", function (req, res) {
  commonService.feedDownloadImage(res, function (response) {
    // res.json(response);
    console.log("downloaded");
  });
});
module.exports = adminFeed;
