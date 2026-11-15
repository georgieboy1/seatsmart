import {test,expect} from '@playwright/test';
test('teacher selects all four front walls, persists choice, and invalidates an old chart',async({page})=>{
 await page.setViewportSize({width:1165,height:747});
 await page.goto('/');await page.getByRole('button',{name:/try it with a sample class/i}).click();
 await page.getByRole('button',{name:'Generate Seating Chart',exact:true}).click();
 await expect(page.getByText(/Front wall is unconfirmed/)).toBeVisible();
 await page.getByRole('button',{name:'Save Chart',exact:true}).click();await expect(page).toHaveURL(/\/charts\/view\/?\?id=/);const saved=page.url();
 for(const wall of ['top','right','bottom','left']) {
  await page.getByRole('link',{name:'Set teaching wall in Rooms'}).click();
  const select=page.getByLabel('Front wall on this map',{exact:true});
  await select.selectOption(wall);
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.getByText(`Front: ${wall}`,{exact:true})).toBeVisible();
  await page.reload();await expect(select).toHaveValue(wall);
  await page.goto(saved);
  await expect(page.getByText(/layout was updated/)).toBeVisible();
  await expect(page.getByText(/This chart has not been checked with the current settings/)).toBeVisible();
  await page.getByRole('button',{name:'Regenerate',exact:true}).first().click();
  await expect(page.getByText(/Front wall is unconfirmed/)).toHaveCount(0);
  await expect(page.getByText(`Front wall: ${wall} ·`,{exact:false}).first()).toBeVisible();
  await page.emulateMedia({media:'print'});
  await expect(page.locator('#chart-print')).toContainText(`Front: ${wall}`);
  await page.emulateMedia({media:'screen'});
 }
 await page.screenshot({path:'/tmp/syndesk-front-wall-chart.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('link',{name:'Set teaching wall in Rooms'}).click();
 const mobileSelect=page.getByLabel('Front wall on this map',{exact:true});
 await mobileSelect.scrollIntoViewIfNeeded();await expect(mobileSelect).toBeInViewport();
 await mobileSelect.focus();await expect(mobileSelect).toBeFocused();
 await page.screenshot({path:'/tmp/syndesk-front-wall-editor-mobile.png',fullPage:true});
});
