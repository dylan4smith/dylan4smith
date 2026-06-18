// ============================================================
// CRYPTID CRAWLERS - Web Audio Sound Effects
// ============================================================

const Audio = (() => {
  let ctx = null;
  let muted = false;

  function getCtx() {
    if(!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
    }
    return ctx;
  }

  function tone(freq, type, vol, duration, delay=0) {
    const c = getCtx();
    if(!c || muted) return;
    try {
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime + delay);
      gain.gain.setValueAtTime(vol, c.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
      osc.start(c.currentTime + delay);
      osc.stop(c.currentTime + delay + duration + 0.01);
    } catch(e){}
  }

  const sounds = {
    click:   ()=>{ tone(440,.3,0.15,.08); },
    buy:     ()=>{ tone(523,.3,0.15,.1); tone(659,.3,0.12,.12); },
    sell:    ()=>{ tone(330,'sawtooth',0.1,.1); },
    merge:   ()=>{ tone(523,.3,0.2,.1);tone(659,.3,0.2,.12);tone(784,.3,0.2,.15);tone(1047,.3,0.25,.19); },
    attack:  ()=>{ tone(220,'sawtooth',0.15,.08); },
    hit:     ()=>{ tone(150,'square',0.2,.12); },
    death:   ()=>{ tone(110,'sawtooth',0.2,.2); },
    upgrade: ()=>{ [523,587,659,698,784].forEach((f,i)=>tone(f,.3,0.2,.12,i*.06)); },
    win:     ()=>{ [523,659,784,1047].forEach((f,i)=>tone(f,.3,0.25,.2,i*.1)); },
    lose:    ()=>{ tone(300,'sawtooth',0.2,.3); tone(200,'sawtooth',0.2,.2,.3); },
    start:   ()=>{ tone(440,.3,0.15,.1);tone(523,.3,0.15,.1,.15); },
    boss:    ()=>{ tone(110,'sawtooth',0.3,.4);tone(88,'sawtooth',0.3,.4,.25); },
  };

  return {
    play(name) {
      if(muted) return;
      try { sounds[name]?.(); } catch(e){}
    },
    toggle() { muted=!muted; return muted; },
    isMuted() { return muted; },
    init() {
      // Resume AudioContext on first interaction
      document.addEventListener('click', ()=>{
        if(ctx && ctx.state==='suspended') ctx.resume();
      }, {once:true});
    }
  };
})();
