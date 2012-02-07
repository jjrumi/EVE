/**
 * Particle object.
 */

/**
 * Constructor.
 */
var Particle = function( screenX, screenY )
{
	this.screenX = screenX;
	this.screenY = screenY;

	this.ox = 0.0;
	this.oy = 0.0;
	this.oz = -30.0;

	this.depth = 30.0;
};

/**
 * Draw particle.
 *
 * Perform screen to world coordinates transformation.
 */
Particle.prototype.draw = function( index )
{
	scene.mvPushMatrix();

	// Transformation matrix from [-1,1] to [0,width or height] (i.e. from unit to screen measures).
	var tUnit2ScreenMatrix = [
		scene.oGLContext.viewportWidth/2,	0.0,								0.0, 0.0,
		0.0,								scene.oGLContext.viewportHeight/2,	0.0, 0.0,
		0.0,								0.0,								1.0, 0.0,
		scene.oGLContext.viewportWidth/2,	scene.oGLContext.viewportHeight/2,	0.0, 1.0
	];

	// Compute inverse matrices.
	var itUnit2ScreenMatrix = [];
	var iPMatrix = [];
	mat4.inverse( tUnit2ScreenMatrix, itUnit2ScreenMatrix );
	mat4.inverse( scene.getProjectionMatrix(), iPMatrix );

	// Screen coordinates.
	var screenPoint = [
		this.screenX,
		this.screenY,
		this.oz,
		1
	];

	// Transform screen point to unit coordinates.
	var unitPoint = [];
	mat4.multiplyVec4( itUnit2ScreenMatrix, screenPoint, unitPoint );

	// Revert clip space coordinates. The weight in this case is actually the depth (Z) where we are rendering the particles.
	var localPoint = [
		unitPoint[0] * this.depth,
		unitPoint[1] * this.depth * -1,	// Invert OY direction.
		unitPoint[2] * this.depth,
		1
	];

	// transform local point coordinates to world coordinates using the projection matrix.
	var worldPoint = [];
	mat4.multiplyVec4( iPMatrix, localPoint, worldPoint );

	// Set particle position.
	this.ox = worldPoint[0];
	this.oy = worldPoint[1];

	// Move to the particle position
	mat4.translate( scene.getMVMatrix(), [this.ox, this.oy, this.oz] );

	scene.oGLContext.bindBuffer( scene.oGLContext.ARRAY_BUFFER, scene.getParticleVertexPositionBuffer() );
	scene.oGLContext.vertexAttribPointer( scene.getShaderProgram().vertexPositionAttribute, scene.getParticleVertexPositionBuffer().itemSize, scene.oGLContext.FLOAT, false, 0, 0 );
	scene.setMatrixUniforms();
	scene.oGLContext.drawArrays( scene.oGLContext.TRIANGLE_STRIP, 0, scene.getParticleVertexPositionBuffer().numItems );

	scene.mvPopMatrix();
};
