import * as THREE from 'three';
//irradiance buffer object
class IBO {
    constructor() {
        this.camera;
        this.gbuffer;
        this.irradiance;
    }
    update (camera, gbuffer, irradiance) {
        this.camera.copy(camera, true);
        this.gbuffer = gbuffer;
        // this.gbuffer.needsUpdate = true;
        this.irradiance = irradiance.clone();
    }
    copy (ibo) {
        this.camera = ibo.camera.clone();
        this.gbuffer = ibo.gbuffer.clone();
        this.irradiance = ibo.irradiance.clone();
    }
}

export { IBO };