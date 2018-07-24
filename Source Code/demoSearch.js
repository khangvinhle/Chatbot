var util = require('util');
var _ = require('lodash');
var builder = require('botbuilder');
var restify = require('restify');

/// <reference path="./SearchDialogLibrary/index.d.ts" />
var SearchLibrary = require('./SearchDialogLibrary');
var AzureSearch = require('./SearchProviders/azure-search');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

var APPLICATION_ID = 'b57e77ea-0141-48be-b8c1-003d442a11d1';
var APPLICATION_PASSWORD = 'ffwKKW3503-nqagTQWC7-*[';

// Create chat bot and listen for messages
var connector = new builder.ChatConnector({
    appId: APPLICATION_ID,
    appPassword: APPLICATION_PASSWORD
});
server.post('/api/messages', connector.listen());

// Bot Storage: Here we register the state storage for your bot. 
// Default store: volatile in-memory store - Only for prototyping!
// We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
// For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
var inMemoryStorage = new builder.MemoryBotStorage();

// Bot with main dialog that triggers search and display its results
var bot = new builder.UniversalBot(connector, [
    function (session) {
        // Trigger Search
        SearchLibrary.begin(session);
    },
    function (session, args) {
        // Process selected search results
        session.send(
            'Done! For future reference, you selected these properties: %s',
            args.selection.map(function (i) { return i.key; }).join(', '));
    }
]).set('storage', inMemoryStorage); // Register in memory storage

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