import { useEffect, useRef } from "react";
import * as THREE from "three";

export const Model = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        const mountNode = mountRef.current;
        if (!mountNode) return;

        // Dimensiones iniciales del contenedor
        const width = mountNode.clientWidth || 400;
        const height = mountNode.clientHeight || 400;

        // 1. Escena
        const scene = new THREE.Scene();

        // 2. Cámara (colocamos la cámara a una distancia adecuada para visualizar el cubo)
        const camera = new THREE.PerspectiveCamera(
            75,
            width / height,
            0.1,
            1000
        );
        camera.position.z = 5;

        // 3. Renderizador WebGL (con alpha: true para respetar el fondo de galaxia)
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountNode.appendChild(renderer.domElement);

        // 4. Geometría y Material del cubo
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00,
            roughness: 0.3,
            metalness: 0.2
        });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        // 5. Luces
        const directionlight = new THREE.DirectionalLight(0xffffff, 2);
        directionlight.position.set(5, 5, 5);
        scene.add(directionlight);

        const envioronmentlight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(envioronmentlight);

        // 6. Bucle de animación
        const animate = () => {
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        };
        renderer.setAnimationLoop(animate);

        // 7. Observador de redimensionamiento
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width: newWidth, height: newHeight } = entry.contentRect;
                if (newWidth > 0 && newHeight > 0) {
                    camera.aspect = newWidth / newHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(newWidth, newHeight);
                }
            }
        });
        resizeObserver.observe(mountNode);

        // 8. Limpieza de recursos al desmontar el componente
        return () => {
            resizeObserver.disconnect();
            renderer.setAnimationLoop(null);
            if (mountNode.contains(renderer.domElement)) {
                mountNode.removeChild(renderer.domElement);
            }
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div className="box" style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}> 
            <div 
                className="render" 
                ref={mountRef} 
                style={{ width: "100%", maxWidth: "500px", height: "400px" }} 
            />
        </div>
    );
};
