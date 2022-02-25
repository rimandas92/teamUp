var createError = require("http-errors");
var express = require("express");
var path = require("path");
const admZip = require("adm-zip");
const fs = require("fs");

var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var favicon = require("serve-favicon");
var session = require("express-session");
var methodOverride = require("method-override");
var fileUpload = require("express-fileupload");
var app = express();
app.use(favicon(__dirname + "/public/favicon.ico"));
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
var timeOut = 60 * 10000;

// Add headers
app.use(methodOverride("X-HTTP-Method-Override"));
app.use(function (req, res, next) {
  //req.setEncoding('utf8');
  // Website you wish to allow to connect
  res.header("Access-Control-Allow-Origin", "*");
  // Request methods you wish to allow
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  // Request headers you wish to allow
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-access-token"
  );
  if ("OPTIONS" == req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(fileUpload());
var index = require("./routes/index.js");
app.use("/", index);
/** routes for admin */
var adminRoutes = require("./routes/admin/adminRoutes");
app.use("/admin", adminRoutes);
var adminUserRoutes = require("./routes/admin/userRoutes");
app.use("/admin/user", adminUserRoutes);
var cmsRoutes = require("./routes/admin/cmsRoutes");
app.use("/admin/cms", cmsRoutes);
var adminFaqRoutes = require("./routes/admin/faqRoutes");
app.use("/admin/faq", adminFaqRoutes);
var adminFeedRoutes = require("./routes/admin/feedRoutes");
app.use("/admin/feed", adminFeedRoutes);
var adminActivityRoutes = require("./routes/admin/activityRoutes");
app.use("/admin/activity", adminActivityRoutes);
var adminLeagueRoutes = require("./routes/admin/leagueRoutes");
app.use("/admin/league", adminLeagueRoutes);
var adminPointRoutes = require("./routes/admin/pointRoutes");
app.use("/admin/point", adminPointRoutes);
var adminScheduleRoutes = require("./routes/admin/scheduleRoutes");
app.use("/admin/schedule", adminScheduleRoutes);
var adminProgramRoutes = require("./routes/admin/programRoutes");
app.use("/admin/program", adminProgramRoutes);

/** routes for api */
var apiUserRoutes = require("./routes/api/userRoutes");
app.use("/api/user", apiUserRoutes);
var apiCommonRoutes = require("./routes/api/commonRoutes");
app.use("/api/common", apiCommonRoutes);
var apiPointRoutes = require("./routes/api/pointRoutes");
app.use("/api/point", apiPointRoutes);
var apiLeaguenRoutes = require("./routes/api/leagueRoutes");
app.use("/api/league", apiLeaguenRoutes);
var apiScheduleRoutes = require("./routes/api/scheduleRoutes");
app.use("/api/schedule", apiScheduleRoutes);
// var apiTraderRoutes = require('./routes/api/traderRoutes');
// app.use('/api/trader', apiTraderRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// const dump = fs.readdirSync(__dirname + "/public/uploads/point_image");
// app.get("/downloadImage", (req, res) => {
//   const zip = new admZip();
//   for (let i = 0; i < dump.length; i++) {
//     zip.addLocalFile(__dirname + "/public/uploads/point_image" + dump[i]);
//   }
//   const downloadName = `${Date.now()}.zip`;
//   const data = zip.toBuffer();

//   zip.writeZip(__dirname + "/" + downloadName);

//   res.set("Content-Type", "application/octet-stream");
//   res.set("Content-Disposition", `attachment; filename=${downloadName}`);
//   res.set("Content-Length", data.length);
//   res.send(data);
// });

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});
module.exports = app;
