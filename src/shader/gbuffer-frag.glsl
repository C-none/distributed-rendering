#version 300 es
precision highp float;
precision highp int;

uniform sampler2D tnormal;

in vec2 vUv;
in mat3 tbn;
in vec3 globalpos;

layout(location=0)out vec4 gbuffer;

void main(){
    // depth=vec4(globalpos.z,0.,0.,1.);
    gbuffer=vec4(normalize(tbn*(texture(tnormal,vUv).rgb*2.-1.)),globalpos.z);
}