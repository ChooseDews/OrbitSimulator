import * as THREE from "three";
import * as j from "jquery";
let $ = j.default;
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import { WEBGL } from "three/examples/jsm/WebGL.js";
let orbitSolver = require("./numericOrbitSolver");
if (WEBGL.isWebGL2Available() === false) {
  document.body.appendChild(WEBGL.getWebGL2ErrorMessage());
}
let container,
  container2,
  camera,
  controls,
  scene,
  renderer,
  axes,
  camera2,
  scene2,
  renderer2,
  axes2,
  cube,
  CANVAS_WIDTH = 100,
  CANVAS_HEIGHT = 100,
  CAM_DISTANCE = 200,
  earthColor = 0x6aa84f,
  craftColor = 0xadd8e6;

// main canvas
// -----------------------------------------------
// dom
container = document.getElementById("container");

// renderer
renderer = new THREE.WebGLRenderer();
renderer.capabilities.isWebGL2 = true;
renderer.setClearColor(0x000000, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);
// scene
scene = new THREE.Scene();

// camera
camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  1,
  10000
);
camera.position.y = 700;
camera.position.z = 700;
camera.position.x = 700;

controls = new TrackballControls(camera, renderer.domElement);

let scaleFactor = 0.01;

//setup earth & spacecraft
let earth = new THREE.Mesh(
  new THREE.SphereGeometry(6371 * scaleFactor, 8, 8),
  new THREE.MeshBasicMaterial({
    color: earthColor,
    wireframe: true
  })
);
scene.add(earth);
let earthAxes = new THREE.AxisHelper(100);
scene.add(earthAxes);
let spacecraft = new THREE.Mesh(
  new THREE.SphereGeometry(300 * scaleFactor, 32, 32),
  new THREE.MeshBasicMaterial({
    color: craftColor
  })
);
scene.add(spacecraft);
spacecraft.position.set(100, 100, 100);

let accelerationVector = spacecraft.position.clone().negate();
accelerationVector.normalize();
let accelerationArrow = new THREE.ArrowHelper(
  accelerationVector,
  spacecraft.position.clone(),
  40,
  0xff0000
);
scene.add(accelerationArrow);
let velocityVector = new THREE.Vector3(4, 1, 0);
velocityVector.normalize();
let velocityArrow = new THREE.ArrowHelper(
  velocityVector,
  spacecraft.position.clone(),
  80,
  0xffff00
);
scene.add(velocityArrow);

let scale = x => x.map(i => i * scaleFactor);

let updateArrow = function() {
  let p = position;

  velocityArrow.position.set(...scale(position));
  accelerationArrow.position.set(...scale(position));

  let aPos = new THREE.Vector3(...scale(position)).negate().normalize();
  let vPos = new THREE.Vector3(...scale(velocity)).normalize();

  accelerationArrow.setDirection(aPos);
  velocityArrow.setDirection(vPos);
};

let curve = new THREE.EllipseCurve(
  0,
  0, // ax, aY
  100,
  50, // xRadius, yRadius
  0,
  2 * Math.PI, // aStartAngle, aEndAngle
  false, // aClockwise
  0 // aRotation
);
let ps = curve.getPoints(50);
let geometry = new THREE.BufferGeometry().setFromPoints(ps);
let material = new THREE.LineBasicMaterial({
  color: 0xff0000
});

// Create the final object to add to the scene
let orbit = new THREE.Line(geometry, material);

let createCrossRose = function() {
  container2 = document.getElementById("inset");
  renderer2 = new THREE.WebGLRenderer();
  renderer2.setClearColor(0x000000, 1);
  renderer2.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
  container2.appendChild(renderer2.domElement);

  scene2 = new THREE.Scene();
  camera2 = new THREE.PerspectiveCamera(
    50,
    CANVAS_WIDTH / CANVAS_HEIGHT,
    1,
    1000
  );
  camera2.up = camera.up; // important!
  axes2 = new THREE.AxisHelper(100);
  scene2.add(axes2);
};

let setText = function(stats) {
  $("#speed-c").text(stats.speed.current);
  $("#speed-max").text(stats.speed.max);
  $("#speed-min").text(stats.speed.min);
  $("#radius-c").text(stats.radius.current);
  $("#radius-max").text(stats.radius.max);
  $("#radius-min").text(stats.radius.min);
};

window.setOrbit = function() {
  position = [
    Number($("#p_x").val()),
    Number($("#p_y").val()),
    Number($("#p_z").val())
  ];
  velocity = [
    Number($("#v_x").val()),
    Number($("#v_y").val()),
    Number($("#v_z").val())
  ];
  stats = {
    speed: {
      min: norm(velocity),
      max: norm(velocity),
      current: norm(velocity)
    },
    radius: {
      min: norm(position),
      max: norm(position),
      current: norm(position)
    }
  };
  console.log("Set Orbit", position, velocity, stats);
  return false;
};

let points = [];
let addPoint = function(p) {
  points.push( new THREE.Vector3(...scale(p)));
  if(points.length > 5){
    var material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
    var geometry = new THREE.BufferGeometry().setFromPoints( points );
    var line = new THREE.Line( geometry, material )
    scene.add( line );
    points = [];
  };
  lastPoint = p;
};

//init position & velocity
let norm = v => Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).toFixed(2);
let position = [30000, 0, 0];
let velocity = [2, 3, 0];
let stats = {
  speed: {
    min: norm(velocity),
    max: norm(velocity),
    current: norm(velocity)
  },
  radius: {
    min: norm(position),
    max: norm(position),
    current: norm(position)
  }
};

function render() {
  renderer.render(scene, camera);
  renderer2.render(scene2, camera2);
}

//handle orbit calculations
(function() {
  setInterval(function() {
    console.time("test");

    let newValues = orbitSolver.step(position, velocity, 396600.4, 300000);
    position = newValues.r;
    velocity = newValues.v;
    updateArrow();
    spacecraft.position.set(
      position[0] * scaleFactor,
      position[1] * scaleFactor,
      position[2] * scaleFactor
    );
    addPoint(position);
    let v = norm(velocity);
    let r = norm(position);
    stats.speed.min = Math.min(stats.speed.min, v);
    stats.speed.max = Math.max(stats.speed.max, v);
    stats.speed.current = v;
    stats.radius.min = Math.min(stats.radius.min, r);
    stats.radius.max = Math.max(stats.radius.max, r);
    stats.radius.current = r;
    setText(stats);
    console.timeEnd("test");
  }, 90);
})();

//drawing & animations
createCrossRose();
(function animate() {
  requestAnimationFrame(animate);
  controls.update();
  camera2.position.copy(camera.position);
  camera2.position.sub(controls.target); // added by @libe
  camera2.position.setLength(CAM_DISTANCE);
  camera2.lookAt(scene2.position);
  render();
})();
