'use strict';

// Firebase SDK for the fulfillment
const functions = require('firebase-functions');

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

// Handle the Dialogflow intent named 'Default Welcome Intent'.
app.intent('Default Welcome Intent', (conv) => {
    // TODO: fallback
    const name = conv.user.storage.userName;
    if (!name) {
        // Asks the user's permission to know their name, for personalization.
        conv.ask(new Permission({
            context: 'Hi there, to get to know you better',
            permissions: 'NAME',
        }));
    } else {
        conv.ask(`Thanks, ${name}. What's the location you're looking to get the wind speed of?`);
        conv.ask(new Suggestions('Montreal', 'Toronto', 'Ottawa'));    }
});

// Handle the Dialogflow intent named 'actions_intent_PERMISSION'. If user
// agreed to PERMISSION prompt, then boolean value 'permissionGranted' is true.
app.intent('actions_intent_PERMISSION', (conv, params, permissionGranted) => {
    if (!permissionGranted) {
        conv.ask(`Ok, no worries. What's the location you're looking to get the wind speed of?`);
        conv.ask(new Suggestions('Montreal', 'Toronto', 'Ottawa'));
    } else {
        // The conv.user.storage object is a data structure provided by the client library for in-dialog storage. You can set and manipulate the properties on this object throughout the duration of the conversation for this user.
        conv.user.storage.userName = conv.user.name.display;
        conv.ask(`Thanks, ${conv.user.storage.userName}. What's the location you're looking to get the wind speed of?`);
        conv.ask(new Suggestions('Montreal', 'Toronto', 'Ottawa'));
    }
});

// Handle the Dialogflow intent named 'location'.
// The intent collects a parameter named 'location'
app.intent(['location', 'location - wind - yes'], (conv, {
            location
        }) => {
    // TODO: fallback
    const city = location.city;
    if (conv.user.storage.userName) {
        // If we collected user name previously, address them by name
        conv.ask(`${conv.user.storage.userName}, would you like to know about the wind speed or wind direction in ${city}?`);
        conv.ask(new Suggestions('Speed', 'Direction'));
    } else {
        conv.ask(`Would you like to know about the wind speed or wind direction in ${city}?`);
        conv.ask(new Suggestions('Speed', 'Direction'));
    }
});

// Handle the Dialogflow follow up intent named 'location - wind'.
app.intent('location - wind', (conv, { windDetail }) => {
    // windDetail entity has speed and direction
    // TODO: fallback
    conv.ask(`You wanted to know about ${windDetail}`);
    conv.ask('Do you want to hear more about the wind?');
    conv.ask(new Suggestions('Yes', 'No'));
});

// Handle the Dialogflow NO_INPUT intent.
// Triggered when the user doesn't provide input to the Action
app.intent('actions_intent_NO_INPUT', (conv) => {
    // Use the number of reprompts to vary response
    const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'));
    if (repromptCount === 0) {
        conv.ask('Would you like to know about wind speed or wind direction?');
    } else if (repromptCount === 1) {
        conv.ask(`Wind speed or wind direction?`);
    } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
        conv.close(`Sorry we're having trouble. Let's ` +
            `try this again later. Goodbye.`);
    }
});

// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);