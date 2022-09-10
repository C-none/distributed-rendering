#version 300 es
precision highp float;
precision highp int;

uniform sampler2D gbuffer;
uniform sampler2D albedo;
uniform sampler2D tnormal;
uniform sampler2D irradiance1;
// uniform mat4 proj;
// uniform mat4 inveproj1;
uniform vec3 eyepos;
uniform float width;
uniform float height;
uniform float scale;

in vec2 vUv;
in vec3 clippos;
in vec3 modelpos;
in vec3 fragpos;
in mat3 tbn;

layout(location=0)out vec4 FragColor;

struct geometry{
    vec3 normal;
    float depth;
}center;

float inversegradient;

const vec2 bais1[9]=vec2[](vec2(-1.,1.),vec2(0.,1.),vec2(1.,1.),vec2(-1.,0.),vec2(0.,0.),vec2(1.,0.),vec2(-1.,-1.),vec2(0.,-1.),vec2(1.,-1.));
const vec2 bais2[8]=vec2[](vec2(-2.,2.),vec2(0.,2.),vec2(2.,2.),vec2(-2.,0.),vec2(2.,0.),vec2(-2.,-2.),vec2(0.,-2.),vec2(2.,-2.));

vec3 entrywise(vec3 a,vec3 b){
    return vec3(a.x*b.x,a.y*b.y,a.z*b.z);
}

vec2 sampCoor(vec2 bais){
    return vec2((gl_FragCoord.x+bais.x*scale)/(width),(gl_FragCoord.y+bais.y*scale)/(height));
}

float decode(int irr){
    //512+256*2+128*4+128*16
    if(irr<512)return float(irr);
    if(irr<768)return float((irr<<1)-512);
    if(irr<896)return float((irr<<2)-2048);
    return float((irr<<4)-12800);
}

vec3 irr(vec2 coor){
    vec3 ret=vec3(1023.);
    vec4 samp=texture(irradiance1,coor).rgba;
    ret.x=decode(int(samp.x*255.)*4+((int(samp.w*255.)&0x30)>>4));
    ret.y=decode(int(samp.y*255.)*4+((int(samp.w*255.)&0xc0)>>2));
    ret.z=decode(int(samp.z*255.)*4+((int(samp.w*255.)&0x03)));
    return ret/255.;
}

float diff(vec2 coor){
    geometry samp;
    samp.normal=texture(gbuffer,coor).xyz;
    samp.depth=texture(gbuffer,coor).w;
    float wn=max(.0001,pow(dot(samp.normal,center.normal),128.));
    float wz=exp(-abs(samp.depth-center.depth)*inversegradient);
    return wz;
}

void main(){
    vec2 uv=vec2(gl_FragCoord.x/(width),gl_FragCoord.y/(height));
    
    vec3 realnormal=normalize(tbn*(texture(tnormal,vUv).rgb*2.-1.));
    center.normal=realnormal;
    center.depth=clippos.z;
    inversegradient=1./(.0001+.125*acos(dot(realnormal,normalize(eyepos-modelpos))));
    // FragColor=vec4(-texture(gbuffer,uv).a/20.);
    // FragColor=vec4(vec3(-clippos.z/20.),1.);
    // FragColor=vec4((texture(gbuffer,uv).rgb)/1.,1.);
    // FragColor=vec4(vec3(texture(albedo,vUv).xyz),1.);
    // FragColor=vec4(realnormal,1.);
    // FragColor=vec4(irr(uv)*texture(albedo,vUv).rgb,1.);
    // FragColor=vec4(vec3(1./inversegradient),1.);
    
    // float weight=0.;
    // // weight=diff(sampCoor(vec2(2,0)));
    // vec3 col=vec3(0.);
    // for(int i=0;i<9;i++){
        //     float w=diff(sampCoor(bais1[i]));
        //     weight+=w;
    // }
    // FragColor=weight>8.?vec4(1.):weight>1.?vec4(1.,0.,0.,1.):vec4(0.,1.,0.,1.);
    
    float weight=0.;
    vec3 irra=vec3(0.);
    for(int i=0;i<9;i++){
        float w=diff(sampCoor(bais1[i]));
        if(i==4)w*=8.;
        irra+=irr(sampCoor(bais1[i]))*w;
        weight+=w;
    }
    FragColor=vec4(entrywise(irra,texture(albedo,vUv).rgb)/weight,1.);
    FragColor=vec4(pow(FragColor.xyz,vec3(.45)),1.);
    // if(uv.x<.5)FragColor=vec4(1.);
}