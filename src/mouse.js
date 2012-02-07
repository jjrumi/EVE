/**
 * Mouse.
 */
var Mouse = function()
{
	this.mouseDown	= false;
};

Mouse.prototype.handleMouseDown = function( eEvent )
{
	this.mouseDown = true;
	scene.aParticles.push( new Particle( eEvent.clientX, eEvent.clientY ) );
	console.log( 'Particle #' + scene.aParticles.length + ' on (' + eEvent.clientX + ',' + eEvent.clientY + ')' );
};

Mouse.prototype.handleMouseUp = function()
{
	this.mouseDown = false;
};