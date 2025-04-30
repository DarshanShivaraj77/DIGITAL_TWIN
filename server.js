const WebSocket = require('ws');
const mqtt = require('mqtt');

class Mahony {
  constructor(kp = 5.0, ki = 0.0) { // Increased Kp for faster response
    this.kp = kp;
    this.ki = ki;
    this.q0 = 1.0;
    this.q1 = this.q2 = this.q3 = 0.0;
    this.integralFBx = this.integralFBy = this.integralFBz = 0.0;
    this.initialized = false; // Flag to track if initial orientation has been set
  }

  reset() {
    // Reset the quaternion to identity but keep other parameters
    this.q0 = 1.0;
    this.q1 = this.q2 = this.q3 = 0.0;
    this.integralFBx = this.integralFBy = this.integralFBz = 0.0;
    this.initialized = false;
  }

  // Function to set initial orientation based on current sensor readings
  setInitialOrientation(ax, ay, az) {
    // Only set initial orientation once
    if (this.initialized) return;
    
    // Normalize accelerometer to get gravity direction
    const normAcc = Math.sqrt(ax * ax + ay * ay + az * az);
    if (normAcc < 1e-3) return; // Prevent division by zero
    
    ax /= normAcc;
    ay /= normAcc;
    az /= normAcc;
    
    // Calculate quaternion from accelerometer (simplified method)
    // This sets the initial orientation based on gravity direction
    const roll = Math.atan2(ay, az);
    const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));
    
    // Convert to quaternion
    const cy = Math.cos(roll * 0.5);
    const sy = Math.sin(roll * 0.5);
    const cp = Math.cos(pitch * 0.5);
    const sp = Math.sin(pitch * 0.5);
    
    this.q0 = cy * cp;
    this.q1 = sy * cp;
    this.q2 = cy * sp;
    this.q3 = -sy * sp;
    
    // Normalize quaternion
    const normQ = Math.sqrt(this.q0 * this.q0 + this.q1 * this.q1 + 
                           this.q2 * this.q2 + this.q3 * this.q3);
    this.q0 /= normQ;
    this.q1 /= normQ;
    this.q2 /= normQ;
    this.q3 /= normQ;
    
    this.initialized = true;
    console.log("Initial orientation set from sensor readings");
  }

  updateIMU(gx, gy, gz, ax, ay, az, dt) {
    // Set initial orientation if not already set
    if (!this.initialized) {
      this.setInitialOrientation(ax, ay, az);
      return;
    }
    
    let { q0, q1, q2, q3 } = this;

    // Normalize accelerometer
    const normAcc = Math.sqrt(ax * ax + ay * ay + az * az);
    if (normAcc < 1e-3) return; // Prevent division by zero
    ax /= normAcc;
    ay /= normAcc;
    az /= normAcc;

    // Gravity direction
    const vx = 2 * (q1 * q3 - q0 * q2);
    const vy = 2 * (q0 * q1 + q2 * q3);
    const vz = 2 * (0.5 - q1 * q1 - q2 * q2);

    // Error between measured and expected gravity
    const ex = (ay * vz - az * vy);
    const ey = (az * vx - ax * vz);
    const ez = (ax * vy - ay * vx);

    // Apply integral feedback if Ki > 0
    this.integralFBx += this.ki * ex * dt;
    this.integralFBy += this.ki * ey * dt;
    this.integralFBz += this.ki * ez * dt;

    // Apply proportional feedback
    gx += this.kp * ex + this.integralFBx;
    gy += this.kp * ey + this.integralFBy;
    gz += this.kp * ez + this.integralFBz;

    // Scale gyro values to prevent excessive rotation
    // Reducing the scaling factor to make movements less extreme
    const gyroScaleFactor = 0.75; // Adjust this value to tune sensitivity
    gx *= gyroScaleFactor;
    gy *= gyroScaleFactor;
    gz *= gyroScaleFactor;

    // Quaternion update
    const qDot1 = 0.5 * (-q1 * gx - q2 * gy - q3 * gz);
    const qDot2 = 0.5 * (q0 * gx + q2 * gz - q3 * gy);
    const qDot3 = 0.5 * (q0 * gy - q1 * gz + q3 * gx);
    const qDot4 = 0.5 * (q0 * gz + q1 * gy - q2 * gx);

    // Integrate quaternion rate of change
    q0 += qDot1 * dt;
    q1 += qDot2 * dt;
    q2 += qDot3 * dt;
    q3 += qDot4 * dt;

    // Normalize quaternion
    const normQ = Math.sqrt(q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);
    this.q0 = q0 / normQ;
    this.q1 = q1 / normQ;
    this.q2 = q2 / normQ;
    this.q3 = q3 / normQ;
  }

  getQuaternion() {
    return { x: this.q1, y: this.q2, z: this.q3, w: this.q0 };
  }
}

// WebSocket & MQTT setup
const wss = new WebSocket.Server({ port: 8080 });
const mqttClient = mqtt.connect('mqtt://192.168.139.229:1883');
const topic = "test/topic";

const filter = new Mahony(5.0, 0.0); // Faster response
let lastUpdate = performance.now();
let stationaryThreshold = 0.015; // Prevent tracking small movements (higher value)
let stationary = false;

// Low-pass filter to reduce noise
let prevGyro = { x: 0, y: 0, z: 0 };
let prevAcc = { x: 0, y: 0, z: 0 };
const alpha = 0.75; // Slightly lower smoothing for faster response

// MQTT Handling
mqttClient.on('connect', () => {
  console.log('Connected to MQTT Broker');
  mqttClient.subscribe(topic, err => {
    if (err) console.error('MQTT Subscription error:', err);
  });
});

mqttClient.on('message', (receivedTopic, message) => {
  if (receivedTopic !== topic) return;

  try {
    const data = JSON.parse(message.toString());

    // Parse sensor values - ensure they're proper numbers
    let gyroX = parseFloat(data.gyroX);
    let gyroY = parseFloat(data.gyroY);
    let gyroZ = parseFloat(data.gyroZ);
    let accX = parseFloat(data.accX);
    let accY = parseFloat(data.accY);
    let accZ = parseFloat(data.accZ);

    // Check for NaN values and replace with 0 if necessary
    if (isNaN(gyroX)) gyroX = 0;
    if (isNaN(gyroY)) gyroY = 0;
    if (isNaN(gyroZ)) gyroZ = 0;
    if (isNaN(accX)) accX = 0;
    if (isNaN(accY)) accY = 0;
    if (isNaN(accZ)) accZ = 0;

    // Apply threshold to gyro values to reduce sensitivity
    // This helps prevent over-rotation
    const gyroThreshold = 0.01; // Adjust this value to tune sensitivity
    if (Math.abs(gyroX) < gyroThreshold) gyroX = 0;
    if (Math.abs(gyroY) < gyroThreshold) gyroY = 0;
    if (Math.abs(gyroZ) < gyroThreshold) gyroZ = 0;

    // Apply Low-Pass Filter to Gyro & Accel Data
    gyroX = alpha * prevGyro.x + (1 - alpha) * gyroX;
    gyroY = alpha * prevGyro.y + (1 - alpha) * gyroY;
    gyroZ = alpha * prevGyro.z + (1 - alpha) * gyroZ;
    accX = alpha * prevAcc.x + (1 - alpha) * accX;
    accY = alpha * prevAcc.y + (1 - alpha) * accY;
    accZ = alpha * prevAcc.z + (1 - alpha) * accZ;

    prevGyro = { x: gyroX, y: gyroY, z: gyroZ };
    prevAcc = { x: accX, y: accY, z: accZ };

    // Detect if sensor is stationary (higher threshold prevents tracking small reversals)
    stationary = Math.abs(gyroX) < stationaryThreshold &&
                 Math.abs(gyroY) < stationaryThreshold &&
                 Math.abs(gyroZ) < stationaryThreshold;

    // If stationary, reset integral feedback to prevent drift
    if (stationary) {
      filter.integralFBx = 0;
      filter.integralFBy = 0;
      filter.integralFBz = 0;
    } else {
      const now = performance.now();
      const dt = (now - lastUpdate) / 1000.0; // Convert to seconds
      lastUpdate = now;

      // Update Mahony Filter
      filter.updateIMU(gyroX, gyroY, gyroZ, accX, accY, accZ, dt);
    }

    // Get quaternion and send to clients
    const quaternion = filter.getQuaternion();
    
    // Add the sensor state information (for debugging)
    const output = {
      ...quaternion,
      initialized: filter.initialized,
      gyro: { x: gyroX, y: gyroY, z: gyroZ },
      acc: { x: accX, y: accY, z: accZ }
    };
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(output));
      }
    });

  } catch (error) {
    console.error('Error processing MQTT message:', error);
    console.error('Message content:', message.toString().slice(0, 200)); // Log the first 200 chars
  }
});

// WebSocket handling
wss.on('connection', ws => {
  console.log('New WebSocket client connected');
  
  // Reset filter to take current orientation as initial when a new client connects
  filter.reset();
  lastUpdate = performance.now();
  
  ws.on('close', () => console.log('WebSocket client disconnected'));
  
  // Allow clients to reset the orientation
  ws.on('message', (message) => {
    try {
      const command = JSON.parse(message);
      if (command.action === 'reset') {
        console.log('Resetting orientation by client request');
        filter.reset();
        lastUpdate = performance.now();
      }
    } catch (e) {
      console.error('Error processing WebSocket message:', e);
    }
  });
});

console.log('WebSocket server running on ws://localhost:8080');