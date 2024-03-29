// shouldnt be a global :(
var particleColors = [
  new b2ParticleColor(0xff, 0x00, 0x00, 0xff), // red
  new b2ParticleColor(0x00, 0xff, 0x00, 0xff), // green
  new b2ParticleColor(0x00, 0x00, 0xff, 0xff), // blue
  new b2ParticleColor(0xff, 0x8c, 0x00, 0xff), // orange
  new b2ParticleColor(0x00, 0xce, 0xd1, 0xff), // turquoise
  new b2ParticleColor(0xff, 0x00, 0xff, 0xff), // magenta
  new b2ParticleColor(0xff, 0xd7, 0x00, 0xff), // gold
  new b2ParticleColor(0x00, 0xff, 0xff, 0xff) // cyan
];
var container;
var world = null;
var threeRenderer;
var renderer;
var camera;
var scene;
var objects = [];
var timeStep = 1.0 / 60.0;
var velocityIterations = 8;
var positionIterations = 3;
var test = {};
var projector = new THREE.Projector();
var planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
var g_groundBody = null;

var windowWidth = window.innerWidth;
var windowHeight = window.innerHeight;

function printErrorMsg(msg) {
  var domElement = document.createElement('div');
  domElement.style.textAlign = 'center';
  domElement.innerHTML = msg;
  document.body.appendChild(domElement);
}

function initTestbed() {

	/*
	threeRenderer = new THREE.WebGLRenderer();
  threeRenderer.setClearColor(0xEEEEEE);
  threeRenderer.setSize(windowWidth, windowHeight);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, windowWidth/windowHeight, 1, 1000);
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 100;
  camera.lookAt(scene.position);

  document.body.appendChild( this.threeRenderer.domElement);

  this.mouseJoint = null;

  // hack
  renderer = new Renderer();
 	*/

  var gravity = new b2Vec2(0, -10);
  world = new b2World(gravity);
  Testbed();
}

function testSwitch(testName) {
  ResetWorld();
  world.SetGravity(new b2Vec2(0, -10));
  var bd = new b2BodyDef;
  g_groundBody = world.CreateBody(bd);
  test = new window[testName];
}

function Testbed(obj) {
  // Init world
  //GenerateOffsets();
  //Init
  var that = this;
	/*
  document.addEventListener('keypress', function(event) {
    if (test.Keyboard !== undefined) {
      test.Keyboard(String.fromCharCode(event.which) );
    }
  });
  document.addEventListener('keyup', function(event) {
    if (test.KeyboardUp !== undefined) {
      test.KeyboardUp(String.fromCharCode(event.which) );
    }
  });

  document.addEventListener('mousedown', function(event) {
    var p = getMouseCoords(event);
    var aabb = new b2AABB;
    var d = new b2Vec2;

    d.Set(0.01, 0.01);
    b2Vec2.Sub(aabb.lowerBound, p, d);
    b2Vec2.Add(aabb.upperBound, p, d);

    var queryCallback = new QueryCallback(p);
    world.QueryAABB(queryCallback, aabb);

    if (queryCallback.fixture) {
      var body = queryCallback.fixture.body;
      var md = new b2MouseJointDef;
      md.bodyA = g_groundBody;
      md.bodyB = body;
      md.target = p;
      md.maxForce = 1000 * body.GetMass();
      that.mouseJoint = world.CreateJoint(md);
      body.SetAwake(true);
    }
    if (test.MouseDown !== undefined) {
      test.MouseDown(p);
    }

  });

  document.addEventListener('mousemove', function(event) {
    var p = getMouseCoords(event);
    if (that.mouseJoint) {
      that.mouseJoint.SetTarget(p);
    }
    if (test.MouseMove !== undefined) {
      test.MouseMove(p);
    }
  });

  document.addEventListener('mouseup', function(event) {
    if (that.mouseJoint) {
      world.DestroyJoint(that.mouseJoint);
      that.mouseJoint = null;
    }
    if (test.MouseUp !== undefined) {
      test.MouseUp(getMouseCoords(event));
    }
  });
 	*/


  window.addEventListener( 'resize', onWindowResize, false );

  //testSwitch("TestWaveMachine");
  testSwitch("TestDamBreak");

  render();
}

var render = function() {
  // bring objects into world
  //renderer.currentVertex = 0;
  if (test.Step !== undefined) {
    test.Step();
  } else {
    Step();
  }
  //renderer.draw();

	d3Renderer.render();
  //threeRenderer.render(scene, camera);
  requestAnimationFrame(render);
};

var d3Renderer = {
	init: function(){
		var viz = d3.select('#viz').append('svg').append('g');
		viz.append('g').classed('particle', true).attr('fill', 'rgba(0, 0, 255, 0.1)');
		viz.append('rect')
		.attr('fill', 'none')
		.attr('stroke', 'black').attr('stroke-width', 0.01)
		.attr('x', -2).attr('y', 0)
		.attr('width', 4).attr('height', 4);
		
		d3Renderer.resize();

	},
	resize: function(){
		var w = window.innerWidth, h = window.innerHeight;
		var scale = (w < h ? (w / 4) : (h / 4)) * 0.9;
		var viz = d3.select('#viz svg');

		viz.style('width', '100%');
		viz.style('height', h + 'px');

		viz.select('g').attr('transform', function(){
			return 'translate(' + w / 2 + ', ' + (h/ 2 + scale * 2) + '), scale(' + scale + ', ' + (-scale) + ')';
		});
	},
	render: function(){

		var viz = d3.select('#viz g.particle');

		for (var i = 0, max = world.particleSystems.length; i < max; i++) {
			(function(system){
				var particles = system.GetPositionBuffer();
				var color = system.GetColorBuffer();
				var maxParticles = particles.length, transform = new b2Transform();
				transform.SetIdentity();
				var arr = new Array(particles.length / 2);

				var dataSet = viz.selectAll('circle').data(arr);

				dataSet.enter().append('circle').attr('r', system.radius);
				dataSet.attr('cx', function(d, i){
					return particles[i * 2];
				}).attr('cy', function(d, i){
					return particles[i * 2 + 1];
				});
			})(world.particleSystems[i]);
		}
	}
};

var ResetWorld = function() {
	if (world !== null) {
		while (world.joints.length > 0) {
			world.DestroyJoint(world.joints[0]);
		}

		while (world.bodies.length > 0) {
			world.DestroyBody(world.bodies[0]);
		}

		while (world.particleSystems.length > 0) {
			world.DestroyParticleSystem(world.particleSystems[0]);
		}
	}
	/*
	camera.position.x = 0;
	camera.position.y = 0;
	camera.position.z = 100;
 	*/
};

var Step = function() {
	world.Step(timeStep, velocityIterations, positionIterations);
};

/**@constructor*/
function QueryCallback(point) {
	this.point = point;
	this.fixture = null;
}

/**@return bool*/
QueryCallback.prototype.ReportFixture = function(fixture) {
	var body = fixture.body;
	if (body.GetType() === b2_dynamicBody) {
		var inside = fixture.TestPoint(this.point);
		if (inside) {
			this.fixture = fixture;
			return true;
		}
	}
	return false;
};

function onWindowResize() {
	/*
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	threeRenderer.setSize( window.innerWidth, window.innerHeight );
 	*/
 	d3Renderer.resize();
}

function getMouseCoords(event) {
	var mouse = new THREE.Vector3();
	mouse.x = (event.clientX / windowWidth) * 2 - 1;
	mouse.y = -(event.clientY / windowHeight) * 2 + 1;
	mouse.z = 0.5;

	projector.unprojectVector(mouse, camera);
	var dir = mouse.sub(camera.position).normalize();
	var distance = -camera.position.z / dir.z;
	var pos = camera.position.clone().add(dir.multiplyScalar(distance));
	var p = new b2Vec2(pos.x, pos.y);
	return p;
}
