var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var index = require('./routes/index');
var users = require('./routes/users');
var request = require('request');
var app = express();
var hostname = 'localhost';
var port = 8080;
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

// to establish connection to mysql database
var connection = mysql.createConnection({
    host     : 'localhost',
    port     :  3306, //Port number to connect to for the DB.
    user     : 'root', //!!! NB !!! The user name you have assigned to work with the database.
    password : 'mm123456', //!!! NB !!! The password you have assigned
    database : 'fis_assignment' //!!! NB !!! The database you would like to connect.
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

//periodic query to the database for receiving realtime line data
function palletInfoData() {
    setInterval(function () {
        connection.query('SELECT * FROM pallet_info', function (err, rows) {
            if (err) {
                console.error(err);
            }
            else {
                var data = [];
                var dataJSON;
                for(var i =0; i<rows.length; i++){
                    dataJSON = {"order_id": rows[i].order_id, "pallet_id":rows[i].pallet_id, "ws_num":rows[i].ws_number, "ws_zone":rows[i].ws_zone, "pallet_status":rows[i].pallet_status}
                    data.push(dataJSON);
                }
                console.log("************",data);
                io.sockets.emit('data_port', data); //emit data at this port to be used in the view.
            }
        });
    },1000);
}
//periodic query to the database for receiving realtime order data
function orderInfoData() {
    setInterval(function () {
        connection.query('SELECT * FROM orders', function (err, rows) {
            if (err) {
                console.error(err);
            }
            else {
                var dataOrder = [];
                var dataJSONOrder;
                //console.log("****order" , rows);
                for(var i =0; i<rows.length; i++){
                    dataJSONOrder = {"order_id": rows[i].order_id, "order_quantity": rows[i].order_quantity,
                                        "frame_type":rows[i].frame_type, "frame_color":rows[i].frame_color,
                                        "screen_type":rows[i].screen_type, "screen_color":rows[i].screen_color,
                                        "keyboard_type":rows[i].keyboard_type, "keyboard_color":rows[i].keyboard_color,
                                        "order_status":rows[i].order_status};
                    dataOrder.push(dataJSONOrder);
                }
                console.log("************dataOrder",dataOrder);
                io.sockets.emit('dataOrder_port', dataOrder); //emit data at this port to be used in the view.
            }
        });
    },1000);
}
orderInfoData();
//create pallet_info data when this file is started
connection.query('select * from orders where order_status = "In process"',function(err,rows) {
    if (err) {
        console.log('\Please try again!');
    }
    else {
        var count = rows.length;
        console.log(count);
        for (var i=0 ; i < count ; i++){
            var order_id = rows[i].order_id;
            var quant = rows[i].order_quantity;
            for (var j=0 ; j < quant ; j++){
                connection.query('insert into pallet_info (order_id,pallet_status) values ("'+order_id+'", "N/A")',function (err, result) {
                    if (err) {
                        console.log('\Please try again!');
                    }
                    else {
                        palletInfoData();
                    }
                });
            }
        }
    }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

server.listen(port, hostname, function(){
    console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = app;