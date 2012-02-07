/**
 * Anonymous function to define the basic objects of a scene.
 */
(function (window)
{
	/**
	 * Scene properties like projection, particles and time counter.
	 */
	var oSceneProps = {
		nFov			: 45,
		nNear			: 0.1,
		nFar			: 100,
		nAspectRatio	: 1,
		nLastTime		: 0
	};

	/**
	 * WebGL object.
	 */
	var oGL = {
		oContext		: false,	// WebGL context.
		aParticleVertexPositionBuffer : false,
		oShaderProgram	: false,

		aMVMatrix	: mat4.create(),	// Init Model View Matrix to all zeros.
		aPMatrix	: mat4.create(),	// Init Projection Matrix to all zeros.
		aMVMatrixStack	: [],

		/**
		 * Initialize WebGL context.
		 *
		 * @param canvas [string] Canvas element ID.
		 * @return null|object WebGLRenderingContext object.
		 * @see http://www.khronos.org/webgl/wiki/FAQ
		 */
		initWebGL : function( canvas )
		{
			// Initialize WebGL rendering context.
			this.oContext = WebGLUtils.setupWebGL( canvas );
			if ( !this.oContext )
			{
				alert( "Could not initialise WebGL, sorry :-(" );
				console.log( "ERROR: Could not initialise WebGL." );
				return null;
			}

			// Set up viewport size and aspect ratio.
			this.oContext.viewportWidth		= canvas.width;
			this.oContext.viewportHeight	= canvas.height;
			oSceneProps.nAspectRatio		= ( this.oContext.viewportWidth / this.oContext.viewportHeight );

			this.initShaders();
			this.initBuffers();

			// Init WebGL background color and depth test.
			this.oContext.clearColor( 0.0, 0.0, 0.0, 1.0 );
			this.oContext.enable( this.oContext.DEPTH_TEST );

			return this.oContext;
		},

		/**
		 *
		 */
		initShaders : function()
		{
			var oFragmentShader	= this.getShaderById( "shader-fs" );
			var oVertexShader	= this.getShaderById( "shader-vs" );

			this.oShaderProgram	= this.oContext.createProgram();
			this.oContext.attachShader( this.oShaderProgram, oVertexShader );
			this.oContext.attachShader( this.oShaderProgram, oFragmentShader );
			this.oContext.linkProgram( this.oShaderProgram) ;

			if ( !this.oContext.getProgramParameter( this.oShaderProgram, this.oContext.LINK_STATUS ) )
			{
				alert("Could not initialise shaders");
			}

			this.oContext.useProgram( this.oShaderProgram );

			this.oShaderProgram.vertexPositionAttribute = this.oContext.getAttribLocation( this.oShaderProgram, "aVertexPosition" );
			this.oContext.enableVertexAttribArray( this.oShaderProgram.vertexPositionAttribute );

			this.oShaderProgram.pMatrixUniform	= this.oContext.getUniformLocation( this.oShaderProgram, "uPMatrix" );
			this.oShaderProgram.mvMatrixUniform	= this.oContext.getUniformLocation( this.oShaderProgram, "uMVMatrix" );
		},

		/**
		 * Helper to retrieve shader by element ID.
		 *
		 * @param id [string] Shader code ID.
		 * @return null|object Shader object.
		 */
		getShaderById : function( id )
		{
			var shaderScript = document.getElementById(id);
			if ( !shaderScript )
			{
				return null;
			}

			var str = "";
			var k = shaderScript.firstChild;
			while ( k )
			{
				if ( k.nodeType == 3 )
				{
					str += k.textContent;
				}
				k = k.nextSibling;
			}

			var oShader;
			if ( shaderScript.type == "x-shader/x-fragment" )
			{
				oShader = this.oContext.createShader( this.oContext.FRAGMENT_SHADER );
			}
			else if ( shaderScript.type == "x-shader/x-vertex" )
			{
				oShader = this.oContext.createShader( this.oContext.VERTEX_SHADER );
			}
			else
			{
				return null;
			}

			this.oContext.shaderSource( oShader, str );
			this.oContext.compileShader( oShader );

			if ( !this.oContext.getShaderParameter( oShader, this.oContext.COMPILE_STATUS ) )
			{
				alert( this.oContext.getShaderInfoLog( oShader ) );
				return null;
			}

			return oShader;
		},

		/**
		 * Each buffer is actually a bit of memory on the graphics card.
		 */
		initBuffers : function()
		{
			// Reserve GFX memory for the particle renderization.
			this.aParticleVertexPositionBuffer = this.oContext.createBuffer();
			this.oContext.bindBuffer(this.oContext.ARRAY_BUFFER, this.aParticleVertexPositionBuffer);
			var aVertices = [
				 1.0,  1.0,  0.0,
				-1.0,  1.0,  0.0,
				 1.0, -1.0,  0.0,
				-1.0, -1.0,  0.0
			];
			this.oContext.bufferData(this.oContext.ARRAY_BUFFER, new Float32Array(aVertices), this.oContext.STATIC_DRAW);
			this.aParticleVertexPositionBuffer.itemSize = 3;
			this.aParticleVertexPositionBuffer.numItems = 4;
		},

		/**
		 * Clean up scene context before drawing again.
		 */
		cleanUpScene : function()
		{
			this.oContext.viewport( 0, 0, this.oContext.viewportWidth, this.oContext.viewportHeight );
			this.oContext.clear( this.oContext.COLOR_BUFFER_BIT | this.oContext.DEPTH_BUFFER_BIT );
			mat4.perspective(
				oSceneProps.nFov,			// Field of view of 45º.
				oSceneProps.nAspectRatio,	// width/height ratio.
				oSceneProps.nNear,			// Nearest limit.
				oSceneProps.nFar,			// Farest limit.
				this.aPMatrix
			);
			mat4.identity( this.aMVMatrix );
			mat4.translate( this.aMVMatrix, [0.0, 0.0, 0.0] );
		},
		
		mvPushMatrix : function()
		{
			var copy = mat4.create();
			mat4.set( this.aMVMatrix, copy );
			this.aMVMatrixStack.push( copy );
		},

		mvPopMatrix : function()
		{
			if ( this.aMVMatrixStack.length == 0 )
			{
				throw "Invalid popMatrix!";
			}
			this.aMVMatrix = this.aMVMatrixStack.pop();
		}
	};

	/**
	 * Public object SCENE. It will be accessible from everywhere.
	 *
	 * To initialize a scene:
	 *		scene.initScene( document.getElementById( "canvas_id" ) );
	 *
	 * @see libs/webglUtils.js for WebGL initialization.
	 * @see libs/glMatrix.js for Matrix and Vector operations.
	 */
	window.scene = {
		oGLContext	: false,
		oMouse		: false,
		aParticles	: [],

		/**
		 * Setup scene by:
		 *	- Initialize WebGL.
		 *	- Setup event handlers.
		 *	- Start scene main loop.
		 *
		 *	@param canvas [element] The canvas element.
		 */
		initScene : function( canvas )
		{
			this.oGLContext = oGL.initWebGL( canvas );

			// Event handlers.
			this.oMouse = new Mouse();
			canvas.onmousedown = this.oMouse.handleMouseDown;
			document.onmouseup = this.oMouse.handleMouseUp;

			this.tick();
		},

		mvPushMatrix : function()
		{
			oGL.mvPushMatrix();
		},

		mvPopMatrix : function()
		{
			oGL.mvPopMatrix();
		},

		setMatrixUniforms : function()
		{
			this.oGLContext.uniformMatrix4fv( oGL.oShaderProgram.pMatrixUniform, false, oGL.aPMatrix );
			this.oGLContext.uniformMatrix4fv( oGL.oShaderProgram.mvMatrixUniform, false, oGL.aMVMatrix );
		},

		/**
		 * Main loop callback method.
		 *
		 * Cross-Browser and improved setInterval alternative.
		 */
		tick : function()
		{
			window.requestAnimFrame( scene.tick );
			scene.drawScene();
		},

		/**
		 * The scene is drawn here.
		 */
		drawScene : function()
		{
			oGL.cleanUpScene();

			// Draw all the registered particles.
			for ( var i in scene.aParticles )
			{
				scene.aParticles[i].draw( i );
			}
		},

		getShaderProgram : function()
		{
			return oGL.oShaderProgram;
		},

		getParticleVertexPositionBuffer : function()
		{
			return oGL.aParticleVertexPositionBuffer;
		},
		
		getProjectionMatrix : function()
		{
			return oGL.aPMatrix;
		},
		
		getMVMatrix : function()
		{
			return oGL.aMVMatrix;
		}
	};
}
(window));