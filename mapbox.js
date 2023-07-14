const version = "0.88a";

class Util {
	static styles = [
		// Mapbox Streets 202302
		"mapbox://styles/chabu/cle45fdmb000b01mg52anpyee",
		// Mapbox Satellite Streets 202302 (3D Terrain enabled)
		"mapbox://styles/chabu/cle45tmjz000c01mgr0hm1aix",
	];

	static paddingOptions = {
		top: 96,
		left: 16,
		right: 96,
		bottom: 32,
	};

	static labelFromUrl(url) {
		let filename = url.split("/").pop();
		let filenameNoExts = filename.split(".", 1).shift();

		let category = null, numseq = null;
		let hour = null, minute = null, second = null;

		let matches = filenameNoExts.matchAll(/([a-z]+)([0-9]+)/gs);

		for (let match of matches) {
			let prefix = match[1];
			let numval = match[2];

			switch (prefix) {
				case "pv": // promotion
				case "op": // opening
				case "ed": // ending
				case "ep": // episode
					category = prefix;
					numseq = numval;
					break;

				case "h":
					hour = numval;
					break;
				case "m":
					minute = numval;
					break;
				case "s":
					second = numval;
					break;
			}
		}

		if (category === null || numseq === null || second === null) {
			return filenameNoExts;
		}

		let groupLabel = null;

		switch (category) {
			case "ep":
				groupLabel = `${numseq}話`;
				break;
			default:
				groupLabel = `${category.toLowerCase()}${numseq},`;
				break;
		}

		if (hour === null) {
			let padsec = second.padStart(2, "0");
			return `${groupLabel} ${minute}:${padsec}`;
		} else {
			let padsec = second.padStart(2, "0");
			let padmin = minute.padStart(2, "0");
			return `${groupLabel} ${hour}:${padmin}:${padsec}`;
		}
	}

	static goodLngLat(map, ll) {
		let zoom = map.getZoom().toFixed(2);
		let precision = Math.ceil((zoom * Math.LN2 + Math.log(512 / 360 / 0.5)) / Math.LN10);

		let lng = ll.lng.toFixed(precision);
		let lat = ll.lat.toFixed(precision);

		return {lng: lng, lat: lat, zoom: zoom};
	}

	static positionText(map, title) {
		let center = map.getCenter();
		let ll = this.goodLngLat(map, center);

		let bearing = map.getBearing().toFixed(1);
		let pitch = map.getPitch().toFixed(0);

		// ${ll.zoom}/${ll.lat}/${ll.lng}/${bearing}/${pitch}
		let text =
`// ${title}
"center": {"lat": ${ll.lat}, "lng": ${ll.lng}},
"zoom": ${ll.zoom},
"bearing": ${bearing},
"pitch": ${pitch}`;

		return text;
	}

	static convertToGeoJson(points, baseUrl) {
		let root = {
			type: "FeatureCollection",
			features: []
		};

		for (let point of points) {
			if (point["latlng"].length < 2) {
				continue;
			}

			let children = {
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [
						point["latlng"][1],
						point["latlng"][0]
					]
				},
				properties: {
					icon: baseUrl + point["icon"]
				}
			};

			if (point.hasOwnProperty("text")) {
				children.properties.text = point["text"];
			} else {
				children.properties.text = this.labelFromUrl(point["icon"]);
			}

			if (point.hasOwnProperty("orig")) {
				children.properties.orig = baseUrl + point["orig"];
			}

			if (point.hasOwnProperty("away")) {
				children.properties.away = point["away"];
			} else {
				children.properties.away = false;
			}

			root.features.push(children);
		}

		return root;
	}
}

class Button1Control {
	#map;
	#container;

	onAdd(map) {
		this.#map = map;

		let div = document.createElement("div");
		div.className = "mapboxgl-ctrl";

		let button = document.createElement("span");
		button.className = "button";
		button.textContent = "Show Pos";
		button.addEventListener("click", () => {
			let element = document.getElementById("info");
			element.value = Util.positionText(this.#map, "Show Pos");
			element.select();
		});

		div.appendChild(button);

		this.#container = div;
		return this.#container;
	}

	onRemove() {
		this.#container.remove();
		this.#map = undefined;
	}
}

class Button2Control {
	#map;
	#container;

	onAdd(map) {
		this.#map = map;

		let div = document.createElement("div");
		div.className = "mapboxgl-ctrl";

		let button = document.createElement("span");
		button.className = "button";
		button.textContent = "Move";
		button.addEventListener("click", () => {
			this.#map.flyTo({
				duration: 10000,
				center: {lat: 34.420173, lng: 134.056573},
				zoom: 16.40,
				bearing: 122.3,
				pitch: 60
			});
		});

		div.appendChild(button);

		this.#container = div;
		return this.#container;
	}

	onRemove() {
		this.#container.remove();
		this.#map = undefined;
	}
}

class Button3Control {
	#map;
	#container;

	onAdd(map) {
		this.#map = map;

		let div = document.createElement("div");
		div.className = "mapboxgl-ctrl";

		let button = document.createElement("span");
		button.className = "button";
		button.textContent = "Button 3";
		button.addEventListener("click", () => {
			
		});

		div.appendChild(button);

		this.#container = div;
		return this.#container;
	}

	onRemove() {
		this.#container.remove();
		this.#map = undefined;
	}
}

class DisplayAllControl {
	#map;
	#container;
	#lngLatBounds;

	constructor(lngLatBounds) {
		this.#lngLatBounds = lngLatBounds;
	}

	onAdd(map) {
		this.#map = map;

		let div = document.createElement("div");
		div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

		let button = document.createElement("button");
		button.type = "button";

		let icon = document.createElement("span");
		icon.className = "mapboxgl-ctrl-icon icon-world";
		icon.title = "Display all markers";

		button.addEventListener("click", () => {
			this.#map.fitBounds(this.#lngLatBounds, {
				animate: false,
				padding: Util.paddingOptions
			});
		});

		button.appendChild(icon);
		div.appendChild(button);

		this.#container = div;
		return this.#container;
	}

	onRemove() {
		this.#container.remove();
		this.#map = undefined;
	}
}

class MapStyleControl {
	#map;
	#container;
	#appender;

	#styles;
	#stylesIndex = 0;

	constructor(styles, appender) {
		this.#styles = styles;
		this.#appender = appender;
	}

	onAdd(map) {
		this.#map = map;

		let div = document.createElement("div");
		div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

		let button = document.createElement("button");
		button.type = "button";

		let icon = document.createElement("span");
		icon.className = "mapboxgl-ctrl-icon icon-layers";
		icon.title = "Change map's style";

		button.addEventListener("click", () => {
			this.#stylesIndex++;
			this.#stylesIndex %= this.#styles.length;
			this.#map.setStyle(this.#styles[this.#stylesIndex]);

			let span = document.getElementById("status");
			span.textContent = "loading...";

			this.#map.once("idle", () => {
				this.#appender.loadImages();
				this.#appender.loadSourceAndLayer();
			});
		});

		button.appendChild(icon);
		div.appendChild(button);

		this.#container = div;
		return this.#container;
	}

	onRemove() {
		this.#container.remove();
		this.#map = undefined;
	}
}

class TogglePicturesControl {
	#map;
	#container;
	#appender;

	constructor(appender) {
		this.#appender = appender;
	}

	onAdd(map) {
		this.#map = map;

		let div = document.createElement("div");
		div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

		let button = document.createElement("button");
		button.type = "button";

		let icon = document.createElement("span");
		icon.className = "mapboxgl-ctrl-icon icon-pictures";
		icon.title = "Toggle pictures";

		button.addEventListener("click", () => {
			let props = this.#appender.layoutProps(false);
			for (let [key, value] of Object.entries(props)) {
				this.#map.setLayoutProperty("points", key, value);
			}
		});

		button.appendChild(icon);
		div.appendChild(button);

		this.#container = div;
		return this.#container;
	}

	onRemove() {
		this.#container.remove();
		this.#map = undefined;
	}
}

class StatusText {
	#map;
	#container;

	onAdd(map) {
		this.#map = map;

		let div = document.createElement("div");
		div.className = "mapboxgl-ctrl status";

		div.addEventListener("click", () => {
			let features = this.#map.queryRenderedFeatures({layers: ["points"]});

			let llb = new mapboxgl.LngLatBounds();
			for (let feature of features) {
				llb.extend(feature.geometry.coordinates);
			}

			this.#map.fitBounds(llb, {
				padding: Util.paddingOptions
			});
		});

		let span = document.createElement("span");
		span.id = "status";
		span.textContent = "loading...";

		div.appendChild(span);

		this.#container = div;
		return this.#container;
	}

	onRemove() {
		this.#container.remove();
	}
}

class InfoText {
	#container;

	onAdd() {
		let textarea = document.createElement("textarea");
		textarea.id = "info";
		textarea.className = "mapboxgl-ctrl";
		textarea.readOnly = true;
		textarea.spellcheck = false;
		textarea.cols = 20;
		textarea.rows = 8;

		this.#container = textarea;
		return this.#container;
	}

	onRemove() {
		this.#container.remove();
	}
}

class PointsAppender {
	#map;
	#geoJson;

	#layoutPropsIndex = 0;
	#layoutProps = [
		{
			"icon-image": ["get", "icon"],
			"text-field": ["get", "text"],
		},
		{
			"icon-image": "inverted-triangle",
			"text-field": null,
		}
	];

	constructor(map, geoJson) {
		this.#map = map;
		this.#geoJson = geoJson;
	}

	async loadTriangle() {
		const id = "inverted-triangle";

		const color1 = "rgba(0 0 0 / 10%)";
		const color2 = "rgb(255 255 255)";

		let canvas = document.createElement("canvas");
		canvas.width = 37;
		canvas.height = 21;

		let context = canvas.getContext("2d", {
			alpha: true,
			desynchronized: true
		});

		context.lineJoin = "round";

		let path = new Path2D(`M 13 6 h 18 l -9 9 z`);

		context.strokeStyle = color1;
		context.lineWidth = 12;
		context.stroke(path);

		context.strokeStyle = color2;
		context.lineWidth = 4;
		context.stroke(path);

		context.fillStyle = color2;
		context.fill(path);

		let bitmap = await createImageBitmap(canvas);

		if (this.#map.hasImage(id)) {
			console.warn("Already loaded", id);
		} else {
			this.#map.addImage(id, bitmap, {pixelRatio: 2});
		}
	}

	loadImages() {
		this.loadTriangle();

		const color1 = "rgba(0 0 0 / 10%)";
		const color2 = "rgb(255 255 255)";

		for (let feature of this.#geoJson.features) {
			let filename = feature.properties.icon;

			this.#map.loadImage(filename, async (error, image) => {
				if (error) {
					console.error("Failed to load", error);
					return;
				}

				let aspectRatio = image.width / image.height;

				let boxWidth = 208;
				let boxHeight = Math.floor(boxWidth / aspectRatio);

				let canvasWidth = boxWidth;
				let canvasHeight = boxHeight + 19;

				let canvas = document.createElement("canvas");
				canvas.width = canvasWidth;
				canvas.height = canvasHeight;

				let context = canvas.getContext("2d", {
					alpha: true,
					desynchronized: true
				});

				context.lineJoin = "round";
				context.globalCompositeOperation = "source-over";

				context.lineWidth = 12;
				context.strokeStyle = color1;
				context.strokeRect(6, 6, boxWidth - 12, boxHeight - 12);

				context.strokeStyle = color2;
				context.strokeRect(10, 10, boxWidth - 20, boxHeight - 20);

				context.globalCompositeOperation = "destination-out";
				context.strokeStyle = color2;
				context.strokeRect(14, 14, boxWidth - 28, boxHeight - 28);
				context.fillStyle = color2;
				context.fillRect(14, 14, boxWidth - 28, boxHeight - 28);

				context.globalCompositeOperation = "destination-over";
				context.imageSmoothingQuality = "medium";
				context.drawImage(image,
					0, 0, image.width, image.height,
					8, 8, boxWidth - 16, boxHeight - 16
				);

				const path = new Path2D(`M 13 ${boxHeight + 4} h 18 l -9 9 z`);

				context.globalCompositeOperation = "source-over";
				context.strokeStyle = color1;
				context.lineWidth = 12;
				context.stroke(path);

				context.strokeStyle = color2;
				context.lineWidth = 4;
				context.stroke(path);

				context.fillStyle = color2;
				context.fill(path);

				context.clearRect(8, boxHeight - 4, 32, 4);
				context.fillStyle = color1;
				context.fillRect(8, boxHeight - 4, 32, 4);

				let bitmap = await createImageBitmap(canvas);

				if (this.#map.hasImage(filename)) {
					console.warn("Already loaded", filename);
				} else {
					this.#map.addImage(filename, bitmap, {pixelRatio: 2});
				}
			});
		}
	}

	layoutProps(first) {
		if (first === false) {
			this.#layoutPropsIndex++;
			this.#layoutPropsIndex %= this.#layoutProps.length;
		}

		let props = {};
		for (let [key, value] of Object.entries(this.#layoutProps[this.#layoutPropsIndex])) {
			if (value !== null || first === false) {
				props[key] = value;
			}
		}

		return props;
	}

	loadSourceAndLayer() {
		if (this.#map.getSource("points") === undefined) {
			this.#map.addSource("points", {
				type: "geojson",
				data: this.#geoJson
			});
		}

		if (this.#map.getLayer("points") === undefined) {
			let props = this.layoutProps(true);

			this.#map.addLayer({
				id: "points",
				type: "symbol",
				source: "points",
				paint: {
					"text-color": "rgb(255, 255, 255)",
					"text-halo-width": 1,
					"text-halo-color": "rgb(0, 0, 0)",
				},
				layout: {
					//"icon-image": ["get", "icon"],
					"icon-anchor": "bottom-left",
					"icon-offset": [-11, 2],
					"icon-allow-overlap": true,
					//"text-field": ["get", "text"],
					"text-font": ["Noto Sans CJK JP Bold"],
					"text-size": 12,
					"text-anchor": "bottom-left",
					"text-offset": [-0.4, -1.14],
					"text-optional": true,
					"text-allow-overlap": false,
					...props
				}
			});
		} else {
			this.#map.moveLayer("points");
		}
	}

	bindEventListeners() {
		this.#map.on("mouseenter", "points", () => {
			let canvas = this.#map.getCanvas();
			canvas.style.cursor = "pointer";
		});

		this.#map.on("mouseleave", "points", () => {
			let canvas = this.#map.getCanvas();
			canvas.style.cursor = "";
		});

		this.#map.on("click", "points", (event) => {
			let props = event.features[0].properties;

			let div = document.createElement("div");
			div.className = "modal";

			div.addEventListener("click", () => {
				div.remove();
			});

			let img = document.createElement("img");
			img.className = "fit";
			img.alt = props.text;

			if (props.hasOwnProperty("orig")) {
				img.src = props.orig;
			} else {
				img.src = props.icon;
			}

			div.appendChild(img);
			document.body.appendChild(div);
		});
	}
}

let divMap = document.getElementById("map");
if (divMap === null) {
	window.alert("map container does not exist");
	throw Error();
}

let params = new URLSearchParams(document.location.search);
let baseUrl = params.get("base");

if (baseUrl === null || baseUrl.match(/^\/[^/].*\/$/) === null) {
	window.alert("invalid base URL");
	throw Error();
}

let response = await fetch(baseUrl + "map.json");
let json = await response.json();

document.title = document.title + " " + json.name;

let devMode = params.get("dev") !== null;

let geoJson = Util.convertToGeoJson(json.points, baseUrl);
if (devMode) {
	//console.info(JSON.stringify(geoJson, null, "\t"));
}

let llbAway = new mapboxgl.LngLatBounds();
let llbNear = new mapboxgl.LngLatBounds();

for (let feature of geoJson.features) {
	if (feature.properties.away) {
		llbAway.extend(feature.geometry.coordinates);
	} else {
		llbNear.extend(feature.geometry.coordinates);
	}
}

let llbMerged = new mapboxgl.LngLatBounds();
llbMerged.extend(llbAway);
llbMerged.extend(llbNear);

json.copyrights.unshift(
	'<a href="/licenses.txt" target="_blank">Licenses</a>'
);

const map = new mapboxgl.Map({
	accessToken: divMap.dataset.token,
	bounds: llbNear,
	container: divMap,
	customAttribution: json.copyrights,
	fitBoundsOptions: {padding: Util.paddingOptions},
	language: "auto",
	//performanceMetricsCollection: false,
	style: Util.styles[0],
	worldview: "JP",
});

//map.showCollisionBoxes = true;

let appender = new PointsAppender(map, geoJson);
appender.bindEventListeners();
appender.loadImages();

map.on("load", () => {
	appender.loadSourceAndLayer();
});

map.on("idle", () => {
	let span = document.getElementById("status");
	if (span === null) {
		return;
	}

	if (map.getLayer("points") === undefined) {
		return;
	}

	let features = map.queryRenderedFeatures({layers: ["points"]});
	span.textContent = `${features.length} / ${geoJson.features.length}`;
});

/*
map.addControl(
	new mapboxgl.ScaleControl(),
	"top-left"
);
*/

map.addControl(
	new mapboxgl.GeolocateControl({
		positionOptions: {
			enableHighAccuracy: true
		},
		showUserHeading: true,
		trackUserLocation: true,
	}),
	"top-right"
);

map.addControl(
	new mapboxgl.NavigationControl({
		visualizePitch: true
	}),
	"bottom-right"
);

map.addControl(
	new DisplayAllControl(llbMerged),
	"bottom-right"
);

map.addControl(
	new MapStyleControl(Util.styles, appender),
	"bottom-right"
);

map.addControl(
	new TogglePicturesControl(appender),
	"bottom-right"
);

map.addControl(
	new StatusText(),
	"top-left"
);

if (devMode) {
	map.addControl(
		new Button1Control(),
		"top-right"
	);

	map.addControl(
		new Button2Control(),
		"top-right"
	);

	map.addControl(
		new Button3Control(),
		"top-right"
	);

	map.addControl(
		new InfoText(),
		"bottom-left"
	);
}

if (devMode) {
	let div = document.createElement("div");
	div.className = "square";

	let marker = new mapboxgl.Marker({
		anchor: "top-left",
		draggable: true,
		element: div,
	});

	marker.setLngLat(map.getCenter());
	marker.addTo(map);

	marker.on("dragend", (event) => {
		let ll = Util.goodLngLat(map, event.target.getLngLat());
		let element = document.getElementById("info");
		element.value = `${ll.lat}, ${ll.lng}`;
		element.select();
	});

	map.on("contextmenu", (event) => {
		marker.setLngLat(event.lngLat);
		let ll = Util.goodLngLat(map, event.lngLat);
		let element = document.getElementById("info");
		element.value = `${ll.lat}, ${ll.lng}`;
		element.select();
	});
}
