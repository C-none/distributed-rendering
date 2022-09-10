import * as THREE from 'three';
import { Color } from 'three';
import {
    OrbitControls
} from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import Stats from '../node_modules/three/examples/jsm/libs/stats.module.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
// import { FBXLoader } from '../node_modules/three/examples/jsm/loaders/FBXLoader.js';     
import { computeMikkTSpaceTangents } from '../node_modules/three/examples/jsm/utils/BufferGeometryUtils.js'
import { wasm, isReady, ready, generateTangents } from '../node_modules/three/examples/jsm/libs/mikktspace.module.js'
import { readtext } from './loader/readstring.js';
import { IBO } from './IBO/IBO.js';

// const ScreenWidth = Math.round(document.body.clientWidth * window.devicePixelRatio);
// const ScreenHeight = Math.round(document.body.clientHeight * window.devicePixelRatio);
const ScreenWidth = 600 * window.devicePixelRatio;
const ScreenHeight = 600 * window.devicePixelRatio;
const scalesize = 2;

let camera, controls, gbufferScene, postScene, renderer, canvas, renderTarget, ibo1, ibo2;


async function init () {

    // let stats = new Stats();
    // document.body.appendChild(stats.dom);

    canvas = document.querySelector('canvas');
    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
    });
    renderer.outputEncoding = THREE.sRGBEncoding;
    resizeRendererToDisplaySize(renderer);

    setRT();

    setcamera();

    setIBO();

    await packScene();

    function resizeRendererToDisplaySize (renderer) {
        const canvas = renderer.domElement;
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
function setRT () {
    renderTarget = new THREE.WebGLMultipleRenderTargets(
        ScreenWidth / scalesize,
        ScreenHeight / scalesize,
        1,
    );
    for (let i = 0, il = renderTarget.texture.length; i < il; i++) {
        renderTarget.texture[i].minFilter = THREE.NearestFilter;
        renderTarget.texture[i].magFilter = THREE.NearestFilter;
        renderTarget.texture[i].encoding = THREE.LinearEncoding;
        renderTarget.texture[i].wrapT = THREE.MirroredRepeatWrapping;
        renderTarget.texture[i].wrapS = THREE.MirroredRepeatWrapping;
    }
    renderTarget.texture[0].name = 'gbuffer';
    renderTarget.texture[0].internalFormat = 'RGBA16F';
    renderTarget.texture[0].format = THREE.RGBAFormat;
    renderTarget.texture[0].type = THREE.HalfFloatType;

}

function setcamera () {
    const fov = 45;
    const near = 0.25;
    const far = 1000;
    camera = new THREE.PerspectiveCamera(fov, ScreenWidth / ScreenHeight, near, far);
    camera.position.set(5, 5, 0);
    camera.lookAt(5, 0, 0);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 2;
    controls.maxDistance = 100;
    controls.target = new THREE.Vector3(0, 5, 0);
}

async function packScene () {
    gbufferScene = new THREE.Scene();
    postScene = new THREE.Scene();

    async function initMikkTSpace (cb) {
        await ready
        cb()
    }

    let gbufferVert = await readtext('./src/shader/gbuffer-vert.glsl');
    let gbufferFrag = await readtext('./src/shader/gbuffer-frag.glsl');
    let postVert = await readtext('./src/shader/post-vert.glsl');
    let postFrag = await readtext('./src/shader/post-frag.glsl');
    let model = '../asset/sponza/sponza.glb';
    const gltfLoader1 = new GLTFLoader();
    gltfLoader1.load(model, function (gltf) {
        let del;
        gltf.scene.traverse(function (node) {
            if (node instanceof THREE.Mesh) {
                let tmp = node.material;
                // console.log(node);
                if (tmp.map == null) {
                    del = node;
                } else {
                    initMikkTSpace(cb => {
                        let MikkTSpace = {
                            wasm: wasm,
                            isReady: isReady,
                            generateTangents: generateTangents
                        }
                        computeMikkTSpaceTangents(node.geometry, MikkTSpace)
                    });
                    // console.log(node);
                    node.material = new THREE.RawShaderMaterial({
                        vertexShader: gbufferVert,
                        fragmentShader: gbufferFrag,
                        uniforms: {
                            tnormal: { value: tmp.normalMap },
                        }
                    });
                }
            }
        });
        gltf.scene.children[0].children.splice(gltf.scene.children[0].children.findIndex(ele => ele === del), 1);
        gbufferScene.add(gltf.scene);
    });
    // let irradiance = new THREE.TextureLoader().load("../asset/test/output.png");
    // irradiance.name = 'irr';
    // irradiance.wrapS = THREE.MirroredRepeatWrapping;
    // irradiance.wrapT = THREE.MirroredRepeatWrapping;
    // irradiance.magFilter = THREE.NearestFilter;
    // irradiance.minFilter = THREE.NearestFilter;
    const gltfLoader2 = new GLTFLoader();
    gltfLoader2.load(model, function (gltf) {
        let del;
        gltf.scene.traverse(function (node) {
            if (node instanceof THREE.Mesh) {
                let tmp = node.material;
                if (tmp.map == null || !tmp.map.hasOwnProperty('name')) {
                    // node.material = new THREE.MeshBasicMaterial({
                    //     color: 0xFFFFFF,
                    // })
                    del = node;
                } else {
                    initMikkTSpace(cb => {
                        let MikkTSpace = {
                            wasm: wasm,
                            isReady: isReady,
                            generateTangents: generateTangents
                        }
                        computeMikkTSpaceTangents(node.geometry, MikkTSpace)
                    });
                    node.material = new THREE.RawShaderMaterial({
                        vertexShader: postVert,
                        fragmentShader: postFrag,
                        uniforms: {
                            width: { value: ScreenWidth },
                            height: { value: ScreenHeight },
                            scale: { value: scalesize },
                            eyepos: { value: ibo1.camera.position },
                            model: { value: ibo1.camera.matrixWorld },
                            modelView: { value: ibo1.camera.projectrionMatrix },
                            gbuffer: { value: ibo1.gbuffer },
                            albedo: { value: tmp.map },
                            tnormal: { value: tmp.normalMap },
                            irradiance1: { value: ibo1.irradiance },
                        },
                    });
                    // console.log(node.material);
                }
            }
        });
        // console.log(gltf.scene);
        gltf.scene.children[0].children.splice(gltf.scene.children[0].children.findIndex(ele => ele === del), 1);
        postScene.add(gltf.scene);
    });
}

function setIBO () {
    ibo1 = new IBO();
    ibo1.camera = camera;
    ibo2 = new IBO();
    let irradiance = new THREE.TextureLoader().load("../asset/test/output.png");
    irradiance.name = 'irr';
    irradiance.wrapS = THREE.MirroredRepeatWrapping;
    irradiance.wrapT = THREE.MirroredRepeatWrapping;
    irradiance.magFilter = THREE.NearestFilter;
    irradiance.minFilter = THREE.NearestFilter;
    ibo1.update(camera, renderTarget.texture[0], irradiance);

    ibo2.copy(ibo1);
}

function IBOupdate () {
    ibo2.copy(ibo1);
    let irradiance = new THREE.TextureLoader().load("../asset/test/output.png");
    irradiance.name = 'irr';
    irradiance.wrapS = THREE.MirroredRepeatWrapping;
    irradiance.wrapT = THREE.MirroredRepeatWrapping;
    irradiance.magFilter = THREE.NearestFilter;
    irradiance.minFilter = THREE.NearestFilter;
    ibo1.update(camera, renderTarget.texture[0], irradiance);
}

let cnt = 0;
function render () {

    // stats.update();
    renderer.setRenderTarget(renderTarget);
    // renderer.setSize(ScreenWidth, ScreenHeight, false);
    renderer.render(gbufferScene, camera);
    IBOupdate();
    // cnt++;
    // console.log(cnt);
    renderer.setRenderTarget(null);
    // renderer.setSize(ScreenWidth, ScreenHeight, false);
    renderer.render(postScene, camera);
    controls.update();
    requestAnimationFrame(render);
}


async function main () {
    await init();
    render();
}

main();

