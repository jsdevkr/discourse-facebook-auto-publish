import * as puppeteer from 'puppeteer';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as rp from 'request-promise';

import { puppeteerInit, gotoGroupAndPost } from './fbPuppeteer';
import { sleep, promiseQueue } from './helper';

export interface IServerOptions {
  port?: string;
  postedAfterMin?: string;
  discourseUrl?: string;
  facebookGroupId?: string;
  fbUserId?: string;
  fbUserPassword?: string;
}

export default class Server {
  app: express.Express;
  port: number;
  discourseUrl: string;
  postedAfterMin: number;
  facebookGroupId: string;
  fbUserId: string;
  fbUserPassword: string;
  fbPage: puppeteer.Page | null;
  fbBrowser: puppeteer.Browser | null;

  constructor(options: IServerOptions) {
    if (!options.discourseUrl || !options.facebookGroupId || !options.fbUserId || !options.fbUserPassword) {
      throw 'invalid options';
    }

    this.port = Number(options.port || 8080);
    this.discourseUrl = options.discourseUrl;
    this.postedAfterMin = Number(options.postedAfterMin || 5);
    this.facebookGroupId = options.facebookGroupId;
    this.fbUserId = options.fbUserId;
    this.fbUserPassword = options.fbUserPassword;

    this.createApp();
  }

  getCategoryName = async (categoryId: string | number) => {
    const results = await rp({
      uri: (this.discourseUrl + '/site.json').replace('//', '/'),
      json: true,
    });
    if (results && results.categories) {
      const currentCategory = results.categories.find((category: ICategory) => {
        return category.id === categoryId;
      });
      let displayNames = currentCategory.name;
      if (currentCategory.parent_category_id) {
        const parentName = await this.getCategoryName(currentCategory.parent_category_id);
        displayNames = `${parentName}/${displayNames}`;
      }
      return displayNames;
    } else {
      throw new Error('categories.json scheme error');
    }
  };

  shareToFBGroup = async (topic: ITopic, delay = 0) => {
    let success = false;
    let tryCount = 1;
    const errors: any = [];

    while (!success) {
      try {
        if (topic && topic.id && topic.archetype === 'regular') {
          // regular가 개인 message 생성도 topic이어서 일반 topic인지 구분

          await sleep(delay);
          const updatedTopic = await rp({
            uri: this.discourseUrl + '/t/' + topic.id + '.json',
            json: true,
          });

          if (!updatedTopic) {
            return;
          }

          // Is it existed or not?
          const displayCategoryName = await this.getCategoryName(updatedTopic.category_id)
            .catch(() => {
              return ''; //if error, ignore do not display category name
            })
            .then(name => (name ? `[${name}] ` : ''));

          const message = `[새글알림] 제목: ${displayCategoryName}${updatedTopic.title}\n글쓴이: ${topic.created_by.username} (댓글은 공유된 사이트에 남겨주세요) ${this.discourseUrl}/t/${topic.id}`;
          console.log(`[${this.discourseUrl}]`, message);

          if (!this.fbPage) {
            const { page, browser } = await puppeteerInit(this.fbUserId, this.fbUserPassword);
            this.fbPage = page;
            this.fbBrowser = browser;
          }

          await gotoGroupAndPost(this.fbPage, this.facebookGroupId, message);
          console.log(`[${this.discourseUrl}]`, 'fb posting successful', new Date());
        } else {
          console.log(`[${this.discourseUrl}]`, 'skip: not regular post', new Date());
        }

        success = true;
      } catch (error) {
        console.error(`shareToFBGroup / tryCount: ${tryCount} / error`, error);
        errors.push(error);
        // retry
        if (tryCount < 3) {
          if (this.fbPage) {
            this.fbPage.close();
            this.fbPage = null;
          }
          if (this.fbBrowser) {
            this.fbBrowser.close();
            this.fbBrowser = null;
          }
          tryCount++;
        } else {
          throw errors;
        }
      }
    }
  };

  createApp = () => {
    this.app = express();

    this.app.use(bodyParser.json());
    this.app.use(express.static('public'));

    this.app.post('/discoursehook', (req, res) => {
      const eventType = req.get('X-Discourse-Event');
      console.log(`[${this.discourseUrl}]`, eventType);
      if (eventType === 'topic_created') {
        promiseQueue.push(() => this.shareToFBGroup(req.body.topic, process.env.NODE_ENV === 'development' ? 0 : 30 * 1000));
      }
      res.json({
        id: req.body.topic.id,
        title: req.body.topic.title,
        eventType,
      });
    });

    this.app.post('/discoursehook_delay', (req, res) => {
      const eventType = req.get('X-Discourse-Event');
      console.log(`[${this.discourseUrl}]`, eventType);
      if (eventType === 'topic_created') {
        promiseQueue.push(() => this.shareToFBGroup(req.body.topic, 60 * 1000 * this.postedAfterMin));
      }
      res.json({
        id: req.body.topic.id,
        title: req.body.topic.title,
        eventType,
      });
    });

    this.app.get('/', (req, res) => {
      console.log(`[${this.discourseUrl}]`, 'Hello World!');
      res.json({
        success: true,
      });
    });

    this.app.listen(this.port, () => {
      console.log(`[${this.discourseUrl}]`, `Server listening on port ${this.port}!`);
    });
  };
}

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
