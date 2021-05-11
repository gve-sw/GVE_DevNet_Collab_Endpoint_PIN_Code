/*
Copyright (c) 2021 Cisco and/or its affiliates.

This software is licensed to you under the terms of the Cisco Sample
Code License, Version 1.1 (the "License"). You may obtain a copy of the
License at

               https://developer.cisco.com/docs/licenses

All use of the material herein must be in accordance with the terms of
the License. All rights not expressly granted by the License are
reserved. Unless required by applicable law or agreed to separately in
writing, software distributed under the License is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied.
*/

const xapi = require('xapi');

const MAX_TRIES = 3;
const TIME_TO_DISABLE = 2; // In minutes

// Counter to keep track of the number of tries
var curr_tries = 1;

// PIN code variable, to be setup by the user from a prompt window
// Value is written & read from a local database_macro created below
var pin_code;

// Boolean to check if the pin code for device has been configure or not. 
// Value is  written & read from a local database_macro created below
var pin_is_configured;

// Boolean to keep track if the device was disabled for entering the wrong PIN
var device_is_disabled = false;

// Variable to keep track of the remaining time
var remaining_time = 0; // In seconds

// These variables are to be stored to a local inactive macro
const DEFAULT_ENV = {
    pin_is_configured: false,
    pin_code: '1234'
}

//  Configure if the environment should be storing a volatile or persist environment variables into the inactive ENV macro
//  - true for transient variables (any change will not survive Macro restart)
//  - false for persisted variables (changes are persisted into a MACRO_DB_NAME file of a macro)
let volatile = false;
const MACRO_DB_NAME = 'LOCAL_DB_PIN_CODE'; // name of the database_macro where variables are persisted (if enabled)

// Creating env variable to read/write data from/to the inactive database_macro
let ENV;

// Once the macro is started, initialize the environment of the inactive database_macro, or create it if it doesn't exist
require('xapi').on('ready', async (xapi) => {

    // Initialize environment
    await initEnvironment(xapi);

});

// Initiating the environment
async function initEnvironment(xapi) {

    // Volatile mode
    if (volatile) {
        // List of variables for the local environment
        console.info('Starting in volatile mode: environment variables are not persisted');
        ENV = DEFAULT_ENV;
        return;
    }

    // Persistent mode
    console.info('Starting in persistent mode: environment variables are stored in ' + MACRO_DB_NAME + ' macro.');
    let data;
    try {
        data = await read(xapi, true);
    }
    catch (err) {
        if (err.message == 'DB_READ_ERROR') {
            console.log("Cannot access the database_macro: " + MACRO_DB_NAME);
        }
        else {
            console.info(`Unexpected read error while accessing DB: ${JSON.stringify(err.message)}`)
        }
    }

    // if ENV is empty, create a new databe_macro with default ENV
    if (!data) {
        console.info('No existing database_macro. Creating the default environment at: ' + MACRO_DB_NAME);
        ENV = DEFAULT_ENV;
        try {
            await write(xapi, ENV);
        }
        catch (err) {
            console.debug(`Write error while creating DB: ${JSON.stringify(err.message)}`)
            console.info('Changing to non-persistent mode.');
            volatile = true;
        }
    }
    else {
        ENV = data;
        // Update the pin-code variables from what was read from the inactive database_macro
        pin_is_configured = ENV['pin_is_configured'];
        pin_code = ENV['pin_code'];
        console.log('PIN code data has been read from: ' + MACRO_DB_NAME);
    }
}

// Database persistence into the inactive database_macro 
const PREFIX = 'const json = ';

// Read the database_macro contents
async function read(xapi, env_is_available) {
    // Load contents
    let contents;
    try {
        let macro = await xapi.command('Macros Macro Get', { Name: MACRO_DB_NAME, Content: true })
        contents = macro.Macro[0].Content.substring(PREFIX.length);
    }
    catch (err) {
        if (!env_is_available) {
            // Log error is ENV should exist
            console.error(`Cannot load contents from macro: ${MACRO_DB_NAME}`);
        }
        throw new Error("DB_READ_ERROR");
    }

    // Parse contents
    try {
        console.debug(`DB contains: ${contents}`);
        let data = JSON.parse(contents);
        console.debug('DB successfully parsed: ' + contents);
        return data;
    }
    catch (err) {
        console.error('DB is corrupted, cannot JSON parse the DB');
        throw new Error('DB_PARSE_ERROR');
    }
}

// Write the database_macro contents
async function write(xapi, data) {
    // Serialize data as JSON and append prefix
    let contents;
    try {
        contents = PREFIX + JSON.stringify(data);
    }
    catch (err) {
        console.debug('Contents cannot be serialized to JSON');
        throw new Error('DB_SERIALIZE_ERROR');
    }

    // Write
    try {
        let res = await xapi.command('Macros Macro Save', { Name: MACRO_DB_NAME, OverWrite: true, body: contents });
        return (res.status == 'OK');
    }
    catch (err) {
        if (err.message == 'Max number of macros reached.') {
            console.error('Max number of macros reached. Please free up some space.');
            throw new Error('DB_MACROS_LIMIT');
        }

        console.debug(`Cannot write contents to macro: ${MACRO_DB_NAME}`);
        throw new Error('DB_WRITE_ERROR');
    }
}

// Show the window to setup a new PIN code
function setupPin(text = 'Hello!<br>Enter a new PIN code to lock this device:') {
    console.log('Asking the user to setup a new pin..');
    xapi.command('UserInterface Message TextInput Display', {
        FeedbackId: 'setup-pin',
        Text: text,
        InputType: 'PIN',
        Placeholder: ' ',
        Duration: 0,
    });
}

// Show the window to verify the entered PIN code
function verifyPin(text = 'Enter the PIN code again to confirm:') {
    console.log('Asking the user to verify the pin..');
    xapi.command('UserInterface Message TextInput Display', {
        FeedbackId: 'verify-pin',
        Text: text,
        InputType: 'PIN',
        Placeholder: ' ',
        Duration: 0,
    });
}

// Show the window to ask for PIN code
function askForPin(text = 'Enter PIN code:<br>(' + curr_tries + '/' + MAX_TRIES + ')') {
    xapi.command('UserInterface Message TextInput Display', {
        FeedbackId: 'check-pin',
        Text: text,
        InputType: 'PIN',
        Placeholder: ' ',
        Duration: 0,
    });
}

// Alerting about the disablement of the device
function alertDisabledDevice() {
    var text = 'Device is disabled! Wait for the remaining time or contact support...';
    xapi.command('UserInterface Message TextInput Display', {
        FeedbackId: 'device-disabled-alert',
        Text: text + '<br>Remaining time: ' + remaining_time,
        InputType: 'PIN',
        KeyboardState: 'Closed',
        Placeholder: ' ',
        Duration: 0,
    });
}

// Get current time (two digits each) and timezone. Example: 04-04-2021 18:06:37 (GMT+3)
function getTime() {
    var now = new Date();
    var date = ("0" + now.getDate()).slice(-2) + "-" + ("0" + (now.getMonth() + 1)).slice(-2) + "-" + now.getFullYear();
    var time = ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2) + ":" + ("0" + now.getSeconds()).slice(-2);
    var timezone = (now.getTimezoneOffset() / -60);
    var dateTime = date + ' ' + time + ' (GMT' + (timezone <= 0 ? "" : "+") + timezone + ")";
    return dateTime;
}

// Resetting the number of tries
function resetTries() {
    curr_tries = 1;
    console.log('Number of tries has been reset');
}

// Handling the response of the PIN entering prompt
function checkPin(inserted_code) {
    console.log('Try PIN', inserted_code);
    if (inserted_code === pin_code) {
        console.log('PIN was accepted');
        resetTries();
    }
    else if (inserted_code === '') {
        console.log('Empty pin was inserted');
        askForPin();
    }
    else {
        console.log('PIN was failed');
        // Check if MAX_TRIES is reached, then disable the device
        if (curr_tries == MAX_TRIES) {
            console.log('Reached maximum tries..');
            disable_device(TIME_TO_DISABLE);
        }
        else {
            curr_tries++;
            console.log(curr_tries + ' out of ' + MAX_TRIES + ' tries..');
            askForPin('Incorrect PIN, try again: ' + '(' + curr_tries + '/' + MAX_TRIES + ')');
        }
    }
}

// Disable the device after reaching the maximum number of tries
function disable_device() {
    console.log('Disabling device for ' + TIME_TO_DISABLE + ' minute/s starting at: ' + getTime());
    device_is_disabled = true;
    remaining_time = (TIME_TO_DISABLE * 60);

    // Setting time to undisable the device after the remaining time ends
    setTimeout(() => {
        undisable_device();
    }, TIME_TO_DISABLE * 60000);

    // Updating remaining_time and the alert every second
    for (var i = 0; i < remaining_time; i++) {
        setTimeout(() => {
            remaining_time--;
            alertDisabledDevice();
        }, i * 1000);
    }
}

// Undisable the device after the timeout is completed
function undisable_device() {
    console.log('Device has been undisabled at: ' + getTime());
    device_is_disabled = false;
    resetTries();
    xapi.command('UserInterface Message TextInput Clear', {
        FeedbackId: 'device-disabled-alert',
    });
}

// Handling events to trigger askForPin, disabling the device, etc..
function listenToEvents() {
    // when the user submits a TextInput form
    xapi.event.on('UserInterface Message TextInput Response', (event) => {
        // If clicked OK on check-pin
        if (event.FeedbackId === 'check-pin')
            checkPin(event.Text);
        // Else if clicked OK on disabled-device-alert
        else if (event.FeedbackId === 'device-disabled-alert') {
            if (device_is_disabled) alertDisabledDevice();
            else askForPin();
            xapi.command('Standby Halfwake');
        }
        else if (event.FeedbackId === 'setup-pin') {
            if(event.Text === '') {
                console.log('Empty pin was inputted..');
                setupPin('PIN code can\'t be empty!<br>Enter a new PIN code to lock this device:');
            }
            else {
                console.log('PIN code is setup to be: ' + event.Text);
                pin_code = event.Text;
                verifyPin();
            }
        }
        else if (event.FeedbackId === 'verify-pin') {
            if (event.Text != pin_code) {
                console.log('Verification pin is wrong..');
                setupPin('The code you entered doesn\'t match!<br>Enter a new PIN code to lock this device:');
            }
            else {
                console.log('Verification completed.. pin code is configured: ' + pin_code);
                pin_is_configured = true;
                ENV['pin_is_configured'] = true;
                ENV['pin_code'] = pin_code;
                try {
                    write(xapi, ENV);
                }
                catch (err) {
                    console.debug(`Write error while updating DB: ${JSON.stringify(err.message)}`);
                }
            }
        }
    });
    // when the user cancels a TextInput form
    xapi.event.on('UserInterface Message TextInput Clear', (event) => {
        // If clicked cancel on check-pin
        if (event.FeedbackId === 'check-pin') {
            askForPin();
            xapi.command('Standby Halfwake');
        }
        // Else if clicked cancel on disabled-device-alert
        else if (event.FeedbackId === 'device-disabled-alert') {
            if (device_is_disabled) alertDisabledDevice();
            else askForPin();
            xapi.command('Standby Halfwake');
        }
        // Else if clicked cancel on setup-pin
        else if (event.FeedbackId === 'setup-pin') {
            console.log('Setting up PIN was canceled..');
        }
        // Else if clicked cancel on verify-pin
        else if (event.FeedbackId === 'verify-pin') {
            console.log('Verification canceled..');
        }
    });
    // when the device changes its Standby State
    xapi.status.on('Standby State', (state) => {
        // When the device is awaken from Standby State
        if (state === 'Off') {
            if (device_is_disabled) alertDisabledDevice();
            else {
                if (pin_is_configured) askForPin();
                else setupPin();
            }
        }
    });
}

listenToEvents();