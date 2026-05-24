/**
 * This component heavily uses three.js, more specifically react-three fiber (plus drei extension).
 * Because of this, it requires the react plugin for astro ($npx astro add react).
 * 
 * Note that the Model component MUST be separate from the ModelViewer or else things don't work
 * for some reason. -> it just needs the <primitive> and gltf = useGLTF() parts to be separate I
 * think. Idk why.
 * 
 * Props:
 *   - name: Display name for the model
 *   - filepath: Path to the GLTF model file
 *   - angle: Optional rotation angle in degrees (default: 0)
 *   - scale: Optional scale factor (default: 5)
 *   - positionOffset: Optional [x, y, z] offset to apply after auto-centering (default: [0, 0, 0])
 *   - toggleableParts: Array of part definitions for hiding/showing meshes
 *     Example: [
 *       { id: 'fuselage', displayName: 'Fuselage', meshNames: ['Fuselage_01', 'Fuselage_02'] },
 *       { id: 'wings', displayName: 'Wings', meshNames: ['Wing_Left', 'Wing_Right'] },
 *       { id: 'payload', displayName: 'Payload Bay', meshNames: ['PayloadBay_Doors', 'PayloadBay_Interior'] }
 *     ]
 *   - showMeshNames: Optional boolean to render a debug list of exact mesh names from the model
 * 
 * Features:
 *   - Automatically centers the model in X and Z axes
 *   - Positions wheels on the floor
 *   - Applies default materials to meshes without textures
 *   - Supports hiding/showing specific parts
 *   - Automatic camera framing with Bounds
 */

import { useState, Suspense, useEffect, useRef } from 'react'
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Bounds, Stage } from "@react-three/drei";
import * as THREE from 'three';


const Model = (props) => {
    const {
        angle = 0,
        positionOffset = [0, 0, 0],
        hiddenPartIds = [],
        toggleableParts = [],
        onBoundingSphere,
        onMeshNames,
        ...rest
    } = props;
    const gltf = useGLTF(props.filepath);
    const modelRef = useRef();
    
    useEffect(() => {
        if (modelRef.current) {
            const box = new THREE.Box3().setFromObject(modelRef.current);
            // Center the model in X and Z axes
            const centerX = (box.min.x + box.max.x) / 2;
            const centerZ = (box.min.z + box.max.z) / 2;
            // Position so the lowest point is on the visible floor at Y=0, plus any offset
            modelRef.current.position.set(
                -centerX + positionOffset[0],
                -box.min.y + positionOffset[1],
                -centerZ + positionOffset[2]
            );

            if (typeof onBoundingSphere === 'function') {
                const sphere = box.getBoundingSphere(new THREE.Sphere());
                onBoundingSphere(sphere.radius);
            }
        }
    }, [gltf.scene, angle, positionOffset, onBoundingSphere]);

    useEffect(() => {
        if (!gltf.scene) {
            return;
        }

        const hiddenMeshNames = new Set(
            toggleableParts
                .filter((part) => hiddenPartIds.includes(part.id))
                .flatMap((part) => part.meshNames || [])
        );

        const meshNames = new Set();
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                meshNames.add(child.name || '(unnamed)');
                if (hiddenMeshNames.has(child.name)) {
                    child.visible = false;
                } else if (
                    toggleableParts.some((part) => (part.meshNames || []).includes(child.name))
                ) {
                    child.visible = true;
                }
            }
        });

        if (typeof onMeshNames === 'function') {
            onMeshNames(Array.from(meshNames).sort());
        }
    }, [gltf.scene, hiddenPartIds, toggleableParts, onMeshNames]);
    
    useEffect(() => {
        // Apply default materials to meshes that don't have any
        const defaultMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc,
            roughness: 0.7,
            metalness: 0.1
        });
        
        gltf.scene.traverse((child) => {
            if (child.isMesh && (!child.material || Array.isArray(child.material) && child.material.length === 0)) {
                child.material = defaultMaterial;
            } else if (child.isMesh && Array.isArray(child.material)) {
                // Handle multi-material meshes
                child.material = child.material.map(mat => mat || defaultMaterial);
            }
        });
    }, [gltf.scene]);
    
    return ( 
        <group {...rest} >
            <primitive ref={modelRef} object={ gltf.scene } rotation={[-Math.PI / 2 + (angle * Math.PI / 180), 0, 0]}/>
        </group>
    )
}

export function ModelViewer({ name, filepath, angle = 0, toggleableParts = [], positionOffset = [0, 0, 0], showMeshNames = false }) {
    const autoRotate = true;
    const [hiddenPartIds, setHiddenPartIds] = useState([]);
    const [modelRadius, setModelRadius] = useState(1);
    const [meshNames, setMeshNames] = useState([]);

    const cameraPosition = [0, Math.max(3, modelRadius * 1.8), Math.max(8, modelRadius * 3.5)];
    const cameraFar = Math.max(2000, modelRadius * 120);

    return (
        <div className="flex justify-center p-5">
            <div className="flex flex-col-reverse md:flex-row justify-center max-w-5xl">
                <Canvas camera={{ position: cameraPosition, fov: 35, near: 0.1, far: cameraFar }} className="w-full px-10 md:w-2/3 aspect-[16/6]">
                    <Suspense>
                        <Stage adjustCamera={false} intensity={0.5} shadows="contact" environment="city">
                            <Bounds fit clip observe margin={1.2}>
                                <Model
                                    filepath={filepath}
                                    angle={angle}
                                    hiddenPartIds={hiddenPartIds}
                                    toggleableParts={toggleableParts}
                                    positionOffset={positionOffset}
                                    castShadow
                                    onBoundingSphere={setModelRadius}
                                    onMeshNames={showMeshNames ? setMeshNames : undefined}
                                />
                            </Bounds>
                        </Stage>
                        <OrbitControls
                            autoRotate={autoRotate}
                            autoRotateSpeed={-1}
                            enableDamping={false}
                            makeDefault
                            minPolarAngle={0.35}
                            maxPolarAngle={Math.PI / 2.2}
                        />
                    </Suspense>
                </Canvas>
                <div className="flex justify-center md:justify-start flex-col">
                    <h1 className='text-3xl lg:text-4xl font-bold leading-tighter tracking-tighter mb-4 font-heading dark:text-gray-200'>{name}</h1>
                    {toggleableParts.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-2 dark:text-gray-300">View Options:</h3>
                            <div className="flex flex-wrap gap-2 max-w-md">
                                {toggleableParts.map(part => (
                                    <button
                                        key={part.id}
                                        onClick={() => {
                                            if (hiddenPartIds.includes(part.id)) {
                                                setHiddenPartIds(hiddenPartIds.filter(id => id !== part.id));
                                            } else {
                                                setHiddenPartIds([...hiddenPartIds, part.id]);
                                            }
                                        }}
                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                            hiddenPartIds.includes(part.id)
                                                ? 'bg-gray-400 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                                                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
                                        }`}
                                    >
                                        {hiddenPartIds.includes(part.id) ? `Show ${part.displayName}` : `Hide ${part.displayName}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {showMeshNames && (
                        <div className="mb-4 max-w-md">
                            <h3 className="text-lg font-semibold mb-2 dark:text-gray-300">Debug mesh names</h3>
                            {meshNames.length === 0 ? (
                                <p className="text-sm text-muted dark:text-slate-400">No mesh names were detected in this model.</p>
                            ) : meshNames.length === 1 ? (
                                <>
                                    <p className="text-sm text-muted dark:text-slate-400 mb-2">
                                        This model only exposes a single mesh/node, so part-level toggling is not possible unless the file is split into separate named parts. You can do this by changing export settings or using a program like Blender.
                                    </p>
                                    <div className="overflow-y-auto max-h-48 rounded border border-gray-200 bg-white/80 p-3 text-sm text-gray-800 shadow-sm dark:border-gray-700 dark:bg-slate-900/80 dark:text-gray-200">
                                        {meshNames.map((name) => (
                                            <div key={name} className="mb-1 break-words">{name}</div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-muted dark:text-slate-400 mb-2">Use these exact names in your toggleableParts configuration.</p>
                                    <div className="overflow-y-auto max-h-48 rounded border border-gray-200 bg-white/80 p-3 text-sm text-gray-800 shadow-sm dark:border-gray-700 dark:bg-slate-900/80 dark:text-gray-200">
                                        {meshNames.map((name) => (
                                            <div key={name} className="mb-1 break-words">{name}</div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    { /* highlight model part on hover */}
                    {/* <p id="part-name" className="hidden md:flex text-lg text-muted mb-6 dark:text-slate-300 text-left">Hover over a component!</p> */}
                </div>
            </div>
        </div>
    );
}

export default ModelViewer;