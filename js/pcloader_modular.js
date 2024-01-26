let currentPointCloud = null;
let renderer, scene, camera;

export function initializePointCloud(containerId, supercontainerId, imgSrc, img, onLoadedCallback, nDistanceMin=35, nDistanceMax=60, nDistanceInit=500) {
    // Place the entire logic here, modifying it to use the parameters:
    // containerId, imageSrcPath, and depthSrcPath

    var container = document.getElementById(containerId);
	var supercontainer = document.getElementById(supercontainerId)
    // var imgSrc = new Image();
    // var img = new Image();

    // // Set the source paths
    // img.src = depthSrcPath;
    // imgSrc.src = imageSrcPath;
	// console.log(imageSrcPath)

	var settings = {
		focalDistance: 10,
		near: 5,
		far: 20,
		smoothRadius: 0,
		quadSize: 1.0,
		pointSize: 2,
		downsampling: 2
	};
	

	var material, meshPoint;
	var renderer, scene, camera, fov = 70, nFov = fov, distance = 500;
	var nDistance = nDistanceInit;
	var displacement = 0, nDisplacement = displacement;

	var lon = 90, lat = 0, nLon = lon, nLat = lat;
	var oDist, oFov, adjustment = 0;



	// scene = new THREE.Scene();

	// camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, .1, 1000 );
	// camera.target = new THREE.Vector3( 0, 0, 0 );
	// camera.position.y = 500;
	// scene.add( camera );

	// renderer = new THREE.WebGLRenderer( { antialias: true, alpha: false } );
	// renderer.setClearColor( 0, 0 );
	// renderer.setSize( window.innerWidth, window.innerHeight );
	// renderer.sortObjects = true;

	// container.appendChild( renderer.domElement );

	// window.addEventListener( 'resize', onResize );
	
	// supercontainer.addEventListener( 'mousewheel', onContainerMouseWheel, false );
	// supercontainer.addEventListener( 'DOMMouseScroll', onContainerMouseWheel, false); 



	// const nDistanceMin =  35; // Minimum value of nDistance
	// const nDistanceMax = 60; // Maximum value of nDistance


	

	

	function loadPC() {


		displacement = nDisplacement = 0;

            // Create Image objects
 

		
		// img.onload = function() {

		// 	imgSrc.onload = function() {

				//var s = 6;
				var s = settings.downsampling;
				var w = Math.round( img.width / s ),
					h = Math.round( img.height / s );

				var canvas = document.createElement( 'canvas' ),
					ctx = canvas.getContext( '2d' );

				canvas.width = img.width;
				canvas.height = img.height;
				ctx.drawImage( img, 0, 0 );

				stackBlurCanvasRGB( canvas, 0, 0, canvas.width, canvas.height, parseInt( settings.smoothRadius, 10 ) );

				var imageData = ctx.getImageData( 0, 0, canvas.width, canvas.height );
				var p = 0;

				var colorCanvas = document.createElement( 'canvas' ),
					colorCtx = colorCanvas.getContext( '2d' );

				colorCanvas.width = imgSrc.width;
				colorCanvas.height = imgSrc.height;
				colorCtx.drawImage( imgSrc, 0, 0 );
				var colorImageData = colorCtx.getImageData( 0, 0, colorCanvas.width, colorCanvas.height );
				var colorP = 0;

				var focalDistance = settings.focalDistance;
				var	near = settings.near;
				var far = settings.far;

				
				console.log("focalDistance = ",focalDistance,
							"near = ",near,							
							"far = ",far,
							"width = ",img.width,
							"height = ",img.height);

				var geometry = new THREE.BufferGeometry();
				var size = w * h;

				geometry.addAttribute( 'position', Float32Array, size, 3 );
				geometry.addAttribute( 'customColor', Float32Array, size, 3 );
			
				var positions = geometry.attributes.position.array;
				var customColors = geometry.attributes.customColor.array;

				adjustment = 10 * 960 / img.width
				var ar = img.height / img.width;
				var scale = new THREE.Vector3( 1, 1, 1 );
				var v = new THREE.Vector3();
				var ptr = 0;

				var minZ = 100000000000, maxZ = -100000000000;
				for( var y = 0; y < h; y++ ) {
					for( var x = 0; x < w; x++ ) {
						v.x = ( x - .5 * w ) / w;
						v.y = ( y - .5 * h ) / h;
						p = Math.round( ( ( -v.y + .5 ) ) * ( img.height - 1 ) ) * img.width * 4 + Math.round( ( ( v.x + .5 ) ) * ( img.width - 1 ) ) * 4;
						//console.log("y = ",y,"x = ",x,
						//            "imageData = ",imageData.data[ p ],
						//            "colorImageData = ",colorImageData.data[ p + 0 ],colorImageData.data[ p + 1 ],colorImageData.data[ p + 2 ]);
						var dn = imageData.data[ p ] / 255;
						//var rd = ( far * near ) / ( far - dn * ( far - near ) ); // RangeInverse
						var rd = ( 1 - dn ) * ( far - near ) + near; // RangeLinear
						v.z = -rd ;
						v.x *= rd * 1;
						v.y *= rd * ar;
						v.multiply( scale );

						positions[ ptr + 0 ] = v.x;
						positions[ ptr + 1 ] = v.y;
						positions[ ptr + 2 ] = v.z;

						customColors[ ptr + 0 ] = colorImageData.data[ p + 0 ] / 255;
						customColors[ ptr + 1 ] = colorImageData.data[ p + 1 ] / 255;
						customColors[ ptr + 2 ] = colorImageData.data[ p + 2 ] / 255;
						
						ptr += 3;

						if( v.z < minZ ) minZ = v.z;
						if( v.z > maxZ ) maxZ = v.z;

					}
				}

				var offset = ( maxZ - minZ ) / 2;
				for( var j = 0; j < positions.length; j+=3 ) {
					positions[ j + 2 ] += offset;
				}

				var step = settings.quadSize;
				var planeGeometry = new THREE.PlaneGeometry( 1, 1, Math.round( w / step ), Math.round( h / step ) );
				ptr = 0;
				for( var j = 0; j < planeGeometry.vertices.length; j++ ) {
					v = planeGeometry.vertices[ j ];
					p = Math.round( ( ( -v.y + .5 ) ) * ( img.height - 1 ) ) * img.width * 4 + Math.round( ( ( v.x + .5 ) ) * ( img.width - 1 ) ) * 4;
					var dn = imageData.data[ p ] / 255;
					//console.log( v, p, dn );
					//var rd = ( far * near ) / ( far - dn * ( far - near ) ); // RangeInverse
					var rd = ( 1 - dn ) * ( far - near ) + near; // RangeLinear
					v.z = -rd ;
					v.x *= rd * 1;
					v.y *= rd * ar;
					v.multiply( scale );
					v.z += offset;
				}

				planeGeometry.computeFaceNormals();
				planeGeometry.computeVertexNormals();

				var tex = new THREE.Texture( imgSrc );
				tex.needsUpdate = true;

				// Create the point cloud
				meshPoint = new THREE.ParticleSystem(geometry, material);
				meshPoint.scale.set(adjustment, adjustment, adjustment);
				meshPoint.frustumCulled = false;

				// Set initial values
				nDistance = parseFloat(settings.focalDistance) + offset * adjustment;
				nFov = 1 * Math.atan2(.5 * adjustment * near, settings.focalDistance) * 180 / Math.PI;
				material.uniforms.size.value = settings.pointSize * nDistance;
				nDisplacement = 1;

				// Return the point cloud along with the necessary parameters
				return {
					pointCloud: meshPoint,
					minZ: minZ,
					maxZ: maxZ,
					offset: offset,
					adjustment: adjustment
				};

		// 	}
		// }
			}


    // Load shaders and return the point cloud
    var sL = new ShaderLoader();
    sL.add('particle-vs', 'shaders/particle-vs.glsl');
    sL.add('particle-fs', 'shaders/particle-fs.glsl');

	// img.onload = function() {

	// 	imgSrc.onload = function() {


			return new Promise((resolve, reject) => {
				sL.onLoaded(function() {
					material = new THREE.ShaderMaterial( {
						attributes: {
							customColor: { type: 'c', value: null }
						},
						uniforms: {
							size: { type: 'f', value: 1 },
							displacement: { type: 'f', value: 0 }
						},
						vertexShader: this.get( 'particle-vs' ),
						fragmentShader: this.get( 'particle-fs' )
					} );

					// Resolve the promise with the loaded point cloud
					resolve(loadPC());
				});

				sL.load();
			});

		}
// 	}
// }


// return new Promise((resolve, reject) => {
//     sL.onLoaded(function() {
//         material = new THREE.ShaderMaterial({
//             // ... existing shader material setup ...
//         });
//         const pointCloudData = loadPC();
//         resolve(pointCloudData);
//     });

//     sL.load();
// });


// Any other functions or logic needed for the module


