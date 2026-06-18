// ============================================================
// CRYPTID CRAWLERS - Game Data Definitions
// ============================================================

const ELEMENTS = {
  fire:     { name:'Fire',     icon:'🔥', color:'#ff6b35', bg:'#3a1a0a', weakTo:'water',    strongVs:'nature'  },
  water:    { name:'Water',    icon:'💧', color:'#4facde', bg:'#0a1e2e', weakTo:'electric', strongVs:'fire'    },
  electric: { name:'Electric', icon:'⚡', color:'#ffd60a', bg:'#2e2a00', weakTo:'nature',   strongVs:'water'   },
  nature:   { name:'Nature',   icon:'🌿', color:'#56cf7a', bg:'#0a2e14', weakTo:'fire',     strongVs:'electric'},
  dark:     { name:'Dark',     icon:'🌑', color:'#a855f7', bg:'#1a0a2e', weakTo:'light',    strongVs:'light'   },
  light:    { name:'Light',    icon:'✨', color:'#fbbf24', bg:'#2e2500', weakTo:'dark',     strongVs:'dark'    },
  neutral:  { name:'Neutral',  icon:'⚪', color:'#94a3b8', bg:'#1a1a2e', weakTo:null,       strongVs:null      },
};

// Monsters: atk/hp/spd are BASE (tier 1). Higher tiers multiply stats.
// ability.trigger: 'on_attack' | 'on_death' | 'on_turn_start' | 'on_ally_death' | 'passive'
const MONSTERS = [
  // ── FIRE ──────────────────────────────────────────────────────
  {
    id:'ember_imp', name:'Ember Imp', emoji:'😈', element:'fire', rarity:'common',
    atk:3, hp:8, spd:3, cost:3,
    ability:{ name:'Ignite', trigger:'on_attack',
      desc:'Applies 1 Burn to target (1 dmg/turn for 2 turns)',
      fn:(a,t,b)=>{ b.addStatus(t,'burn',2); b.log(`${a.name} ignites ${t.name}! 🔥`); }},
    desc:'A mischievous fire spirit.'
  },
  {
    id:'flame_sprite', name:'Flame Sprite', emoji:'🔥', element:'fire', rarity:'common',
    atk:4, hp:6, spd:5, cost:3,
    ability:{ name:'Blaze', trigger:'on_attack',
      desc:'Deals 2 extra fire damage on hit',
      fn:(a,t,b)=>{ t.currentHP-=2; b.log(`${a.name} blazes for 2 extra damage!`); }},
    desc:'Fast and destructive.'
  },
  {
    id:'magma_drake', name:'Magma Drake', emoji:'🐲', element:'fire', rarity:'uncommon',
    atk:6, hp:14, spd:3, cost:4,
    ability:{ name:'Fire Breath', trigger:'on_attack',
      desc:'Splashes 50% damage to the next enemy',
      fn:(a,t,b)=>{ const nx=b.nextAlive(t); if(nx){const d=Math.ceil(a.atk*.5);nx.currentHP-=d;b.log(`${a.name} splashes ${nx.name} for ${d}!`);} }},
    desc:'A young dragon with raw power.'
  },
  {
    id:'inferno_phoenix', name:'Inferno Phoenix', emoji:'🦅', element:'fire', rarity:'rare',
    atk:8, hp:16, spd:4, cost:5,
    ability:{ name:'Rebirth', trigger:'on_death',
      desc:'Revives once at 50% HP',
      fn:(s,_,b)=>{ if(!s._reborn){s._reborn=true;s.currentHP=Math.ceil(s.maxHP*.5);b.log(`${s.name} REBORN from the ashes! 🦅`);} }},
    desc:'The eternal flame cannot be extinguished.'
  },

  // ── WATER ─────────────────────────────────────────────────────
  {
    id:'tide_pixie', name:'Tide Pixie', emoji:'🧚', element:'water', rarity:'common',
    atk:2, hp:10, spd:2, cost:3,
    ability:{ name:'Mend', trigger:'on_turn_start',
      desc:'Heals the most wounded ally 2 HP each turn',
      fn:(s,_,b)=>{ const a=b.mostWounded(b.teamOf(s),s); if(a){a.currentHP=Math.min(a.maxHP,a.currentHP+2);b.log(`${s.name} heals ${a.name} for 2! 💚`);} }},
    desc:'A kind water spirit that mends allies.'
  },
  {
    id:'frost_wisp', name:'Frost Wisp', emoji:'❄️', element:'water', rarity:'common',
    atk:3, hp:9, spd:4, cost:3,
    ability:{ name:'Chill', trigger:'on_attack',
      desc:'Applies Slow to target (-2 SPD for 2 turns)',
      fn:(a,t,b)=>{ b.addStatus(t,'slow',2); b.log(`${a.name} chills ${t.name}! ❄️`); }},
    desc:'A freezing spirit of winter.'
  },
  {
    id:'sea_serpent', name:'Sea Serpent', emoji:'🐍', element:'water', rarity:'uncommon',
    atk:5, hp:15, spd:3, cost:4,
    ability:{ name:'Venom Strike', trigger:'on_attack',
      desc:'Poisons target for 2 (stacking)',
      fn:(a,t,b)=>{ b.addStatus(t,'poison',2); b.log(`${a.name} poisons ${t.name}! ☠️`); }},
    desc:'Ancient serpent of the deep.'
  },
  {
    id:'ice_colossus', name:'Ice Colossus', emoji:'🏔️', element:'water', rarity:'rare',
    atk:6, hp:24, spd:1, cost:5,
    passiveShield:2,
    ability:{ name:'Glacial Armor', trigger:'passive', desc:'Passively reduces all incoming damage by 2', fn:null },
    desc:'An ancient titan of ice, nearly impervious.'
  },

  // ── ELECTRIC ──────────────────────────────────────────────────
  {
    id:'spark_fairy', name:'Spark Fairy', emoji:'⚡', element:'electric', rarity:'common',
    atk:4, hp:7, spd:5, cost:3,
    ability:{ name:'Static', trigger:'on_attack',
      desc:'30% chance to Stun target for 1 turn',
      fn:(a,t,b)=>{ if(Math.random()<.3){b.addStatus(t,'stun',1);b.log(`${a.name} STUNS ${t.name}! ⭐`);} }},
    desc:'Quick and unpredictable.'
  },
  {
    id:'jolt_bug', name:'Jolt Bug', emoji:'🐛', element:'electric', rarity:'common',
    atk:3, hp:9, spd:3, cost:3,
    ability:{ name:'Chain Lightning', trigger:'on_attack',
      desc:'Damage bounces to next enemy for 50%',
      fn:(a,t,b)=>{ const nx=b.nextAlive(t); if(nx){const d=Math.max(1,Math.floor(a.atk*.5));nx.currentHP-=d;b.log(`⚡ Chain lightning hits ${nx.name} for ${d}!`);} }},
    desc:'Electricity travels through this creature.'
  },
  {
    id:'thunder_wyvern', name:'Thunder Wyvern', emoji:'🦕', element:'electric', rarity:'uncommon',
    atk:7, hp:12, spd:5, cost:4,
    ability:{ name:'Double Strike', trigger:'on_attack',
      desc:'Attacks target twice per combat turn',
      fn:(a,_,__)=>{ a._extraAttack=true; }},
    desc:'Strikes twice with blinding speed.'
  },
  {
    id:'storm_colossus', name:'Storm Colossus', emoji:'🌪️', element:'electric', rarity:'rare',
    atk:9, hp:18, spd:4, cost:5,
    ability:{ name:'Thunderclap', trigger:'on_attack',
      desc:'Deals 3 damage to ALL enemies each attack',
      fn:(a,_,b)=>{ b.enemyTeam(a).forEach(e=>{if(e.currentHP>0)e.currentHP-=3;}); b.log(`${a.name} THUNDERCLAP hits all enemies for 3!`); }},
    desc:'Commands the storm itself.'
  },

  // ── NATURE ────────────────────────────────────────────────────
  {
    id:'vine_sprite', name:'Vine Sprite', emoji:'🌱', element:'nature', rarity:'common',
    atk:2, hp:12, spd:2, cost:3,
    ability:{ name:'Entangle', trigger:'on_attack',
      desc:'Applies Slow (-3 SPD) to target for 2 turns',
      fn:(a,t,b)=>{ b.addStatus(t,'slow',3); b.log(`${a.name} entangles ${t.name}! 🌿`); }},
    desc:'Tangles enemies in living vines.'
  },
  {
    id:'spore_shroom', name:'Spore Shroom', emoji:'🍄', element:'nature', rarity:'common',
    atk:3, hp:10, spd:2, cost:3,
    ability:{ name:'Spore Cloud', trigger:'on_death',
      desc:'Poisons ALL enemies for 2 when it dies',
      fn:(s,_,b)=>{ b.enemyTeam(s).forEach(e=>{if(e.currentHP>0)b.addStatus(e,'poison',2);}); b.log(`${s.name} releases a toxic spore cloud! 🍄`); }},
    desc:'Dies spreading its spores everywhere.'
  },
  {
    id:'forest_lynx', name:'Forest Lynx', emoji:'🐆', element:'nature', rarity:'uncommon',
    atk:5, hp:14, spd:5, cost:4,
    ability:{ name:'Pounce', trigger:'on_attack',
      desc:'First attack each battle deals DOUBLE damage',
      fn:(a,t,b)=>{ if(!a._pounced){a._pounced=true;t.currentHP-=a.atk;b.log(`${a.name} POUNCES for double damage! 🐆`);} }},
    desc:'Lightning fast predator.'
  },
  {
    id:'ancient_treant', name:'Ancient Treant', emoji:'🌳', element:'nature', rarity:'rare',
    atk:5, hp:30, spd:1, cost:5,
    ability:{ name:'Regenerate', trigger:'on_turn_start',
      desc:'Heals 3 HP at the start of each turn',
      fn:(s,_,b)=>{ if(s.currentHP>0&&s.currentHP<s.maxHP){s.currentHP=Math.min(s.maxHP,s.currentHP+3);b.log(`${s.name} regenerates 3 HP! 💚`);} }},
    desc:'An ancient being of immense vitality.'
  },

  // ── DARK ──────────────────────────────────────────────────────
  {
    id:'shadow_bat', name:'Shadow Bat', emoji:'🦇', element:'dark', rarity:'common',
    atk:4, hp:8, spd:5, cost:3,
    dodgeChance:0.25,
    ability:{ name:'Evasion', trigger:'passive', desc:'25% chance to dodge any attack', fn:null },
    desc:'Moves through shadows unseen.'
  },
  {
    id:'bone_walker', name:'Bone Walker', emoji:'💀', element:'dark', rarity:'common',
    atk:5, hp:7, spd:3, cost:2,
    ability:{ name:'Death Mark', trigger:'on_death',
      desc:'Deals 5 damage to its killer when it dies',
      fn:(s,_,b)=>{ if(s._killedBy&&s._killedBy.currentHP>0){s._killedBy.currentHP-=5;b.log(`${s.name}'s DEATH MARK deals 5 to ${s._killedBy.name}! 💀`);} }},
    desc:'Even in death, it drags you down.'
  },
  {
    id:'void_shade', name:'Void Shade', emoji:'👁️', element:'dark', rarity:'uncommon',
    atk:6, hp:12, spd:4, cost:4,
    ability:{ name:'Life Drain', trigger:'on_attack',
      desc:'Heals self for 50% of damage dealt',
      fn:(a,_,b)=>{ const h=Math.floor(a.atk*.5); a.currentHP=Math.min(a.maxHP,a.currentHP+h); b.log(`${a.name} drains ${h} HP! 🩸`); }},
    desc:'Feeds on the life force of enemies.'
  },
  {
    id:'doom_reaper', name:'Doom Reaper', emoji:'☠️', element:'dark', rarity:'rare',
    atk:12, hp:14, spd:3, cost:5,
    ability:{ name:'Execute', trigger:'on_attack',
      desc:'Instantly kills enemies below 20% HP',
      fn:(a,t,b)=>{ if(t.currentHP>0&&t.currentHP<=Math.ceil(t.maxHP*.2)){t.currentHP=0;b.log(`${a.name} EXECUTES ${t.name}! ☠️`);} }},
    desc:'The final judge of the dying.'
  },

  // ── LIGHT ─────────────────────────────────────────────────────
  {
    id:'pixie_guard', name:'Pixie Guard', emoji:'✨', element:'light', rarity:'common',
    atk:3, hp:11, spd:3, cost:3,
    ability:{ name:'Guardian Light', trigger:'on_turn_start',
      desc:'Gives +1 Shield to the most wounded ally each turn',
      fn:(s,_,b)=>{ const a=b.mostWounded(b.teamOf(s),s); if(a){b.addStatus(a,'shield',1);b.log(`${s.name} shields ${a.name}! 🛡️`);} }},
    desc:'Protects the weak with divine light.'
  },
  {
    id:'holy_wisp', name:'Holy Wisp', emoji:'💫', element:'light', rarity:'common',
    atk:2, hp:10, spd:2, cost:3,
    ability:{ name:'Bless', trigger:'on_turn_start',
      desc:'Gives +1 ATK to the lowest-ATK ally each turn',
      fn:(s,_,b)=>{ const team=b.teamOf(s); const a=team.filter(m=>m.currentHP>0&&m!==s).sort((x,y)=>x.atk-y.atk)[0]; if(a){a.atk+=1;b.log(`${s.name} blesses ${a.name}! (+1 ATK) ✨`);} }},
    desc:'Strengthens allies with divine blessing.'
  },
  {
    id:'star_knight', name:'Star Knight', emoji:'⭐', element:'light', rarity:'uncommon',
    atk:6, hp:15, spd:4, cost:4,
    ability:{ name:'Divine Strike', trigger:'on_attack',
      desc:'Deals +4 bonus damage to Dark monsters',
      fn:(a,t,b)=>{ if(t.element==='dark'){t.currentHP-=4;b.log(`${a.name}'s Divine Strike crits ${t.name} for +4 holy damage! ✝️`);} }},
    desc:'A sacred warrior of the light.'
  },
  {
    id:'radiant_seraph', name:'Radiant Seraph', emoji:'👼', element:'light', rarity:'rare',
    atk:7, hp:20, spd:3, cost:5,
    ability:{ name:'Resurrection', trigger:'on_ally_death',
      desc:'Once per battle, revives a fallen ally at 30% HP',
      fn:(s,dead,b)=>{ if(!s._resurrectUsed){s._resurrectUsed=true;dead.currentHP=Math.ceil(dead.maxHP*.3);b.log(`${s.name} RESURRECTS ${dead.name}! 👼`);} }},
    desc:'The light that refuses to let allies fall.'
  },
];

// Boss monsters (appear at floors 5, 10, 15)
const BOSSES = [
  {
    id:'inferno_lord', name:'Inferno Lord', emoji:'🌋', element:'fire', rarity:'boss',
    atk:10, hp:45, spd:3, cost:0, isBoss:true,
    ability:{ name:'Inferno Rage', trigger:'on_attack',
      desc:'Applies 2 Burn AND splashes 4 dmg to next enemy',
      fn:(a,t,b)=>{ b.addStatus(t,'burn',2); const nx=b.nextAlive(t); if(nx){nx.currentHP-=4;} b.log(`${a.name} INFERNO RAGE! Burn + splash!`); }},
    desc:'The ruler of the fire realm. Defeat it to advance.'
  },
  {
    id:'abyssal_kraken', name:'Abyssal Kraken', emoji:'🦑', element:'water', rarity:'boss',
    atk:8, hp:55, spd:2, cost:0, isBoss:true,
    passiveShield:2,
    ability:{ name:'Ink Flood', trigger:'on_turn_start',
      desc:'Poisons ALL enemies at start of each turn',
      fn:(s,_,b)=>{ b.enemyTeam(s).forEach(e=>{if(e.currentHP>0)b.addStatus(e,'poison',1);}); b.log(`${s.name} floods the arena with ink! ☠️`); }},
    desc:'Ancient terror of the deep. Its ink is lethal.'
  },
  {
    id:'void_sovereign', name:'Void Sovereign', emoji:'🌀', element:'dark', rarity:'boss',
    atk:14, hp:50, spd:4, cost:0, isBoss:true,
    dodgeChance:0.15,
    ability:{ name:'Void Burst', trigger:'on_attack',
      desc:'Deals 5 damage to ALL enemies and has 15% dodge',
      fn:(a,_,b)=>{ b.enemyTeam(a).forEach(e=>{if(e.currentHP>0)e.currentHP-=5;}); b.log(`${a.name} VOID BURST hits all for 5! 🌀`); }},
    desc:'The final sovereign of darkness. The dungeon’s true master.'
  },
];

// Upgrade Cards drafted between floors
const CARDS = [
  // ── Common ──
  { id:'battle_hardened', name:'Battle Hardened', rarity:'common', emoji:'⚔️',
    desc:'All your monsters gain +2 ATK permanently this run.',
    fn:(G)=>{ G.team.forEach(m=>{m.atk+=2;m.baseAtk=(m.baseAtk||m.atk)+2;}); G.upgrades.push({id:'battle_hardened',atk:2}); }},
  { id:'thick_hide', name:'Thick Hide', rarity:'common', emoji:'🛡️',
    desc:'All your monsters gain +5 Max HP permanently this run.',
    fn:(G)=>{ G.team.forEach(m=>{m.maxHP+=5;m.currentHP=Math.min(m.currentHP+5,m.maxHP);}); G.upgrades.push({id:'thick_hide',hp:5}); }},
  { id:'quick_reflexes', name:'Quick Reflexes', rarity:'common', emoji:'💨',
    desc:'All your monsters gain +2 SPD permanently this run.',
    fn:(G)=>{ G.team.forEach(m=>{m.spd+=2;}); G.upgrades.push({id:'quick_reflexes',spd:2}); }},
  { id:'gold_rush', name:'Gold Rush', rarity:'common', emoji:'💰',
    desc:'Gain 5 gold immediately.',
    fn:(G)=>{ G.gold+=5; }},
  { id:'war_drums', name:'War Drums', rarity:'common', emoji:'🥁',
    desc:'Your monsters deal +1 damage for each floor cleared this run.',
    fn:(G)=>{ const bonus=G.floor-1; G.team.forEach(m=>{m.atk+=bonus;}); G.upgrades.push({id:'war_drums'}); }},
  { id:'surplus_rations', name:'Surplus Rations', rarity:'common', emoji:'🍖',
    desc:'All your monsters are fully healed.',
    fn:(G)=>{ G.team.forEach(m=>{m.currentHP=m.maxHP;}); }},

  // ── Uncommon ──
  { id:'elemental_synergy', name:'Elemental Synergy', rarity:'uncommon', emoji:'🌀',
    desc:'For each element you have 2+ monsters of, those monsters get +3 ATK.',
    fn:(G)=>{ const counts={}; G.team.forEach(m=>{counts[m.element]=(counts[m.element]||0)+1;}); Object.entries(counts).forEach(([el,n])=>{ if(n>=2) G.team.filter(m=>m.element===el).forEach(m=>m.atk+=3); }); G.upgrades.push({id:'elemental_synergy'}); }},
  { id:'venomous', name:'Venomous', rarity:'uncommon', emoji:'☠️',
    desc:'All your monsters apply 1 Poison on every attack.',
    fn:(G)=>{ G.upgrades.push({id:'venomous',poison:1}); }},
  { id:'iron_wall', name:'Iron Wall', rarity:'uncommon', emoji:'🧱',
    desc:'All your monsters gain +2 passive shield (reduces incoming damage).',
    fn:(G)=>{ G.team.forEach(m=>{m.passiveShield=(m.passiveShield||0)+2;}); G.upgrades.push({id:'iron_wall',shield:2}); }},
  { id:'regenerative', name:'Regenerative', rarity:'uncommon', emoji:'💚',
    desc:'All your monsters regenerate 2 HP at the start of each battle turn.',
    fn:(G)=>{ G.upgrades.push({id:'regenerative',regen:2}); }},
  { id:'berserker', name:'Berserker', rarity:'uncommon', emoji:'😤',
    desc:'Your monster that takes the first hit gains +5 ATK for that battle.',
    fn:(G)=>{ G.upgrades.push({id:'berserker'}); }},
  { id:'fortune_favors', name:'Fortune Favors', rarity:'uncommon', emoji:'🎲',
    desc:'Earn +1 gold for every enemy killed in battle.',
    fn:(G)=>{ G.upgrades.push({id:'fortune_favors'}); }},

  // ── Rare ──
  { id:'vampiric', name:'Vampiric', rarity:'rare', emoji:'🩸',
    desc:'All your monsters heal 30% of damage they deal.',
    fn:(G)=>{ G.upgrades.push({id:'vampiric',lifesteal:.3}); }},
  { id:'chain_reaction', name:'Chain Reaction', rarity:'rare', emoji:'💥',
    desc:'Killing a monster deals 4 damage to the next enemy.',
    fn:(G)=>{ G.upgrades.push({id:'chain_reaction',chainDmg:4}); }},
  { id:'undying', name:'Undying', rarity:'rare', emoji:'💫',
    desc:'All your monsters revive once at 25% HP when they first die.',
    fn:(G)=>{ G.team.forEach(m=>{m._undying=true;}); G.upgrades.push({id:'undying'}); }},
  { id:'frenzy', name:'Frenzy', rarity:'rare', emoji:'🔱',
    desc:'All monsters get +6 ATK but -3 Max HP (current HP capped).',
    fn:(G)=>{ G.team.forEach(m=>{m.atk+=6;m.maxHP=Math.max(1,m.maxHP-3);m.currentHP=Math.min(m.currentHP,m.maxHP);}); G.upgrades.push({id:'frenzy'}); }},
  { id:'storm_front', name:'Storm Front', rarity:'rare', emoji:'⛈️',
    desc:'All your monsters have 30% stun chance on every attack.',
    fn:(G)=>{ G.upgrades.push({id:'storm_front',stunChance:.3}); }},

  // ── Epic ──
  { id:'avatar_of_war', name:'Avatar of War', rarity:'epic', emoji:'⚔️',
    desc:'All monsters get +8 ATK and +10 Max HP. Fully healed.',
    fn:(G)=>{ G.team.forEach(m=>{m.atk+=8;m.maxHP+=10;m.currentHP=m.maxHP;}); G.upgrades.push({id:'avatar_of_war'}); }},
  { id:'apotheosis', name:'Apotheosis', rarity:'epic', emoji:'🌟',
    desc:'One random monster is instantly upgraded to Tier 3.',
    fn:(G)=>{ if(G.team.length>0){ const m=G.team[Math.floor(Math.random()*G.team.length)]; const old=m.tier; m.tier=Math.max(m.tier,3); applyTierScaling(m,old); G.upgrades.push({id:'apotheosis'}); } }},
  { id:'eternal_flame', name:'Eternal Flame', rarity:'epic', emoji:'🔥',
    desc:'Enemies killed in battle respawn on YOUR side at 40% stats.',
    fn:(G)=>{ G.upgrades.push({id:'eternal_flame'}); }},
];

// Player classes (starting condition)
const CLASSES = [
  {
    id:'beastmaster',
    name:'Beastmaster',
    emoji:'🐾',
    desc:'Starts with a random Uncommon monster and 6 gold. Bonded with nature.',
    bonus:'Start with 1 Uncommon monster',
    startGold:6,
    startMonster:'uncommon',
    passive:'When you merge, the new monster gains +2 ATK.',
    passiveId:'beastmaster_merge',
  },
  {
    id:'treasure_hunter',
    name:'Treasure Hunter',
    emoji:'💰',
    desc:'Starts with no monsters but 14 gold. Fortune favors the bold.',
    bonus:'Start with 14 gold',
    startGold:14,
    startMonster:null,
    passive:'Rerolling the shop costs 0 gold once per floor.',
    passiveId:'free_reroll',
  },
  {
    id:'guardian',
    name:'Guardian',
    emoji:'🛡️',
    desc:'Starts with 2 random Common monsters and 5 gold. Strength in numbers.',
    bonus:'Start with 2 Common monsters',
    startGold:5,
    startMonster:'2common',
    passive:'Your frontline monster has +3 passive shield at the start of each battle.',
    passiveId:'guardian_shield',
  },
];

// Meta-progression nodes (Codex)
const META_NODES = [
  // Row 1 (cost 20)
  { id:'field_research', name:'Field Research', emoji:'🔍', cost:20, row:0, col:0, requires:[],
    desc:'See 4 monsters in the shop instead of 3.' },
  { id:'starting_gold', name:'Treasure Trove', emoji:'💰', cost:20, row:0, col:1, requires:[],
    desc:'Start each run with 2 extra gold.' },
  { id:'free_reroll', name:'Scavenger', emoji:'🔄', cost:20, row:0, col:2, requires:[],
    desc:'First reroll each floor is free.' },

  // Row 2 (cost 40)
  { id:'extra_life', name:'Second Chance', emoji:'❤️', cost:40, row:1, col:0, requires:['field_research'],
    desc:'Start each run with 1 extra life.' },
  { id:'fire_mastery', name:'Fire Mastery', emoji:'🔥', cost:40, row:1, col:1, requires:['starting_gold'],
    desc:'Fire monsters start with +2 ATK.' },
  { id:'water_mastery', name:'Water Mastery', emoji:'💧', cost:40, row:1, col:1, requires:['starting_gold'],
    desc:'Water monsters have +2 Max HP.' },
  { id:'rare_shop', name:'Rare Finds', emoji:'💎', cost:40, row:1, col:2, requires:['free_reroll'],
    desc:'Shop always has at least 1 Uncommon or better monster.' },

  // Row 3 (cost 80)
  { id:'veteran_pack', name:'Veteran\'s Pack', emoji:'🎒', cost:80, row:2, col:0, requires:['extra_life'],
    desc:'Start each run with 1 random Common monster in your team.' },
  { id:'elemental_fusion', name:'Elemental Fusion', emoji:'🧬', cost:80, row:2, col:1, requires:['fire_mastery','water_mastery'],
    desc:'Unlocks special fusion bonuses when merging same-element monsters.' },
  { id:'team_upgrade', name:'Elite Squad', emoji:'⬆️', cost:80, row:2, col:2, requires:['rare_shop'],
    desc:'Your team can hold up to 6 monsters instead of 5.' },

  // Row 4 (cost 150)
  { id:'legendary_sight', name:'Legendary Sight', emoji:'👁️', cost:150, row:3, col:0, requires:['veteran_pack','elemental_fusion'],
    desc:'Rare monsters can appear in the shop from floor 3 onward.' },
  { id:'dungeon_expert', name:'Dungeon Expert', emoji:'🗺️', cost:150, row:3, col:2, requires:['elemental_fusion','team_upgrade'],
    desc:'Unlocks Hard Mode (stronger enemies, bigger rewards).' },
];

// Enemy formations by floor
function getEnemyFormation(floor, hardMode) {
  const mult = hardMode ? 1.3 : 1;
  const allCommon  = MONSTERS.filter(m=>m.rarity==='common');
  const allUncommon= MONSTERS.filter(m=>m.rarity==='uncommon');
  const allRare    = MONSTERS.filter(m=>m.rarity==='rare');

  function pickRandom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function scaleEnemy(base, floorNum){
    const floorScale = 1 + (floorNum-1) * 0.12 * mult;
    const scaledHP = Math.round(base.hp * floorScale);
    // Use object spread to preserve ability.fn references (JSON.stringify strips functions)
    const m = {
      ...base,
      atk:        Math.round(base.atk * floorScale),
      hp:         scaledHP,
      maxHP:      scaledHP,
      currentHP:  scaledHP,
      statuses:   {burn:0,poison:0,stun:0,slow:0,shield:base.passiveShield||0,regen:0},
      passiveShield: base.passiveShield||0,
      dodgeChance:   base.dodgeChance||0,
      _reborn:false, _pounced:false, _resurrectUsed:false, _extraAttack:false, _dead:false,
      _undying:false, _undyingUsed:false,
      isEnemy:true,
    };
    return m;
  }

  // Boss floors
  if(floor===5)  return [scaleEnemy(BOSSES[0],floor), scaleEnemy(pickRandom(allUncommon),floor)];
  if(floor===10) return [scaleEnemy(BOSSES[1],floor), scaleEnemy(pickRandom(allUncommon),floor), scaleEnemy(pickRandom(allCommon),floor)];
  if(floor===15) return [scaleEnemy(BOSSES[2],floor), scaleEnemy(pickRandom(allRare),floor), scaleEnemy(pickRandom(allUncommon),floor)];

  // Regular floors
  let formation = [];
  const size = Math.min(5, 1 + Math.floor(floor/2));
  for(let i=0;i<size;i++){
    if(floor<=4)       formation.push(scaleEnemy(pickRandom(allCommon), floor));
    else if(floor<=8)  formation.push(i===0?scaleEnemy(pickRandom(allUncommon),floor):scaleEnemy(pickRandom(allCommon),floor));
    else if(floor<=12) formation.push(i<2?scaleEnemy(pickRandom(allUncommon),floor):scaleEnemy(pickRandom(allCommon),floor));
    else               formation.push(i===0?scaleEnemy(pickRandom(allRare),floor):scaleEnemy(pickRandom(allUncommon),floor));
  }
  return formation;
}

// Scale a monster's stats to its current tier
function applyTierScaling(monster, oldTier) {
  const oldTierMult = tierMultiplier(oldTier);
  const newTierMult = tierMultiplier(monster.tier);
  const ratio = newTierMult / oldTierMult;
  monster.atk  = Math.round(monster.atk  * ratio);
  monster.maxHP= Math.round(monster.maxHP * ratio);
  monster.currentHP = monster.maxHP;
}

function tierMultiplier(tier) {
  return [1, 1, 1.8, 3.0, 5.0][tier] || 1;
}

function getCardPool(floor, unlocked) {
  const common  = CARDS.filter(c=>c.rarity==='common');
  const uncommon= CARDS.filter(c=>c.rarity==='uncommon');
  const rare    = CARDS.filter(c=>c.rarity==='rare');
  const epic    = CARDS.filter(c=>c.rarity==='epic');

  let pool = [...common, ...uncommon];
  if(floor>=6)  pool.push(...rare);
  if(floor>=11) pool.push(...epic);

  function pickRandom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  const picks = [];
  const used = new Set();
  while(picks.length < 3 && picks.length < pool.length) {
    const c = pickRandom(pool);
    if(!used.has(c.id)){ used.add(c.id); picks.push(c); }
  }
  return picks;
}
