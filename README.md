# GVE_DevNet_Collab_Endpoint_PIN_Code
Cisco Collaboration Endpoints macro that sets up a pin code that locks a device. And asks for it as the device goes out of standby.  
Parts of this prototype were inherited from:
- Macros sample: Pin Code Lock: [roomdevices-macros-samples/PinCodeLock](https://github.com/CiscoDevNet/roomdevices-macros-samples/tree/master/Pin%20Code%20Lock) 
- Environment variables for Macros: [ObjectIsAdvantag/macros-env](https://github.com/ObjectIsAdvantag/macros-env) 

With added enhancments on: 
- Showing a prompt asking the user to setup a pin code, or ask for it if it was configured
- Storing the pin code to a local inactive macro acting like a database/environment
- Limiting the times allowed to try the pin code
- If the maximum number tries is reached, the device will be disabled for an amount of time 
- If the device was disabled, it will display a count-down showing the remaining time in seconds


## Contacts
* Rami Alfadel (ralfadel@cisco.com)
* Gerardo Chaves (gchaves@cisco.com)

## Solution Components
* Collaboration Endpoints xAPI JavaScript 

## Installation/Configuration

- Make sure that standby has not been disabled on your system, otherwise the pin prompt might not appear.
The installation will be done by adding the Macro to the device and enabling it, as follows:  
![/IMAGES/menu.png](/IMAGES/menu.png)  
Integration > Macro Editor > Create a new macro > paste the content of the [JavaScript file](/lock_with_PIN_code.js)


## Usage

- Once the macro is added to the macro editor, change the following variables in the macro:  
    - Set up the name of the local database_macro where variables are will be stored and persisted:
        ```JavaScript
        const MACRO_DB_NAME = 'LOCAL_DB_PIN_CODE';
        ```
    - Set up the maximum number of tries:  
        ```JavaScript
        const MAX_TRIES = 3;
        ```
    - Set up the time of the device disablement once the maximum tries has been reached:  
        ```JavaScript
        const TIME_TO_DISABLE = 2; // In minutes
        ```
    

- Once the macro is enabled, the other local database_macro will be generated (if it doesn't exist) with the default values located at:
    ```JavaScript
    const DEFAULT_ENV = {
        pin_is_configured: false,
        pin_code: '1234'
    }
    ```
- The local database_macro will act as the environment/database of the enabled one. Storing a json object having two variables; controlling the pin-code settings on the device:
    ```JavaScript
    const json = {"pin_is_configured":false,"pin_code":"1234"}
    ```

- If the user had their pin-code configured but forgot it or having troubles inserting it, they can ask the system admin to either change it manually on the database_macro, or reset the value of ```"pin_is_configured"``` to ```false``` for the user to be able to setup a new one.

![/IMAGES/inactive_database_macro.png](/IMAGES/inactive_database_macro.png)

# Screenshots

- Setting up pin-code:
![/IMAGES/setup_pin_code.png](/IMAGES/setup_pin_code.png)

- Verifying the entered pin-code:
![/IMAGES/verify_pin_code.png](/IMAGES/verify_pin_code.png)

- Asking for pin-code:
![/IMAGES/enter_pin.png](/IMAGES/enter_pin.png)

- Wrong pin-code was entered:
![/IMAGES/incorrect_pin.png](/IMAGES/incorrect_pin.png)

- Maximum number of tries has been reached:
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