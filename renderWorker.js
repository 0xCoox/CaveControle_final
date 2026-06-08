import Cave from "./Cave/Cave.js";
import CaveHelper from "./Cave/CaveHelper.js";
import Screen from "./Cave/Screen.js";
import * as THREE from "./three/three.module.js";
import VRPNController from "./VRPNController.js";
import Stats from './three/libs/stats.module.js';
import { PLYLoader } from "./three/loaders/PLYLoader.js";


console.log("worker");

self.addEventListener("message", handleMessage )
// const stats = new Stats()
// console.log(stats)




function handleMessage ( message ) {
	// console.log(message);
	if(message.data.type === "monitorCanvas") {
		initRenderer(message.data.canvas);
	}
	if(message.data.type === "monitorCamera") {
		updateCamera(message.data.position, message.data.quaternion);
	}
	if(message.data.type === "caveCanvas") {
		console.log("caveCanvas")
		initCaveRenderer(message.data.canvas);
	}
	if(message.data.type === "caveCanvasResize") {
		console.log("caveCanvasResize")
		caveCanvasResize(message.data.width, message.data.height);
	}
	if(message.data.type === "flipEyes") {
	console.log("flipEyes")
	    flipEyes();
	}
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF);
const camera = new THREE.PerspectiveCamera( 50, 4/3, 0.01, 50 );


const trackedCamera = new THREE.PerspectiveCamera( 50, 1.5, 0.01, 0.3 );
const trackedCameraHelper = new THREE.CameraHelper(trackedCamera);
scene.add(trackedCameraHelper);

const pickingCamera = new THREE.PerspectiveCamera( 45, 1, 0.01, 30 );
scene.add(pickingCamera);
const pickingCameraHelper = new THREE.CameraHelper(pickingCamera);
// scene.add(pickingCameraHelper);
pickingCamera.layers.enable(1);




const PDS = Math.sqrt(2) * 1.8;
const t = new THREE.Vector3(1, 1, 0).normalize().multiplyScalar(2.25);
const screenCorners0 = [
    new THREE.Vector3(-PDS, 0, 0),
    new THREE.Vector3(0, PDS, 0),
    new THREE.Vector3(-PDS, 0, 2.25),
    new THREE.Vector3(0, PDS, 2.25),
];

const screenCorners1 = [
    new THREE.Vector3(0, PDS, 0),
    new THREE.Vector3(PDS, 0, 0),
    new THREE.Vector3( 0, PDS, 2.25),
    new THREE.Vector3( PDS, 0, 2.25),
];

const screenCorners2 = [
  new THREE.Vector3(-t.x, PDS - t.y, 0),
  new THREE.Vector3(PDS - t.x, -t.y, 0),
  new THREE.Vector3(0, PDS, 0),
  new THREE.Vector3(PDS, 0, 0),
];

const screens = [
    new Screen(screenCorners0),
    new Screen(screenCorners1),
    new Screen(screenCorners2),
]

const cave = new Cave(screens);
const stereoCameras = cave.stereoScreenCameras;
const caveHelper = new CaveHelper(cave);
scene.add(caveHelper)
caveHelper.hideStereoScreenCameraHelpers()

const textureWidth = 2048;
const textureHeight = 2048;
const renderSettings = {
	minFilter: THREE.NearestFilter,
	magFilter: THREE.NearestFilter,
	format: THREE.RGBAFormat,
	type: THREE.FloatType,
}

const renderTargetsL = {};
const renderTargetsR = {};
const screenTexturesL = {};
const screenTexturesR = {};
const camerasL = {};
const camerasR = {};



const gridHelperTable = new THREE.GridHelper(10, 10, 0xAAAA00, 0xAAAA00);
gridHelperTable.position.set(0, -0.125, 0)
const tableGroup = new THREE.Group;
const tablewire = new THREE.LineSegments(
	new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.35, 0.6, 0.25, 8, 1)),
	new THREE.LineBasicMaterial({color: 0XAAAA00, linewidth: 3})
);
const table = new THREE.Mesh(
	new THREE.CylinderGeometry(0.3499, 0.5999, 0.2499, 8, 1),
	new THREE.MeshBasicMaterial({color: 0X000000, polygonOffset:10.5})
);
tableGroup.add(table, tablewire)
tableGroup.add(gridHelperTable);

tableGroup.rotateX(Math.PI/2)
scene.add(tableGroup)
tableGroup.position.y += 1.25;
tableGroup.position.z += 0.125;


    const loader = new PLYLoader(  );
    loader.load("./test_point_cloud.ply", function ( points )
        {
            const point_cloud = new THREE.Points(points);
            point_cloud.geometry.center();
            
            var bbox = new THREE.Box3().setFromObject(point_cloud);
            var size = bbox.getSize(new THREE.Vector3());
            var maxAxis = Math.max(size.x, size.y, size.z);
            // point_cloud.scale.multiplyScalar(2.0 / maxAxis);
            point_cloud.scale.multiplyScalar(4.0 / maxAxis);
            // point_cloud.rotateX(-0.5*3.1415);
            point_cloud.position.set(0, 1.5, 1)
            point_cloud.material = new THREE.PointsMaterial({size: 0.002,
                                                             vertexColors: true});
            scene.add(point_cloud);

        });


const debugStereo = new THREE.Group()
scene.add(debugStereo);
debugStereo.position.set(0, -0.5, 0)
const leftDebug = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 16),
    new THREE.MeshBasicMaterial({color: 0xaa0000})
)
leftDebug.layers.set(1);
const rightDebug = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 16),
    new THREE.MeshBasicMaterial({color: 0x0000aa})
)
rightDebug.layers.set(2);
debugStereo.add(leftDebug, rightDebug)


const geometry = new THREE.BufferGeometry();
geometry.setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 1, 0 ) ] );
const laserPointer = new THREE.Line(geometry);
scene.add(laserPointer)

console.log(laserPointer)



const leftHand = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), 0.2, 0xFF5500);
const rightHand = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), 0.2, 0x0055FF);
scene.add(leftHand)
scene.add(rightHand)
const pointer = new THREE.Mesh(
	new THREE.SphereGeometry(0.0125, 32, 32),
	new THREE.MeshBasicMaterial({color: 0xff0000})
)
scene.add(pointer)



// let alt = false; // up/down = z
let alts = {
    left: false,
    right: false,
}
let mode = 0; // 0 scale 1 position 2 rotaiton
const ray = {
    origin: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    epsilon: 0.005,
}
const rayRight = {
    origin: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    epsilon: 0.005,
}

let rightHeld = false;
const vrpnController = new VRPNController({
    hands: {
        left: {
            right: ( state ) => {
                if( state == 0)
                    return;
            },
            left: ( state ) => {
                if( state == 0)
                    return;
            },
            up: ( state ) => {
                if( state == 0)
                    return;
            },
            down: ( state ) => {
                if( state == 0)
                    return;
            },

            trigger: ( state ) => {
                console.log(`left hand trigger button ${state}`)
	            // if(state == 0)
                //     spatialAnnotations.addAnnotation(closestPoint.clone());

            },
            mode: ( state ) => {
                console.log(`left hand mode button ${state}`)
                // if(state != 0)
                    // mode = (mode + 1) % 2;
                // console.log(mode)
            },
            stick: ( direction ) => {
                console.log(`left hand stick ${direction[0]} ${direction[1]}`)
            },
            alt: ( state ) => { alts.left = state; },
            move: ( position, rotation ) => {
                leftHand.position.copy(position);
                leftHand.rotation.setFromQuaternion(rotation);
                // holoCubeDisplayL.setPickingRay
                ray.origin.copy(position);
                ray.direction.set(0,1,0).applyQuaternion(rotation);

                laserPointer.position.copy(position)
                laserPointer.rotation.setFromQuaternion(rotation)
                // console.log(leftHand)
            },
        },
        right: {
            right: ( state ) => {
                if( state == 0)
                    return;

                console.log(`right hand right button ${state}`)
            },
            left: ( state ) => {
                if( state == 0)
                    return;

                console.log(`right hand left button ${state}`)
            },
            up: ( state ) => {
                if( state == 0)
                    return;

                console.log(`right hand up button ${state}`)
            },
            down: ( state ) => {
                if( state == 0)
                    return;

                console.log(`right hand down button ${state}`)
            },
            trigger: ( state ) => {
                console.log(`right hand trigger button ${state}`)
                if(state == 1) {
                    rightHeld = true;
                } else {
                    rightHeld = false;
                }
            },
            mode: ( state ) => {
                console.log(`right hand mode button ${state}`)
                if(state == 1)
                    flipEyes();
            },
            stick: ( direction ) => {
                console.log(`right hand stick ${direction[0]} ${direction[1]}`)
                // const dir = new THREE.Vector3;
            },
            alt: ( state ) => { alts.right = state },
            move: ( position, rotation ) => {
                rightHand.position.copy(position);
                rightHand.rotation.setFromQuaternion(rotation);
                if(rightHeld) {
                    rayRight.origin.copy(position);
                    rayRight.direction.set(0,1,0).applyQuaternion(rotation);
                }
            },
        },
    },
    head: {
        move: ( position, rotation ) => {
            trackedCamera.position.copy(position);
            trackedCamera.rotation.setFromQuaternion(rotation);
        },
    }
});










let renderer = undefined;
let renderLeft = true;

function initRenderer ( canvas ) {
	renderer = new THREE.WebGLRenderer({ canvas: canvas });

	renderer.setAnimationLoop( () => {
		trackedCamera.updateProjectionMatrix();
		trackedCamera.updateWorldMatrix();
		trackedCameraHelper.update();


		cave.updateStereoScreenCameras(trackedCamera.matrixWorld.clone());
		caveHelper.updateStereoScreenCameraHelpers();


		if(renderLeft) {
			camera.layers.enable(1);
			camera.layers.disable(2);
		}
		else {
			camera.layers.enable(2);
			camera.layers.disable(1);
		}
		renderLeft = !renderLeft;
		scene.background = new THREE.Color(0xaaaaaa);

		renderer.render(scene, camera);
	})
}

let caveRenderer = undefined;
let caveCanvas = undefined;
function initCaveRenderer ( canvas ) {
	caveCanvas = canvas;
	caveRenderer = new THREE.WebGLRenderer({ canvas: canvas });
	caveRenderer.setScissorTest(true);
	caveRenderer.setAnimationLoop( () => {


		const side = renderLeft ? "left" : "right";
		const viewWidth = canvas.width / 3;
		const viewHeight = canvas.height;

		caveHelper.visible = false;
		trackedCameraHelper.visible = false;
		scene.background = new THREE.Color(0X000000);

		for( let i = 0; i < 3; ++i ) {
			caveRenderer.setViewport(i * viewWidth, 0, viewWidth, viewHeight);
			caveRenderer.setScissor(i * viewWidth, 0, viewWidth, viewHeight);
			caveRenderer.render(scene, stereoCameras[i][side]);
		}

		caveHelper.visible = true;
		trackedCameraHelper.visible = true;

	})
}

function updateCamera ( position, quaternion ) {
	camera.position.fromArray(position);
	camera.quaternion.fromArray(quaternion);
	camera.updateMatrixWorld();
}

function caveCanvasResize ( width, height ) {
	console.log(width, height);
	caveCanvas.width = width;
	caveCanvas.height = height;
}

function flipEyes ( ) {
	renderLeft = !renderLeft;
}

vrpnController.connect();