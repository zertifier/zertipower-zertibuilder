const {chromium}=require('/tmp/node_modules/playwright');
const dns=require('node:dns').promises,fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const {address}=await dns.lookup('host.docker.internal');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox',`--host-resolver-rules=MAP localhost ${address}`]});
 const page=await browser.newPage({viewport:{width:1440,height:1100},ignoreHTTPSErrors:true});
 page.setDefaultTimeout(60000);const evidence={requests:[],errors:[]};
 page.on('pageerror',e=>evidence.errors.push(e.message));
 page.on('response',async r=>{if(/energy-areas\/simulate|calculator-consumption|community-selections|energy-prediction/.test(r.url()))try{evidence.requests.push({url:r.url(),status:r.status(),request:r.request().postDataJSON(),response:await r.json()});}catch{}});
 async function selectCommunity(){
  await page.goto('http://localhost:4202/calculate',{waitUntil:'networkidle'});
  await page.locator('#location').selectOption({label:'Olot'});
  await page.waitForFunction(()=>document.querySelector('#location-comunnity')?.options.length>2);
  await page.locator('#location-comunnity').selectOption({index:2},{force:true});
  await page.waitForFunction(()=>ng.getComponent(document.querySelector('app-calculate')).energyAreas?.length>0);
  await page.waitForTimeout(1500);
 }
 async function selectRoof(id){
  console.log('SELECT',id);
  await page.evaluate(id=>{
   const c=ng.getComponent(document.querySelector('app-calculate'));let feature;
   c.cadastresMap.forEach(f=>{if(Number(f.getProperty('energyAreaId'))===id)feature=f;});
   if(!feature)throw Error('Roof missing from calculator map');
   const bounds=new google.maps.LatLngBounds();feature.getGeometry().forEachLatLng(p=>bounds.extend(p));
   c.ngZone.run(()=>{
    c.stepActive=5;google.maps.event.trigger(c.cadastresMap,'click',{feature,latLng:bounds.getCenter()});c.cdr.detectChanges();
   });
  },id);
  await page.waitForFunction(id=>{const c=ng.getComponent(document.querySelector('app-calculate'));return c.selectedCadastre.energyAreaId===id&&c.solarConfigurationReady(c.selectedCadastre)&&c.selectedCadastre.monthsConsumption?.length===12;},id,{timeout:120000});
  await page.evaluate(async()=>{const c=ng.getComponent(document.querySelector('app-calculate'));await c.simulateGenerationConsumption();});
  const state=await page.evaluate(()=>{const h=ng.getComponent(document.querySelector('app-calculate')).selectedCadastre;return {id:h.energyAreaId,m2:h.m2,kwp:h.InsalledPower,panels:h.n_plaques,annual:h.yearConsumption,monthly:h.monthsConsumption,source:h.consumptionSource,lat:h.solarLatitude,lon:h.solarLongitude};});
  assert.equal(Number(state.monthly.reduce((a,b)=>a+b,0).toFixed(2)),state.annual);
  console.log('SIMULATED',state);return state;
 }
 async function saveRoof(id){
  await page.waitForTimeout(1700);
  const adjust=page.getByText('Ajustar dades',{exact:true});
  if(await adjust.isVisible()) await adjust.click();
  await page.locator('[data-testid="save-community-area"]').click();
  await page.waitForFunction(id=>ng.getComponent(document.querySelector('app-calculate')).addedAreas.some(a=>a.energyAreaId===id),id);
 }
 async function api(path){return page.evaluate(async path=>{const r=await fetch('http://localhost:3000'+path);const j=await r.json();if(!r.ok||!j.success)throw Error(JSON.stringify(j));return j;},path);}
 try{
  await selectCommunity();
  // Remove only this test's second fixture to repeat the single-roof assertion.
  await page.evaluate(async()=>{const c=ng.getComponent(document.querySelector('app-calculate'));if(c.addedAreas.some(a=>a.energyAreaId===3104)){await c.energyAreasService.removeSelection(7,3104);await c.loadCommunitySelections();}});
  evidence.roof1=await selectRoof(3103);
  // Exercise the manual consumption handler, then restore historical consumption before persisting.
  evidence.manual=await page.evaluate(async()=>{const c=ng.getComponent(document.querySelector('app-calculate'));const h=c.selectedCadastre;
   h.valle=71;h.llano=83;h.punta=97;c.manualConsumptionChanged();await c.loadConsumption(true);c.updateConsumptions();
   const result={source:h.consumptionSource,annual:h.yearConsumption,monthly:h.monthsConsumption};
   h.consumptionSource='pending';await c.loadConsumption(true);c.updateConsumptions();return result;});
  assert.equal(evidence.manual.annual,3012);assert.equal(evidence.manual.source,'manual');
  await saveRoof(3103);
  evidence.oneRoof=await api('/roof-simulation/community-production-details?community=7');
  assert.equal(evidence.oneRoof.data.selectedRoofs,1);assert.equal(evidence.oneRoof.data.forecast.length,6);
  console.log('ONE ROOF',JSON.stringify(evidence.oneRoof));
  evidence.roof2=await selectRoof(3104);await saveRoof(3104);
  evidence.multipleRoofs=await api('/roof-simulation/community-production-details?community=7');
  assert.equal(evidence.multipleRoofs.data.selectedRoofs,2);
  for(let i=0;i<6;i++){const sum=evidence.multipleRoofs.data.predictions.reduce((n,r)=>n+r.daily[i].kwh,0);assert.ok(Math.abs(sum-evidence.multipleRoofs.data.forecast[i].value)<0.021);}
  evidence.endpoint=await api('/energy-prediction?community=7');assert.equal(evidence.endpoint.data.length,6);
  console.log('MULTIPLE ROOFS',JSON.stringify(evidence.multipleRoofs));
  console.log('ENDPOINT',JSON.stringify(evidence.endpoint));
  await selectCommunity();
  await page.waitForFunction(()=>ng.getComponent(document.querySelector('app-calculate')).addedAreas.length===2);
  evidence.persisted=await page.evaluate(()=>ng.getComponent(document.querySelector('app-calculate')).addedAreas.map(a=>({id:a.energyAreaId,annual:a.yearConsumption,savings:a.yearlySavings})));
  assert.ok(evidence.persisted.every(a=>Number.isFinite(a.savings)));
  await page.evaluate(()=>{const c=ng.getComponent(document.querySelector('app-calculate'));c.ngZone.run(()=>{c.stepActive=6;c.cdr.detectChanges();});});
  await page.screenshot({path:'/tmp/calculator-selected-roofs.png',fullPage:true});
  evidence.calculatorText=await page.locator('body').innerText();
  await page.goto('http://localhost:4200/community-prediction-preview/7',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>{const c=ng.getComponent(document.querySelector('app-energy-prediction'));return c&&!c.loading&&c.productionPrediction.length===6&&c.productionPrediction.every(p=>p.value>=0);},null,{timeout:120000});
  evidence.visual=await page.evaluate(()=>{const c=ng.getComponent(document.querySelector('app-energy-prediction'));return {production:c.productionPrediction,consumption:c.consumptionPrediction,message:c.communityConsumptionMessage};});
  evidence.portalText=await page.locator('body').innerText();assert.ok(!evidence.portalText.includes('No disponible'));
  await page.screenshot({path:'/tmp/community-production.png',fullPage:true});console.log('VISUAL',JSON.stringify(evidence.visual));
 }finally{fs.writeFileSync('/tmp/e2e-evidence.json',JSON.stringify(evidence,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
