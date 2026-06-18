// ============================================================
// CRYPTID CRAWLERS - Initialization & Event Listeners
// ============================================================

// ── CrazyGames SDK ────────────────────────────────────────────
const CG = {
  init() {
    try {
      window.CrazyGames?.SDK?.init?.();
    } catch(e){}
  },
  gameplayStart() { try{ window.CrazyGames?.SDK?.game?.gameplayStart?.(); }catch(e){} },
  gameplayStop()  { try{ window.CrazyGames?.SDK?.game?.gameplayStop?.();  }catch(e){} },
  async midgameAd() {
    return new Promise(resolve=>{
      try {
        window.CrazyGames?.SDK?.ad?.requestMiddleGameAd?.('midgame', {
          adStarted:  ()=>CG.gameplayStop(),
          adFinished: ()=>{ CG.gameplayStart(); resolve(); },
          adError:    ()=>resolve(),
        });
      } catch(e){ resolve(); }
    });
  },
};

// ── Wiring ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadMeta();
  Audio.init();
  CG.init();
  renderTitle();
  wireEvents();
});

function wireEvents() {
  // ── Title ──
  on('btn-play',          ()=>{ Audio.play('click'); renderClassSelect(); });
  on('btn-codex',         ()=>{ Audio.play('click'); renderCodex(); });
  on('btn-how-to-play',   ()=>{ Audio.play('click'); renderHowToPlay(); });

  // ── How to Play ──
  on('btn-howto-back',    ()=>{ Audio.play('click'); renderTitle(); });

  // ── Class Select ──
  on('btn-class-back',    ()=>{ Audio.play('click'); renderTitle(); });

  // Class cards are dynamically created — delegate
  delegate('class-cards', '.btn-choose-class', (e)=>{
    const id = e.target.dataset.id;
    const hard = document.getElementById('hard-mode-toggle')?.checked || false;
    Audio.play('start');
    startRun(id, hard);
    CG.gameplayStart();
    renderShop();
  });

  // ── Shop ──
  on('btn-reroll',        ()=>{ if(rerollShop()) renderShop(); });
  on('btn-fight',         async ()=>{
    if(G.team.length===0){ toast('Buy at least one monster first!','warning'); return; }
    Audio.play('click');

    // Show midgame ad every 5 floors
    if(G.floor%5===0 && G.floor>1) await CG.midgameAd();

    await runBattle();
  });

  // ── Battle ──
  // Skip button wired inside runBattle()

  // ── Game Over ──
  on('btn-retry',         ()=>{ Audio.play('click'); renderClassSelect(); });
  on('btn-gameover-menu', ()=>{ CG.gameplayStop(); Audio.play('click'); renderTitle(); });

  // ── Victory ──
  on('btn-play-again',         ()=>{ Audio.play('click'); renderClassSelect(); });
  on('btn-codex-from-victory', ()=>{ Audio.play('click'); renderCodex(); });
  on('btn-victory-menu',       ()=>{ CG.gameplayStop(); Audio.play('click'); renderTitle(); });

  // ── Codex ──
  on('btn-codex-back',    ()=>{ Audio.play('click'); renderTitle(); });

  // ── Mute button (dynamically in HUD if we add it) ──
  // Keyboard shortcut M to mute
  document.addEventListener('keydown', e=>{
    if(e.key==='m'||e.key==='M') {
      const muted = Audio.toggle();
      toast(muted?'🔇 Sound Off':'🔊 Sound On');
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────
function on(id, fn) {
  document.getElementById(id)?.addEventListener('click', fn);
}

function delegate(parentId, selector, fn) {
  document.getElementById(parentId)?.addEventListener('click', e=>{
    const target = e.target.closest(selector);
    if(target) fn({target, originalEvent:e});
  });
}
