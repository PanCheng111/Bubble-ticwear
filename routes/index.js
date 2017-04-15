var express = require('express');
var router = express.Router();

var Users = require('../models/Users');
var Bottles = require('../models/Bottles');
var mongoose = require('mongoose');
var url = require('url');

var db = mongoose.connect('mongodb://127.0.0.1:27017/bubbles');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/register', function(req, res, next) {
  var params = url.parse(req.url,true);
  let deviceId = params.query.deviceId;
  let sex = params.query.sex;
  let avatorIcon = params.query.avatorIcon;
  let user = new Users({deviceId: deviceId, sex: sex, avatorIcon: avatorIcon});
  user.save(function(err) {
    if (err) {
      res.json({
        errno: 1,
        message : err
      });
    }
    else res.json({
      errno: 0,
      userid: user._id
    });
  })
});

router.get('/dropBottles', function(req, res){
  var params = url.parse(req.url,true);
  let lat = params.query.lat;
  let lng = params.query.lng;
  let voice = params.query.voice;
  let userid = params.query.userid; 
  let user = new Users({_id: userid});
  let bottle = new Bottles({user: user, position: {lat: lat, lng: lng}, voice: voice});
  bottle.save(function(err) {
    if (err) {
      res.json({
        errno: 1,
        message: err,
      });
    }
    else res.json({
      errno: 0,
      bottleid: bottle._id,
    })
  })
});

router.get('/queryBottles', function(req, res) {
  var params = url.parse(req.url,true);
  let lat = params.query.lat;
  let lng = params.query.lng;
  let userid = params.query.userid;
  Bottles.getAllByPosition(res, {lat: lat, lng: lng}, function(bottlesList) {
    res.json({
      errno: 0,
      bottlesList: bottlesList
    })
  })
});


module.exports = router;
