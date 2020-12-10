"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapsWrapper = exports.MapTypes = exports.DefaultMaps = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
var DefaultMaps;
(function (DefaultMaps) {
    DefaultMaps[DefaultMaps["Auto"] = 0] = "Auto";
    DefaultMaps[DefaultMaps["Google"] = 1] = "Google";
    DefaultMaps[DefaultMaps["Apple"] = 2] = "Apple";
})(DefaultMaps = exports.DefaultMaps || (exports.DefaultMaps = {}));
var MapTypes;
(function (MapTypes) {
    MapTypes["RoadMap"] = "roadmap";
    MapTypes["Satellite"] = "satellite";
    MapTypes["Hybrid"] = "hybrid";
    MapTypes["Terrain"] = "terrain";
})(MapTypes = exports.MapTypes || (exports.MapTypes = {}));
class MapsWrapper {
    constructor(configuration = {}, defaultMaps = DefaultMaps.Auto) {
        this.renderedMap = DefaultMaps.Google;
        this.markers = [];
        this.googleSrc = 'https://maps.googleapis.com/maps/api/js';
        this.appleSrc = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
        this.configuration = configuration;
        if (defaultMaps == DefaultMaps.Auto && this.isSafari()) {
            this.renderedMap = DefaultMaps.Apple;
        }
    }
    addListener(eventName, callBack) {
        var _a, _b;
        if (this.renderedMap == DefaultMaps.Apple) {
            (_a = this.map) === null || _a === void 0 ? void 0 : _a.addEventListener(eventName, callBack);
        }
        else {
            (_b = this.map) === null || _b === void 0 ? void 0 : _b.addListener(eventName, callBack);
        }
    }
    removeListener(eventName) {
        var _a, _b;
        if (this.renderedMap == DefaultMaps.Apple) {
            (_a = this.map) === null || _a === void 0 ? void 0 : _a.removeEventListener(eventName);
        }
        else {
            (_b = this.map) === null || _b === void 0 ? void 0 : _b.removeListener(eventName);
        }
    }
    isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }
    getAppleToken() {
        const conf = (this.configuration.apple || {});
        if (conf.mapIdKey) {
            const header = {
                alg: 'ES256',
                typ: 'JWT',
                kid: conf.mapIdKey
            };
            const payload = {
                iss: conf.teamId,
                iat: Date.now() / 1000,
                exp: (Date.now() / 1000) + 15778800,
            };
            const token = jsonwebtoken_1.sign(payload, conf.cert, { header: header });
            return token || '';
        }
        return (conf.token) ? conf.token : '';
    }
    loadGoogleMap() {
        var _a, _b, _c, _d, _e, _f;
        let mapOptions = {
            zoom: ((_a = this.configuration.mapOptions) === null || _a === void 0 ? void 0 : _a.zoom) || 15,
        };
        const configurationLatitude = (_c = (_b = this.configuration.mapOptions) === null || _b === void 0 ? void 0 : _b.coordinate) === null || _c === void 0 ? void 0 : _c.latitude;
        const configurationLongitude = (_e = (_d = this.configuration.mapOptions) === null || _d === void 0 ? void 0 : _d.coordinate) === null || _e === void 0 ? void 0 : _e.longitude;
        if (configurationLatitude) {
            let latLng = new google.maps.LatLng(configurationLatitude, configurationLongitude);
            mapOptions.center = latLng;
        }
        const configurationMapType = (_f = this.configuration.mapOptions) === null || _f === void 0 ? void 0 : _f.mapType;
        if (configurationMapType) {
            let mapType = google.maps.MapTypeId.ROADMAP;
            switch (configurationMapType) {
                case MapTypes.Satellite:
                    mapType = google.maps.MapTypeId.SATELLITE;
                    break;
                case MapTypes.Hybrid:
                    mapType = google.maps.MapTypeId.HYBRID;
                    break;
                case MapTypes.Terrain:
                    mapType = google.maps.MapTypeId.TERRAIN;
                    break;
            }
            mapOptions.mapTypeId = mapType;
        }
        this.map = new google.maps.Map(this.configuration.mapContainer, mapOptions);
    }
    loadAppleMap() {
        var _a, _b, _c, _d, _e, _f, _g;
        mapkit.init({
            authorizationCallback: (done) => {
                done(this.getAppleToken());
            },
            language: ((_a = this.configuration.mapOptions) === null || _a === void 0 ? void 0 : _a.languageCode) || 'en'
        });
        let mapOptions = {};
        const configurationLatitude = (_c = (_b = this.configuration.mapOptions) === null || _b === void 0 ? void 0 : _b.coordinate) === null || _c === void 0 ? void 0 : _c.latitude;
        const configurationLongitude = (_e = (_d = this.configuration.mapOptions) === null || _d === void 0 ? void 0 : _d.coordinate) === null || _e === void 0 ? void 0 : _e.longitude;
        if (configurationLatitude) {
            const center = new mapkit.Coordinate(configurationLatitude, configurationLongitude);
            let zoom = 0.015;
            if ((_f = this.configuration.mapOptions) === null || _f === void 0 ? void 0 : _f.zoom) {
                zoom = ((_g = this.configuration.mapOptions) === null || _g === void 0 ? void 0 : _g.zoom) / 1000;
            }
            const span = new mapkit.CoordinateSpan(zoom, zoom);
            const region = new mapkit.CoordinateRegion(center, span);
            mapOptions.region = region;
        }
        this.map = new mapkit.Map("map", mapOptions);
    }
    addScriptTag(src, callBack) {
        const script_tag = document.createElement(`script`);
        script_tag.setAttribute("type", "text/javascript");
        script_tag.setAttribute("src", src);
        if (callBack) {
            script_tag.onload = callBack;
        }
        ;
        const headElm = document.getElementsByTagName("head");
        ((headElm ? headElm[0] : undefined) || document.documentElement).appendChild(script_tag);
    }
    loadScript(callBack) {
        const src = (this.renderedMap == DefaultMaps.Apple) ? this.appleSrc : this.googleSrc + '?key=' + this.configuration.google.apiKey;
        this.addScriptTag(src, callBack);
    }
    loadMap(shouldLoadScript = false) {
        this.markers = [];
        const loadMapFunc = (this.renderedMap == DefaultMaps.Apple) ?
            this.loadAppleMap :
            this.loadGoogleMap;
        if (shouldLoadScript) {
            this.loadScript(loadMapFunc);
        }
        else {
            loadMapFunc();
        }
    }
    addGoogleMarker(marker) {
        const markerObj = new google.maps.Marker(marker.options);
        markerObj.setMap(this.map);
        marker.mapMarkerObject = markerObj;
        this.markers.push(marker);
    }
    addAppleMarker(marker) {
        var _a, _b, _c, _d;
        if (!marker.coordinate) {
            marker.coordinate = (_a = this.configuration.mapOptions) === null || _a === void 0 ? void 0 : _a.coordinate;
        }
        const annotation = new mapkit.MarkerAnnotation(new mapkit.Coordinate((_b = marker.coordinate) === null || _b === void 0 ? void 0 : _b.latitude, (_c = marker.coordinate) === null || _c === void 0 ? void 0 : _c.longitude), marker.options);
        const allAppleMarkers = this.markers.filter(m => m.map == DefaultMaps.Apple).map(m => m.mapMarkerObject);
        allAppleMarkers.push(annotation);
        (_d = this.map) === null || _d === void 0 ? void 0 : _d.showItems(allAppleMarkers);
        marker.mapMarkerObject = annotation;
        this.markers.push(marker);
    }
    addMarker(marker) {
        (marker.map == DefaultMaps.Apple) ?
            this.addAppleMarker(marker) :
            this.addGoogleMarker(marker);
    }
}
exports.MapsWrapper = MapsWrapper;
