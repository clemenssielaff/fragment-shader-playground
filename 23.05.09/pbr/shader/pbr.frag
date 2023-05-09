#version 300 es          // Use version 300 of OpenGL ES, required for WebGL 2.0
precision mediump float; // Fragment shader calculations require less precision.

// Varying inputs from the vertex shader.
in highp vec3 WorldPos;
in highp vec3 Normal;

// Output fragment color.
out vec4 FragColor;

// Material parameters.
// In this example they are the same everywhere on the object's surface, but
// we could replace them with textures as well.
uniform vec3 uAlbedo;
uniform float uMetalness;
uniform float uRoughness;
uniform float uAmbient;

// In this example, we have 4 point lights.
// Point lights have a position and a color and nothing else.
// This makes them very cheap to render in PBR because they reduce the 
// calculation of the total light affecting each fragment to the sum of a 
// single direction/intensity pair for each light source.
uniform vec3 uLightPositions[4];
uniform vec3 uLightColors[4];

// The camera position, required to calculate the view vector.
// We could infer this from the view matrix, but it is cheaper to pass it in as
// a uniform, instead of calculating it for each vertex (or even fragment).
uniform vec3 uCamPos;

// Math constants.
const float PI = 3.14159265359;

// Forward declarations.
vec3 cookTorranceBRDF(vec3, vec3, vec3, vec3, vec3, float, float);
float DistributionGGX(vec3, vec3, float);
float GeometrySmith(vec3, vec3, vec3, float);
vec3 fresnelSchlick(vec3, vec3, vec3);


// =============================================================================
// Main
// =============================================================================


void main()
{
    // Re-normalize the input (varying) normal because it is not necessarily of
    // unit length after interpolation.
    vec3 surfaceNormal = normalize(Normal);

    // A normal vector pointing from the world position of the fragment towards
    // the camera.
    vec3 viewNormal = normalize(uCamPos - WorldPos);

    // The base reflectivity is how much light is reflected by the surface when
    // looking straight at it. This is also known as F0 (F-Zero) or the
    // Fresnel reflectance at normal incidence.
    // For dielectric materials, this is a constant value of 0.04.
    // For metals, this is the albedo color of the material.
    vec3 baseReflectivity = mix(vec3(0.04), uAlbedo, uMetalness);

    // The total radiance is the sum of the radiance from each light source.
    vec3 totalRadiance = vec3(0.0);

    // Calculate the radiance from each light source.
    for(int i = 0; i < 4; ++i) 
    {
        // A vector pointing from the world position of the fragment towards the
        // light source.
        vec3 lightVector = uLightPositions[i] - WorldPos;
        vec3 lightNormal = normalize(lightVector);

        // Calculate the radiance from this light source.
        vec3 radiance;
        {
            // We require the distance to the light source to calculate the
            // attenuation factor.
            // Actually, we need the squared distance, which is cheaper to
            // calculate anyway.
            float lightDistanceSq = dot(lightVector, lightVector);
            
            // Light attenuation is the inverse square of the distance.
            float attenuation = 1.0 / lightDistanceSq;

            // The radiance from a light is the product of the light color and
            // the attenuation factor.
            radiance = uLightColors[i] * attenuation;
        }

        // The incident angle is the angle between the surface normal and the
        // light normal. The light is strongest if it is pointed directly at the 
        // surface and weakest if it is pointed perpendicular or away from the 
        // surface, in which case the light is not hitting the surface at all.
        // We clamp the factor to the range [0, 1] to prevent negative light.
        float incidenceFactor = clamp(dot(surfaceNormal, lightNormal), 0.0, 1.0);

        // The BRDF, or bidirectional reflective distribution function, is a
        // function that approximates how much each individual light ray
        // contributes to the final reflected light of an opaque surface given
        // its material properties. 
        vec3 brdf = cookTorranceBRDF(
            lightNormal, 
            viewNormal, 
            surfaceNormal, 
            baseReflectivity,
            uAlbedo,
            uRoughness,
            uMetalness
        );

        // Add the radiance from this light source to the total radiance.
        totalRadiance += radiance * incidenceFactor * brdf;
    }   
    
    // Ambient light is the light that is always present, no matter how much
    // direct light is hitting the surface.
    vec3 ambient = uAmbient * uAlbedo;

    // The combined color is the sum of the ambient light and the total radiance.
    vec3 color = ambient + totalRadiance;

    // Reinhard HDR tone mapping.
    // Tone mapping is the process of mapping the high dynamic range of the
    // lighting calculations to the low dynamic range of the display by
    // squeezing the floating point color values into the range [0, 1].
    color = color / (color + vec3(1.0));

    // Apply gamma correction with a gamma of 2.2.
    color = pow(color, vec3(1.0/2.2));

    // Output the final color.
    FragColor = vec4(color, 1.0);
}


// =============================================================================
// BRDF
// =============================================================================


vec3 cookTorranceBRDF(
    vec3 lightNormal, 
    vec3 viewNormal, 
    vec3 surfaceNormal, 
    vec3 baseReflectivity,
    vec3 albedo,
    float roughness, 
    float metalness)
{
    // The halfway vector is a normal vector pointing halfway between the view 
    // vector and the light vector. The closer this halfway vector aligns with 
    // the surface's (microfacet's) normal vector, the higher the specular 
    // contribution of the light.
    vec3 halfwayNormal = normalize(viewNormal + lightNormal);

    // The Normal Distribution Function, is a function that describes the
    // distribution of theoretical microfacets on a surface. Microfacets are
    // small, flat areas that together make up the surface. The NDF describes 
    // how many microfacets are aligned with the halfway vector.
    float normalDistribution = DistributionGGX(surfaceNormal, halfwayNormal, roughness);

    // The Geometry Function, describes the self-shadowing property of the
    // microfacets. When a surface is relatively rough, the surface's microfacets
    // can overshadow other microfacets reducing the light the surface reflects.
    // Generally speaking, the occlusion of microfacets tends to increase as the
    // angle between the surface normal and the halfway vector increases.
    float geometryTerm = GeometrySmith(surfaceNormal, viewNormal, lightNormal, roughness);

    // The fresnel term describes the reflectivity of the surface based on the 
    // angle of incidence of the light. Here we use the Schlick approximation
    // of the Fresnel equation.
    vec3 fresnel = fresnelSchlick(halfwayNormal, viewNormal, baseReflectivity);

    // Calculate the Cook-Torrance BRDF.
    vec3 specular;
    {
        float viewAngle = max(dot(surfaceNormal, viewNormal), 0.0);
        float lightAngle = max(dot(surfaceNormal, lightNormal), 0.0);
        specular = (normalDistribution * geometryTerm * fresnel) / 
                    (4.0 * viewAngle * lightAngle + 0.0001); // Prevent division by zero.
    }
    
    // For energy conservation, the sum of the diffuse and specular light cannot
    // be above 1.0 (unless the surface emits light). To preserve this, we define
    // the diffuse light as the remaining light not reflected by the specular.
    vec3 diffuse = vec3(1.0) - fresnel;

    // Only dielectric materials have diffuse light - metals have none.
    // Decrease the diffuse light as the material becomes more metallic.
    diffuse *= 1.0 - metalness;

    // The final BRDF is the sum of the diffuse and specular light.
    return diffuse * (albedo / PI) + specular;
}


float DistributionGGX(vec3 surfaceNormal, vec3 halfwayNormal, float roughness)
{
    float a = roughness*roughness;
    float a2 = a*a;
    float NdotH = max(dot(surfaceNormal, halfwayNormal), 0.0);
    float NdotH2 = NdotH*NdotH;

    float nom   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / denom;
}

float GeometrySchlickGGX(float cosAngle, float roughness)
{
    float r = roughness + 1.0;
    float k = (r*r) / 8.0;
    return cosAngle / (cosAngle * (1.0 - k) + k);
}
float GeometrySmith(vec3 surfaceNormal, vec3 viewNormal, vec3 lightNormal, float roughness)
{
    float ggx1 = GeometrySchlickGGX(max(dot(surfaceNormal, lightNormal), 0.0), roughness);
    float ggx2 = GeometrySchlickGGX(max(dot(surfaceNormal, viewNormal), 0.0), roughness);
    return ggx1 * ggx2;
}

vec3 fresnelSchlick(vec3 halfwayNormal, vec3 viewNormal, vec3 baseReflectivity)
{
    float cosAngle = clamp(dot(halfwayNormal, viewNormal), 0.0, 1.0);
    return baseReflectivity + (1.0 - baseReflectivity) * pow(1.0 - cosAngle, 5.0);
}