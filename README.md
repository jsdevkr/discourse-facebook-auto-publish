# discourse-facebook-auto-publish

## Notes

A specially developed webhook for publish discourse articles to the facebook group.

## Usage

- Install Dependency

```console
$ npm insatll
```

- Start Server - You need to configure, below the `Configuration` section.

```console
$ npm start
```

- Stop Server

```console
$ npm stop
```

- Add Webhook on discource for `Topic event`

```console
http://__HOST__:__PORT__/discoursehook
or
http://__HOST__:__PORT__/discoursehook_delay
```

## Configuration

- need to copy `.env_sample` to `.env` and change it.

```javascript
SITE_0_PORT=8080
SITE_0_POSTED_AFTER_MIN=5
SITE_0_DISCOURSE_URL=https://jsdev.kr
SITE_0_FACEBOOK_GROUP_ID=jsdevkr
SITE_0_FACEBOOK_USER=
SITE_0_FACEBOOK_PASS=
```

The `FACEBOOK_GROUP_ID` is `facebook.com/groups/__HERE__/`

- You can adding multi config using `SITE_${NUMBER}_`.

## To do

- Post to other facebook groups by category.
- Posting the same post to multiple groups.

## Caution

- You cannot running this server in public cloud.
- It should be running in the same network that you logged in to Facebook.
- Otherwise, Facebook can block or audit your account.

## License

MIT License
