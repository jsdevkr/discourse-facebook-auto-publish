require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
var rp = require('request-promise');

const { init, gotoGroupAndPost } = require('./fbPuppeteer');
const { sleep, promiseQueue } = require('./helper');

const app = express();
const port = process.env.PORT || 8080;

function getCategoryName(categoryId) {
  return rp({
    uri: process.env.DISCOURSE_URL + '/site.json',
    json: true,
  }).then(async results => {
    if (results && results.categories) {
      const currentCategory = results.categories.find(category => {
        return category.id === categoryId;
      });
      let displayNames = currentCategory.name;
      if (currentCategory.parent_category_id) {
        const parentName = await getCategoryName(currentCategory.parent_category_id);
        displayNames = `${parentName}/${displayNames}`;
      }
      return displayNames;
    } else {
      throw new Error('categories.json scheme error');
    }
  });
}

function shareToFBGroup(topic, delay = 0) {
  return new Promise((resolve, reject) => {
    let tryCount = 1;
    const errors = [];

    (async function runner() {
      try {
        if (topic && topic.id && topic.archetype === 'regular') {
          // regular가 개인 message 생성도 topic이어서 일반 topic인지 구분

          await sleep(delay);
          const updatedTopic = await rp({
            uri: process.env.DISCOURSE_URL + '/t/' + topic.id + '.json',
            json: true,
          });

          if (!updatedTopic) {
            return;
          }

          // Is it existed or not?
          const displayCategoryName = await getCategoryName(updatedTopic.category_id)
            .catch(() => {
              return ''; //if error, ignore do not display category name
            })
            .then(name => (name ? `[${name}] ` : ''));

          const message = `${displayCategoryName}${updatedTopic.title}\nby @${topic.created_by.username} ${
            process.env.DISCOURSE_URL
          }/t/${topic.id}`;
          console.log(message);

          await gotoGroupAndPost(message);
          console.log('fb posting successful', new Date());
          resolve();
        }
      } catch (error) {
        errors.push(error);
        // retry
        if (tryCount < 3) {
          tryCount++;
          runner();
        } else {
          reject(errors);
        }
      }
    })();
  });
}

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/discoursehook', function(req, res) {
  const eventType = req.get('X-Discourse-Event');
  console.log(eventType);
  if (eventType === 'topic_created') {
    promiseQueue.push(() => shareToFBGroup(req.body.topic, 30 * 1000));
  }
  res.json({
    id: req.body.topic.id,
    title: req.body.topic.title,
    eventType,
  });
});

app.post('/discoursehook_delay', function(req, res) {
  const eventType = req.get('X-Discourse-Event');
  console.log(eventType);
  if (eventType === 'topic_created') {
    promiseQueue.push(() => shareToFBGroup(req.body.topic, 60 * 1000 * (process.env.POSTED_AFTER_MIN || 5)));
  }
  res.json({
    id: req.body.topic.id,
    title: req.body.topic.title,
    eventType,
  });
});

app.get('/', (req, res) => {
  console.log('Hello World!');
  res.json({
    success: true,
  });
});

app.listen(port, function() {
  console.log(`Server listening on port ${port}!`);
});

// // please keep alive
// if (process.env.HEROKU_URL) {
//   setInterval(() => {
//     rp.get(process.env.HEROKU_URL);
//   }, 3 * 60 * 1000);
// }

if (process.env.NODE_ENV === 'development') {
  promiseQueue.push(() =>
    shareToFBGroup({
      tags: [],
      id: 4028,
      title: '포럼 글을 페이스북으로 자동 공유하는 기능 테스트 중입니다.',
      fancy_title: '포럼 글을 페이스북으로 자동 공유하는 기능 테스트 중입니다.',
      posts_count: 1,
      created_at: '2018-10-26T13:31:51.931Z',
      views: 0,
      reply_count: 0,
      like_count: 0,
      last_posted_at: '2018-10-26T13:31:53.201Z',
      visible: true,
      closed: false,
      archived: false,
      archetype: 'regular',
      slug: 'topic',
      category_id: 1,
      word_count: 9,
      deleted_at: null,
      pending_posts_count: 0,
      user_id: 147,
      featured_link: null,
      pinned_globally: false,
      pinned_at: null,
      pinned_until: null,
      unpinned: null,
      pinned: false,
      highest_post_number: 1,
      deleted_by: null,
      has_deleted: false,
      bookmarked: null,
      participant_count: 1,
      created_by: {
        id: 147,
        username: 'yomybaby',
        name: '이종은(Jong Lee)',
        avatar_template: '/user_avatar/jsdev.kr/yomybaby/{size}/85_1.png',
      },
      last_poster: {
        id: 147,
        username: 'yomybaby',
        name: '이종은(Jong Lee)',
        avatar_template: '/user_avatar/jsdev.kr/yomybaby/{size}/85_1.png',
      },
    }),
  );
}
