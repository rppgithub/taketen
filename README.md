# Take 10
An anti-social bot for Facebook Messenger

## It's live!
Take 10 is a bot that gets you back to work. Just tell it how much time you wanna procrastinate--ten minutes tops--and it'll inundate you with messages until you finally get the hell off. Try it [on Facebook Messenger](https://m.me/taketenbot "Facebook bot"). It's built as Node.js app running on Heroku. Much of the logic comes [Jerry Wang's tutorial](https://chatbotsmagazine.com/have-15-minutes-create-your-own-facebook-messenger-bot-481a7db54892#.v6z32bjr5 "bot tutorial"). 

![An example](http://i.imgur.com/LvWAxGQ.png)
*When you go back to work and then return to Facebook, it'll remember you from before and prompt you to enter another time.*

## Running locally
Equipped with a [Facebook app](https://developers.facebook.com/apps "Facebook for Developers"), make sure to set up:
- the webhook is pointed to `https://yourapp.herokuapp.com/webhook/`,
  - save the access token as a config var: `heroku config:set FB_TOKEN=YOUR_APP_TOKEN`
  - and store the webhook verify key as a config var as well: `heroku config:set VERIFY_TOKEN=YOUR_VERIFY_TOKEN`
- your app receives `message_reads` and `messages` from Facebook,
- you've added a Postgres database: `heroku addons:create heroku-postgresql:hobby-dev`,
- and you `npm install`ed all the dependencies.

## Files
### Duration
`duration.js` converts a duration written in plain text into a number of seconds. 
Example input:
```
five seconds
5 secs
four minutes and 23 secs
23m and 6sec
one thousand four hundred and twenty two secs 
```
Output:
```
5
5
263
1386
1422
```
Since it's measuring time duration, it maxes out at the unit `thousand`. For these purposes it's fine, though.

### Readable
`readable.js` converts a time in seconds into human-readable text. It simplifies however possible, using hours, minutes and seconds. 

Example input:
```
5
263
1386
382734
```
output:
```
5 seconds
4 minutes and 23 seconds
23 minutes and 6 seconds
106 hours, 18 minutes and 54 seconds
```

*Note:* the bot caps the duration at 10 minutes. For one, it's consistent with the name, but also I wanted to avoid running a JavaScipt timer over such a long time.





