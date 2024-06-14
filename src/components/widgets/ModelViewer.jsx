/**
 * This component heavily uses three.js, more specifically react-three fiber (plus drei extension).
 * Because of this, it requires the react plugin for astro ($npx astro add react).
 * 
 * Note that the Model component MUST be separate from the ModelViewer or else things don't work
 * for some reason. -> it just needs the <primitive> and gltf = useGLTF() parts to be separate I
 * think. Idk why.
 * 
 * The data in here was manually set for a specific model (PlaneFull24.gltf). So for other
 * models, properties must be changed like position, rotation, etc. These should probably be
 * passed through in a nicer way instead of hard coded.
 */
import * as THREE from 'three'

import { useState, Suspense } from 'react'
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Grid, Stage } from "@react-three/drei";

const highlightMaterial = new THREE.MeshPhongMaterial();
highlightMaterial.color.setRGB(1, 0, 0);

const Model = (props) => {
    const gltf = useGLTF(props.filepath);

    return ( 
        <group {...props}>
            <primitive object={ gltf.scene } scale={5} position={[0, 0, 1.5]} rotation={[-Math.PI / 2, 0, 0]}/>
        </group>
    )
}

export function ModelViewer({ name, filepath }) {
    const [autoRotate, setAutoRotate] = useState(0);

    return (
        <div className="flex justify-center p-5 gap-3">
            <div className="flex flex-col-reverse md:flex-row justify-center max-w-5xl">
                <Canvas camera={{ position: [0, .5, 2], zoom: 2 }} className="w-full md:w-2/3 aspect-[16/6]"
                    onPointerEnter={(e) => {
                        setAutoRotate(false);
                    }}
                    onPointerLeave={(e) => {
                        setAutoRotate(true);
                        document.getElementById("part-name").innerText = "";
                    }}
                >
                    <Suspense>
                        <Grid scale={2} fadeDistance={12} infiniteGrid={true} position={[0, -1, 0]}/>
                        <Stage intensity={0}>
                            <Model filepath={filepath}
                            onPointerOver={(e) => {
                                document.getElementById("part-name").innerText = `Highlighted component:\n${e.object.parent.name}`;
                                e.object.parent.userData.oldMaterial = e.object.material;
                                e.object.parent.children.forEach(child => {
                                    child.material = highlightMaterial;
                                });
                            }}
                            onPointerOut={(e) => {
                                e.object.parent.children.forEach(child => {
                                    child.material = e.object.parent.userData.oldMaterial;
                                });
                            }}
                            />
                        </Stage>
                        <OrbitControls autoRotate={autoRotate} autoRotateSpeed={-1} enableDamping={false} className="md:hidden"/>
                    </Suspense>
                </Canvas>
                <div className="flex justify-center md:justify-start flex-col">
                    <h1 className='text-3xl lg:text-4xl font-bold leading-tighter tracking-tighter mb-4 font-heading dark:text-gray-200'>{name}</h1>
                    <p id="part-name" className="text-lg text-muted mb-6 dark:text-slate-300 text-center"></p>
                </div>
            </div>
        </div>
    );
}

export default ModelViewer;