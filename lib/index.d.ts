export declare enum DefaultMaps {
    Auto = 0,
    Google = 1,
    Apple = 2
}
export declare enum MapTypes {
    RoadMap = "roadmap",
    Satellite = "satellite",
    Hybrid = "hybrid",
    Terrain = "terrain"
}
export interface Coordinate {
    latitude: number;
    longitude: number;
}
export interface Marker {
    map: DefaultMaps;
    options: any;
    coordinate?: Coordinate;
    mapMarkerObject?: any;
}
export interface WrapperConfiguration {
    mapContainer: Element | any;
    mapOptions?: {
        zoom?: number;
        coordinate?: Coordinate;
        mapType?: MapTypes;
        languageCode?: string;
    };
    google: {
        apiKey: string;
    };
    apple: {
        mapIdKey: string;
        cert: any;
        teamId: string;
    } | {
        token: string;
    };
}
export declare class MapsWrapper {
    renderedMap: DefaultMaps;
    private configuration;
    map?: any;
    markers: Array<Marker>;
    googleSrc: string;
    appleSrc: string;
    constructor(configuration?: WrapperConfiguration, defaultMaps?: DefaultMaps);
    addListener(eventName: string, callBack: (data?: any) => void): void;
    removeListener(eventName: string): void;
    isSafari(): boolean;
    private getAppleToken;
    private loadGoogleMap;
    private loadAppleMap;
    private addScriptTag;
    loadScript(callBack?: () => void): void;
    loadMap(shouldLoadScript?: boolean): void;
    private addGoogleMarker;
    private addAppleMarker;
    addMarker(marker: Omit<Marker, 'mapMarkerObject'>): void;
}
