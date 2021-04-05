# GVE_DevNet_Collab_Endpoint_PIN_Code
Cisco Collaboration Endpoints macro that locks a device with a pin code as soon as it goes out of standby. This was inherited from [roomdevices-macros-samples/PinCodeLock](https://github.com/CiscoDevNet/roomdevices-macros-samples/tree/master/Pin%20Code%20Lock) with few enhancments on: 
- Limiting the times allowed to try the pin code
- If the maximum number tries is reached, the device will be disabled for an amount of time 
- If the device was disabled, it will display a count-down showing the remaining time 


## Contacts
* Rami Alfadel (ralfadel@cisco.com)
* Gerardo Chaves (gchaves@cisco.com)

## Solution Components
* Collaboration Endpoints xAPI JavaScript 

## Installation/Configuration

The installation will be done by adding the Macro to the device and enabling it, as follows:  
![/IMAGES/menu.png](/IMAGES/menu.png)  
Integration > Macro Editor > Create a new macro > paste the content of the [JavaScript file](/lock_with_PIN_code.js)


## Usage

- Make sure that standby has not been disabled on your system, otherwise the pin prompt might not appear.
- Once the macro is added to the macro editor, change the following variables in the macro:  
    - Set up the pin number:  
        ```JavaScript
        const PIN_CODE = '1234';
        ```
    - Set up the maximum number of tries:  
        ```JavaScript
        const MAX_TRIES = 3;
        ```
    - Set up the time of the device disablement once the maximum tries has been reached:  
        ```JavaScript
        const TIME_TO_DISABLE = 2; // In minutes
        ```

# Screenshots

![/IMAGES/enter_pin.png](/IMAGES/enter_pin.png)

![/IMAGES/incorrect_pin.png](/IMAGES/incorrect_pin.png)

![/IMAGES/countdown.gif](/IMAGES/countdown.gif)

### LICENSE

Provided under Cisco Sample Code License, for details see [LICENSE](LICENSE.md)

### CODE_OF_CONDUCT

Our code of conduct is available [here](CODE_OF_CONDUCT.md)

### CONTRIBUTING

See our contributing guidelines [here](CONTRIBUTING.md)

#### DISCLAIMER:
<b>Please note:</b> This script is meant for demo purposes only. All tools/ scripts in this repo are released for use "AS IS" without any warranties of any kind, including, but not limited to their installation, use, or performance. Any use of these scripts and tools is at your own risk. There is no guarantee that they have been through thorough testing in a comparable environment and we are not responsible for any damage or data loss incurred with their use.
You are responsible for reviewing and testing any scripts you run thoroughly before use in any non-testing environment.