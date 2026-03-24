import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function createScene(container: HTMLDivElement): { dispose: () => void } {
  const isMobile = window.innerWidth < 768;

  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc8ddf0);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(18, 16, 18);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2.2;
  controls.minPolarAngle = Math.PI / 6;
  controls.minDistance = 8;
  controls.maxDistance = 25;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const shadowRes = isMobile ? 1024 : 2048;
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(12, 20, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = shadowRes;
  dirLight.shadow.mapSize.height = shadowRes;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 60;
  dirLight.shadow.camera.left = -20;
  dirLight.shadow.camera.right = 20;
  dirLight.shadow.camera.top = 20;
  dirLight.shadow.camera.bottom = -20;
  dirLight.shadow.bias = -0.001;
  dirLight.shadow.normalBias = 0.02;
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x8ec5fc, 0.3);
  fillLight.position.set(-8, 10, -6);
  scene.add(fillLight);

  // Geometry detail levels
  const sphereDetail = isMobile ? 6 : 8;
  const cylDetail = isMobile ? 6 : 8;

  // Materials
  const baseMat = new THREE.MeshLambertMaterial({ color: 0x7fb3d8 });
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x8bc48a });
  const courtMat = new THREE.MeshLambertMaterial({ color: 0x4a8c3f });
  const courtDarkMat = new THREE.MeshLambertMaterial({ color: 0x3d7535 });
  const lineMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const netPostMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
  const netMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.7 });
  const fenceMat = new THREE.MeshLambertMaterial({ color: 0x6a9e5e });
  const benchMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
  const treeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
  const treeLeafMat1 = new THREE.MeshLambertMaterial({ color: 0x5daa5d });
  const treeLeafMat2 = new THREE.MeshLambertMaterial({ color: 0x4d9a4d });
  const treeLeafMat3 = new THREE.MeshLambertMaterial({ color: 0x6dba6d });
  const concreteMat = new THREE.MeshLambertMaterial({ color: 0xd4cfc8 });
  const brickMat = new THREE.MeshLambertMaterial({ color: 0xc47a5a });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0xe8e0d4 });
  const windowMat = new THREE.MeshLambertMaterial({ color: 0x6ba3cc });
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const particleMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const ballMat = new THREE.MeshLambertMaterial({ color: 0xe8d44d });
  const paddleMat1 = new THREE.MeshLambertMaterial({ color: 0x3366cc });
  const paddleMat2 = new THREE.MeshLambertMaterial({ color: 0xcc3333 });

  // === BASE PLATFORM ===
  const baseGroup = new THREE.Group();

  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(24, 1.5, 18), baseMat);
  baseMesh.position.y = -0.75;
  baseMesh.receiveShadow = true;
  baseGroup.add(baseMesh);

  const grassMesh = new THREE.Mesh(new THREE.BoxGeometry(24, 0.2, 18), groundMat);
  grassMesh.position.y = 0.1;
  grassMesh.receiveShadow = true;
  baseGroup.add(grassMesh);

  scene.add(baseGroup);

  // === COURT SURFACE ===
  const courtGroup = new THREE.Group();
  courtGroup.position.set(0, 0.21, 0);

  const courtSurf = new THREE.Mesh(new THREE.BoxGeometry(7, 0.08, 14.5), concreteMat);
  courtSurf.receiveShadow = true;
  courtGroup.add(courtSurf);

  const halfGeo = new THREE.BoxGeometry(6, 0.05, 6.5);
  const half1 = new THREE.Mesh(halfGeo, courtMat);
  half1.position.set(0, 0.05, -3.25);
  half1.receiveShadow = true;
  courtGroup.add(half1);

  const half2 = new THREE.Mesh(halfGeo, courtDarkMat);
  half2.position.set(0, 0.05, 3.25);
  half2.receiveShadow = true;
  courtGroup.add(half2);

  // Kitchen / NVZ zones
  const kitchenGeo = new THREE.BoxGeometry(6, 0.06, 2.1);
  const kitchen1 = new THREE.Mesh(kitchenGeo, new THREE.MeshLambertMaterial({ color: 0x3a7030 }));
  kitchen1.position.set(0, 0.08, -1.05);
  kitchen1.receiveShadow = true;
  courtGroup.add(kitchen1);

  const kitchen2 = new THREE.Mesh(kitchenGeo.clone(), new THREE.MeshLambertMaterial({ color: 0x2d6025 }));
  kitchen2.position.set(0, 0.08, 1.05);
  kitchen2.receiveShadow = true;
  courtGroup.add(kitchen2);

  // Court Lines
  function createLine(width: number, depth: number, x: number, y: number, z: number) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.02, depth), lineMat);
    mesh.position.set(x, y, z);
    courtGroup.add(mesh);
  }

  const lineY = 0.12;
  createLine(6.1, 0.08, 0, lineY, -6.5);
  createLine(6.1, 0.08, 0, lineY, 6.5);
  createLine(0.08, 13.08, -3, lineY, 0);
  createLine(0.08, 13.08, 3, lineY, 0);
  createLine(6.1, 0.08, 0, lineY, -2.1);
  createLine(6.1, 0.08, 0, lineY, 2.1);
  createLine(0.08, 4.4, 0, lineY, -4.3);
  createLine(0.08, 4.4, 0, lineY, 4.3);
  createLine(6.1, 0.06, 0, lineY, 0);

  // === NET ===
  const netGroup = new THREE.Group();
  netGroup.position.y = 0.12;

  const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.1, cylDetail);
  const post1 = new THREE.Mesh(postGeo, netPostMat);
  post1.position.set(-3.3, 0.55, 0);
  post1.castShadow = true;
  netGroup.add(post1);

  const post2 = new THREE.Mesh(postGeo, netPostMat);
  post2.position.set(3.3, 0.55, 0);
  post2.castShadow = true;
  netGroup.add(post2);

  const capGeo = new THREE.SphereGeometry(0.1, sphereDetail, sphereDetail);
  const cap1 = new THREE.Mesh(capGeo, netPostMat);
  cap1.position.set(-3.3, 1.1, 0);
  netGroup.add(cap1);

  const cap2 = new THREE.Mesh(capGeo, netPostMat);
  cap2.position.set(3.3, 1.1, 0);
  netGroup.add(cap2);

  const netMesh1 = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.9, 0.05), netMat);
  netMesh1.position.set(0, 0.6, 0);
  netMesh1.castShadow = true;
  netGroup.add(netMesh1);

  const netBand = new THREE.Mesh(
    new THREE.BoxGeometry(6.5, 0.06, 0.07),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
  );
  netBand.position.set(0, 1.05, 0);
  netGroup.add(netBand);

  for (let i = 0; i < 4; i++) {
    const wire = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 0.02, 0.06),
      new THREE.MeshLambertMaterial({ color: 0xdddddd })
    );
    wire.position.set(0, 0.25 + i * 0.22, 0);
    netGroup.add(wire);
  }

  courtGroup.add(netGroup);
  scene.add(courtGroup);

  // === PLAYER FIGURES ===
  function createPlayer(
    x: number, z: number, rotY: number,
    skinColor: number, shirtColor: number, shortsColor: number,
    name: string
  ) {
    const playerGroup = new THREE.Group();
    playerGroup.name = name;

    const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const shortsMat = new THREE.MeshLambertMaterial({ color: shortsColor });
    const shoeMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x3b2314 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.25), shirtMat);
    torso.name = name + 'Torso';
    torso.position.y = 1.05;
    torso.castShadow = true;
    playerGroup.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, sphereDetail, sphereDetail), skinMat);
    head.name = name + 'Head';
    head.position.y = 1.48;
    head.castShadow = true;
    playerGroup.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.17, sphereDetail, sphereDetail), hairMat);
    hair.name = name + 'Hair';
    hair.position.y = 1.52;
    hair.scale.set(1, 0.6, 1);
    playerGroup.add(hair);

    const shorts = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.24), shortsMat);
    shorts.name = name + 'Shorts';
    shorts.position.y = 0.75;
    shorts.castShadow = true;
    playerGroup.add(shorts);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.4, 0.13), skinMat);
    leftLeg.name = name + 'LeftLeg';
    leftLeg.position.set(-0.1, 0.45, 0);
    leftLeg.castShadow = true;
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.4, 0.13), skinMat);
    rightLeg.name = name + 'RightLeg';
    rightLeg.position.set(0.1, 0.45, 0);
    rightLeg.castShadow = true;
    playerGroup.add(rightLeg);

    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.2), shoeMat);
    leftShoe.position.set(-0.1, 0.22, 0.03);
    playerGroup.add(leftShoe);

    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.2), shoeMat);
    rightShoe.position.set(0.1, 0.22, 0.03);
    playerGroup.add(rightShoe);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.38, 0.1), skinMat);
    leftArm.name = name + 'LeftArm';
    leftArm.position.set(-0.28, 1.0, 0);
    leftArm.castShadow = true;
    playerGroup.add(leftArm);

    const paddleArmPivot = new THREE.Group();
    paddleArmPivot.name = name + 'PaddleArmPivot';
    paddleArmPivot.position.set(0.28, 1.22, 0);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.38, 0.1), skinMat);
    rightArm.position.y = -0.19;
    rightArm.castShadow = true;
    paddleArmPivot.add(rightArm);

    const paddleHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.02, 0.42),
      shirtMat
    );
    paddleHead.position.set(0.05, -0.45, 0);
    paddleHead.castShadow = true;
    paddleArmPivot.add(paddleHead);

    const paddleHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.18, 6),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    paddleHandle.position.set(0, -0.36, 0);
    paddleArmPivot.add(paddleHandle);

    playerGroup.add(paddleArmPivot);
    playerGroup.position.set(x, 0.21, z);
    playerGroup.rotation.y = rotY;
    return playerGroup;
  }

  const player1 = createPlayer(-1.2, -4.5, 0, 0xdeb08a, 0x3366cc, 0x1a1a40, 'player1');
  scene.add(player1);
  const player2 = createPlayer(1.2, -4.5, 0, 0xc89870, 0x3366cc, 0x1a1a40, 'player2');
  scene.add(player2);
  const player3 = createPlayer(-1.0, 4.5, Math.PI, 0xdeb08a, 0xcc3333, 0x1a1a40, 'player3');
  scene.add(player3);
  const player4 = createPlayer(1.0, 4.5, Math.PI, 0xb8885a, 0xcc3333, 0x1a1a40, 'player4');
  scene.add(player4);

  const allPlayers = [player1, player2, player3, player4];

  // === BALL ===
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), ballMat);
  ball.position.set(0, 1.5, -4);
  ball.castShadow = true;
  scene.add(ball);

  const shadowMat2 = new THREE.MeshLambertMaterial({ color: 0x1a3d15, transparent: true, opacity: 0.35 });
  const ballShadow = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), shadowMat2);
  ballShadow.rotation.x = -Math.PI / 2;
  ballShadow.position.set(0, 0.33, -4);
  scene.add(ballShadow);

  // === PARTICLE BURST SYSTEM ===
  const MAX_PARTICLES = isMobile ? 30 : 60;
  const particlePool: THREE.Mesh[] = [];
  const activeParticles: THREE.Mesh[] = [];

  const particleGeo = new THREE.SphereGeometry(0.04, 5, 4);

  for (let i = 0; i < MAX_PARTICLES; i++) {
    const mesh = new THREE.Mesh(particleGeo, particleMat.clone());
    mesh.visible = false;
    mesh.userData = { vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0 };
    scene.add(mesh);
    particlePool.push(mesh);
  }

  function spawnParticleBurst(x: number, y: number, z: number) {
    const count = isMobile ? 8 + Math.floor(Math.random() * 4) : 14 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      let p = particlePool.pop();
      if (!p) {
        p = activeParticles.shift();
      }
      if (!p) break;

      p.visible = true;
      p.position.set(x, y, z);

      const speed = 1.5 + Math.random() * 3.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.8 - Math.PI * 0.1;
      p.userData.vx = Math.cos(theta) * Math.cos(phi) * speed;
      p.userData.vy = Math.sin(phi) * speed + 1.5;
      p.userData.vz = Math.sin(theta) * Math.cos(phi) * speed;
      p.userData.life = 0;
      p.userData.maxLife = 0.35 + Math.random() * 0.3;

      const s = 0.6 + Math.random() * 0.8;
      p.scale.set(s, s, s);
      (p.material as THREE.MeshLambertMaterial).opacity = 1.0;
      (p.material as THREE.MeshLambertMaterial).transparent = true;

      activeParticles.push(p);
    }
  }

  function updateParticles(dt: number) {
    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const p = activeParticles[i];
      p.userData.life += dt;
      const t = p.userData.life / p.userData.maxLife;
      if (t >= 1.0) {
        p.visible = false;
        activeParticles.splice(i, 1);
        particlePool.push(p);
        continue;
      }
      p.position.x += p.userData.vx * dt;
      p.position.y += p.userData.vy * dt;
      p.position.z += p.userData.vz * dt;
      p.userData.vy -= 9.0 * dt;

      (p.material as THREE.MeshLambertMaterial).opacity = 1.0 - t * t;
      const shrink = 1.0 - t * 0.6;
      p.scale.set(shrink, shrink, shrink);
    }
  }

  // Rally state
  const rally = {
    direction: 1,
    t: 0,
    speed: 1.15,
    hitterNear: 0,
    hitterFar: 2,
    startPos: new THREE.Vector3(0, 1.0, 4.0),
    endPos: new THREE.Vector3(0, 1.0, -4.0),
    apexY: 3.0,
    hitTriggered: false,
  };

  function pickHitter() {
    rally.hitterFar = 2 + Math.floor(Math.random() * 2);
    rally.hitterNear = Math.floor(Math.random() * 2);
  }

  function setupVolley() {
    rally.t = 0;
    rally.hitTriggered = false;
    if (rally.direction === 0) {
      const h = rally.hitterNear;
      const target = rally.hitterFar;
      const sp = allPlayers[h].position;
      const ep = allPlayers[target].position;
      rally.startPos.set(sp.x + (h === 0 ? 0.35 : -0.35), 1.35, sp.z + 0.3);
      rally.endPos.set(ep.x + (target === 2 ? 0.35 : -0.35), 1.35, ep.z - 0.3);
      rally.apexY = 2.6 + Math.random() * 0.6;
    } else {
      const h = rally.hitterFar;
      const target = rally.hitterNear;
      const sp = allPlayers[h].position;
      const ep = allPlayers[target].position;
      rally.startPos.set(sp.x + (h === 2 ? 0.35 : -0.35), 1.35, sp.z - 0.3);
      rally.endPos.set(ep.x + (target === 0 ? 0.35 : -0.35), 1.35, ep.z + 0.3);
      rally.apexY = 2.6 + Math.random() * 0.6;
    }
  }
  setupVolley();

  // Paddles leaning against net post
  function createPaddle(x: number, z: number, rotY: number, mat: THREE.Material, name: string) {
    const paddleGroup = new THREE.Group();
    paddleGroup.name = name;

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.6), mat);
    paddleGroup.add(head);

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.4, cylDetail),
      benchMat
    );
    handle.position.set(0, 0, 0.45);
    handle.rotation.x = Math.PI / 2;
    paddleGroup.add(handle);

    paddleGroup.position.set(x, 0.7, z);
    paddleGroup.rotation.set(-0.3, rotY, Math.PI / 6);
    return paddleGroup;
  }

  const paddle1 = createPaddle(-3.5, -0.5, 0.3, paddleMat1, 'paddle1');
  scene.add(paddle1);
  const paddle2 = createPaddle(-3.5, 0.5, -0.3, paddleMat2, 'paddle2');
  scene.add(paddle2);

  // === FACILITY BUILDING ===
  const buildingGroup = new THREE.Group();
  buildingGroup.position.set(-9.5, 0.2, -3);

  const bldgBody = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.8, 5), brickMat);
  bldgBody.position.y = 1.4;
  bldgBody.castShadow = true;
  bldgBody.receiveShadow = true;
  buildingGroup.add(bldgBody);

  const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.25, 5.4), roofMat);
  roofMesh.position.y = 2.9;
  roofMesh.castShadow = true;
  buildingGroup.add(roofMesh);

  for (let i = 0; i < 3; i++) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.55), windowMat);
    win.position.set(1.76, 1.6, -1.5 + i * 1.5);
    buildingGroup.add(win);
  }

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 1.5, 0.8),
    new THREE.MeshLambertMaterial({ color: 0x6a5040 })
  );
  door.position.set(1.76, 0.75, 1.8);
  buildingGroup.add(door);

  scene.add(buildingGroup);

  // === TREES ===
  function createTree(x: number, z: number, scale: number) {
    const treeGroup = new THREE.Group();

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, 1.2 * scale, 6),
      treeTrunkMat
    );
    trunk.position.y = 0.6 * scale;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const leafMats = [treeLeafMat1, treeLeafMat2, treeLeafMat3];
    const sizes = [0.7, 0.55, 0.4];
    const heights = [1.4, 1.9, 2.3];

    sizes.forEach((s, i) => {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(s * scale, isMobile ? 5 : 7, 6),
        leafMats[i % 3]
      );
      leaf.position.y = heights[i] * scale;
      leaf.position.x = (Math.random() - 0.5) * 0.2;
      leaf.position.z = (Math.random() - 0.5) * 0.2;
      leaf.castShadow = true;
      treeGroup.add(leaf);
    });

    treeGroup.position.set(x, 0.2, z);
    return treeGroup;
  }

  const treePositions: [number, number, number][] = [
    [-9.5, 3.5, 1], [-10, -7, 0.9], [-6.5, -7.5, 0.8],
    [9, -6, 1.1], [9.5, 5, 0.9], [10, 0, 0.85],
    [-6, 7, 1], [6, 7.5, 0.95], [0, 8, 0.7],
    [-10.5, 7, 0.75], [10.5, -3, 0.8],
  ];

  treePositions.forEach((pos) => {
    scene.add(createTree(pos[0], pos[1], pos[2]));
  });

  // === FENCE ===
  function createFenceSection(x: number, z: number, width: number, depth: number) {
    const fenceGroup = new THREE.Group();

    const postH = 1.2;
    const postGeo2 = new THREE.CylinderGeometry(0.05, 0.05, postH, 6);
    const numPosts = Math.max(2, Math.floor(Math.max(width, depth) / 1.5) + 1);

    for (let i = 0; i < numPosts; i++) {
      const post = new THREE.Mesh(postGeo2, fenceMat);
      post.position.y = postH / 2;
      if (width > depth) {
        post.position.x = -width / 2 + (width / (numPosts - 1)) * i;
      } else {
        post.position.z = -depth / 2 + (depth / (numPosts - 1)) * i;
      }
      post.castShadow = true;
      fenceGroup.add(post);
    }

    const railGeo = new THREE.BoxGeometry(
      width > depth ? width : 0.04,
      0.04,
      depth > width ? depth : 0.04
    );
    const rail = new THREE.Mesh(railGeo, fenceMat);
    rail.position.y = postH;
    fenceGroup.add(rail);

    const railLow = new THREE.Mesh(railGeo, fenceMat);
    railLow.position.y = postH * 0.5;
    fenceGroup.add(railLow);

    fenceGroup.position.set(x, 0.2, z);
    return fenceGroup;
  }

  scene.add(createFenceSection(0, -8, 8, 0.04));
  scene.add(createFenceSection(0, 8, 8, 0.04));
  scene.add(createFenceSection(-4, 0, 0.04, 16));
  scene.add(createFenceSection(4, 0, 0.04, 16));

  // === WALKWAY ===
  const walkway = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 8), concreteMat);
  walkway.position.set(-6.5, 0.22, 0);
  walkway.receiveShadow = true;
  scene.add(walkway);

  // === CLOUDS (skip on mobile) ===
  const clouds: THREE.Group[] = [];

  if (!isMobile) {
    const createCloud = (x: number, y: number, z: number, scale: number) => {
      const cloudGroup = new THREE.Group();

      const sizes: [number, number, number][] = [
        [0.6, 0.4, 0.5], [0.5, 0.35, 0.45], [0.45, 0.3, 0.4], [0.35, 0.28, 0.35],
      ];
      const offsets = [[0, 0, 0], [0.5, 0.05, 0.1], [-0.4, 0.02, -0.1], [0.15, 0.1, 0.2]];

      sizes.forEach((s, i) => {
        const geo = new THREE.SphereGeometry(s[0] * scale, sphereDetail, sphereDetail);
        geo.scale(1, s[1] / s[0], s[2] / s[0]);
        const puff = new THREE.Mesh(geo, cloudMat);
        puff.position.set(
          offsets[i][0] * scale,
          offsets[i][1] * scale,
          offsets[i][2] * scale
        );
        cloudGroup.add(puff);
      });

      cloudGroup.position.set(x, y, z);
      return cloudGroup;
    }

    const cloudDefs: [number, number, number, number][] = [
      [-10, 7, -8, 2], [10, 8, 8, 1.6], [12, 6.5, -4, 1.3],
      [-8, 9, 6, 1.8], [0, 7.5, -10, 1.4], [6, 8.5, 10, 1.1],
    ];
    cloudDefs.forEach(([x, y, z, s]) => {
      const c = createCloud(x, y, z, s);
      clouds.push(c);
      scene.add(c);
    });
  }

  // === SCORE SIGN ===
  const signGroup = new THREE.Group();
  signGroup.position.set(5.5, 0.2, -4);

  const signPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 2, 6),
    netPostMat
  );
  signPost.position.y = 1;
  signGroup.add(signPost);

  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.8, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x2d5a27 })
  );
  signBoard.position.y = 2;
  signBoard.castShadow = true;
  signGroup.add(signBoard);

  const signFace = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.6, 0.02),
    new THREE.MeshLambertMaterial({ color: 0x1a3d15 })
  );
  signFace.position.set(0, 2, 0.06);
  signGroup.add(signFace);

  scene.add(signGroup);

  // === WATER COOLER ===
  const coolerGroup = new THREE.Group();
  coolerGroup.position.set(5.5, 0.2, 3);

  const coolerBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.6, 0.3),
    new THREE.MeshLambertMaterial({ color: 0x5599cc })
  );
  coolerBody.position.y = 0.5;
  coolerBody.castShadow = true;
  coolerGroup.add(coolerBody);

  const coolerLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.2, 0.25),
    benchMat
  );
  coolerLeg.position.y = 0.1;
  coolerGroup.add(coolerLeg);

  scene.add(coolerGroup);

  // === ANIMATION ===
  const clock = new THREE.Clock();
  let isVisible = true;
  let rafId: number;

  // IntersectionObserver to pause rendering when off-screen
  const visibilityObserver = new IntersectionObserver(
    ([entry]) => { isVisible = entry.isIntersecting; },
    { threshold: 0.05 }
  );
  visibilityObserver.observe(container);

  // ResizeObserver for responsive sizing
  const resizeObserver = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
  resizeObserver.observe(container);

  function animate() {
    rafId = requestAnimationFrame(animate);

    if (!isVisible) return;

    const elapsed = clock.getElapsedTime();
    const frameDt = clock.getDelta();

    // Cloud drift
    clouds.forEach((cloud, i) => {
      cloud.position.x += Math.sin(elapsed * 0.15 + i * 2) * 0.002;
      cloud.position.y += Math.sin(elapsed * 0.3 + i) * 0.001;
    });

    // === RALLY BALL ANIMATION ===
    rally.t += 0.008 * rally.speed;
    if (rally.t > 1.0) {
      const hitX = ball.position.x;
      const hitY = ball.position.y;
      const hitZ = ball.position.z;
      spawnParticleBurst(hitX, hitY, hitZ);

      rally.direction = rally.direction === 0 ? 1 : 0;
      pickHitter();
      setupVolley();
    }
    const t = rally.t;
    const bx = rally.startPos.x + (rally.endPos.x - rally.startPos.x) * t;
    const bz = rally.startPos.z + (rally.endPos.z - rally.startPos.z) * t;
    const baseY = rally.startPos.y + (rally.endPos.y - rally.startPos.y) * t;
    const arcY = baseY + (rally.apexY - Math.max(rally.startPos.y, rally.endPos.y)) * 4.0 * t * (1.0 - t);
    ball.position.set(bx, arcY + 0.21, bz);
    ball.rotation.x += 0.06;
    ball.rotation.z += 0.03;

    // Ball shadow
    ballShadow.position.set(bx, 0.33, bz);
    const shadowScale = Math.max(0.5, 1.0 - (arcY - 1.0) * 0.25);
    ballShadow.scale.set(shadowScale, shadowScale, shadowScale);
    (ballShadow.material as THREE.MeshLambertMaterial).opacity = 0.35 * shadowScale;

    // Paddle sway
    paddle1.rotation.z = Math.PI / 6 + Math.sin(elapsed * 0.8) * 0.03;
    paddle2.rotation.z = Math.PI / 6 + Math.sin(elapsed * 0.8 + 1) * 0.03;

    // === PLAYER ANIMATIONS ===
    const isNearHitting = rally.direction === 0;
    const hitPhase = rally.t;

    allPlayers.forEach((player, idx) => {
      const phase = idx * Math.PI * 0.5;
      const speed = 1.8;
      const isHitter = (isNearHitting && idx === rally.hitterNear) || (!isNearHitting && idx === rally.hitterFar);
      const isReceiver = (isNearHitting && idx === rally.hitterFar) || (!isNearHitting && idx === rally.hitterNear);

      const armPivot = player.getObjectByName(player.name + 'PaddleArmPivot');
      const leftArm = player.getObjectByName(player.name + 'LeftArm');
      const torso = player.getObjectByName(player.name + 'Torso');
      const leftLeg = player.getObjectByName(player.name + 'LeftLeg');
      const rightLeg = player.getObjectByName(player.name + 'RightLeg');

      if (isHitter && hitPhase < 0.25) {
        const swingT = hitPhase / 0.25;
        if (armPivot) {
          armPivot.rotation.x = -0.9 + swingT * 0.9;
          armPivot.rotation.z = -0.2 * (1 - swingT);
        }
        if (torso) {
          torso.rotation.z = 0.1 * (1 - swingT) * (idx % 2 === 0 ? 1 : -1);
          torso.rotation.x = -0.05 * (1 - swingT);
        }
        if (leftArm) leftArm.rotation.x = 0.3 * (1 - swingT);
      } else if (isReceiver && hitPhase > 0.7) {
        const prepT = (hitPhase - 0.7) / 0.3;
        if (armPivot) {
          armPivot.rotation.x = 0.3 + prepT * 1.2;
          armPivot.rotation.z = prepT * 0.2;
        }
        if (torso) {
          torso.rotation.z = -0.08 * prepT * (idx % 2 === 0 ? 1 : -1);
          torso.rotation.x = 0.04 * prepT;
        }
        if (leftArm) leftArm.rotation.x = -0.35 * prepT;
        if (leftLeg && rightLeg) {
          leftLeg.rotation.x = 0.2 * prepT;
          rightLeg.rotation.x = -0.15 * prepT;
        }
      } else {
        if (armPivot) {
          armPivot.rotation.x = Math.sin(elapsed * speed * 0.4 + phase) * 0.15;
          armPivot.rotation.z = Math.sin(elapsed * speed * 0.3 + phase + 1) * 0.05;
        }
        if (leftArm) leftArm.rotation.x = Math.sin(elapsed * speed * 0.5 + phase + Math.PI) * 0.12;
        if (torso) torso.rotation.z = Math.sin(elapsed * speed * 0.6 + phase) * 0.04;
        if (leftLeg && rightLeg) {
          leftLeg.rotation.x = Math.sin(elapsed * speed * 0.8 + phase) * 0.1;
          rightLeg.rotation.x = Math.sin(elapsed * speed * 0.8 + phase + Math.PI) * 0.1;
        }
      }

      const baseX = idx % 2 === 0 ? -1.1 : 1.1;
      const baseZ = idx < 2 ? -4.5 : 4.5;

      if (isReceiver) {
        const targetX = THREE.MathUtils.clamp(rally.endPos.x, -2.5, 2.5);
        const drift = (targetX - baseX) * hitPhase * 0.6;
        player.position.x = baseX + drift;
        const fwdDrift = (idx < 2 ? 0.5 : -0.5) * hitPhase * 0.5;
        player.position.z = baseZ + fwdDrift;
      } else {
        const drift = Math.sin(elapsed * 0.7 + phase * 2) * 0.3;
        player.position.x = baseX + drift;
        const fwdDrift = Math.sin(elapsed * 0.5 + phase) * 0.2;
        player.position.z = baseZ + fwdDrift;
      }

      const bounceAmt = isReceiver && hitPhase > 0.6 ? 0.01 : 0.03;
      player.position.y = 0.21 + Math.abs(Math.sin(elapsed * speed * 1.2 + phase)) * bounceAmt;

      const lookX = ball.position.x - player.position.x;
      const lookZ = ball.position.z - player.position.z;
      const targetAngle = Math.atan2(lookX, lookZ);
      let diff = targetAngle - player.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      player.rotation.y += diff * 0.05;
    });

    updateParticles(Math.min(frameDt || 0.016, 0.05));

    controls.update();
    renderer.render(scene, camera);
  }

  rafId = requestAnimationFrame(animate);

  // === DISPOSE ===
  function dispose() {
    cancelAnimationFrame(rafId);
    visibilityObserver.disconnect();
    resizeObserver.disconnect();

    controls.dispose();

    // Traverse and dispose all geometries and materials
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    renderer.dispose();
    renderer.forceContextLoss();
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }

  return { dispose };
}
