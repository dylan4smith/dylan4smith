// ============================================================
// CRYPTID CRAWLERS - UI Layer
// ============================================================

// ── Screen Management ─────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  G.screen = id;
}

function showPhase(id) {
  document.querySelectorAll('.phase').forEach(p=>p.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

// ── Toast Notifications ───────────────────────────────────────
function toast(msg, type='info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(()=>el.classList.add('visible'), 10);
  setTimeout(()=>{ el.classList.remove('visible'); setTimeout(()=>el.remove(), 400); }, 2500);
}

// ── HUD ───────────────────────────────────────────────────────
function updateHUD() {
  document.getElementById('hud-floor').textContent = G.floor;
  document.getElementById('hud-gold').textContent  = G.gold;
  const livesEl = document.getElementById('hud-lives');
  livesEl.textContent = '❤️'.repeat(G.lives) || '💔';
  const phaseEl = document.getElementById('hud-phase');
  const isBoss = G.floor===5||G.floor===10||G.floor===15;
  phaseEl.textContent = isBoss ? `⚠️ BOSS FLOOR ${G.floor}` : `Floor ${G.floor}`;
  phaseEl.style.color = isBoss ? '#ff4444' : '';
}

// ── Monster Card Element ──────────────────────────────────────
function makeMonsterCard(monster, opts={}) {
  const el = document.createElement('div');
  const el2 = ELEMENTS[monster.element] || ELEMENTS.neutral;
  const rarityColor = {common:'#9ca3af',uncommon:'#34d399',rare:'#60a5fa',epic:'#c084fc',boss:'#ff4444'}[monster.rarity]||'#9ca3af';
  const tierStars = monster.tier>1 ? '⭐'.repeat(Math.min(monster.tier-1,3)) : '';

  el.className = `monster-card rarity-${monster.rarity}`;
  el.style.setProperty('--el-color', el2.color);
  el.style.setProperty('--el-bg', el2.bg);
  el.style.borderColor = rarityColor;
  if(opts.selected) el.classList.add('selected');
  if(opts.enemy) el.classList.add('enemy-card');

  const statusIcons = [];
  if(monster.statuses) {
    const s = monster.statuses;
    if(s.burn>0)   statusIcons.push(`<span title="Burn ${s.burn}" class="status-icon" style="color:#ff6b35">🔥${s.burn}</span>`);
    if(s.poison>0) statusIcons.push(`<span title="Poison ${s.poison}" class="status-icon" style="color:#56cf7a">☠️${s.poison}</span>`);
    if(s.stun>0)   statusIcons.push(`<span title="Stun" class="status-icon" style="color:#ffd60a">⭐</span>`);
    if(s.slow>0)   statusIcons.push(`<span title="Slow" class="status-icon" style="color:#4facde">🐌</span>`);
    if(s.shield>0) statusIcons.push(`<span title="Shield ${s.shield}" class="status-icon" style="color:#60a5fa">🛡️${s.shield}</span>`);
    if(s.regen>0)  statusIcons.push(`<span title="Regen ${s.regen}" class="status-icon" style="color:#34d399">💚</span>`);
  }

  const hpPct = monster.maxHP ? Math.max(0, Math.min(100, (monster.currentHP/monster.maxHP)*100)) : 100;
  const hpColor = hpPct>60?'#34d399':hpPct>30?'#fbbf24':'#ff4444';

  el.innerHTML = `
    <div class="card-tier">${tierStars}</div>
    <div class="card-emoji">${monster.emoji}</div>
    <div class="card-name">${monster.name}</div>
    <div class="card-element" style="background:${el2.bg};color:${el2.color};border-color:${el2.color}">${el2.icon} ${el2.name}</div>
    ${monster.maxHP ? `
    <div class="card-hp-bar">
      <div class="card-hp-fill" style="width:${hpPct}%;background:${hpColor}"></div>
    </div>
    <div class="card-hp-text">${monster.currentHP}/${monster.maxHP}</div>` : ''}
    <div class="card-stats">
      <span title="Attack">⚔️ ${monster.atk}</span>
      <span title="Speed">💨 ${monster.spd}</span>
      ${monster.cost?`<span title="Cost" class="card-cost">💰${monster.cost}</span>`:''}
    </div>
    ${monster.ability?`<div class="card-ability" title="${monster.ability.desc}">✦ ${monster.ability.name}</div>`:''}
    ${statusIcons.length?`<div class="card-statuses">${statusIcons.join('')}</div>`:''}
  `;

  return el;
}

// ── Title Screen ──────────────────────────────────────────────
function renderTitle() {
  const stats = document.getElementById('title-stats');
  if(G.meta.runsCompleted > 0) {
    stats.innerHTML = `
      <div class="title-stat">✨ Essence: ${G.meta.essence}</div>
      <div class="title-stat">🏆 Best Floor: ${G.meta.bestFloor}/15</div>
      <div class="title-stat">🔄 Runs: ${G.meta.runsCompleted}</div>
    `;
  } else {
    stats.innerHTML = `<div class="title-stat first-run">New adventure begins...</div>`;
  }
  showScreen('screen-title');
}

// ── Class Select ──────────────────────────────────────────────
function renderClassSelect() {
  const container = document.getElementById('class-cards');
  container.innerHTML = '';
  CLASSES.forEach(cls => {
    const el = document.createElement('div');
    el.className = 'class-card';
    el.innerHTML = `
      <div class="class-emoji">${cls.emoji}</div>
      <div class="class-name">${cls.name}</div>
      <div class="class-desc">${cls.desc}</div>
      <div class="class-bonus-label">Starting Bonus</div>
      <div class="class-bonus">${cls.bonus}</div>
      <div class="class-passive-label">Passive</div>
      <div class="class-passive">${cls.passive}</div>
      <button class="btn btn-primary btn-choose-class" data-id="${cls.id}">Choose</button>
    `;
    container.appendChild(el);
  });
  const diffRow = document.createElement('div');
  diffRow.className = 'difficulty-row';
  diffRow.innerHTML = `
    <label class="difficulty-label">
      <input type="checkbox" id="hard-mode-toggle" ${G.meta.unlocked.includes('dungeon_expert')?'':'disabled'}>
      ${G.meta.unlocked.includes('dungeon_expert') ? '💀 Hard Mode' : '💀 Hard Mode (unlock in Codex)'}
    </label>
  `;
  container.appendChild(diffRow);
  showScreen('screen-class');
}

// ── Shop Phase ────────────────────────────────────────────────
function renderShop() {
  updateHUD();
  const shopEl   = document.getElementById('shop-monsters');
  const teamEl   = document.getElementById('team-display');
  const countEl  = document.getElementById('team-count');
  const rerollEl = document.getElementById('btn-reroll');
  shopEl.innerHTML = '';
  teamEl.innerHTML = '';

  const isBoss = G.floor===5||G.floor===10||G.floor===15;
  if(isBoss) {
    const warning = document.createElement('div');
    warning.className = 'boss-warning';
    warning.innerHTML = `⚠️ BOSS FLOOR! Prepare carefully!`;
    shopEl.parentElement.insertBefore(warning, shopEl);
  }

  // Shop slots
  G.shopSlots.forEach((slot, i) => {
    if(slot.purchased) return;
    const card = makeMonsterCard(slot.def);
    card.classList.add('shop-card');
    const affordable = G.gold >= slot.def.cost;
    const full = G.team.length >= maxTeamSize();
    if(!affordable || full) card.classList.add('unaffordable');
    card.addEventListener('click', ()=>{
      const result = buyMonster(i);
      if(result.bought) {
        Audio.play('buy');
        if(result.merged) toast('✨ MERGE! Monster evolved!', 'success');
        renderShop();
      } else {
        if(result.reason==='gold')  toast('Not enough gold! 💰','warning');
        else if(result.reason==='full') toast('Team is full!','warning');
      }
    });
    const buyBtn = document.createElement('div');
    buyBtn.className = 'card-buy-btn';
    buyBtn.textContent = `Buy (${slot.def.cost}💰)`;
    card.appendChild(buyBtn);
    shopEl.appendChild(card);
  });

  // Reroll button
  const isFreeReroll = (G.selectedClass?.passiveId==='free_reroll'||isUnlocked('free_reroll')) && !G.shopRerolled;
  rerollEl.textContent = `🔄 Reroll ${isFreeReroll ? '(FREE)' : '(2💰)'}`;
  rerollEl.disabled = !isFreeReroll && G.gold < 2;

  // Team display
  countEl.textContent = `(${G.team.length}/${maxTeamSize()})`;
  G.team.forEach((monster, i) => {
    const card = makeMonsterCard(monster);
    card.classList.add('team-card');

    // Drag to reorder
    card.setAttribute('draggable', 'true');
    card.dataset.index = i;
    card.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', i); card.classList.add('dragging'); });
    card.addEventListener('dragend', ()=>card.classList.remove('dragging'));
    card.addEventListener('dragover', e=>{ e.preventDefault(); card.classList.add('drag-over'); });
    card.addEventListener('dragleave', ()=>card.classList.remove('drag-over'));
    card.addEventListener('drop', e=>{
      e.preventDefault(); card.classList.remove('drag-over');
      const from = parseInt(e.dataTransfer.getData('text/plain'));
      reorderTeam(from, i); renderShop();
    });

    // Sell button
    const sellBtn = document.createElement('div');
    sellBtn.className = 'card-sell-btn';
    sellBtn.textContent = 'Sell (1💰)';
    sellBtn.addEventListener('click', e=>{
      e.stopPropagation();
      sellMonster(i);
      toast('Sold for 1💰');
      renderShop();
    });
    card.appendChild(sellBtn);

    // Position label
    const posLabel = document.createElement('div');
    posLabel.className = 'card-pos-label';
    posLabel.textContent = i===0 ? '① Front' : `${['②','③','④','⑤','⑥'][i-1] || i+1}`;
    card.appendChild(posLabel);

    teamEl.appendChild(card);
  });

  if(G.team.length === 0) {
    teamEl.innerHTML = '<div class="empty-team-hint">Buy monsters from the shop above to build your team!</div>';
  }

  // Merge hints
  const tierMap = {};
  G.team.forEach(m=>{
    const key=`${m.id}_t${m.tier}`;
    tierMap[key]=(tierMap[key]||0)+1;
  });
  Object.entries(tierMap).forEach(([key,n])=>{
    if(n===2) {
      const name=G.team.find(m=>`${m.id}_t${m.tier}`===key)?.name;
      // Highlight matching cards
      const cards=[...teamEl.querySelectorAll('.team-card')];
      let matched=0;
      cards.forEach((c,ci)=>{
        const m=G.team[ci];
        if(m&&`${m.id}_t${m.tier}`===key&&matched<2){
          c.classList.add('merge-ready');
          matched++;
        }
      });
    }
  });

  showPhase('phase-shop');
  showScreen('screen-game');
}

// ── Battle Phase ──────────────────────────────────────────────
async function runBattle() {
  if(G.team.length === 0) { toast('You need at least 1 monster!','warning'); return; }

  const isBoss = G.floor===5||G.floor===10||G.floor===15;
  if(isBoss) Audio.play('boss');

  // Apply guardian class passive (frontline shield)
  if(G.selectedClass?.passiveId==='guardian_shield' && G.team.length>0) {
    G.team[0].statuses.shield = (G.team[0].statuses.shield||0)+3;
  }

  const enemyTeam = getEnemyFormation(G.floor, G.hardMode);
  const result = simulateBattle(G.team, enemyTeam, G.upgrades);
  G.lastBattleResult = result;

  showPhase('phase-battle');

  const playerBattleEl = document.getElementById('player-team-battle');
  const enemyBattleEl  = document.getElementById('enemy-team-battle');
  const battleLogEl    = document.getElementById('battle-log');
  playerBattleEl.innerHTML = '';
  enemyBattleEl.innerHTML  = '';
  battleLogEl.innerHTML    = '';

  // Create visual cards for battle
  const pCards = G.team.map(m=>{
    const card = makeMonsterCard(m);
    playerBattleEl.appendChild(card);
    return card;
  });
  const eCards = enemyTeam.map(m=>{
    const card = makeMonsterCard(m);
    card.classList.add('enemy-card');
    enemyBattleEl.appendChild(card);
    return card;
  });

  // Skip button logic
  let skip = false;
  document.getElementById('btn-skip-battle').onclick = ()=>{ skip=true; };

  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

  function updateCard(card, monster) {
    const hpBar = card.querySelector('.card-hp-fill');
    const hpText= card.querySelector('.card-hp-text');
    if(hpBar && monster.maxHP) {
      const pct = Math.max(0, Math.min(100, (monster.currentHP/monster.maxHP)*100));
      const col = pct>60?'#34d399':pct>30?'#fbbf24':'#ff4444';
      hpBar.style.width = pct+'%';
      hpBar.style.background = col;
    }
    if(hpText) hpText.textContent = `${Math.max(0,monster.currentHP)}/${monster.maxHP}`;
  }

  function addLog(text, type='normal') {
    const row = document.createElement('div');
    row.className = `log-row log-${type}`;
    row.textContent = text;
    battleLogEl.appendChild(row);
    battleLogEl.scrollTop = battleLogEl.scrollHeight;
  }

  const DELAY = 280;

  for(const event of result.log) {
    if(skip) break;
    await sleep(skip?0:DELAY);

    if(event.type==='turn') {
      addLog(event.text, 'turn');
      // Update all cards with final states from that turn
      result.finalPlayers.forEach((fm,i)=>{ if(pCards[i]) updateCard(pCards[i],fm); });
      result.finalEnemies.forEach((fm,i)=>{ if(eCards[i]) updateCard(eCards[i],fm); });
    } else if(event.type==='attack') {
      Audio.play('attack');
      // Find cards and animate
      const aIdx = G.team.findIndex(m=>m.id===event.attacker.id&&m.tier===event.attacker.tier);
      const eIdx = enemyTeam.findIndex(m=>m.id===event.target.id);
      const pIdx = G.team.findIndex(m=>m.id===event.target.id&&m.tier===event.target.tier);
      const eAIdx= enemyTeam.findIndex(m=>m.id===event.attacker.id);

      const attackerCard = aIdx>=0?pCards[aIdx]:eCards[eAIdx];
      const targetCard   = pIdx>=0?pCards[pIdx]:eCards[eIdx];

      if(attackerCard){ attackerCard.classList.add('card-attacking'); setTimeout(()=>attackerCard.classList.remove('card-attacking'),350); }
      if(targetCard)  { Audio.play('hit'); targetCard.classList.add('card-hit'); setTimeout(()=>targetCard.classList.remove('card-hit'),350); }
      addLog(event.text);

      // Update target HP using the snapshot stored in the log event (post-attack state)
      if(targetCard) updateCard(targetCard, event.target);

    } else if(event.type==='death') {
      Audio.play('death');
      const dIdx = G.team.findIndex(m=>m.id===event.monster.id&&m.tier===event.monster.tier);
      const deIdx= enemyTeam.findIndex(m=>m.id===event.monster.id);
      const card  = dIdx>=0?pCards[dIdx]:eCards[deIdx];
      if(card){ card.classList.add('card-dying'); }
      addLog(event.text, 'death');
    } else if(event.type==='revive') {
      addLog(event.text, 'special');
    } else if(event.type==='stun') {
      addLog(event.text, 'status');
    } else if(event.type==='dodge') {
      addLog(event.text, 'dodge');
    } else if(event.type==='msg') {
      addLog(event.text, 'ability');
    }
  }

  // Final state update
  result.finalPlayers.forEach((fm,i)=>{ if(pCards[i]) { updateCard(pCards[i],fm); if(fm.currentHP<=0)pCards[i].classList.add('card-dying'); }});
  result.finalEnemies.forEach((fm,i)=>{ if(eCards[i]) { updateCard(eCards[i],fm); if(fm.currentHP<=0)eCards[i].classList.add('card-dying'); }});

  await sleep(500);

  if(result.playerWon) {
    Audio.play('win');
    addLog('🎉 VICTORY! You advance to the next floor!', 'victory');
    await sleep(800);
    afterBattleWin(result);

    if(G.floor > 15) {
      endRun(true);
      showVictory();
    } else {
      generateDraft();
      renderDraft();
    }
  } else {
    Audio.play('lose');
    addLog('💀 Defeated... Your team was overwhelmed.', 'defeat');
    await sleep(1000);
    const stillAlive = afterBattleLoss();
    if(!stillAlive) {
      showGameOver();
    } else {
      toast(`Lost a life! ${G.lives} remaining. ❤️`, 'warning');
      generateShop();
      renderShop();
    }
  }
}

// ── Card Draft ────────────────────────────────────────────────
function renderDraft() {
  const container = document.getElementById('draft-cards');
  container.innerHTML = '';

  G.draftOptions.forEach((card, i) => {
    const rarityColor = {common:'#9ca3af',uncommon:'#34d399',rare:'#60a5fa',epic:'#c084fc'}[card.rarity]||'#9ca3af';
    const el = document.createElement('div');
    el.className = `draft-card rarity-${card.rarity}`;
    el.style.borderColor = rarityColor;
    el.innerHTML = `
      <div class="draft-card-rarity" style="color:${rarityColor}">${card.rarity.toUpperCase()}</div>
      <div class="draft-card-emoji">${card.emoji}</div>
      <div class="draft-card-name">${card.name}</div>
      <div class="draft-card-desc">${card.desc}</div>
    `;
    el.addEventListener('click', ()=>{
      pickCard(i);
      toast(`✅ ${card.name} applied!`, 'success');
      generateShop();
      renderShop();
    });
    container.appendChild(el);
  });

  showPhase('phase-draft');
  showScreen('screen-game');
}

// ── End Screens ───────────────────────────────────────────────
function showGameOver() {
  const statsEl   = document.getElementById('gameover-stats');
  const essenceEl = document.getElementById('gameover-essence');
  statsEl.innerHTML = `
    <div class="end-stat">🏰 Floor Reached: <strong>${G.floor}/15</strong></div>
    <div class="end-stat">👾 Enemies Defeated: <strong>${G.battleKills}</strong></div>
    <div class="end-stat">⚔️ Upgrades Earned: <strong>${G.upgrades.length}</strong></div>
  `;
  essenceEl.innerHTML = `
    <div class="essence-gained">+${G.runEssence} ✨ Essence Earned</div>
    <div class="essence-total">Total: ${G.meta.essence} ✨</div>
    <div class="essence-hint">Spend Essence in the Codex to unlock permanent upgrades!</div>
  `;
  showScreen('screen-gameover');
}

function showVictory() {
  const statsEl   = document.getElementById('victory-stats');
  const essenceEl = document.getElementById('victory-essence');
  statsEl.innerHTML = `
    <div class="end-stat">🏆 All 15 Floors Cleared!</div>
    <div class="end-stat">❤️ Survived with ${G.lives} ${G.lives===1?'life':'lives'}</div>
    <div class="end-stat">⚔️ Upgrades: <strong>${G.upgrades.length}</strong></div>
    <div class="end-stat">🔥 ${G.hardMode?'HARD MODE':'Normal Mode'}</div>
  `;
  essenceEl.innerHTML = `
    <div class="essence-gained">+${G.runEssence} ✨ Essence Earned</div>
    <div class="essence-total">Total: ${G.meta.essence} ✨</div>
    ${!G.meta.unlocked.includes('dungeon_expert')?'<div class="essence-hint">Hard Mode unlocks in the Codex!</div>':''}
  `;
  showScreen('screen-victory');
}

// ── Codex (Meta-Progression) ──────────────────────────────────
function renderCodex() {
  document.getElementById('codex-essence-count').textContent = G.meta.essence;
  const content = document.getElementById('codex-content');
  content.innerHTML = '';

  const rows = {};
  META_NODES.forEach(n=>{ if(!rows[n.row]) rows[n.row]=[]; rows[n.row].push(n); });

  Object.entries(rows).forEach(([rowNum, nodes])=>{
    const rowEl = document.createElement('div');
    rowEl.className = 'codex-row';

    nodes.forEach(node=>{
      const unlocked = isUnlocked(node.id);
      const canAfford = G.meta.essence >= node.cost;
      const prereqsMet = node.requires.every(r=>isUnlocked(r));

      const el = document.createElement('div');
      el.className = `codex-node ${unlocked?'unlocked':''} ${!prereqsMet?'locked':''}`;

      el.innerHTML = `
        <div class="node-emoji">${node.emoji}</div>
        <div class="node-name">${node.name}</div>
        <div class="node-desc">${node.desc}</div>
        <div class="node-cost">${unlocked?'✅ Unlocked':`${node.cost} ✨`}</div>
      `;

      if(!unlocked && prereqsMet) {
        const btn = document.createElement('button');
        btn.className = `btn btn-codex-unlock ${canAfford?'':'btn-disabled'}`;
        btn.textContent = canAfford ? 'Unlock' : 'Not enough ✨';
        btn.addEventListener('click', ()=>{
          if(G.meta.essence < node.cost) { toast('Not enough Essence!','warning'); return; }
          spendEssence(node.cost);
          unlock(node.id);
          Audio.play('upgrade');
          toast(`✅ ${node.name} unlocked!`,'success');
          renderCodex();
        });
        el.appendChild(btn);
      }

      rowEl.appendChild(el);
    });

    content.appendChild(rowEl);
  });

  // Stats section
  const statsEl = document.createElement('div');
  statsEl.className = 'codex-stats';
  statsEl.innerHTML = `
    <h3>Your Stats</h3>
    <div class="codex-stat-row">
      <div class="codex-stat">🏆 Best Floor: <strong>${G.meta.bestFloor}/15</strong></div>
      <div class="codex-stat">🔄 Runs: <strong>${G.meta.runsCompleted}</strong></div>
      <div class="codex-stat">✨ Total Essence: <strong>${G.meta.essence + (G.runEssence||0)}</strong></div>
    </div>
  `;
  content.appendChild(statsEl);

  showScreen('screen-codex');
}

// ── How to Play ───────────────────────────────────────────────
function renderHowToPlay() {
  showScreen('screen-howto');
}
