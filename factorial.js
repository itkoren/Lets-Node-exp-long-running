function isValid(n) {
    return !isNaN(n) && 0 < parseInt(n, 10);
}

var factorial1 = function(n) {
    var fact = 0;

    if (isValid(n)) {
        fact = 1;
        setTimeout(function(){
            console.log("TIMEOUT 0");
        }, 0);

        for (var i = 1; i <= n; i++) {
            console.log("step" + i);
            fact = fact * i;
        }

        console.log("step" + n);
    }

    return fact;
};

var factorial2 = function(n, callback){
    var fact = 0;

    if (isValid(n)) {
        fact = 1;

        setTimeout(function(){
            console.log("TIMEOUT 0");
        }, 0);

        for (var i = 1; i <= n; i++) {
            console.log("step" + i);
            fact = fact * i;
        }

        console.log("step" + n);
    }

    callback(null, fact);
};

var factorial3 = function(n, callback) {

        setTimeout(function () {
            console.log("TIMEOUT 0");
        }, 0);

        setImmediate(function () {
            var fact = 0;
            if (isValid(n)) {
                fact = 1;

                setTimeout(function () {
                    console.log("TIMEOUT 0");
                }, 0);

                for (var i = 1; i <= n; i++) {
                    console.log("step" + i);
                    fact = fact * i;
                }

                console.log("step" + n);
            }

            callback(null, fact);
        });
};

var factorial4 = function(n, callback) {
    var facter = function(fact, index, callback) {
        setTimeout(function(){
            console.log("TIMEOUT 0");
        }, 0);

        if (isValid(n)) {
            console.log("step" + index);
            fact = fact * index;

            if (index === n) {
                callback(null, fact);
                return;
            }

            setImmediate(function() {
                facter(fact, ++index, callback);
            });
        }
        else {
            callback(null, 0);
            return;
        }
    };

    setTimeout(function(){
        console.log("TIMEOUT 0");
    }, 0);

    facter(1, 1, callback);
};

var factorial5 = function(n, callback) {
    var facter = function(fact, index, callback) {
        if (isValid(n)) {
            console.log("step" + index);
            fact = fact * index;

            if (index === n) {
                callback(null, fact);
                return;
            }

            setTimeout(function () {
                console.log("TIMEOUT 0");
            }, 0);

            process.nextTick(function () {
                facter(fact, ++index, callback);
            });
        }
        else {
            callback(null, fact);
            return;
        }
    };

    setTimeout(function(){
        console.log("TIMEOUT 0");
    }, 0);

    facter(1, 1, callback);
};

var factorials = {
    "1":factorial1,
    "2":factorial2,
    "3":factorial3,
    "4":factorial4,
    "5":factorial5
};

// include the http module
var net = require("net");

// Create a TCP Server Instance and set an event listener & handler for the TCP connection event emitted by the server
var tcpServer = net.createServer(function(conn) {

    // Connection Information for Prefix Logging
    var connLogPrefix = "[" + conn.remoteAddress + ":" + conn.remotePort + "]";

    console.log(connLogPrefix, " Connected.");

    // Set an event listener & handler for the TCP data event emitted by the connection
    conn.on("data", function(data) {
        console.log(connLogPrefix, " Got Some Data: ", data);

        var values = data.split(",");
        var number = !isNaN(values[0]) ? parseInt(values[0], 10) : 0;
        var method = values[1] ? factorials[values[1].replace("\r", "").replace("\n", "")] : factorial4;

        var ret = method(number, function(err, result) {
            console.log("COMPLETED:" + result);
            conn.write("Result = " + result + "\r\n");
        });

        setTimeout(function(){
            console.log("TIMEOUT 0");
        }, 0);

        if (ret) {
            console.log("COMPLETED:" + ret);
            conn.write("Result = " + ret + "\r\n");
        }
    });

    // Set an event listener & handler for the TCP end event emitted by the connection
    conn.on("end", function(data) {
        console.log(connLogPrefix, " Bye.");
    });

    // Set the Connection Encoding to UTF-8
    conn.setEncoding("utf-8");
});

// Set an event listener & handler for error event emitted by the server
tcpServer.on("error", console.error);

// Listen on port 3000
tcpServer.listen(process.env.PORT || 3000, function() {
    console.log("TCP Server Started. Listening on Port " + tcpServer.address().port);
});