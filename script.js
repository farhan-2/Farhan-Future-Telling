// The Long Table: small, optional interactions. Every page still reads without this file.

// 1. The lamp: on the doorway the photograph is lit only where the cursor is held.
(function lamp() {
  const door = document.querySelector('.doorway');
  if (!door) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return; // touch screens keep the drifting lamp
  door.addEventListener('pointermove', (event) => {
    const box = door.getBoundingClientRect();
    door.classList.add('is-tracking');
    door.style.setProperty('--mx', ((event.clientX - box.left) / box.width * 100).toFixed(1) + '%');
    door.style.setProperty('--my', ((event.clientY - box.top) / box.height * 100).toFixed(1) + '%');
  });
})();

// 2. Local time at each seat, so the table is "always night somewhere".
(function clocks() {
  const stamps = document.querySelectorAll('time[data-tz]');
  if (!stamps.length) return;
  function tick() {
    stamps.forEach((stamp) => {
      try {
        const parts = new Intl.DateTimeFormat('en-GB', { timeZone: stamp.dataset.tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
        stamp.textContent = parts;
      } catch (error) { /* keep the fallback text */ }
    });
  }
  tick();
  setInterval(tick, 30000);
})();

// 3. Taking the open seat and knocking on someone's table.
(function seats() {
  const claim = document.querySelector('[data-claim]');
  const status = document.querySelector('[data-status]');
  if (claim) {
    claim.addEventListener('click', () => {
      const seat = claim.closest('.seat');
      const taken = seat.classList.toggle('is-taken');
      claim.setAttribute('aria-pressed', String(taken));
      claim.textContent = taken ? 'Your lamp is on. Leave any time.' : 'Take this seat';
      if (status) status.textContent = taken ? 'You are at the table. No one was notified.' : 'You stepped away. Your seat is kept.';
    });
  }
  document.querySelectorAll('[data-knock]').forEach((button) => {
    button.addEventListener('click', () => {
      button.textContent = 'Knocked softly. They will see it when they look up.';
      button.disabled = true;
    });
  });
})();

// 4. The Memory Wall: dreams written into the past, kept only in this browser.
(function memoryWall() {
  const form = document.querySelector('[data-memory-form]');
  const wall = document.querySelector('[data-wall]');
  if (!form || !wall) return;
  const KEY = 'longtable.memories';
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(KEY)) || []; } catch (error) { saved = []; }

  function persist() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (error) { /* private mode */ } }

  function render(entry) {
    const pin = document.createElement('article');
    pin.className = 'pin pin--mine';
    const quote = document.createElement('blockquote');
    quote.textContent = entry.text;
    const foot = document.createElement('footer');
    const who = document.createElement('span');
    who.textContent = entry.with ? 'You, with ' + entry.with : 'You';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'button button--quiet';
    remove.textContent = 'Take it down';
    remove.addEventListener('click', () => {
      saved = saved.filter((item) => item.id !== entry.id);
      persist();
      pin.remove();
    });
    foot.append(who, remove);
    pin.append(quote, foot);
    wall.prepend(pin);
  }

  saved.slice().reverse().forEach(render);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = form.elements.dream.value.trim();
    if (!text) return;
    const entry = { id: Date.now(), text: text, with: form.elements.with.value.trim() };
    saved.push(entry);
    persist();
    render(entry);
    form.reset();
    form.elements.dream.focus();
  });
})();

// 5. The Compass: an assistant that proposes, and you decide.
(function compass() {
  const select = document.querySelector('[data-heading]');
  const list = document.querySelector('[data-proposals]');
  const chip = document.querySelector('[data-chip]');
  if (!select || !list) return;

  const headings = {
    pitch: {
      label: 'Finish the pitch deck',
      ideas: [
        { text: 'Cut slides 7 to 9 and keep only the story you would tell a friend.', why: 'You said it feels too long, so I assumed shorter is closer to what you want. I could be wrong if your audience expects detail.' },
        { text: 'Ask someone at the long table to read it aloud to you.', why: 'Hearing your words in another voice shows where they stop sounding like you. I am guessing you want it to sound like you.' },
        { text: 'Let me rewrite the whole deck in a more polished tone.', why: 'This is faster, and also the kind of impressive result that can feel wrong. It is here so you can practise saying no.' }
      ]
    },
    family: {
      label: 'Call home',
      ideas: [
        { text: 'Call at 9pm your time, when it is early evening there.', why: 'I compared both time zones. I do not know if 9pm works with your night, so this is only a suggestion.' },
        { text: 'Write down two things you want to ask before you dial.', why: 'People often hang up and remember the question. I am assuming you want a conversation, not an update.' },
        { text: 'Let me draft what you should say.', why: 'I can, but a call from you is worth more than a script. Reject this one if you agree.' }
      ]
    },
    cook: {
      label: 'Learn one dish properly',
      ideas: [
        { text: 'Pick one dish from a person you know, not a ranking.', why: 'You told this table that people matter more than outcomes, so I leaned toward a recipe with someone attached.' },
        { text: 'Cook it twice this week and change one thing the second time.', why: 'Repetition with one change shows what you actually learned. This assumes you have time for two cooks.' },
        { text: 'Let me order the ingredients and set your whole week.', why: 'Convenient, and it would decide for you. You may prefer to choose your own market.' }
      ]
    }
  };

  function show() {
    const set = headings[select.value];
    chip.textContent = set.label;
    list.replaceChildren();
    set.ideas.forEach((idea) => {
      const card = document.createElement('li');
      card.className = 'proposal';
      const text = document.createElement('p');
      text.textContent = idea.text;
      const why = document.createElement('p');
      why.className = 'why';
      why.hidden = true;
      why.textContent = idea.why;
      const actions = document.createElement('div');
      actions.className = 'actions';
      const reply = document.createElement('p');
      reply.className = 'system-voice';
      reply.setAttribute('aria-live', 'polite');

      function button(label, handler) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'button button--quiet';
        b.textContent = label;
        b.addEventListener('click', handler);
        return b;
      }
      actions.append(
        button('Keep', () => {
          card.classList.add('is-kept');
          card.classList.remove('is-rejected');
          reply.textContent = '> Kept. I will help with this part only. The heading is still yours.';
        }),
        button('Ask why', () => {
          why.hidden = !why.hidden;
          reply.textContent = why.hidden ? '' : '> Here is my reasoning, including what I am unsure about.';
        }),
        button('Reject', () => {
          card.classList.add('is-rejected');
          card.classList.remove('is-kept');
          reply.textContent = '> Understood. I will not offer that again tonight.';
        })
      );
      card.append(text, why, actions, reply);
      list.append(card);
    });
  }

  select.addEventListener('change', show);
  show();
})();
