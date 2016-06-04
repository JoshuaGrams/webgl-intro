var GameMode = (function() {
	'use strict';

	/*
	 * functions:
	 * 	draw(state, utils)  (REQUIRED)
	 * 	state step(state, secondsSinceCreated, utils)
	 * 	state key(keyString, state, utils)
	 * 	state mouse(x, y, type, state, utils)
	 * 	flag stop(state, utils)  (should we stop?)
	 */


	function GameMode(state, functions, element) {
		this.state = state;
		this.functions = functions;
		this.element = element;
		this.element.focus();

		this.clearUtils();
		this.bindListeners();

		this.s0 = null;
		this.tickHandler = GameMode.prototype.step.bind(this);
		window.requestAnimationFrame(this.tickHandler);
	}

	GameMode.prototype.clearUtils = function() {
		this.utils = {
			keyPressed: {}
			, buttonPressed: {}
			, passEvent: false
			, arrows: function() {
				var keys = this.keyPressed;
				//           QWERTY   ||  AZERTY   ||  DVORAK
				var up    = keys['W'] || keys['Z'] || keys[','] || keys['ArrowUp'] || false;
				var left  = keys['A'] || keys['Q']       /* A */|| keys['ArrowLeft'] || false;
				var down  = keys['S'] ||    /* S */   keys['O'] || keys['ArrowDown'] || false;
				var right = keys['D'] ||    /* D */   keys['E'] || keys['ArrowRight'] || false;
				var v = [right - left, up - down];
				var len = V.length(v);
				return (len > 1) ? V.x(v, 1/len) : v;
			}
		};
	}

	GameMode.prototype.bindListeners = function() {
		this.utils.keyPressed = {};
		if(!this.keyListener) this.keyListener = GameMode.prototype.key.bind(this);
		this.element.addEventListener('keydown', this.keyListener);
		this.element.addEventListener('keyup', this.keyListener);

		this.utils.buttonPressed = {};
		if(!this.mouseListener) this.mouseListener = GameMode.prototype.mouse.bind(this);
		this.element.addEventListener('mousedown', this.mouseListener);
		this.element.addEventListener('mouseup', this.mouseListener);
		this.element.addEventListener('mousemove', this.mouseListener);
		this.element.addEventListener('mouseenter', this.mouseListener);
		this.element.addEventListener('mouseleave', this.mouseListener);
	}

	GameMode.prototype.unbindListeners = function() {
		this.element.removeEventListener('keydown', this.keyListener);
		this.element.removeEventListener('keyup', this.keyListener);
		this.utils.keyPressed = {};

		this.element.removeEventListener('mousedown', this.mouseListener);
		this.element.removeEventListener('mouseup', this.mouseListener);
		this.element.removeEventListener('mousemove', this.mouseListener);
		this.element.removeEventListener('mouseenter', this.mouseListener);
		this.element.removeEventListener('mouseleave', this.mouseListener);
		this.utils.buttonPressed = {};
	}

	GameMode.prototype.step = function(ms) {
		var s = ms/1000;  if(!this.s0) this.s0 = s;
		var fn = this.functions;
		if(fn.step) this.state = fn.step(this.state, s - this.s0, this.utils);
		if(fn.stop && fn.stop(this.state, this.utils)) this.unbindListeners();
		else {
			fn.draw(this.state, this.utils);
			if(fn.step) window.requestAnimationFrame(this.tickHandler);
		}
	}

	GameMode.prototype.key = function(evt) {
		var k = keyboardEventKey(evt);
		var key = k.canonical || k;
		if(key.length === 1) key = key.toUpperCase();
		// call user function only on key "press",
		// utils.keyPressed gives "is down" info.
		if(evt.type === 'keydown') {
			// allow keyboard shortcuts through
			if(evt.altKey || evt.ctrlKey || evt.metaKey
					|| k === "Tab" || k === 'F11' || k === 'F12') {
				this.utils.passEvent = true;
			} else {
				this.utils.passEvent = false;
				if(this.functions.key) {
					this.state = this.functions.key(k, this.state, this.utils);
				}
			}
			if(!this.utils.passEvent) evt.preventDefault();
			this.utils.keyPressed[key] = 1;
		} else delete(this.utils.keyPressed[key]);
	}

	GameMode.prototype.mouse = function(evt) {
		if(this.functions.mouse) {
			var rect = this.element.getBoundingClientRect()
			var x = evt.clientX - rect.left
			var y = evt.clientY - rect.top
			var b = mouseButton(evt.button)
			var type = 'move', pass = true
			switch(evt.type) {
				case 'mousedown':
					type = 'press ' + b;
					this.utils.buttonPressed[b] = true; break
				case 'mouseup':
					type = 'release ' + b;
					delete(this.utils.buttonPressed[b]);
					break
				case 'mouseenter': type = 'enter'; break
				case 'mouseleave': type = 'leave'; break
			}
			this.utils.passEvent = pass
			this.state = this.functions.mouse(x, y, type, this.state, this.utils)
			if(!this.utils.passEvent) evt.preventDefault()
		}
	}


	// -------------------------------------------------------------------
	// keyboardEvent and mouseEvent conversion

	// for browsers which don't support `key` yet
	var keyCodeKeys = {
		8:'Backspace', 9:'Tab', 12:'5', 13:'Enter', 16:'Shift',
		17:'Control', 18:'Alt', 20:'CapsLock', 27:'Escape', 32:' ',
		33:'PageUp', 34:'PageDown', 35:'End', 36:'Home',
		37:'ArrowLeft', 38:'ArrowUp', 39:'ArrowRight', 40:'ArrowDown',
		44:'PrintScreen', 45:'Insert', 46:'Delete',
		49:['1','!'], 50:['2','@'], 51:['3','#'], 52:['4','$'],
		53:['5','%'], 54:['6','^'], 55:['7','&'], 56:['8','*'],
		57:['9','('], 58:['0',')'], 59:[';',':'], 61:['=','+'],
		65:['a','A'], 66:['b','B'], 67:['c','C'], 68:['d','D'],
		69:['e','E'], 70:['f','F'], 71:['g','G'], 72:['h','H'],
		73:['i','I'], 74:['j','J'], 75:['k','K'], 76:['l','L'],
		77:['m','M'], 78:['n','N'], 79:['o','O'], 80:['p','P'],
		81:['q','Q'], 82:['r','R'], 83:['s','S'], 84:['t','T'],
		85:['u','U'], 86:['v','V'], 87:['w','W'], 88:['x','X'],
		89:['y','Y'], 90:['z','Z'],
		91:'OS', 92:'OS', 93:'ContextMenu',
		96:'0', 97:'1', 98:'2', 99:'3', 100:'4', 101:'5',
		102:'6', 103:'7', 104:'8', 105:'9', 106:'*', 107:'+',
		109:'-', 110:'.', 111:'/',
		112:'F1', 113:'F2', 114:'F3', 115:'F4', 116:'F5', 117:'F6',
		118:'F7', 119:'F8', 120:'F9', 121:'F10', 122:'F11', 123:'F12',
		144:'NumLock', 173:['-','_'],
		186:[';',':'], 187:['=','+'], 188:[',','<'], 189:['-','_'],
		190:['.','>'], 191:['/','?'], 192:['`','~'],
		219:['[','{'], 220:['\\','|'], 221:[']','}'], 222:['\'','"'],
		224:'Meta'
	};

	// and of course Microsoft has to be different
	var keyKeys = {
		Left: 'ArrowLeft', Right: 'ArrowRight', Up: 'ArrowUp', Down: 'ArrowDown',
		Win: 'OS', Del: 'Delete', Esc: 'Escape'
	};

	function keyboardEventKey(evt) {
		var k = 'Unidentified';
		if(evt.key) {
			if(keyKeys.hasOwnProperty(evt.key)) k = keyKeys[evt.key];
			else k = evt.key;
		} else if(keyCodeKeys.hasOwnProperty(evt.keyCode)) {
			k = keyCodeKeys[evt.keyCode];
			if(k instanceof Array) {
				k = new String(k[evt.shiftKey+0]);
				k.canonical = k[0];
			}
		}

		if(k === 'Unidentified' && console && console.log) {
			console.log('Unidentified keyCode', evt.keyCode);
		} else if(evt.location && typeof k !== 'object') {
			k = new String(k);
			switch(evt.location) {  // already know it's not zero
				case 1: k.location = 'Left'; break;
				case 2: k.location = 'Right'; break;
				case 3: k.location = 'Numpad'; break;
				default: k.location = '???'; break;  // shouldn't happen
			}
		}
		return k;
	}

	function mouseButton(button) {
		switch(button) {
			case -1: return 'no button';
			case 0: return 'left button';
			case 2: return 'right button';
			case 1: return 'middle button';
			default: return 'button ' + button;
		}
	}


	return GameMode;
})();
