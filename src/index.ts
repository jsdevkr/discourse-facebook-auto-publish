import * as dotenv from 'dotenv';
dotenv.config();

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as rp from 'request-promise';

import { init, gotoGroupAndPost } from './fbPuppeteer';
import { sleep, promiseQueue } from './helper';

const app = express();
const port = process.env.PORT || 8080;

interface ICategory {
  id: number;
  name: string;
  color: string;
  text_color: string;
  slug: string;
  topic_count: number;
  post_count: number;
  position: number;
  description: string;
  description_text: string;
  topic_url: string;
  read_restricted: boolean;
  permission: number;
  notification_level: number;
  can_edit: boolean;
  topic_template: string;
  has_children: boolean;
  sort_order: string;
  sort_ascending?: any;
  show_subcategory_list: boolean;
  num_featured_topics: number;
  default_view?: any;
  subcategory_list_style: string;
  default_top_period: string;
  minimum_required_tags: number;
  navigate_to_first_post_after_read: boolean;
  uploaded_logo?: any;
  uploaded_background?: any;
}

interface ITopic {
  tags: any[];
  id: number;
  title: string;
  fancy_title: string;
  posts_count: number;
  created_at: string;
  views: number;
  reply_count: number;
  like_count: number;
  last_posted_at: string;
  visible: boolean;
  closed: boolean;
  archived: boolean;
  archetype: string;
  slug: string;
  category_id: number;
  word_count: number;
  deleted_at?: any;
  pending_posts_count: number;
  user_id: number;
  featured_link?: any;
  pinned_globally: boolean;
  pinned_at?: any;
  pinned_until?: any;
  unpinned?: any;
  pinned: boolean;
  highest_post_number: number;
  deleted_by?: any;
  has_deleted: boolean;
  bookmarked?: any;
  participant_count: number;
  created_by: IUser;
  last_poster: IUser;
}

interface IUser {
  id: number;
  username: string;
  name: string;
  avatar_template: string;
}

async function getCategoryName(categoryId: string | number) {
  const results = await rp({
    uri: process.env.DISCOURSE_URL + '/site.json',
    json: true,
  });
  if (results && results.categories) {
    const currentCategory = results.categories.find((category: ICategory) => {
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
}

function shareToFBGroup(topic: ITopic, delay = 0) {
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
        }

        resolve();
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
    promiseQueue.push(() =>
      shareToFBGroup(
        req.body.topic,
        60 * 1000 * (typeof process.env.POSTED_AFTER_MIN === 'number' ? process.env.POSTED_AFTER_MIN || 5 : 5),
      ),
    );
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

// if (process.env.NODE_ENV === 'development') {
//   promiseQueue.push(() =>
//     shareToFBGroup({
//       tags: [],
//       id: 4028,
//       title: '포럼 글을 페이스북으로 자동 공유하는 기능 테스트 중입니다.',
//       fancy_title: '포럼 글을 페이스북으로 자동 공유하는 기능 테스트 중입니다.',
//       posts_count: 1,
//       created_at: '2018-10-26T13:31:51.931Z',
//       views: 0,
//       reply_count: 0,
//       like_count: 0,
//       last_posted_at: '2018-10-26T13:31:53.201Z',
//       visible: true,
//       closed: false,
//       archived: false,
//       archetype: 'regular',
//       slug: 'topic',
//       category_id: 1,
//       word_count: 9,
//       deleted_at: null,
//       pending_posts_count: 0,
//       user_id: 147,
//       featured_link: null,
//       pinned_globally: false,
//       pinned_at: null,
//       pinned_until: null,
//       unpinned: null,
//       pinned: false,
//       highest_post_number: 1,
//       deleted_by: null,
//       has_deleted: false,
//       bookmarked: null,
//       participant_count: 1,
//       created_by: {
//         id: 147,
//         username: 'yomybaby',
//         name: '이종은(Jong Lee)',
//         avatar_template: '/user_avatar/jsdev.kr/yomybaby/{size}/85_1.png',
//       },
//       last_poster: {
//         id: 147,
//         username: 'yomybaby',
//         name: '이종은(Jong Lee)',
//         avatar_template: '/user_avatar/jsdev.kr/yomybaby/{size}/85_1.png',
//       },
//     }),
//   );
// }
