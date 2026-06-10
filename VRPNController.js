import * as THREE from "./three/three.module.js";

const OFFSET_QUATERNION = new THREE.Quaternion();
OFFSET_QUATERNION.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2))

const LEFT = "left";
const RIGHT = "right";

const JCBUTTONS = {
    0: "right",
    1: "down",
    2: "up",
    3: "left",
    6: "alt",
    7: "trigger",
    10: "mode",    
}

export default class VRPNController {
	#socket 
	
	#head = {
		position: new THREE.Vector3( 0, 0, 1.8 ),
		rotation: new THREE.Quaternion().copy( OFFSET_QUATERNION )
	};

    #hands = {
        left: {
            position: new THREE.Vector3( 0, 0, 1.8 ),
		    rotation: new THREE.Quaternion(),
        },
        right: {
            position: new THREE.Vector3( 0, 0, 1.8 ),
		    rotation: new THREE.Quaternion(),
        }
    }

    #callbacks;

	constructor ( callbacks ) {
		console.log( `VRPNController - constructor` );

        this.#callbacks = callbacks;
	}

    connect(url = "ws://localhost:8000") {
        this.#socket = new WebSocket(url);
        
        this.#socket.addEventListener("error", (e) => {
            console.warn("VRPN non disponible — trackers désactivés");
        });
        
        this.#socket.addEventListener("message", this.#handleMessage.bind(this));
    }
	#handleMessage ( message ) {
		const data = message.data;
        const dataArray = data.split( " " );
        const type =  dataArray.shift();

        switch ( type ) {
            case "HMD":
                this.#handleHMD(dataArray);
                break;    
            case "JCLB":
                this.#handleJCB(LEFT, dataArray);
                break;
            case "JCRB":
                this.#handleJCB(RIGHT, dataArray);
                break;
            case "JCLS":
                this.#handleJCS(LEFT, dataArray);
                break;
            case "JCRS":
                this.#handleJCS(RIGHT, dataArray);
                break;
            case "LeftController":
                this.#handleJC(LEFT, dataArray);
                break;
            case "RightController":
                this.#handleJC(RIGHT, dataArray);
                break;
            default:
                console.log(type);
                break;
        }
	}

    #handleHMD ( dataArray ) {
        const transforms = dataArray.map(x => parseFloat(x));
		this.#head.position.fromArray( transforms, 0 );
		this.#head.rotation.fromArray( transforms, 3 );
		this.#head.rotation.multiply( OFFSET_QUATERNION );
        this.#callbacks.head.move?.(this.#head.position, this.#head.rotation)
    }

    #handleJCB ( hand, dataArray ) {
        const button = dataArray[0];
        const state = dataArray[1];
        console.log(hand, button, state);
        this.#callbacks.hands[hand][JCBUTTONS[button]]?.(parseInt(state));
    }

    #handleJCS ( hand, dataArray ) {
        this.#callbacks.hands[hand].stick?.(dataArray.map(x => parseFloat(x)));

    }

    #handleJC ( hand, dataArray ) {
        const transforms = dataArray.map(x => parseFloat(x));
		this.#hands[hand].position.fromArray( transforms, 0 );
		this.#hands[hand].rotation.fromArray( transforms, 3 );
        this.#callbacks.hands[hand].move?.(this.#hands[hand].position, this.#hands[hand].rotation)
    }

	get head ( ) {
		return {
			position: this.#head.position.clone(),
			rotation: this.#head.rotation.clone(),
		}
	}

    get leftHand ( ) {
        return {
			position: this.#hands.left.position.clone(),
			rotation: this.#hands.left.rotation.clone(),
		}
    }

    get rightHand ( ) {
        return {
			position: this.#hands.right.position.clone(),
			rotation: this.#hands.right.rotation.clone(),
		}
    }
}