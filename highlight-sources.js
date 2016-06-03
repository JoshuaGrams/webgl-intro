(function() {
	if(window.hasOwnProperty('sources')) for(var i=0; i<sources.length; ++i) {
		var elt = document.getElementById(sources[i]);
		if(!elt) continue;
		var language = 'js';
		if(elt.type === 'x-shader/x-vertex' || elt.type === 'x-shader/x-fragment') {
			language = 'glsl';
		}
		var h3 = document.createElement('h3');
		h3.innerHTML = elt.id;
		h3.className = 'capitalize';
		var code = document.createElement('code');
		code.className = language;
		code.appendChild(document.createTextNode(elt.text));
		var pre = document.createElement('pre');
		pre.className = 'source';
		pre.appendChild(code);
		if(elt.nextSibling) elt.parentNode.insertBefore(pre, elt.nextSibling);
		else elt.parentNode.appendChild(pre);
		elt.parentNode.insertBefore(h3, elt);
		hljs.highlightBlock(code);
	}
	var vertex = document.getElementById('vertex');
	var fragment = document.getElementById('fragment');
})();
