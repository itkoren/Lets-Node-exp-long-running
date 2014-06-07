function isValid(n) {
    return !isNaN(n) && 0 < parseInt(n, 10);
}

var factorial1 = function(n) {
    var fact = 0;

    if (isValid(n)) {
        fact = 1;

        for (var i = 1; i <= n; i++) {
            console.log("step" + i);
            fact = fact * i;
        }
    }

    return fact;
};

var factorial2 = function(n, callback){
    var fact = 0;

    if (isValid(n)) {
        fact = 1;

        for (var i = 1; i <= n; i++) {
            console.log("step" + i);
            fact = fact * i;
        }
    }

    callback(null, fact);
};

var factorial3 = function(n, callback) {

    setImmediate(function () {
        var fact = 0;
        if (isValid(n)) {
            fact = 1;

            for (var i = 1; i <= n; i++) {
                console.log("step" + i);
                fact = fact * i;
            }
        }

        callback(null, fact);
    });
};

var factorial4 = function(n, callback) {
    var facter = function(fact, index, callback) {
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

            process.nextTick(function () {
                facter(fact, ++index, callback);
            });
        }
        else {
            callback(null, fact);
            return;
        }
    };

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

        // When using the setTimeout API, once the browser has yielded control it relies on an interrupt from the underlying operating system
        // and hardware to receive control and issue the JavaScript callback.
        // Having longer durations between these interrupts allows hardware to enter low power states which significantly decreases power consumption.
        // By default the Microsoft Windows operating system and Intel based processors use 15.6ms resolutions for these interrupts (64 interrupts per second).
        // This allows Intel based processors to enter their lowest power state.
        // For this reason web developers have traditionally only been able to achieve 64 callbacks per second when using setTimeout(0) when using HTML4 browsers including earlier editions of Internet Explorer and Mozilla Firefox.
        // Over the last three years browsers have attempted to increase the number of callbacks per second that JavaScript developers can receive through the setTimeout and setInterval API's
        // by changing the power conscious Windows system settings and preventing hardware from entering low power states.
        // The HTML5 specification has gone to the extreme of recommending 250 callbacks per second.
        // This means, that the setTimeout method is restricted to 250 requests per second on most systems.
        // So setTimeout(0, handler) waits roughly 4ms before executing, even if no additional actions are pending.
        setTimeout(function () {
            console.log("TIMEOUT 0 BEFORE");
        }, 0);

        console.time("factorial")
        var ret = method(number, function(err, result) {
            console.timeEnd("factorial");
            console.log("COMPLETED:" + result);
            conn.write("Result = " + result + "\r\n");
        });

        if (ret) {
            console.timeEnd("factorial");
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