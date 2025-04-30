#include <WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Arduino_JSON.h>
#include <ESP32Servo.h>

// WiFi and MQTT Configuration
const char* ssid = "Disha on the go!";   
const char* password = "rishad007"; 
const char* mqttServer = "192.168.139.229";  
const int mqttPort = 1883;                     
const char* topic = "test/topic";           

// IMU and Filter Parameters
#define FREQ 62.5  // Sample frequency in Hz
#define SAMPLE_DELAY (1000/FREQ)
const float alpha = 0.96;  // Complementary filter coefficient

// Servo Configuration
Servo roll_servo;
const int servoPin = 13;  // Use appropriate GPIO pin

// MPU Calibration
float gyrXoffs = 0, gyrYoffs = 0, gyrZoffs = 0;
const int calibrationSamples = 500;

// Global Variables
WiFiClient espClient;
PubSubClient client(espClient);
Adafruit_MPU6050 mpu;
sensors_event_t a, g, temp;

JSONVar readings;
float gx = 0, gy = 0, gz = 0;  // Filtered angles
float gyroX = 0, gyroY = 0, gyroZ = 0;
float accX = 0, accY = 0, accZ = 0;

unsigned long lastTime = 0;
unsigned long lastPublishTime = 0;
const float gyroThreshold = 0.02;
const float accThreshold = 0.05;

void setupWiFi() {
  delay(10);
  Serial.println("\nConnecting to " + String(ssid));
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
}

void connectToMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("ESP32Client")) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      delay(2000);
    }
  }
}

void calibrateMPU() {
  Serial.println("Calibrating MPU...");
  float gyrXsum = 0, gyrYsum = 0, gyrZsum = 0;
  
  for (int i = 0; i < calibrationSamples; i++) {
    mpu.getEvent(&a, &g, &temp);
    gyrXsum += g.gyro.x;
    gyrYsum += g.gyro.y;
    gyrZsum += g.gyro.z;
    delay(5);
  }
  
  gyrXoffs = gyrXsum / calibrationSamples;
  gyrYoffs = gyrYsum / calibrationSamples;
  gyrZoffs = gyrZsum / calibrationSamples;
  
  Serial.printf("Calibration offsets: X:%.4f, Y:%.4f, Z:%.4f\n", 
                gyrXoffs, gyrYoffs, gyrZoffs);
}

void initMPU() {
  if (!mpu.begin()) {
    Serial.println("MPU6050 not found!");
    while (1) delay(10);
  }
  
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  calibrateMPU();
}

void processIMUData() {
  mpu.getEvent(&a, &g, &temp);
  
  // Get raw data with calibration offsets
  float gyroX_raw = g.gyro.x - gyrXoffs;
  float gyroY_raw = g.gyro.y - gyrYoffs;
  float gyroZ_raw = g.gyro.z - gyrZoffs;
  
  accX = a.acceleration.x;
  accY = a.acceleration.y;
  accZ = a.acceleration.z;

  // Calculate angles from accelerometer
  float accAngleX = atan2(accY, sqrt(accX*accX + accZ*accZ)) * 180/M_PI;
  float accAngleY = atan2(-accX, sqrt(accY*accY + accZ*accZ)) * 180/M_PI;

  // Integrate gyro data
  gx += gyroX_raw * (1.0/FREQ);
  gy += gyroY_raw * (1.0/FREQ);
  gz += gyroZ_raw * (1.0/FREQ);

  // Apply complementary filter
  gx = alpha * gx + (1 - alpha) * accAngleX;
  gy = alpha * gy + (1 - alpha) * accAngleY;

  // Update servo position
  roll_servo.write(gx + 90);  // Adjust offset as needed

  // Prepare JSON data
  readings["gyroX"] = gyroX_raw;
  readings["gyroY"] = gyroY_raw;
  readings["gyroZ"] = gyroZ_raw;
  readings["accX"] = accX;
  readings["accY"] = accY;
  readings["accZ"] = accZ;
  readings["angleX"] = gx;
  readings["angleY"] = gy;
}

void publishData() {
  String jsonString = JSON.stringify(readings);
  client.publish(topic, jsonString.c_str());
  Serial.println("Published: " + jsonString);
}

void setup() {
  Serial.begin(115200);
  ESP32PWM::allocateTimer(0);  // Mandatory for ESP32
  roll_servo.setPeriodHertz(50);  // Standard 50Hz servo
  roll_servo.attach(servoPin, 550, 2550);  // Min/max pulse width
  setupWiFi();
  client.setServer(mqttServer, mqttPort);
  connectToMQTT();
  initMPU();
}

void loop() {
  unsigned long currentTime = millis();
  
  if (!client.connected()) connectToMQTT();
  client.loop();

  if (currentTime - lastTime >= SAMPLE_DELAY) {
    processIMUData();
    lastTime = currentTime;
    
    // Throttle MQTT publishing to 10Hz
    if (currentTime - lastPublishTime >= 100) {
      publishData();
      lastPublishTime = currentTime;
    }
  }
}