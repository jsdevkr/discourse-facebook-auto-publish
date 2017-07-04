Discourse Facebook post
=======================

## Notes

A specially developed daemon to post discourse articles to the facebook group.


## Usage

- Install dependency

```console
$ npm insatll
```

- Start daemon
	- It has a pre-process to get the Facebook token.

```console
$ npm start
```

- Stop daemon

```console
$ npm stop
```


## Configuration

- You need the Facebook app.
	- [https://developers.facebook.com/apps/](https://developers.facebook.com/apps/)

- need to copy `.env_sample` to `.env` and change it.

```javascript
DISCOURSE_URL=https://jsdev.kr
FACEBOOK_APP_ID=
FACEBOOK_SECRET=
FACEBOOK_GROUP_ID=
POLLING_INTERVAL_SEC=60
POSTED_AFTER_MIN=5
```

- `DISCOURSE_URL` should not end with `/`.
- To find `FACEBOOK_GROUP_ID`, run `/me/groups` in the graph API explorer.
	- [https://developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)


## To do

- Post to other facebook groups by category.
- Posting the same post to multiple groups.


## Caution

- Facebook can block or audit your account.


## License

MIT License