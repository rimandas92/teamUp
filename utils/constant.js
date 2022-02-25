var config = require('../config');
module.exports.STATUS_CONSTANTS = {
    REGISTER_SUCCESS: 1,
    REGISTER_FAIL: -1,
    AUTHENTICATION_FAILED: -2,
    USER_AUTHENTICATED: 2,
    USER_ALREADY_EXIST: 3,
    USER_DOES_NOT_EXIST: -3,
    INTERNAl_DB_ERROR: -5,
    IMAGE_UPLOADED_SUCCESSFULLY: 4,
    IMAGE_UPLOADED_FAILED: -4,
    SESSION_EXPIRED: -8,
    ACCOUNT_NOT_VERIFIED: -1,
    FAIL: 0,
    LOGIN_TYPES: {
        FB: 'FB',
        GOOGLE: 'GOOGLE',
        NORMAL: 'NORMAL'
    },
    SERVER_ERROR: 500
};
module.exports.STATUS_MESSAGES = {
    REGISTER_SUCCESS: "User Successfully created.",
    REGISTER_FAIL: "Could not save user please check.",
    USER_AUTHENTICATED: "User Successfully Logged in.",
    USER_ALREADY_EXIST: "Sorry, this user already exists.",
    INTERNAl_DB_ERROR: "Internal DB error.",
    IMAGE_UPLOADED_FAILED: "Image uploaded Failed",
    SESSION_EXPIRED: "Sorry...! your session has timed out , please login again",
    AUTHENTICATION_FAILED: "Authentication failed",
    SUCCESSFULLY_CREATED: "Successfully created",
    ERROR_SAVING: "Could not save to to database please check",
    ALREADY_EXISTS: "Already exits",
    NOT_FOUND: "Not found",
    LOGGED_OUT: "Logout successfull",
    USER_DOES_NOT_EXIST: "User does not exist",
    IMAGE_UPLOADED_SUCCESSFULLY: "Image uploaded and updated successfully",
    EMAIL_REQUIRED: "Please add a valid email",
    USER_REQUIRED: "Please add a valid user name",
    USERTYPE_REQUIRED: "Please add a user type",
    PASSWORD_REQUIRED: "Please provide a passord",
    ACCOUNT_NOT_VERIFIED: "Sorry...! Your email has not been verified yet",
    SERVER_ERROR: "Internal server error"
}
module.exports.PATH_LOCATIONS = {
    user_profile_pic_path: './public/uploads/user/',
    user_profile_pic_path_view: config.file_base_url + 'public/uploads/user/',

    user_point_image_path: './public/uploads/point_image/',
    user_point_image_path_view: config.file_base_url + 'public/uploads/point_image/',
    
    team_image_path: './public/uploads/team_image/',
    team_image_path_view: config.file_base_url + 'public/uploads/team_image/',
    // cms_pic_path: './public/uploads/cms/',
    // cms_pic_path_view: config.file_base_url + 'public/uploads/cms/',
    feed_video_path: './public/uploads/feed_video/',
    feed_video_path_view: config.file_base_url + 'public/uploads/feed_video/',
    feed_audio_path: './public/uploads/feed_audio/',
    feed_audio_path_view: config.file_base_url + 'public/uploads/feed_audio/',
}
module.exports.URL_PATHS = {
    user_verification_url: 'http://nodeserver.mydevfactory.com:6006/api/user_verification/',
    user_reset_password_url: 'http://nodeserver.mydevfactory.com:6006/api/user_reset_password/',
}
module.exports.CONSTANTS = {
    user_otp_validfor: 600000,
    record_per_page: 10
}
/*module.exports.FRONT_END = {
    baseUrl : frontEndBaseUrl,
    userProfileLink : frontEndBaseUrl + 'account/seller-profile/',
    loginLink : frontEndBaseUrl + 'account/login/',
    productLink : [
        {code: '5caf0f3803968a33adf78783', name: frontEndBaseUrl + 'product/for-sale/'},
        {code: '5caf0fa7d4275d3dd807116e', name: frontEndBaseUrl + 'product/housing/'},
        {code: '5caf0ff828c9383eedad22e2', name: frontEndBaseUrl + 'product/hosting/'},
        {code: '5caf103233bc413efd16c1ce', name: frontEndBaseUrl + 'product/real-estate/'},
        {code: '5caf107378941f3f0c2a6650', name: frontEndBaseUrl + 'product/yard-sales/'},
        {code: '5caf10b3ea752a402dee760a', name: frontEndBaseUrl + 'product/moving-sales/'},
        {code: '5caf10e7456bfc4059f2d04c', name: frontEndBaseUrl + 'product/farmers-market/'},
        {code: '5caf11172aac4c407830830b', name: frontEndBaseUrl + 'product/services/'},
        {code: '5caf1135afa71e4092b442f6', name: frontEndBaseUrl + 'product/free/'},
      ]
},*/
/*module.exports.TWILIO = {
    ACCOUNT_SID: 'AC32aae8e519ba845563f577f60c3b1236',
    AUTH_TOKEN: 'd13188d1dc02711830763857011ba27a',
    FROM_NUMBER: '+12056497637'
}*/