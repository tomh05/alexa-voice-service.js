# Fauxlexa
A testing tool for Alexa.

## What is it?
Fauxlexa allows testers to create repeatable tests on a simulated Alexa device. It uses Alexa Voice Service to send and receive audio files, in a similar manner to https://echosim.io/.

It runs entirely in your browser and calls AVS directly, so there is no need to have a seperate test server.

## Installation
Check out this repository and enter the directory:
```bash
git clone git@github.com:tomh05/alexa-voice-service.js.git
cd alexa-voice-service.js
```
Then start the local HTTP server:
```bash
npm start
```
Now visit [https://localhost:9745/](https://localhost:9745/) in a modern browser (tested in Chrome).

## Usage
You will need to **log in** and give your Amazon credentials. This will create a virtual Alexa device on your account.

Each test consists of 1 or more **interactions**. An interaction is when a user says something to Alexa.

The test ends when any of the following happen:
1. Alexa doesn't prompt the user for any more speech
2. The user doesn't respond to a prompt
3. An error is encountered

Suppose you wanted to test the following dialogue:
**User**: Alexa, open the BBC
*Alexa: Welcome to the BBC, tell me a radio station you would like to play*
**User**: Radio 1
*Alexa: Here's Radio 1...<station plays>*

You would create a test with two interactions:

interaction 1: "open the BBC"
interaction 2: "Radio 1"

**Tip:** Don't include the wake word ("Alexa") in your recordings. The "device" is already woken up. 

**Tip:** You can set names for tests/interactions. You could name them after the speech they contain, to make the test readable e.g. "open the BBC" or "ask the BBC to play 6 music".

## Development
If you make any changes to the source, you must then rebuild JS bundle:
```bash
npm run build
```
Alternatively, have this command running in a separate terminal to automatically build changes:
```bash
npm run watch
```

## Config

Set AVS config object in the constructor

```javascript
const avs = new AVS({
  clientId: 'amzn1.application-oa2-client.123...',
  deviceId: 'example_device',
  deviceSerialNumber: 123,
  redirectUri: `https://example.com/authresponse`
});
```
# Acknowlegements and License
AVS interaction is based on Miguel Mota's AVS client https://github.com/miguelmota/alexa-voice-service.js , which is under MIT license.
