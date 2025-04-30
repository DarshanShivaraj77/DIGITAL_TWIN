import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

function printModelParts(object, depth = 0) {
    console.log(${' '.repeat(depth * 2)}- ${object.name} (${object.type}));
    object.children.forEach(child => printModelParts(child, depth + 1));
}

// Scene setup
const scene = new THREE.Scene();

// Load HDR environment
new RGBELoader().load('/textures/park_parking_4k.hdr', function(texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  scene.environment = texture;
});

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

// Load Model
let model, rightForeArm;
new GLTFLoader().load('/ybot.gltf', (gltf) => {
  model = gltf.scene;
  model.traverse((child) => {
    if (child.name.toLowerCase().includes("rightforearm")) rightForeArm = child;
  });
  console.log("Model Loaded:", gltf); // Log full model data
  console.log("Model Parts:"); // Log direct children of the model
  printModelParts(gltf.scene);


  if (!rightForeArm) {
    console.error("RightForeArm bone not found!");
    return;
  }

  model.scale.set(2, 2, 2);
  scene.add(model);
});

// WebSocket connection & handling
let ws;
function connectWebSocket() {
  ws = new WebSocket('ws://localhost:8080');

  ws.onmessage = (event) => {
    try {
      const q = JSON.parse(event.data);
      if (rightForeArm) {
        // Smooth quaternion interpolation (avoids sudden jerks)
        rightForeArm.quaternion.slerp(new THREE.Quaternion(q.x, q.y, q.z, q.w), 0.1);
      }
    } catch (error) {
      console.error('Data error:', error);
    }
  };

  ws.onerror = (err) => console.error("WebSocket error:", err);

  ws.onclose = () => {
    console.warn("WebSocket closed. Reconnecting in 3 seconds...");
    setTimeout(connectWebSocket, 3000); // Auto-reconnect
  };
}

connectWebSocket(); // Initialize WebSocket

// Controls and animation loop
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});