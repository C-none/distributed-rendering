#version 300 es
precision highp float;
precision highp int;

uniform mat4 modelViewMatrix,projectionMatrix,modelMatrix;
uniform float width;
uniform float height;
in mat4 modelView;
in mat4 model;
in vec3 position;
in vec2 uv;
in vec4 tangent;
in vec3 normal;

out mat3 tbn;
out vec3 clippos;
out vec3 modelpos;
out vec3 fragpos;
out vec2 vUv;
void main(){
    vUv=uv;
    vec3 T=normalize(tangent.xyz);
    vec3 N=normalize(normal);
    vec3 B=normalize(cross(N,T)*tangent.w);
    tbn=mat3(T,B,N);
    
    modelpos=(modelMatrix*vec4(position,1.)).xyz;
    clippos=(modelViewMatrix*vec4(position,1.)).xyz;
    fragpos=(projectionMatrix*vec4(clippos,1.)+1.).xyz/2.;
    fragpos.x=fragpos.x*width;
    fragpos.y=fragpos.y*height;
    
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}
