export default class ScreenWindow {
	#window;
	#canvas;

	#callbackFuncs

	constructor ( callbackFuncs ) {
		this.#callbackFuncs = callbackFuncs;
	}

	#onLoad ( ) {
		this.#canvas = this.#window.document.createElement('canvas');
		this.#window.document.body.appendChild(this.#canvas);
		this.#canvas.width = this.#window.innerWidth;
		this.#canvas.height = this.#window.innerHeight;

		this.#callbackFuncs.onLoad?.();
	}   

	#onResize ( ) {

		this.#callbackFuncs.onResize?.();
	}

	#onMouseUp ( ) {

		this.#callbackFuncs.onMouseUp?.();
	}

	open ( ) {
		this.#window = window.open(`./Cave/screen.html`, "", "width=800, height=500");
		this.#window.addEventListener("load", this.#onLoad.bind( this ));
		this.#window.addEventListener("resize", this.#onResize.bind( this ));
		this.#window.addEventListener("mouseup", this.#onMouseUp.bind( this ));
	}

	setOnMouseDown ( onMouseDown ) {
		this.#window.addEventListener("mousedown", (event) => {
			onMouseDown(event.x, event.y, event.buttons);
		});
	} 

	close ( ) {
		this.#window.close();
	}

	get canvas ( ) {
		return this.#canvas;
	}

	get width ( ) {
		return this.#window.innerWidth;
	}

	get height ( ) {
		return this.#window.innerHeight;
	}

	get body ( ) {
		return this.#window.document.body;
	}
}