function millis() {
	return new Date().getTime();
}

function r(range) {
	return Math.random() * range;
}

function rz(range) {
	var res = r(range);
	while (res == 0) res = r(range);
	return res; 
}

function rr(range) {
	return parseInt(r(range));
}

function zeroPad(str, length) {
	var zeros = "0000000000";
	while (length - str.length > zeros.length) 
		str = zeros + str;
	return zeros.substring(0, length-str.length) + str;
}

function loadimg(url) {
	var img = new Image();
	img.src = url;
	img.loaded = false;
	img.onload = function() {
	  img.loaded = true;
	}
	return img;
}

function FakeAudio() {
	this.play = function() {
		console.log("playing");
	};
}

$(function(){
	console.log("invite.js started");

	var c = $("#canvas")[0];
	var ctx = c.getContext('2d'); 

	var w = 0;
	var h = 0;	
	var p = Array();
	
	// fisheye size
	var fs = 0;

	// mouse
	var mouse = { x: 0, y: 0, s: 0, t: millis() };

	// logo
	var logo = loadimg("wl.png");

	// array of pics
	var pics = Array();
	for (var i = 0; i < 15; i++) {
		pics[i] = loadimg("img/"+i+".jpg");
	}

	//audio
	if (typeof(Audio) != "undefined") {
		var aw = new Audio("aw.ogg");	
		aw.loop = true;
	} else {
		var aw = new FakeAudio();
	}
	aw.playing = false;

	var clickable = false;

	initpoints = function() {	
		for (var i = 0; i < 1000; i++) {
			var col = r(0x7f);
			col = ((col + r(0xf)) << 16) | ((col + r(0xf)) << 8) | (col + r(0xf));
			p[i] = {
				x: r(w),
				y: r(h),
				r: r(50),
				c: "#" + zeroPad(parseInt(col).toString(16), 6),
				dx: rz(10) - 5,
				dy: rz(10) - 5
			}
		}
	};
	
	$("#canvas").mousemove(function(e) {
		mouse.x = e.pageX;
		mouse.y = e.pageY;
	});

	fisheye = function(q, center) {
		qd = {
			x: q.x - center.x,
			y: q.y - center.y,
			r: q.r,
			c: q.c,
			xd: q.xd,
			yd: q.yd,
		};
		d = Math.sqrt(qd.x * qd.x + qd.y * qd.y);
		if (d > fs) return q;
		if (d < 1) return q; 
		//th = Math.atan2(qd.y, qd.x);
		s = Math.pow(fs/d, 2/3);
		//s *= s;
		qd.x *= s;
		qd.y *= s;
		qd.x += center.x;
		qd.y += center.y;
		return qd;
	};
	
	follow = function(q, center) {
		qd = {
			x: q.x - center.x,
			y: q.y - center.y,
		}
		d = Math.sqrt(qd.x * qd.x + qd.y * qd.y);
		if (d > fs) return q;
		if (d < 1) return q; 
		s = 0.97 + ((d/fs) * 0.03);
		q.x = center.x + qd.x * s;
		q.y = center.y + qd.y * s;
		return q;
	}
	
	updatepoints = function() {
		for (var i = 0; i < p.length; i++) {
		    q = p[i];
			q.x += q.dx;
			q.y += q.dy;
			if (q.x < 0) {
				q.x = 0;
				q.dx = rz(5);
				q.dy = rz(10) - 5;
			}
			if (q.x > w) {
				q.x = w;
				q.dx = -rz(5);
				q.dy = rz(10) - 5;
			}
			if (q.y < 0) {
				q.y = 0;
				q.dx = rz(10) - 5;
				q.dy = rz(5);
			}
			if (q.y > h) {
				q.y = h + 0;
				q.dx = rz(10) - 5;
				q.dy = -rz(5);
			}
		}
	};
	
	updatesize = function() {
		if (c.width == window.innerWidth && c.height==window.innerHeight) return;
		c.width = window.innerWidth;
		c.height = window.innerHeight;
		w = c.width;
		h = c.height;
	};
	
	draw = function() {
		updatesize();
		ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
		ctx.fillRect(0,0,w,h);
		secs = (millis() - t) / 1000;
		ctx.globalAlpha = 1;
		ctx.globalCompositeOperation = "source-over";
		if (secs < 20) {
			fs = secs * 100;
			for (var i = 0; i < p.length; i++) {
				q = fisheye(p[i], {x:w/2, y:h/2});
				ctx.fillStyle = q.c;
				ctx.beginPath();
				ctx.arc(q.x, q.y, q.r, 0, 2*Math.PI); 
				ctx.closePath();
				ctx.fill();
			}
			updatepoints();
		}
		ctx.globalCompositeOperation = "xor";
		if (logo.loaded) {
			var scale = 20 - secs;
			if (scale < 1) scale = 1;
			var hw = logo.width * scale / 2;
			var hh = logo.height * scale / 2;
			ctx.drawImage(logo, w/2 - hw, h/2 - hh, 2*hw, 2*hh);
		}
		if (secs > 20 && !clickable) {
			clickable = true;
			$("#canvas").click(function() {
				window.location="http://0x20.be/FrackFest_is_a_feature";
			});
			$("#canvas").css('cursor', 'pointer');
		}
		if (secs > 20) {
			var pic = pics[parseInt(secs/2) % pics.length];
			var scale = w / pic.width;
			scale *= 1 + secs % 2;
			var sw = pic.width * scale;
			var sh = pic.height * scale;
			ctx.drawImage(pic, (w-sw)/2, (h-sh)/2, sw, sh);
		}
		ctx.globalCompositeOperation = "source-over";
		if (secs > 20) {
			var alpha = 1-((23-secs)/3);
			if (alpha > 1) alpha = 1;			
			ctx.globalAlpha = alpha;
			ctx.fillStyle = "#333333";
			ctx.textAlign = "center";
			var x = w/2;
			var y = h/2 + 200;
			ctx.font='40px "VideoPhreak"';
			ctx.fillText("That's not a bug, that's a feature!", x, y);
			y += 40;
			ctx.font='28px "VideoPhreak"';
			ctx.fillText("Friday, 29th of June 2012, Whitespace.", x, y);
			y += 30;
			ctx.font='22px "VideoPhreak"';
			ctx.fillText("You *are* invited. Resistance *is* futile.", x, y);
			y += 24;
			ctx.font='16px "VideoPhreak"';
			ctx.fillText("Coded by sandb.", x, y);
		}
		ctx.globalCompositeOperation = "source-over";
		if (secs > 30) {
			fs = (10 + Math.abs(((secs - 30) % 20) - 10)) * 100;
			for (var i = 0; i < p.length; i++) {
				q = fisheye(p[i], {x:w/2, y:h/2});
				ctx.fillStyle = q.c;
				ctx.beginPath();
				ctx.arc(q.x, q.y, q.r, 0, 2*Math.PI); 
				ctx.closePath();
				ctx.fill();
			}
			updatepoints();
		}
		if (secs > 4 && !aw.playing) {
			aw.playing = true;
			aw.play();
		}
		setTimeout("draw()", 30);
	};

	var t = millis();

	updatesize();
	initpoints();
	draw();	
});
