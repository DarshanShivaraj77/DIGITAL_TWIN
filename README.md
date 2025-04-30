Digital Twin Project - Real-time Motion Tracking with MPU6050
Project Overview
This project creates a digital twin that mirrors real-world motion using an MPU6050 IMU sensor. The system consists of:

An ESP32 microcontroller with MPU6050 sensor

A Node.js server processing sensor data

A Three.js web application visualizing the motion in 3D

Hardware Requirements
ESP32 development board

MPU6050 IMU sensor

Micro USB cable

Jumper wires

Servo motor (optional for physical feedback)

Software Requirements
Arduino IDE (for ESP32 programming)

Node.js (for server)

Modern web browser (Chrome/Firefox recommended)

Setup Instructions
1. Arduino Setup (ESP32)
Install Arduino IDE from arduino.cc

Add ESP32 support:

Go to File > Preferences

Add https://dl.espressif.com/dl/package_esp32_index.json to Additional Boards Manager URLs

Install "ESP32" from Tools > Board > Boards Manager

Install required libraries:

Adafruit MPU6050

PubSubClient

Arduino_JSON

ESP32Servo

Connect your MPU6050 to ESP32:

SCL → GPIO 22

SDA → GPIO 21

VCC → 3.3V

GND → GND

Modify the Arduino code:

Update WiFi credentials in ssid and password

Change mqttServer to your MQTT broker IP

Adjust servo pin if needed

2. Server Setup
Install Node.js from nodejs.org

Install dependencies:

bash
npm install ws mqtt
Configure the server:

Update MQTT broker IP in server.js

Adjust filter parameters if needed (KP, KI values)

Run the server:

bash
node server.js
3. Web Application
Place the 3D model (ybot.gltf) in /models/ directory

Place HDR environment texture in /textures/ directory

Open index.html in a web browser

Calibration and Operation
Place the MPU6050 on a flat surface during startup for automatic calibration

The system will:

Calibrate gyroscope offsets (takes ~5 seconds)

Establish WiFi and MQTT connections

Begin streaming data to the server

In the web interface:

Use mouse to orbit the camera

The model's right forearm will mirror your sensor movements

Configuration Points
Arduino Code
FREQ: Sampling frequency (default 62.5Hz)

alpha: Complementary filter coefficient

calibrationSamples: Number of samples for gyro calibration

gyroThreshold/accThreshold: Minimum values for data transmission

Server Code
Mahony(kp, ki): AHRS filter parameters

stationaryThreshold: Minimum movement detection

alpha: Low-pass filter coefficient

gyroScaleFactor: Sensitivity adjustment

Web Application
Model path: /ybot.gltf

Environment map: /textures/park_parking_4k.hdr

Interpolation speed: slerp() parameter in WebSocket handler

Troubleshooting
No data in web interface:

Check ESP32 serial monitor for connection status

Verify MQTT broker is running

Ensure WebSocket server is active (node server.js)

Jerky movements:

Increase low-pass filter alpha value

Adjust gyroThreshold to filter small movements

Modify gyroScaleFactor to reduce sensitivity

Model not loading:

Check browser console for errors

Verify model path is correct

Ensure CORS policies allow local file loading

Project Structure
digital-twin-motion-tracking/
├── arduino/                # ESP32 firmware
│   └── mpu6050_mqtt.ino
├── server/                 # Node.js server
│   └── server.js
├── web/                    # Three.js application
│   ├── js/
│   │   └── main.js
│   ├── models/             # 3D models
│   ├── textures/           # Environment maps
│   └── index.html
├── README.md               # This file
└── LICENSE
Future Enhancements
Add multiple sensor support for full-body tracking

Implement calibration routine in web interface

Add recording/playback functionality

Support for different 3D avatars

Mobile-friendly interface
