import * as THREE from "../three/three.module.js";
import { Vector3, Quaternion, Matrix4 } from "../three/three.module.js";

export default class StereoScreenCamera {
	#screen;

	#eyeSeparation = 0.064;

	#left = new THREE.PerspectiveCamera();
	#right = new THREE.PerspectiveCamera();

	#leftEye = new THREE.Vector3();
	#rightEye = new THREE.Vector3();
	/// Screen Space Axes
	#ssX = new THREE.Vector3();
	#ssY = new THREE.Vector3();
	#ssZ = new THREE.Vector3();
	#ssRotation = new THREE.Matrix4();


	constructor ( screen ) {
		this.#screen = screen;
		this.#left.matrixAutoUpdate = false;
		this.#left.layers.enable(1);
		this.#right.matrixAutoUpdate = false;
		this.#right.layers.enable(2);
		this.#computeScreenSpace();
	}

	get left ( ) {
		return this.#left;
	}

	get right ( ) {
		return this.#right;
	}

	get leftEye ( ) {
		return this.#leftEye;
	}

	get rightEye ( ) {
		return this.#rightEye;
	}
	
	get eyeSeperation ( ) {
		return this.#eyeSeparation;
	} 

	set eyeSeperation ( dist ) {
		this.#eyeSeparation = dist;
	}

	update ( headMatrix ) {
		const leftEye = new THREE.Vector3(-this.#eyeSeparation / 2, 0.0, -0.015);
		const rightEye = new THREE.Vector3(this.#eyeSeparation / 2, 0.0, -0.015);

		leftEye.applyMatrix4(headMatrix);
		rightEye.applyMatrix4(headMatrix);
		this.#leftEye.copy(leftEye);
		this.#rightEye.copy(rightEye);

		const leftMatrices = this.#eyeMatrices(leftEye);
		const rightMatrices = this.#eyeMatrices(rightEye);

		this.#left.matrixWorldInverse.copy(leftMatrices.view);
		this.#left.matrixWorld.copy(leftMatrices.view.clone().invert());
		this.#left.projectionMatrix.copy(leftMatrices.projection);
		this.#left.projectionMatrixInverse.copy(leftMatrices.projection.clone().invert() );
		// this.#left.updateProjectionMatrix = false;
		
		this.#right.matrixWorldInverse.copy(rightMatrices.view);
		this.#right.matrixWorld.copy(rightMatrices.view.clone().invert());
		this.#right.projectionMatrix.copy(rightMatrices.projection);
		this.#right.projectionMatrixInverse.copy(rightMatrices.projection.clone().invert() );
		// this.#right.updateProjectionMatrix = false;
	}

	#computeScreenSpace ( ) {
		const corners = this.#screen.corners;
		this.#ssX.copy(corners[1]).sub(corners[0]).normalize(); 
		this.#ssY.copy(corners[2]).sub(corners[0]).normalize(); 
		this.#ssZ.crossVectors(this.#ssX, this.#ssY).normalize(); 

		this.#ssRotation.set(
			this.#ssX.x, this.#ssX.y, this.#ssX.z, 0.0,
			this.#ssY.x, this.#ssY.y, this.#ssY.z, 0.0,
			this.#ssZ.x, this.#ssZ.y, this.#ssZ.z, 0.0,
			0.0, 0.0, 0.0, 1.0
		);
	}

	#eyeMatrices ( eye ) {
		const projection = new Matrix4();
		const view = new Matrix4();

		const corners = this.#screen.corners;

		const eye0 = corners[0].clone().sub(eye);
		const eye1 = corners[1].clone().sub(eye);
		const eye2 = corners[2].clone().sub(eye);

		const dist = - eye0.dot(this.#ssZ);

		const nearCP = 0.1;
		const farCP = 50.0;
		// const farCP = dist;
		const ND = nearCP / dist;

		const l = this.#ssX.dot(eye0) * ND;
		const r = this.#ssX.dot(eye1) * ND;
		const b = this.#ssY.dot(eye0) * ND;
		const t = this.#ssY.dot(eye2) * ND;

		projection.set(
			(2.0 * nearCP) / (r - l), 0.0, (r + l) / (r - l), 0.0,
			0.0, (2.0 * nearCP) / (t - b), (t + b) / (t - b), 0.0, 
			0.0, 0.0, -(farCP + nearCP) / (farCP - nearCP), -(2.0 * farCP * nearCP) / (farCP - nearCP),
			0.0, 0.0, -1.0, 0.0
		);

		const E = new Matrix4().makeTranslation(-eye.x, -eye.y, -eye.z);

		view.multiplyMatrices(this.#ssRotation, E);

		return {projection, view};
	}
}