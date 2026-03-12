// ─── Visitor name generator config ───────────────────────────────────────────

export const ADJECTIVES = [
  // Mood / energy
  'Curious', 'Happy', 'Sleepy', 'Bouncy', 'Brave', 'Gentle', 'Silly', 'Wise',
  'Jolly', 'Peppy', 'Witty', 'Zesty', 'Perky', 'Chipper', 'Feisty', 'Lucky',
  'Grumpy', 'Snazzy', 'Wobbly', 'Nifty', 'Plucky', 'Noble', 'Serene', 'Mellow',
  // Texture / appearance
  'Fuzzy', 'Fluffy', 'Cozy', 'Nimble', 'Quirky', 'Dapper', 'Sneaky', 'Tiny',
  'Chubby', 'Silky', 'Velvet', 'Speckled', 'Glittery', 'Pastel', 'Shiny',
  // Lively / fun
  'Majestic', 'Whimsical', 'Dreamy', 'Fancy', 'Sassy', 'Zippy', 'Bubbly',
  'Pudgy', 'Radiant', 'Clumsy', 'Dazzling', 'Sunny', 'Misty', 'Bouncy',
  // Celestial-themed
  'Cosmic', 'Stellar', 'Ethereal', 'Luminous', 'Astral', 'Galactic', 'Ancient',
  'Timeless', 'Infinite', 'Boundless', 'Nebular', 'Orbital', 'Twilight', 'Stardust',
  // Mountain-themed
  'Towering', 'Rugged', 'Snowy', 'Alpine', 'Steadfast', 'Lofty', 'Granite',
  'Frosty', 'Windswept', 'Mighty', 'Soaring', 'Tranquil',
  // River-themed
  'Winding', 'Crystal', 'Rushing', 'Flowing', 'Silvery', 'Meandering', 'Rippling',
  'Gentle', 'Roaring', 'Gleaming', 'Wandering',
]

// Each entry: [name, emoji]
export const ENTRIES: [string, string][] = [
  // ── Animals: Mammals ────────────────────────────────────────────────────────
  ['Panda',        '🐼'],
  ['Fox',          '🦊'],
  ['Otter',        '🦦'],
  ['Raccoon',      '🦝'],
  ['Koala',        '🐨'],
  ['Hedgehog',     '🦔'],
  ['Bunny',        '🐰'],
  ['Capybara',     '🦫'],
  ['Quokka',       '🦘'],
  ['Fennec',       '🦊'],
  ['Sloth',        '🦥'],
  ['Lemur',        '🐒'],
  ['Chinchilla',   '🐭'],
  ['Wombat',       '🐾'],
  ['Wallaby',      '🦘'],
  ['Meerkat',      '🦡'],
  ['Mongoose',     '🦡'],
  ['Tamarin',      '🐒'],
  ['Loris',        '🌙'],
  ['Margay',       '🐱'],
  ['Kinkajou',     '🌿'],
  ['Numbat',       '🐾'],
  ['Tapir',        '🦛'],
  ['Okapi',        '🦒'],
  ['Platypus',     '🦆'],
  ['Axolotl',      '🫧'],
  ['Narwhal',      '🦄'],
  // ── Animals: Birds ──────────────────────────────────────────────────────────
  ['Penguin',      '🐧'],
  ['Flamingo',     '🦩'],
  ['Parrot',       '🦜'],
  ['Toucan',       '🦜'],
  ['Owl',          '🦉'],
  ['Hummingbird',  '🐦'],
  ['Puffin',       '🐦'],
  ['Cockatoo',     '🦜'],
  ['Peacock',      '🦚'],
  ['Pelican',      '🐦'],
  ['Kiwi',         '🥝'],
  ['Robin',        '🐦'],
  // ── Animals: Fish & aquatic ─────────────────────────────────────────────────
  ['Clownfish',    '🐠'],
  ['Blobfish',     '🐟'],
  ['Starfish',     '⭐'],
  ['Seahorse',     '🐴'],
  ['Jellyfish',    '🪼'],
  ['Octopus',      '🐙'],
  ['Dolphin',      '🐬'],
  ['Manatee',      '🦭'],
  ['Seal',         '🦭'],
  ['Pufferfish',   '🐡'],
  ['Anglerfish',   '🐟'],
  // ── Animals: Reptiles & amphibians ──────────────────────────────────────────
  ['Gecko',        '🦎'],
  ['Chameleon',    '🦎'],
  ['Salamander',   '🦎'],
  // ── Animals: Insects & tiny creatures ───────────────────────────────────────
  ['Bumblebee',    '🐝'],
  ['Butterfly',    '🦋'],
  ['Ladybug',      '🐞'],
  ['Firefly',      '✨'],
  // ── Celestial objects ───────────────────────────────────────────────────────
  ['Orion',        '⭐'],
  ['Sirius',       '💫'],
  ['Vega',         '🌟'],
  ['Polaris',      '⭐'],
  ['Rigel',        '💫'],
  ['Antares',      '🔴'],
  ['Capella',      '✨'],
  ['Deneb',        '🌟'],
  ['Andromeda',    '🌌'],
  ['Cassiopeia',   '✨'],
  ['Europa',       '🪐'],
  ['Ganymede',     '🪐'],
  ['Titan',        '🪐'],
  ['Callisto',     '🪐'],
  ['Nebula',       '🌌'],
  ['Pulsar',       '💫'],
  ['Quasar',       '🌌'],
  ['Halley',       '☄️'],
  ['Lyra',         '🎵'],
  ['Cygnus',       '🦢'],
  // ── Mountains ───────────────────────────────────────────────────────────────
  ['Everest',      '🏔️'],
  ['Fuji',         '🗻'],
  ['Kilimanjaro',  '🏔️'],
  ['Denali',       '🏔️'],
  ['Olympus',      '⛰️'],
  ['Matterhorn',   '🏔️'],
  ['Aconcagua',    '🏔️'],
  ['Elbrus',       '🏔️'],
  ['Blanc',        '🏔️'],
  ['Rainier',      '🌋'],
  ['Whitney',      '⛰️'],
  ['Logan',        '🏔️'],
  // ── Rivers ──────────────────────────────────────────────────────────────────
  ['Amazon',       '🌊'],
  ['Nile',         '🌊'],
  ['Yangtze',      '🌊'],
  ['Ganges',       '🌊'],
  ['Danube',       '💧'],
  ['Rhine',        '💧'],
  ['Thames',       '💧'],
  ['Volga',        '🌊'],
  ['Mekong',       '🌿'],
  ['Congo',        '🌿'],
  ['Zambezi',      '🌊'],
  ['Colorado',     '🏜️'],
  ['Seine',        '💧'],
  ['Mississippi',  '🌊'],
  ['Murray',       '💧'],
]

// Derived lookup map for fast emoji resolution
export const ENTITY_EMOJI: Record<string, string> = Object.fromEntries(ENTRIES)

// Deduplicated name list (for matching in getAnimalEmoji)
export const ENTITY_NAMES = Array.from(new Set(ENTRIES.map(([name]) => name)))

export function generateVisitorName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const [entity] = ENTRIES[Math.floor(Math.random() * ENTRIES.length)]
  return `${adj}${entity}`
}

export function getAnimalEmoji(name: string): string {
  for (const entity of ENTITY_NAMES) {
    if (name.endsWith(entity)) return ENTITY_EMOJI[entity] ?? '🐾'
  }
  return '🐾'
}
