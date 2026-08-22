import crypto from "crypto"

const CAMERAS_AND_LENSES = [
  "shot on Hasselblad H6D-100c, 80mm f/2.8 lens, ultra-high resolution, incredible micro-textures",
  "shot on Sony A7R V, 35mm f/1.4 GM lens, exquisite depth of field, sharp subject clarity",
  "shot on Leica M11, 50mm Summilux lens, rich color tonal range, authentic optical rendering",
  "shot on Arri Alexa 35, Master Prime lens, cinematic film look, raytraced volumetric haze",
  "shot on Phase One XF IQ4 150MP, Schneider Kreuznach 55mm lens, pristine fine art detail",
  "shot on Canon EOS R5 C, RF 50mm f/1.2L lens, rich color depth, beautiful bokeh",
]

const LAYOUT_FRAMINGS: Record<string, string> = {
  "16:9": "cinematic 16:9 widescreen composition, expansive horizontal panorama, wide field of view",
  "9:16": "vertical 9:16 portrait orientation, tall full-height vertical framing, mobile reel depth",
  "1:1": "perfect square 1:1 symmetrical composition, centered geometric harmony, square frame",
  "4:3": "classic 4:3 medium format composition, traditional balanced photographic proportions",
  "3:2": "classic 3:2 35mm horizontal photographic framing, balanced rule-of-thirds composition",
  "2:3": "vertical 2:3 portrait composition, elegant vertical photographic layout",
}

const LIGHTING_NUANCES: Record<string, string[]> = {
  held: [
    "warm cinematic ambient illumination with golden side-light bounce, subtle rim light, 8k",
    "soft diffused tungsten warmth with natural room glow, high dynamic range, crisp shadows",
    "gentle sunset rim lighting, warm atmospheric fill, raytraced subsurface scattering",
    "intimate ambient illumination with gentle specular reflections, photorealistic rendering",
  ],
  night: [
    "sodium streetlamps reflecting on wet asphalt with deep cinematic contrast, neon highlights, 8k",
    "noir atmospheric lighting with moody volumetric shadows, subtle neon rim glow, raytracing",
    "dusk twilight sky with warm incandescent accents, rich deep shadows, cinematic atmosphere",
    "cinematic nighttime luminescence with deep shadows, soft atmospheric haze, ultra-detailed",
  ],
  studio: [
    "clean commercial softbox key light with crisp edge separation, flawless skin and material texture, 8k",
    "balanced three-point studio lighting with high clarity, raytraced specular highlights, clean art direction",
    "high-key fashion lighting with flawless color fidelity, studio strobe illumination, ultra-sharp",
    "sculpted commercial strobe lighting with subtle fill, pristine professional studio balance",
  ],
  film: [
    "Kodak Portra 400 analog color tones, natural fine film grain, organic halation, 8k",
    "subtle 35mm emulsion texture, gentle highlight halation, authentic analog depth",
    "Fujifilm Provia balanced tone curve, organic grain structure, rich natural color science",
    "authentic analog print texture with rich midtones, vintage optical character",
  ],
}

const COMPOSITION_VARIATIONS: Record<number, string[]> = {
  1: [
    "centered master shot framing, clear subject emphasis, balanced visual hierarchy, rule of thirds",
    "low-angle hero perspective, grounded composition, natural atmospheric depth, striking presence",
    "symmetrical master establishing shot, pristine balance, crisp subject focus, award-winning photography",
    "golden-ratio composition, eye-level perspective, commercial art direction, sharp focal point",
  ],
  2: [
    "wide-angle anamorphic perspective, 35mm cinematic sweep, dramatic background depth, anamorphic flares",
    "panoramic environmental wide angle, moody atmospheric haze, deep field view, cinematic perspective",
    "cinematic 35mm frame, wide establishing angle, rich environmental context, atmospheric glow",
    "anamorphic lens perspective, subtle chromatic dispersion, deep perspective lines, cinematic film still",
  ],
  3: [
    "dynamic diagonal framing, high studio contrast, crisp edge highlights, dramatic shadow play",
    "bold split-tone lighting, dramatic shadow angle, vibrant color separation, high visual energy",
    "high-energy diagonal perspective, sharp specular highlights, clean modern styling, bold contrast",
    "action-oriented dynamic angle, crisp rim contrast, intense visual energy, commercial quality",
  ],
  4: [
    "fine art editorial layout, generous negative space, elegant off-center framing, serene balance",
    "minimalist visual balance, airy ambient composition, subtle aesthetic crop, delicate lighting",
    "soft artistic framing, graceful negative space, gentle ambient illumination, fine art aesthetic",
    "contemporary editorial styling, off-center subject placement, refined simplicity, tasteful balance",
  ],
}

function getRandomItem<T>(arr: T[]): T {
  const index = crypto.randomInt(0, arr.length)
  return arr[index]
}

export function generateDiversifiedPrompt(options: {
  basePrompt: string
  takeNumber: number
  ratio?: string
  paper?: string
  motion?: string
  kind?: "image" | "video"
}): {
  prompt: string
  seed: number
  angle: string
  lighting: string
  camera: string
  layout: string
} {
  const seed = crypto.randomInt(10000000, 99999999)
  const camera = getRandomItem(CAMERAS_AND_LENSES)
  const layout = LAYOUT_FRAMINGS[options.ratio || "16:9"] || LAYOUT_FRAMINGS["16:9"]

  const lightingList = LIGHTING_NUANCES[options.paper || "held"] || LIGHTING_NUANCES.held
  const lighting = getRandomItem(lightingList)

  const angleList = COMPOSITION_VARIATIONS[options.takeNumber] || COMPOSITION_VARIATIONS[1]
  const angle = getRandomItem(angleList)

  if (options.kind === "video") {
    const motionStyle = options.motion || "cinematic pan"
    const prompt = `${options.basePrompt}, ${layout}, ${motionStyle} camera motion, ${lighting}, ${camera}, 4k ultra detailed cinematic film still, photorealistic, 8k`
    return { prompt, seed, angle, lighting, camera, layout }
  }

  // Combine layout framing, angle variation, lighting, and camera into a unified diffusion prompt
  const prompt = `${options.basePrompt}, ${layout}, ${angle}, ${lighting}, ${camera}, masterpiece, photorealistic, 8k resolution, ultra-detailed textures, octane render, raytracing`

  return { prompt, seed, angle, lighting, camera, layout }
}
