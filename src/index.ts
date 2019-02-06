import * as dotenv from 'dotenv';
dotenv.config();

import Server from './server';

new Server({
  port: Number(process.env.PORT),
  discourseUrl: process.env.DISCOURSE_URL,
  postedAfterMin: Number(process.env.POSTED_AFTER_MIN),
  facebookGroupUrl: process.env.FACEBOOK_GROUP_URL,
  fbUserId: process.env.FACEBOOK_USER,
  fbUserPassword: process.env.FACEBOOK_PASS,
});
