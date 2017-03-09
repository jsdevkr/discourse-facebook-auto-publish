Discourse Facebook post
=======================

## Notes

A specially developed daemon to post discourse articles to the facebook group.

The api endpoint does not exist for publishing facebook group. So we use the emails of people who are in the group and the email address of the group itself.


## Usage

- Install dependency

```console
$ npm insatll
```

- Start daemon

```console
$ npm start
```

- Stop daemon

```console
$ npm stop
```


## Configuration

- need to copy pm2_sample.json to pm2.json

```javascript
{
  "apps" : [
    {
      "name": "discourse-facebook-post",
      "script": "./lib/index.js",
      "exec_mode"  : "fork",
      "env": {
        "NODE_ENV": "production",
        "DISCOURSE_URL": "https://jsdev.kr",
        "GMAIL_ID": "jsdevkr@gmail.com",
        "GMAIL_PW": "_________",
        "EMAIL_FROM": "JSDEV.KR <jsdevkr@gmail.com>",
        "EMAIL_TO": "jsdev.kr@groups.facebook.com",
        "POLLING_INTERVAL_SEC": 60,
        "POSTED_AFTER_MIN": 5
      }
    }
  ]
}
```

** It is recommended that you use your facebook user's gmail.com account.

** If you use your gmail.com account, need to allowing less secure apps to access your account. [Google Answer Link](https://support.google.com/accounts/answer/6010255)


## To do

* Post to other facebook groups by category.
* Posting the same post to multiple groups.


## Caution

* Facebook can block or audit your account.


## License

MIT License