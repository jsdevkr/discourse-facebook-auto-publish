import fs from 'fs';
import readline from 'readline';
import FB from 'fb';

function readlineAccessToken() {
  return new Promise(function (resolve) {
    console.log('Open this url and get accessToken : https://developers.facebook.com/tools/explorer/' + process.env.FACEBOOK_APP_ID);
    console.log('Scope required : publish_actions, user_managed_groups');

    const r = readline.createInterface({ input: process.stdin, output: process.stdout });
    r.question('What is accessToken? >> ', function (accessToken) {
      resolve(accessToken);
      r.close();
    });
  });
}

function fbExchangeAccessToken(accessToken) {
  return new Promise(function (resolve, reject) {
    FB.api(
      'oauth/access_token',
      {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_SECRET,
        grant_type: 'fb_exchange_token',
        fb_exchange_token: accessToken
      },
      function (response) {
        if (response && !response.error) {
          return resolve(response.access_token);
        }
        console.error(response.error);
        return reject(response.error);
      }
    );
  });
}

function convertEnvironmentToJS(accessToken) {
  const envs = [];

  envs.push('process.env.DISCOURSE_URL = \'' + process.env.DISCOURSE_URL + '\';');
  envs.push('process.env.FACEBOOK_APP_ID = \'' + process.env.FACEBOOK_APP_ID + '\';');
  envs.push('process.env.FACEBOOK_SECRET = \'' + process.env.FACEBOOK_SECRET + '\';');
  envs.push('process.env.FACEBOOK_GROUP_ID = \'' + process.env.FACEBOOK_GROUP_ID + '\';');
  envs.push('process.env.POLLING_INTERVAL_SEC = ' + process.env.POLLING_INTERVAL_SEC + ';');
  envs.push('process.env.POSTED_AFTER_MIN = ' + process.env.POSTED_AFTER_MIN + ';');
  envs.push('process.env.FACEBOOK_ACCESS_TOKEN = \'' + accessToken + '\';');

  return envs.join('\n');
}

function writeTokenToFile(accessToken) {
  console.log('accessToken :', accessToken);

  fs.open('./.env.js', 'w', function (err, fd) {
    if (err) {
      console.error(err);
      throw err;
    }

    const buf = new Buffer(convertEnvironmentToJS(accessToken));
    fs.write(fd, buf, 0, buf.length, null, function (err2, written, buffer) { // eslint-disable-line
      if (err2) {
        console.error(err2);
        throw err2;
      }
      fs.close(fd, function () {
        console.log('writeTokenToFile is done');
      });
    });
  });
}


function getAccessToken() {
  readlineAccessToken().then((accessToken) => {
    return fbExchangeAccessToken(accessToken);
  }).then(writeTokenToFile);
}

// start
getAccessToken();
