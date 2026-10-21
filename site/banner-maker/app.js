(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const image = document.querySelector('.banner__background');
  const defaultIcon = '../assets/avatar.jpg';
  const defaultBorder = '#F280B6';
  const defaultBackground = '#ffffff';
  const storageKey = 'mirage-tools.banners';
  const savedImageNote = 'Saved image (used only on this device)';
  const tooClose = 'The text is too close to the author name. Shorten it.';
  const bannerKeys = ['title', 'contents', 'author', 'copyright', 'border', 'background', 'library', 'imageId', 'imageSrc', 'iconSrc', 'zoom', 'position'];
  let generation = 0;
  let loading = Promise.resolve();
  let embeddedFonts;
  let toastTimer;
  const preset = () => window.bannerPresets.find(p => p.slug === $('library').value);

  function toast(message, kind = 'info') {
    const el = $('toast');
    if (!message) {
      if (el.textContent === 'Loading image…' || el.textContent.includes('too close')) {
        el.classList.remove('is-in');
        clearTimeout(toastTimer);
      }
      return;
    }
    if (el.classList.contains('is-in') && el.classList.contains(kind) && el.textContent === message) {
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => el.classList.remove('is-in'), 2200);
      return;
    }
    el.textContent = message;
    el.classList.remove('is-in', 'info', 'error');
    el.classList.add(kind);
    void el.offsetWidth;
    el.classList.add('is-in');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-in'), 2200);
  }

  function resize() {
    const width = $('preview-slot').clientWidth;
    $('preview-scale').style.transform = `scale(${width / 1200})`;
    $('preview-slot').style.height = `${width * 630 / 1200}px`;
  }
  new ResizeObserver(resize).observe($('preview-slot'));

  function geometry() {
    image.style.transform = `scale(${$('zoom').value / 100})`;
    image.style.objectPosition = `center ${$('position').value}%`;
    $('zoom-value').textContent = `${$('zoom').value}%`;
    $('position-value').textContent = `${$('position').value}%`;
  }
  function grow(el) {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }
  function fitField(el, max) {
    el.style.width = '1px';
    el.style.width = `${Math.min(el.scrollWidth, max)}px`;
  }
  function paint() {
    $('banner').style.setProperty('--banner-border', $('border').value);
    $('banner').style.backgroundColor = $('background').value;
    grow($('title'));
    grow($('contents'));
    fitField($('author'), 1057);
    fitField($('copyright'), 480);
  }
  function fits() {
    const bottom = Math.max($('title').getBoundingClientRect().bottom, $('contents').getBoundingClientRect().bottom);
    const author = document.querySelector('.banner__category').getBoundingClientRect();
    return bottom + 12 * $('preview-slot').clientWidth / 1200 <= author.top && $('author').scrollWidth <= 1057;
  }

  async function setImage(src) {
    const current = ++generation;
    $('save').disabled = true;
    toast('Loading image…');
    try {
      image.src = src;
      await image.decode();
      await document.fonts.ready;
      if (current !== generation) return;
      toast(fits() ? '' : tooClose, 'error');
      $('save').disabled = false;
    } catch (error) {
      if (current !== generation) return;
      toast('Could not load the image. Choose another one.', 'error');
      $('save').disabled = false;
      console.error(error);
    }
  }
  function markImage(id) {
    for (const button of $('image-list').children) {
      button.setAttribute('aria-pressed', button.dataset.id === id ? 'true' : 'false');
    }
  }
  function markIcon() {
    $('icon-default').setAttribute('aria-pressed', $('banner-icon').src.startsWith('data:') ? 'false' : 'true');
  }
  function renderLibrary() {
    $('image-list').replaceChildren(...preset().backgrounds.map(b => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'image-option';
      button.dataset.id = b.id;
      button.setAttribute('aria-pressed', 'false');
      const img = document.createElement('img');
      img.src = b.src;
      img.alt = '';
      const caption = document.createElement('span');
      caption.textContent = b.label;
      button.append(img, caption);
      button.addEventListener('click', () => chooseLibrary(b.id));
      return button;
    }));
  }
  function chooseLibrary(id) {
    $('upload').value = '';
    $('image-info').textContent = 'Images stay in the browser.';
    markImage(id);
    loading = setImage(preset().backgrounds.find(b => b.id === id).src);
  }
  function readImage(file, onLoad) {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast('Choose a PNG, JPEG, or WebP image.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast('Could not read the file.', 'error');
    reader.onload = () => onLoad(reader.result, file);
    reader.readAsDataURL(file);
  }

  function defaults() {
    $('title').value = 'New Preset';
    $('contents').value = 'Contents Here';
    $('author').value = 'mirage hub';
    $('copyright').value = '© SQUARE ENIX';
    $('border').value = defaultBorder;
    $('background').value = defaultBackground;
    $('icon').value = '';
    $('banner-icon').src = defaultIcon;
    markIcon();
    $('zoom').value = '106';
    $('position').value = '50';
    paint();
    geometry();
  }
  function openNewPreset() {
    defaults();
    renderLibrary();
    chooseLibrary(preset().default);
  }
  function snapshot() {
    const pressed = $('image-list').querySelector('[aria-pressed="true"]');
    return {
      title: $('title').value,
      contents: $('contents').value,
      author: $('author').value,
      copyright: $('copyright').value,
      border: $('border').value,
      background: $('background').value,
      library: $('library').value,
      imageId: pressed ? pressed.dataset.id : '',
      imageSrc: pressed ? '' : (image.src.startsWith('data:') ? image.src : ''),
      iconSrc: $('banner-icon').src.startsWith('data:') ? $('banner-icon').src : '',
      zoom: $('zoom').value,
      position: $('position').value
    };
  }
  function clamp(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return String(Math.min(max, Math.max(min, Math.round(n))));
  }
  function dataImage(value) {
    return typeof value === 'string' && value.startsWith('data:image/') ? value : '';
  }
  function noteApplied(message, token) {
    if (token !== generation || !message) return;
    if (!fits()) toast(`${message} ${tooClose}`, 'error');
    else toast(message);
  }
  function applyState(state, message, imageNote) {
    state = state || {};
    if (window.bannerPresets.some(p => p.slug === state.library)) $('library').value = state.library;
    renderLibrary();
    $('title').value = typeof state.title === 'string' ? state.title.slice(0, 150) : '';
    $('contents').value = typeof state.contents === 'string' ? state.contents.slice(0, 250) : '';
    $('author').value = typeof state.author === 'string' ? state.author.slice(0, 40) : '';
    $('copyright').value = typeof state.copyright === 'string' ? state.copyright.slice(0, 80) : '';
    if (/^#[0-9a-fA-F]{6}$/.test(state.border || '')) $('border').value = state.border;
    if (/^#[0-9a-fA-F]{6}$/.test(state.background || '')) $('background').value = state.background;
    else $('background').value = defaultBackground;
    $('zoom').value = clamp(state.zoom, 100, 180, '106');
    $('position').value = clamp(state.position, 0, 100, '50');
    $('icon').value = '';
    $('upload').value = '';
    const icon = dataImage(state.iconSrc);
    $('banner-icon').src = icon || defaultIcon;
    markIcon();
    paint();
    geometry();
    const known = preset().backgrounds.some(b => b.id === state.imageId);
    const imageSrc = dataImage(state.imageSrc);
    if (imageSrc) {
      markImage('');
      $('image-info').textContent = imageNote;
      loading = setImage(imageSrc);
    } else if (known) {
      chooseLibrary(state.imageId);
    } else {
      chooseLibrary(preset().default);
    }
    const token = generation;
    loading = loading.then(() => noteApplied(message, token));
  }

  function readStore() {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return Array.isArray(data.items) ? data.items : [];
    } catch {
      return [];
    }
  }
  function persist(items) {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ items }));
      return true;
    } catch (error) {
      toast('Could not save. This browser is out of space.', 'error');
      console.error(error);
      return false;
    }
  }
  function setName(title) {
    return title.trim() || 'Untitled';
  }
  function renderSaved(selected) {
    const load = $('load');
    const items = readStore();
    const keep = selected ?? load.value;
    if (!items.length) {
      load.replaceChildren(new Option('-', ''));
      load.value = '';
      return;
    }
    load.replaceChildren(...items.map(item => new Option(item.name, item.id)));
    load.value = items.some(item => item.id === keep) ? keep : items[0].id;
  }
  function addSet(state, name = state.title) {
    const entry = { id: crypto.randomUUID(), name: setName(name), state };
    if (!persist([entry, ...readStore()])) return null;
    renderSaved(entry.id);
    return entry;
  }
  function showStored(item, message = '') {
    renderSaved(item.id);
    applyState(item.state, message, savedImageNote);
  }
  function showBlank() {
    renderSaved('');
    openNewPreset();
  }

  function bannerFile(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    if (data.state && typeof data.state === 'object' && !Array.isArray(data.state)) return data;
    if (bannerKeys.some(key => key in data)) return { name: data.name, state: data };
    return null;
  }
  function applyBannerText(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
    const parsed = bannerFile(data);
    if (!parsed) {
      toast('Clipboard is not a banner.', 'error');
      return;
    }
    applyState(parsed.state, '', 'Pasted image (used only on this device)');
    const name = typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : undefined;
    if (addSet(snapshot(), name)) toast('Added.');
  }

  function plain(tag, className, value) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = value;
    return el;
  }
  function captureNode() {
    const clone = $('banner').cloneNode(true);
    clone.querySelector('#title').replaceWith(plain('h2', '', $('title').value));
    clone.querySelector('#contents').replaceWith(plain('p', 'banner__subtitle', $('contents').value));
    clone.querySelector('#author').replaceWith(plain('span', '', $('author').value));
    clone.querySelector('#copyright').replaceWith(plain('small', '', $('copyright').value));
    const imageHit = clone.querySelector('#image-hit');
    imageHit.replaceWith(imageHit.firstElementChild);
    const iconHit = clone.querySelector('#icon-hit');
    iconHit.replaceWith(iconHit.firstElementChild);
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    return clone;
  }
  async function savePng() {
    $('save').disabled = true;
    toast('Creating image…');
    try {
      await loading;
      await document.fonts.ready;
      if (!fits()) { toast('The text does not fit. Shorten the title or contents.', 'error'); return; }
      const host = document.createElement('div');
      host.style.cssText = 'position:fixed;left:-12000px;top:0;width:1200px;height:630px;';
      const node = captureNode();
      host.append(node);
      document.body.append(host);
      try {
        embeddedFonts ??= htmlToImage.getFontEmbedCSS($('banner'));
        const blob = await htmlToImage.toBlob(node, {
          width: 1200, height: 630, pixelRatio: 1,
          fontEmbedCSS: await embeddedFonts, backgroundColor: $('background').value
        });
        if (!blob) throw new Error('PNG generation returned no image');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `splatoon-${preset().slug}-preset.png`;
        link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
        toast('PNG saved.');
      } finally {
        host.remove();
      }
    } catch (error) {
      toast('Could not save. Reload the page and try again.', 'error');
      embeddedFonts = undefined;
      console.error(error);
    } finally { $('save').disabled = false; }
  }

  $('library').replaceChildren(...window.bannerPresets.map(p => new Option(p.title, p.slug)));
  const first = readStore()[0];
  if (first) showStored(first);
  else showBlank();

  $('library').addEventListener('change', () => {
    renderLibrary();
    chooseLibrary(preset().default);
  });
  $('add-set').addEventListener('click', () => {
    openNewPreset();
    if (addSet(snapshot())) toast('Added.');
  });
  $('duplicate-set').addEventListener('click', () => {
    if (addSet(snapshot())) toast('Duplicated.');
  });
  $('delete-set').addEventListener('click', () => {
    const id = $('load').value;
    if (id && !persist(readStore().filter(item => item.id !== id))) return;
    const next = readStore()[0];
    if (next) showStored(next);
    else showBlank();
    toast('Deleted.');
  });
  $('editor').addEventListener('submit', event => {
    event.preventDefault();
    const id = $('load').value;
    const items = readStore();
    const existing = items.find(item => item.id === id);
    if (!existing) {
      if (addSet(snapshot())) toast('Saved.');
      return;
    }
    const entry = { id, name: setName($('title').value), state: snapshot() };
    if (!persist(items.map(item => item.id === id ? entry : item))) return;
    renderSaved(id);
    toast('Saved.');
  });
  $('load').addEventListener('change', () => {
    const item = readStore().find(entry => entry.id === $('load').value);
    if (item) applyState(item.state, `Loaded "${item.name}".`, savedImageNote);
  });

  function toggleCard(card, hit) {
    const wasHidden = $(card).hidden;
    $('image-card').hidden = true;
    $('icon-card').hidden = true;
    $('image-hit').setAttribute('aria-expanded', 'false');
    $('icon-hit').setAttribute('aria-expanded', 'false');
    if (wasHidden) {
      $(card).hidden = false;
      $(hit).setAttribute('aria-expanded', 'true');
    }
  }
  $('image-hit').addEventListener('click', () => toggleCard('image-card', 'image-hit'));
  $('icon-hit').addEventListener('click', () => toggleCard('icon-card', 'icon-hit'));
  for (const id of ['title', 'contents', 'author', 'copyright']) {
    $(id).addEventListener('input', () => {
      paint();
      toast(fits() ? '' : tooClose, 'error');
    });
  }
  for (const id of ['border', 'background']) $(id).addEventListener('input', paint);
  for (const id of ['zoom', 'position']) $(id).addEventListener('input', geometry);
  $('icon-default').addEventListener('click', () => {
    $('icon').value = '';
    $('banner-icon').src = defaultIcon;
    markIcon();
  });
  $('icon').addEventListener('change', () => {
    readImage($('icon').files[0], src => {
      $('banner-icon').src = src;
      markIcon();
    });
  });
  $('upload').addEventListener('change', () => {
    readImage($('upload').files[0], (src, file) => {
      markImage('');
      $('image-info').textContent = `${file.name} (used only on this device)`;
      loading = setImage(src);
    });
  });
  $('copy-json').addEventListener('click', async () => {
    const payload = { name: $('title').value.trim(), ...snapshot() };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast('Copied JSON.');
    } catch (error) {
      toast('Could not copy JSON.', 'error');
      console.error(error);
    }
  });
  $('paste-json').addEventListener('click', async () => {
    try {
      applyBannerText(await navigator.clipboard.readText());
    } catch (error) {
      toast('Could not read the clipboard.', 'error');
      console.error(error);
    }
  });
  $('save').addEventListener('click', savePng);
})();
