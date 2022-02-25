var express = require('express');
var router = express.Router();
var config = require('../config');
router.get('/', function (req, res, next) {
  res.render('index', {
    title: '200 Club'
  });
});

router.post('/', function (req, res) {

});



module.exports = router;