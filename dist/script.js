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
const CIRC = 2 * Math.PI * 45; // r=45 -> 282.743
const prevDigits = {};

function renderRollingValue(el, nextStr) {
  if (!el) return;
  const id = el.id;
  const prevStr = prevDigits[id];
  if (prevStr === nextStr) return;
  prevDigits[id] = nextStr;

  // First render or length change: build digit slots cleanly (using <i> so .clock span rules don't hit digits)
  if (!prevStr || prevStr.length !== nextStr.length) {
    el.innerHTML = '';
    [...nextStr].forEach((ch) => {
      const wrap = document.createElement('i');
      wrap.className = 'cd-digit-wrap';
      const cur = document.createElement('i');
      cur.className = 'cd-digit';
      cur.textContent = ch;
      wrap.appendChild(cur);
      el.appendChild(wrap);
    });
    return;
  }

  // Subsequent ticks: animate only the digits that changed
  const wraps = el.querySelectorAll('.cd-digit-wrap');
  [...nextStr].forEach((ch, idx) => {
    if (prevStr[idx] === ch) return;
    const wrap = wraps[idx];
    if (!wrap) return;
    const oldCur = wrap.querySelector('.cd-digit');
    wrap.querySelectorAll('.cd-digit-prev').forEach((n) => n.remove());
    if (oldCur) {
      oldCur.className = 'cd-digit-prev';
      oldCur.addEventListener('animationend', () => oldCur.remove(), { once: true });
    }
    const nextCur = document.createElement('i');
    nextCur.className = 'cd-digit roll-in';
    nextCur.textContent = ch;
    wrap.appendChild(nextCur);
  });
}

let currentLang = 'en';

function updateCountdown() {
  const now = new Date();
  const diff = eventStart - now;
  const isJa = currentLang === 'ja';
  if (diff <= 0) {
    document.querySelector('#clock').hidden = true;
    countdown.textContent = now < eventEnd
      ? (isJa ? '本日は私たちの結婚式です' : 'Today is our wedding day')
      : (isJa ? 'ご参列いただきありがとうございました' : 'Thank you for celebrating with us');
    return false;
  }

  // Calculate exact calendar months + remaining days
  let months = 0;
  const cursor = new Date(now.getTime());
  while (true) {
    const nextMonth = new Date(cursor.getTime());
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    if (nextMonth <= eventStart) {
      months++;
      cursor.setMonth(cursor.getMonth() + 1);
    } else {
      break;
    }
  }
  const remSec = Math.floor((eventStart - cursor) / 1000);
  const days = Math.floor(remSec / 86400);

  renderRollingValue(document.querySelector('#cdMonths'), String(months));
  renderRollingValue(document.querySelector('#cdDays'), String(days));

  const lblMonths = document.querySelector('#lblMonths');
  const lblDays = document.querySelector('#lblDays');
  if (lblMonths) lblMonths.textContent = isJa ? 'ヶ月' : (months === 1 ? 'Month' : 'Months');
  if (lblDays) lblDays.textContent = isJa ? '日' : (days === 1 ? 'Day' : 'Days');

  countdown.textContent = isJa ? '誓いの日まであと' : 'until we say I do';
  return true;
}
if (updateCountdown()) setInterval(updateCountdown, 60000);

// Flip-calendar leaf animation when cards scroll into view or are tapped
(() => {
  const cards = document.querySelectorAll('.clock-cards .cal-card');
  if (!cards.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const triggerFlip = (card) => {
    if (reduce) return;
    card.classList.remove('is-flipping');
    void card.offsetWidth;
    card.classList.add('is-flipping');
  };
  cards.forEach((card) => card.addEventListener('click', () => triggerFlip(card)));
  if (reduce) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      cards.forEach((c, i) => setTimeout(() => triggerFlip(c), 260 + i * 200));
      io.disconnect();
    });
  }, { threshold: 0.3 });
  const clockEl = document.querySelector('#clock');
  if (clockEl) io.observe(clockEl);
})();

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
new IntersectionObserver((entries, obs) => {
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
    '.timeline li',
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
      if (el.matches('.timeline li')) el.classList.add(sibs.indexOf(el) % 2 ? 'sr-from-right' : 'sr-from-left');
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

// Venue celebration life: twinkling string lights, pool water shimmer, and cheerful guest toasts
(() => {
  const box = document.querySelector('#venueLife');
  const stage = document.querySelector('.hero-stage');
  if (!box || !stage) return;

  // Seamless looping venue cinemagraph video (activates automatically when dist/assets/venue-loop.mp4 or .webm exists)
  const video = document.querySelector('#heroVideo');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (video && !reduceMotion) {
    video.addEventListener('canplay', () => {
      video.hidden = false;
      requestAnimationFrame(() => {
        video.classList.add('is-ready');
        stage.classList.add('has-video');
        video.play().catch(() => {});
      });
    }, { once: true });
  }
  let seed = 20270418;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // 1) Fairy string lights along the ground-floor colonnade & warm balcony downlights
  const lights = [
    // Colonnade draped string lights (x%, y%)
    [29.5, 62.6], [31.8, 63.4], [34.2, 63.7], [36.5, 63.1], [38.2, 62.3],
    [41.5, 62.5], [44.0, 63.3], [46.5, 63.8], [49.0, 63.3], [51.2, 62.4],
    [54.2, 62.5], [56.8, 63.4], [59.3, 63.8], [61.8, 63.3], [64.0, 62.4],
    [67.2, 62.5], [69.8, 63.3], [72.5, 63.7], [75.0, 63.2], [76.8, 62.3],
    // Warm ceiling lights on 2nd & 3rd floors
    [56.8, 18.6], [61.5, 18.6], [66.2, 18.6], [71.1, 18.6], [75.8, 18.6], [85.0, 18.6], [90.2, 18.6],
    [32.5, 38.6], [42.8, 38.6], [56.8, 38.6], [71.2, 38.6], [85.5, 38.6]
  ];
  lights.forEach(([x, y], i) => {
    const el = document.createElement('span');
    el.className = 'venue-sparkle';
    const sz = i < 20 ? (4.5 + rnd() * 2.5) : (5.5 + rnd() * 2);
    el.style.cssText = `left:${x}%;top:${y}%;--sz:${sz.toFixed(1)}px;--dur:${(2.2 + rnd() * 2.4).toFixed(2)}s;--delay:${(-rnd() * 4).toFixed(2)}s`;
    box.appendChild(el);
  });

  // 2) Subtle celebration motes rising above the bride & groom and guest groups
  const groups = [
    { x: 29.0, y: 22.0, type: 'clink' }, // 3rd floor balcony toast
    { x: 28.2, y: 21.5, type: 'note' },
    { x: 31.2, y: 43.8, type: 'heart', color: '#d4a656' }, // 2nd floor left group
    { x: 61.5, y: 43.2, type: 'clink' }, // 2nd floor mid-right waving couple
    { x: 70.0, y: 43.8, type: 'note' },  // 2nd floor right trio
    { x: 21.0, y: 67.5, type: 'clink' }, // Ground floor left group
    { x: 31.0, y: 68.0, type: 'note' },  // Ground floor cocktail table couple
    { x: 43.5, y: 66.8, type: 'clink' }, // Guests cheering left of couple
    { x: 49.8, y: 65.2, type: 'heart', color: '#c44b49' }, // Bride & Groom center!
    { x: 51.0, y: 65.8, type: 'heart', color: '#d4a656' },
    { x: 56.8, y: 66.8, type: 'clink' }, // Guests cheering right of couple
    { x: 73.2, y: 67.5, type: 'heart', color: '#c44b49' }  // Ground floor right couple
  ];
  groups.forEach((g, idx) => {
    const el = document.createElement('span');
    el.className = `venue-mote mote-${g.type}`;
    if (g.type === 'note') el.textContent = idx % 2 === 0 ? '♪' : '♫';
    if (g.color) el.style.setProperty('--mc', g.color);
    const dx = ((rnd() - 0.5) * 14).toFixed(1);
    el.style.cssText += `left:${g.x}%;top:${g.y}%;--dx:${dx}px;--dur:${(4.2 + rnd() * 2.5).toFixed(2)}s;--delay:${(-rnd() * 6).toFixed(2)}s;--op:${(0.65 + rnd() * 0.25).toFixed(2)}`;
    box.appendChild(el);
  });

  // 3) Pool water shimmer glints
  for (let i = 0; i < 14; i++) {
    const el = document.createElement('span');
    el.className = 'pool-gleam';
    const x = 12 + rnd() * 76, y = 83.2 + rnd() * 5.2, w = 14 + rnd() * 26;
    el.style.cssText = `left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;width:${w.toFixed(0)}px;--dur:${(3.2 + rnd() * 2.8).toFixed(2)}s;--delay:${(-rnd() * 5).toFixed(2)}s`;
    box.appendChild(el);
  }

  // 4) Interactive celebration burst when tapping/clicking the venue illustration
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  stage.addEventListener('click', (e) => {
    if (reduce) return;
    const rect = stage.getBoundingClientRect();
    // Spawn a warm cheer from the bride & groom and where the user tapped
    const origins = [
      [e.clientX, e.clientY],
      [rect.left + rect.width * 0.50, rect.top + rect.height * 0.67]
    ];
    origins.forEach(([cx, cy], oIdx) => {
      const count = oIdx === 0 ? 10 : 8;
      for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        const gold = i % 2 === 0;
        el.className = 'burst ' + (gold ? 'burst-gold' : 'burst-petal');
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
        const dist = 35 + Math.random() * 55;
        const size = gold ? 3 + Math.random() * 3.5 : 5 + Math.random() * 4.5;
        el.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${gold ? size * .8 : size * 1.4}px;` +
          `--dx:${(Math.cos(ang) * dist).toFixed(0)}px;--dy:${(Math.sin(ang) * dist - 18).toFixed(0)}px;` +
          `--fall:${(30 + Math.random() * 45).toFixed(0)}px;--rot:${Math.round((Math.random() - .5) * 360)}deg;--t:${(1.2 + Math.random() * .6).toFixed(2)}s`;
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
      }
    });
  });
})();

// Fine-line calla lily dividers (assets/calla-divider.png): silky brush-glide reveal on scroll + smooth coastal breeze
(() => {
  const blocks = document.querySelectorAll('.onepage .block');
  if (!blocks.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const dividers = [];
  blocks.forEach((block, idx) => {
    block.classList.add('has-lily-svg');
    const wrap = document.createElement('div');
    wrap.className = 'lily-divider';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.setProperty('--sway-dur', `${(6.4 + (idx % 3) * 0.7).toFixed(1)}s`);
    wrap.style.setProperty('--sway-delay', `${(1.2 + idx * 0.2).toFixed(2)}s`);

    const img = document.createElement('img');
    img.className = 'lily-img';
    img.src = 'assets/calla-divider.png';
    img.alt = '';
    img.decoding = 'async';
    wrap.appendChild(img);
    block.prepend(wrap);

    // Tap/click to smoothly replay the brush-glide reveal & release subtle sparkles
    wrap.addEventListener('click', () => {
      if (reduce) return;
      wrap.classList.remove('is-drawn');
      void wrap.getBoundingClientRect();
      requestAnimationFrame(() => wrap.classList.add('is-drawn'));
      const r = wrap.getBoundingClientRect();
      const cx = r.left + r.width * 0.72, cy = r.top + r.height * 0.42;
      for (let i = 0; i < 6; i++) {
        const el = document.createElement('span');
        el.className = 'burst ' + (i % 2 === 0 ? 'burst-gold' : 'burst-petal');
        const ang = -Math.PI * 0.8 + Math.random() * Math.PI * 0.9;
        const dist = 22 + Math.random() * 28;
        const size = i % 2 === 0 ? 3 + Math.random() * 2.5 : 5 + Math.random() * 3;
        el.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${i % 2 === 0 ? size * .8 : size * 1.4}px;` +
          `--dx:${(Math.cos(ang) * dist).toFixed(0)}px;--dy:${(Math.sin(ang) * dist - 10).toFixed(0)}px;` +
          `--fall:${(20 + Math.random() * 26).toFixed(0)}px;--rot:${Math.round((Math.random() - .5) * 280)}deg;--t:${(1.1 + Math.random() * .5).toFixed(2)}s`;
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
      }
    });

    dividers.push(wrap);
  });

  if (reduce) {
    dividers.forEach((d) => d.classList.add('is-drawn'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-drawn');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.2 });

  const invitation = document.querySelector('#invitation');
  const start = () => dividers.forEach((d) => io.observe(d));
  if (invitation && (invitation.classList.contains('revealed') || !document.querySelector('#opening'))) start();
  else if (invitation) new MutationObserver((m, mo) => {
    if (invitation.classList.contains('revealed')) { mo.disconnect(); setTimeout(start, 300); }
  }).observe(invitation, { attributes: true, attributeFilter: ['class'] });
})();

// Program timeline: scroll-driven spine thread + subject-matched micro-effects on the 7 illustrations
(() => {
  const tl = document.querySelector('.program-block .timeline');
  if (!tl) return;
  const rows = [...tl.querySelectorAll('li')];
  if (!rows.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1) Inject scroll-driven golden-sage spine line (append so li:first-child and nth-child order stay intact)
  const prog = document.createElement('span');
  prog.className = 'tl-progress';
  prog.setAttribute('aria-hidden', 'true');
  tl.append(prog);

  // 2) Add delicate subject-matched ambient effects to each of the 7 illustrations
  if (!reduce) {
    const addFx = (rowIdx, items) => {
      const icon = rows[rowIdx] && rows[rowIdx].querySelector('.tl-icon');
      if (!icon) return;
      const fx = document.createElement('span');
      fx.className = 'tl-fx';
      fx.setAttribute('aria-hidden', 'true');
      items.forEach(({ cls, css, text }) => {
        const el = document.createElement('i');
        el.className = cls;
        el.style.cssText = css;
        if (text) el.textContent = text;
        fx.appendChild(el);
      });
      icon.appendChild(fx);
    };

    // 0: Ceremony (rings) — solitaire diamond glint
    addFx(0, [
      { cls: 'tl-glint', css: 'left:38%;top:27%;--gs:11px;--gd:3.6s;--gdel:0s' },
      { cls: 'tl-glint', css: 'left:64%;top:50%;--gs:7px;--gd:4.4s;--gdel:-1.8s' }
    ]);
    // 1: Cocktail & pictorial — champagne bubbles rising above clinking coupes
    addFx(1, [
      { cls: 'tl-bubble', css: 'left:48%;top:34%;--bs:3.5px;--bd:2.8s;--bdel:0s;--bx:-2px' },
      { cls: 'tl-bubble', css: 'left:54%;top:30%;--bs:2.8px;--bd:3.3s;--bdel:-1.1s;--bx:3px' },
      { cls: 'tl-bubble', css: 'left:50%;top:24%;--bs:3px;--bd:3.6s;--bdel:-2.1s;--bx:1px' }
    ]);
    // 2: Dinner — warm flickering taper candle flame
    addFx(2, [
      { cls: 'tl-flame', css: 'left:69%;top:13%' }
    ]);
    // 3: Thank-you speech — champagne sparkle & soft glint
    addFx(3, [
      { cls: 'tl-bubble', css: 'left:36%;top:24%;--bs:3px;--bd:3.2s;--bdel:-.4s;--bx:2px' },
      { cls: 'tl-glint', css: 'left:66%;top:42%;--gs:8px;--gd:4.2s;--gdel:-1.3s' }
    ]);
    // 4: Music & drinks — tiny musical notes drifting from the gramophone horn
    addFx(4, [
      { cls: 'tl-note', css: 'left:68%;top:22%;--bd:3.6s;--bdel:0s;--bx:4px', text: '♪' },
      { cls: 'tl-note', css: 'left:78%;top:32%;--bd:4.1s;--bdel:-1.9s;--bx:5px', text: '♫' }
    ]);
    // 5: Late-night bites — soft warm aroma wisps beneath the cloche
    addFx(5, [
      { cls: 'tl-steam', css: 'left:28%;top:48%;--bd:3.3s;--bdel:0s' },
      { cls: 'tl-steam', css: 'left:72%;top:52%;--bd:3.8s;--bdel:-1.6s' }
    ]);
    // 6: Send-off — twinkling golden sparkler tips
    addFx(6, [
      { cls: 'tl-glint', css: 'left:33%;top:31%;--gs:12px;--gd:2.1s;--gdel:0s' },
      { cls: 'tl-glint', css: 'left:69%;top:35%;--gs:12px;--gd:2.3s;--gdel:-.9s' },
      { cls: 'tl-glint', css: 'left:52%;top:22%;--gs:8px;--gd:2.7s;--gdel:-1.5s' }
    ]);
  }

  // 3) Scroll-driven spine progress & milestone node illumination
  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = tl.getBoundingClientRect();
    const triggerY = window.innerHeight * 0.62;
    const raw = (triggerY - rect.top) / Math.max(rect.height, 1);
    const pct = Math.max(0, Math.min(1, raw));
    prog.style.setProperty('--tl-p', `${(pct * 100).toFixed(2)}%`);
    prog.style.setProperty('--tl-tip', pct > 0.02 && pct < 0.99 ? '1' : '0');

    rows.forEach((li) => {
      const lr = li.getBoundingClientRect();
      const mid = lr.top + lr.height * 0.5;
      li.classList.toggle('tl-reached', mid <= triggerY + 8);
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

// Bilingual language switcher (EN / 日本語), persisted in localStorage and supporting ?lang=ja
(() => {
  const wrap = document.querySelector('#langToggle');
  if (!wrap) return;
  const dict = {
    en: {
      pageTitle: 'Our Wedding Day — April 18, 2027',
      openHint: 'Tap the lily seal to open',
      openingCaption: 'Our wedding invitation',
      eyebrow: 'Together with our families',
      inviteTitle: 'Request the honour of your presence',
      heroSub: 'in celebration of our marriage',
      heroDate: 'Sunday · April 18, 2027 · 4:30 PM',
      venueHint: 'Tap for directions',
      venueNote: 'The ceremony and reception will both be held here.',
      dressLabel: 'Dress code',
      dressText: 'Semi-formal<br />Light &amp; breathable',
      weatherNote: 'The Philippines is typically hot and humid.',
      settingLabel: 'Setting',
      settingText: 'An intimate celebration with those dearest to us.',
      kindNoteLabel: 'Kind note',
      kindNoteText: 'Please arrive by 3:30 PM for welcome drinks.',
      tl1: 'Ceremony',
      tl2: 'Cocktail & pictorial',
      tl3: 'Dinner',
      tl4: 'Thank-you speech',
      tl5: 'Music & drinks',
      tl6: 'Late-night bites',
      tl7: 'Send-off',
      feelEyebrow: 'The feeling',
      feelBody: 'Warm candlelight, ocean air, and time to simply enjoy.',
      closingLead: 'We can’t wait to celebrate with you.',
      rsvpNote: '<span class="mini-label">RSVP</span>Just reply <b>Yes</b> or <b>No</b> to our message.',
      calendarBtn: 'Add the ceremony to your calendar',
      signoff: 'With love,'
    },
    ja: {
      pageTitle: '結婚式のご案内 — 2027年4月18日',
      openHint: 'シーリングをタップして開く',
      openingCaption: '結婚式のご案内',
      eyebrow: '両家とともに心よりご案内申し上げます',
      inviteTitle: 'ささやかな結婚式のひとときを<br />皆さまとご一緒できましたら幸いです',
      heroSub: '大切な皆さまと過ごす、海辺の祝宴へ',
      heroDate: '2027年4月18日（日） 16:30 開式',
      venueHint: '地図を開く',
      venueNote: '挙式・披露宴ともに同会場にて執り行います。',
      dressLabel: 'ドレスコード',
      dressText: 'セミフォーマル<br />涼しく軽やかな装いで',
      weatherNote: '<span class="jp-phrase">フィリピンは暑く湿度が高いため、</span><br /><span class="jp-phrase">通気性の良い服装がおすすめです。</span>',
      settingLabel: '雰囲気',
      settingText: '<span class="jp-phrase">親しい方だけの</span><span class="jp-phrase">式ですので、</span><br /><span class="jp-phrase">気張らずリラックスして</span><span class="jp-phrase">お過ごしください。</span>',
      kindNoteLabel: 'ご案内',
      kindNoteText: '<span class="jp-phrase">ウェルカムドリンクを</span><span class="jp-phrase">ご用意しております。</span><br /><span class="jp-phrase">15:30までに</span><span class="jp-phrase">お越しください。</span>',
      tl1: '挙式',
      tl2: 'カクテル＆記念撮影',
      tl3: 'ディナー',
      tl4: '感謝のスピーチ',
      tl5: '音楽＆ドリンク',
      tl6: '夜食・軽食',
      tl7: 'お見送り',
      feelEyebrow: '当日の雰囲気',
      feelBody: '自然のぬくもり、柔らかなキャンドルの灯り、海風とともに、<br />大切な皆さまと過ごす穏やかな時間。',
      closingLead: '皆さまとお祝いできる日を心より楽しみにしております。',
      rsvpNote: '<span class="mini-label">ご出欠のご連絡</span>メッセージへ <b>出席</b> または <b>欠席</b> とご返信ください。',
      calendarBtn: 'カレンダーに予定を追加',
      signoff: '愛を込めて'
    }
  };

  const applyLang = (lang) => {
    const next = lang === 'ja' ? 'ja' : 'en';
    currentLang = next;
    document.documentElement.lang = next;
    const t = dict[next];
    document.title = t.pageTitle;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      if (t[key] !== undefined) el.innerHTML = t[key];
    });
    wrap.querySelectorAll('button[data-lang]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang') === next));
    });
    updateCountdown();
    try { localStorage.setItem('wedding_lang', next); } catch (_) {}
  };

  wrap.querySelectorAll('button[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => applyLang(btn.getAttribute('data-lang')));
  });

  const urlLang = new URLSearchParams(location.search).get('lang');
  let saved = null;
  try { saved = localStorage.getItem('wedding_lang'); } catch (_) {}
  if (urlLang === 'ja' || urlLang === 'en') applyLang(urlLang);
  else if (saved === 'ja' || saved === 'en') applyLang(saved);
})();

// Animated single-line wedding rings flourish below "Blez & Yuki"
(() => {
  const svg = document.querySelector('#ringsArt');
  if (!svg) return;
  const paths = [...svg.querySelectorAll('.rings-path')];
  if (!paths.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const prep = () => {
    paths.forEach((p, idx) => {
      const len = Math.ceil(p.getTotalLength ? p.getTotalLength() : 1200) + 4;
      p.style.setProperty('--len', String(len));
      p.style.setProperty('--draw-dur', idx === 0 ? '1.35s' : '1.45s');
      p.style.setProperty('--draw-delay', idx === 0 ? '0s' : '1.1s');
    });
  };
  prep();

  if (reduce) {
    svg.classList.add('is-drawn');
    return;
  }

  const draw = () => {
    svg.classList.remove('is-drawn');
    void svg.getBoundingClientRect();
    requestAnimationFrame(() => svg.classList.add('is-drawn'));
  };

  svg.addEventListener('click', draw);

  const invitation = document.querySelector('#invitation');
  if (!invitation || invitation.classList.contains('revealed')) {
    setTimeout(draw, 350);
  } else {
    const mo = new MutationObserver(() => {
      if (invitation.classList.contains('revealed')) {
        mo.disconnect();
        setTimeout(draw, 420);
      }
    });
    mo.observe(invitation, { attributes: true, attributeFilter: ['class'] });
  }
})();
