/**
 * Created by Administrator on 2015/4/15.
 * 文件对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

var Users = require('./Users');

var BottlesSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    user : { type: String, ref: 'Users'}, // person who drop the bottle
    position: {
        lat : Number,
        lng : Number,
    },
    voice: String, // base64 encoding
});

BottlesSchema.statics = {

    getAllByPosition : function(res, position, callBack){
        Bottles.find({}).populate('user').exec(function(err, bottlesList){
            if(err){
                res.json({
                    errno: 1,
                    message: err,
                });
            }
            let rangesList = [];
            for (let i = 0; i < bottlesList.length; i++) {
                let bottle = bottlesList[i];
                let d = Bottles.GetDistance(position.lat, position.lng, bottle.position.lat, bottle.position.lng);
                if (d < 500) rangesList.push(bottle);
            }
            callBack(rangesList);
        });
    },

    EARTH_RADIUS : 6378.137, //地球半径

    rad: function(d) {
        return d * Math.PI / 180.0;
    },

    GetDistance : function(lat1, lng1, lat2, lng2) {
        let radLat1 = Bottles.rad(lat1);
        let radLat2 = Bottles.rad(lat2);
        let a = radLat1 - radLat2;
        let b = Bottles.rad(lng1) - Bottles.rad(lng2);

        let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a/2),2) +
            Math.cos(radLat1)*Math.cos(radLat2)*Math.pow(Math.sin(b/2),2)));
        s = s * Bottles.EARTH_RADIUS;
        s = Math.round(s * 10000) / 10000;
        return s;
    }

};


var Bottles = mongoose.model("Bottles", BottlesSchema);

module.exports = Bottles;

