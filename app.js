var restify = require('restify');
var builder = require('botbuilder');
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
server.post('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/22e76c57-0276-42cf-a60a-9b310ff24930?subscription-key=c25e399bd6ca4e9890cb42fd829e70d6&verbose=true&timezoneOffset=420&q=', connector.listen());
// Receive messages from the user and respond by echoing each message back
(prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
session.send("You said: %s", session.message.text);
});