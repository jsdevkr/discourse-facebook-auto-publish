import * as dotenv from 'dotenv';
dotenv.config();

import Server, { IServerOptions } from './server';

const optionConfig: IServerOptions = {
  port: 'PORT',
  postedAfterMin: 'POSTED_AFTER_MIN',
  discourseUrl: 'DISCOURSE_URL',
  facebookGroupId: 'FACEBOOK_GROUP_ID',
  fbUserId: 'FACEBOOK_USER',
  fbUserPassword: 'FACEBOOK_PASS',
};

function creatServer(idx: number) {
  const option: IServerOptions = {};
  const prefix = `SITE_${idx}`;

  Object.keys(optionConfig).forEach(key => {
    const value = optionConfig[key];
    const processValue = process.env[`${prefix}_${value}`];
    if (processValue) {
      option[key] = processValue;
    }
  });

  if (process.env.NODE_ENV === 'development') {
    console.log(option);
  }

  if (Object.keys(option).length) {
    new Server(option);
    // next
    creatServer(++idx);
  }
}
// first
creatServer(0);
