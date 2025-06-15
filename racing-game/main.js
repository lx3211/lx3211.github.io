// Racing Game using Three.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

let scene, camera, renderer;
let car;
let keys = {};
let angle = 0;
let baseSpeed = 2;
let score = 0;
let trees = [], coins = [], rocks = [];
let gameOver = false;
let finished = false;

const ROAD_BOUND = 20;
const MAP_WIDTH = 200;
const MAP_LENGTH = 1000;
const END_LINE_Z = MAP_LENGTH / 2 - 5;
const TREE_RATIO = 0.10; // 每 100 長度放 7 棵樹
const ROCK_RATIO = 0.05; // 每 100 長度放 5 顆石頭
const COIN_RATIO = 0.1; // 每 100 長度放 10 枚金幣
const TREE_onROAD_RATIO = 0.6; // 60% 機率在道路上
const ROCK_onROAD_RATIO = 0.5; // 50% 機率在道路上
const COIN_onROAD_RATIO = 0.7; // 70% 機率在道路上
const COIN_SCORE = 10;
const ROCK_SCORE = 30;

const scoreDisplay = document.getElementById("score");
const gameOverPanel = document.createElement("div");
gameOverPanel.id = "game-over";
gameOverPanel.style.position = "absolute";
gameOverPanel.style.top = 0;
gameOverPanel.style.left = 0;
gameOverPanel.style.width = "100%";
gameOverPanel.style.height = "100%";
gameOverPanel.style.background = "rgba(0,0,0,0.85)";
gameOverPanel.style.color = "white";
gameOverPanel.style.display = "none";
gameOverPanel.style.alignItems = "center";
gameOverPanel.style.justifyContent = "center";
gameOverPanel.style.flexDirection = "column";
gameOverPanel.style.fontSize = "2em";
gameOverPanel.style.textAlign = "center";
document.body.appendChild(gameOverPanel);

let started = false;
const startPanel = document.createElement('div');
startPanel.id = "start-panel";
startPanel.style.position = "absolute";
startPanel.style.top = 0;
startPanel.style.left = 0;
startPanel.style.width = "100%";
startPanel.style.height = "100%";
startPanel.style.background = "rgba(0,0,0,0.85)";
startPanel.style.color = "white";
startPanel.style.display = "flex";
startPanel.style.alignItems = "center";
startPanel.style.zIndex = "10";
startPanel.style.justifyContent = "center";
startPanel.style.flexDirection = "column";
startPanel.innerHTML = `<h1>🏎️ 賽車遊戲</h1><h3 style='margin: 10px 0;'>使用方向鍵操作</h3><p style="font-size: 0.6em; max-width: 80%; line-height: 1.5; text-align: left;">
  🎯 遊戲目標：操控賽車穿越彎道抵達終點<br>
  🌲 撞到樹會直接結束遊戲<br>
  💣 撞到石頭會扣 ${ROCK_SCORE} 分並重新生成位置<br>
  💰 吃到金幣可獲得 ${COIN_SCORE} 分<br>
  🛣️ 開出柏油路速度會降低
</p><button id='start-button' style='font-size: 1em; padding: 10px 20px; cursor: pointer;'>開始遊戲</button>`;startPanel.style.fontSize = "2em";
startPanel.style.textAlign = "center";
document.body.appendChild(startPanel);

document.getElementById('start-button').onclick = () => {
  startPanel.remove();
  started = true;
  init();
  animate();
};

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaadfff);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, -10);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = 0;
  renderer.domElement.style.left = 0;
  renderer.domElement.style.zIndex = 0;
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = "0";
  renderer.domElement.style.left = "0";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.zIndex = "0";
  document.body.appendChild(renderer.domElement);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(MAP_WIDTH, MAP_LENGTH), new THREE.MeshPhongMaterial({ color: 0x228B22 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  window.roadPoints = [];
  const SEGMENT_LENGTH = 10;
  const ROAD_SEGMENT_COUNT = MAP_LENGTH / SEGMENT_LENGTH;
  
  for (let i = 0; i < ROAD_SEGMENT_COUNT; i++) {
    const z = -MAP_LENGTH / 2 + i * SEGMENT_LENGTH;
    const x = Math.sin(i * 0.15) * 30 + Math.sin(i * 0.05) * 10;
    roadPoints.push({ x, z });
  }
  

for (let i = 0; i < roadPoints.length; i++) {
  const { x, z } = roadPoints[i];
  const curve = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), new THREE.MeshPhongMaterial({ color: 0x2f2f2f }));
  curve.rotation.x = -Math.PI / 2;
  curve.position.y = 0.01;
  curve.position.x = x;
  curve.position.z = z;
  scene.add(curve);
}

  // 起點地面標線
  const startLine = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 2),
    new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  startLine.rotation.x = -Math.PI / 2;
  startLine.position.set(0, 0.02, -MAP_LENGTH / 2 + 5);
  scene.add(startLine);

  // 起點旗子
  const flagMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
  const poleMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

  for (let x of [-22, 22]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5), poleMaterial);
    pole.position.set(x, 2.5, -MAP_LENGTH / 2 + 5);
    scene.add(pole);

    const flag = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), flagMaterial);
    flag.position.set(x + 1.5, 4, -MAP_LENGTH / 2 + 5);
    flag.rotation.y = Math.PI / 2;
    scene.add(flag);
  }

  const goalPostLeft = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 1), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
  goalPostLeft.position.set(-20, 2.5, END_LINE_Z);
  scene.add(goalPostLeft);

  const goalPostRight = goalPostLeft.clone();
  goalPostRight.position.x = 20;
  scene.add(goalPostRight);

  const goalBanner = new THREE.Mesh(new THREE.BoxGeometry(40, 1, 1), new THREE.MeshPhongMaterial({ color: 0xffff00 }));
  goalBanner.position.set(0, 5, END_LINE_Z);
  scene.add(goalBanner);

  const goalLine = new THREE.Mesh(new THREE.PlaneGeometry(40, 2), new THREE.MeshPhongMaterial({ color: 0xffff00, side: THREE.DoubleSide }));
  goalLine.rotation.x = -Math.PI / 2;
  goalLine.position.set(0, 0.02, END_LINE_Z);
  scene.add(goalLine);

  car = createCar();
  car.position.set(0, 0, -MAP_LENGTH / 2 + 10);
  angle = Math.PI; // 面向終點方向（正 Z 軸）
  scene.add(car);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 20, 10);
  scene.add(light);

  const spotlight = new THREE.SpotLight(0xffffff, 5, 150, Math.PI / 4, 0.3, 1);
  spotlight.position.set(0, 10, -MAP_LENGTH / 2 + 5);
  spotlight.target = car;
  spotlight.angle = Math.PI / 4;
  spotlight.penumbra = 0.3;
  spotlight.decay = 2;
  spotlight.distance = 200;
  spotlight.castShadow = true;
  spotlight.lookAt(car.position);
  scene.add(spotlight);
  scene.add(spotlight.target);
  scene.add(new THREE.AmbientLight(0x888888));


  const TREE_COUNT = Math.floor(MAP_LENGTH * TREE_RATIO);  
  const ROCK_COUNT = Math.floor(MAP_LENGTH * ROCK_RATIO);   
  const COIN_COUNT = Math.floor(MAP_LENGTH * COIN_RATIO); 


  for (let i = 0; i < TREE_COUNT; i++) {
    const tree = createTree();
    const { x, z } = randomRoadBasedXZ(TREE_onROAD_RATIO); 
    tree.position.set(x, 0, z);
    trees.push(tree);
    scene.add(tree);
  }
  
  for (let i = 0; i < ROCK_COUNT; i++) {
    const rock = createRock();
    const { x, z } = randomRoadBasedXZ(ROCK_onROAD_RATIO); 
    rock.position.set(x, 0.25, z);
    rocks.push(rock);
    scene.add(rock);
  }
  
  for (let i = 0; i < COIN_COUNT; i++) {
    const coin = createCoin();
    const { x, z } = randomRoadBasedXZ(COIN_onROAD_RATIO); 
    coin.position.set(x, 0.5, z);
    coins.push(coin);
    scene.add(coin);
  }
  

  document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
  document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
  window.addEventListener('resize', onWindowResize);
}

function createCar() {
    const group = new THREE.Group();
  
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xffbb00, shininess: 100 });
    const cabinMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
  
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 4), bodyMaterial);
    mainBody.position.y = 0.3;
    group.add(mainBody);
  
    // const frontSlope = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.1, 1, 6, 1, false, 0, Math.PI), bodyMaterial);
    // frontSlope.rotation.z = Math.PI / 2;
    // frontSlope.rotation.y = Math.PI;
    // frontSlope.position.set(0, 0.3, 1.8);
    // group.add(frontSlope);
  
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.5), cabinMaterial);
    roof.position.set(0, 0.7, 0.5);
    group.add(roof);
  
    // ✅ 修正 spoiler：正確放在車尾外側（-Z 方向）
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 0.3), bodyMaterial);
    spoiler.position.set(0, 1.0, 2.1);
    group.add(spoiler);
  
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.7, 32);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });

    const wheelPositions = [
        [-1.1, 0.3, 1.6],  // 前左
        [ 1.1, 0.3, 1.6],  // 前右
        [-1.1, 0.3, -1.6], // 後左
        [ 1.1, 0.3, -1.6]  // 後右
    ];

    for (const [x, y, z] of wheelPositions) {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.x = Math.PI / 2; // 扳正為垂直地面
        wheel.position.set(x, y, z);
        group.add(wheel);
    }
  
    return group;
  }

function createTree() {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1), new THREE.MeshPhongMaterial({ color: 0x8b4513 }));
  trunk.position.y = 0.5;
  group.add(trunk);
  const leaves = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 8), new THREE.MeshPhongMaterial({ color: 0x228b22 }));
  leaves.position.y = 2;
  group.add(leaves);
  return group;
}

function createRock() {
  return new THREE.Mesh(new THREE.DodecahedronGeometry(0.8), new THREE.MeshPhongMaterial({ color: 0x555555 }));
}

function createCoin() {
  return new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshPhongMaterial({ color: 0xFFD700, emissive: 0xFFCC00 }));
}

function randomCoord(scale = MAP_LENGTH) {
    return (Math.random() - 0.5) * scale;
}
  

function randomRoadBasedXZ(onRoadRatio = 0.4) {
    const z = randomCoord(MAP_LENGTH);
    if (Math.random() < onRoadRatio) {
      const closest = roadPoints.reduce((prev, curr) =>
        Math.abs(curr.z - z) < Math.abs(prev.z - z) ? curr : prev
      );
      const x = closest.x + (Math.random() - 0.5) * ROAD_BOUND * 2;
      return { x, z };
    } else {
      return { x: randomCoord(MAP_WIDTH), z };
    }
}
  
  

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  if (!started) return;
  requestAnimationFrame(animate);
  if (gameOver || finished) return;

  let closestRoad = roadPoints.reduce((prev, curr) =>
    Math.abs(curr.z - car.position.z) < Math.abs(prev.z - car.position.z) ? curr : prev
);
const onRoad = Math.abs(car.position.x - closestRoad.x) < ROAD_BOUND;
  const speed = onRoad ? baseSpeed : baseSpeed * 0.4;

  if (keys['arrowleft']) angle += 0.08;
  if (keys['arrowright']) angle -= 0.08;
  if (keys['arrowup']) {
    car.position.x -= Math.sin(angle) * speed;
    car.position.z -= Math.cos(angle) * speed;
  }

  car.rotation.y = angle;
  camera.position.x = car.position.x + Math.sin(angle) * 10;
  camera.position.z = car.position.z + Math.cos(angle) * 10;
  camera.position.y = car.position.y + 5;
  camera.lookAt(car.position);

  for (const coin of [...coins]) {
    if (car.position.distanceTo(coin.position) < 1.5) {
      score += COIN_SCORE;
      scoreDisplay.textContent = `分數：${score}`;
      scene.remove(coin);
      coins = coins.filter(c => c !== coin);
    }
  }

  for (const rock of rocks) {
    if (car.position.distanceTo(rock.position) < 2.0) {
      score -= ROCK_SCORE;
      scoreDisplay.textContent = `分數：${score}`;
      
      const { x, z } = randomRoadBasedXZ(0.5);  
      rock.position.set(x, 0.25, z);
    }
  }
  

  for (const tree of trees) {
    if (car.position.distanceTo(tree.position) < 2.5) {
      endGame();
      break;
    }
  }

  if (car.position.z > END_LINE_Z) {
    finished = true;
    gameOverPanel.style.display = "flex";
    if (score < 0) {
        gameOverPanel.innerHTML = `<h1>🤡 你居然負分！？<br>分數：${score}</h1><p style='font-size: 0.7em;'>（撞石頭撞出新紀錄）</p><button onclick='location.reload()'>重新開始</button>`;
    } else {
        gameOverPanel.innerHTML = `<h1>🏁 抵達終點！<br>分數：${score}</h1><button onclick='location.reload()'>重新開始</button>`;
    }
  }

  renderer.render(scene, camera);
}

function endGame() {
  gameOver = true;
  gameOverPanel.style.display = "flex";
  if (score < 0) {
    gameOverPanel.innerHTML = `<h1>🤡 不只撞樹還負分！？<br>分數：${score}</h1><p style='font-size: 0.7em;'>（撞樹撞石頭撞出新紀錄）</p><button onclick='location.reload()'>重新開始</button>`;
  } else {
    gameOverPanel.innerHTML = `<h1>💥 Boom! 遊戲結束!<br>分數：${score}</h1><button onclick='location.reload()'>重新開始</button>`;
  }
}
