var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var pg = require('pg');

var duration = require('./assets/duration.js')
var readable = require('./assets/readable.js')

var app = express();
var jsonParser = bodyParser.json();

pg.defaults.ssl = true;

app.set('port', (process.env.PORT || 5000));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Process application/json
app.use(bodyParser.json());

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot');
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong token');
})

app.post('/webhook/', jsonParser, function (req, res) {
    messaging_events = req.body.entry[0].messaging;
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        
        // normal message
        if (event.message && event.message.text) {
            generateResponse(sender, event.message);
        }

        // was it read?
        else if (event.read) {
            initReminders(sender);
        }
    }
    res.sendStatus(200);
})

var token = process.env.FB_TOKEN;

function generateResponse(sender, message) {
    var response = duration.duration(message.text);

    if (response) {
        addSlacker(sender).then(function(res) {
            if (res) {
                var read = readable.readable(response);
                sendTextMessage(sender, "Okay, I'll give ya " + read);

                // set a timer
                var delay = response * 1000;
                var time = setTimeout(newTimer, delay, sender, read);
            }
        }, function (err) {
            console.log(err);
        });
    }

    else {
        sendTextMessage(sender, "I have absolutely no idea what that means.");
        sendTextMessage(sender, "Wait why are you even here!?");
    }
}

function newTimer(sender, read) {
    // set remind to true
    setSlackerNotify(sender, true).then(function(res) {
        sendTextMessage(sender, read + " is up. Time to get the hell off.");
        setTimeout(tryToRemove, 5000, sender, 0);
        // Now /webhook/ will send reminders with read receipts
    }, function(err) {
        console.log(err);
    })
}

function getOffReminder(sender) {
    var options = []
    var text = options[Math.random() * options.length]
    sendTextMessage(sender, text);
}

function sendTextMessage(sender, text) {
    messageData = {
        text:text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    });
}

function initReminders(sender) {
    // get the baseline of seq
    getSlacker(sender).then(function(res) {
        if (res.notify && res.seq < 10) {
            // then they need to get off!!
            setSlackerSeq(sender, res.seq).then(function(res) {
                setTimeout(sendTextMessage, 2000, sender, "come on, get off already " + res);
                setTimeout(tryToRemove, 5000, sender, res);
            }, function(err) {
                console.log(err);
            });
        }
    }, function(err) {
        console.log(err);
    });
}

function tryToRemove(sender, seq) {
    getSlacker(sender).then(function(res) {
        // see if unread message count hasn't changed
        if (seq == res.seq) {
            pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            client.query("DELETE FROM slackers WHERE sender = "+sender, 
                function(err, result) {
                    done();
                    if (err) { console.log(Error('Error adding slacker '+ sender)); }
                    else { 
                        sendTextMessage(sender, "Good job. Only took you "+seq+" notifications.");
                        return;
                    }
                });
            });
        }
    }, function(err) {
        console.log(err);
    })    
}

function addSlacker(sender) {
    return new Promise(function(resolve, reject) {
        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query("INSERT INTO slackers VALUES ("+sender+", 'false', 0)", 
            function(err, result) {
                done();
                if (err) { reject(Error('Error adding slacker '+ sender)); }
                else { 
                    resolve(true);
                    return;
                }
            });
        });
    });
}

function setSlackerNotify(sender, val) {
    return new Promise(function(resolve, reject) {
        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query("UPDATE slackers SET notify = '"+val+"' WHERE sender = "+sender, 
            function(err, result) {
                done();
                if (err) { reject(Error('Error updating notify for slacker '+ sender)); }
                else { 
                    resolve(true);
                    return;
                }
            });
        });
    });
}

function setSlackerSeq(sender, seq) {
    return new Promise(function(resolve, reject) {
        var newSeq = seq;
        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query("UPDATE slackers SET seq = '"+(++newSeq)+"' WHERE sender = "+sender, 
            function(err, result) {
                done();
                if (err) { reject(Error('Error updating seq for slacker '+ sender)); }
                else { 
                    resolve(newSeq);
                    return;
                }
            });
        });
    });
}

function getSlacker(sender) {
    return new Promise(function(resolve, reject) {
        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query("SELECT * FROM slackers WHERE sender = "+sender,
            function(err, result) {
                done();
                if (err) { 
                    reject(Error('Error getting slacker '+sender+', '+err)); 
                }
                else if (result.rows.length != 1) {
                    reject(Error('Error: slacker '+sender+' returned '+result.rows.length+' results')); 
                }
                else { resolve(result.rows[0]); }
            })    
        })
    })
}

// Serve the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'));
})

