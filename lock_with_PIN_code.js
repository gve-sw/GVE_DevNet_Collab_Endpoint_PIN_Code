/*
Copyright (c) 2020 Cisco and/or its affiliates.

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

const PIN_CODE = '1234';
const MAX_TRIES = 3;
const TIME_TO_DISABLE = 2; // In minutes

// Counter to keep track of the number of tries
var curr_tries = 1;

// Boolean to keep track if the device was disabled for entering the wrong PIN
var device_disabled = false;

// Variable to keep track of the remaining time
var remaining_time = 0; // In seconds

// Show the window to ask for PIN code
function askForPin(text = 'Enter PIN code:' + ' (' + curr_tries + '/' + MAX_TRIES + ')<br>(default:1234)') {
    xapi.command('UserInterface Message TextInput Display', {
        FeedbackId: 'pin-code',
        Text: text,
        InputType: 'PIN',
        Placeholder: ' ',
        Duration: 0,
    });
}

// Alerting about the disablement of the device
function alertDisabledDevice() {
    var text = 'Device is disabled! Please contact support...';
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
function onResponse(code) {
    console.log('Try PIN', code);
    if (code === PIN_CODE) {
        console.log('PIN was accepted');
        resetTries();
    }
    else if (code === '') {
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
    device_disabled = true;
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
    device_disabled = false;
    resetTries();
    xapi.command('UserInterface Message TextInput Clear', {
        FeedbackId: 'device-disabled-alert',
    });
}

// Handling events to trigger askForPin, disabling the device, etc..
function listenToEvents() {
    // when the user submits a TextInput form
    xapi.event.on('UserInterface Message TextInput Response', (event) => {
        // If clicked OK on pin-code
        if (event.FeedbackId === 'pin-code')
            onResponse(event.Text);
        // Else if clicked OK on disabled-device-alert
        else if (event.FeedbackId === 'device-disabled-alert') {
            if (device_disabled) alertDisabledDevice();
            else askForPin();
            xapi.command('Standby Halfwake');
        }
    });
    // when the user cancels a TextInput form
    xapi.event.on('UserInterface Message TextInput Clear', (event) => {
        // If clicked cancel on pin-code
        if (event.FeedbackId === 'pin-code') {
            askForPin();
            xapi.command('Standby Halfwake');
        }
        // Else if clicked cancel on disabled-device-alert
        else if (event.FeedbackId === 'device-disabled-alert') {
            if (device_disabled) alertDisabledDevice();
            else askForPin();
            xapi.command('Standby Halfwake');
        }
    });
    // when the device changes its Standby State
    xapi.status.on('Standby State', (state) => {
        // When the device is awaken from Standby State
        if (state === 'Off') {
            if (device_disabled) alertDisabledDevice();
            else askForPin();
        }
    });
}

listenToEvents();