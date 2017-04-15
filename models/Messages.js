/**
 * Created by Administrator on 2015/4/15.
 * 文件对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

var MessagesSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    from_id : String 
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
    }

};


var Users = mongoose.model("Users", UsersSchema);

module.exports = Users;

