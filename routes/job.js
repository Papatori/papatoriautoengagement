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
    count: 20,
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
  const userIds = [
    "AGORA0930",
    "adsapo2804",
    "maiko_mode",
    "siryokukaizen",
    "glocaleducate",
    "nekomaru_msw",
    "cocorotarosan",
    "_MR_channel",
    "EGAO_no_musuko",
    "kiki00079",
    "osunnotsubuyaki"
  ]

  for(const userId of userIds){
    const params = {
      q: `from:${userId} -filter:replies`,
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
  }

  // console.log("menuItems: " + JSON.stringify(menuItems))
  res.render('job/index', {message: "SUCCESS!!"});
});
  

router.get('/autodmonfollow', async function(req, res, next) {
  const name = decodeURIComponent(req.query.FullName) // IFTTTから連携される新規フォロワーのname
  const text = "フォローありがとうございます！\n\n改めまして、育児・IT・人間関係についてつぶやいているパパトリです。\n\n最近では、人間関係・仕事のお悩み解決や引きこもり問題などに興味があり、\nボランティアで困っている方たちの支援活動もしていたりします。\n\n楽しくTwitterできたら嬉しいです。\nもし良かったら、気軽に絡んでください♪\n\n"

  await client.get(`followers/list.json?cursor=-1&skip_status=true`, {cursor: -1, skip_status:true}, async function(error, data, response){
    const followers = data.users
    if(error){
      console.log(`${new Date()}> users lookup error (name, ${name}): ${JSON.stringify(error)}`)
      res.render('job/index', {message: JSON.stringify(error)});
    }else{
      console.log(`${new Date()}> followers: ${JSON.stringify(followers)}`);
    }

    for(const follower of followers){
      if (name !== follower.name) continue // フォロワーの名前がIFTTTから連携されるユーザーのnameと異なったら次レコード

      console.log(`${new Date()}> (name, ${name}) founded: ${JSON.stringify(follower)}`);
    
      const data = {
        "event": {
          "type": "message_create",
          "message_create": {
            "target": {
              "recipient_id": follower.id_str
            },
            "message_data": {
              "text": text
            }
          }
        }
      }
      console.log(`${new Date()}> DM Data: ${JSON.stringify(data, null, "  ")}`)

      await client.post('direct_messages/events/new', data, function(error, result, response) {
        if (error) {
          console.log(`${new Date()}> DM error (name, ${name}): ${JSON.stringify(error)}`)
        }else{
          console.log(`${new Date()}> direct message sended, data: ${JSON.stringify(data)}!`);
        }
      });

      break // 一致するフォロワーが見つかってDMを送ったらループ終了
    }
  })

  res.render('job/index', {message: "name: " + name + "\n\ntext: " + text});
});

router.get('/autotweet', async function(req, res, next) {
  const TEXTS = [
    "どっちに転んでも良いように仕組んでおくことがリスクヘッジ。\n\n選択肢ごとの最悪のシナリオを比べて最もマシなプランを選ぶのがミニマックス戦略。\n\n常に気を付けておくと、人生の小から中くらいの困難はほぼ回避できる。",
    "訪問ありがとうございます！\n\n今年、息子が生まれました。息子が大きくなったら教えたいことを今のうちからブログに書いてます。https://blog.papatori.com   \n\n・子育て世代のパパママ\n・中高生、大学生\n・社会に出るのが不安な方\n・人間関係に苦手意識がある方\n\n１つでも当てはまったらフォローしてね♪",
    "ビジネススキルは家事育児にも応用できる。\n\n効率化や役割分担、品質管理など多岐にわたる。\n\n父親が家事も育児も参加しないのは、家庭内リソースの有効活用の観点で大いに損していると言わざるをえない。",
    "絡んだことある方もそうでない方も\n\nすべてのフォロワーさんに感謝です\n\n僕がツイッターを通して発言した内容は\n\nすべてのフォロワーさんと\n\nその先にいる何万、何十万の人々に\n\n届くポテンシャルを秘めている\n\nだから\n\n一つ一つの発信に魂込めて\n\n一生懸命取り組んでます",
    "人と話すのが怖いと思うのは\n\n気を悪くさせたらどうしよう\n\nと思うから\n\nでも\n\n本当に気を悪くさせてしまったなら\n\nやることは１つ\n\n誠心誠意、謝るだけ\n\n大事なのは\n\nいついかなる状況でも\n\n自分は謝ることができる\n\nという心構え\n\nこの心構えさえあれば\n\n人と話すのは怖くない",
    "リアルの生活とTwitter活動を両立するため、Twitter APIを使ってRTといいねを一部自動化することにしました。\n\n大切なフォロワーさんたちとの交流はきっちりしたいけど、子育てや家事も大事なので、やむを得ず。。。\n\nリプやDMは全部ありがたく見てます！\n\n自動化ノウハウ気になる方にはお教えします。",
    "調べてみると\n\nコミュニケーションが苦手\n\nという日本人は\n\n半数以上もいるのだそう\n\n調査によってバラツキはあれど\n\n60 - 70 % もの人が\n\nコミュニケーションに苦手意識\n\nを持っているという結果だ\n\nかくいう僕も昔は苦手でした\n\n克服するために考えたこと\n\nブログにしてますhttps://blog.papatori.com ",
    "日本で引きこもりと\n\n呼ばれている人たちの数\n\n知ってますか？\n\n2015年の内閣府の調査によると\n\n約54万人だそうです\n\nでもこれは\n\n15歳から39歳だけを\n\n調査対象にしています\n\n40歳以上は含まれていません\n\n本当の人数は\n\n100万とも200万とも言われています\n\n僕はこの\n\n引きこもり問題を何とかしたい",
    "新社会人の必修科目シリーズ\n\n「悪い報告をする」\n\n例えば、あの件どうなった？に対して、5時間取り組んだのに一切進められてません！のようなバッドな報告をできるようになりましょう。\n\n下手に取り繕っても傷を広げるだけ。\n\nむしろ、問題があるのが明確なので、先輩や上司の協力を得て解決しやすい",
    "ニュースを見てもネットを見ても、知る価値があって信用できる情報を得るのが難しいと感じる今日この頃。\n\n情報リテラシーが高ければ高いほど、良質な情報が効率的に得られるので、子供に教えるべきものとしての重要度はかなり高い。\n\nでも、意外とこういうこと教えるサービスないのよね。",
    "自分の中と外を正しく分けることは重要です。\n\n自分の中のことは究極的には自分でしか解決できません。なので、いろんな情報と自分の能力をフル動員して取り組まなくてはならないです。\n\n一方、自分の外のことは自分以外の人にも解決できるので、どこまで注力するかは状況に応じて判断すれば良いです。",
    "新社会人の必修科目シリーズ\n\n「難しすぎる仕事は、今できようと思わない」\n\n最初やったときはできなかったことも、1年くらい間をあけてから再度やってみると、何も努力してないのに勝手にできるようになってたりします。\n\n今できないことを今やろうとするのはやめて、そのまま1年待つ事を覚えよう。",
    "新社会人の必修科目シリーズ\n\n「評価を得るために、できることだけやって、できないことはやらない」\n\nできることだけやるようにすると、成果が出るので評価が得られ、評価が得られると教育担当の機嫌が良くなったり周囲の助けを得やすくなってさらにできることが増えていきます。",
    "お金があるのに不幸な人\n\nお金がなくても幸せな人\n\nこの違いは行動パターンの癖で決まる\n\n・持ってないものを欲しがる\n・人より少ないと気になる\n\nそうではなく\n\n・持っているものを愛でる\n・足りていることを喜ぶ\n\nお金が足りないとか\n\nもっと裕福になりたいと思うより\n\n今、手元にある幸せを大事に。",
    "引きこもり問題に貢献するため\n\n僕はボランティアで\n\nソーシャルワーカーをしています\n\n当初意外に思ったのは\n\n相談件数の半数が\n\n引きこもっている本人によるもの\n\nということ\n\nもちろん親族からの\n\n相談もあります\n\nでもやはり\n\n本人が自分の意思で\n\n何とかしようとしている\n\nだから僕は役に立ちたい",
    "最近、息子がミルクも飲まずに寝まくってるので、すごく助かる反面ちょっと心配。\n\n体調悪いわけでも体重減ってるわけでもないから大丈夫なんだけど、やっぱりちょっと心配。\n\n#イクメン #育児",
    "自分の気持ちや考えを人に伝えたいとき、言葉選びが大事。\n\n僕は、相手にうまく伝わらないとき、言葉の意味を見直したり、その言葉を受け取ったときどんな気持ちになるか想像します。\n\nこういう練習を繰り返すと、徐々にうまく伝える力がつきます。",
    "育児あるある\n\n毎日昼夜逆転する。\n\n#イクメン #育児",
    "道で正面から人が歩いてくるとき、こちらがゆっくり歩くと向こうから避けてくれる法則があるらしい。\n\n外気浴やお散歩でベビーカー押してるとき、この法則めちゃ役立つ。\n\n#イクメン #育児",
    "新社会人の必修科目シリーズ\n\n「我慢しない」\n\nつい、自分は何も知らないから、少し我慢して様子を見よう、と思いがちだけど、我慢は良くない。\n\n会社の教育担当なんて毎年変わるし、新人の扱いに慣れてないこともザラ。そんな状況で変に我慢して誤ったフィードバックを与えたら何も変わらない。",
    "新しい知識を得る力が知識レベルに依存するのが現代社会の怖いところであり良いところでもあると思うのは、努力が報われる仕組みになってるからなんだろうなー。",
    "どんな感想も否認されるべきでない。\n\nその人がそう思ったことは事実だから。\n\n一方で、事実を検証したり、事実を基に議論するのも拒絶されるべきではない。\n\n事実に対するどんな言及も、その事実に関連する人への言及ではないから。\n\nこれらに同意する人同士で行われる会話は、安全で楽しく知的だ。",
    "心の余裕を最大化する振る舞いを心掛けると、仕事も家庭もうまくいく。\n\nお金や社会的地位も大事だけど、心の余裕を失うほどに求めなくてもいい。",
    "子どもに教えたくない言葉シリーズ\n\n「考えたら分かるでしょ」\n\n何がよくないって、お前は頭を使うことができないバカだ、のニュアンスを含んでいること。自分の子どもに言うことではないよね。\n\n考えたから分かったね、なら使ってよい。\n\n#イクメン #育児 #教育",
    "子どもに教えたくない言葉シリーズ\n\n「小さい頃に勉強しなかったから」\n\n冷静に考えて、子供より大人の方がはるかに理解力が高い。だから、子供の頃には理解できなかったことも、大人になってからなら身に付けられる。\n\nRPGで、低レベルなのにクリアできないと嘆いてたらおかしいでしょ？\n\n#イクメン",
    "新社会人の必修科目シリーズ\n\n「指示通りにやる」\n\n指示通りとは、指示の内容が10あったとしたら、1から10までやることです。\n1から9までやるのでは、指示されたこともできないのか、と叱られます。\n逆に11や12やってしまうと、余計なことするな、と叱られます。\n\n要は、多すぎても少なすぎてもダメ。",
    "我が子に見せたい親の背中シリーズ\n\n「想定外に出会ったらまず観察する」\n\n科学的な思考の出発点は観察することです。よく観察して、なぜ想定外なことが起こったのか分析するクセを身に付けてほしい。\n\n#イクメン #育児",
    "ブラック企業は、企業が作ってるのではなく、従業員側が知らず知らずのうちに作っているんだ。",
    "すべての人が、お互いに、あらゆる誤解を解く能力を持っていたら、世界はもっと平和になると思う。\n\n誤解に気付くことができ、誤解の原因を正しく推測でき、正しく伝わる表現で訂正する力が、もっと必要とされていると感じるので、発信していこうと思う。",
    "いわゆる「主語の大きい」表現が好きになれない理由は、その表現を言葉通りに解釈したことによる誤解が世の中に蔓延するのが嫌だからだと思う。\n\n誤解は争いの種であり、僕は争いを好まないからそう思うんだ、きっと。",
    "RTの素晴らしいところは、 わざわざ自分で文字打たなくてもワンクリックで自分の考えを発信できる点にあると思う。\n\nそれに加えて、元ツイートした人にも喜ばれるので、一石二鳥で本当に素晴らしいシステムだよね。",
    "昨日の息子のミルク量がいつもより少なかったので心配だったけど、今日は食欲旺盛なので安心した。\n\n#イクメン #育児",
    "「全ての人間は互いに異なってる」\n\nこのことに異を唱える人はいないはず\n\n一方で\n\nこのことと\n\n「気持ちが通じ合う」\n\nとか\n\n「共感」\n\nといった概念との矛盾に\n\n全員が気付いているとは\n\n言えないとも思う\n\n当たり前とか常識\n\n思い込みに支配されて\n\nいるからなんだろう。",
    "自分の気分を他人の行動に依存させないように気を付けたい。",
    "子供を抱いて寝かしつけてる間、特に、目をつふってるけど離すと起きるモードのとき、RTしまくる活動をすることにしています。\n\n#イクメン #育児",
    "毎日どんどん可愛くなっていく息子。幸せだわ。\n\n#イクメン #育児",
    "子供が夜6時間も寝てくれた！\nこれだけまとめて寝てくれるとこちらの体力的にもだいぶ助かります。\n\n#イクメン #育児",
    "「負ける」と考えると自分が下\n「勝たせてあげる」と考えると自分が上\n\n上とか下とかが問題じゃないんだけど、子供に教えるときはまずこう言おうと思います。\n\n#イクメン #育児",
    "勉強を始める方法\n\n動き出しが一番大変なので、ハードルを思いっきり下げて、「机に向かって1分座る」ことを目標にしてます。\n\n1分経ったら座っただけで勉強せずに終わってもOK。\n\nまずは勉強するための環境に身を置くことを重視します。\n\n実際1分何もしないのは退屈すぎて、自然と勉強始めちゃう。",
    "自分を必要とする人は\n\n誰にでも絶対にいます\n\nそれもすごくたくさん\n\n自分と関わった人は\n\nみんな\n\n自分を通して\n\n何かを学んだはず\n\nそして\n\n彼ら彼女らが\n\n自分を通して学んだ後\n\n出会った全ての人は\n\n間接的に\n\n自分から影響を受けている\n\nこの間接的な学びの連鎖は\n\n未来永劫ずっと続いてく",
    "肉や魚と一緒に大根を煮込むときの調味料配合メモ\n\n醤油 　大4\n砂糖 　大4\nみりん 大3\n酒　　 大3\n\n#イクメン #料理",
    "アンガーコントロール\n\nつまり\n\n怒りの感情を制御\n\nこれ重要\n\n怒ってばっかの人が\n\n好かれることはないですから\n\n怒りを感じた時\n\n心の中で\n\n「6秒」数える\n\n怒りが消えるそうです",
    "いつもの味付けをちょっとアレンジ\nバルサミコソース風調味料配合メモ\n\n酢 大1\nウスターソース 大1\n砂糖 小1\nにんにく(チューブ) 小1\n醤油 小1\nみりん 小1\n\n#イクメン #料理",
    "肉や野菜の炒め物の味付けか一発で決まる調味料配合メモ\n\n醤油 大1\nみりん 大1\nオイスターソース 大1/2\n\n基本の味付けにオイスターソースで遊び心をチョイ足し\n\n#イクメン #料理",
    "現代ではいろんな能力がある中で語彙力がかなり重要。\n\n語彙が多ければ多いほど、検索によって多くの知識を得られるから。",
    "質より量で効率化を極めた方が、早く経験値が貯まるから、結果として質も向上する。",
    "死ぬのが嫌な理由\n\n文明がどこまで発展するか知りたい",
    "子供は毎日成長している。\n\n大人は、1時間、1分、1秒という短時間に起こる子供の成長を認識できないので、いつの間にか成長していて驚く。\n\n大人は子供のリアルタイムな成長を認識できないから、普段の生活で、子供に即座に成長することを期待して接してはいけない。\n\n叱る時とかは特に。\n\n#イクメン",
    "こうでなくちゃならないことなんて、きっと、世界には何もない。\nでも、人にはそれぞれこだわりがあるから、こうでなくちゃって思っちゃうんだろうな。",
    "説得力って、いろんな能力がある中で、結構重要なパラメータだと思う。\n\n単に、言葉による説得ができるという力も重要だけど、\n子育ての場面では、子供にも分かるように実演するとか、体験させるとか、あらゆる手段を使って説得力を高めることが大事。",
    "相手が子供でも大人でも、知らないことを咎めるのは良くない。\n\nなぜなら、知らないことに自力で気付くことは不可能だから。",
    "子育てあるある\n\n抱っこのしすぎで肘が痛い。何もしていなくても、寝ているだけでも痛い。辛い。\n\n#イクメン #育児",
    "すべてのものごとは多面的なので、良い見方をすることもできるし、悪い見方をすることもできる。\n\n良い見方だけするように過ごしていると、自分で自分のことが好きだと思えるようになる。自分の境遇も人生も何もかも良い事だとと捉えられるようになるから、いつも幸せ。",
    "日常生活を時給換算すると心が貧しくなります。\n\n身近な人たちに何かしてあげる度に、「今のは時給換算すると何円」という考えが頭をよぎるからです。\n\n酷くなると、何かする前に、そう考えてしまいます。\n\nお金の計算をするのは、ビジネスの場で生きるか死ぬかやるときだけでたくさん。\n\n#イクメン",
    "育児あるある\n\nお風呂で自分の体の上で子どもの体を洗ってるとき、オナラされるとメチャクチャ焦る。\n\n#イクメン #育児",
    "1時間で4品以上作る料理メソッド\n\n基本的な考え方は、「4つの調理法でそれぞれ1品作る」です。\n\n我が家の調理法は、下記の5つがあります。\n\nコンロ\nグリル\n電子レンジ\nホットクック\n和えるだけ\n\nこの中から、その日の食材やメニューに応じて4つ選び、それぞれ1品ずつ作っていきます。\n\n#イクメン #料理",
    "心理的安全性を確保するとは、つまり、人間関係が壊れないことを約束することです。\n\n怒らないとかケンカしないということではありません。\n\nむしろ、怒ったりケンカしていいということです。\n\n怒ったりケンカしても、絶対に元通り仲良くなれるという約束が心理的安全性を生みます。\n\n#イクメン #育児",
    "子育てにも応用できるビジネスマインド\n\n良いチーム(家族)には心理的安全性が重要。\n\n間違ったり、知らなかったり、忘れたりしても誰からも嫌われたり疎まれたりしない環境。\n\nこういうチームでは、メンバーが自発的にチームに貢献したくなります。\n\n#イクメン #育児",
    "心理的安全性が高いと、夫婦の間で家事や育児の面でも協力しやすくなりますし、仕事の悩みやストレスも吐き出せます。\n\n子供にとっては、自己肯定感や好奇心を伸ばし、自立した人間へ成長しやすい環境になります。\n\n#イクメン #育児",
    "育児あるある\n\n子どもから目が離せないから、他にやりようがなくてネットスーパーデビューしたものの、あまりの便利さにずっと利用し続けてしまう。\n\n#イクメン #育児 #ひきこもり",
    "我が家では、ミルクを冷ますとき大鍋に3Lほど冷水を張ってそのなかに哺乳瓶入れてます。\n\n冷ます時間の目安はミルク20mlにつき1分くらい。100mlなら5分くらい。\n\n#イクメン #育児",
    "子育てを夫婦でするのはとても楽しい！\n\n#イクメン #育児",
    "子育て費用を数えてみる\n\n日々消費するものは、粉ミルク、オムツ、おしりふき、哺乳瓶消毒\n\n水道光熱費などは考慮しない。\n\n服や哺乳瓶なども日々消費する訳ではないので考慮しない。\n\nそうすると、乳児の子育て費用は1週間あたり約3,610円。\n\n30日で約15,000円\n\n#イクメン #育児 #費用",
    "育児あるある\n\n妻から「授乳中に本気でみぞおちグーパンされるの痛いよねー」と同意を求められて困惑する。\n\n#イクメン #育児",
    "育児あるある\n\nミルク飲んで寝てくれた！と思ったら、5分で目覚める。\n\n#イクメン #育児",
    "「良い子」って、「大人の言うことを聞く子ども」ではなく、「自分を良い子だと思っている子ども」だと思う。\n\n僕の目指す教育は、そういう子供を大人が温かく見守ってあげること。大人だって完璧じゃないし、子どもに強く育ってほしいから。",
    "育児あるある\n\n子どもが起きたので、睡眠不足の中、朝のミルク作って飲みごろに冷ましてたら、子どもが二度寝。  ",
    "子どもがおっぱい飲みながら寝落ちしてるの見ると、「人生の幸せが凝縮してるなー」と思う。\n\n#イクメン #育児",
    "子どもが、自らの爪で自分の顔引っ掻いて血が出てることがよくあるんだけど、寝て起きる度に治っていっていて生命力の強さを感じる\n\n#イクメン #育児",
    // "",
  ]

  const text = TEXTS[Math.floor(Math.random() * TEXTS.length)] // TEXTSの中からランダムに1件取得

  await client.post('statuses/update', {status: text}, function(error, tweet, response) {
    if (error) {
      console.log(`${new Date()}> RT error (text, ${text}): ${JSON.stringify(error)}`)
    }else{
      console.log(`${new Date()}> (text, ${text}) tweeted!`);
    }
  });

  // console.log("menuItems: " + JSON.stringify(menuItems))
  res.render('job/index', {message: "SUCCESS!!"});
});

module.exports = router;
