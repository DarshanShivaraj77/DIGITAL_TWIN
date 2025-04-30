Digital Twin Project - Real-time Motion Tracking with MPU6050
Project Overview
This project creates a digital twin that mirrors real-world motion using an MPU6050 IMU sensor. The system consists of three main components: ESP32 microcontroller with MPU6050 sensor (Arduino), Node.js server for data processing (JavaScript), and Three.js web application for 3D visualization.

Hardware Requirements
ESP32 development board

MPU6050 IMU sensor

Micro USB cable for programming/power

Jumper wires (female-to-male recommended)

Servo motor (optional for physical feedback)

Breadboard (optional)

Software Requirements
Arduino IDE (v2.0+ recommended)

Node.js (LTS version recommended)

Web browser with WebGL support (Chrome/Firefox/Edge)

MQTT broker (Mosquitto or cloud service)

Complete Installation Guide
1. Arduino Setup (ESP32)
Install Arduino IDE

Add ESP32 board support:

File > Preferences > Additional Boards Manager URLs

Add: https://dl.espressif.com/dl/package_esp32_index.json

Tools > Board > Boards Manager > Search "ESP32" > Install

Install required libraries:

Sketch > Include Library > Manage Libraries

Search and install: Adafruit MPU6050, PubSubClient, Arduino_JSON, ESP32Servo

2. Hardware Connections
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

3. Server Setup
Install Node.js

Create server directory and install dependencies:

bash
mkdir server
cd server
npm init -y
npm install ws mqtt
Save server.js in this directory

Start server:

bash
node server.js
4. Web Application Setup
Create project structure:
project-root/
├── arduino/
│ └── mpu6050_mqtt.ino
├── server/
│ └── server.js
├── web/
│ ├── js/
│ │ └── main.js
│ ├── models/
│ │ └── ybot.gltf
│ ├── textures/
│ │ └── park_parking_4k.hdr
│ └── index.html

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

Start components: MQTT broker → Node.js server → Web interface → ESP32

Motion tracking: Move MPU6050 and observe 3D model mirroring movements

Troubleshooting Table
Symptom	Solution
No data in web app	Check server console
ESP32 not connecting	Verify WiFi credentials
Jerky movements	Increase filter alpha
Model not loading	Check browser console
Project Structure
digital-twin/
├── arduino/
├── server/
├── web/
├── docs/
├── README.md
└── LICENSE
