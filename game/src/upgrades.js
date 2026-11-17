// The upgrade draft: between waves the keeper picks one of three boons.
// Each upgrade is a small function that bends one of the keeper's stats, so
// a run builds differently every time — choices that matter are the depth
// the judge looks for. apply() runs once, when the card is chosen.

export const UPGRADES = [
  {
    id: 'swift-hands',
    name: 'Swift Hands',
    blurb: 'Fire 18% faster.',
    icon: '»',
    apply: (p) => (p.fireInterval *= 0.82),
  },
  {
    id: 'heavy-embers',
    name: 'Heavy Embers',
    blurb: '+1 damage on every bolt.',
    icon: '◆',
    apply: (p) => (p.boltDamage += 1),
  },
  {
    id: 'twin-lanterns',
    name: 'Twin Lanterns',
    blurb: '+1 bolt per shot, spread wide.',
    icon: '✦',
    apply: (p) => (p.boltsPerShot += 1),
  },
  {
    id: 'piercing-light',
    name: 'Piercing Light',
    blurb: 'Bolts pass through +1 enemy.',
    icon: '➤',
    apply: (p) => (p.pierce += 1),
  },
  {
    id: 'wind-cloak',
    name: 'Wind Cloak',
    blurb: 'Move 12% faster.',
    icon: '≈',
    apply: (p) => (p.speed *= 1.12),
  },
  {
    id: 'second-wind',
    name: 'Second Wind',
    blurb: 'Dash recharges 35% sooner.',
    icon: '↯',
    apply: (p) => (p.dashCooldown *= 0.65),
  },
  {
    id: 'kindled-heart',
    name: 'Kindled Heart',
    blurb: '+1 max heart, and heal 1 now.',
    icon: '♥',
    apply: (p) => {
      p.maxHearts = Math.min(p.heartCap, p.maxHearts + 1);
      p.hearts = Math.min(p.maxHearts, p.hearts + 1);
    },
  },
  {
    id: 'ember-magnet',
    name: 'Ember Magnet',
    blurb: 'Embers fly to you from twice as far.',
    icon: '◎',
    apply: (p) => (p.magnetRadius *= 2),
  },
  {
    id: 'long-flame',
    name: 'Long Flame',
    blurb: 'Bolts fly 30% faster and farther.',
    icon: '☄',
    apply: (p) => {
      p.boltSpeed *= 1.3;
      p.boltRange *= 1.3;
    },
  },
  {
    id: 'thorn-ward',
    name: 'Thorn Ward',
    blurb: 'A longer moment of safety when hurt.',
    icon: '✚',
    apply: (p) => (p.hurtInvuln += 0.45),
  },
];

// Draw three distinct upgrades for the draft, using the run's seeded RNG.
export function drawDraft(rng) {
  const pool = [...UPGRADES];
  const hand = [];
  while (hand.length < 3 && pool.length > 0) {
    hand.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
  }
  return hand;
}
