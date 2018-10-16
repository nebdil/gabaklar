# GABAKLAR

A Google Action that helps get information on the wind while sailing. It gets the wind speed and wind direction in your current location via the OpenWeatherMap API.

![Design Diagram](/docs/diagram.png)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes for the live demo.

### Prerequisites

Ngrok is required for development.
Firebase CLI is required to test the Google Firebase Cloud Functions.

### Installation

Setup Firebase CLI: https://firebase.google.com/docs/functions/get-started

Ensure you are in cloned repo folder (`cd gabaklar`).

Then install and start the function:

```
npm install
firebase serve --only functions
```
Open up another shell and run ngrok:

```
ngrok http 5000
```
TODO: instructions for DialogFlow
https://342dc324.ngrok.io/gabaklar-eef92/us-central1/dialogflowFirebaseFulfillment

## Tests
Tests are conducted by botium: https://www.botium.at/
TODO: https://github.com/actions-on-google/actions-on-google-testing-nodejs

## Deployment
TODO: alpha version instructions

## Authors

* Dilan Nebioglu