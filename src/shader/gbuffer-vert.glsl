#version 300 es
precision highp float;
precision highp int;

uniform mat4 modelViewMatrix,projectionMatrix;
// uniform vec3 cameraPosition;
in vec3 position;
in vec3 normal;
in vec4 tangent;
in vec2 uv;

out vec2 vUv;
out mat3 tbn;
out vec3 globalpos;

void main(){
    vUv=uv;
    vec3 T=normalize(tangent.xyz);
    vec3 N=normalize(normal);
    vec3 B=normalize(cross(N,T)*tangent.w);
    tbn=mat3(T,B,N);
    globalpos=(modelViewMatrix*vec4(position,1.)).xyz;
    gl_Position=projectionMatrix*vec4(globalpos,1.);
}
