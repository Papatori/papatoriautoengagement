var express = require('express');
var router = express.Router();

const Twitter = require('twitter')

const client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
})

const WHITE_LIST = [
  'コミュニケーション',
  '感謝',
  'ありがとう',
  'コミュ障'
]

const BLACK_LIST = [
  "死ね","死ぬ","殺す","殺し","処分"
]

const RT_WHITE_LIST = []
const RT_BLACK_LIST = ['RT']

/* GET home page. */
router.get('/', async function(req, res, next) {
  const params = {
    count: 200,
    exclude_replies: true,
    exclude: "retweets" // retweetを除外
  }
  await client.get('statuses/home_timeline', params, function(error, tweets, response) {
    console.log(`${new Date()}> ${tweets.length} tweets founded!`)
    if (!error) {
      // console.log(tweets)
      for(const tweet of tweets){
        if(!WHITE_LIST.some(wl => tweet.text.includes(wl))) continue
        if(BLACK_LIST.some(bl => tweet.text.includes(bl))) continue
        // ホワイトリストの単語が１つ以上含まれるかつ、ブラックリストの単語が１つも含まれない場合、favする
        console.log(`${new Date()}> target tweet text: ${tweet.text}`)
        client.post(`favorites/create.json?id=${tweet.id}`, {id: tweet.id_str}, function(error, tw, response) {
          if(error) {
            console.log(`${new Date()}> fav error (id, ${tweet.id}): ${JSON.stringify(error)}`)
          }else{
            console.log(`${new Date()}> tweet(id: ${tw.id}) faved!`)
          }
        }) //非同期実行

        // if(RT_WHITE_LIST.some(wl => tweet.text.includes(wl))
        // && !RT_BLACK_LIST.some(bl => tweet.text.includes(bl))){
        if(!RT_BLACK_LIST.some(bl => tweet.text.includes(bl))){
          client.post(`statuses/retweet/${tweet.id_str}.json`, {id: tweet.id_str}, function(error, tw, response) {
            if(error){
              console.log(`${new Date()}> RT error (id, ${tweet.id}): ${JSON.stringify(error)}`)
            }else{
              console.log(`${new Date()}> tweet(id: ${tw.id}) RTed!`)
            }
          }) //非同期実行
        }
      }
    }
  })
  
  // console.log("menuItems: " + JSON.stringify(menuItems))
  res.render('job/index', {message: "SUCCESS!!"});
});


router.get('/glue', async function(req, res, next) {
  const params = {
    q: "from:AGORA0930 -filter:replies",
    count: 3,
    exclude: "retweets" // retweetを除外
  }
  await client.get('search/tweets', params, function(error, datas, response) {
    const tweets = datas.statuses
    console.log(`${new Date()}> ${tweets.length} tweets founded!`)
    if (!error) {
      // console.log(tweets)
      for(const tweet of tweets){
        if(BLACK_LIST.some(bl => tweet.text.includes(bl))) continue
        // ブラックリストの単語が１つも含まれない場合、favとRTする
        console.log(`${new Date()}> target tweet text: ${tweet.text}`)
        client.post(`favorites/create.json?id=${tweet.id}`, {id: tweet.id_str}, function(error, tw, response) {
          if(error) {
            console.log(`${new Date()}> fav error (id, ${tweet.id}): ${JSON.stringify(error)}`)
          }else{
            console.log(`${new Date()}> tweet(id: ${tw.id}) faved!`)
          }
        }) //非同期実行
        client.post(`statuses/retweet/${tweet.id_str}.json`, {id: tweet.id_str}, function(error, tw, response) {
          if(error){
            console.log(`${new Date()}> RT error (id, ${tweet.id}): ${JSON.stringify(error)}`)
          }else{
            console.log(`${new Date()}> tweet(id: ${tw.id}) RTed!`)
          }
        })
      }
    }
  })
  
  // console.log("menuItems: " + JSON.stringify(menuItems))
  res.render('job/index', {message: "SUCCESS!!"});
});
  

module.exports = router;
