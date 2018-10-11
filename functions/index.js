'use strict';

// Firebase SDK for the fulfillment
const functions = require('firebase-functions');
// const {
//     actionssdk
// } = require('actions-on-google');

// Import the Dialogflow module and response creation dependencies from the 
// Actions on Google client library.
// Suggestions: suggestion chips a visual component that provides recommended text options that the user can tap on screened devices
const {
    dialogflow,
    Permission,
    Suggestions,
} = require('actions-on-google');

// Instantiate the Dialogflow client.
const app = dialogflow({ debug: true });
// // The conversation logic used:
// // exports.main = functions.https.onRequest(app);
// exports.main = functions.https.onRequest((req, res) => {
//     // Initialize the action
//     const app = actionssdk({
//         request: req,
//         response: res,
//         debug: true
//     });
    
//     app.intent('actions.intent.MAIN', (conv) => {
//         conv.ask('Hi!');
//         conv.close();
//     });
//     // Here goes our code to handle the request and return a response to the assistant
// });

// Handle the Dialogflow intent named 'Default Welcome Intent'.
app.intent('Default Welcome Intent', (conv) => {
    conv.ask(new Permission({
        context: 'Hi there, to get to know you better',
        permissions: 'NAME'
    }));
});
// Handle the Dialogflow intent named 'actions_intent_PERMISSION'. If user
// agreed to PERMISSION prompt, then boolean value 'permissionGranted' is true.
app.intent('actions_intent_PERMISSION', (conv, params, permissionGranted) => {
    if (!permissionGranted) {
        conv.ask(`Ok, no worries. What's the location you're looking to get the wind speed of?`);
        conv.ask(new Suggestions('Montreal', 'Toronto', 'Ottawa'));
    } else {
        // The conv.data object is a data structure provided by the client library for in-dialog storage. You can set and manipulate the properties on this object throughout the duration of the conversation for this user.
        conv.data.userName = conv.user.name.display;
        conv.ask(`Thanks, ${conv.data.userName}. What's the location you're looking to get the wind speed of?`);
        conv.ask(new Suggestions('Montreal', 'Toronto', 'Ottawa'));
    }
});

// Handle the Dialogflow intent named 'location'.
// The intent collects a parameter named 'location'
app.intent('location', (conv, { location }) => {
    const city = location.city;
    if (conv.data.userName) {
        conv.close(`${conv.data.userName}, your location is ${city}.`);
    } else {
        conv.close(`Your location is ${city}.`);
    }
});
// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);