var express = require('express');
var router = express.Router();

var Users = require('../models/Users');
var Bottles = require('../models/Bottles');
var mongoose = require('mongoose');
var url = require('url');

var db = mongoose.connect('mongodb://127.0.0.1:27017/bubbles');

function returnRouter(io) {

var allClients = [];
io.on('connection', function (socket) {
    allClients.push(socket);

    socket.on('register_uid', function(data) {
        socket.userid = data.userid;
    });

    //socket.emit('news', { hello: 'world' });
    socket.on('send_voice', function (data) {
        console.log(data);
        Users.addTalkedList(data.from_id, new Users({_id: data.to_id}), function(err) {
            if (err) console.log("add talked list failed!\n");
        });
        Users.addTalkedList(data.to_id, new Users({_id: data.from_id}), function(err) {
            if (err) console.log("add talked list failed!\n");
        });
        let flag = false;
        for (let i = 0; i < allClients.length; i++) {
          if (allClients[i].userid == data.to_id) {
            flag = true;
            allClients[i].emit('send_voice', data);
            break;
          }
        }
        if (!flag) {
          console.log("need to pending Message");
          Users.addUnReadList(data.to_id, new Users({_id: data.from_id}), function(err) {
            if (err) console.log("add unread list failed!\n");
            else console.log('add unread list success\n');
          });
          Users.addPendingMessage(data.to_id, data.from_id, data.voice, function(err) {
            if (err) console.log("add pending message failed!\n");
            else console.log('add pending message success\n');
          })
        }
    });

    socket.on('register', function(data){
         console.log(data);
      // socket.emit('register-reply', {message:'success'});
        let deviceId = data.deviceId;
        let gender = data.gender;
        let photoUrl = data.photoUrl;
        let user = new Users({deviceId: deviceId, gender: gender, photoUrl: photoUrl});
        user.save(function(err) {
          if (err) {
            socket.emit('register-reply', {
              errno: 1,
              message : err
            }); 
          }
          else socket.emit('register-reply', {
            errno: 0,
            message : '',
            userid: user._id,
          });
        })
    });

    socket.on('queryBottles', function(data) {
      console.log(data);
      //var params = url.parse(req.url,true);
      let lat = data.lat;
      let lng = data.lng;
      let userid = data.userid;
      Bottles.getAllByPosition(socket, {lat: lat, lng: lng}, function(bottlesList) {
        socket.emit('queryBottles-reply', {
          errno: 0,
          message: '',
          bottlesList: bottlesList
        });
      });
    });

    socket.on('dropBottle', function(data) {
      console.log(data);
      let lat = data.lat;
      let lng = data.lng;
      let voice = data.voice;
      let userid = data.userid; 
      let user = new Users({_id: userid});
      let bottle = new Bottles({user: user, position: {lat: lat, lng: lng}, voice: voice});
      bottle.save(function(err) {
        if (err) {
          socket.emit('dropBottle-reply', {
            errno: 1,
            message: err,
          });
        }
        else socket.emit('dropBottle-reply', {
          errno: 0,
          message: '',
          bottleid: bottle._id,
        })
      });

      io.emit('getAllBottles-reply', {
        errno: 0,
        message: '',
        bottlesList: [bottle],
      });
    });

    socket.on('getTalkedList', function(data) {
      console.log(data);
      let userid = data.userid;
      Users.getUsersInfo(socket, userid, function(userInfo) {
        socket.emit('getTalkedList-reply', {
          errno: 0,
          message: '',
          userInfo: userInfo,
        })
      });
    });

    socket.on('getAllBottles', function() {
        Bottles.find({}, function(err, bottlesList) {
          if (err) socket.emit('getAllBottles-reply', {
              errno: 1,
              message: err,
          });
          else socket.emit('getAllBottles-reply', {
              errno: 0,
              message: '',
              bottlesList: bottlesList,
          });
        });
    });

    socket.on('pullPendingMessage', function(data) {
      console.log(data);
      let userid = data.userid;
      let fromid = data.fromid;
      Users.getPendingMessage(socket, userid, fromid, function(messageList) {
        socket.emit('pullPendingMessage-reply', {
          errno: 0,
          message: '',
          messageList: messageList,
        })
      });
    });

    socket.on('disconnect', function() {
        console.log('Got disconnect!');
        var i = allClients.indexOf(socket);
        allClients.splice(i, 1);
    })
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/register', function(req, res, next) {
  //var params = url.parse(req.url,true);
  let deviceId = req.body.deviceId;
  let sex = req.body.sex;
  let avatorIcon = req.body.avatorIcon;
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
      user: user
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
      bottle: bottle,
    })
  })
});

router.post('/queryBottles', function(req, res) {
  var params = url.parse(req.url,true);
  let lat = req.body.lat;
  let lng = req.body.lng;
  let userid = req.body.userid;
  Bottles.getAllByPosition(res, {lat: lat, lng: lng}, function(bottlesList) {
    res.json({
      errno: 0,
      bottlesList: bottlesList
    })
  })
});

router.post('/getTalkedList', function(req, res) {
  //var params = url.parse(req.url,true);
  let userid = req.body.userid;
  Users.getUsersInfo(res, userid, function(userInfo) {
    res.json({
      errno: 0,
      userInfo: userInfo,
    })
  })
});

router.post('/pullPendingMessage', function(req, res) {
  //var params = url.parse(req.url,true);
  let userid = req.body.userid;
  let fromid = req.body.fromid;
  Users.getPendingMessage(res, userid, fromid, function(messageList) {
    res.json({
      errno: 0,
      messageList: messageList,
    })
  })

});

router.get('/delAllBottles', function(req, res) {
  Bottles.remove({}, function(err) {
    if (err)
      res.json({
        errno: 1,
        message: err,
      });
      else res.json({
        errno: 0,
        message: 'del all bottles',
      })
  });
});

router.get('/getAllBottles', function(req, res) {
  Bottles.find({}, function(err, bottlesList) {
    if (err) res.json({
        errno: 1,
        message: err,
    });
    else res.json({
        errno: 0,
        message: bottlesList,
    });
  });
});

router.get('/delAllUsers', function(req, res) {
  Users.remove({}, function(err) {
    if (err)
      res.json({
        errno: 1,
        message: err,
      });
      else res.json({
        errno: 0,
        message: 'del all Users',
      })
  });
});

router.get('/getAllUsers', function(req, res) {
  Users.find({}, function(err, usersList) {
    if (err) res.json({
        errno: 1,
        message: err,
    });
    else res.json({
        errno: 0,
        message: usersList,
    });
  });
});

return router;
}



module.exports = returnRouter;
