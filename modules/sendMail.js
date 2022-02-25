var nodemailer = require('nodemailer');
var ses = require('nodemailer-ses-transport');
var config = require('../config');
//var pdf = require('html-pdf');
//var adminLoginNotification = require('./userLoginHtml');
module.exports = function (mailType) {
    var from = config.email.MAIL_USERNAME; // set default mail here
    console.log("frommail", from);
    // define mail types
    var mailDict = {
        // "user_welcome_mail": {   // Srijan 27/01/2022
        //     subject: "Welcome to "+ config.site_name,
        //     html: require('./user_welcome_mail'),         
        // },
        "forgot_password_mail": {
            subject: "Reset Password",
            html: require('./forgot_password_mail'),
        },
        // "social_signup":{
        //     subject:"Welcome to "+ config.site_name,
        //     html: require('./social_login')                  Srijan 27/01/2022
        // },
        // "point_completed_mail": {
        //     subject: "150 points completed",
        //     html: require('./point_completed_mail'),            Srijan 27/01/2022
        // },
        // "create-team-mail": {
        //   subject: "Team has been created",
        //   html: require('./create-team-mail'),               Srijan 27/01/2022
        // },
        /*"agent_login_otp_mail": {
            subject: "Login otp request",
            html: require('./agent_login_otp_mail'),
        },
        "agent_forget_password_otp_mail": {
            subject: "Reset Password",
            html: require('./agent_forget_password_mail'),
        },
        "trader_registration_mail": {
            subject: "Welcome trader to "+ config.site_name,
            html: require('./trader_welcome_mail'),
        },
        "trader_details_update_mail": {
            subject: config.site_name + " profile update",
            html: require('./trader_update_mail'),
        },*/
        /*"welcomeMail": {
            subject: "Welcome to 200-club",
            html: require('./welcomeUserMail'),
        },
        "socialSignUp":{
            subject:"Welcome to 200-club",
            html: require('./social_login')
        },
        "productLikeMail": {
            subject: "Your product is liked",
            html: require('./productLikeMail'),
        },
        "adminMessageMail": {
            subject: "Admin Message",
            html: require('./adminMessageMail'),
        },
        "welcomeVerifiedUserMail": {
            subject: "Welcome to 200-club",
            html: require('./welcomeVerifiedUserMail'),
        },*/
    }
    // create reusable transporter object using the default SMTP transport to send mail from this account
    var secretPass = config.email.MAIL_PASS;
    var transporter = nodemailer.createTransport(ses({
        accessKeyId: 'AKIAJSS73OSVXDEZCXKQ',
        secretAccessKey: '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'
    }));
    // var transporter = nodemailer.createTransport(require('nodemailer-smtp-transport')({
    //     host: "smtp.gmail.com",
    //     port: 465,
    //     secure: true,
    //     debug: true,
    //     auth: {
    //         user: config.email.MAIL_USERNAME,
    //         //pass: new Buffer(secretPass, 'base64').toString('ascii'),
    //         pass: new Buffer.from(secretPass, 'base64').toString('ascii'),
    //         //xoauth2 : "U01UQ0tHczZuaVZGWUJnQ3BpbU5CQTVDWWwzYU1oNnJoNU9iMDFSVk5LMSszSURRY3pkTVVuOXo5WlJXMWpOc1o3YkhOc0kvMnBrPQ=="
    //     },
    //     maxMessages: 100,
    //     requireTLS: true,
    // }));
    
    return function (to, data, sendFileName, filePath, fileType) {  // pass mailbody only when sendPdf is true
        data.logo_path = config.logo_path;
        data.siteName = config.site_name;
        console.log("data", data);
        console.log("to", to);
        console.log("from", from);
        //console.log("mailDict", mailDict);
        //console.log("mailType", mailType);
        var self = {
            send: function () {
                var mailOptions = mailDict[mailType];
                mailOptions.from = from;
                mailOptions.to = to; // to;
                mailOptions.html = self.handleVars(mailOptions.html, data);
                if (sendFileName) {
                    if (fileType == 'png') {
                        var contentType = 'image/png';
                    } else if (fileType == 'jpeg' || fileType == 'jpg') {
                        var contentType = 'image/jpeg';
                    } else if (fileType == 'gif') {
                        var contentType = 'image/gif';
                    } else if (fileType == 'pdf') {
                        var contentType = 'application/pdf';
                    }
                    mailOptions.attachments = [{
                        filename: sendFileName,
                        path: filePath,
                        contentType: contentType
                    }];
                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                            return;
                        }
                        console.log('Message sent with pdf: ' + info.response);
                    });
                    // pdf.create( self.handleVars(pdfTemplate, data)).toBuffer(function(err, b) {
                    //     // template becomes pdf so pass mailbody
                    //     mailOptions.attachments = [{
                    //             filename : 'Monthly Statement.pdf',
                    //             contentType : 'application/pdf',
                    //             content  : b
                    //         }];
                    //     // send mail with defined transport object
                    //     transporter.sendMail(mailOptions, function(error, info){
                    //         if(error){
                    //             console.log('Error sending mail');
                    //             console.log(error);
                    //             return ;
                    //         }
                    //         console.log('Message sent with pdf: ' + info.response);
                    //     });
                    // })
                } else {
                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, function (error, info) {
                        console.log('info== \n',info);
                        console.log('error== \n',error);
                        if (error) {
                            console.log(error);
                            return;
                        }
                        console.log('Message sent: ' + info.response);
                    });
                }
            },
            transporter: transporter,
            getMappedValue: function (s, o) { // cannot handle arrays
                var l = s.split(".");
                var r = o;
                if (l.length > 0) {
                    l.forEach(function (v, i) {
                        if (v && r[v] !== undefined) {
                            r = r[v];
                        }
                    })
                    return r;
                }
                return undefined;
            },
            handleVars: function (html, o) {
                (html.match(/\{\{\s+([^}]*)\s+\}\}/g) || []).forEach(function (w, i) {
                    var s = w.replace(/^\{\{\s+/, "").replace(/\s+\}\}$/, "");
                    var v = self.getMappedValue(s, o);
                    // handle special cases that need processing
                    // date
                    if (s === 'publishedDate' && v != undefined) {
                        // locale format date
                        v = new Date(v).toString();
                    }
                    if (s === '@validUpto' && v === null) {
                        v = 'NA';
                    }
                    if (s === '@userTotalSpace' && v === null) {
                        v = 0;
                    }
                    if (s === '@userFreeSpace' && v === null) {
                        v = 0;
                    }
                    if (s === '@currentPlan' && v === null) {
                        v = 'Freedom';
                    }
                    if (s === '@userJunkSpace' && v === null) {
                        v = 0;
                    }
                    // replace
                    if (v !== undefined) {
                        html = html.replace(w, String(v));
                    }
                })
                return html;
            },
        };
        return self;
    }
}
// usage
// require("./modules/sendmail")('userSignupSuccess')("to@to.to", data).send();
