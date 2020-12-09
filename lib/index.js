"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapsWrapper = exports.MapTypes = exports.DefaultMaps = void 0;
var jsonwebtoken_1 = require("jsonwebtoken");
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
var MapsWrapper = /** @class */ (function () {
    function MapsWrapper(configuration, defaultMaps) {
        if (configuration === void 0) { configuration = {}; }
        if (defaultMaps === void 0) { defaultMaps = DefaultMaps.Auto; }
        this.renderedMap = DefaultMaps.Google;
        this.markers = [];
        this.googleSrc = 'https://maps.googleapis.com/maps/api/js';
        this.appleSrc = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
        this.configuration = configuration;
        if (defaultMaps == DefaultMaps.Auto && this.isSafari()) {
            this.renderedMap = DefaultMaps.Apple;
        }
    }
    MapsWrapper.prototype.addListener = function (eventName, callBack) {
        var _a, _b;
        if (this.renderedMap == DefaultMaps.Apple) {
            (_a = this.map) === null || _a === void 0 ? void 0 : _a.addEventListener(eventName, callBack);
        }
        else {
            (_b = this.map) === null || _b === void 0 ? void 0 : _b.addListener(eventName, callBack);
        }
    };
    MapsWrapper.prototype.removeListener = function (eventName) {
        var _a, _b;
        if (this.renderedMap == DefaultMaps.Apple) {
            (_a = this.map) === null || _a === void 0 ? void 0 : _a.removeEventListener(eventName);
        }
        else {
            (_b = this.map) === null || _b === void 0 ? void 0 : _b.removeListener(eventName);
        }
    };
    MapsWrapper.prototype.isSafari = function () {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    };
    MapsWrapper.prototype.getAppleToken = function () {
        var conf = (this.configuration.apple || {});
        if (conf.mapIdKey) {
            var header = {
                alg: 'ES256',
                typ: 'JWT',
                kid: conf.mapIdKey
            };
            var payload = {
                iss: conf.teamId,
                iat: Date.now() / 1000,
                exp: (Date.now() / 1000) + 15778800,
            };
            var token = jsonwebtoken_1.sign(payload, conf.cert, { header: header });
            return token || '';
        }
        return (conf.token) ? conf.token : '';
    };
    MapsWrapper.prototype.loadGoogleMap = function () {
        var _a, _b, _c, _d, _e, _f;
        var mapOptions = {
            zoom: ((_a = this.configuration.mapOptions) === null || _a === void 0 ? void 0 : _a.zoom) || 15,
        };
        var configurationLatitude = (_c = (_b = this.configuration.mapOptions) === null || _b === void 0 ? void 0 : _b.coordinate) === null || _c === void 0 ? void 0 : _c.latitude;
        var configurationLongitude = (_e = (_d = this.configuration.mapOptions) === null || _d === void 0 ? void 0 : _d.coordinate) === null || _e === void 0 ? void 0 : _e.longitude;
        if (configurationLatitude) {
            var latLng = new google.maps.LatLng(configurationLatitude, configurationLongitude);
            mapOptions.center = latLng;
        }
        var configurationMapType = (_f = this.configuration.mapOptions) === null || _f === void 0 ? void 0 : _f.mapType;
        if (configurationMapType) {
            var mapType = google.maps.MapTypeId.ROADMAP;
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
    };
    MapsWrapper.prototype.loadAppleMap = function () {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g;
        mapkit.init({
            authorizationCallback: function (done) {
                done(_this.getAppleToken());
            },
            language: ((_a = this.configuration.mapOptions) === null || _a === void 0 ? void 0 : _a.languageCode) || 'en'
        });
        var mapOptions = {};
        var configurationLatitude = (_c = (_b = this.configuration.mapOptions) === null || _b === void 0 ? void 0 : _b.coordinate) === null || _c === void 0 ? void 0 : _c.latitude;
        var configurationLongitude = (_e = (_d = this.configuration.mapOptions) === null || _d === void 0 ? void 0 : _d.coordinate) === null || _e === void 0 ? void 0 : _e.longitude;
        if (configurationLatitude) {
            var center = new mapkit.Coordinate(configurationLatitude, configurationLongitude);
            var zoom = 0.015;
            if ((_f = this.configuration.mapOptions) === null || _f === void 0 ? void 0 : _f.zoom) {
                zoom = ((_g = this.configuration.mapOptions) === null || _g === void 0 ? void 0 : _g.zoom) / 1000;
            }
            var span = new mapkit.CoordinateSpan(zoom, zoom);
            var region = new mapkit.CoordinateRegion(center, span);
            mapOptions.region = region;
        }
        this.map = new mapkit.Map("map", mapOptions);
    };
    MapsWrapper.prototype.addScriptTag = function (src, callBack) {
        var script_tag = document.createElement("script");
        script_tag.setAttribute("type", "text/javascript");
        script_tag.setAttribute("src", src);
        if (callBack) {
            script_tag.onload = callBack;
        }
        ;
        var headElm = document.getElementsByTagName("head");
        ((headElm ? headElm[0] : undefined) || document.documentElement).appendChild(script_tag);
    };
    MapsWrapper.prototype.loadScript = function (callBack) {
        var src = (this.renderedMap == DefaultMaps.Apple) ? this.appleSrc : this.googleSrc + '?key=' + this.configuration.google.apiKey;
        this.addScriptTag(src, callBack);
    };
    MapsWrapper.prototype.loadMap = function (shouldLoadScript) {
        if (shouldLoadScript === void 0) { shouldLoadScript = false; }
        this.markers = [];
        var loadMapFunc = (this.renderedMap == DefaultMaps.Apple) ?
            this.loadAppleMap :
            this.loadGoogleMap;
        if (shouldLoadScript) {
            this.loadScript(loadMapFunc);
        }
        else {
            loadMapFunc();
        }
    };
    MapsWrapper.prototype.addGoogleMarker = function (marker) {
        var markerObj = new google.maps.Marker(marker.options);
        markerObj.setMap(this.map);
        marker.mapMarkerObject = markerObj;
        this.markers.push(marker);
    };
    MapsWrapper.prototype.addAppleMarker = function (marker) {
        var _a, _b, _c, _d;
        if (!marker.coordinate) {
            marker.coordinate = (_a = this.configuration.mapOptions) === null || _a === void 0 ? void 0 : _a.coordinate;
        }
        var annotation = new mapkit.MarkerAnnotation(new mapkit.Coordinate((_b = marker.coordinate) === null || _b === void 0 ? void 0 : _b.latitude, (_c = marker.coordinate) === null || _c === void 0 ? void 0 : _c.longitude), marker.options);
        var allAppleMarkers = this.markers.filter(function (m) { return m.map == DefaultMaps.Apple; }).map(function (m) { return m.mapMarkerObject; });
        allAppleMarkers.push(annotation);
        (_d = this.map) === null || _d === void 0 ? void 0 : _d.showItems(allAppleMarkers);
        marker.mapMarkerObject = annotation;
        this.markers.push(marker);
    };
    MapsWrapper.prototype.addMarker = function (marker) {
        (marker.map == DefaultMaps.Apple) ?
            this.addAppleMarker(marker) :
            this.addGoogleMarker(marker);
    };
    return MapsWrapper;
}());
exports.MapsWrapper = MapsWrapper;
