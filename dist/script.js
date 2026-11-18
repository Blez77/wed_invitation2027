// Lock scrolling until the seal is tapped
const scrollLock = (() => {
  const root = document.documentElement;
  const block = (e) => { if (root.classList.contains('scroll-locked')) e.preventDefault(); };
  const keys = (e) => {
    if (!root.classList.contains('scroll-locked')) return;
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Spacebar'].includes(e.key) && e.target === document.body) e.preventDefault();
  };
  if (document.querySelector('#opening')) {
    root.classList.add('scroll-locked');
    window.scrollTo(0, 0);
    window.addEventListener('wheel', block, { passive: false });
    window.addEventListener('touchmove', block, { passive: false });
    window.addEventListener('keydown', keys);
  }
  return {
    release() {
      root.classList.remove('scroll-locked');
      window.removeEventListener('wheel', block);
      window.removeEventListener('touchmove', block);
      window.removeEventListener('keydown', keys);
    }
  };
})();

// Gold leaf flakes scattered over the envelope (fixed seed so every guest sees the same pattern)
(() => {
  const box = document.querySelector('#goldFlakes');
  if (!box) return;
  let seed = 4187;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const shapes = [
    'polygon(10% 30%, 45% 0, 90% 18%, 100% 62%, 60% 100%, 12% 82%)',
    'polygon(0 45%, 30% 8%, 78% 0, 100% 40%, 70% 90%, 22% 100%)',
    'polygon(20% 0, 85% 12%, 100% 70%, 48% 100%, 0 64%)',
    'polygon(0 20%, 60% 0, 100% 34%, 82% 100%, 18% 78%)'
  ];
  const count = 46;
  for (let i = 0; i < count; i++) {
    const f = document.createElement('span');
    // favour the edges and corners so the centre (seal) stays clean
    let x = rnd() * 100, y = rnd() * 100;
    if (Math.abs(x - 50) < 22 && Math.abs(y - 56) < 16) { x = (x + 40) % 100; }
    const size = 2 + Math.pow(rnd(), 2.2) * 12;
    f.className = 'flake' + (size > 8 ? ' flake-lg' : '');
    f.style.cssText = `left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;width:${size.toFixed(1)}px;height:${(size * (0.6 + rnd() * 0.7)).toFixed(1)}px;` +
      `clip-path:${shapes[i % shapes.length]};transform:rotate(${Math.round(rnd() * 360)}deg);` +
      `animation-delay:${(rnd() * -8).toFixed(2)}s;animation-duration:${(5 + rnd() * 5).toFixed(2)}s;opacity:${(0.65 + rnd() * 0.35).toFixed(2)};` +
      `--fx:${((rnd() - .5) * 14).toFixed(1)}px;--fy:${(-4 - rnd() * 10).toFixed(1)}px;--fr:${((rnd() > .5 ? 1 : -1) * (12 + rnd() * 30)).toFixed(0)}deg`;
    box.appendChild(f);
  }
})();

// Personal guest line: add ?guest=Name&seats=2 to the link you send each guest
(() => {
  const params = new URLSearchParams(location.search);
  const guest = (params.get('guest') || '').trim().slice(0, 60);
  if (!guest || !document.querySelector('#coverGuest')) return;
  const seats = Math.max(1, Math.min(9, parseInt(params.get('seats') || '1', 10) || 1));
  document.querySelector('#guestName').textContent = guest;
  document.querySelector('#guestSeats').textContent = `We have reserved ${seats} ${seats === 1 ? 'seat' : 'seats'} for you`;
  document.querySelector('#coverGuest').hidden = false;
})();

const opening = document.querySelector('#opening');
const openButton = document.querySelector('#openInvitation');
const foldCard = document.querySelector('#foldCard');

openButton.addEventListener('click', () => {
  if (opening.classList.contains('opening-active')) return;
  const invitation = document.querySelector('#invitation');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  openButton.setAttribute('aria-expanded', 'true');

  // Keep the envelope fixed on screen and park the page (invisible) at the top underneath it
  opening.classList.add('opening-pinned');
  window.scrollTo(0, 0);
  invitation.classList.add('pre-reveal');
  void invitation.offsetHeight;

  // 1) seal lifts, envelope dissolves into plain ivory paper
  opening.classList.add('opening-active');

  // 2) once only ivory remains, remove the envelope and let the page bloom in
  window.setTimeout(() => {
    // fade the page in ON TOP of the paper-coloured envelope screen, then remove the envelope
    invitation.classList.add('reveal-in', 'revealed');
    scrollLock.release();
    document.body.classList.add('petals-on');
    window.setTimeout(() => {
      opening.hidden = true;
      opening.style.display = 'none';
      invitation.classList.remove('pre-reveal', 'reveal-in');
    }, reduce ? 0 : 1450);
  }, reduce ? 0 : 1250);
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    if (entry.target.contains(foldCard) || entry.target === foldCard) foldCard.classList.add('in-view');
    observer.unobserve(entry.target);
  });
}, { threshold: .18 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

const eventStart = new Date('2027-04-18T16:30:00+08:00');
const eventEnd = new Date('2027-04-18T22:00:00+08:00');
const countdown = document.querySelector('#countdown');

const pad = (n) => String(n).padStart(2, '0');
function updateCountdown() {
  const diff = eventStart - new Date();
  if (diff <= 0) {
    document.querySelector('#clock').hidden = true;
    countdown.textContent = new Date() < eventEnd ? 'Today is our wedding day' : 'Thank you for celebrating with us';
    return false;
  }
  const s = Math.floor(diff / 1000);
  document.querySelector('#cdDays').textContent = Math.floor(s / 86400);
  document.querySelector('#cdHours').textContent = pad(Math.floor(s / 3600) % 24);
  document.querySelector('#cdMins').textContent = pad(Math.floor(s / 60) % 60);
  document.querySelector('#cdSecs').textContent = pad(s % 60);
  countdown.textContent = 'until we say I do';
  return true;
}
if (updateCountdown()) setInterval(updateCountdown, 1000);

document.querySelector('#calendarButton').addEventListener('click', () => {
  const format = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Our Wedding Day//EN',
    'BEGIN:VEVENT', `DTSTART:${format(eventStart)}`, `DTEND:${format(eventEnd)}`,
    'SUMMARY:Our Wedding Day', 'LOCATION:Prive by the Sea',
    'DESCRIPTION:Intimate ceremony followed by dinner and celebration.',
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
  link.download = 'our-wedding-day.ics';
  link.click();
  URL.revokeObjectURL(link.href);
});

const timeline = document.querySelector('.timeline');
if (timeline) new IntersectionObserver((entries, obs) => {
  entries.forEach((entry) => { if (entry.isIntersecting) { timeline.classList.add('in'); obs.disconnect(); } });
}, { threshold: .2 }).observe(timeline);

// Falling calla petals + gold flakes over the venue drawing (starts when the page is revealed)
(() => {
  const box = document.querySelector('#heroFall');
  if (!box) return;
  let seed = 9173;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const make = (cls, n, sizeMin, sizeMax) => {
    for (let i = 0; i < n; i++) {
      const el = document.createElement('span');
      const w = sizeMin + rnd() * (sizeMax - sizeMin);
      el.className = cls;
      el.style.cssText = `left:${(4 + rnd() * 92).toFixed(1)}%;width:${w.toFixed(1)}px;height:${(cls === 'petal' ? w * 1.45 : w * (0.6 + rnd() * 0.6)).toFixed(1)}px;` +
        `--dur:${(30 + rnd() * 14).toFixed(2)}s;--delay:${(rnd() * 22).toFixed(2)}s;--sway:${(26 + rnd() * 34).toFixed(0)}px;--sw:${(6 + rnd() * 4).toFixed(2)}s;--fl:${(4.5 + rnd() * 3).toFixed(2)}s;--fx:${(rnd() * .8 + .2).toFixed(2)};` +
        `--spin:${(rnd() > .5 ? 1 : -1) * (180 + Math.round(rnd() * 360))}deg;--tilt:${Math.round(rnd() * 360)}deg;--op:${(0.45 + rnd() * 0.25).toFixed(2)}`;
      const inner = document.createElement('i');
      el.appendChild(inner);
      box.appendChild(el);
    }
  };
  // move the layer out of the house drawing so petals fall over the whole page
  document.body.appendChild(box);
  box.classList.add('page-fall');
  make('petal', 10, 8, 13);
  make('gflake', 8, 3, 6);
})();

// Smooth per-element scroll reveal for all text on the page
(() => {
  const invitation = document.querySelector('#invitation');
  const groups = [
    '.hero-copy > *',
    '.block .eyebrow', '.script-title',
    '.clock > div', '.onepage .countdown',
    '.details-block .detail-block',
    '.tl2 .tl2-text',
    '.onepage .story p:not(.eyebrow)',
    '.rsvp > p:not(.signoff)', '.rsvp-note', '.calendar-button', '.closing-seal', '.signoff'
  ];
  const items = [];
  groups.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      if (el.hasAttribute('data-sr')) return;
      el.setAttribute('data-sr', '');
      // small stagger between siblings of the same group (e.g. countdown boxes, timeline rows)
      const sibs = [...el.parentElement.children].filter((c) => c.matches(sel));
      el.style.setProperty('--sr-delay', `${Math.min(sibs.indexOf(el), 6) * 90}ms`);
      
      items.push(el);
    });
  });
  document.documentElement.classList.add('sr-ready');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('sr-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  const start = () => items.forEach((el) => io.observe(el));
  // wait until the envelope has opened so the first lines animate in view, not while hidden
  if (invitation.classList.contains('revealed') || !document.querySelector('#opening')) start();
  else new MutationObserver((m, mo) => {
    if (invitation.classList.contains('revealed')) { mo.disconnect(); setTimeout(start, 250); }
  }).observe(invitation, { attributes: true, attributeFilter: ['class'] });
})();

// Background music: an original, generated piano + pad prelude (no audio file needed).
// Starts softly on the seal tap (a user gesture, so browsers allow sound).
(() => {
  const toggle = document.querySelector('#musicToggle');
  const seal = document.querySelector('#openInvitation');
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!toggle || !seal || !AC) return;

  let ctx, master, wet, timer, nextTime = 0, step = 0, playing = false;
  // Romantic & warm: F major love theme, 58 bpm
  const BPM = 58, BEAT = 60 / BPM, EIGHTH = BEAT / 2;
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  // 8 bars per phrase, 2 bars per chord
  const bars = [
    { bass: 41, tones: [53, 57, 60, 64] },  // Fmaj7
    { bass: 41, tones: [53, 57, 60, 64] },
    { bass: 38, tones: [50, 53, 57, 64] },  // Dm9
    { bass: 38, tones: [50, 53, 57, 64] },
    { bass: 34, tones: [50, 53, 57, 62] },  // Bbmaj7
    { bass: 34, tones: [50, 53, 57, 62] },
    { bass: 36, tones: [55, 58, 60, 65] },  // C7sus
    { bass: 36, tones: [55, 60, 64, 67] }   // C
  ];
  // singing melody: [eighth position in bar, note, length in eighths]
  const melody = [
    [[0, 69, 3], [3, 72, 1], [4, 76, 4]],
    [[0, 74, 2], [2, 72, 2], [4, 69, 4]],
    [[0, 77, 3], [3, 76, 1], [4, 74, 2], [6, 72, 2]],
    [[0, 69, 6]],
    [[0, 74, 3], [3, 72, 1], [4, 70, 2], [6, 69, 2]],
    [[0, 67, 2], [2, 69, 2], [4, 74, 4]],
    [[0, 72, 4], [4, 67, 2], [6, 70, 2]],
    [[0, 69, 3], [3, 67, 1], [4, 64, 4]]
  ];
  let seed = 2027;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const makeReverb = () => {
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const conv = ctx.createConvolver(); conv.buffer = buf; return conv;
  };

  const init = () => {
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 2300;
    const rev = makeReverb(); wet = ctx.createGain(); wet.gain.value = 0.5;
    const dry = ctx.createGain(); dry.gain.value = 0.7;
    tone.connect(dry).connect(master);
    tone.connect(rev).connect(wet).connect(master);
    master.connect(ctx.destination);
    master.input = tone;
  };

  // soft felt-piano note: two detuned partials with a quick attack and long decay
  const piano = (n, t, vel, len = 2.8) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t + len);
    [[1, 'triangle', 1], [2, 'sine', 0.22], [3, 'sine', 0.06]].forEach(([h, type, amp], idx) => {
      const o = ctx.createOscillator(); o.type = type;
      o.frequency.value = midi(n) * h; o.detune.value = (idx ? 3 : -2);
      const og = ctx.createGain(); og.gain.value = amp;
      o.connect(og).connect(g); o.start(t); o.stop(t + len + 0.1);
    });
    g.connect(master.input);
  };

  // warm pad under each chord
  const pad = (tones, t, dur) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 2);
    g.gain.setValueAtTime(0.05, t + dur - 1.4);
    g.gain.linearRampToValueAtTime(0, t + dur + 0.6);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 650;
    tones.slice(0, 3).forEach((n) => {
      [-6, 6].forEach((det) => {
        const o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.value = midi(n); o.detune.value = det;
        o.connect(f); o.start(t); o.stop(t + dur + 0.8);
      });
    });
    f.connect(g).connect(master.input);
  };

  // soft singing voice that doubles the melody (sine with slow swell and gentle vibrato)
  const voice = (n, t, len, vel) => {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = midi(n);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 5.2;
    const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 0;
    lfoAmt.gain.setValueAtTime(0, t); lfoAmt.gain.linearRampToValueAtTime(5, t + 0.6);
    lfo.connect(lfoAmt).connect(o.detune);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.18);
    g.gain.setValueAtTime(vel, t + Math.max(len - 0.25, 0.2));
    g.gain.linearRampToValueAtTime(0, t + len + 0.35);
    o.connect(g).connect(master.input);
    o.start(t); lfo.start(t); o.stop(t + len + 0.5); lfo.stop(t + len + 0.5);
  };

  const schedule = () => {
    while (nextTime < ctx.currentTime + 0.4) {
      const barNo = Math.floor(step / 8), pos = step % 8;
      const b = bars[barNo % 8], phrase = Math.floor(barNo / 8);
      const h = () => (rnd() - 0.5) * 0.025;
      if (pos === 0) {
        piano(b.bass, nextTime, 0.17, 5.5);                                  // low bass
        b.tones.forEach((n, i) => piano(n, nextTime + 0.035 * i + h(), 0.06, 4)); // rolled chord
        if (barNo % 2 === 0) pad(b.tones, nextTime, EIGHTH * 16);
      }
      if (pos === 3) piano(b.tones[1], nextTime + h(), 0.045, 2.6);          // gentle inner movement
      if (pos === 4) piano(b.tones[2], nextTime + h(), 0.05, 2.6);
      if (pos === 7) piano(b.tones[1], nextTime + h(), 0.04, 2.4);
      // the melody sings on every other phrase; the in-between phrases just breathe
      if (phrase % 2 === 0) {
        melody[barNo % 8].forEach(([p, n, len]) => {
          if (p !== pos) return;
          const dur = len * EIGHTH;
          piano(n, nextTime + h(), 0.12, Math.max(dur * 1.6, 2.2));
          voice(n, nextTime, dur, 0.035);
        });
      } else if (pos === 0 && barNo % 2 === 0 && rnd() > 0.3) {
        piano(b.tones[3] + 12, nextTime + 0.02, 0.045, 3.5);                 // a few high, soft notes
      }
      nextTime += EIGHTH; step++;
    }
  };

  const fade = (to, secs) => {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(to, now + secs);
  };
  const setState = (on) => {
    playing = on;
    toggle.classList.toggle('is-paused', !on);
    toggle.setAttribute('aria-pressed', String(on));
    toggle.setAttribute('aria-label', on ? 'Pause music' : 'Play music');
  };
  const play = async () => {
    if (!ctx) init();
    await ctx.resume();
    if (!timer) { nextTime = ctx.currentTime + 0.15; timer = setInterval(schedule, 120); }
    fade(0.42, 3);
    setState(true);
    toggle.hidden = false;
  };
  const pause = () => {
    fade(0, 0.8);
    setTimeout(() => { if (!playing) ctx.suspend(); }, 850);
    setState(false);
  };

  seal.addEventListener('click', () => { play(); }, { once: true });
  toggle.addEventListener('click', () => (playing ? pause() : play()));
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !playing) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
})();

// Closing seal: a soft burst of petals and gold flakes when tapped
(() => {
  const btn = document.querySelector('#closingSeal');
  if (!btn) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  btn.addEventListener('click', () => {
    btn.classList.remove('pressed'); void btn.offsetWidth; btn.classList.add('pressed');
    if (reduce) return;
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < 22; i++) {
      const gold = i % 3 === 0;
      const el = document.createElement('span');
      el.className = 'burst ' + (gold ? 'burst-gold' : 'burst-petal');
      const ang = (Math.PI * 2 * i) / 22 + (Math.random() - .5) * .5;
      const dist = 70 + Math.random() * 90;
      const size = gold ? 3 + Math.random() * 4 : 7 + Math.random() * 6;
      el.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${gold ? size * .8 : size * 1.4}px;` +
        `--dx:${(Math.cos(ang) * dist).toFixed(0)}px;--dy:${(Math.sin(ang) * dist * .7 - 30).toFixed(0)}px;` +
        `--fall:${(60 + Math.random() * 80).toFixed(0)}px;--rot:${Math.round((Math.random() - .5) * 540)}deg;--t:${(1.6 + Math.random() * .9).toFixed(2)}s`;
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  });
})();

// Footer: bride & groom tied by a red string walk closer as guests scroll, and cheer at the bottom
(() => {
  const footer = document.querySelector('#coupleFooter');
  if (!footer) return;
  const bride = footer.querySelector('#bride'), groom = footer.querySelector('#groom');
  const string = footer.querySelector('#redString');
  const knotB = footer.querySelector('#knotB'), knotG = footer.querySelector('#knotG');
  const hearts = footer.querySelector('#cheerHearts');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  let cheering = false, ticking = false;

  const draw = (p) => {
    // groom walks in from the left, bride from the right, ending in the drawing's original pose
    const gx = 30 + (105.4 - 30) * p, bx = 257 - (257 - 181.5) * p;
    groom.setAttribute('transform', `translate(${gx.toFixed(1)} 0)`);
    bride.setAttribute('transform', `translate(${bx.toFixed(1)} 0)`);
    const hx1 = gx + 69.4, hy1 = 133.4, hx2 = bx + 9, hy2 = 128.2;   // his right hand, her left hand
    const dist = Math.max(hx2 - hx1, 1);
    const sag = 3 + dist * 0.2;
    string.setAttribute('d', `M${hx1.toFixed(1)} ${hy1} Q${((hx1 + hx2) / 2).toFixed(1)} ${(Math.max(hy1, hy2) + sag).toFixed(1)} ${hx2.toFixed(1)} ${hy2}`);
    knotG.setAttribute('cx', hx1.toFixed(1)); knotG.setAttribute('cy', hy1);
    knotB.setAttribute('cx', hx2.toFixed(1)); knotB.setAttribute('cy', hy2);
  };

  const popHearts = () => {
    if (reduce) return;
    for (let i = 0; i < 7; i++) {
      const h = document.createElement('span');
      h.className = 'cheer-heart' + (i % 3 === 0 ? ' gold' : '');
      h.style.cssText = `left:${(44 + (Math.random() - .5) * 22).toFixed(1)}%;--hx:${((Math.random() - .5) * 70).toFixed(0)}px;--hd:${(i * 0.12).toFixed(2)}s;--hs:${(.7 + Math.random() * .6).toFixed(2)}`;
      hearts.appendChild(h);
      h.addEventListener('animationend', () => h.remove());
    }
  };

  const update = () => {
    ticking = false;
    // progress through the whole invitation: 0 at the top, 1 at the very bottom
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const p = Math.min(Math.max(window.scrollY / max, 0), 1);
    draw(p);
    const atBottom = p >= 0.985;
    if (atBottom && !cheering) { cheering = true; footer.classList.add('cheer'); popHearts(); }
    else if (!atBottom && cheering && p < 0.9) { cheering = false; footer.classList.remove('cheer'); }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

// Program timeline: the centre line draws down with scroll; medallions pop in as the line reaches them
(() => {
  const tl = document.querySelector('#timeline2');
  if (!tl) return;
  const items = [...tl.querySelectorAll('.tl2-item')];
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = tl.getBoundingClientRect(), vh = window.innerHeight;
    const p = Math.min(Math.max((vh * 0.72 - r.top) / r.height, 0), 1);
    tl.style.setProperty('--tl-p', p.toFixed(4));
    const reach = r.top + r.height * p;
    items.forEach((li) => {
      const node = li.querySelector('.tl2-node').getBoundingClientRect();
      if (node.top + node.height / 2 <= reach + 2) li.classList.add('on');
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
