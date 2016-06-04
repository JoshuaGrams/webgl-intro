// WebGL interface

var WebGL = {};
(function() {
	'use strict';

	WebGL.initialize = function(id) {
		var canvas = document.getElementById(id);
		if(canvas) {
			return canvas.getContext('webgl')
				|| canvas.getContext('experimental-webgl');
		}
	}

	WebGL.check = function(gl) {
		var err = gl.getError();
		if(!err) return;
		switch(err) {
			case gl.INVALID_ENUM: throw "GL: Invalid enum.";
			case gl.INVALID_VALUE: throw "GL: Invalid value.";
			case gl.INVALID_OPERATION: throw "GL: Invalid operation.";
			case gl.INVALID_FRAMEBUFFER_OPERATION: throw "GL: Invalid framebuffer operation.";
			case gl.OUT_OF_MEMORY: throw "GL: Out of memory.";
			case gl.CONTEXT_LOST_WEBGL: throw "GL: Context lost.";
		}
	}

	// source: string or element or script element with type:
	//   <script type="x-shader/x-vertex">
	//   <script type="x-shader/x-fragment">
	// type: gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
	//   (will be overridden by script element type)
	WebGL.compileObject = function(gl, source, type) {
		if(Object.prototype.toString.call(source) !== '[object String]') {
			if(source.type) switch(source.type) {
				case 'x-shader/x-vertex': type = gl.VERTEX_SHADER; break;
				case 'x-shader/x-fragment': type = gl.FRAGMENT_SHADER; break;
			}
			source = source.textContent;
		}

		var shader = gl.createShader(type);  WebGL.check(gl);
		gl.shaderSource(shader, source);  WebGL.check(gl);
		gl.compileShader(shader);  WebGL.check(gl);
		if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			return shader;
		} else {
			var typeName;
			switch(type) {
				case gl.VERTEX_SHADER: typeName = 'vertex'; break;
				case gl.FRAGMENT_SHADER: typeName = 'fragment'; break;
			}
			throw 'WebGL.compileShader(' + typeName + '): ' + gl.getShaderInfoLog(shader);
		}
	}

	WebGL.linkProgram = function(gl, sh) {
		var p = gl.createProgram(); WebGL.check(gl);
		for(var i=0; i<sh.length; ++i) {
			gl.attachShader(p, sh[i]);  WebGL.check(gl);
		}
		gl.linkProgram(p);  WebGL.check(gl);
		if(gl.getProgramParameter(p, gl.LINK_STATUS)) {
			// discard source/object code now that they're linked.
			for(var i=0; i<sh.length; ++i) {
				gl.detachShader(p, sh[i]);  WebGL.check(gl);
				gl.deleteShader(sh[i]);  WebGL.check(gl);
			}
			return p;
		} else throw 'WebGL.linkProgram: ' + gl.getProgramInfoLog(p);
	}

	WebGL.buildProgram = function(gl, vertex, fragment) {
		var p = gl.createProgram();  WebGL.check(gl);
		var sh = []
		sh[0] = WebGL.compileObject(gl, vertex, gl.VERTEX_SHADER);
		sh[1] = WebGL.compileObject(gl, fragment, gl.FRAGMENT_SHADER);
		return WebGL.linkProgram(gl, sh);
	}

	WebGL.clear = function(gl, color, flags) {
		gl.clearColor(color[0], color[1], color[2], color[3]);  WebGL.check(gl);
		if(flags) { gl.clear(flags);  WebGL.check(gl); }
		else { gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  WebGL.check(gl); }
	}

	WebGL.ARRAY_BUFFER = 0x8892;
	WebGL.ELEMENT_ARRAY_BUFFER = 0x8893;

	WebGL.TypeNames = [];
	WebGL.BYTE           = 0x1400;  WebGL.TypeNames[0x1400] = 'byte';
	WebGL.UNSIGNED_BYTE  = 0x1401;  WebGL.TypeNames[0x1401] = 'unsigned byte';
	WebGL.SHORT          = 0x1402;  WebGL.TypeNames[0x1402] = 'short';
	WebGL.UNSIGNED_SHORT = 0x1403;  WebGL.TypeNames[0x1403] = 'unsigned short';
	WebGL.INT            = 0x1404;  WebGL.TypeNames[0x1404] = 'int';
	WebGL.UNSIGNED_INT   = 0x1405;  WebGL.TypeNames[0x1405] = 'unsigned int';
	WebGL.FLOAT          = 0x1406;  WebGL.TypeNames[0x1406] = 'float';
	WebGL.TypeInfo = {
		'int': { size: 4, type: WebGL.INT, count: 1,
			abbrev: 'i', array: Int32Array }
		,'sampler2D': { size: 1, type: WebGL.INT, count: 1,
			abbrev: 'i', array: Int32Array, texture: true }
		,'byte-indices': { size: 1, type: WebGL.UNSIGNED_BYTE,
			array: Uint8Array, binding: WebGL.ELEMENT_ARRAY_BUFFER }
		,'indices': { size: 1, type: WebGL.UNSIGNED_SHORT,
			array: Uint16Array, binding: WebGL.ELEMENT_ARRAY_BUFFER }
		,'byte': { size: 1, type: WebGL.BYTE, count: 1,
			abbrev: 'i', array: Int8Array }
		,'float': { size: 4, type: WebGL.FLOAT, count: 1,
			abbrev: 'f', array: Float32Array }
		,'vec2': { size: 4, type: WebGL.FLOAT, count: 2,
			abbrev: 'f', array: Float32Array }
		,'vec3': { size: 4, type: WebGL.FLOAT, count: 3,
			abbrev: 'f', array: Float32Array }
		,'vec4': { size: 4, type: WebGL.FLOAT, count: 4,
			abbrev: 'f', array: Float32Array }
		,'mat2': { size: 4, type: WebGL.FLOAT, count: 2*2,
			abbrev: 'f', array: Float32Array, matrix: true }
		,'mat3': { size: 4, type: WebGL.FLOAT, count: 3*3,
			abbrev: 'f', array: Float32Array, matrix: true }
		,'mat4': { size: 4, type: WebGL.FLOAT, count: 4*4,
			abbrev: 'f', array: Float32Array, matrix: true }
	};

	WebGL.Shader = function(gl, prog, mode, variables, buffers) {
		this.gl = gl;
		this.p = prog;
		this.mode = mode;     // e.g. gl.TRIANGLES
		this.buffers = [];    // vertex buffer descriptions
		this.variables = {};  // uniform variables (shader globals)

		// Create vertex buffers, get attribute locations and type info.
		if(buffers) for(var i=0; i<buffers.length; ++i) {
			var attributes = buffers[i];
			if(Object.prototype.toString.call(attributes) !== '[object Array]')
				attributes = [attributes];
			this.buffers.push(new WebGL.VertexBuffer(gl, prog, attributes));
		}

		// Get variable locations and type info.
		if(variables) for(var i=0; i<variables.length; ++i) {
			var v = variables[i].split(' ', 2);
			var type = WebGL.TypeInfo[v[0]];
			var name = v[1];
			this.variables[name] = new WebGL.Variable(gl, prog, name, type);
		}
	}

	WebGL.ShaderFromElements = function(gl, vertex, fragment, mode, variables, buffers) {
		var vSrc = document.getElementById(vertex);
		var fSrc = document.getElementById(fragment);
		var prog = WebGL.buildProgram(gl, vSrc, fSrc);
		WebGL.Shader.bind(this)(gl, prog, mode, variables, buffers);
	}
	WebGL.ShaderFromElements.prototype = WebGL.Shader.prototype;

	WebGL.Shader.prototype.exec = function(values, vertexData, vertexCount) {
		this.gl.useProgram(this.p);  WebGL.check(this.gl);

		var indexType = false;

		if(vertexData) for(var i=0; i<this.buffers.length; ++i) {
			this.buffers[i].set(this.gl, vertexData[i]);
			if(this.buffers[i].indexType) indexType = this.buffers[i].indexType;
		}

		var vars = this.variables;
		if(values) for(var name in vars) {
			if(values.hasOwnProperty(name) && vars.hasOwnProperty(name))
				vars[name].set(this.gl, values[name]);
		}

		if(indexType) {
			this.gl.drawElements(this.mode, vertexCount, indexType, 0);
			WebGL.check(this.gl);
		} else {
			this.gl.drawArrays(this.mode, 0, vertexCount);  WebGL.check(this.gl);
		}
	}

	WebGL.VertexBuffer = function(gl, prog, attributes) {
		// Compute the size of the per-vertex data, cache offsets and type info.
		this.perVertex = 0;  this.array = false;
		var name = new Array(attributes.length);
		var type = new Array(attributes.length);
		var lastType = false;
		this.binding = gl.ARRAY_BUFFER;
		this.attributes = new Array(attributes.length);
		for(var i=0; i<attributes.length; ++i) {
			var a = attributes[i].split(' ', 2);
			name[i] = a[1];
			type[i] = WebGL.TypeInfo[a[0]];
			type[i].offset = this.perVertex;
			this.perVertex += type[i].size * type[i].count;
			if(type[i].binding) {
				this.binding = type[i].binding;
				this.indexType = type[i].type;
			}
			if(lastType === false) {
				lastType = type[i].type;
				this.array = type[i].array;
			} else if(lastType !== type[i].type) {
				throw 'VertexBuffer contains both '
					+ WebGL.TypeNames[lastType] + 's and '
					+ WebGL.TypeNames[type[i].type] + 's.';
			}
		}
		if(this.attributes.length === 1) this.perVertex = 0;

		// Create the buffer and attributes.
		this.buf = gl.createBuffer();  WebGL.check(gl);
		this.attributes = new Array(attributes.length);
		for(var i=0; i<attributes.length; ++i) {
			this.attributes[i] = new WebGL.Attribute(gl, prog, name[i],
					type[i].type, type[i].count, type[i].offset);
		}
	}

	WebGL.VertexBuffer.prototype.set = function(gl, data) {
		gl.bindBuffer(this.binding, this.buf);  WebGL.check(gl);
		if(data) {
			gl.bufferData(this.binding, new this.array(data), gl.STATIC_DRAW);
			WebGL.check(gl);
		}
		for(var i=0; i<this.attributes.length; ++i) {
			this.attributes[i].set(gl, this.perVertex);
		}
	}

	WebGL.Attribute = function(gl, prog, name, type, count, offset) {
		this.name = name;
		this.loc = gl.getAttribLocation(prog, name);  WebGL.check(gl);
		this.type = type;
		this.count = count;
		this.offset = offset;
	}
	
	WebGL.Attribute.prototype.set = function(gl, stride) {
		if(this.loc !== -1) {
			gl.enableVertexAttribArray(this.loc);  WebGL.check(gl);
			gl.vertexAttribPointer(this.loc, this.count, this.type,
					false, stride, this.offset);  WebGL.check(gl);
		}
	}

	WebGL.Variable = function(gl, prog, name, type) {
		this.loc = gl.getUniformLocation(prog, name);  WebGL.check(gl);
		var matrix = '';
		var count = type.count;
		var typeAbbrev = type.abbrev;
		var v = (count > 1) ? 'v' : '';
		if(type.matrix) { count = Math.sqrt(count);  matrix = 'Matrix'; }
		var fn = 'uniform' + matrix + count + typeAbbrev + v;
		if(matrix !== '') {
			this.set = function(gl, value) { gl[fn](this.loc, false, M.flattenTranspose(value)); }
		} else if(type.texture) {
			this.set = function(gl, value) { WebGL.setTexture(gl, this.loc, value[0], value[1]); }
		} else this.set = function(gl, value) { gl[fn](this.loc, value); }
	}

	// The `format` is generally gl.RGBA or gl.RGB.
	// May fail if image dimensions are not powers of two.
	WebGL.Texture = function(gl, image, format) {
		var texture = gl.createTexture();  WebGL.check(gl);
		gl.activeTexture(gl.TEXTURE0);  WebGL.check(gl);
		var bp = gl.TEXTURE_2D;  // binding point
		gl.bindTexture(bp, texture);
		gl.texImage2D(bp, 0, format, format, gl.UNSIGNED_BYTE, image);  WebGL.check(gl);
		gl.texParameteri(bp, gl.TEXTURE_MAG_FILTER, gl.LINEAR);  WebGL.check(gl);
		gl.texParameteri(bp, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);  WebGL.check(gl);
		gl.generateMipmap(bp);  WebGL.check(gl);
		return texture;
	}

	WebGL.setTexture = function(gl, loc, texture, unit) {
		gl.activeTexture(gl.TEXTURE0 + unit);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.uniform1i(loc, unit);
	}

	// -------------------------------------------------------------------

	WebGL.Loader = function() {
		this.resources = 0;
		this.loaded = 0;
		this.complete = false;   // Have all resources been loaded?
	}

	WebGL.Loader.prototype.add = function() {
		if(this.oncomplete) throw "Can't add resources to finalized Loader!";
		this.resources++;
		return this.onload.bind(this);
	}
	WebGL.Loader.prototype.onload = function() {
		this.loaded++;  this.finish();
	}
	WebGL.Loader.prototype.whenLoaded = function(oncomplete) {
		this.oncomplete = oncomplete;  this.finish();
	}
	WebGL.Loader.prototype.finish = function() {
		if(this.oncomplete && this.loaded === this.resources) {
			this.oncomplete();
			delete this.oncomplete;
		}
	}


	WebGL.images = new WebGL.Loader();
	WebGL.loadImage = function(url) {
		var i = new Image();
		i.onload = WebGL.images.add();
		i.src = url;
		return i;
	}


})();
