var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // 画面表示するコンテンツの定義
  const menuItems = [
    {
        mainCategory: "あ行",
        subCategory: "あ",
        menuId: "aranetu",
        wordTitle: "コミュニケーション",
        description: "コミュニケーション"
    },
    // {
    //   mainCategory: "",
    //   subCategory: "",
    //   menuId: "",
    //   wordTitle: "",
    //   description: ""
    // },
]
  // console.log("menuItems: " + JSON.stringify(menuItems))
  res.render('index', { menuItems: menuItems });
});

module.exports = router;
