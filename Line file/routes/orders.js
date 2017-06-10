var mysql = require('mysql');
var index = require('./index.js');
var request = require('request');

// to establish connection to mysql database
var connection = mysql.createConnection({
    host     : 'localhost',
    port: 3306, //Port number to connect to for the DB.
    user     : 'root', //!!! NB !!! The user name you have assigned to work with the database.
    password : 'mm123456', //!!! NB !!! The password you have assigned
    database : 'fis_assignment' //!!! NB !!! The database you would like to connect.
});

var express = require('express');
var router = express.Router();

//receive POST request from Index.html including the data of order and insert data into "orders" table in "fis_assignment" database.
router.route('/')
    .post(function(req,res) {
        if (typeof (req.body.frame) === "string"){
            var order_id = new Date().getTime();
            connection.query('insert into orders (frame_type,frame_color,screen_type,screen_color,' +
                'keyboard_type,keyboard_color,order_quantity,order_status,order_id) values ("' + req.body.frame + '", "'
                + req.body.framecolor + '",' + ' "' + req.body.screen + '", "' + req.body.screencolor + '", "' + req.body.key + '", "' + req.body.keycolor + '",' +
                ' "' + req.body.quantity + '","In process","'+order_id+'")',function (err, result) {
                if (err) {
                    console.log('\Please try again!');
                }
                else {
                    res.end("New order created ");
					//This part is written for working with real line.
					//GET Request to app.js to start the process of control of real line by Raspberry pi.
                     /* request({
                             url: 'http://localhost:3333/startprocess',
                             method: "GET"
                         },function (err, res, body) {
                             if(err){
                                 console.log(err.code +" "+ err.address +"/"+ err.port);
                             }else{
                                 console.log(body);
                             }
                         }
                     ); */
                }
            });
        }else{
            var count = req.body.framecolor.length ;
            console.log(count);

            for (var i = 0 ; i < count ; i++) {
                var pallet_number = req.body.quantity[i];
                order_id = new Date().getTime();
                connection.query('insert into orders (frame_type,frame_color,screen_type,screen_color,' +
                    'keyboard_type,keyboard_color,order_quantity,order_status,order_id) values ("' + req.body.frame[i] + '", "'
                    + req.body.framecolor[i] + '",' + ' "' + req.body.screen[i] + '", "' + req.body.screencolor[i] + '", "' + req.body.key[i] + '", "' + req.body.keycolor[i] + '",' +
                    ' "' + req.body.quantity[i] + '","In process","'+order_id+'")',function (err, result) {
                    if (err) {
                        console.log('\Please try again!');
                        return;
                    }
                    else {
                        res.end("New order created ");

                    }
                });
            }

            //This part is written for working with real line.
			//GET Request to app.js to start the process of control of real line by Raspberry pi.
                     /* request({
                             url: 'http://localhost:3333/startprocess',
                             method: "GET"
                         },function (err, res, body) {
                             if(err){
                                 console.log(err.code +" "+ err.address +"/"+ err.port);
                             }else{
                                 console.log(body);
                             }
                         }
                     ); */
        }
    });

module.exports = router;

