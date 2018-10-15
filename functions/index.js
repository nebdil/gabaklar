'use strict';

require('dotenv').config()
const axios = require('axios');

// Firebase SDK for the fulfillment
const functions = require('firebase-functions');
// Initialize Cloud Firebase
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
var db = admin.firestore();

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
// This is the MAIN intent, the user will get this every time they explicitly invoke the action.
app.intent('Default Welcome Intent', (conv) => {
    // If returning user, get their name
    const returningUser = conv.user.storage.returningUser;
    if (!returningUser) {
        conv.user.storage.returningUser = true;
        // Asks the user's permission to know their location
        conv.data.requestedPermission = 'DEVICE_PRECISE_LOCATION';
        return conv.ask(new Permission({
            context: `Hi there! I am here to help you with wind directions and speeds while you are sailing! I know you must be very busy with tacking and jibing, so let's get to it! In order to better help you`,
            permissions: conv.data.requestedPermission,
        }));
    } else {
        // Asks the user's permission to know their location
        conv.data.requestedPermission = 'DEVICE_PRECISE_LOCATION';
        return conv.ask(new Permission({
            context: `Welcome back! To locate you`,
            permissions: conv.data.requestedPermission,
        }));
    }
});

// Handle the Dialogflow intent named 'actions_intent_PERMISSION'. If user agreed to PERMISSION prompt, then boolean value 'permissionGranted' is true.
app.intent(['actions_intent_PERMISSION', 'wind - yes'], (conv, params, permissionGranted) => {
    // If the user does not want the action to know their location
    if (!permissionGranted) {
        conv.close(`I'm sorry that you do not want to share your location with me, but I cannot help you if you don't! I'm here if you change your mind, bye now!`);
    } else {
        // Got the permission, get data and save it
        // TODO: cannot make an API request to outside of the google ecosystem, because not a paid plan
        // return axios.get(`http://api.openweathermap.org/data/2.5/weather?lat=${conv.device.location.coordinates.latitude}&lon=${conv.device.location.coordinates.longitude}&appid=`)
        // .then(function (response) {
        //     // handle success
        //     conv.user.storage.weather = JSON.parse(response);
        //     conv.ask(`Would you like to know about the wind speed or wind direction today?`);
        //     conv.ask(new Suggestions('Speed', 'Direction'));
        // })
        // .catch(function (error) {
        //     // handle error
        //     conv.close('something wrong with the api call')
        //     console.log('error:', error);
        // })
        conv.ask(`Would you like to know about the wind speed or wind direction today?`);
        conv.ask(new Suggestions('Speed', 'Direction'));
    }
});

// Handle the Dialogflow follow up intent named 'wind'.
app.intent('wind', (conv, { windDetail }) => {
    // windDetail entity has speed and direction
    if (windDetail === 'speed') {
        conv.ask(`Current wind speed is BLANK knots. Do you still want to hear more about the wind?`);
        // conv.ask(`Current wind speed is ${conv.user.storage.weather.speed} knots. Do you still want to hear more about the wind?`);
        conv.ask(new Suggestions('Yes', 'No'));
    } else if (windDetail === 'direction') {
        // TODO: format direction
        conv.ask(`Current wind direction is BLANK degrees. Do you still want to hear more about the wind?`);
        // conv.ask(`Current wind direction is ${conv.user.storage.weather.deg} degrees. Do you still want to hear more about the wind?`);
        conv.ask(new Suggestions('Yes', 'No'));
    } else {
        conv.close(`Sorry, I couldn't understand. Try again later please!`);
    }
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