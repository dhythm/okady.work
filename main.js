(() => {
  const d = document, root = d.documentElement;
  const $ = s => d.querySelector(s), $$ = s => [...d.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let SKIP = /[?&]skip\b/.test(location.search);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const map = (v, a, b) => clamp((v - a) / (b - a));
  const out3 = t => 1 - Math.pow(1 - t, 3);
  const inOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* ---------- split text into chars ---------- */
  $$('[data-split]').forEach(el => {
    const t = el.textContent.trim();
    el.textContent = '';
    [...t].forEach((ch, i) => {
      const s = d.createElement('span');
      s.className = 'c';
      s.style.setProperty('--i', i);
      s.textContent = ch;
      el.appendChild(s);
    });
  });

  /* ---------- fit: 長体で幅いっぱいに ---------- */
  function fitAll() {
    $$('.fit').forEach(el => {
      const fi = el.querySelector('.fi');
      const sq = parseFloat(el.dataset.sq || '.8');
      fi.style.transform = 'none';
      fi.style.fontSize = '100px';
      const nat = fi.offsetWidth;
      const w = el.clientWidth;
      if (!nat || !w) return;
      const fs = 100 * w / (nat * sq);
      fi.style.fontSize = fs + 'px';
      fi.style.transform = `scaleX(${sq})`;
      el.style.height = fs + 'px';
    });
  }

  /* ---------- band ---------- */
  const bandA = $('#bandA'), bandB = $('#bandB');
  const unitA = '<span>Trial<em></em>Error<em></em></span>';
  const unitB = '<span>試行錯誤</span>';
  bandA.innerHTML = unitA.repeat(8);
  bandB.innerHTML = unitB.repeat(14);
  let bandX = 0, halfA = 0, halfB = 0;
  const measureBand = () => {
    halfA = bandA.firstElementChild.getBoundingClientRect().width;
    halfB = bandB.firstElementChild.getBoundingClientRect().width;
  };

  /* ---------- boot ---------- */
  const boot = $('#boot'), bootNum = $('#bootNum'), bootLog = $('#bootLog');
  const LINES = [
    '<span class="o">$</span> okady --run',
    'trial #001 ............ <span class="e">error</span>',
    'trial #002 ............ <span class="e">error</span>',
    'trial #003 ............ <span class="e">error</span>',
    'trial #004 ............ <span class="o">ok</span>',
  ];
  const fontsReady = Promise.race([d.fonts ? d.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 2600))]);

  function runBoot() {
    return new Promise(res => {
      if (RM || SKIP) { SKIP = false; boot.classList.add('off'); fontsReady.then(() => { fitAll(); measureBand(); res(); }); return; }
      d.body.classList.add('locked');
      boot.classList.remove('off', 'gone', 'play');
      void boot.offsetWidth;
      boot.classList.add('play');
      bootLog.innerHTML = '';
      const D = 1700, t0 = performance.now();
      let li = 0;
      const step = now => {
        const t = clamp((now - t0) / D);
        bootNum.textContent = String(Math.round(inOut(t) * 100)).padStart(3, '0');
        const want = Math.min(LINES.length, Math.floor(t * (LINES.length + .6)));
        while (li < want) {
          const p = d.createElement('div');
          p.innerHTML = LINES[li++];
          bootLog.appendChild(p);
        }
        if (t < 1) requestAnimationFrame(step);
        else fontsReady.then(() => {
          fitAll(); measureBand();
          setTimeout(() => {
            boot.classList.add('gone');
            d.body.classList.remove('locked');
            setTimeout(() => boot.classList.add('off'), 950);
            res();
          }, 160);
        });
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- reveal on view ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add('in');
    const h = el.querySelector('.hash');
    if (h) scramble(h);
    io.unobserve(el);
  }), { rootMargin: '0px 0px -18% 0px', threshold: .01 });
  $$('.commit, .log-name, #footLogo').forEach(el => io.observe(el));

  function scramble(el) {
    const fin = el.dataset.h, hex = '0123456789abcdef';
    let n = 0;
    const id = setInterval(() => {
      n++;
      el.textContent = [...fin].map((c, i) => i < n / 2 ? c : hex[Math.random() * 16 | 0]).join('');
      if (n >= fin.length * 2) { clearInterval(id); el.textContent = fin; }
    }, 34);
  }

  /* ---------- typing: AIとならね。 ---------- */
  const aiLine = $('#aiLine');
  const aiChars = () => [...aiLine.querySelectorAll('.c')];
  let typing = 0, typed = false;
  aiLine.classList.add('idle');
  function typeAI() {
    typed = true;
    aiLine.classList.remove('idle');
    const cs = aiChars();
    let i = 0;
    clearInterval(typing);
    typing = setInterval(() => {
      cs.forEach(c => c.classList.remove('cur'));
      if (i < cs.length) { cs[i].classList.add('on', 'cur'); i++; }
      else { cs[cs.length - 1].classList.add('cur'); clearInterval(typing); }
    }, 115);
  }
  function resetAI() {
    typed = false;
    clearInterval(typing);
    aiChars().forEach(c => c.classList.remove('on', 'cur'));
    aiLine.classList.add('idle');
  }

  /* ---------- error hit ---------- */
  const errStage = $('#errStage');
  function hit() {
    errStage.classList.remove('hit', 'flash');
    void errStage.offsetWidth;
    errStage.classList.add('hit', 'flash');
    const ua = navigator.userActivation;
    if (navigator.vibrate && (!ua || ua.hasBeenActive)) try { navigator.vibrate([24, 40, 18]); } catch (e) {}
  }
  $('#baka').addEventListener('click', () => {
    $$('#baka .c').forEach(c => { c.style.animation = 'none'; void c.offsetWidth; c.style.animation = ''; });
    hit();
  });

  /* ---------- scroll loop ---------- */
  const hero = $('#hero'), fig = $('#fig'), figMark = $('#figMark'), heroCopy = $('#heroCopy');
  const err = $('#err'), lim = $('#limit'), lim1 = $('#lim1'), lim2 = $('#lim2');
  const commits = $('#commits'), railFill = $('#railFill');
  const hud = $('#hud'), hudBar = $('#hudBar'), tryN = $('#tryN'), errN = $('#errN'), errWrap = $('#errWrap');
  const fTry = $('#fTry'), fErr = $('#fErr');
  const themed = $$('[data-theme]');
  const metaTheme = $('meta[name="theme-color"]');
  const THEME = { lime: '#D4FF1A', ink: '#0B0B0B', bone: '#EDEDE6', hit: '#D4FF1A' };

  let tx = 0, ty = 0, px = 0, py = 0;
  hero.addEventListener('pointermove', ev => {
    const r = hero.getBoundingClientRect();
    tx = (ev.clientX - r.left) / r.width * 2 - 1;
    ty = (ev.clientY - r.top) / r.height * 2 - 1;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { tx = ty = 0; });
  let lastY = scrollY, vel = 0, lastErr = -1, curTheme = '', errState = 0;
  const prog = sec => {
    const r = sec.getBoundingClientRect();
    return -r.top / (sec.offsetHeight - innerHeight);
  };

  function setTheme(t) {
    if (t === curTheme) return;
    curTheme = t;
    root.dataset.hud = t;
    metaTheme.setAttribute('content', THEME[t] || '#0B0B0B');
  }

  function tick() {
    const y = scrollY, vh = innerHeight;
    vel += ((y - lastY) - vel) * .12;
    lastY = y;

    /* hero parallax */
    const hp = clamp(y / hero.offsetHeight);
    if (hp < 1) {
      fig.style.transform = `translate3d(-50%,${hp * -9}%,0) scale(${1 + hp * .1})`;
      px += (tx - px) * .08; py += (ty - py) * .08;
      figMark.style.translate = `${px * 3}% ${hp * 34 + py * 2}%`;
      figMark.style.rotate = `${hp * -10 + px * 5}deg`;
      heroCopy.style.transform = `translate3d(0,${hp * -26}%,0)`;
      heroCopy.style.opacity = 1 - map(hp, .25, .7);
    }

    /* band: scroll velocity drives speed */
    bandX += .55 + Math.min(Math.abs(vel), 60) * .32;
    if (halfA) bandA.style.transform = `translate3d(${-(bandX % halfA)}px,0,0)`;
    if (halfB) bandB.style.transform = `translate3d(${-halfB + (bandX * .7 % halfB)}px,0,0)`;

    /* error */
    const e = prog(err);
    err.classList.toggle('s1', e > -.32);
    err.classList.toggle('s2', e > .1);
    const s3 = e > .5;
    if (s3 && errState !== 3) { errState = 3; err.classList.add('s3'); hit(); }
    else if (!s3 && errState === 3) { errState = 0; err.classList.remove('s3'); }

    /* log rail */
    const cr = commits.getBoundingClientRect();
    railFill.style.transform = `scaleY(${clamp((vh * .78 - cr.top) / cr.height)})`;

    /* limit: 限界はない。 breaks the frame */
    const L = prog(lim);
    lim.classList.toggle('s1', L > -.35);
    const g = out3(map(L, .12, .58));
    lim2.style.transform = `scale(${1 + g * 2.1}) translate3d(0,${g * 4}%,0)`;
    lim2.style.opacity = 1 - map(L, .5, .66) * .84;
    lim1.style.opacity = 1 - map(L, .1, .32);
    lim1.style.transform = `translate3d(0,${-map(L, .1, .4) * 40}%,0)`;
    const s3L = L > .6;
    lim.classList.toggle('s3', s3L);
    if (s3L && !typed) typeAI();
    if (L < .45 && typed) resetAI();

    /* HUD */
    hud.classList.toggle('show', y > hero.offsetHeight - 50);
    let t = 'lime';
    for (const s of themed) {
      const r = s.getBoundingClientRect();
      if (r.top <= 30 && r.bottom > 30) { t = s.dataset.theme; break; }
    }
    if (t === 'ink' && err.classList.contains('s3')) {
      const r = err.getBoundingClientRect();
      if (r.top <= 30 && r.bottom > 30) t = 'hit';
    }
    setTheme(t);
    const max = d.documentElement.scrollHeight - vh;
    hudBar.style.transform = `scaleX(${clamp(y / max)})`;
    const tries = 1 + Math.floor(y / 38);
    const errs = Math.floor(tries * .3 + Math.sin(tries * .7) * .6 + .6);
    const ts = String(tries).padStart(4, '0'), es = String(Math.max(0, errs)).padStart(3, '0');
    if (tryN.textContent !== ts) { tryN.textContent = ts; fTry.textContent = ts; }
    if (errs !== lastErr) {
      if (lastErr >= 0 && errs > lastErr) { errWrap.classList.remove('flash'); void errWrap.offsetWidth; errWrap.classList.add('flash'); }
      lastErr = errs; errN.textContent = es; fErr.textContent = es;
    }

    requestAnimationFrame(tick);
  }

  /* ---------- contact ---------- */
  const TO = 'yuta.okada.20@gmail.com';
  const ENDPOINT = 'https://ssgform.com/s/HRaKotWeWwFx';
  const form = $('#contactForm'), ctStatus = $('#ctStatus'), send = $('#send');
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function showStatus(kind, html) {
    ctStatus.className = 'ct-status ' + kind;
    ctStatus.innerHTML = html;
  }
  function mailFallback(lead) {
    showStatus('bad', `<span class="k">ERR</span>${lead}お手数ですが、下記のアドレスへメールでご連絡ください。<span class="mail"><span>${TO}</span><button type="button" id="copyMail">COPY</button></span>`);
    $('#copyMail').addEventListener('click', ev => {
      const b = ev.currentTarget;
      const done = () => { b.textContent = 'COPIED'; };
      try {
        navigator.clipboard.writeText(TO).then(done, () => selectMail(b));
      } catch (e) { selectMail(b); }
    });
  }
  function selectMail(b) {
    const r = d.createRange();
    r.selectNodeContents(b.previousElementSibling);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  form.addEventListener('input', ev => ev.target.closest('.field')?.classList.remove('bad'));
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const f = form.elements;
    if (f._honey.value) return;
    const name = f.name.value.trim(), email = f.email.value.trim(), org = f.org.value.trim(), msg = f.message.value.trim();
    const missing = [];
    if (!name) missing.push(['name', '氏名']);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) missing.push(['email', 'メールアドレス']);
    if (!msg) missing.push(['message', '要件']);
    $$('.field').forEach(x => x.classList.remove('bad'));
    if (missing.length) {
      missing.forEach(([k]) => f[k].closest('.field').classList.add('bad'));
      showStatus('bad', `<span class="k">ERR</span>${missing.map(m => m[1]).join('・')}を入力してください。`);
      f[missing[0][0]].focus();
      return;
    }
    send.disabled = true;
    showStatus('', '<span class="k">SENDING</span>送信しています…');
    try {
      const body = new FormData();
      body.append('氏名', name);
      body.append('メールアドレス', email);
      body.append('所属先', org || '（未記入）');
      body.append('要件', msg);
      const res = await fetch(ENDPOINT, { method: 'POST', body });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      showStatus('ok', `<span class="k">200 OK</span>送信しました。${esc(name)} 様、お問い合わせありがとうございます。`);
    } catch (e) {
      mailFallback('送信できませんでした。');
    } finally {
      send.disabled = false;
    }
  });

  /* ---------- retry ---------- */
  $('#retry').addEventListener('click', () => {
    d.body.classList.remove('ready');
    scrollTo({ top: 0, behavior: 'instant' });
    resetAI();
    runBoot().then(() => requestAnimationFrame(() => d.body.classList.add('ready')));
  });

  /* ---------- resize ---------- */
  let rz;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { fitAll(); measureBand(); }, 120);
  });

  /* ---------- start ---------- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  fitAll(); measureBand();
  requestAnimationFrame(tick);
  runBoot().then(() => requestAnimationFrame(() => d.body.classList.add('ready')));
})();
