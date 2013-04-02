/*!
 * forkit.js 0.2
 * http://lab.hakim.se/forkit-js
 * MIT licensed
 *
 * Created by Hakim El Hattab, http://hakim.se
 */
(function(){

	var STATE_CLOSED = 0,
		STATE_DETACHED = 1,
		STATE_OPENED = 2,

		TAG_HEIGHT = 30,
		TAG_WIDTH = 200,
		MAX_STRAIN = 40,
		OPEN_LENGTH = 200,  //make this undefined for full length page drop
		// Factor of page height that needs to be dragged for the
		// curtain to fall
		DRAG_THRESHOLD = 0.1;
		VENDORS = [ 'Webkit', 'Moz', 'O', 'ms' ];
		snapRight = 0;
		ribbonDisabled = true;
		
	var dom = {
			ribbon: null,
			ribbonString: null,
			ribbonTag: null,
			curtain: null,
			closeButton: null
		},

		// The current state of the ribbon
		state = STATE_CLOSED,

		// Ribbon text, correlates to states
		closedText = '',
		detachedText = '',
		openedText = '',

		friction = 1.04;
		gravity = 1.5,

		// Resting position of the ribbon when curtain is closed
		closedX = TAG_WIDTH * 0.4,
		closedY = -TAG_HEIGHT * 0.5,

		// Resting position of the ribbon when curtain is opened
		openedX = TAG_WIDTH * 0.4,
		openedY = TAG_HEIGHT,


		velocity = 0,
		rotation = 45,

		curtainTargetY = 0,
		curtainCurrentY = 0,

		dragging = false,
		dragTime = 0,
		dragY = 0,

		anchorA = new Point( closedX, closedY ),
		anchorB = new Point( closedX, closedY ),
		mouse = new Point();

	function initialize() {
		dom.ribbon = document.querySelector( '.forkit' );
		dom.curtain = document.querySelector( '.forkit-curtain' );
		dom.closeButton = document.querySelector( '.forkit-curtain #wrapper .close-button' );

		if( dom.ribbon ) {
			
			// Fetch label texts from DOM
			closedText = dom.ribbon.getAttribute( 'data-text' ) || '';
			detachedText = dom.ribbon.getAttribute( 'data-text-detached' ) || closedText;
			openedText = dom.ribbon.getAttribute( 'data-text-opened' ) || closedText;

			// Construct the sub-elements required to represent the
			// tag and string that it hangs from
									
			if(snapRight == 1){
				dom.ribbon.style.right = 0;
				dom.ribbon.innerHTML = '<span class="string"></span><span class="tag"><div class="textBit">' + closedText + '</span></span>';
			}
			if(snapRight == 0){
				dom.ribbon.style.left = 0;
				dom.ribbon.style.marginLeft = "20px";
				dom.ribbon.id = "left";
				dom.ribbon.innerHTML = '<span class="string"></span><span class="tag" ><div class="textBit" id="left">' + closedText + '</span></span>';

			}
						dom.ribbonString = dom.ribbon.querySelector( '.string' );
			dom.ribbonTag = dom.ribbon.querySelector( '.tag' );
			if(snapRight == 0){dom.ribbonTag.style.marginTop = "10px";}
			if(ribbonDisabled == false){
				dom.ribbonTagText = dom.ribbonTag.querySelector('.textBit');
				// Bind events
				dom.ribbon.addEventListener( 'click', onRibbonClick, false );
				document.addEventListener( 'mousemove', onMouseMove, false );
				document.addEventListener( 'mousedown', onMouseDown, false );
				document.addEventListener( 'mouseup', onMouseUp, false );
				document.addEventListener( 'touchstart', onTouchStart, false);
				document.addEventListener( 'touchmove', onTouchMove, false);
				document.addEventListener( 'touchend', onTouchEnd, false);
				window.addEventListener( 'resize', layout, false );
	
				if( dom.closeButton ) {
					//console.log("closer Found");
					dom.closeButton.addEventListener( 'click', onCloseClick, false );
				}
			}
			// Start the animation loop
			animate();

		}

	}

	function onMouseDown( event ) {
		if( dom.curtain && state === STATE_DETACHED ) {
			event.preventDefault();
			dragY = event.clientY;
			dragTime = Date.now();
			dragging = true;

		}
	}

	function onMouseMove( event ) {
		mouse.x = event.clientX;
		mouse.y = event.clientY;
	}

	function onMouseUp( event ) {
		if( state !== STATE_OPENED ) {
			state = STATE_CLOSED;
			dragging = false;
		}
	}

	function onTouchStart( event ) {
		if( dom.curtain && state === STATE_DETACHED ) {
			event.preventDefault();
			var touch = event.touches[0];
			dragY = touch.clientY;
			dragTime = Date.now();
			dragging = true;
		}
	}

	function onTouchMove( event ) {
		var touch = event.touches[0];
		mouse.x = touch.pageX;
		mouse.y = touch.pageY;
	}

	function onTouchEnd( event ) {
		if( state !== STATE_OPENED ) {
			state = STATE_CLOSED;
			dragging = false;
		}
	}

	function onRibbonClick( event ) {
		//console.log(event);
		if( dom.curtain ) {
			event.preventDefault();

			if( state === STATE_OPENED ) {
				close();
			}
			else if( Date.now() - dragTime < 300 ) {
				open();
			}
		}
	}

	function onCloseClick( event ) {
		//console.log(event);
		event.preventDefault();
		close();
	}

	function layout() {
		if( state === STATE_OPENED ) {
			curtainTargetY = window.innerHeight;
			curtainCurrentY = curtainTargetY;
		}
	}

	function open() {
		dragging = false;
		state = STATE_OPENED;
	}

	function close() {
		dragging = false;
		state = STATE_CLOSED;
		dom.ribbonTagText.innerHTML = closedText;
	}

	function detach() {
		state = STATE_DETACHED;
		dom.ribbonTagText.innerHTML = detachedText;
	}

	function animate() {
		update();
		if(OPEN_LENGTH != undefined && curtainCurrentY >= OPEN_LENGTH){
			//console.log("OPENLENGTHLIMIT");
			curtainCurrentY = OPEN_LENGTH;
		}
		render();
		
		requestAnimFrame( animate );
	}

	function update() {
		
		// Distance between mouse and top right corner
		if(snapRight == 1){
			var leftOrRight = window.innerWidth;		
		}
		else{
			var leftOrRight = 0;	
		}
		var distance = distanceBetween( mouse.x, mouse.y,leftOrRight, 0 );

		// If we're OPENED the curtainTargetY should ease towards page bottom
		if( state === STATE_OPENED ) {
				////console.log(curtainTargetY);
				//console.log(OPEN_LENGTH == undefined);
			if(OPEN_LENGTH == undefined){
				//console.log("open undefined");
			curtainTargetY = Math.min( curtainTargetY + ( window.innerHeight - curtainTargetY ) * 0.2, window.innerHeight );
			}
			else if (OPEN_LENGTH != undefined && curtainTargetY < OPEN_LENGTH){
				//console.log("open defined");
			curtainTargetY = Math.min( curtainTargetY + ( window.innerHeight - curtainTargetY ) * 0.2, OPEN_LENGTH );
			}
			
			else if(curtainTargetY >= OPEN_LENGTH){
			dom.ribbonTagText.innerHTML = openedText;
			}
		}
		else {

			// Detach the tag when hovering close enough
			if( distance < TAG_WIDTH * 1.5 && distance != 0 ) {
				detach();
			}
			// Re-attach the tag if the user moved away
			else if( !dragging && state === STATE_DETACHED && distance > TAG_WIDTH * 2 ) {
				close();
			}

			if( dragging ) {
				// Updat the curtain position while dragging
				curtainTargetY = Math.max( mouse.y - dragY, 0 );

				// If the threshold is crossed, open the curtain
				if( curtainTargetY > window.innerHeight * DRAG_THRESHOLD ) {
					open();
				}
			}
			else {
				curtainTargetY *= 0.8;
			}

		}

		// Ease towards the target position of the curtain
		curtainCurrentY += ( curtainTargetY - curtainCurrentY ) * 0.3;

		// If we're dragging or detached we need to simulate
		// the physical behavior of the ribbon
		if( dragging || state === STATE_DETACHED ) {

			// Apply forces
			velocity /= friction;
			velocity += gravity;

			var containerOffsetX = dom.ribbon.offsetLeft;
			var offsetX = Math.max( ( ( mouse.x - containerOffsetX ) - closedX ) * 0.2, -MAX_STRAIN );
		offsetX = 0;
			anchorB.x += ( ( closedX + offsetX ) - anchorB.x ) * 0.1;
			anchorB.y += velocity;

			var strain = distanceBetween( anchorA.x, anchorA.y, anchorB.x, anchorB.y );

			if( strain > MAX_STRAIN ) {
				velocity -= Math.abs( strain ) / ( MAX_STRAIN * 1.25 );
			}

			var dy = Math.max( mouse.y - anchorB.y, 0 ),
				dx = mouse.x - ( containerOffsetX + anchorB.x );

			// Angle the ribbon towards the mouse but limit it avoid extremes
			var angle = Math.min( 130, Math.max( 50, Math.atan2( dy, dx ) * 180 / Math.PI ) );

			rotation += ( angle - rotation ) * 0.1;
		}
		// Ease ribbon towards the OPENED state
		else if( state === STATE_OPENED ) {
			anchorB.x += ( openedX - anchorB.x ) * 0.2;
			anchorB.y += ( openedY - anchorB.y ) * 0.2;

			rotation += ( 90 - rotation ) * 0.02;

		}
		// Ease ribbon towards the CLOSED state
		else {
			anchorB.x += ( anchorA.x - anchorB.x ) * 0.2;
			anchorB.y += ( anchorA.y - anchorB.y ) * 0.2;
			if(snapRight == 0){
			rotation += ( 130 - rotation ) * 0.2;
			}
			if(snapRight == 1){
				rotation += ( 45 - rotation ) * 0.2;
			}
//			rotation += rotation * 0.2;
		}
	}

	function render() {

		if( dom.curtain ) {
			dom.curtain.style.top = - 100 + Math.min( ( curtainCurrentY / window.innerHeight ) * 100, 100 ) + '%';
		}

		dom.ribbon.style[ prefix( 'transform' ) ] = transform( 0, curtainCurrentY, 0 );
		dom.ribbonTag.style[ prefix( 'transform' ) ] = transform(anchorB.x, anchorB.y, rotation );//rotation

		var dy = anchorB.y - anchorA.y,
			dx = anchorB.x - anchorA.x;

		var angle = Math.atan2( dy, dx ) * 180 / Math.PI;

		dom.ribbonString.style.width = anchorB.y + 'px';
		dom.ribbonString.style[ prefix( 'transform' ) ] = transform( anchorA.x, 0, angle );

	}

	function prefix( property, el ) {
		var propertyUC = property.slice( 0, 1 ).toUpperCase() + property.slice( 1 );

		for( var i = 0, len = VENDORS.length; i < len; i++ ) {
			var vendor = VENDORS[i];

			if( typeof ( el || document.body ).style[ vendor + propertyUC ] !== 'undefined' ) {
				return vendor + propertyUC;
			}
		}

		return property;
	}

	function transform( x, y, r ) {
		return 'translate('+x+'px,'+y+'px) rotate('+r+'deg)';
	}

	function distanceBetween( x1, y1, x2, y2 ) {
		var dx = x1-x2;
		var dy = y1-y2;
		return Math.sqrt(dx*dx + dy*dy);
	}

	/**
	 * Defines a 2D position.
	 */
	function Point( x, y ) {
		this.x = x || 0;
		this.y = y || 0;
	}

	Point.prototype.distanceTo = function( x, y ) {
		var dx = x-this.x;
		var dy = y-this.y;
		return Math.sqrt(dx*dx + dy*dy);
	};

	Point.prototype.clone = function() {
		return new Point( this.x, this.y );
	};

	Point.prototype.interpolate = function( x, y, amp ) {
		this.x += ( x - this.x ) * amp;
		this.y += ( y - this.y ) * amp;
	};

	window.requestAnimFrame = (function(){
		return  window.requestAnimationFrame 		||
				window.webkitRequestAnimationFrame	||
				window.mozRequestAnimationFrame		||
				window.oRequestAnimationFrame		||
				window.msRequestAnimationFrame		||
				function( callback ){
					window.setTimeout(callback, 1000 / 60);
				};
	})();

	initialize();

})();

