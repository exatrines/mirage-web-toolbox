// Run against a static server with Playwright available in NODE_PATH.
const {chromium}=require('playwright');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 const root=process.env.TOOLBOX_URL||'http://127.0.0.1:8769/';
 const out=path.join(__dirname,'.qa');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BANNER_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(root);await page.waitForFunction(()=>document.querySelector('#status').textContent==='PNGを保存できます。');
  for(const slug of ['ucob','uwu','tea','dsr','top','fru','dmad','m8s']){
   await page.selectOption('#preset',slug);await page.waitForFunction(()=>!document.querySelector('#save').disabled);
   const pending=page.waitForEvent('download',{timeout:90000});await page.click('#save');
   const download=await pending;await download.saveAs(path.join(out,`${slug}.png`));
   const data=fs.readFileSync(path.join(out,`${slug}.png`));
   if(data.readUInt32BE(16)!==1200||data.readUInt32BE(20)!==630)throw Error('Wrong export dimensions: '+slug);
   await page.waitForFunction(()=>!document.querySelector('#save').disabled);
  }
  await page.selectOption('#preset','ucob');await page.waitForFunction(()=>!document.querySelector('#save').disabled);
  await page.selectOption('#background','official');await page.waitForFunction(()=>!document.querySelector('#save').disabled);
  await page.setInputFiles('#upload',path.join(__dirname,'site/assets/official/fru.png'));await page.waitForFunction(()=>document.querySelector('.banner__background').src.startsWith('data:')&&!document.querySelector('#save').disabled);
  await page.fill('#title','画像持ち込みテスト');await page.fill('#signature','テスト');
  const pending=page.waitForEvent('download',{timeout:90000});await page.click('#save');await (await pending).saveAs(path.join(out,'custom.png'));
  await page.click('#reset');await page.waitForFunction(()=>!document.querySelector('#save').disabled);
  await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
  await page.fill('#description','長い文章'.repeat(60));await page.click('#save');
  if(!await page.locator('#status').textContent().then(s=>s.includes('収まりません')))throw Error('Overflow guard failed');
  await page.click('#reset');
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
  if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw Error('Mobile overflow');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS: 8 preset PNG downloads (1200×630), custom image/text download, reset, overflow guard, desktop/mobile, no page errors.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
