var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cons = require('consolidate');
var mysql = require('mysql');
var request = require('request');

var routes = require('./routes/index');
var orders = require('./routes/orders');

// to establish connection to mysql database
var connection = mysql.createConnection({
    host     : 'localhost',
    port     :  3306, //Port number to connect to for the DB.
    user     : 'root', //!!! NB !!! The user name you have assigned to work with the database.
    password : 'mm123456', //!!! NB !!! The password you have assigned
    database : 'fis_assignment' //!!! NB !!! The database you would like to connect.
});

var express = require('express');
var app = express();

// view engine setup
app.engine('html', cons.swig);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);
app.use('/orders', orders);

var hostname = 'localhost';
var port = 3333;

// to update the status of order in "orders" table of "fis_assignment" database when all phones are completed.
function order_update(quant, orderID_Number){
    connection.query('SELECT *  FROM pallet_info where order_id = "'+orderID_Number+'" and  pallet_status <> "N/A" ',function (err, rows) {
        if (err) {
            res.send(err)
        }
        else {
            var checkLength = rows.length;
            var counter = 0;
            if (checkLength === quant){
                for(var j = 0 ; j < quant ; j++) {
                    if (rows[j].pallet_status === "4"){
                        counter++;
                    }
                }
                if (counter === quant){
                    connection.query('UPDATE orders SET order_status = "completed" WHERE order_id = "' + orderID_Number + '" ', function (err, rows) {
                        if (err) {
                            console.error(err);
                        }
                        else {
                            console.log("The status of " + orderID_Number + "changed to completed." );
                        }
                    });

                }
            }
        }
    });
}

// to update the status of order in "orders" table of "fis_assignment" database when all phones are completed.
function order_status_check() {
    connection.query('SELECT *  FROM orders where order_status = "In process" ',function (err, rows) {
        if (err) {
            res.send(err)
        }
        else {
            var count = rows.length;
            var i = 0;
            var orderID_Number = rows[i].order_id;
            var quant = rows[i].order_quantity;
            for(var j = 0 ; j < count ; j++) {
                order_update(quant, orderID_Number);
            }
        }
    });
}

//receive notifications from simulator and upadte the location and status of pallets in "pallet_info" table in "fis_assignment" database.
app.post('/notifs', function (req,res) {
    console.log(req.body);
    var event = req.body.id;
    var sender = req.body.senderID;
    var WS_ID = "WS" + sender.substr(6, 2);
    var WS_number = sender.substr(6, 2);
    var pallet_id = req.body.payload.PalletID;
    console.log('the pallet id is '+ pallet_id);
    if (pallet_id != -1) {
        switch (event) {
            case "Z1_Changed": {
                connection.query('UPDATE pallet_info SET ws_number = "'+ WS_number +'", ws_zone = "1" WHERE pallet_id = "'+ pallet_id +'" ', function (err, rows) {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        console.log("pallet " + pallet_id + "is in Z1 of " + WS_ID );
                    }
                });
                break;
            }
            case "Z2_Changed": {
                connection.query('SELECT * FROM pallet_info WHERE ws_zone = "1" and ws_number = "'+ WS_number +'" ', function (err, rows) {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        var pallet_id = rows[0].pallet_id;
                        console.log('pallet id is in ws 8 '+pallet_id);
                        connection.query('UPDATE pallet_info SET ws_zone = "2" WHERE pallet_id = "' + pallet_id + '" ', function (err, rows) {
                            if (err) {
                                console.error(err);
                            }
                            else {
                                console.log("pallet " + pallet_id + "is in Z2 of " + WS_ID );
                            }
                        });
                    }
                });
            }
                break;

            case "Z3_Changed": {
                setTimeout(function() {
                    if (Z3_flag == false ){
                        if( WS_number == 7 ){
                            connection.query('SELECT * FROM pallet_info WHERE ws_zone = "2" and ws_number = "'+ WS_number +'" ', function (err, rows) {
                                if (err) {
                                    console.error(err);
                                }
                                else {
                                    var pallet_id = rows[0].pallet_id;
                                    var palletStatus = rows[0].pallet_status;
                                    var order_Id = rows[0].order_id;
                                    if (palletStatus == 4){
                                        connection.query('delete from pallet_info where pallet_id = "'+ pallet_id +'" ', function (err, rows) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            else {
                                                connection.query('select * from orders where order_id = "'+ order_Id +'" ', function (err, rows) {
                                                    if (err) {
                                                        console.error(err);
                                                    }
                                                    else {
                                                        var number = parseInt(rows[0].order_quantity)-1;
                                                        connection.query('update orders set order_quantity = "'+ number +'"   where order_id = "'+ order_Id +'" ', function (err, rows) {});
                                                    }
                                                });

                                            }
                                        });
                                    }else{
                                        connection.query('UPDATE pallet_info SET ws_zone = "3" WHERE pallet_id = "' + pallet_id + '" ', function (err, rows) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            else {
                                                console.log("pallet " + pallet_id + "is in Z3 " + WS_ID );
                                            }
                                        });
                                    }

                                }
                            });
                        }else{
                            connection.query('SELECT * FROM pallet_info WHERE ws_zone = "2" and ws_number = "'+ WS_number +'" ', function (err, rows) {
                                if (err) {
                                    console.error(err);
                                }
                                else {
                                    console.log(rows);
                                    var pallet_id = rows[0].pallet_id;
                                    connection.query('UPDATE pallet_info SET ws_zone = "3" WHERE pallet_id = "' + pallet_id + '" ', function (err, rows) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        else {
                                            console.log("pallet " + pallet_id + "is in Z3 " + WS_ID );
                                        }
                                    });
                                }
                            });
                        }
                    }
                },200);
                break;
            }
            case "Z4_Changed": {
                connection.query('SELECT * FROM pallet_info WHERE ws_zone = "1" and ws_number = "'+ WS_number +'" ', function (err, rows) {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        var pallet_id = rows[0].pallet_id;
                        connection.query('UPDATE pallet_info SET ws_zone = "4" WHERE pallet_id = "' + pallet_id + '" ', function (err, rows) {
                            if (err) {
                                console.error(err);
                            }
                            else {
                                console.log("pallet " + pallet_id + "is in Z4 of " + WS_ID );
                            }
                        });
                    }
                });

                break;
            }
            case "Z5_Changed": {
                if (WS_number == "7"){
                    Z3_flag = false;
                }

                break;
            }
            case "PalletLoaded": {
                global.Z3_flag = true;
                connection.query('UPDATE pallet_info SET ws_zone = "3",pallet_id = "'+pallet_id+'",ws_number = "'+WS_number+'",pallet_status = "0" WHERE pallet_status = "N/A" ORDER BY id ASC limit 1', function (err, rows) {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        console.log("pallet " + pallet_id + "loaded " + WS_ID );
                    }
                });
                break;
            }
            case "DrawEndExecution": {
                connection.query('SELECT * FROM pallet_info WHERE ws_zone = "3" and ws_number = "'+ WS_number +'" ', function (err, rows) {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        console.log(rows);
                        var pallet_id = rows[0].pallet_id;
                        var pallet_status = parseInt(rows[0].pallet_status) + 1;
                        console.log(pallet_id,pallet_status);
                        connection.query('UPDATE pallet_info SET pallet_status = "'+pallet_status+'" WHERE pallet_id = "' + pallet_id + '" ', function (err, rows) {
                            if (err) {
                                console.error(err);
                            }
                            else {
                                console.log("pallet status of " + pallet_id + "is  " + pallet_status );
                                order_status_check();
                            }
                        });
                    }
                });
                break;
            }
            case "PaperLoaded": {
                connection.query('SELECT * FROM pallet_info WHERE ws_zone = "3" and ws_number = "'+ WS_number +'" ', function (err, rows) {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        var pallet_id = rows[0].pallet_id;
                        var pallet_status = parseInt(rows[0].pallet_status) + 1;
                        console.log(pallet_id,pallet_status);
                        connection.query('UPDATE pallet_info SET pallet_status = "'+pallet_status+'" WHERE pallet_id = "' + pallet_id + '" ', function (err, rows) {
                            if (err) {
                                console.error(err);
                            }
                            else {
                                console.log("pallet status of " + pallet_id + "is  " + pallet_status );
                            }
                        });
                    }
                });
                break;
            }

        }
    }
    res.end();
});

//This part is written for working with real line.
// receive get request from orders.js to make appropriate XML and send POST request to Raspberry Pi controller to orchestrate the real line.
/* app.get('/startprocess', function (req, res){
    connection.query('SELECT *  FROM orders where order_status = "In process" ',function (err, rows) {
        if (err) {
            res.send(err)
        }
        else {
           // console.log(rows);
            var count =rows.length;

            for(var i = 0 ; i < count ; i++) {
                var XML = '<order id="' + (i+1) + '"> ' +
                    '<product> ' +
                    '<screen model="' + rows[i].screen_type + '" color="' + rows[i].screen_color + '"/>' +
                    '<keyboard model="' + rows[i].keyboard_type + '" color="' + rows[i].keyboard_color + '"/>' +
                    '<frame model="' + rows[i].frame_type + '" color="' + rows[i].frame_color + '"/>' +
                    '</product> ' +
                    '</order>';
                console.log(XML);
                for (var j = 0; j < rows[i].order_quantity; j++) {
                    request({
                        url: 'http://192.168.1.100:1337/orchestrator/product',
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/xml',
                        },
                        body: XML,
                    }, function (err, res, body) {
                    });
                }
            }
        }
    });
}); */


//subscribe to events of Simulator.
for (var i=1; i <13; i++){
    if((i!==1)&&(i!==7)){
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z4_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+i+'/events/DrawStartExecution/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+i+'/events/DrawEndExecution/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
    }
    else{
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        if(i===1){
            request.post('http://localhost:3000/RTU/SimROB'+i+'/events/PaperLoaded/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
            request.post('http://localhost:3000/RTU/SimROB'+i+'/events/PaperUnloaded/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        }
        if(i===7){
            request.post('http://localhost:3000/RTU/SimROB'+i+'/events/PalletLoaded/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
            request.post('http://localhost:3000/RTU/SimROB'+i+'/events/PalletUnloaded/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        }
    }
}


app.listen(port, hostname, function(){
    console.log(`Server running at http://${hostname}:${port}/`);
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: {}
    });
});

module.exports = app;

