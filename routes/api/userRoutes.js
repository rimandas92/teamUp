var express = require("express");
var jwt = require('jsonwebtoken');
var config = require('../../config');
var user = express.Router();
var UserService = require('../../services/userService');
const { STATUS_CONSTANTS, STATUS_MESSAGES } = require('../../utils/constant');


/******************************
 *  Register an user
 *  @method: POST
 *  @request params:
 *      email
        first_name
        last_name
        password 
 *  @url: /api/user/register_user
 ****************************************/

/******* Add Profile Image *****/
user.post('/user_image_upload', function (req, res) {
    UserService.userImageUpload(req.body.user_id, req.files, function(response) {
        res.json(response);
    });
});

user.post('/register_user', function (req, res) {
    UserService.register_user(req.body, function (response) {
        res.json(response);
    });
});

/******************************
 *  Register an user by social platform
 *  @method: POST
 *  @request params:
 *      email
        first_name
        last_name
        login_type
        social_id
        social_image 
 *    
 *  @url: /api/user/register_user_social
 ****************************************/
user.post('/register_user_social', function (req, res) {
    UserService.socialRegister(req.body, function (response) {
        res.json(response);
    });
});

/******************************
 *  Check exists user by social id
 *  @method: POST
 *  @request params:
        login_type
        social_id
 *  @url: /api/user/check_exists_user_social
 ****************************************/
user.post('/check_exists_user_social', function (req, res) {
    UserService.existsUserCheckingSocial(req.body, function (response) {
        res.json(response);
    });
});

/**************************
 * User verfication
 * @method: POST
 * @request params
 *     token
 *     agentId
 *     encAgentId
 *     encOtp
 *     mdOtp
 *     mdPassword
 * @url: /api/user/verify_email
 **************************/

user.post("/verify_email", function(req, res){
    var verificationData = req.body;
    UserService.verifyUserEmail(verificationData, function(response){
        res.send(response);
    })
 })

/******************************
 *  Register an user
 *  @method: POST
 *  @request params:
 *      email
        password 
 *    
 *  @url: /api/user/user_login
 ****************************************/
user.post('/user_login', function (req, res) {
    UserService.doLogin(req.body, function (response) {
        res.json(response);
    });
});

/******************************
 *  Resend verification email
 *  @method: POST
 *  @request params:
 *      email
 *  @url: /api/user/send_verification_email
 ****************************************/
user.post('/send_verification_email', function (req, res) {
    UserService.resendVerificationEmail(req.body, function (response) {
        res.json(response);
    });
});

/******************************
 *  Forget password email
 *  @method: POST
 *  @request params:
 *      email
 *  @url: /api/user/forget_password_email
 ****************************************/
user.post('/forget_password_email', function (req, res) {
    UserService.forgotPass(req.body, function (response) {
        res.json(response);
    });
});

/**************************
 * Reset Password
 * @method: POST
 * @request params
 *     token
 *     agentId
 *     encAgentId
 *     encOtp
 *     mdOtp
 *     mdPassword
 * @url: /api/user/reset_password
 **************************/

user.post("/reset_password", function(req, res){
    var verificationData = req.body;
    UserService.resetPassword(verificationData, function(response){
        res.send(response);
    })
 })
/******************************
 *  Middleware to check token
 ******************************/
user.use(function (req, res, next) {
    var token = req.body.token || req.params.token || req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, config.secret, function (err, decoded) {
            if (err) {
                res.send({
                    success: false,
                    error: true,
                    status: STATUS_CONSTANTS.AUTHENTICATION_FAILED, 
                    message: "Failed to authenticate or token expired."
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        res.send({
            success: false,
            error: true,
            message: "Please provide token"
        });
    }
});

/******************************
 *  Change password email
 *  @method: POST
 *  @request params:
 *      old_password //md5
 *      new_password //md5
 *  @url: /api/user/change_password
 ****************************************/
user.post('/change_password', function (req, res) {
    UserService.changePassword(req.decoded.id, req.body, function (response) {
        res.json(response);
    });
});

user.post('/user/unsubsrcible', function(req, res) {
  UserService.userUnsubscribe(req.decoded.id, function(response) {
    res.json(response);
  })
})

/******************************
 *  User details
 *  @method: POST
 *  @request params:
 *  user_id
 *  @url: /api/user/user_details
 ****************************************/
user.post('/user_details', function (req, res) {
    UserService.userDetails(req.decoded.id, req.body, function (response) {
        res.json(response);
    });
});

/******************************
 *  User update
 *  @method: POST
 *  @request params:
 *  email
 *  phone
    first_name
    last_name
    profile_image
 *  @url: /api/user/user_update
 ****************************************/
user.post('/user_update', function (req, res) {
    UserService.userEdit(req.decoded.id, req.body, req.files,function (response) {
        res.json(response);
    });
});


/**************************
 * Search User
 * @method: POST
 * @request params
 *      search_key
 * @url: /api/user/user_search
 **************************/

user.post("/user_search", function(req, res){
    var userData = req.body;
    userData.status = 1;
    userData.user_id_eleminate = req.decoded.id;
    UserService.userSearch(userData, function(response){
        res.send(response);
    })
});

module.exports = user;
