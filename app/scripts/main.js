'use strict';

//  注! グローバル変数にworldという名前でb2World用変数を用意しておかないと落ちる.
var world;
var boundsNodes = [[-2, 0], [2, 0], [2, 4], [-2, 4]]; //  境界形状
var pgDefs = [		//  particleGroup毎の初期形状
	{nodes:[[0.5, 0.1], [1.9, 0.1], [1.9, 2.5], [0.5, 1.0]], color:[255, 0, 0 , 255]},
	{nodes:[[-0.5, 0.1], [-1.9, 0.1], [-1.9, 2.5], [-0.5, 1.0]], color:[0, 0, 255 , 255]}
];
var timeStep = 1.0 / 60.0, velocityIterations = 8, positionIterations = 3;

var damBreak = {

	init: function() {
		var gravity = new b2Vec2(0, -10);
		var bodyDef = new b2BodyDef();
		var ground;

		var chainShape = new b2ChainShape();
		var psd, particleSystem;

		world = new b2World(gravity);
		ground = world.CreateBody(bodyDef);

		chainShape.vertices = boundsNodes.map(function(node){
			return new b2Vec2(node[0], node[1]);
		});
		chainShape.CreateLoop();
		ground.CreateFixtureFromShape(chainShape, 0);

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
			//pd.flags = b2_tensileParticle | b2_colorMixingParticle;
			pd.flags = b2_colorMixingParticle;
			pd.color.Set.apply(pd.color, def.color);
			pd.shape = shape;
			particleSystem.CreateParticleGroup(pd);
		});
		// Particle モジュール関連ここまで.

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
		var bounds = d3.svg.line().x(function(node){return node[0];}).y(function(node){return node[1];});
		viz.append('path').attr('fill', 'none').attr('stroke', 'black').attr('stroke-width', 0.01)
		.attr('d', bounds(boundsNodes) + ' Z');

		d3Renderer.resize();
	},
	render: function(world){
		var viz = d3.select('svg#viz g.world');

		var system = world.particleSystems[0];
		var particleGroup = viz.selectAll('g.particle').data(system.particleGroups)
		var positionBuf = system.GetPositionBuffer(), colorBuf = system.GetColorBuffer();
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
			});/*.attr('fill', function(d, i){
				return d3.rgb(
					colorBuf[(i + offset) * 4],
					colorBuf[(i + offset) * 4 + 1],
					colorBuf[(i + offset) * 4 + 2]
				);
			});*/
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
