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
`duration.js` converts text into a number of seconds. The text should be 



