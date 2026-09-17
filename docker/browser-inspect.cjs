const {chromium}=require('/tmp/node_modules/playwright');
const dns=require('node:dns').promises;
(async()=>{
 const {address}=await dns.lookup('host.docker.internal');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox',`--host-resolver-rules=MAP localhost ${address}`]});
 const page=await browser.newPage({viewport:{width:1440,height:1100},ignoreHTTPSErrors:true});
 page.on('pageerror',e=>console.log('PAGEERROR',e.message));
 await page.goto('http://localhost:4202/calculate',{waitUntil:'networkidle',timeout:60000});
 console.log((await page.locator('body').innerText()).slice(0,6500));
 console.log('SELECTS',await page.locator('select').evaluateAll(es=>es.map(e=>({id:e.id,options:[...e.options].map(o=>({text:o.text,value:o.value}))}))));
 await page.screenshot({path:'/tmp/calculator-before.png',fullPage:true});
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
