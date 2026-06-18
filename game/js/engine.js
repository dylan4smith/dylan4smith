// ============================================================
// CRYPTID CRAWLERS - Game Engine & Battle Simulator
// ============================================================

const META_KEY = 'cryptid_crawlers_meta_v1';

// ── Game State ────────────────────────────────────────────────
const G = {
  // Persistent meta
  meta: { essence:0, bestFloor:0, runsCompleted:0, unlocked:[] },

  // Run state
  floor:1, gold:8, lives:1, hardMode:false,
  team:[], upgrades:[], selectedClass:null,
  shopSlots:[], shopRerolled:false,
  draftOptions:[],
  runEssence:0,

  // Battle
  lastBattleResult:null,
  battleLog:[],
  battleKills:0,

  // UI helpers
  screen:'title',
  animating:false,
};

// ── Meta Persistence ──────────────────────────────────────────
function loadMeta() {
  try {
    const s = localStorage.getItem(META_KEY);
    if(s) Object.assign(G.meta, JSON.parse(s));
  } catch(e) {}
}

function saveMeta() {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(G.meta));
  } catch(e) {}
}

function isUnlocked(id) { return G.meta.unlocked.includes(id); }

function unlock(id) {
  if(!isUnlocked(id)) G.meta.unlocked.push(id);
  saveMeta();
}

function spendEssence(amount) {
  G.meta.essence -= amount;
  saveMeta();
}

// ── Run Setup ─────────────────────────────────────────────────
function startRun(classId, hardMode) {
  const cls = CLASSES.find(c=>c.id===classId);
  G.floor = 1;
  G.team  = [];
  G.upgrades = [];
  G.selectedClass = cls;
  G.hardMode = hardMode || false;
  G.shopRerolled = false;
  G.runEssence = 0;
  G.battleKills = 0;
  G.lives = 1 + (isUnlocked('extra_life') ? 1 : 0);

  // Apply class starting gold
  G.gold = cls.startGold + (isUnlocked('starting_gold') ? 2 : 0);

  // Apply class starting monsters
  const commons   = MONSTERS.filter(m=>m.rarity==='common');
  const uncommons = MONSTERS.filter(m=>m.rarity==='uncommon');

  if(cls.startMonster === 'uncommon') {
    const m = uncommons[Math.floor(Math.random()*uncommons.length)];
    G.team.push(makeBattleReady(m, 1));
  } else if(cls.startMonster === '2common') {
    for(let i=0;i<2;i++){
      const m = commons[Math.floor(Math.random()*commons.length)];
      G.team.push(makeBattleReady(m, 1));
    }
  }

  // Veteran's pack (meta unlock)
  if(isUnlocked('veteran_pack')) {
    const m = commons[Math.floor(Math.random()*commons.length)];
    G.team.push(makeBattleReady(m, 1));
  }

  generateShop();
  Audio.play('start');
}

// ── Monster Helpers ───────────────────────────────────────────
function makeBattleReady(def, tier) {
  const tierMult = tierMultiplier(tier);
  const scaledHP = Math.round(def.hp * tierMult);
  // Use object spread to preserve ability.fn references (JSON.stringify strips functions)
  const m = {
    ...def,
    tier:         tier || 1,
    atk:          Math.round(def.atk * tierMult),
    maxHP:        scaledHP,
    spd:          def.spd,
    currentHP:    scaledHP,
    statuses:     {burn:0,poison:0,stun:0,slow:0,shield:def.passiveShield||0,regen:0},
    passiveShield:def.passiveShield||0,
    dodgeChance:  def.dodgeChance||0,
    _reborn:false, _pounced:false, _resurrectUsed:false, _extraAttack:false,
    _undying:false, _undyingUsed:false, _dead:false,
    isEnemy:false,
  };
  return m;
}

function maxTeamSize() {
  return isUnlocked('team_upgrade') ? 6 : 5;
}

// ── Shop ──────────────────────────────────────────────────────
function generateShop() {
  const commons   = MONSTERS.filter(m=>m.rarity==='common');
  const uncommons = MONSTERS.filter(m=>m.rarity==='uncommon');
  const rares     = MONSTERS.filter(m=>m.rarity==='rare');

  G.shopRerolled = false;
  const shopSize = isUnlocked('field_research') ? 4 : 3;
  const slots = [];
  const used = new Set();

  function pickFrom(arr) {
    let attempts = 0;
    while(attempts < 20) {
      const m = arr[Math.floor(Math.random()*arr.length)];
      if(!used.has(m.id)){ used.add(m.id); return m; }
      attempts++;
    }
    return arr[0];
  }

  // Guarantee at least one uncommon if floor >= 4 or meta-unlocked
  const guaranteeUncommon = G.floor >= 4 || isUnlocked('rare_shop');
  const guaranteeRare = G.floor >= 8 && isUnlocked('legendary_sight') ? G.floor >= 3 : G.floor >= 9;

  for(let i=0;i<shopSize;i++) {
    const roll = Math.random();
    let m;
    if(i === 0 && guaranteeRare && rares.length > 0) {
      m = pickFrom(rares);
    } else if((i===0 && guaranteeUncommon) || roll < (G.floor/30)) {
      m = pickFrom(uncommons);
    } else if(roll < (G.floor/15)) {
      m = rares.length && Math.random()<0.3 ? pickFrom(rares) : pickFrom(uncommons);
    } else {
      m = pickFrom(commons);
    }
    slots.push({ def:m, purchased:false });
  }
  G.shopSlots = slots;
}

function rerollShop() {
  const isFreeReroll = G.selectedClass?.passiveId==='free_reroll' || isUnlocked('free_reroll');
  const cost = (isFreeReroll && !G.shopRerolled) ? 0 : 2;

  if(G.gold < cost) return false;
  G.gold -= cost;
  G.shopRerolled = true;
  generateShop();
  Audio.play('click');
  return true;
}

function buyMonster(slotIndex) {
  const slot = G.shopSlots[slotIndex];
  if(!slot || slot.purchased) return {bought:false};
  if(G.team.length >= maxTeamSize()) return {bought:false, reason:'full'};
  if(G.gold < slot.def.cost) return {bought:false, reason:'gold'};

  G.gold -= slot.def.cost;
  slot.purchased = true;
  const newMonster = makeBattleReady(slot.def, 1);
  G.team.push(newMonster);

  // Apply run-wide upgrades to new monster
  applyUpgradesToMonster(newMonster);

  // Check for merge — returns true if a merge occurred
  const merged = checkMerge();
  return {bought:true, merged};
}

function sellMonster(teamIndex) {
  if(teamIndex < 0 || teamIndex >= G.team.length) return false;
  G.team.splice(teamIndex, 1);
  G.gold += 1;
  Audio.play('click');
  return true;
}

function reorderTeam(fromIdx, toIdx) {
  if(fromIdx===toIdx) return;
  const m = G.team.splice(fromIdx, 1)[0];
  G.team.splice(toIdx, 0, m);
}

function checkMerge() {
  let merged = false;
  const tierMap = {};
  G.team.forEach((m,i) => {
    const key = `${m.id}_t${m.tier}`;
    if(!tierMap[key]) tierMap[key]=[];
    tierMap[key].push(i);
  });

  for(const [key, indices] of Object.entries(tierMap)) {
    if(indices.length >= 3) {
      // Merge: remove the 3 monsters, add 1 tier-up
      const base = G.team[indices[0]];
      const newTier = base.tier + 1;
      const merged3 = indices.slice(0,3).sort((a,b)=>b-a);
      merged3.forEach(i=>G.team.splice(i,1));

      const newMonster = makeBattleReady(
        MONSTERS.find(m=>m.id===base.id) || base,
        newTier
      );
      applyUpgradesToMonster(newMonster);

      // Beastmaster passive: merge bonus
      if(G.selectedClass?.passiveId==='beastmaster_merge') newMonster.atk+=2;

      // Elemental fusion bonus
      if(isUnlocked('elemental_fusion') && newTier >= 2) {
        newMonster.atk  += 1;
        newMonster.maxHP += 3;
        newMonster.currentHP = newMonster.maxHP;
      }

      G.team.unshift(newMonster);
      Audio.play('merge');
      merged = true;
      break; // re-check after re-render
    }
  }
  return merged;
}

function applyUpgradesToMonster(m) {
  G.upgrades.forEach(u => {
    if(u.atk) m.atk  += u.atk;
    if(u.hp)  { m.maxHP += u.hp; m.currentHP += u.hp; }
    if(u.spd) m.spd  += u.spd;
    if(u.shield) m.passiveShield = (m.passiveShield||0) + u.shield;
  });
  // Undying flag
  if(G.upgrades.find(u=>u.id==='undying')) m._undying = true;
}

// ── Card Draft ────────────────────────────────────────────────
function generateDraft() {
  G.draftOptions = getCardPool(G.floor, G.meta.unlocked);
}

function pickCard(index) {
  const card = G.draftOptions[index];
  if(!card) return;
  card.fn(G);
  Audio.play('upgrade');
}

// ── Battle Simulation ─────────────────────────────────────────
function simulateBattle(playerTeam, enemyTeam, upgrades) {
  const log = [];
  let turn = 0;

  // Shallow copy teams — preserves ability.fn references that JSON.stringify would strip
  const players = playerTeam.map(m=>({ ...m, statuses:{...m.statuses} }));
  const enemies = enemyTeam.map(m=>({ ...m, statuses:{...m.statuses} }));

  // Reset per-battle upgrade flags
  upgrades.forEach(u => { u._triggered = false; });

  // Apply run-start statuses
  players.forEach(m => {
    m.statuses.regen = (m.statuses.regen||0);
    if(upgrades.find(u=>u.id==='regenerative')) m.statuses.regen += 2;
    if(upgrades.find(u=>u.id==='iron_wall'))    m.passiveShield = (m.passiveShield||0)+2;
  });

  // Guardian class: frontline shield
  // (already applied to team via upgrades or class passive at battle start in ui)

  const battle = {
    log: (text) => log.push({type:'msg', text}),
    addStatus: (m, type, val) => {
      if(!m.statuses) m.statuses={burn:0,poison:0,stun:0,slow:0,shield:0,regen:0};
      if(type==='shield') m.statuses.shield += val;
      else m.statuses[type] = (m.statuses[type]||0) + val;
    },
    nextAlive: (m) => {
      const arr = enemies.includes(m) ? enemies : players;
      const idx = arr.indexOf(m);
      for(let i=idx+1;i<arr.length;i++) if(arr[i].currentHP>0) return arr[i];
      return null;
    },
    teamOf: (m) => enemies.includes(m) ? enemies : players,
    enemyTeam: (m) => enemies.includes(m) ? players : enemies,
    mostWounded: (team, exclude) => {
      let worst=null, worstHP=Infinity;
      team.forEach(m=>{ if(m.currentHP>0&&m!==exclude&&m.currentHP<worstHP){worstHP=m.currentHP;worst=m;} });
      return worst;
    },
  };

  function alive(arr){ return arr.filter(m=>m.currentHP>0); }

  function lowestHPEnemy(arr){ return arr.filter(m=>m.currentHP>0).sort((a,b)=>a.currentHP-b.currentHP)[0]; }

  function dealDamage(attacker, target, rawDmg) {
    let dmg = rawDmg;

    // Passive shield
    dmg -= (target.passiveShield||0) + (target.statuses?.shield||0);
    target.statuses.shield = 0; // shield consumed on hit
    dmg = Math.max(1, dmg);

    // Elemental modifiers
    const ae = ELEMENTS[attacker.element];
    if(ae) {
      if(ae.strongVs === target.element) dmg = Math.round(dmg * 1.4);
      if(ae.weakTo   === target.element) dmg = Math.round(dmg * 0.7);
    }

    // Evasion check
    if(target.dodgeChance && Math.random() < target.dodgeChance) {
      log.push({type:'dodge', attacker, target, text:`${target.name} dodges! 💨`});
      return 0;
    }

    target.currentHP -= dmg;
    return dmg;
  }

  function triggerAbility(trigger, attacker, target, killedBy) {
    if(!attacker.ability || attacker.ability.trigger !== trigger) return;
    if(!attacker.ability.fn) return;
    try {
      if(trigger==='on_death') attacker.ability.fn(attacker, killedBy, battle);
      else attacker.ability.fn(attacker, target, battle);
    } catch(e){}
  }

  function triggerAllyDeathAbilities(deadMonster, team) {
    team.forEach(m => {
      if(m.currentHP>0 && m.ability?.trigger==='on_ally_death' && m.ability.fn) {
        try { m.ability.fn(m, deadMonster, battle); } catch(e){}
      }
    });
  }

  function checkDeath(m, killer, ownTeam, otherTeam) {
    if(m.currentHP > 0) return false;
    if(m._dead) return true; // already processed
    m.currentHP = 0;
    m._killedBy = killer;

    // Undying check
    if(m._undying && !m._undyingUsed) {
      m._undyingUsed = true;
      m.currentHP = Math.ceil(m.maxHP * 0.25);
      log.push({type:'revive', monster:m, text:`${m.name} refuses to die! (Undying) 💫`});
      return false; // revived, not dead
    }

    // Rebirth ability
    triggerAbility('on_death', m, killer, killer);

    if(m.currentHP > 0) { // rebirth restored HP
      log.push({type:'revive', monster:m, text:`${m.name} is reborn! 🔥`});
      return false; // revived, not dead
    }

    m._dead = true; // mark permanently dead only here
    log.push({type:'death', monster:m, text:`${m.name} is defeated! 💀`});

    // Eternal flame: dead enemy joins player team
    const etFlame = upgrades.find(u=>u.id==='eternal_flame');
    if(etFlame && otherTeam === enemies && players.length < 6) {
      const revived = JSON.parse(JSON.stringify(m));
      revived.atk  = Math.round(revived.atk  * 0.4);
      revived.maxHP= Math.round(revived.maxHP * 0.4);
      revived.currentHP = revived.maxHP;
      revived.isEnemy = false;
      players.push(revived);
      battle.log(`${m.name} joins your side! (Eternal Flame) 🔥`);
    }

    // Chain reaction
    const chain = upgrades.find(u=>u.id==='chain_reaction');
    if(chain && otherTeam === enemies) {
      const next = battle.nextAlive(m);
      if(next) { next.currentHP -= chain.chainDmg; battle.log(`Chain Reaction hits ${next.name} for ${chain.chainDmg}! 💥`); }
    }

    triggerAllyDeathAbilities(m, ownTeam);
    return true;
  }

  while(alive(players).length > 0 && alive(enemies).length > 0 && turn < 80) {
    turn++;
    log.push({type:'turn', turn, text:`── Turn ${turn} ──`});

    // Start-of-turn abilities
    [...alive(players), ...alive(enemies)].forEach(m => {
      triggerAbility('on_turn_start', m, null, null);
    });

    // Regen & DOT
    [...alive(players),...alive(enemies)].forEach(m=>{
      if(!m.statuses) return;
      if(m.statuses.regen>0) { m.currentHP=Math.min(m.maxHP,m.currentHP+m.statuses.regen); }
      if(m.statuses.burn>0)  { m.currentHP-=1; m.statuses.burn=Math.max(0,m.statuses.burn-1); if(m.currentHP<1)m.currentHP=0; }
      if(m.statuses.poison>0){ m.currentHP-=m.statuses.poison; m.statuses.poison=Math.max(0,m.statuses.poison-1); if(m.currentHP<1)m.currentHP=0; }
    });

    // Check deaths from DOT — checkDeath itself sets _dead
    [...players,...enemies].forEach(m=>{
      if(m.currentHP<=0 && !m._dead) {
        const ownTeam = players.includes(m)?players:enemies;
        const otherTeam = players.includes(m)?enemies:players;
        checkDeath(m, null, ownTeam, otherTeam);
      }
    });

    if(alive(players).length===0||alive(enemies).length===0) break;

    // Combat: sorted by effective SPD
    const allMonsters = [
      ...alive(players).map(m=>({m,isPlayer:true})),
      ...alive(enemies).map(m=>({m,isPlayer:false})),
    ].sort((a,b)=>{
      const spdA = a.m.spd - (a.m.statuses?.slow||0);
      const spdB = b.m.spd - (b.m.statuses?.slow||0);
      return spdB - spdA;
    });

    for(const {m:attacker, isPlayer} of allMonsters) {
      if(attacker.currentHP<=0) continue;

      // Stun check
      if(attacker.statuses?.stun>0) {
        attacker.statuses.stun--;
        log.push({type:'stun', monster:attacker, text:`${attacker.name} is stunned! ⭐`});
        continue;
      }

      const opponents = isPlayer ? alive(enemies) : alive(players);
      if(opponents.length===0) break;

      // Ability: Guardian class frontline gets extra shield at battle start (applied once)
      const target = lowestHPEnemy(opponents);
      if(!target) continue;

      // Trigger pre-attack (pounce needs to run BEFORE damage)
      const hadExtraAttack = attacker._extraAttack;
      attacker._extraAttack = false;
      triggerAbility('on_attack', attacker, target, battle);

      // Deal damage
      const dmg = dealDamage(attacker, target, attacker.atk);
      if(dmg > 0) {
        log.push({type:'attack', attacker:{...attacker}, target:{...target}, dmg, text:`${attacker.name} attacks ${target.name} for ${dmg} damage!`});

        // Lifesteal
        const vamp = upgrades.find(u=>u.lifesteal);
        if(vamp && isPlayer) {
          const heal = Math.floor(dmg*vamp.lifesteal);
          attacker.currentHP = Math.min(attacker.maxHP, attacker.currentHP+heal);
        }

        // Storm front stun
        const sf = upgrades.find(u=>u.stunChance);
        if(sf && isPlayer && Math.random()<sf.stunChance) {
          battle.addStatus(target,'stun',1);
          battle.log(`Storm Front stuns ${target.name}!`);
        }

        // Venomous
        const ven = upgrades.find(u=>u.poison);
        if(ven && isPlayer) battle.addStatus(target,'poison',ven.poison);

        // Fortune Favors: track kills
        if(target.currentHP<=0 && isPlayer && upgrades.find(u=>u.id==='fortune_favors')) {
          G.battleKills++;
        }
      }

      // Extra attack from Double Strike
      if(hadExtraAttack || attacker._extraAttack) {
        attacker._extraAttack = false;
        const target2 = lowestHPEnemy(opponents);
        if(target2 && target2.currentHP>0) {
          const dmg2 = dealDamage(attacker, target2, attacker.atk);
          if(dmg2>0) log.push({type:'attack', attacker:{...attacker}, target:{...target2}, dmg:dmg2, text:`${attacker.name} strikes again for ${dmg2}!`});
        }
      }

      // Check all deaths — checkDeath itself sets _dead
      [...players,...enemies].forEach(m=>{
        if(m.currentHP<=0 && !m._dead) {
          const ownTeam = players.includes(m)?players:enemies;
          const otherTeam = players.includes(m)?enemies:players;
          checkDeath(m, attacker, ownTeam, otherTeam);
        }
      });

      // Berserker: first player monster to take damage gets +5 ATK
      const berz = upgrades.find(u=>u.id==='berserker');
      if(berz && !berz._triggered && !isPlayer && dmg > 0 && target) {
        berz._triggered = true;
        target.atk += 5;
        battle.log(`${target.name} goes berserk! +5 ATK 😤`);
      }
    }

    // Slow decrement
    [...players,...enemies].forEach(m=>{
      if(m.statuses?.slow>0) m.statuses.slow--;
    });
  }

  const playerWon = alive(players).length > 0;
  return {
    playerWon,
    log,
    survivors: players.filter(m=>m.currentHP>0),
    finalPlayers: players,
    finalEnemies: enemies,
  };
}

// ── Floor Advance ─────────────────────────────────────────────
function afterBattleWin(result) {
  // Restore survivors' HP to their current (partial) HP
  // Copy surviving HP back to team
  G.team = G.team.map(m => {
    const survivor = result.survivors.find(s=>s.id===m.id&&s.tier===m.tier);
    if(survivor) {
      return {...m, currentHP: survivor.currentHP};
    }
    return {...m, currentHP:0};
  }).filter(m=>m.currentHP>0);

  // Fortune Favors gold
  if(G.upgrades.find(u=>u.id==='fortune_favors')) {
    G.gold += G.battleKills;
  }
  G.battleKills = 0;

  // Gold income
  G.gold += 3;

  // Essence earned this floor
  const bossFloor = (G.floor===5||G.floor===10||G.floor===15);
  const essenceGain = bossFloor ? 20 : 5;
  G.runEssence += essenceGain;

  G.floor++;
}

function afterBattleLoss() {
  G.lives--;
  if(G.lives <= 0) {
    endRun(false);
    return false;
  }
  return true; // still alive
}

function endRun(won) {
  const floorReached = won ? 15 : G.floor;
  const bonusEssence = won ? 50 : 0;
  G.runEssence += bonusEssence;
  G.meta.essence += G.runEssence;
  G.meta.runsCompleted++;
  if(floorReached > G.meta.bestFloor) G.meta.bestFloor = floorReached;
  saveMeta();
}
