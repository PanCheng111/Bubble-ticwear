/**
 * Created by Administrator on 2015/4/15.
 * 文件对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

var UsersSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    deviceId: String,
    gender:  String, // 'male' or 'female'
    photoUrl : String, // avatorId file name
    talkedList : [{type: String, ref : "Users"}],
    unreadList : [{type: String, ref : "Users"}],
    pendingMessage : [
        {
            from_id : String,
            to_id : String,
            voice : String,
        }
    ],
});

UsersSchema.statics = {

    getOneItem : function(res, targetId, callBack){
        Users.findOne({'_id' : targetId}).populate('talkedList').populate('unreadList').exec(function(err, user){
            if(err){
                res.end(err);
            }
            callBack(user);
        })
    },

    addTalkedList : function(targetId, user, callBack) {
        Users.update({'_id' : targetId}, {$addToSet: {'talkedList': user}}, function(err) {
            callBack(err);
        });
    },

    addUnReadList : function(targetId, user, callBack) {
        Users.update({'_id' : targetId}, {$addToSet: {'unreadList' : user}}, function(err) {
            callBack(err);
        });
    },

    delUnReadList : function(targetId, user, callBack) {
        Users.update({'_id' : targetId}, {$pull: {'unreadList' : user._id}}, function(err) {
            callBack(err);
        });        
    },

    getUsersInfo : function(socket, userid, callBack) {
        Users.findOne({_id: userid}).populate('talkedList').populate('unreadList').exec(function(err, user) {
            if (err) socket.emit('getTalkedList-reply', {
                errno: 1,
                message: err,
            });
            else {
                callBack(user);
            }
        });
    },

    addPendingMessage : function(targetId, userid, voice, callBack) {
        Users.update({'_id' : targetId}, {$push: {'pendingMessage': {from_id: userid, to_id: targetId, voice: voice}}}, function(err) {
            callBack(err);
        })
    },

    getPendingMessage : function(socket, userid, fromid, callBack) {
        Users.findOne({_id: userid}, function(err, user) {
            if (err) socket.emit('pullPendingMessage-reply', {
                errno: 1,
                message: err,
            });
            else {
                let list = user.pendingMessage;
                let pendingList = [];
                for (let i = 0; i < list.length; i ++) {
                    if (list[i].from_id == fromid) pendingList.push(list[i]);                
                }

                Users.delUnReadList(userid, new Users({_id: fromid}), function(err) {
                    if (err) console.log("del unreadlist failed!\n");
                        else console.log("del unreadlist success\n");
                });

                Users.update({_id: userid}, {$pull: {'pendingMessage': {from_id: fromid}}}, function(err) {
                    if (err) socket.emit('pullPendingMessage-reply', {
                        errno: 1,
                        message: err,
                    });
                    else {
                        callBack(pendingList);
                    }
                })
            }
        });
    }
};


var Users = mongoose.model("Users", UsersSchema);

module.exports = Users;

