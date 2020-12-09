import { sign } from "jsonwebtoken";
declare var google: any;
declare var mapkit: any;

export enum DefaultMaps {
    Auto = 0,
    Google = 1,
    Apple = 2
}

export enum MapTypes {
    RoadMap = "roadmap",
    Satellite = "satellite",
    Hybrid = "hybrid",
    Terrain = "terrain"
}

export interface Coordinate {latitude: number, longitude: number}


export interface Marker{
    map: DefaultMaps,
    options: any,
    coordinate?: Coordinate,
    mapMarkerObject?: any
}

export interface WrapperConfiguration {
    mapContainer: Element | any,
    mapOptions?: {
        zoom?: number,
        coordinate?: Coordinate,
        mapType?: MapTypes,
        languageCode?: string
    },
    google: {apiKey: string},
    apple: {mapIdKey: string, cert: any, teamId: string} | {token: string }
}

export class MapsWrapper {

    renderedMap = DefaultMaps.Google;
    private configuration: WrapperConfiguration;
    map?: any;
    markers: Array<Marker> = [];
    googleSrc = 'https://maps.googleapis.com/maps/api/js';
    appleSrc = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';

    constructor(configuration: WrapperConfiguration = {} as any, defaultMaps: DefaultMaps = DefaultMaps.Auto) {
        this.configuration = configuration;
        if (defaultMaps == DefaultMaps.Auto && this.isSafari()){
            this.renderedMap = DefaultMaps.Apple;
        }
    }

    addListener(
        eventName: string, 
        callBack: (data?: any) => void
    ){
        if(this.renderedMap == DefaultMaps.Apple){
            this.map?.addEventListener(eventName, callBack);
        }else{
            this.map?.addListener(eventName, callBack);
        }
    }

    removeListener(eventName: string){
        if(this.renderedMap == DefaultMaps.Apple){
            this.map?.removeEventListener(eventName);
        }else{
            this.map?.removeListener(eventName);
        }
    }

    isSafari(): boolean{
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }

    private getAppleToken(): string{
        const conf = (this.configuration.apple || {}) as any;
        if(conf.mapIdKey){
            const header = {
                alg: 'ES256',
                typ: 'JWT',
                kid: conf.mapIdKey
              }
            
              const payload = {
                iss: conf.teamId,
                iat: Date.now() / 1000,
                exp: (Date.now() / 1000) + 15778800,
              }
            const token = sign(payload, conf.cert, { header: header } );
            return token || '';
        }
        return (conf.token) ? (conf.token as string) : '';
    }

    private loadGoogleMap(){
        let mapOptions: any = {
            zoom: this.configuration.mapOptions?.zoom || 15,
        }

        const configurationLatitude = this.configuration.mapOptions?.coordinate?.latitude
        const configurationLongitude = this.configuration.mapOptions?.coordinate?.longitude
        if(configurationLatitude){
            let latLng = new google.maps.LatLng(configurationLatitude, configurationLongitude);
            mapOptions.center = latLng;
        }

        const configurationMapType = this.configuration.mapOptions?.mapType;
        if(configurationMapType){
            let mapType = google.maps.MapTypeId.ROADMAP;
            switch (configurationMapType) {
                case MapTypes.Satellite: mapType = google.maps.MapTypeId.SATELLITE; break;
                case MapTypes.Hybrid: mapType = google.maps.MapTypeId.HYBRID; break;
                case MapTypes.Terrain: mapType = google.maps.MapTypeId.TERRAIN; break;
            }

            mapOptions.mapTypeId = mapType;
        }

        this.map = new google.maps.Map(this.configuration.mapContainer, mapOptions);
    }

    private loadAppleMap() {
        mapkit.init({
            authorizationCallback: (done: any) => {
                done(this.getAppleToken());
            },
            language: this.configuration.mapOptions?.languageCode || 'en'
        });

        let mapOptions: any = {};

        const configurationLatitude = this.configuration.mapOptions?.coordinate?.latitude
        const configurationLongitude = this.configuration.mapOptions?.coordinate?.longitude
        if(configurationLatitude){
            const center = new mapkit.Coordinate(configurationLatitude, configurationLongitude);
            
            let zoom = 0.015;
            if(this.configuration.mapOptions?.zoom){
                zoom = this.configuration.mapOptions?.zoom / 1000;
            }
            const span = new mapkit.CoordinateSpan(zoom, zoom);
            const region = new mapkit.CoordinateRegion(center, span);
            mapOptions.region = region;
        }
        
        this.map = new mapkit.Map("map", mapOptions);
    }

    private addScriptTag(src: string, callBack?: ()=> void){
        const script_tag = document.createElement(`script`);
        script_tag.setAttribute("type","text/javascript");
        script_tag.setAttribute("src", src);
        if(callBack){ script_tag.onload = callBack };
        const headElm = document.getElementsByTagName("head");
        ((headElm ? headElm[0] : undefined) || document.documentElement).appendChild(script_tag);
    }

    loadScript(callBack?: ()=> void){
        const src = (this.renderedMap == DefaultMaps.Apple) ? this.appleSrc : this.googleSrc+'?key='+this.configuration.google.apiKey;
        this.addScriptTag(src, callBack);
    }

    loadMap(shouldLoadScript = false){
        this.markers = [];
        const loadMapFunc = 
            (this.renderedMap == DefaultMaps.Apple) ? 
                this.loadAppleMap :
                this.loadGoogleMap;

        if(shouldLoadScript){
            this.loadScript(loadMapFunc);
        }else{
            loadMapFunc();
        }
    }


    private addGoogleMarker(marker: Marker) {
        const markerObj = new google.maps.Marker(marker.options);
        markerObj.setMap(this.map);
        marker.mapMarkerObject = markerObj;
        this.markers.push(marker);
    }

    private addAppleMarker(marker: Marker) {
        if(!marker.coordinate){
            marker.coordinate = this.configuration.mapOptions?.coordinate;
        }
        const annotation = new mapkit.MarkerAnnotation(
            new mapkit.Coordinate(marker.coordinate?.latitude, marker.coordinate?.longitude), 
            marker.options
        );
        const allAppleMarkers = this.markers.filter(m => m.map == DefaultMaps.Apple).map(m=> m.mapMarkerObject);
        allAppleMarkers.push(annotation);
        this.map?.showItems(allAppleMarkers);

        marker.mapMarkerObject = annotation;
        this.markers.push(marker);
    }

    addMarker(marker: Omit<Marker, 'mapMarkerObject'>){
        (marker.map == DefaultMaps.Apple)   ?
            this.addAppleMarker(marker)     :
            this.addGoogleMarker(marker);
    }
}
