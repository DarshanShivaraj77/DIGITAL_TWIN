# Digital Twin Project - Real-time Motion Tracking with MPU6050

## Project Overview
This project creates a **digital twin** that mirrors real-world motion using an **MPU6050 IMU sensor**. The system consists of:

- An **ESP32** microcontroller with MPU6050 sensor  
- A **Node.js** server for processing sensor data  
- A **Three.js** web application for 3D motion visualization  

---

## Hardware Requirements
- ESP32 development board  
- MPU6050 IMU sensor  
- Micro USB cable  
- Jumper wires  
- Servo motor *(optional for physical feedback)*

---

## Software Requirements
- [Arduino IDE](https://www.arduino.cc/en/software) (for ESP32 programming)  
- [Node.js](https://nodejs.org) (for server)  
- Modern web browser *(Chrome or Firefox recommended)*

---

## Setup Instructions

### 1. Arduino Setup (ESP32)
- Install **Arduino IDE**
- Add ESP32 support:
  - Go to **File > Preferences**
  - Add this URL to **Additional Boards Manager URLs**:  
    `https://dl.espressif.com/dl/package_esp32_index.json`
  - Open **Tools > Board > Boards Manager** and install **ESP32**
- Install required libraries:
  - Adafruit MPU6050  
  - PubSubClient  
  - Arduino_JSON  
  - ESP32Servo  
- Connect MPU6050 to ESP32:
 SCL → GPIO 22
 SDA → GPIO 21
 VCC → 3.3V
 GND → GND

- Modify Arduino code:
- Update `ssid` and `password` with your WiFi credentials  
- Set `mqttServer` to your MQTT broker's IP  
- Adjust the servo pin if needed  

---

### 2. Server Setup
- Install Node.js from [nodejs.org](https://nodejs.org)
- Install dependencies:
```bash
npm install ws mqtt
node server.js

Arduino Code
FREQ: Sampling frequency (default: 62.5Hz)

alpha: Complementary filter coefficient

calibrationSamples: Samples for gyro calibration

gyroThreshold / accThreshold: Transmission thresholds

Server Code
Mahony(kp, ki): AHRS filter parameters

stationaryThreshold: Min. movement detection

alpha: Low-pass filter coefficient

gyroScaleFactor: Sensitivity adjustment

Web Application
Model path: /models/ybot.gltf

Environment map: /textures/park_parking_4k.hdr

Interpolation: Adjust slerp() speed in WebSocket handler

Project Structure:
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

