import * as THREE from 'three';

// Bitset precalculado de 3,242 celdas del poliedro de Goldberg (subdivisión 18).
// 1 = Tierra / Continente, 0 = Océano.
export const LAND_BITMASK_BASE64 = 
  'DwA/ABgAYAAgAAAAAAAAAAAAAADQvf/U/8f/P/7zX6PLQYEBAEQAwIMHHzxNAPAH4A/oD/gH3oEhCGAAAw4Mn/vfDwAAAAAAAAAAAAAAAAAAAFz4+P///x8AHwAPgBEABAADaQAnzu//P/fw/0P+B3+EH+An7B++/fj9///f//8HgB8APwAvAAAAAAAAAAAAEHh4vv8/AAAAAAAAAAAAAAAAgAAEEGDg////AQAAAAAAAAAAAAAAAAAAAAAAAAAAAPg/4X/gfwA+wA/0gR5IgAIAAAAAAPgD4AHAY4AhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAByAH/jBDz4+Ps+ZAAAAAAAAAAAAAAjAARzgoMPHx+McCUEAoAPgD/AP/AN/8IAHGAAAAAAAAACQASABIAAAAAAAAAAAAAAAAAD8f/x//p//83//558/PhzHAPwA/AA+gA/wAA944MDAYBgDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAATCAPwP/Qf9j//xHx/44MFDAwAAAA==';

/**
 * Lee un bit del bitset Base64.
 */
export function isBitSet(index, base64Str) {
  const binary = atob(base64Str);
  const byte = binary.charCodeAt(index >> 3);
  return (byte & (1 << (index & 7))) !== 0;
}

/**
 * Convierte latitud y longitud en coordenadas cartesianas 3D sobre una esfera de radio R.
 * Mapeo: lat [-90, +90], lon [-180, +180]
 */
export function latLonToVector3(latDeg, lonDeg, radius = 2.0) {
  const latRad = (latDeg * Math.PI) / 180;
  const lonRad = (lonDeg * Math.PI) / 180;
  const y = radius * Math.sin(latRad);
  const r = radius * Math.cos(latRad);
  const x = r * Math.sin(lonRad);
  const z = r * Math.cos(lonRad);
  return new THREE.Vector3(x, y, z);
}

/**
 * Genera la geometría completa del globo hexagonal (Poliedro de Goldberg dual de icosaedro subdividido):
 * - oceanGeo: Malla de líneas de cuadrícula hexagonal para los océanos.
 * - landGeo: Polígonos hexagonales rellenos para los continentes.
 * - landBorderGeo: Líneas de borde resaltado para cada hexágono de tierra.
 */
export function buildGoldbergGlobe(subdivisions = 18, radius = 2.0) {
  const t = (1.0 + Math.sqrt(5.0)) / 2.0;
  const initialVertices = [
    new THREE.Vector3(-1,  t,  0).normalize(),
    new THREE.Vector3( 1,  t,  0).normalize(),
    new THREE.Vector3(-1, -t,  0).normalize(),
    new THREE.Vector3( 1, -t,  0).normalize(),
    new THREE.Vector3( 0, -1,  t).normalize(),
    new THREE.Vector3( 0,  1,  t).normalize(),
    new THREE.Vector3( 0, -1, -t).normalize(),
    new THREE.Vector3( 0,  1, -t).normalize(),
    new THREE.Vector3( t,  0, -1).normalize(),
    new THREE.Vector3( t,  0,  1).normalize(),
    new THREE.Vector3(-t,  0, -1).normalize(),
    new THREE.Vector3(-t,  0,  1).normalize()
  ];

  const initialFaces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];

  const vertices = [];
  const vertexMap = new Map();
  function getVertexId(v) {
    const key = (v.x * 10000 | 0) + '_' + (v.y * 10000 | 0) + '_' + (v.z * 10000 | 0);
    if (vertexMap.has(key)) return vertexMap.get(key);
    const id = vertices.length;
    vertices.push(v);
    vertexMap.set(key, id);
    return id;
  }

  const faces = [];
  const n = subdivisions;
  for (const [i1, i2, i3] of initialFaces) {
    const v1 = initialVertices[i1];
    const v2 = initialVertices[i2];
    const v3 = initialVertices[i3];

    const rowIds = [];
    for (let i = 0; i <= n; i++) {
      rowIds[i] = [];
      for (let j = 0; j <= n - i; j++) {
        const k = n - i - j;
        const v = new THREE.Vector3()
          .addScaledVector(v1, i / n)
          .addScaledVector(v2, j / n)
          .addScaledVector(v3, k / n)
          .normalize();
        rowIds[i][j] = getVertexId(v);
      }
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i; j++) {
        faces.push([rowIds[i][j], rowIds[i+1][j], rowIds[i][j+1]]);
        if (j < n - i - 1) {
          faces.push([rowIds[i+1][j], rowIds[i+1][j+1], rowIds[i][j+1]]);
        }
      }
    }
  }

  const vertFaces = Array.from({ length: vertices.length }, () => []);
  const faceCenters = faces.map((f, fIdx) => {
    const c = new THREE.Vector3()
      .add(vertices[f[0]])
      .add(vertices[f[1]])
      .add(vertices[f[2]])
      .divideScalar(3)
      .normalize();
    vertFaces[f[0]].push(fIdx);
    vertFaces[f[1]].push(fIdx);
    vertFaces[f[2]].push(fIdx);
    return c;
  });

  const cells = [];
  for (let i = 0; i < vertices.length; i++) {
    const center = vertices[i];
    const adjFaceIndices = vertFaces[i];
    const corners = adjFaceIndices.map(fi => faceCenters[fi].clone());

    const ref = Math.abs(center.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const u = new THREE.Vector3().crossVectors(center, ref).normalize();
    const w = new THREE.Vector3().crossVectors(center, u).normalize();

    corners.sort((c1, c2) => {
      const d1 = new THREE.Vector3().subVectors(c1, center);
      const d2 = new THREE.Vector3().subVectors(c2, center);
      const a1 = Math.atan2(d1.dot(w), d1.dot(u));
      const a2 = Math.atan2(d2.dot(w), d2.dot(u));
      return a1 - a2;
    });

    cells.push({ center, corners });
  }

  // 1. Océano / Cuadrícula completa de líneas hexagonales (sin duplicar aristas)
  const oceanEdgeSet = new Set();
  const oceanLines = [];
  for (const cell of cells) {
    const corners = cell.corners;
    const m = corners.length;
    for (let j = 0; j < m; j++) {
      const c1 = corners[j];
      const c2 = corners[(j + 1) % m];
      const k1 = (c1.x * 1000 | 0) + '_' + (c1.y * 1000 | 0) + '_' + (c1.z * 1000 | 0);
      const k2 = (c2.x * 1000 | 0) + '_' + (c2.y * 1000 | 0) + '_' + (c2.z * 1000 | 0);
      const edgeKey = k1 < k2 ? k1 + '|' + k2 : k2 + '|' + k1;
      if (!oceanEdgeSet.has(edgeKey)) {
        oceanEdgeSet.add(edgeKey);
        oceanLines.push(
          c1.x * radius, c1.y * radius, c1.z * radius,
          c2.x * radius, c2.y * radius, c2.z * radius
        );
      }
    }
  }

  // 2. Continentes: Hexágonos rellenos ligeramente contraídos y elevados
  const landPositions = [];
  const landNormals = [];
  const landBorderLines = [];
  const landRadius = radius * 1.004;

  for (let i = 0; i < cells.length; i++) {
    if (!isBitSet(i, LAND_BITMASK_BASE64)) continue;
    const cell = cells[i];
    const center = cell.center;
    const corners = cell.corners;
    const m = corners.length;

    // Contracción sutil (inset 0.88) para dejar una separación limpia entre hexágonos
    const insetCorners = corners.map(c => {
      return new THREE.Vector3()
        .copy(center)
        .addScaledVector(c.clone().sub(center), 0.88)
        .normalize()
        .multiplyScalar(landRadius);
    });
    const cPos = center.clone().multiplyScalar(landRadius);
    const normal = center.clone().normalize();

    // Triángulos para la cara hexagonal
    for (let j = 0; j < m; j++) {
      const p1 = insetCorners[j];
      const p2 = insetCorners[(j + 1) % m];

      landPositions.push(cPos.x, cPos.y, cPos.z);
      landNormals.push(normal.x, normal.y, normal.z);

      landPositions.push(p1.x, p1.y, p1.z);
      landNormals.push(normal.x, normal.y, normal.z);

      landPositions.push(p2.x, p2.y, p2.z);
      landNormals.push(normal.x, normal.y, normal.z);

      // Bordes iluminados
      landBorderLines.push(
        p1.x * 1.001, p1.y * 1.001, p1.z * 1.001,
        p2.x * 1.001, p2.y * 1.001, p2.z * 1.001
      );
    }
  }

  const oceanGeo = new THREE.BufferGeometry();
  oceanGeo.setAttribute('position', new THREE.Float32BufferAttribute(oceanLines, 3));

  const landGeo = new THREE.BufferGeometry();
  landGeo.setAttribute('position', new THREE.Float32BufferAttribute(landPositions, 3));
  landGeo.setAttribute('normal', new THREE.Float32BufferAttribute(landNormals, 3));

  const landBorderGeo = new THREE.BufferGeometry();
  landBorderGeo.setAttribute('position', new THREE.Float32BufferAttribute(landBorderLines, 3));

  return { oceanGeo, landGeo, landBorderGeo, cells };
}
