var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var pg = require('pg');

var duration = require('./assets/duration.js');
var readable = require('./assets/readable.js');
var text = require('./assets/text.js');

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
    res.send("<p>I'm just a lowly backend. Check out <a href='http://zachschnell.com/take10'>my website</a> for details.</p>");
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
            // for a worker or slacker?
            getWorker(sender).then(function(res) {
                if (res) { workerTurnsSlacker(res); }   // worker
                else { initReminders(sender); }         // slacker

            }, function(err) {
                console.log(err);
            });
        }
    }
    res.sendStatus(200);
})

var token = process.env.FB_TOKEN;

function generateResponse(sender, message) {
    var response = duration.duration(message.text);

    if (response) {
        var read = readable.readable(response);
        if (response > 600) { // must be < 10 minutes
            sendTextMessage(sender, "Like hell I'm going to let you procrastinate for "+read+". Try something less than 10 minutes.")
            return;
        }

        addSlacker(sender).then(function(res) {
            if (res) {
                var tm = text.start(read);
                sendTextMessage(sender, tm);

                // set a timer
                var delay = response * 1000;
                var time = setTimeout(newTimer, delay, sender, read);
            }
        }, function (err) {
            console.log(err);
        });
    }

    else {
        var tm = text.unknown()
        sendTextMessage(sender, tm);
    }
}

function newTimer(sender, read) {
    // set remind to true
    setSlackerNotify(sender, true).then(function(res) {
        var tm = text.time(read)
        sendTextMessage(sender, tm);
        setTimeout(tryToRemove, 5000, sender, 0);
        // Now /webhook/ will send reminders with read receipts
    }, function(err) {
        console.log(err);
    })
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
        if (res.notify) {
            if (res.seq >= 10) {
                // give up
                deleteSlacker(sender);
                sendTextMessage(sender, "Alright, I tried. Guess there's nothing stopping you.");
            }
            else {
                // then they need to get off!!
                setSlackerSeq(sender, res.seq).then(function(res) {
                    var tm = text.reminder();
                    var rand = Math.floor(Math.random()*1500)+500;
                    setTimeout(sendTextMessage, rand, sender, tm);
                    setTimeout(tryToRemove, 60000, sender, res);
                }, function(err) {
                    console.log(err);
                });
            }
        }
    }, function(err) {
        console.log(err);
    });
}

function tryToRemove(sender, seq) {
    getSlacker(sender).then(function(res) {
        // see if unread message count hasn't changed
        if (seq == res.seq) {
            deleteSlacker(sender);
            // make into a worker, will notify when they next read this
            slackerTurnsWorker(sender);
        }
    }, function(err) {
        console.log(err);
    })    
}

function slackerTurnsWorker(sender) {
    var date = new Date();
    // add slacker to worker 
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query("INSERT INTO workers VALUES ("+sender+", '"+date.toUTCString()+"')", 
        function(err, result) {
            done();
            if (err) { console.log(Error('Error adding worker '+ sender)); }
        });
    });
    // confirmation that it ended 
    // sendTextMessage(sender, "Good job, worker.");
}

function workerTurnsSlacker(worker) {
    // use worker.date to figure out how long it's been and send relevant message    
    var tm = text.returns();
    sendTextMessage(worker.sender, tm); 
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

function deleteSlacker(sender) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query("DELETE FROM slackers WHERE sender = "+sender, 
        function(err, result) {
            done();
            if (err) { console.log(Error('Error deleting slacker '+ sender)); }
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
                if (err) { reject(Error('Error getting slacker '+sender+', '+err)); }
                else if (result.rows.length != 1) { resolve(false); } // no such slacker
                else { resolve(result.rows[0]); } // here's your slacker
            });  
        });
    });
}

function getWorker(sender) {
    return new Promise(function(resolve, reject) {
        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query("DELETE FROM workers WHERE sender = "+sender+" RETURNING *",
            function(err, result) {
                done();
                if (err) { reject(Error('Error getting worker '+sender+', '+err)); }
                else if (result.rows.length != 1) { resolve(false); } // no such worker
                else { resolve(result.rows[0]); } // here's your worker
            });  
        });
    });
}

// Serve the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'));
})

