'use strict';

require('dotenv').config()
const axios = require('axios');

// Firebase SDK for the fulfillment
const functions = require('firebase-functions');
// Initialize Cloud Firebase
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
const contentRef = db.collection('content');
let content = '';

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
app.intent('Default Welcome Intent', (conv) => {
    // If returning user, get their name
    const returningUser = conv.user.storage.returningUser;
    if (!returningUser) {
        conv.user.storage.returningUser = true;
        // Asks the user's permission to know their location
        conv.data.requestedPermission = 'DEVICE_PRECISE_LOCATION';
        return contentRef.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                // console.log('==================: ', doc.data()['Default Welcome Intent']['new_user']);
                content = doc.data()['Default Welcome Intent']['new_user'];
            });
            return conv.ask(new Permission({
                context: content,
                permissions: conv.data.requestedPermission,
            }));
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    } else {
        // Asks the user's permission to know their location
        conv.data.requestedPermission = 'DEVICE_PRECISE_LOCATION';
        return contentRef.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                content = doc.data()['Default Welcome Intent']['returning_user'];
            });
            return conv.ask(new Permission({
                context: content,
                permissions: conv.data.requestedPermission,
            }));
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    }
});

// Handle the Dialogflow intent named 'actions_intent_PERMISSION'. If user agreed to PERMISSION prompt, then boolean value 'permissionGranted' is true.
app.intent('actions_intent_PERMISSION', (conv, params, permissionGranted) => {
    // If the user does not want the action to know their location
    if (!permissionGranted) {
        return contentRef.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                content = doc.data()['actions_intent_PERMISSION']['not_granted'];
            });
            return conv.close(new Permission({
                context: content,
                permissions: conv.data.requestedPermission,
            }));
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
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
        return contentRef.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                content = doc.data()['actions_intent_PERMISSION']['granted'];
            });
            return conv.ask(new Permission({
                context: content,
                permissions: conv.data.requestedPermission
            }));
        })
        .then(() => conv.ask(new Suggestions('Speed', 'Direction')))
        .catch(err => {
            console.log('Error getting documents', err);
        });
    }
});
// Handle the Dialogflow intent named 'wind - yes'
app.intent('wind - yes', (conv, params, permissionGranted) => {
    return contentRef.get()
    .then(snapshot => {
        snapshot.forEach(doc => {
            content = doc.data()['wind - yes'];
        });
        conv.ask(content);
        conv.ask(new Suggestions('Speed', 'Direction'));
    })
    .catch(err => {
        console.log('Error getting documents', err);
    });
});

// Handle the Dialogflow follow up intent named 'wind'.
app.intent('wind', (conv, { windDetail }) => {
    // windDetail entity has speed and direction
    // TODO: fix api call and ${conv.user.storage.weather.speed}
    if (windDetail === 'speed') {
        return contentRef.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                content = doc.data()['wind']['speed'];
            });
            conv.ask(content);
            conv.ask(new Suggestions('Yes', 'No'));
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    } else if (windDetail === 'direction') {
        // TODO: format direction
        // TODO: fix api call and ${conv.user.storage.weather.deg}
        return contentRef.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                content = doc.data()['wind']['direction'];
            });
            conv.ask(content);
            conv.ask(new Suggestions('Yes', 'No'));
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    } else {
        return contentRef.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                content = doc.data()['wind']['fallback'];
            });
            conv.close(content);
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    }
});

// Handle the Dialogflow NO_INPUT intent.
// Triggered when the user doesn't provide input to the Action
app.intent('actions_intent_NO_INPUT', (conv) => {
    // Use the number of reprompts to vary response
    const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'));
    if (repromptCount === 0) {
        return contentRef.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                content = doc.data()['actions_intent_NO_INPUT']['0'];
            });
            conv.ask(content);
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    } else if (repromptCount === 1) {
        return contentRef.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                content = doc.data()['actions_intent_NO_INPUT']['1'];
            });
            conv.ask(content);
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
        return contentRef.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                content = doc.data()['actions_intent_NO_INPUT']['IS_FINAL_REPROMPT'];
            });
            conv.close(content);
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    }
});

// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);