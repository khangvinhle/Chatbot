var restify = require('restify'); 
var builder = require('botbuilder');

var util = require('util');
var _ = require('lodash');

var SearchLibrary = require('./SearchDialogLibrary');
var AzureSearch = require('./SearchProviders/azure-search');


var inMemoryStorage = new builder.MemoryBotStorage();

var fragranceGender = {
    "male": ['Dior Sauvage EDT', 'Le Male', 'Ultra male', 'Le Male Essence',
        'Aqua di gio Profumo', 'Bleu de chanel', 'Allure homme sport', 'Bleu de chanel edp',
        'Ch men', 'CH men prive', 'Creed Aventus', 'Herod', 'Layton', 'Lhomme', 'La Nuit De lhomme'],

    "female": ['Scandal', 'Chanel Gabrielle', 'Dior Poison', 'Narciso for her', 'Lavie Est Belle',
        'Midnight Rose', 'Narciso Bleu Noir', 'Good Girl', 'Pegasus', 'Blossom Love', 'Memoir',
        'Gucci bloom', 'Gucci bloom Acqua', 'LaNuit Tresor']
};

var fragranceType = {
    "sweet": ['Chanel Gabrielle', 'Scandal', 'Dior Poison', 'Le Male', 'Ultra male',
        'Bleu de chanel edp', 'Ch men', 'Lavie Est Belle', 'Good Girl', 'Herod'], 

    "fresh": ['Dior Sauvage EDP', 'Le Male Essence', 'Allure homme sport', 'Blossom Love',
        'Memoir', 'Gucci bloom Acqua'],
    
    "woody": ['Dior Sauvage EDP', 'Narciso Bleu Noir', 'Layton', 'Memoir', 'Lhomme', 
        'La Nuit De lhomme'],
    
    "sexy": ['Le Male Essence', 'Aqua di gio Profumo', 'Bleu de chanel', 'Allure homme sport', 
        'Bleu de chanel edp', 'Ch men', 'CH men prive', 'Creed Aventus', 'Narciso Bleu Noir',
        'Good Girl', 'Memoir', 'Lhomme'],

    "floral": ['Chanel Gabrielle', 'Narciso for her', 'Lavie Est Belle', 'Midnight Rose', 
        'Pegasus', 'Blossom Love', 'Gucci bloom', 'Gucci bloom Acqua'],

    "fruity": ['Ultra male', 'Bleu de chanel edp', 'Creed Aventus', 'LaNuit Tresor', 
        'Lhomme'],
    
    "classy": [] 
}

var fragranceOccasion = {
    "daytime": ['Lhomme', 'Chanel Gabrielle', 'Dior Sauvage EDP', 'Bleu de chanel',
        'Allure homme sport', 'Bleu de chanel edp', 'Ch men', 'CH men prive', 'Creed Aventus',
        'Narciso Bleu Noir', 'Herod', 'Layton', 'Blossom Love', 'Memoir', 'Gucci bloom',
        'Gucci bloom Acqua', 'Lhomme', 'La Nuit De lhomme'],
    
    "nighttime": ['Chanel Gabrielle', 'Scandal', 'Dior Poison', 'Dior Sauvage EDP',
        'Le Male', 'Ultra male', 'Le Male Essence', 'Aqua di gio Profumo', 'Bleu de chanel',
        'Allure homme sport', 'Bleu de chanel edp', 'Ch men', 'CH men prive', 'Creed Aventus',
        'Narciso for her', 'Lavie Est Belle', 'Midnight Rose', 'Narciso Bleu Noir', 
        'Good Girl', 'Herod', 'Pegasus', 'Layton', 'Memoir', 'Gucci bloom', 'LaNuit Tresor', 
        'La Nuit De lhomme']
}

var fragranceSeason = {
    "spring": ['Chanel Gabrielle', 'Dior Poison', 'Dior Sauvage EDP', 'Aqua di gio Profumo',
        'Bleu de chanel', 'Allure homme sport', 'Bleu de chanel edp', 'Ch men', 'CH men prive',
        'Creed Aventus', 'Narciso for her', 'Narciso Bleu Noir', 'Good Girl', 'Herod', 
        'Layton', 'Blossom Love', 'Memoir', 'Gucci bloom', 'Gucci bloom Acqua', 'Lhomme',
        'La Nuit De lhomme'],

    "summer": ['Allure homme sport'],
    
    "winter": ['Scandal', 'Dior Poison', 'Le Male', 'Ultra male', 'Le Male Essence',
        'Aqua di gio Profumo', 'Bleu de chanel', 'Allure homme sport', 'Bleu de chanel edp',
        'Ch men', 'Lavie Est Belle', 'Good Girl', 'Herod', 'Layton', 'LaNuit Tresor', 'La Nuit De lhomme'],
    
    "fall": ['Chanel Gabrielle', 'Dior Sauvage EDP', 'Le Male', 'Le Male Essence', 'Aqua di gio Profumo',
        'Bleu de chanel', 'Allure homme sport', 'Bleu de chanel edp', 'Ch men', 'CH men prive', 
        'Creed Aventus', 'Midnight Rose', 'Good Grirl', 'Pegasus', 'Layton', 'Blossom Love', 'Gucci bloom', 
        'Lhomme']   
}

// Set up restify server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users
server.post('/api/messages', connector.listen());



// Make sure you add code to validate these fields
var luisAppId = '22e76c57-0276-42cf-a60a-9b310ff24930';
var luisAPIKey = 'aa5263f3be8543adbcbba858f4483a89';
var luisAPIHostName = 'southeastasia.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;

// Create a recognizer that gets intents from LUIS, and add it to the bot
var recognizer = new builder.LuisRecognizer(LuisModelUrl);



// Receive messages from the user and respond 
var bot = new builder.UniversalBot(connector).set('storage', inMemoryStorage);

// Send proactive messages
function sendProactiveMessage() {
    var msg = new builder.Message();
    msg.text("Hi, I'm fragrance bot!, I can help you search for our prodcuts");
    msg.textLocale('en-US');
    bot.send(msg);  
}

server.get('/api/messages', (req, res, next) => {
    sendProactiveMessage();
});

bot.dialog('/', function(session, args) {
    session.send("Hello!")
    setTimeout(() => {
        sendProactiveMessage();
    }, 1000);
})

bot.recognizer(recognizer);


bot.dialog('GreetingDialog',
    (session) => {
        builder.Prompts.text(session,'Hi, how can I help you ?');
    }, 
    function(session, results) {
        
    }
).triggerAction({
    matches: 'greetings'
})

bot.dialog('ProductLookUpDialog', [
    function(session, args, next) {
        session.send('Hi, I will start searching for you');
        var intent = args.intent;

        session.userData.searchData = '';
        var gender = builder.EntityRecognizer.findAllEntities(intent.entities, 'gender');
        var occasion = builder.EntityRecognizer.findAllEntities(intent.entities, 'occasion'); 
        var smelltype = builder.EntityRecognizer.findAllEntities(intent.entities, 'smell type'); 
        var season = builder.EntityRecognizer.findAllEntities(intent.entities, 'season');

        var keySearch = '';

        for (var g = 0; g < gender.length; g++) {
            keySearch += gender[g].entity;
            keySearch += ' ';
        }
        console.log(occasion.length);

        for (var o = 0; o < occasion.length; o++) {
            keySearch += occasion[o].entity;
            keySearch += ' ';
        }

        for (var sm = 0; sm < smelltype.length; sm++) {
            keySearch += smelltype[sm].entity;
            keySearch += ' ';
        }

        for (var se = 0; se < season.length; se++) {
            keySearch += season[se].entity;
            keySearch += ' ';
        }
        
        if (keySearch != '') {
            session.userData.searchData = keySearch;
            SearchLibrary.begin(session);
        } else {
            session.beginDialog('fragranceSuggestion');
        }
        
    }
]).triggerAction({
    matches: 'product lookup'
})

bot.dialog('fragranceSuggestion', [
    function(session) {
        builder.Prompts.choice(session, "Are you male or female?", fragranceGender);
    },
    function(session, results) {
        if (results.response) {
            session.dialogData.gender = fragranceGender[results.response.entity];
            builder.Prompts.choice(session, "What are you looking for your fragrance?", fragranceType);
        } 
    },
    function(session, results) {
        if (results.response) {
            session.dialogData.type = fragranceType[results.response.entity];
            builder.Prompts.choice(session, "What occasion would you like to use?", fragranceOccasion);       
        }
    },
    function(session, results) {
        if(results.response) {
            session.dialogData.occasion = fragranceOccasion[results.response.entity];
            builder.Prompts.choice(session, "Which season would you like to use??", fragranceSeason);
        }
    },
    function(session, results) {
        if(results.response) {
            session.dialogData.season = fragranceSeason[results.response.entity];

            var listFragrance = []
            listFragrance.push(session.dialogData.gender);
            listFragrance.push(session.dialogData.type);
            listFragrance.push(session.dialogData.occasion);
            listFragrance.push(session.dialogData.season);
           
            var result = listFragrance.shift().filter(function(v) {
                return listFragrance.every(function(a) {
                    return a.indexOf(v) !== -1;
                });
            });

            console.log(result);
        }
    }
]);


// Azure Search
var azureSearchClient = AzureSearch.create('fragrance-chatbot', '6F3A790D61C2914AEE5C231D97C9EFE9', 'product');
var realStateResultsMapper = SearchLibrary.defaultResultsMapper(realstateToSearchHit);

// Register Search Dialogs Library with bot
bot.library(SearchLibrary.create({
    multipleSelection: true,
    search: function (query) { return azureSearchClient.search(query).then(realStateResultsMapper); },
    refiners: ['pName', 'smellType', 'retentionTime','gender','season','occasion'],
    refineFormatter: function (refiners) {
        return _.zipObject(
            refiners.map(function (r) { return 'By ' + _.capitalize(r); }),
            refiners);
    }
}));

// Maps the AzureSearch RealState Document into a SearchHit that the Search Library can use
function realstateToSearchHit(realstate) {
    return {
        key: realstate.id,
        pName:realstate.pName,
        smellType:realstate.smellType,
        retentionTime:realstate.retentionTime,
        gender:realstate.gender,
        season:realstate.season,
        occasion:realstate.occasion,
        ten_ml_price:realstate.ten_ml_price,
        fullPrice:realstate.fullPrice,
        capacity:realstate.capacity,
        //imageUrl: realstate.thumbnail
    };
}