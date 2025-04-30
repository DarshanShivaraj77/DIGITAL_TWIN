Here's the complete, properly formatted README.md in a single copy-pasteable block with all markdown formatting preserved:

markdown
# Digital Twin Project - Real-time Motion Tracking with MPU6050

## Project Overview
This project creates a digital twin that mirrors real-world motion using an MPU6050 IMU sensor. The system consists of three main components:
1. ESP32 microcontroller with MPU6050 sensor (Arduino)
2. Node.js server for data processing (JavaScript)
3. Three.js web application for 3D visualization

## Hardware Requirements
- ESP32 development board
- MPU6050 IMU sensor
- Micro USB cable for programming/power
- Jumper wires (female-to-male recommended)
- Servo motor (optional for physical feedback)
- Breadboard (optional)

## Software Requirements
- [Arduino IDE](https://www.arduino.cc/en/software) (v2.0+ recommended)
- [Node.js](https://nodejs.org) (LTS version recommended)
- Web browser with WebGL support (Chrome/Firefox/Edge)
- MQTT broker (Mosquitto or cloud service)

## Complete Installation Guide

### 1. Arduino Setup (ESP32)
1. Install Arduino IDE
2. Add ESP32 board support:
   - File > Preferences > Additional Boards Manager URLs
   - Add: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools > Board > Boards Manager > Search "ESP32" > Install
3. Install required libraries:
   - Sketch > Include Library > Manage Libraries
   - Search and install:
     - Adafruit MPU6050
     - PubSubClient
     - Arduino_JSON
     - ESP32Servo

### 2. Hardware Connections
Connect MPU6050 to ESP32:
MPU6050 ESP32
VCC → 3.3V
GND → GND
SCL → GPIO 22
SDA → GPIO 21


For servo (optional):
Servo ESP32
Red → 5V
Brown → GND
Yellow → GPIO 13


### 3. Server Setup
```bash
mkdir server
cd server
npm init -y
npm install ws mqtt
Save server.js in this directory then start:

bash
node server.js
4. Web Application Setup
Create this structure:

project-root/
├── arduino/
│   └── mpu6050_mqtt.ino
├── server/
│   └── server.js
├── web/
│   ├── js/
│   │   └── main.js
│   ├── models/
│   │   └── ybot.gltf
│   ├── textures/
│   │   └── park_parking_4k.hdr
│   └── index.html
Configuration
Arduino Configuration
Key parameters in mpu6050_mqtt.ino:

cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqttServer = "YOUR_MQTT_BROKER_IP";
const int mqttPort = 1883;
#define FREQ 62.5
const float alpha = 0.96;
Server Configuration
Key parameters in server.js:

javascript
const filter = new Mahony(5.0, 0.0);
let stationaryThreshold = 0.015;
const mqttClient = mqtt.connect('mqtt://YOUR_MQTT_BROKER_IP:1883');
Operation
Calibration: Place MPU6050 on flat surface and power on ESP32

Start components in order:

MQTT broker

Node.js server (node server.js)

Web interface (web/index.html)

ESP32

Motion tracking:

Move MPU6050 sensor

Observe 3D model mirroring movements

Use mouse to rotate camera view

Troubleshooting
Symptom	Solution
No data in web app	Check server console for errors
ESP32 not connecting	Verify WiFi credentials
Jerky movements	Increase filter alpha value
Model not loading	Check browser console for errors
Project Structure
digital-twin/
├── arduino/            # ESP32 firmware
│   ├── mpu6050_mqtt.ino
│   └── libraries/
├── server/             # Node.js server
│   ├── server.js
│   ├── package.json
│   └── node_modules/
├── web/                # Three.js app
│   ├── js/
│   │   └── main.js
│   ├── models/
│   ├── textures/
│   ├── index.html
│   └── styles/
├── docs/
├── README.md
└── LICENSE
Advanced Configuration
Slower movements: Decrease gyroScaleFactor in server.js

Faster response: Increase FREQ in Arduino code

Multiple sensors: Modify I2C addresses and MQTT topics
