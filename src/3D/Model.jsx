import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildGoldbergGlobe, latLonToVector3 } from "./globeData";
import "./Model.css";

// Coordenadas exactas solicitadas para Puebla, México
const LAT = 19.04778;
const LON = -98.20723;
const GLOBE_RADIUS = 2.0;

export const Model = () => {
  const mountRef = useRef(null);
  const tooltipRef = useRef(null);
  const hintRef = useRef(null);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    let width = mountNode.clientWidth || 450;
    let height = mountNode.clientHeight || 450;

    // 1. Escena
    const scene = new THREE.Scene();

    // 2. Cámara con cálculo dinámico para asegurar que el globo NUNCA se corte horizontalmente
    const baseFov = 45;
    const camera = new THREE.PerspectiveCamera(baseFov, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.6);

    // 3. Renderizador WebGL
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const updateCameraFov = (w, h) => {
      camera.aspect = w / h;
      if (camera.aspect < 1.0) {
        camera.fov = 2 * Math.atan(Math.tan((baseFov * Math.PI) / 360) / camera.aspect) * (180 / Math.PI);
      } else {
        camera.fov = baseFov;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    updateCameraFov(width, height);
    mountNode.appendChild(renderer.domElement);

    // 4. Grupo raíz del globo (rota completo)
    const globeGroup = new THREE.Group();
    // Orientación inicial: las Américas y Puebla inician de frente
    globeGroup.rotation.y = Math.PI * 0.54;
    globeGroup.rotation.x = 0.14;
    scene.add(globeGroup);

    // 5. Esfera interior oscura (océanos profundos que dan volumen y solidez 3D)
    const innerSphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.992, 48, 48);
    const innerSphereMat = new THREE.MeshBasicMaterial({
      color: 0x050f24,
      transparent: true,
      opacity: 0.94,
    });
    const innerSphere = new THREE.Mesh(innerSphereGeo, innerSphereMat);
    globeGroup.add(innerSphere);

    // 6. Construcción del Globo Hexagonal (Poliedro de Goldberg)
    const { oceanGeo, landGeo, landBorderGeo } = buildGoldbergGlobe(18, GLOBE_RADIUS);

    // Cuadrícula hexagonal de los océanos (líneas finas en azul eléctrico)
    const oceanMat = new THREE.LineBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.42,
    });
    const oceanMesh = new THREE.LineSegments(oceanGeo, oceanMat);
    globeGroup.add(oceanMesh);

    // Continentes: hexágonos rellenos en azul cian vibrante como la imagen de referencia
    const landMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.35,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });
    const landMesh = new THREE.Mesh(landGeo, landMat);
    globeGroup.add(landMesh);

    // Bordes iluminados en blanco-cian para cada hexágono continental
    const landBorderMat = new THREE.LineBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.85,
    });
    const landBorderMesh = new THREE.LineSegments(landBorderGeo, landBorderMat);
    globeGroup.add(landBorderMesh);

    // 7. Halo de atmósfera exterior (Efecto Fresnel holográfico)
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
          gl_FragColor = vec4(0.22, 0.74, 1.0, 1.0) * intensity * 0.85;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.14, 48, 48);
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphereMesh);

    // 8. Marcador Rojo en Puebla, México
    const pueblaPos = latLonToVector3(LAT, LON, GLOBE_RADIUS);
    const pueblaNormal = pueblaPos.clone().normalize();

    const markerGroup = new THREE.Group();
    globeGroup.add(markerGroup);

    // Esfera roja núcleo brillante
    const dotGeo = new THREE.SphereGeometry(0.048, 20, 20);
    const dotMat = new THREE.MeshStandardMaterial({
      color: 0xff1744,
      emissive: 0xff0033,
      emissiveIntensity: 2.6,
      roughness: 0.2,
      metalness: 0.1,
    });
    const markerDot = new THREE.Mesh(dotGeo, dotMat);
    markerDot.position.copy(pueblaPos.clone().multiplyScalar(1.018));
    markerGroup.add(markerDot);

    // Baliza vertical de luz
    const pinLength = 0.18;
    const pinGeo = new THREE.CylinderGeometry(0.007, 0.007, pinLength, 12);
    const pinMat = new THREE.MeshBasicMaterial({
      color: 0xff3b5c,
      transparent: true,
      opacity: 0.85,
    });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    const pinPos = pueblaPos.clone().addScaledVector(pueblaNormal, pinLength / 2);
    pinMesh.position.copy(pinPos);
    pinMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pueblaNormal);
    markerGroup.add(pinMesh);

    // Cabezal luminoso superior de la baliza
    const pinTipGeo = new THREE.SphereGeometry(0.022, 12, 12);
    const pinTipMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pinTipMesh = new THREE.Mesh(pinTipGeo, pinTipMat);
    pinTipMesh.position.copy(pueblaPos.clone().addScaledVector(pueblaNormal, pinLength));
    markerGroup.add(pinTipMesh);

    // Anillos concéntricos de onda expansiva (Radar Ripple Effect)
    const ringGeo = new THREE.RingGeometry(0.02, 0.045, 32);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xff1744,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ringMat2 = ringMat1.clone();

    const ring1 = new THREE.Mesh(ringGeo, ringMat1);
    const ring2 = new THREE.Mesh(ringGeo, ringMat2);

    const ringPos = pueblaPos.clone().multiplyScalar(1.02);
    ring1.position.copy(ringPos);
    ring2.position.copy(ringPos);

    const ringQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      pueblaNormal
    );
    ring1.quaternion.copy(ringQuaternion);
    ring2.quaternion.copy(ringQuaternion);

    markerGroup.add(ring1);
    markerGroup.add(ring2);

    // Luz puntual roja proyectada sobre los hexágonos circundantes
    const redLight = new THREE.PointLight(0xff1744, 2.5, 2.2);
    redLight.position.copy(pueblaPos.clone().multiplyScalar(1.08));
    globeGroup.add(redLight);

    // Área de colisión invisible optimizada para fácil hover
    const hitGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.position.copy(pueblaPos.clone().multiplyScalar(1.05));
    markerGroup.add(hitMesh);

    // 9. Luces de la escena
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(5, 4, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight2.position.set(-6, -2, -4);
    scene.add(dirLight2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // 10. Interacción: Mouse / Touch y Raycaster para Hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let isUserDragging = false;
    let dragDistance = 0;
    let prevPointer = { x: 0, y: 0 };
    let targetRotationY = globeGroup.rotation.y;
    let targetRotationX = globeGroup.rotation.x;
    let hovered = false;
    let pinned = false;

    const updatePointer = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerMove = (e) => {
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (isUserDragging) {
        const deltaX = clientX - prevPointer.x;
        const deltaY = clientY - prevPointer.y;
        dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
        targetRotationY += deltaX * 0.005;
        targetRotationX = Math.max(-0.6, Math.min(0.6, targetRotationX + deltaY * 0.005));
        prevPointer = { x: clientX, y: clientY };
      }

      updatePointer(clientX, clientY);
    };

    const onPointerDown = (e) => {
      isUserDragging = true;
      dragDistance = 0;
      prevPointer = { x: e.clientX, y: e.clientY };
      updatePointer(e.clientX, e.clientY);
    };

    const onPointerUp = () => {
      if (isUserDragging && dragDistance < 6 && hovered) {
        pinned = !pinned;
      }
      isUserDragging = false;
    };

    const onPointerLeave = () => {
      isUserDragging = false;
      mouse.set(-999, -999);
      if (hovered && !pinned) {
        hovered = false;
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("mousedown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("mouseup", onPointerUp);
    dom.addEventListener("pointerleave", onPointerLeave);

    // 11. Bucle de animación
    const clock = new THREE.Clock();
    const markerWorldPos = new THREE.Vector3();
    const toCameraVec = new THREE.Vector3();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Animación de las ondas expansivas de Puebla
      const wave1 = (elapsedTime * 0.85) % 1;
      const wave2 = (elapsedTime * 0.85 + 0.5) % 1;
      ring1.scale.set(1 + wave1 * 4.5, 1 + wave1 * 4.5, 1);
      ringMat1.opacity = Math.max(0, (1 - wave1) * 0.8);
      ring2.scale.set(1 + wave2 * 4.5, 1 + wave2 * 4.5, 1);
      ringMat2.opacity = Math.max(0, (1 - wave2) * 0.8);

      // Parpadeo sutil de la luz roja
      redLight.intensity = 2.0 + Math.sin(elapsedTime * 5) * 0.7;

      // Rotación suave de izquierda a derecha solicitada por el usuario
      if (!isUserDragging) {
        targetRotationY += (hovered || pinned) ? 0.0006 : 0.0034;
      }

      // Interpolación suave (damping)
      globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.08;
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.08;
      globeGroup.updateMatrixWorld(true);

      // Verificación de si Puebla está en el hemisferio frontal hacia la cámara
      markerDot.getWorldPosition(markerWorldPos);
      toCameraVec.subVectors(camera.position, markerWorldPos).normalize();
      const markerNormalWorld = markerWorldPos.clone().normalize();
      const isFacingFront = markerNormalWorld.dot(toCameraVec) > 0.12;

      // Hover Raycasting
      if (isFacingFront && !isUserDragging) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([hitMesh, markerDot], true);
        if (intersects.length > 0) {
          hovered = true;
        } else if (hovered && !pinned) {
          hovered = false;
        }
      } else if (hovered && !pinned) {
        hovered = false;
      }

      // Actualización directa del Tooltip DOM (60 FPS sin re-renderizado de React)
      const isTooltipActive = (hovered || pinned) && isFacingFront;
      if (tooltipRef.current) {
        if (isTooltipActive) {
          const projected = markerWorldPos.clone().project(camera);
          const screenX = ((projected.x + 1) * width) / 2;
          const screenY = ((-projected.y + 1) * height) / 2;
          tooltipRef.current.style.left = `${screenX}px`;
          tooltipRef.current.style.top = `${screenY}px`;
          tooltipRef.current.classList.add("visible");
          markerDot.scale.set(1.4, 1.4, 1.4);
          mountNode.style.cursor = "pointer";
        } else {
          tooltipRef.current.classList.remove("visible");
          markerDot.scale.set(1, 1, 1);
          mountNode.style.cursor = isUserDragging ? "grabbing" : "grab";
        }
      }

      if (hintRef.current) {
        hintRef.current.textContent = isTooltipActive
          ? "📍 Puebla fijada"
          : "Gira o pasa el cursor sobre el punto rojo";
      }

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    // 12. Redimensionamiento responsivo
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0) {
          width = newWidth;
          height = newHeight;
          updateCameraFov(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(mountNode);

    // 13. Limpieza de recursos al desmontar
    return () => {
      resizeObserver.disconnect();
      renderer.setAnimationLoop(null);

      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("mouseup", onPointerUp);
      dom.removeEventListener("pointerleave", onPointerLeave);

      if (mountNode.contains(renderer.domElement)) {
        mountNode.removeChild(renderer.domElement);
      }

      // Disposición de geometrías y materiales
      innerSphereGeo.dispose();
      innerSphereMat.dispose();
      oceanGeo.dispose();
      oceanMat.dispose();
      landGeo.dispose();
      landMat.dispose();
      landBorderGeo.dispose();
      landBorderMat.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();
      dotGeo.dispose();
      dotMat.dispose();
      pinGeo.dispose();
      pinMat.dispose();
      pinTipGeo.dispose();
      pinTipMat.dispose();
      ringGeo.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
      hitGeo.dispose();
      hitMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="globe-container">
      <div className="globe-canvas-wrap" ref={mountRef} />

      {/* Tooltip holográfico interactivo de Puebla */}
      <div className="globe-tooltip" ref={tooltipRef}>
        <div className="tooltip-header">
          <div className="tooltip-dot" />
          <span className="tooltip-title">Puebla, México</span>
        </div>
        <div className="tooltip-coords-gms">19° 02′ 52″ N, 98° 12′ 26″ O</div>
        <div className="tooltip-coords-dec">• Decimales: 19.04778, -98.20723</div>
        <div className="tooltip-badges">
          <span className="tooltip-badge">⛰️ 2,166 msnm</span>
          <span className="tooltip-badge">🌐 Zona UTM 14N</span>
        </div>
      </div>

      <div className="globe-hint" ref={hintRef}>
        Gira o pasa el cursor sobre el punto rojo
      </div>
    </div>
  );
};
