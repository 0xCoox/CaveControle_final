import * as THREE from "./three/three.module.js";
import { OrbitControls } from "./three/controls/OrbitControls.js";
import { PLYLoader } from "./three/loaders/PLYLoader.js";
import ScreenWindow from "./Cave/ScreenWindow.js";
import ClientNetwork from "./ClientNetwork.js"; // 1. L'import est parfait ici tout en haut

export default class MultiScreenViewer {
    #worker;
    #camera;
    #caveWindow;
    #reseauCave; // 2. On déclare une variable privée pour stocker le réseau

    constructor ( ) {
        console.log( `MultiScreenViewer - constructor` );

        window.addEventListener( "beforeunload", this.#beforeUnload.bind( this ) );
        
        this.#worker = new Worker( "./renderWorker.js", { type: "module" } );
        this.#worker.addEventListener( "error", ( event ) => { console.log( "worker error", event ); });
    
        this.#initializeMainWindow( );

       // this.#initializeCaveWindow( );

        // 3. On appelle la configuration réseau une fois que tout le reste est prêt
        this.#initializeNetwork( );
    }

    // 4. Nouvelle méthode dédiée au réseau, bien rangée dans la classe
    #initializeNetwork( ) {
        this.#reseauCave = new ClientNetwork();

        this.#reseauCave.setCallbacks({
            onOpen: () => {
                console.log("CAVE connecté au serveur Node !");
                
                // On s'identifie auprès du serveur (Instance CAVE)
                this.#reseauCave.send(JSON.stringify({
                    scope: "IDENTIFY",
                    UUID: "00000000-0000-0000-0000-000000000000"
                }));
            },
onMessage: (messageBrut) => {
                // console.log("📥 [RÉSEAU CAVE] Message reçu :", messageBrut); // Tu peux commenter ça pour éviter le spam dans la console

                try {
                    // 1. Détection rapide
                    if (messageBrut.includes("flipEyes")) {
                        this.#worker.postMessage({ type: "flipEyes" });
                        return;
                    }

                    // 2. Décodage du message principal
                    const message = JSON.parse(messageBrut);

                    if (message.payload && message.payload.command === "INSTANCE_LIST") {
                        console.log(`⚙️ Exécution de la commande : INSTANCE_LIST`);
                        return;
                    }

                    // 🌟 LE DÉCODEUR : Si le payload est du texte
                    if (typeof message.payload === "string") {
                        const contenuInterne = JSON.parse(message.payload); 
                        
                        if (contenuInterne.payload && contenuInterne.payload.command === "changeMesh") {
                            const fileName = contenuInterne.payload.data.fileName;
                            this.#worker.postMessage({ type: "loadMeshFile", fileName: fileName });
                        }
                        else if (contenuInterne.payload && contenuInterne.payload.command === "changePointSize") {
                            const newSize = contenuInterne.payload.data.size;
                            this.#worker.postMessage({ type: "changePointSize", size: newSize });
                        }
                        else if (contenuInterne.payload && contenuInterne.payload.command === "changeClippingHeight") {
                            const newHeight = contenuInterne.payload.data.height;
                            this.#worker.postMessage({ type: "changeClippingHeight", height: newHeight });
                        }
                        // 🕹️ Joystick 2D (Face X/Y)
                        else if (contenuInterne.payload && contenuInterne.payload.command === "moveTree") {
                            const dirX = contenuInterne.payload.data.dirX;
                            const dirY = contenuInterne.payload.data.dirY;
                            this.#worker.postMessage({ type: "moveTree", dirX: dirX, dirY: dirY });
                        }
                        // 🚀 Joystick 1D (Profondeur Z)
                        else if (contenuInterne.payload && contenuInterne.payload.command === "moveTreeDepth") {
                            const dirZ = contenuInterne.payload.data.dirZ;
                            this.#worker.postMessage({ type: "moveTreeDepth", dirZ: dirZ });
                        }
                    }

                } catch (e) {
                    console.error("Erreur de décodage réseau CAVE :", e);
                }
            }
        });
        // Connexion au serveur local (localhost)
        this.#reseauCave.connect("ws://localhost", "3000");
    }

    #initializeMainWindow ( ) {
        const canvas = document.createElement( "canvas" );
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild( canvas );

        const offScreenCanvas = canvas.transferControlToOffscreen( );
        this.#worker.postMessage({ type: "monitorCanvas", canvas: offScreenCanvas }, [offScreenCanvas] );

        const worldUp = new THREE.Vector3(0, 0, 1);
        this.#camera = new THREE.PerspectiveCamera( 70, 800/600, 0.1, 1 );
        this.#camera.up.copy(worldUp);
        this.#camera.position.set( -2, -4, 3 );
        this.#camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.#camera.updateMatrixWorld()

        this.#worker.postMessage({ type: "monitorCamera", position: this.#camera.position.toArray(), quaternion: this.#camera.quaternion.toArray()});

        const controls = new OrbitControls(this.#camera, canvas);
        controls.addEventListener("change", () => {
            this.#worker.postMessage({ type: "monitorCamera", position: this.#camera.position.toArray(), quaternion: this.#camera.quaternion.toArray()});
        })
    }

    #initializeCaveWindow ( ) {
        this.#caveWindow = new ScreenWindow({
            onLoad: ( ) => {
                console.log(this.#caveWindow.canvas)
                const offScreenCanvas = this.#caveWindow.canvas.transferControlToOffscreen( );
                this.#worker.postMessage({ type: "caveCanvas", canvas: offScreenCanvas }, [offScreenCanvas] );
            },
            onResize: ( ) => {
                this.#worker.postMessage({ type: "caveCanvasResize", width: this.#caveWindow.width, height: this.#caveWindow.height } );
            },
            onMouseUp: ( ) => {
                console.log("clicked")
                this.#worker.postMessage({ type: "flipEyes" } );
            }
        });
        this.#caveWindow.open();
    }

    #beforeUnload ( ) {
        this.#caveWindow.close();
    }
}