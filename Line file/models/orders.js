/**
 * Created by halder on 27-Jan-17.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var orderSchema = new Schema({
    order:[ {
        orderstatus : {
            type:String,
            default: ''
        },
        orderperson: [{
            name: {
                type: String,
                required: true,
                unique: false
            },
            email: {
                type: String,
                required: true,
                unique: false
            },
            phone:{
                type: String,
                required:true,
                unique:false
            }
        }],
        item: [{
            frame:{
                type:String,
                required:true,
                unique:false
            },
            framecolor:{
                type:String,
                required:true,
                unique:false
            },
            screen:{
                type:String,
                required:true,
                unique:false
            },
            screencolor:{
                type:String,
                required:true,
                unique:false
            },
            keyboard:{
                type:String,
                required:true,
                unique:false
            },
            keyboardcolor:{
                type:String,
                required:true,
                unique:false
            },
            note:{
                type:String,
                required:false,
                unique:false
            },
            quantity:{
                type: Number,
                required:true,
                unique:false
            }
        }],
        shipto:[{
            shippingname: {
                type: String,
                required: true,
                unique: false
            },
            shippingemail: {
                type: String,
                required: true,
                unique:false
            },
            shippingphone:{
                type: String,
                required:true,
                unique:false
            },
            shippingaddress: {
                type: String,
                required: true,
                unique:false
            },
            shippingcountry:{
                type:String,
                required: false,
                unique:false
            }
        }]}]}, {
    timestamps: true
});

var orders = mongoose.model('order', orderSchema);
module.exports = orders;