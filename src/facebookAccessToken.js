import readline from 'readline';

import { fbExchangeAccessToken, writeTokenToFile } from './accessTokenUtils';

function readlineAccessToken() {
  return new Promise(function (resolve) {
    console.log('***************************************************************************************************************');
    console.log('  Open this url and get accessToken : https://developers.facebook.com/tools/explorer/' + process.env.FACEBOOK_APP_ID);
    console.log('  *** Attention *** Type  : User Access Token');
    console.log('  *** Attention *** Scope : publish_to_groups');
    console.log('***************************************************************************************************************');

    const r = readline.createInterface({ input: process.stdin, output: process.stdout });
    r.question('What is accessToken? >> ', function (accessToken) {
      resolve(accessToken);
      r.close();
    });
  });
}

function getAccessToken() {
  readlineAccessToken().then((accessToken) => {
    return fbExchangeAccessToken(accessToken);
  }).then(writeTokenToFile);
}

// start
if (process.env.FACEBOOK_ACCESS_TOKEN) {
  writeTokenToFile(process.env.FACEBOOK_ACCESS_TOKEN);
} else {
  getAccessToken();
}
