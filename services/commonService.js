var express = require("express");
var mongo = require("mongodb");
var fs = require("fs");
const AdmZip = require("adm-zip");

var ObjectID = mongo.ObjectID;
var Admin = require("../models/admin");
var jwt = require("jsonwebtoken");
var config = require("../config");
var secretKey = config.secret;
const { STATUS_CONSTANTS, STATUS_MESSAGES } = require("../utils/constant");
var checkAdminlogin = (adminData, callback) => {
  //Admin.findOne({ authtoken: adminData.token })
  var token = adminData.token;
  if (token) {
    jwt.verify(token, secretKey, function (err, decoded) {
      if (err) {
        callback({
          success: false,
          error: true,
          status: STATUS_CONSTANTS.AUTHENTICATION_FAILED,
          message: "Failed to authenticate or token expired.",
        });
      } else {
        var admin_email = decoded.email;
        Admin.findOne({ email: admin_email })
          .select("email is_admin first_name last_name phone_number")
          .exec(function (err, admin) {
            if (err) {
              callback({
                success: false,
                error: true,
                message: "Internal server error",
                errors: err,
              });
            }
            if (!admin) {
              callback({
                success: false,
                error: true,
                message: "Access denied",
                response: {},
              });
            } else if (admin) {
              callback({
                success: true,
                error: false,
                message: "Admin access granted",
                response: admin,
              });
            }
          });
      }
    });
  } else {
    callback({
      success: false,
      error: true,
      message: "Please provide token",
      response: {},
    });
  }
};
var feedDownloadImage = async function (res, callback) {
  console.log("=============dirname======", __dirname);
  console.log(fs.existsSync(__dirname + "/../public/uploads/point_image/"));
  const directoryPath = fs.readdirSync(
     __dirname + "/../public/uploads/point_image/"
    // 'http://3.135.167.66:6006/uploads/point_image/'
  );

  console.log("=============directorypath======" + directoryPath);
  console.log(__dirname + "/../public/uploads/point_image");

  // fs.readdir(directoryPath, function (err, files) {
  //     if (err) {
  //       res.status(500).send({
  //         message: "Unable to scan files!",
  //       });
  //     }
  // })
  const zip = new AdmZip();

  //   for (var i = 0; i < directoryPath.length - 1; i++) {
  //     zip.addLocalFile(directoryPath[i]);
  //   }
  for (let f in directoryPath) {
    // zip.addFile(f, new Buffer(directoryPath[f]), 'Created with OpenAPI-CodeGen');
    // zip.addFile(directoryPath[f]);
    zip.addLocalFile(__dirname + "/../public/uploads/point_image/"+directoryPath[f]);
  }

  // Define zip file name
  const downloadName = `postcard_${Date.now()}.zip`;

  const data = zip.toBuffer();

  //   zip.writeZip(__dirname + "/" + downloadName);

  // code to download zip file

  res.set("Content-Type", "application/octet-stream");
  res.set("Content-Disposition", `attachment; filename=${downloadName}`);
  res.set("Content-Length", data.length);
  res.send(data);
  callback({
    success: true,
    error: false,
    message: "downloaded",
    response: { data },
  });
};
module.exports = {
  checkAdminlogin,
  feedDownloadImage,
};
