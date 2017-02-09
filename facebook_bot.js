/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Facebook bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Facebook's Messenger APIs
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Follow the instructions here to set up your Facebook app and page:

    -> https://developers.facebook.com/docs/messenger-platform/implementation

  Run your bot from the command line:

    app_secret=<MY APP SECRET> page_token=<MY PAGE TOKEN> verify_token=<MY_VERIFY_TOKEN> node facebook_bot.js [--lt [--ltsubdomain LOCALTUNNEL_SUBDOMAIN]]

  Use the --lt option to make your bot available on the web through localtunnel.me.

# USE THE BOT:

  Find your bot inside Facebook to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


if (!process.env.page_token) {
    console.log('Error: Specify page_token in environment');
    process.exit(1);
}

if (!process.env.verify_token) {
    console.log('Error: Specify verify_token in environment');
    process.exit(1);
}

if (!process.env.app_secret) {
    console.log('Error: Specify app_secret in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');
var commandLineArgs = require('command-line-args');
var localtunnel = require('localtunnel');

const ops = commandLineArgs([
      {name: 'lt', alias: 'l', args: 1, description: 'Use localtunnel.me to make your bot available on the web.',
      type: Boolean, defaultValue: false},
      {name: 'ltsubdomain', alias: 's', args: 1,
      description: 'Custom subdomain for the localtunnel.me URL. This option can only be used together with --lt.',
      type: String, defaultValue: null},
   ]);

if(ops.lt === false && ops.ltsubdomain !== null) {
    console.log("error: --ltsubdomain can only be used together with --lt.");
    process.exit();
}

var controller = Botkit.facebookbot({
    debug: true,
    log: true,
    access_token: process.env.page_token,
    verify_token: process.env.verify_token,
    app_secret: process.env.app_secret,
    validate_requests: true, // Refuse any requests that don't come from FB on your receive webhook, must provide FB_APP_SECRET in environment variables
});

var bot = controller.spawn({
});


var Utterances = {
    yes: new RegExp(/^(yes|yea|yup|yep|ya|sure|ok|y|yeah|yah|sounds good)/i),
    no: new RegExp(/^(no|nah|nope|n|never|not a chance)/i),
    quit: new RegExp(/^(quit|cancel|end|stop|nevermind|never mind)/i),
    greetings: new RegExp(/^(hi|hello|greetings|hi there|yo|was up|whats up)/),
    askQuestion: new RegExp(/^(a|1|i have a (question|query|doubt))/),
    buyInsurance: new RegExp(/^(b|2|i (want|like|would like) to buy (a|an) (insurance|policy|insurance policy))/),
    carRegNo: new RegExp(/(\b[a-z]{2}-\d{2}-[a-z]{2}-\d{4}\b)/)
};

controller.setupWebserver(process.env.PORT || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log('ONLINE!');
        if(ops.lt) {
            var tunnel = localtunnel(process.env.PORT || 3000, {subdomain: ops.ltsubdomain}, function(err, tunnel) {
                if (err) {
                    console.log(err);
                    process.exit();
                }
                console.log("Your bot is available on the web at the following URL: " + tunnel.url + '/facebook/receive');
            });

            tunnel.on('close', function() {
                console.log("Your bot is no longer available on the web at the localtunnnel.me URL.");
                process.exit();
            });
        }
    });
});

controller.api.thread_settings.greeting('Hello! I\'m a StarBucks bot!');
controller.api.thread_settings.get_started('sample_get_started_payload');
// controller.api.thread_settings.menu([
//     {
//         "type":"postback",
//         "title":"Hello",
//         "payload":"hello"
//     },
//     {
//         "type":"postback",
//         "title":"Help",
//         "payload":"help"
//     },
//     {
//       "type":"web_url",
//       "title":"Botkit Docs",
//       "url":"https://github.com/howdyai/botkit/blob/master/readme-facebook.md"
//     },
// ]);

controller.hears(['quick'], 'message_received', function(bot, message) {

    bot.reply(message, {
        text: 'Hey! This message has some quick replies attached.',
        quick_replies: [
            {
                "content_type": "text",
                "title": "Yes",
                "payload": "yes",
            },
            {
                "content_type": "text",
                "title": "No",
                "payload": "no",
            }
        ]
    });

});

controller.hears(['^hello', '^hi'], 'message_received,facebook_postback', function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hello.');
        }
    });
});

controller.hears(['menu'], 'message_received', function(bot, message) {

    bot.startConversation(message, function(err, convo) {
        convo.ask({
            attachment: {
                'type': 'template',
                'payload': {
                    'template_type': 'generic',
                    'elements': [
                        {
                            'title': 'India Estates Blend',
                            'image_url': 'http://globalassets.starbucks.com/assets/a8de3ec0005a4d21b9282c0527160100.jpg',
                            'subtitle': 'Cultivated in Karnataka in harmony with nature, the lush and layered coffee captivates from first sip.',
                            'buttons': [
                                {
                                    'type': 'web_url',
                                    'url': 'http://globalassets.starbucks.com/assets/a8de3ec0005a4d21b9282c0527160100.jpg',
                                    'title': 'View Coffee'
                                },
                                {
                                    'type': 'web_url',
                                    'url': 'http://globalassets.starbucks.com/assets/a8de3ec0005a4d21b9282c0527160100.jpg',
                                    'title': 'Buy Coffee'
                                },
                                {
                                    'type': 'postback',
                                    'title': 'Find in near by store',
                                    'payload': 'India Estates Blend'
                                }
                            ]
                        },
                        {
                            'title': 'Kenya',
                            'image_url': 'http://globalassets.starbucks.com/assets/7a6c6ffc62ee4e17a992cee3898918ba.png',
                            'subtitle': 'And big – awash with a full-bodied juiciness that makes it instantly recognizable to its many, many fans. These qualities are all true of our Kenya coffee. ',
                            'buttons': [
                                {
                                    'type': 'web_url',
                                    'url': 'http://globalassets.starbucks.com/assets/7a6c6ffc62ee4e17a992cee3898918ba.png',
                                    'title': 'View Coffee'
                                },
                                {
                                    'type': 'web_url',
                                    'url': 'http://globalassets.starbucks.com/assets/7a6c6ffc62ee4e17a992cee3898918ba.png',
                                    'title': 'Order Coffee'
                                },
                                {
                                    'type': 'postback',
                                    'title': 'Find in near by store',
                                    'payload': 'Kenya'
                                }
                            ]
                        },
                        {
                            'title': 'Fair Trade Certified™ Italian Roast',
                            'image_url': 'http://globalassets.starbucks.com/assets/7a6c6ffc62ee4e17a992cee3898918ba.png',
                            'subtitle': 'This coffee gets its distinctive sweetness from the way it is roasted: dark, and darker still. Somewhere beyond the caramel notes of our Espresso Roast but short of the smokiness that identifies our French Roast – that is the sweet spot held by Italian Roast.',
                            'buttons': [
                                {
                                    'type': 'web_url',
                                    'url': 'http://globalassets.starbucks.com/assets/ba003714b7494e948af043d5f0664669.png',
                                    'title': 'View Coffee'
                                },
                                {
                                    'type': 'web_url',
                                    'url': 'http://globalassets.starbucks.com/assets/ba003714b7494e948af043d5f0664669.png',
                                    'title': 'Order Coffee'
                                },
                                {
                                    'type': 'postback',
                                    'title': 'Find in near by store',
                                    'payload': 'Fair Trade Certified™ Italian Roast'
                                }
                            ]
                        }




                        


                    ]
                }
            }
        }, function(response, convo) {
            // whoa, I got the postback payload as a response to my convo.ask!
            convo.next();
        });
    });
});

// controller.on('facebook_postback', function(bot, message) {
//     // console.log(bot, message);
//    bot.reply(message, 'Great Choice!!!! (' + message.payload + ')');

// });


controller.hears(['call me (.*)', 'my name is (.*)'], 'message_received', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['what is my name', 'who am i'], 'message_received', function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Your name is ' + user.name);
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('I do not know your name yet!');
                    convo.ask('What should I call you?', function(response, convo) {
                        convo.ask('You want me to call you `' + response.text + '`?', [
                            {
                                pattern: 'yes',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'no',
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! I will update my dossier...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevermind!');
                        }
                    });
                }
            });
        }
    });
});

// controller.hears(['shutdown'], 'message_received', function(bot, message) {

//     bot.startConversation(message, function(err, convo) {

//         convo.ask('Are you sure you want me to shutdown?', [
//             {
//                 pattern: bot.utterances.yes,
//                 callback: function(response, convo) {
//                     convo.say('Bye!');
//                     convo.next();
//                     setTimeout(function() {
//                         process.exit();
//                     }, 3000);
//                 }
//             },
//         {
//             pattern: bot.utterances.no,
//             default: true,
//             callback: function(response, convo) {
//                 convo.say('*Phew!*');
//                 convo.next();
//             }
//         }
//         ]);
//     });
// });


controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'], 'message_received',
    function(bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':|] I am a bot. I have been running for ' + uptime + ' on ' + hostname + '.');
    });



// controller.on('message_received', function(bot, message) {
//     bot.reply(message, 'Try: `what is my name` or `structured` or `call me captain`');
//     return false;
// });


// function formatUptime(uptime) {
//     var unit = 'second';
//     if (uptime > 90) {
//         uptime = uptime / 60;
//         unit = 'minute';
//     }
//     if (uptime > 90) {
//         uptime = uptime / 60;
//         unit = 'hour';
//     }
//     if (uptime != 1) {
//         unit = unit + 's';
//     }

//     uptime = uptime + ' ' + unit;
//     return uptime;
// }



var greetTheUser = function (response, convo) {
    convo.say('Hi.. Welcome to the insurance portal');
    convo.next();
};



var askHelpRequest = function (err, convo) { // Ask the User if he wants help with buying an insurance or any queries about insurance

    // convo.ask(message, {
    //     text: 'Hey! Can you tell me what help do you need today?',
    //     quick_replies: [
    //         {
    //             "content_type": "text",
    //             "title": "Yes",
    //             "payload": "yes",
    //         },
    //         {
    //             "content_type": "text",
    //             "title": "No",
    //             "payload": "no",
    //         }
    //     ]
    // });


    convo.say('Hi.. Welcome to Auto Insurance!');
    convo.say('Can you tell me what help do you need today?');
    convo.ask('\n\n[1] Do you have question?\n[2] Do you want to buy an insurance\n\n', [{
        pattern: Utterances.askQuestion,
        callback: function (response, convo) {
            askQueries(response, convo);
            convo.next();
        }
    }, {
        pattern: Utterances.buyInsurance,
        callback: function (response, convo) {
            convo.say('Awesome lets buy you an insurance.');
            convo.say('We are glad to help you get a Car Insurance. Please hold on while we connect you to our Insurance Expert. Please answer following few questions, so we can quickly get a quote that suits you!');
            buyInsurance(response, convo);
            convo.next();
        }
    }, {
        default: true,
        callback: function (response, convo) {
            convo.say('Please select correctly');
            convo.repeat();
            convo.next();
        }
    }]);
};

var buyInsurance = function (response, convo) {
    convo.ask('Do you remember your Car registration number?', [{
        pattern: Utterances.yes,
        callback: function (response, convo) {
            askCarRegNo(response, convo);
            convo.next();
        }
    }, {
        pattern: Utterances.no,
        callback: function (response, convo) {
            convo.say('Ok, no prob!');
            askCarMake(response, convo);
            convo.next();
        }
    }, {
        default: true,
        callback: function (response, convo) {
            convo.say('Please select correctly');
            convo.repeat();
            convo.next();
        }
    }]);
};

var askCarMake = function (response, convo) {
    response.text = response.text.toLowerCase();
    convo.ask('Which car do you drive?', [{
        pattern: Utterances.carRegNo,
        callback: function (response, convo) {
            convo.say('Great so you own a ' + response.text);
            convo.next();
        }
    }, {
        default: true,
        callback: function (response, convo) {
            convo.say('I couldn\'t get you');
            convo.repeat();
            convo.next();
        }
    }]);
};

var askCarRegNo = function (response, convo) {
    convo.ask('Please enter your vehicle registration number? (eg: TN-05-AB-1234)', [{
        pattern: Utterances.carRegNo,
        callback: function (response, convo) {
            askCarMake(response, convo);
            convo.next();
        }
    }, {
        default: true,
        callback: function (response, convo) {
            convo.say('Wrong Format');
            convo.repeat();
            convo.next();
        }
    }]);
};

var askQueries = function (response, convo) {
    convo.ask('Awesome ask any question.', function (response, convo) {
        convo.say('Bot under training mode. Thanks for your patience. We will update you shortly.');
        convo.stop();
    });
};

// msg = "hi"; // Just an arbitary initial message
// bot.startConversation(msg, greetTheUser); // Start the initial Conversation by greeting the User
// When the user replies with insurance, Start the conversational flow

controller.hears(['insurance'], 'message_received', function (bot, message) { 
    bot.startConversation(message, askHelpRequest);
});
 
