const version = "0.95a";

class Util {
	static styles = [
		// Mapbox Standard
		{
			url: "mapbox://styles/mapbox/standard",
			config: {
				basemap: {
					font: "Noto Sans CJK JP",
					theme: "faded",
					lightPreset: "night",
					show3dObjects: false,
				}
			}
		},

		// Mapbox Standard Satellite
		{
			url: "mapbox://styles/mapbox/standard-satellite",
			config: {
				basemap: {
					font: "Noto Sans CJK JP",
					lightPreset: "dusk",
				}
			}
		}
	];

	static paddingOptions = {
		top: 96,
		left: 16,
		right: 96,
		bottom: 32,
	};

	static labelFromUrl(url) {
		const filename = url.split("/").pop();
		const filenameNoExts = filename.split(".", 1).shift();

		let category = null, numseq = null;
		let hour = null, minute = null, second = null;

		const matches = filenameNoExts.matchAll(/([a-z]+)([0-9]+)/gs);

		for (const match of matches) {
			const prefix = match[1];
			const numval = match[2];

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
				groupLabel = `${numseq}話 `;
				break;
			default:
				groupLabel = `${category.toLowerCase()}${numseq}·`;
				break;
		}

		if (hour === null) {
			const padsec = second.padStart(2, "0");
			return `${groupLabel}${minute}:${padsec}`;
		} else {
			const padsec = second.padStart(2, "0");
			const padmin = minute.padStart(2, "0");
			return `${groupLabel}${hour}:${padmin}:${padsec}`;
		}
	}

	static goodLngLat(map, ll) {
		const zoom = map.getZoom().toFixed(2);
		const precision = Math.ceil((zoom * Math.LN2 + Math.log(512 / 360 / 0.5)) / Math.LN10);

		const lng = ll.lng.toFixed(precision);
		const lat = ll.lat.toFixed(precision);

		return {lng: lng, lat: lat, zoom: zoom};
	}

	static positionText(map, title) {
		const center = map.getCenter();
		const ll = this.goodLngLat(map, center);

		const bearing = map.getBearing().toFixed(1);
		const pitch = map.getPitch().toFixed(0);

		// ${ll.zoom}/${ll.lat}/${ll.lng}/${bearing}/${pitch}
		const text = `// ${title}
"center": {"lat": ${ll.lat}, "lng": ${ll.lng}},
"zoom": ${ll.zoom},
"bearing": ${bearing},
"pitch": ${pitch}`;

		return text;
	}

	static convertToGeoJson(points, baseUrl) {
		const root = {
			type: "FeatureCollection",
			features: []
		};

		for (const point of points) {
			if (point["latlng"].length < 2) {
				continue;
			}

			const children = {
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

			if (Object.hasOwn(point, "text")) {
				children.properties.text = point["text"];
			} else {
				children.properties.text = this.labelFromUrl(point["icon"]);
			}

			if (Object.hasOwn(point, "orig")) {
				children.properties.orig = baseUrl + point["orig"];
			}

			if (Object.hasOwn(point, "away")) {
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

		const div = document.createElement("div");
		div.className = "mapboxgl-ctrl";

		const button = document.createElement("span");
		button.className = "button";
		button.textContent = "Show Pos";
		button.addEventListener("click", () => {
			const element = document.getElementById("info");
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

		const div = document.createElement("div");
		div.className = "mapboxgl-ctrl";

		const button = document.createElement("span");
		button.className = "button";
		button.textContent = "Move";
		button.addEventListener("click", () => {
			this.#map.flyTo({
				duration: 10000,
				center: {lat: 34.420173, lng: 134.056573},
				zoom: 16.40,
				bearing: 122.3,
				pitch: 60,
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

		const div = document.createElement("div");
		div.className = "mapboxgl-ctrl";

		const button = document.createElement("span");
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

class ShowAllControl {
	#map;
	#container;
	#lngLatBounds;

	constructor(lngLatBounds) {
		this.#lngLatBounds = lngLatBounds;
	}

	onAdd(map) {
		this.#map = map;

		const div = document.createElement("div");
		div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

		const button = document.createElement("button");
		button.type = "button";

		const icon = document.createElement("span");
		icon.className = "mapboxgl-ctrl-icon icon-dialpad";
		icon.title = "show all markers";

		button.addEventListener("click", () => {
			this.#map.fitBounds(this.#lngLatBounds, {
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

		const div = document.createElement("div");
		div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

		const button = document.createElement("button");
		button.type = "button";

		const icon = document.createElement("span");
		icon.className = "mapboxgl-ctrl-icon icon-layers";
		icon.title = "change map style";

		button.addEventListener("click", () => {
			this.#stylesIndex++;
			this.#stylesIndex %= this.#styles.length;
			this.#map.setStyle(
				this.#styles[this.#stylesIndex].url,
				{config: this.#styles[this.#stylesIndex].config}
			);

			const span = document.getElementById("status");
			span.textContent = "loading...";

			this.#appender.loadImages();
			this.#map.once("idle", () => {
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

class ImageOnOffControl {
	#map;
	#container;
	#appender;

	constructor(appender) {
		this.#appender = appender;
	}

	onAdd(map) {
		this.#map = map;

		const div = document.createElement("div");
		div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

		const button = document.createElement("button");
		button.type = "button";

		const icon = document.createElement("span");
		icon.className = "mapboxgl-ctrl-icon icon-pictures";
		icon.title = "image on/off";

		button.addEventListener("click", () => {
			const props = this.#appender.getLayoutProps(false);
			for (const [key, value] of Object.entries(props)) {
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

		const div = document.createElement("div");
		div.className = "mapboxgl-ctrl status";

		div.addEventListener("click", () => {
			const features = this.#map.queryRenderedFeatures({layers: ["points"]});

			const llb = new mapboxgl.LngLatBounds();
			for (const feature of features) {
				llb.extend(feature.geometry.coordinates);
			}

			this.#map.fitBounds(llb, {
				padding: Util.paddingOptions
			});
		});

		const span = document.createElement("span");
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
		const textarea = document.createElement("textarea");
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

		if (this.#map.hasImage(id)) {
			console.warn("Already loaded", id);
			return;
		}

		const color1 = "rgba(0 0 0 / 10%)";
		const color2 = "rgb(255 255 255)";

		const canvas = document.createElement("canvas");
		canvas.width = 37;
		canvas.height = 21;

		const context = canvas.getContext("2d", {
			alpha: true,
			desynchronized: true
		});

		context.lineJoin = "round";

		const path = new Path2D(`M 13 6 h 18 l -9 9 z`);

		context.strokeStyle = color1;
		context.lineWidth = 12;
		context.stroke(path);

		context.strokeStyle = color2;
		context.lineWidth = 4;
		context.stroke(path);

		context.fillStyle = color2;
		context.fill(path);

		const bitmap = await createImageBitmap(canvas);
		this.#map.addImage(id, bitmap, {pixelRatio: 2});
	}

	loadImages() {
		this.loadTriangle();

		const color1 = "rgba(0 0 0 / 10%)";
		const color2 = "rgb(255 255 255)";

		for (const feature of this.#geoJson.features) {
			const filename = feature.properties.icon;

			this.#map.loadImage(filename, async (error, image) => {
				if (error) {
					console.error("Failed to load", error);
					return;
				}

				if (this.#map.hasImage(filename)) {
					console.warn("Already loaded", filename);
					return;
				}

				const aspectRatio = image.width / image.height;

				const boxWidth = 208;
				const boxHeight = Math.floor(boxWidth / aspectRatio);

				const canvasWidth = boxWidth;
				const canvasHeight = boxHeight + 19;

				const canvas = document.createElement("canvas");
				canvas.width = canvasWidth;
				canvas.height = canvasHeight;

				const context = canvas.getContext("2d", {
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

				const bitmap = await createImageBitmap(canvas);
				this.#map.addImage(filename, bitmap, {pixelRatio: 2});
			});
		}
	}

	getLayoutProps(first) {
		if (first === false) {
			this.#layoutPropsIndex++;
			this.#layoutPropsIndex %= this.#layoutProps.length;
		}

		const props = {};
		for (const [key, value] of Object.entries(this.#layoutProps[this.#layoutPropsIndex])) {
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
			const props = this.getLayoutProps(true);

			this.#map.addLayer({
				id: "points",
				type: "symbol",
				slot: "top",
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
			const canvas = this.#map.getCanvas();
			canvas.style.cursor = "pointer";
		});

		this.#map.on("mouseleave", "points", () => {
			const canvas = this.#map.getCanvas();
			canvas.style.cursor = "";
		});

		this.#map.on("click", "points", (event) => {
			const props = event.features[0].properties;

			const div = document.createElement("div");
			div.className = "modal";

			div.addEventListener("click", () => {
				div.remove();
			});

			const img = document.createElement("img");
			img.className = "fit";
			img.alt = props.text;

			if (Object.hasOwn(props, "orig")) {
				img.src = props.orig;
			} else {
				img.src = props.icon;
			}

			div.appendChild(img);
			document.body.appendChild(div);
		});
	}
}

const divMap = document.getElementById("map");
if (divMap === null) {
	window.alert("no map container");
	throw Error();
}

const params = new URLSearchParams(document.location.search);
const baseUrl = params.get("base");

if (baseUrl === null || baseUrl.match(/^\/[^/].*\/$/) === null) {
	window.alert("invalid base URL");
	throw Error();
}

const response = await fetch(baseUrl + "map.json");
const json = await response.json();

document.title = document.title + " " + json.name;

const devMode = params.get("dev") !== null;

const geoJson = Util.convertToGeoJson(json.points, baseUrl);
if (devMode) {
	//console.info(JSON.stringify(geoJson, null, "\t"));
}

const llbAway = new mapboxgl.LngLatBounds();
const llbNear = new mapboxgl.LngLatBounds();

for (const feature of geoJson.features) {
	if (feature.properties.away) {
		llbAway.extend(feature.geometry.coordinates);
	} else {
		llbNear.extend(feature.geometry.coordinates);
	}
}

const llbMerged = new mapboxgl.LngLatBounds();
llbMerged.extend(llbAway);
llbMerged.extend(llbNear);

json.copyrights.unshift(
	'<a href="/licenses.txt" target="_blank">Licenses</a>'
);

const map = new mapboxgl.Map({
	accessToken: divMap.dataset.token,
	bounds: llbNear,
	config: Util.styles[0].config,
	container: divMap,
	customAttribution: json.copyrights,
	fitBoundsOptions: {padding: Util.paddingOptions},
	language: "auto",
	//performanceMetricsCollection: false,
	style: Util.styles[0].url,
	worldview: "JP",
});

//map.showCollisionBoxes = true;

const appender = new PointsAppender(map, geoJson);
appender.bindEventListeners();
appender.loadImages();

map.once("load", () => {
	appender.loadSourceAndLayer();
});

map.on("idle", () => {
	const span = document.getElementById("status");
	if (span === null) {
		return;
	}

	if (map.getLayer("points") === undefined) {
		return;
	}

	const features = map.queryRenderedFeatures({layers: ["points"]});
	span.textContent = `${features.length} / ${geoJson.features.length}`;
});

/*
map.addControl(
	new mapboxgl.ScaleControl(),
	"bottom-left"
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
	new ShowAllControl(llbMerged),
	"bottom-right"
);

map.addControl(
	new MapStyleControl(Util.styles, appender),
	"bottom-right"
);

map.addControl(
	new ImageOnOffControl(appender),
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
	const div = document.createElement("div");
	div.className = "square";

	const marker = new mapboxgl.Marker({
		anchor: "top-left",
		draggable: true,
		element: div,
	});

	marker.setLngLat(map.getCenter());
	marker.addTo(map);

	marker.on("dragend", (event) => {
		const ll = Util.goodLngLat(map, event.target.getLngLat());
		const element = document.getElementById("info");
		element.value = `${ll.lat}, ${ll.lng}`;
		element.select();
	});

	map.on("contextmenu", (event) => {
		marker.setLngLat(event.lngLat);
		const ll = Util.goodLngLat(map, event.lngLat);
		const element = document.getElementById("info");
		element.value = `${ll.lat}, ${ll.lng}`;
		element.select();
	});
}
