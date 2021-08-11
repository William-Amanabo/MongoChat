const mongo = require("mongodb").MongoClient;
const mongoose = require("mongoose");
const express = require("express");
var path = require("path");
var app = express();
var server = require("http").createServer(app);
const client = require("socket.io").listen(server);

app.use(express.static(path.join(__dirname, "components")));
//app.use(express.static(path.join(__dirname, 'styles2.css')));

server.listen(process.env.PORT || 4000);
console.log("server running....");

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

mongoose.connect("mongodb://127.0.0.1/mongoChat");
let db = mongoose.connection;

let User = require("./models/user");

db.on("open", function() {
  console.log("Connected to MongoDB");
  client.on("connection", function(socket) {
    /* let chat = db.collection('chats'); */
    //let chat = db.mongoChat;

    //function to send status
    sendStatus = function(s) {
      socket.emit("status", s);
    };

    //get chats from mongo collection

    User.find(function(err, res) {
      if (err) throw err;

      socket.emit("output", res);
    })
      .limit(100)
      .sort({ _id: 1 });

    //Handle events
    socket.on("input", function(data) {
      let name = data.name;
      let message = data.message;

      //check for name and message
      if (name == "" || message == "") {
        sendStatus("Please enter a name and message");
      } else {
        //FIX
        let newUser = new User({ name: name, message: message });
        newUser.save(function(err) {
          if (err) throw err;

          client.emit("output", [data]);

          //Send status object
          sendStatus({
            message: "message sent",
            clear: true,
          });
        });
      }
    });

    //Handle clear
    socket.on("clear", function(data) {
      //Remove all db.mongoChat from collection
      User.remove({}, function() {
        socket.emit("cleared");
      });
    });
  });
});

/* //connect to mongo this 'mongodb://127.0.0.1/mongochat' creats a database mongochat in mongoDB
mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db) {
    if (err) throw err;
    console.log("mongo db connected");
    console.log(db.db.toString());

    //connect to socket.io
    client.on("connection", function(socket) {
        let chat = db.collection('chats');
        //let chat = db.mongoChat;

        //function to send status
        sendStatus = function(s) {
            socket.emit('status', s);
        }

        //get chats from mongo collection

        chat.find().limt(100).sort({ _id: 1 }).toArray(function(err, res) {
            if (err) throw err;

            socket.emit('output', res);
        })

        //Handle events
        socket.on('input', function(data) {
            let name = data.name;
            let message = data.message;

            //check for name and message
            if (name == "" || message == "") {
                sendStatus("Please enter a name and message");
            } else { //FIX
                chat.insert({ name: name, message: message }, function() {
                    client.emit('output', [data]);

                    //Send status object
                    sendStatus({
                        message: 'message sent',
                        clear: true
                    })
                })
            }

        });

        //Handle clear
        socket.on('clear', function(data) {
            //Remove all db.mongoChat from collection
            chat.remove({}, function() {
                socket.emit('cleared')
            })
        })
    })
}) */
