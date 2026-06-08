import * as THREE from '../three/three.module.js';
import StereoCamera from './StereoScreenCamera.js';

export default class Cave {
	#screens;
	#stereoScreenCameras;

	constructor ( screens ) {
		this.#screens = [ ...screens ];

		this.#stereoScreenCameras = [ ];
		for( const screen of screens ) {
			this.#stereoScreenCameras.push( new StereoCamera(screen) );
		}
	}

	get screens ( ) {
		return this.#screens;
	}

	get stereoScreenCameras ( ) {
		return this.#stereoScreenCameras;
	}

	updateStereoScreenCameras ( headMatrix ) {
		for( const stereoScreenCamera of this.#stereoScreenCameras ) {
			stereoScreenCamera.update(headMatrix);
		}
	}
}