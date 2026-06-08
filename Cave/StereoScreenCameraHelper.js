import StereoCamera from "./StereoScreenCamera.js";
import { CameraHelper, Object3D, Color } from "../three/three.module.js";

export default class StereoScreenCameraHelper extends Object3D{
	#stereoScreenCamera;
	#leftCameraHelper;
	#rightCameraHelper;

	constructor ( stereoCamera, color = new Color(0xffffff) ) {
		super();
		this.type = 'StereoScreenCameraHelper';

		this.#stereoScreenCamera = stereoCamera;
	
		this.#leftCameraHelper = new CameraHelper(this.#stereoScreenCamera.left);
		this.#rightCameraHelper = new CameraHelper(this.#stereoScreenCamera.right);
 
		this.#leftCameraHelper.setColors(color, color, color, color, color);
		this.#rightCameraHelper.setColors(color, color, color, color, color);

		this.add(this.#leftCameraHelper, this.#rightCameraHelper);
	}

	update ( ) {
		this.#leftCameraHelper.update();
		this.#rightCameraHelper.update();
	}

	setLayer ( layer ) {
		this.layers.set(layer);
		this.#leftCameraHelper.layers.set(layer);
		this.#rightCameraHelper.layers.set(layer);
	}
}