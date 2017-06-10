var path = require("path");
var orders = require('../models/orders');
var mysql = require('mysql');

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

router.get('/', function(req, res, next) {
    res.render('login');
});

//receive POST request from login.html and check the username and password in "customers" table of "fis_assignment" database.
router.post('/login', function (req, res) {
    var password = req.body.password;
    global.username = req.body.username;
    connection.query('SELECT username,password FROM Customers ',function (err, rows, fields) {
        if (err) {
            res.send(err)
        }
        else {
            var usernum = rows.length;
            for( var j = 0; j < usernum; j++) {
                var name = rows[j].username;
                if (name === req.body.username) {
                    var password1 = rows[j].password;
                    if (password1 === password) {
                        var dir = path.join(__dirname, '../', '/views');
                        res.sendFile(dir + '/index.html');
                        exports.username = username;
                    }
                    else {
                        console.log('Password is wrong ');
                        res.send('Password is not correct ');
                    }
                    break;
                }
                else if (j === usernum-1){
                    console.log('Username Error! ');
                    res.send('Username does not exist in database ');
                }
            }
        }
    });

});

//receive POST request from login.html and insert the information of new user in "customers" table of "fis_assignment" database.
router.post('/register', function (req, res) {
    connection.query('SELECT * FROM Customers', function (err, rows) {
        if (err)
        {
            console.error(err);
            console.log('\n please try again!')
        }
        else {
            var usernum = rows.length;
            for(var j = 0; j < usernum; j++) {
                var name = rows[j].username;
                if (name === req.body.username) {
                    console.log('The username already exists');
                    res.end("This username is taken. Try another.  \n");
                    break
                }
                else if (j === usernum-1){
                    console.log('ok');
                    connection.query('insert into customers (first_name,Email,username,password,last_name,admin_status,Date) values' +
                        ' ("' + req.body.firstname + '", "' + req.body.email + '", "' + req.body.username + '", "' + req.body.password + '", "'
                        + req.body.lastname + '" ,"FALSE",NOW())',function (err, result) {
                        if (err) {
                            console.error(err);
                            console.log('\Please try again!')
                            return;
                        }
                        else {
                            console.log(result)
                            console.log('\n Register Done')
                            //   res.writeHead(200,{'Content-Type':'text/plain'});
                            res.end("Register Successful \n");
                        }

                    })
                }
            }
        }
    });
});
module.exports = router;

