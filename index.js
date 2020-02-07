import * as THREE from "three";
import * as j from "jquery";
let $ = j.default;
import {
  TrackballControls
} from "three/examples/jsm/controls/TrackballControls.js";
let orbitSolver = require("./numericOrbitSolver"); //all the code needed to solve orbits based on position and velocity

//config
let CANVAS_WIDTH = 100,
  CANVAS_HEIGHT = 100,
  CAM_DISTANCE = 200,
  earthColor = 0x6aa84f,
  craftColor = 0xadd8e6,
  OrbitColor = 0x0000ff,
  earthRadius = 6371, //km
  craftRadius = 300, //km
  mu = 398600,
  accelerationVectorColor = 0xff0000,
  velocityVectorColor = 0xffff00;


//define vars
let container,
  container2,
  camera,
  controls,
  scene,
  renderer,
  camera2,
  scene2,
  renderer2,
  axes2;


//setup main canvas
container = document.getElementById("container");
renderer = new THREE.WebGLRenderer();
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
camera.position.y = 700; //set camera inital position
camera.position.z = 700;
camera.position.x = 700;

//setup orbit controls for scene camera
controls = new TrackballControls(camera, renderer.domElement);



let scaleFactor = 0.01; //this converts km to 3d units within the browser. To big and things wont render
let scale = x => x.map(i => i * scaleFactor);

//setup earth
let earth = new THREE.Mesh(
  new THREE.SphereGeometry(earthRadius * scaleFactor, 12, 12),
  new THREE.MeshBasicMaterial({
    color: earthColor,
    wireframe: true
  })
);
scene.add(earth);
let earthAxes = new THREE.AxisHelper(100);
scene.add(earthAxes);


//setup spacecraft
let spacecraft = new THREE.Mesh(
  new THREE.SphereGeometry(craftRadius * scaleFactor, 32, 32),
  new THREE.MeshBasicMaterial({
    color: craftColor
  })
);
scene.add(spacecraft);
spacecraft.position.set(100, 100, 100);


//setup velocity and acceleration vector
let accelerationVector = spacecraft.position.clone().negate(); //points toward the planet
accelerationVector.normalize();
let accelerationArrow = new THREE.ArrowHelper(
  accelerationVector,
  spacecraft.position.clone(),
  40,
  accelerationVectorColor
);
scene.add(accelerationArrow);
let velocityVector = new THREE.Vector3(4, 1, 0);
velocityVector.normalize();
let velocityArrow = new THREE.ArrowHelper(
  velocityVector,
  spacecraft.position.clone(),
  80,
  velocityVectorColor
);
scene.add(velocityArrow);



let updateArrow = function () { //handles craft acceleration and velocity vector position and direction
  let p = position;

  velocityArrow.position.set(...scale(position));
  accelerationArrow.position.set(...scale(position));

  let aPos = new THREE.Vector3(...scale(position)).negate().normalize();
  let vPos = new THREE.Vector3(...scale(velocity)).normalize();

  accelerationArrow.setDirection(aPos);
  velocityArrow.setDirection(vPos);
};


let createCrossRose = function () {
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

let setText = function (stats) { //handle updating speed and radius stats
  $("#speed-c").text(stats.speed.current);
  $("#speed-max").text(stats.speed.max);
  $("#speed-min").text(stats.speed.min);
  $("#radius-c").text(stats.radius.current);
  $("#radius-max").text(stats.radius.max);
  $("#radius-min").text(stats.radius.min);
};

let setCalculatedText = function () { //handle a, e, p values
  if (!stats) return;
  let r_max = stats.radius.max;
  let r_min = stats.radius.min;
  //calculate orbital paramaters based on the min and max radius
  let e = (r_max - r_min) / (r_max + r_min);
  let a = (r_max + r_min) / 2;
  let par = a * (1 - e * e);
  $('#o-stats').text(`a=${a.toFixed(4)} p=${par.toFixed(4)} e=${e.toFixed(4)}`)
};

window.setOrbit = function () { //get position from text feilds and set as craft position
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
let addPoint = function (p) {
  points.push(new THREE.Vector3(...scale(p)));
  if (points.length > 5) {
    var material = new THREE.LineBasicMaterial({
      color: OrbitColor
    });
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var line = new THREE.Line(geometry, material)
    scene.add(line);
    points = [];
  };
};

//init position & velocity
let norm = v => Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).toFixed(2);
//let position = [30000, 0, 0];
//let velocity = [2, 3, 0];

let position = [5634.297397, -2522.807863, -5037.930889]; //mini-project 1 - Molniya orbit
let velocity = [8.286176, 1.815144, 3.624759]; //mini-project 1 - Molniya orbit


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

//handle orbit calculations
(function () {
  setInterval(function () { //update craft location every 80ms

    let newValues = orbitSolver.step(position, velocity, mu, 500000); //calculate 500k points each round
    position = newValues.r;
    velocity = newValues.v;
    updateArrow();
    spacecraft.position.set(...scale(position)); //update position. scale is used to make the number feasable for 3d display
    addPoint(position); //handle orbit tracking line

    //find any changes in the min and max of the orbit
    let v = norm(velocity);
    let r = norm(position);
    stats.speed.min = Math.min(stats.speed.min, v);
    stats.speed.max = Math.max(stats.speed.max, v);
    stats.speed.current = v;
    stats.radius.min = Math.min(stats.radius.min, r);
    stats.radius.max = Math.max(stats.radius.max, r);
    stats.radius.current = r;

  }, 80);




  setInterval(function () { //update text stats every 200ms
    setText(stats);
    setCalculatedText(stats);
  }, 200)




})();

function render() {
  renderer.render(scene, camera);
  renderer2.render(scene2, camera2);
}

//drawing & animations
createCrossRose();
(function animate() {
  requestAnimationFrame(animate);
  controls.update();
  camera2.position.copy(camera.position);
  camera2.position.sub(controls.target);
  camera2.position.setLength(CAM_DISTANCE);
  camera2.lookAt(scene2.position);
  render();
})();