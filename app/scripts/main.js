'use strict';

//  注! グローバル変数にworldという名前でb2World用変数を用意しておかないと落ちる.
var world;
var boundsNodes = [[-2, 0], [2, 0], [2, 4], [-2, 4]]; //  境界形状
var floaters = [
	{nodes:[[-0.1, -0.2],[0.1, -0.2],[0.1, 0.2],[-0.1, 0.2]], pos:[0.5, 2]},
	{nodes:[[0, 0.2],[0.1732, -0.0866],[-0.1732, -0.0866]], pos:[-1.5, 3]}
];
var pgDefs = [		//  particleGroup毎の初期形状
	{nodes:[[0.5, 0.1], [1.9, 0.1], [1.9, 2.5], [0.5, 1.0]]},
	{nodes:[[-0.5, 0.1], [-1.9, 0.1], [-1.9, 2.5], [-0.5, 1.0]]}
];
var timeStep = 1.0 / 60.0, velocityIterations = 8, positionIterations = 3;

var damBreak = {

	init: function() {
		var gravity = new b2Vec2(0, -10);
		var boundsBody, boxShape;
		var psd, particleSystem;

		// 環境定義
		world = new b2World(gravity);

		// 剛体(static) 関連 
		boundsBody= world.CreateBody(new b2BodyDef());
		boxShape = new b2ChainShape();
		boxShape.vertices = boundsNodes.map(function(node){
			return new b2Vec2(node[0], node[1]);
		});
		boxShape.CreateLoop();
		boundsBody.CreateFixtureFromShape(boxShape, 0);

		// 剛体(dyanmic)関連ここから 
		floaters.forEach(function(floaterDef){
			var dynamicBodyDef = new b2BodyDef(), body, shape;
			dynamicBodyDef.type = b2_dynamicBody;
			body = world.CreateBody(dynamicBodyDef);
			shape = new b2ChainShape();
			shape.vertices = floaterDef.nodes.map(function(node){
				return new b2Vec2(node[0], node[1]);
			});
			shape.CreateLoop();
			body.CreateFixtureFromShape(shape, 1);
			body.SetTransform(new b2Vec2(floaterDef.pos[0], floaterDef.pos[1]), 0);
			// 質量定義
			body.SetMassData(new b2MassData(0.1, new b2Vec2(0, 0), 0.03));
		});

		// Particle モジュール関連ここから
		psd = new b2ParticleSystemDef();
		psd.radius = 0.05;				 // 粒子半径
		psd.dampingStrength = 0.1; // 減衰の強さ

		particleSystem = world.CreateParticleSystem(psd);

		pgDefs.forEach(function(def){
			var shape = new b2PolygonShape(), pd = new b2ParticleGroupDef();
			shape.vertices = def.nodes.map(function(node){
				return new b2Vec2(node[0], node[1]);
			});
			pd.shape = shape;
			particleSystem.CreateParticleGroup(pd);
		});

	},
	update: function(){
		world.Step(timeStep, velocityIterations, positionIterations);
	}
};

var init = function(){
	damBreak.init();
	d3Renderer.init();
	window.onresize = d3Renderer.resize;
	render();
};

var render = function(){
	damBreak.update();
	d3Renderer.render(world);
	window.requestAnimationFrame(render);
};

var d3Renderer = {
	init: function(){
		var viz = d3.select('body').append('svg').attr('id', 'viz').append('g').classed('world', true);
		d3Renderer.resize();
	},
	render: function(world){
		var viz = d3.select('svg#viz g.world');
		d3Renderer.drawBodies(viz, world.bodies);
		d3Renderer.drawParicles(viz, world.particleSystems[0]);
	},
	drawBodies: function(selection, bodies){ // 剛体描画用 
		var bounds = d3.svg.line().x(function(vec){return vec.x;}).y(function(vec){return vec.y;});
		var bodyGroups = selection.selectAll('g.body').data(bodies, function(b){
			return b.ptr;
		});
		bodyGroups.enter().append('g').classed('body', true).attr('fill', 'none').attr('stroke', 'black').attr('stroke-width', 0.01);
		bodyGroups.each(function(b){
			d3.select(this).selectAll('path').data(b.fixtures).enter().append('path').attr('d', function(fixture){
				return bounds(fixture.shape.vertices);
			});
		});
		bodyGroups.attr('transform', function(b){
			var pos = b.GetPosition(), angle = b.GetAngle() * 180 / Math.PI;
			return 'translate(' + pos.x + ', ' + pos.y + '), rotate(' + angle + ')';
		});
		bodyGroups.exit().remove();
	},
	drawParicles: function(selection, system){ // 流体粒子描画用 
		var particleGroup = selection.selectAll('g.particle').data(system.particleGroups)
		var positionBuf = system.GetPositionBuffer();
		particleGroup.enter().append('g').classed('particle', true).attr('fill', function(d, i){
			return d3.hsl((i * 77 + 200) % 360, 0.8, 0.8);
		});
		particleGroup.each(function(pg){
			var dataSet = d3.select(this).selectAll('circle').data(new Array(pg.GetParticleCount()));
			var offset = pg.GetBufferIndex();
			dataSet.enter().append('circle').attr('r', system.radius * 0.75);
			dataSet.attr('cx', function(d, i){
				return positionBuf[(i + offset) * 2];
			}).attr('cy', function(d, i){
				return positionBuf[(i + offset) * 2 + 1];
			});
			dataSet.exit().remove();
		});
		particleGroup.exit().remove();
	},
	resize: function(){
		var w = window.innerWidth, h = window.innerHeight;
		var scale = (w < h ? w : h) * 0.23;
		var viz = d3.select('svg#viz');
		viz.style('width', '100%').style('height', h + 'px');
		var translate = 'translate(' + (w/2) + ', ' + (h/2 + scale*2) + ')';
		var scale = 'scale(' + scale + ', ' + (-scale) + ')';
		viz.select('g').attr('transform', [translate, scale].join());
	}
};

window.onload = init;
