// Arrays as vectors (and arrays of column vectors as matrices)

function shallowCopy(obj) {
	if(!typeof obj === 'object') return obj
		var copy, C = obj.constructor;
	switch(C) {
		case RegExp: copy = new C(obj); break
		case Date: copy = new C(obj.getTime()); break
		default: copy = new C()
	}
	for(var key in obj) if(obj.hasOwnProperty(key)) copy[key] = obj[key]
		return copy;
}

var V = {}, M = {};

(function() {
	V.add = function(u, v) { return zipWith(add, u, v) }
	V.sub = function(u, v) { return zipWith(sub, u, v) }
	V.x = function(v, r) { return mapOntoValue(mul, v, r) }
	V.lerp = function(t, u, v) { return V.add(V.x(u, 1-t), V.x(v, t)) }
	V.addNumber = function(v, r) { return mapOntoValue(add, v, r) }
	V.subNumber = function(v, r) { return mapOntoValue(sub, v, r) }

	V.dot = function(u, v) { return zipReduce(mul, add, u, v) }
	V.length = function(v) { return Math.sqrt(V.dot(v, v)) }
	V.normalize = function(v) { return V.x(v, 1/V.length(v)) }
	// split `u` into pieces along `v` and perpendicular to `v`
	V.project = function(u, v) { return V.x(v, V.dot(u, v) / V.dot(v, v)) }
	V.reject = function(u, v) { return V.sub(u, V.project(u, v)) }

	M.xV = function(m, v) { return zipReduce(V.x, V.add, m, v) }
	M.x = function(m, n) { return mapValueOnto(M.xV, m, n) }
	M.xV1 = function(m, v) { return M.xV(m, v.concat(1)) }
	M.flatten = function(m) {
		var a = [];
		for(var i=0; i<m.length; ++i) a.push.apply(a, m[i]);
		return a;
	}

	V.cross = function(u, v) {
		return [ u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0] ];
	}

	function add(a,b){return a+b}
	function sub(a,b){return a-b}
	function mul(a,b){return a*b}
	function div(a,b){return a/b}


	function zipWith(fn, a, b) {
		var c = new Array(a.length)
		for(var i=0; i<a.length; ++i) c[i] = fn(a[i], b[i])
		return c
	}

	function mapOntoValue(fn, a, c) {
		var out = new Array(a.length)
		for(var i=0; i<a.length; ++i) out[i] = fn(a[i], c)
		return out
	}

	function mapValueOnto(fn, c, a) {
		var out = new Array(a.length)
		for(var i=0; i<a.length; ++i) out[i] = fn(c, a[i])
		return out
	}

	function zipReduce(zip, reduce, a, b) {
		var r = zip(a[0], b[0])
		for(var i=1; i<a.length; ++i) r = reduce(r, zip(a[i], b[i]))
		return r
	}

	function reduce(fn, r, a) {
		for(var i=0; i<a.length; ++i) r = fn(r, a[i])
		return r;
	}

	function binop(fn, a, b) {
		if(isArray(a)) {
			if(isArray(b)) return zipWith(fn, a, b)
			else return mapOntoValue(fn, a, b)
		} else {
			if(isArray(b)) return mapValueOnto(fn, a, b)
			else return fn(a, b)
		}
	}


	function addDecimalDigit(i, d) { return i*10 + d }
	function toInt(a) { return reduce(addDecimalDigit, 0, a) }
	function toDecimals(a) {
		var r = 0, place = 1;
		for(var i=0; i<a.length; ++i) {
			place *= 0.1;
			r += a[i] * place;
		}
		return r;
	}

})()
