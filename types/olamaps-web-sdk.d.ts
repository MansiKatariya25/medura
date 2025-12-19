/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "olamaps-web-sdk" {
  export class OlaMaps {
    constructor(config: { apiKey: string; mode?: "2d" | "3d"; threedTileset?: string });
    init(options: {
      style: string;
      container: string | HTMLElement;
      center?: [number, number];
      zoom?: number;
      pitch?: number;
      bearing?: number;
      maxPitch?: number;
    }): any;
    addMarker(options?: {
      element?: HTMLElement;
      offset?: [number, number];
      anchor?: string;
      color?: string;
      draggable?: boolean;
    }): any;
    addPopup(options?: { offset?: [number, number]; anchor?: string }): any;
    addGeolocateControls(options?: {
      positionOptions?: { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number };
      trackUserLocation?: boolean;
    }): any;
  }
}
