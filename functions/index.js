'use strict';

// Firebase SDK for the fulfillment
const functions = require('firebase-functions');
const {
    actionssdk
} = require('actions-on-google');


// The conversation logic used:
// exports.main = functions.https.onRequest(app);
exports.main = functions.https.onRequest((req, res) => {
    // Initialize the action
    const app = actionssdk({
        request: req,
        response: res,
        debug: true
    });
    
    app.intent('actions.intent.MAIN', (conv) => {
        conv.ask('Hi!');
        conv.close();
    });
    // Here goes our code to handle the request and return a response to the assistant
});