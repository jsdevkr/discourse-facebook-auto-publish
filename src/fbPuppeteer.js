const puppeteer = require('puppeteer');

const sleep = async (ms) => {
  return new Promise((res) => {
    setTimeout(() => {
      res();
    }, ms);
  });
};

const ID = {
  login: '#email',
  pass: '#pass',
  feedComposer: '#feedx_sprouts_container',
  groupComposer: '#pagelet_group_composer',
  groupSendPostBtn: 'button[data-testid="react-composer-post-button"]'
};

let fbPage;

async function init() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications']
  });
  const _page = await browser.newPage();

  _page.on('dialog', async dialog => {
    console.log(dialog.message());
    await dialog.accept();
  });
  // login
  await _page.goto('https://www.facebook.com/', {
    waitUntil: 'networkidle2'
  });
  await _page.waitForSelector(ID.login);
  await _page.type(ID.login, process.env.FBUSER);
  await _page.type(ID.pass, process.env.FBPASS);
  await sleep(500);

  await _page.click('#loginbutton');
  // await page.waitForNavigation();

  await _page.waitForSelector(ID.feedComposer);
  fbPage = _page;
}


async function gotoGroupAndPost(message) {
  if (!fbPage) {
    // throw new Error('Please init fbPuppeteer before use');
    await init();
  }

  try {
    await fbPage.goto('https://www.facebook.com/groups/jsdev.kr/', {
      waitUntil: 'networkidle2'
    });
    await fbPage.waitForSelector(ID.groupComposer);
    await fbPage.click(ID.groupComposer);
    await sleep(500);
    await fbPage.keyboard.type(message + ' '); // Types instantly. Add last space for previwing link
    await sleep(2000);
    await fbPage.click(ID.groupSendPostBtn);
    // await fbPage.keyboard.press('Escape');
    // await fbPage.keyboard.press('Escape');
    // await fbPage.keyboard.press('Escape');
    await sleep(1000);
  } catch (e) {
    console.error(e);
    throw e;
  }
}


export default {
  init,
  gotoGroupAndPost
};
