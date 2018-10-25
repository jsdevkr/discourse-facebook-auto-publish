// import FB from 'fb';
// import env from '../.env.js';

import RestClient from './restClient';
import fbPuppet from './fbPuppeteer';

console.log('NODE_ENV', process.env.NODE_ENV);

let checkDate = new Date();
// for developemnt
if (process.env.NODE_ENV !== 'production') checkDate = checkDate.setHours(-24);

let lastPostDate = checkDate;

// get discourse cagegory
function getCategories(categoryId) {
  return new Promise((resolve, reject) => {
    const restClient = new RestClient();
    restClient.get(process.env.DISCOURSE_URL + '/site.json').then((results) => {
      if (results && typeof results !== 'object') results = JSON.parse(results);

      if (results && results.categories) {
        const findCategory = results.categories.find((category) => { return category.id === categoryId; });
        return resolve(findCategory);
      }
      console.error('categories.json scheme error');
      return reject('categories.json scheme error');
    }, reject);
  });
}

// facebook post
function fbPostGroup(message, link) {
  return fbPuppet.gotoGroupAndPost(`${message} ${link}`);
}

// parse topics
function parseTopics(topics, users) {
  const postedOverMin = process.env.POSTED_AFTER_MIN * 1;

  // important - filtering
  const filteredTopics = topics.filter((info) => {
    const createdAt = new Date(info.created_at);
    // posted over 5 min
    const timeDiffMin = ((new Date()).getTime() - createdAt.getTime()) / (1000 * 60);
    // lastPostDate keep
    if (timeDiffMin > postedOverMin && createdAt > lastPostDate) lastPostDate = createdAt;
    // check new post
    return timeDiffMin > postedOverMin && createdAt > checkDate;
  });
  console.log('filteredTopics', JSON.stringify(filteredTopics));

  // promise serialize
  const p = Promise.resolve();
  return filteredTopics.reduce((pacc, info) => {
    const fn = function () {
      // get category
      return getCategories(info.category_id).then((categoryInfo) => {
        // subject
        const _subject = info.title;
        // find post user
        let _posters = null;
        if (info.posters.length === 1) {
          _posters = info.posters[0];
        } else {
          _posters = info.posters.find((poster) => {
            return poster.description.indexOf('원본 게시자') > -1;
          });
        }
        if (!_posters) _posters = info.posters[0];
        // users serach
        const _postUser = users.find((user) => {
          return user.id === _posters.user_id;
        });

        // body
        const message = '[' + categoryInfo.name + '] ' + _subject + '\n\nby @' + _postUser.username;
        const link = process.env.DISCOURSE_URL + '/t/' + info.slug + '/' + info.id;

        return fbPostGroup(message, link);
      });
    };

    pacc = pacc.then(fn);
    return pacc;
  }, p);
}

// get discourse topics
function getDiscourse() {
  return new Promise((resolve, reject) => {
    const restClient = new RestClient();
    restClient.get(process.env.DISCOURSE_URL + '/latest.json').then((results) => {
      if (results && typeof results !== 'object') results = JSON.parse(results);

      if (results && results.topic_list && results.topic_list.topics) {
        return parseTopics(results.topic_list.topics, results.users).then(resolve, reject);
      }
      console.error('latest.json scheme error');
      return reject('latest.json scheme error');
    }, reject);
  });
}

// iterator
function iterator() {
  console.log('start, checkDate', checkDate);

  const nextRun = () => {
    checkDate = lastPostDate;
    console.log('success, checkDate update', checkDate);
    // next 1min
    setTimeout(iterator, process.env.POLLING_INTERVAL_SEC * 1000);
  };
  getDiscourse().then(nextRun, nextRun);
}

export default function () {}

export function startDaemon() {
  // start
  iterator();
}
