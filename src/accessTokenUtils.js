import fs from 'fs';
import FB from 'fb';

export default {};

export function fbExchangeAccessToken(accessToken) {
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

export function convertEnvironmentToJS(accessToken) {
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

export function writeTokenToFile(accessToken) {
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
