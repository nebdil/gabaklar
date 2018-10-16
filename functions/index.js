'use strict';

require('dotenv').config()
const request = require('request');

// Firebase SDK for the fulfillment
const functions = require('firebase-functions');
// Initialize Cloud Firebase
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
const contentRef = db.collection('content');
const ASSISTANT_ERROR = 'I encountered a problem please check back later!';
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

//TODO: REFACTOR ALL TOGETHER

// Handle the Dialogflow intent named 'Default Welcome Intent'.
// This is the MAIN intent, the user will get this every time they explicitly invoke the action.
app.intent('Default Welcome Intent', async (conv) => {
    // If returning user, get their name
    const returningUser = conv.user.storage.returningUser;
    if (!returningUser) {
        conv.user.storage.returningUser = true;
        // Asks the user's permission to know their location
        await contentRef.doc(process.env.DEFAULT_WELCOME_INTENT).get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
                conv.close(ASSISTANT_ERROR);
            } else {
                conv.ask(new Permission({
                    context: doc.data()['Default Welcome Intent']['new_user'],
                    permissions: 'DEVICE_PRECISE_LOCATION',
                }));
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
        });
    } else {
        // Asks the user's permission to know their location
        await contentRef.doc(process.env.DEFAULT_WELCOME_INTENT).get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
                conv.close(ASSISTANT_ERROR);
            } else {
                conv.ask(new Permission({
                    context: doc.data()['Default Welcome Intent']['returning_user'],
                    permissions: 'DEVICE_PRECISE_LOCATION',
                }));
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
        });
    }
});

// Handle the Dialogflow intent named 'actions_intent_PERMISSION'. If user agreed to PERMISSION prompt, then boolean value 'permissionGranted' is true.
app.intent('actions_intent_PERMISSION', async (conv, params, permissionGranted) => {
    // If the user does not want the action to know their location
    if (!permissionGranted) {
        await contentRef.doc(process.env.PERMISSION).get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
                conv.close(ASSISTANT_ERROR);
            } else {
                conv.ask(doc.data()['actions_intent_PERMISSION']['not_granted']);
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
        });
        // });
    } else {
        // Got the permission, get data and save it
        const options = {
            method: 'GET',
            url: 'http://api.openweathermap.org/data/2.5/weather',
            qs: {
                lat: conv.device.location.coordinates.latitude,
                lon: conv.device.location.coordinates.longitude,
                appid: process.env.WEATHER_API_KEY
            }
        };

        await request(options, function (error, response, body) {
            if (error) throw new Error(error);
            conv.user.storage.weather = body;
        });

        await contentRef.doc(process.env.PERMISSION).get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
                conv.close(ASSISTANT_ERROR);
            } else {
                conv.ask(doc.data()['actions_intent_PERMISSION']['granted']);
                conv.ask(new Suggestions('Speed', 'Direction'));
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
        });
    }
});

// Handle the Dialogflow follow up intent named 'wind'.
app.intent('wind', async (conv, { windDetail }) => {
    // windDetail entity has speed and direction
    if (windDetail === 'speed') {
        await contentRef.doc(process.env.WIND).get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
                conv.close(ASSISTANT_ERROR);
            } else {
                conv.ask(JSON.parse(conv.user.storage.weather).wind.speed + doc.data()['wind']['speed']);
                conv.ask(new Suggestions('Yes', 'No'));
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
        });
    } else if (windDetail === 'direction') {
        // TODO: format direction
        await contentRef.doc(process.env.WIND).get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
                conv.close(ASSISTANT_ERROR);
            } else {
                conv.ask(JSON.parse(conv.user.storage.weather).wind.deg + doc.data()['wind']['direction']);
                conv.ask(new Suggestions('Yes', 'No'));
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
        });
    } else {
        await contentRef.doc(process.env.WIND).get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
                conv.close(ASSISTANT_ERROR);
            } else {
                conv.ask(doc.data()['wind']['fallback']);
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
        });
    }
});

// Handle the Dialogflow intent named 'wind - yes'
app.intent('wind - yes', async (conv, params, permissionGranted) => {
    await contentRef.doc(process.env.WIND_YES).get()
    .then(doc => {
        if (!doc.exists) {
            console.log('No such document!');
            conv.close(ASSISTANT_ERROR);
        } else {
            conv.ask(doc.data()['wind - yes']);
            conv.ask(new Suggestions('Speed', 'Direction'));
        }
    })
    .catch(err => {
        console.log('Error getting document', err);
    });
});

// Handle the Dialogflow NO_INPUT intent.
// Triggered when the user doesn't provide input to the Action
app.intent('actions_intent_NO_INPUT', async (conv) => {
    // Use the number of reprompts to vary response
    const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'));
    if (repromptCount === 0) {
        await contentRef.doc(process.env.NO_INPUT).get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
                conv.close(ASSISTANT_ERROR);
            } else {
                conv.ask(doc.data()['actions_intent_NO_INPUT']['0']);
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
        });
    } else if (repromptCount === 1) {
        await contentRef.doc(process.env.NO_INPUT).get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
                conv.close(ASSISTANT_ERROR);
            } else {
                conv.ask(doc.data()['actions_intent_NO_INPUT']['1']);
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
        });
    } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
        await contentRef.doc(process.env.NO_INPUT).get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
                conv.close(ASSISTANT_ERROR);
            } else {
                conv.ask(doc.data()['actions_intent_NO_INPUT']['IS_FINAL_REPROMPT']);
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
        });
    }
});

// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);