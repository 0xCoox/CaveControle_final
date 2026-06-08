import * as THREE from '../three/three.module.js';
import { Object3D, Group, Color } from '../three/three.module.js';
import ScreenHelper from './ScreenHelper.js';
import StereoScreenCameraHelper from './StereoScreenCameraHelper.js';

const screenColors = [0x3399DD, 0xDD3399, 0x99DD33];
const stereoScreenCameraColors = [0x1177BB, 0xBB1177, 0x77BB11];

export default class CaveHelper extends Object3D {
	#cave;
	#screenHelpers;
	#stereoScreenCameraHelpers;
	#axesHelper;

	constructor ( cave ) {
		super();

		this.type = 'CaveHelper';
		
		this.#cave = cave;

		this.#axesHelper = new THREE.AxesHelper( 10 );
		this.add( this.#axesHelper );

		this.#screenHelpers = new Group();
		for(const screen of this.#cave.screens) {
			this.#screenHelpers.add(new ScreenHelper(screen, screenColors.shift()));
		}
		this.add(this.#screenHelpers);

		this.#stereoScreenCameraHelpers = new Group();
		for(const stereoScreenCamera of this.#cave.stereoScreenCameras) {
			this.#stereoScreenCameraHelpers.add(new StereoScreenCameraHelper(stereoScreenCamera, new Color(stereoScreenCameraColors.shift())));
		}
		this.add(this.#stereoScreenCameraHelpers);
	}

	updateStereoScreenCameraHelpers ( ) {
		for(const stereoScreenCameraHelper of this.#stereoScreenCameraHelpers.children) {
			stereoScreenCameraHelper.update();
		}
	}

	hideStereoScreenCameraHelpers ( ) {
		this.remove(this.#stereoScreenCameraHelpers);
	}

	showStereoScreenCameraHelpers ( ) {
		this.add(this.#stereoScreenCameraHelpers);
	}

	setLayer ( layer ) {
		this.layers.set(layer);
		this.#axesHelper.layers.set(layer);

		for(const screenHelper of this.#screenHelpers.children) {
			screenHelper.setLayer(layer);
		}

		for(const stereoScreenCameraHelper of this.#stereoScreenCameraHelpers.children) {
			stereoScreenCameraHelper.setLayer(layer);
		}
	}
}