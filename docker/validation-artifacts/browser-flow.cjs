const {chromium}=require('/tmp/node_modules/playwright');const dns=require('node:dns').promises;
(async()=>{
const {address}=await dns.lookup('host.docker.internal');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox',`--host-resolver-rules=MAP localhost ${address}`]});
const page=await browser.newPage({viewport:{width:1440,height:1100},ignoreHTTPSErrors:true});
page.on('pageerror',e=>console.log('PAGEERROR',e.message));
await page.goto('http://localhost:4202/calculate',{waitUntil:'networkidle',timeout:60000});
await page.locator('#location').selectOption({label:'Olot'});
await page.waitForTimeout(1000);
console.log('OPTIONS',await page.locator('#location-comunnity').locator('option').allTextContents());
await page.locator('#location-comunnity').selectOption({index:2},{force:true});
await page.waitForTimeout(2000);
console.log('STATE',await page.evaluate(()=>{const c=ng.getComponent(document.querySelector('app-calculate'));return {keys:Object.keys(c),communityId:c.selectedCommunity?.id,areas:c.addedAreas,mapKeys:Object.keys(c.map)};}));
console.log('BODY',(await page.locator('body').innerText()).slice(0,10000));
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
