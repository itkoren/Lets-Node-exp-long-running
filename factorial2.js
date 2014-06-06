// include the http module
var net = require("net");

// Load our C++ factorial addon and add it to the list of available factorials
var factorial_c_1 = require("./factorial_addon/build/Release/factorial1");
var factorial_c_2 = require("./factorial_addon/build/Release/factorial2");

var factorials = {
    "c1":factorial_c_1.factorial,
    "c2":factorial_c_2.factorial
};

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

        // The setTimeout method is restricted to 250 requests per second on most systems.
        // This means that setTimeout(0, handler) waits roughly 4ms before executing, even if no additional actions are pending.
        setImmediate(function () {
            console.log("TIMEOUT 0 BEFORE");
        });

        console.time("factorial");
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