import {test,expect} from '@playwright/test';
for (const viewport of [{width:1165,height:747},{width:390,height:844}]) {
 test(`report reachable at ${viewport.width}`,async({page})=>{
  await page.setViewportSize(viewport); await page.goto('/');
  await page.getByRole('button',{name:/try it with a sample class/i}).click();
  await page.getByRole('button',{name:'Generate Seating Chart',exact:true}).click();
  const report=page.getByRole('heading',{name:'Placement Report'});
  await report.scrollIntoViewIfNeeded(); await expect(report).toBeInViewport();
  expect(await report.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement){if(getComputedStyle(p).overflowY==='hidden'&&p.scrollHeight>p.clientHeight+1)return true;}return false;})).toBe(false);
  const regen=page.getByRole('button',{name:'Regenerate',exact:true});
  await regen.scrollIntoViewIfNeeded();await expect(regen).toBeInViewport();await regen.click();
  await expect(page.getByText(/Placed:\s*24/)).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.getByText(/No issues reported by the generator/)).toHaveCount(0);
  await expect(page.getByText('100/100',{exact:true})).toHaveCount(0);
  await expect(page.getByText(/Placement explanation needs review/).first()).toBeVisible();
  const names=page.getByRole('grid').locator('span[title]');
  expect(await names.evaluateAll(els=>els.every(el=>el.scrollHeight<=el.clientHeight+1))).toBe(true);
  await page.emulateMedia({media:'print'});
  await expect(page.locator('#chart-print')).toBeVisible();
  await expect(page.locator('#chart-print').getByText('Amara Okafor',{exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Workspace',exact:true})).toBeHidden();
  await page.emulateMedia({media:'screen'});
  await page.screenshot({path:`/tmp/syndesk-layout-${viewport.width}.png`,fullPage:true});
 });
}
