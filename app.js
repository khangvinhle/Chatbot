var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

var APPLICATION_ID = 'b57e77ea-0141-48be-b8c1-003d442a11d1';
var APPLICATION_PASSWORD = 'ffwKKW3503-nqagTQWC7-*[';
var connector = new builder.ChatConnector({
    appId: APPLICATION_ID,
    appPassword: APPLICATION_PASSWORD
});


// Listen for messages from users
server.post('/api/messages', connector.listen());

LUIS_APPLICATION_ID = '22e76c57-0276-42cf-a60a-9b310ff24930';
LUIS_SUBSCRIPTION_KEY = 'aa5263f3be8543adbcbba858f4483a89';
LUIS_URL = 'https://southeastasia.api.cognitive.microsoft.com/luis/v2.0/apps/' + LUIS_APPLICATION_ID;

function getIntentFromLuis(text, callback) {
    request.get({
        url: LUIS_URL,
        qs: {
            'subscription-key': LUIS_SUBSCRIPTION_KEY,
            'timezoneOffset': 0,
            'verbose': true,
            'q': text
        },
        json: true
    }, function (error, response, data) {
        if (error) {
            callback(error);
        } else {
            callback(null, data);
        }
    });
}

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    getIntentFromLuis(session.message.text, function (error, luisData) {
        var intent = luisData.topScoringIntent.intent;
        var score = luisData.topScoringIntent.score;
        var entities = luisData.entities;

        if (score > 0.6 && intent != 'None') {
            if (intent == 'product lookup') {
                if (entities.length > 0) {
                    var products = [];
                    for (var productIterator in entities) {
                        products.push(entities[productIterator].entity);
                    }
                    var message = "Sure I will show you" + products.join(',');
                    session.send(message);
                } else {
                    session.send("Sure I will show you all the products!");
                }
            } else if (intent == 'location lookup') {
                if (entities.length > 0) {
                    session.send("We are selling online only.")
                }else{
                    session.send("We are selling online only.")
                }
            }else if(intent=='greetings'){
                session.send("Hi! I can help you find fragrances. What would you like me to do?");
            }
        } else {
            session.send("I did not understand you. I am still learning! Can you rephrase?");
        }
    });
});