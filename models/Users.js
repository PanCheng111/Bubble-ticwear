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
    sex:  String, // 'male' or 'female'
    avatorIcon : String, // avatorId file name
    talkedList : [{type: String, ref: "Users"}],
});

UsersSchema.statics = {

    getOneItem : function(res, targetId, callBack){
        Users.findOne({'_id' : targetId}).populate('talkedList').exec(function(err, user){
            if(err){
                res.end(err);
            }
            callBack(user);
        })
    },

};


var Users = mongoose.model("Users", UsersSchema);

module.exports = Users;

