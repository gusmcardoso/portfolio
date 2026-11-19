(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Ano no rodapé ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Nav: fundo ao rolar + menu mobile ---------- */
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setMenu = (open) => {
    links.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Link ativo conforme a seção visível ---------- */
  const navAnchors = [...links.querySelectorAll('a[href^="#"]')];
  const sections = navAnchors
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navAnchors.forEach((a) =>
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Revelar elementos ao rolar ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 3) * 70}ms`;
      io.observe(el);
    });
  }

  /* ---------- Contadores ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const runCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now();
    const dur = 1400;
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { runCounter(entry.target); co.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  } else {
    counters.forEach((c) => (c.textContent = c.dataset.count));
  }

  /* ---------- Capas dos projetos ---------- */
  // Elementos com data-capa trocam para a capa só depois que ela carrega de verdade
  // (se o arquivo ainda não existir, fica o print/placeholder atual).
  document.querySelectorAll('[data-capa]').forEach((el) => {
    const capa = new Image();
    capa.onload = () => {
      if (el.tagName === 'IMG') { el.src = capa.src; return; }
      const img = document.createElement('img');
      img.className = 'project-thumb';
      img.src = capa.src;
      img.alt = '';
      img.width = 1600;
      img.height = 1000;
      el.replaceWith(img);
    };
    capa.src = el.dataset.capa;
  });

  /* ---------- Modal de projeto com carrossel ---------- */
  // Cada projeto com detalhes tem um <template id="projeto-NOME">: as <figure> viram slides
  // e o .modal-text vai para o painel lateral. Abre por qualquer elemento com data-abrir="NOME"
  // ou clicando no card com data-projeto="NOME".
  const modal = document.getElementById('modalProjeto');
  if (modal && typeof modal.showModal === 'function') {
    const track = modal.querySelector('.carousel');
    const info = modal.querySelector('.modal-info');
    const dots = modal.querySelector('.carousel-dots');
    const caption = modal.querySelector('.carousel-caption');
    const prev = modal.querySelector('.carousel-btn.prev');
    const next = modal.querySelector('.carousel-btn.next');
    let slides = [];
    let atual = 0;
    let origem = null;

    const atualizar = () => {
      prev.disabled = atual === 0;
      next.disabled = atual === slides.length - 1;
      [...dots.children].forEach((d, k) => d.setAttribute('aria-current', String(k === atual)));
      const num = document.createElement('b');
      num.textContent = `${String(atual + 1).padStart(2, '0')}/${String(slides.length).padStart(2, '0')}`;
      const legenda = slides[atual]?.querySelector('figcaption')?.textContent ?? '';
      caption.replaceChildren(num, legenda);
    };

    const ir = (i) => {
      atual = Math.max(0, Math.min(i, slides.length - 1));
      track.scrollTo({ left: atual * track.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
      atualizar();
    };

    // Swipe/rolagem manual: descobre o slide visível
    let raf;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== atual && i >= 0 && i < slides.length) { atual = i; atualizar(); }
      });
    }, { passive: true });

    const abrir = (id) => {
      const tpl = document.getElementById('projeto-' + id);
      if (!tpl) return;
      const frag = tpl.content.cloneNode(true);
      track.replaceChildren(...frag.querySelectorAll('figure'));
      info.replaceChildren(...frag.querySelectorAll('.modal-text'));
      slides = [...track.children];
      dots.replaceChildren(...slides.map((_, k) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Ir para a tela ${k + 1}`);
        b.addEventListener('click', () => ir(k));
        return b;
      }));
      origem = document.activeElement;
      document.body.classList.add('modal-open');
      modal.showModal();
      track.scrollTo({ left: 0, behavior: 'instant' }); // sem animar a volta ao início
      info.scrollTop = 0;
      atual = 0;
      atualizar();
      track.focus({ preventScroll: true });
    };

    modal.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      if (origem && typeof origem.focus === 'function') origem.focus({ preventScroll: true });
    });
    modal.querySelector('.modal-close').addEventListener('click', () => modal.close());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); }); // clique fora
    prev.addEventListener('click', () => ir(atual - 1));
    next.addEventListener('click', () => ir(atual + 1));
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); ir(atual - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(atual + 1); }
    });
    window.addEventListener('resize', () => { if (modal.open) track.scrollTo({ left: atual * track.clientWidth, behavior: 'instant' }); });

    document.querySelectorAll('[data-abrir]').forEach((el) =>
      el.addEventListener('click', (e) => { e.stopPropagation(); abrir(el.dataset.abrir); }));
    document.querySelectorAll('[data-projeto]').forEach((card) =>
      card.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;
        abrir(card.dataset.projeto);
      }));
  }

  /* ---------- Terminal digitando ---------- */
  // EDITAR: personalize as linhas do terminal aqui
  const lines = [
    { t: 'prompt', s: '$ ./novo-projeto --cliente=você' },
    { t: 'out', s: 'o que você precisa colocar no ar?' },
    { t: 'ok', s: '✔ landing page que gera contatos' },
    { t: 'ok', s: '✔ sistema ou ERP sob medida' },
    { t: 'ok', s: '✔ automação para ganhar tempo' },
    { t: 'prompt', s: '$ agenda --status' },
    { t: 'kv', k: 'status:   ', s: 'aberta para novos projetos' },
    { t: 'kv', k: 'orçamento:', s: ' sem compromisso' },
    { t: 'prompt', s: '$ contato --whatsapp' },
    { t: 'ok', s: '→ (63) 98404-9968 · bora tirar do papel?' },
  ];

  const code = document.getElementById('terminalCode');
  if (code) {
    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const render = (line, text) => {
      switch (line.t) {
        case 'prompt': return `<span class="t-prompt">${esc(text)}</span>`;
        case 'kv': return `<span class="t-key">${esc(line.k)}</span>${esc(text)}`;
        case 'ok': return `<span class="t-ok">${esc(text)}</span>`;
        default: return esc(text);
      }
    };

    if (reduceMotion) {
      code.innerHTML = lines.map((l) => render(l, l.s)).join('\n');
    } else {
      let done = '';
      let li = 0;
      const typeLine = () => {
        if (li >= lines.length) return;
        const line = lines[li];
        const isCmd = line.t === 'prompt';
        let ci = 0;
        const tick = () => {
          ci++;
          code.innerHTML = done + render(line, line.s.slice(0, ci));
          if (ci < line.s.length) {
            setTimeout(tick, isCmd ? 45 : 8);
          } else {
            done += render(line, line.s) + '\n';
            li++;
            setTimeout(typeLine, isCmd ? 350 : 120);
          }
        };
        if (isCmd) tick(); else { ci = line.s.length - 1; tick(); }
      };
      setTimeout(typeLine, 600);
    }
  }
})();
