import * as THREE from 'three';
import {
    OrbitControls
} from '../node_modules/three/examples/jsm/controls/OrbitControls.js';

import {
    GLTFLoader
} from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

// const ScreenWidth = Math.round(document.body.clientWidth * window.devicePixelRatio);
// const ScreenHeight = Math.round(document.body.clientHeight * window.devicePixelRatio);
const ScreenWidth = 600 * window.devicePixelRatio;
const ScreenHeight = 600 * window.devicePixelRatio;

let canvas, renderer, camera, controls, scene;

class my {
    constructor() {
        this.a = 1;
    }
}
let a = new my;
let b = a;
a.a = 2;
console.log(b.a);

async function init () {
    canvas = document.querySelector('canvas');
    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    resizeRendererToDisplaySize(renderer);

    const fov = 45;
    const aspect = 2; // the canvas default
    const near = 0.1;
    const far = 100;
    camera = new THREE.PerspectiveCamera(45, ScreenWidth / ScreenHeight, 0.25, 1000);
    camera.position.set(5, 5, 0);
    camera.lookAt(5, 0, 0);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 2;
    controls.maxDistance = 100;
    controls.target = new THREE.Vector3(0, 5, 0);

    scene = new THREE.Scene();
    scene.background = new THREE.Color('black');

    // {
    //     const skyColor = 0xB1E1FF; // light blue
    //     const groundColor = 0xB97A20; // brownish orange
    //     const intensity = 0.6;
    //     const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    //     scene.add(light);
    // }

    {
        const amlight = new THREE.AmbientLight(0x404040, 0.8); // soft white light
        scene.add(amlight);
        const color = 0xFFFFFF;
        const intensity = 0.8;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(5, 10, 2);
        light.castShadow = true;
        light.shadow.bias = -0.0001;
        //Set up shadow properties for the light
        let resolution = 1024;
        light.shadow.mapSize.width = resolution; // default
        light.shadow.mapSize.height = resolution; // default
        let scope = 10;
        light.shadow.camera.left = - scope;
        light.shadow.camera.right = scope;
        light.shadow.camera.top = scope;
        light.shadow.camera.bottom = - scope;
        light.shadow.camera.near = 0.5; // default
        light.shadow.camera.far = 500; // default
        scene.add(light);
        // scene.add(light.target);
    }

    {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load('../asset/sponza/sponza.glb', function (gltf) {
            gltf.scene.traverse(function (node) {
                // console.log(node);

                if (node instanceof THREE.Mesh) {
                    // node.material = new MeshPhongMaterial();
                    // console.log(node.material);
                    let tmp = node.material;
                    if (tmp.map == null) {
                    } else {
                        // console.log(node);
                        node.material = new THREE.MeshBasicMaterial({
                            map: tmp.map,
                        })
                    }
                    node.material.smoothShading = true;
                    node.material.flatShading = false;
                    node.castShadow = true;
                    node.receiveShadow = true;
                }

            });

            scene.add(gltf.scene);
        });
    }
    function resizeRendererToDisplaySize (renderer) {
        const canvas = renderer.domElement;
        // const width = Math.ceil(document.body.clientWidth * window.devicePixelRatio);
        // const height = Math.ceil(document.body.clientHeight * window.devicePixelRatio);
        const width = ScreenWidth;
        const height = ScreenHeight;
        console.log(width + ' ' + height);
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }
    return;

}
function render () {
    // resizeRendererToDisplaySize(renderer);
    renderer.render(scene, camera);
    controls.update();
    requestAnimationFrame(render);

}
async function main () {
    await init();
    render();
}
main();