(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const image = document.querySelector('.banner__background');
  let customImage = null;
  let generation = 0;
  let loading = Promise.resolve();
  let embeddedFonts;
  const preset = () => window.bannerPresets.find(p => p.slug === $('preset').value);
  const status = message => { $('status').textContent = message; };
  const resize = () => {
    const width = $('preview-slot').clientWidth;
    $('preview-scale').style.transform = `scale(${width / 1200})`;
    $('preview-slot').style.height = `${width * 630 / 1200}px`;
  };
  new ResizeObserver(resize).observe($('preview-slot'));
  function geometry() {
    image.style.transform = `scale(${$('zoom').value / 100})`;
    image.style.objectPosition = `center ${$('position').value}%`;
    $('zoom-value').textContent = `${$('zoom').value}%`;
    $('position-value').textContent = `${$('position').value}%`;
  }
  function text() {
    $('banner-title').textContent = $('title').value;
    $('banner-description').textContent = $('description').value;
    $('banner-signature').textContent = $('signature').value;
  }
  function fits() {
    const bottom = Math.max($('banner-title').getBoundingClientRect().bottom, $('banner-description').getBoundingClientRect().bottom);
    const signature = document.querySelector('.banner__category').getBoundingClientRect();
    return bottom + 12 * $('preview-slot').clientWidth / 1200 <= signature.top && $('banner-signature').scrollWidth <= 1057;
  }
  async function setImage(src) {
    const current = ++generation;
    $('save').disabled = true;
    status('画像を読み込んでいます…');
    try {
      image.src = src;
      await image.decode();
      await document.fonts.ready;
      if (current !== generation) return;
      status('PNGを保存できます。');
      $('save').disabled = false;
    } catch (error) {
      if (current !== generation) return;
      status('画像を読み込めませんでした。別の画像を選んでください。');
      console.error(error);
    }
  }
  function background() {
    customImage = null;
    $('upload').value = '';
    $('image-info').textContent = '画像はブラウザ内で処理します。';
    loading = setImage(preset().backgrounds.find(b => b.id === $('background').value).src);
  }
  function reset() {
    const p = preset();
    $('background').replaceChildren(...p.backgrounds.map(b => new Option(b.label, b.id)));
    $('background').value = p.default;
    $('title').value = `Splatoon ${p.title} プリセット`;
    $('description').value = `${p.title}（${p.slug.toUpperCase()}）で使用できる、Splatoon用レイアウトやスクリプトの設定方法をまとめています。`;
    $('signature').value = 'mirage hub';
    $('zoom').value = '106';
    $('position').value = '50';
    text(); geometry(); background();
    const url = new URL(location.href);
    url.searchParams.set('preset', p.slug);
    history.replaceState(null, '', url);
  }
  $('preset').replaceChildren(...window.bannerPresets.map(p => new Option(p.title, p.slug)));
  const initial = new URLSearchParams(location.search).get('preset');
  if (window.bannerPresets.some(p => p.slug === initial)) $('preset').value = initial;
  $('preset').addEventListener('change', reset);
  $('background').addEventListener('change', background);
  $('reset').addEventListener('click', reset);
  for (const id of ['title', 'description', 'signature']) $(id).addEventListener('input', () => { text(); status(fits() ? 'PNGを保存できます。' : '文字が下部の署名に近づいています。文章を短くしてください。'); });
  for (const id of ['zoom', 'position']) $(id).addEventListener('input', geometry);
  $('editor').addEventListener('submit', event => event.preventDefault());
  $('upload').addEventListener('change', async () => {
    const file = $('upload').files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { status('PNG・JPEG・WebP画像を選んでください。'); return; }
    const reader = new FileReader();
    reader.onerror = () => status('ファイルを読み込めませんでした。');
    reader.onload = () => {
      customImage = reader.result;
      $('image-info').textContent = `${file.name}（端末内だけで使用）`;
      loading = setImage(customImage);
    };
    reader.readAsDataURL(file);
  });
  $('save').addEventListener('click', async () => {
    $('save').disabled = true;
    status('画像を作成しています…');
    try {
      await loading;
      await document.fonts.ready;
      if (!fits()) { status('文章が収まりません。タイトルや概要を短くしてください。'); return; }
      embeddedFonts ??= htmlToImage.getFontEmbedCSS($('banner'));
      const blob = await htmlToImage.toBlob($('banner'), {
        width: 1200, height: 630, pixelRatio: 1,
        fontEmbedCSS: await embeddedFonts, backgroundColor: '#ffffff'
      });
      if (!blob) throw new Error('PNG generation returned no image');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `splatoon-${preset().slug}-preset.png`;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
      status('PNGを保存しました。');
    } catch (error) {
      status('保存できませんでした。ページを再読み込みしてお試しください。');
      embeddedFonts = undefined;
      console.error(error);
    } finally { $('save').disabled = false; }
  });
  reset();
})();
