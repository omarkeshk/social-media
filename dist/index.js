"use strict";

var _dotenv = _interopRequireDefault(require("dotenv"));

var _express = _interopRequireDefault(require("express"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _expressRateLimit = _interopRequireDefault(require("express-rate-limit"));

var _expressSession = _interopRequireDefault(require("express-session"));

var _database = _interopRequireDefault(require("./database.js"));

var _user = _interopRequireDefault(require("./models/user.js"));

var _post = _interopRequireDefault(require("./models/post.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

_dotenv.default.config();

const PORT = process.env.PORT || 3001;
const app = (0, _express.default)();
const SESSION_SECRET = process.env.session_secret;
const connect = new _database.default();
app.set('trust proxy', true);
app.use((0, _expressSession.default)({
  resave: true,
  saveUninitialized: true,
  secret: SESSION_SECRET
}));
app.use(_bodyParser.default.json());
app.use(_bodyParser.default.urlencoded({
  extended: true
}));
app.use((0, _expressRateLimit.default)({
  windowMs: 15000,
  max: 200,
  message: {
    msg: "failed"
  },
  headers: true
}));

const getUserPublicData = async username => {
  let data = await _user.default.findOne({
    username: username
  });

  if (data) {
    data = _objectSpread({}, data)._doc;
    data.logged = true;
    delete data.passwd;
    delete data._id;
    delete data.ip;
    delete data.timeline;
    return data;
  }

  return false;
};

const generateId = num => {
  let res = "";

  for (let i = 0; i <= num; i++) {
    res += Math.floor(Math.random() * 10);
  }

  return res;
};

app.post("/signin", async (req, res) => {
  let {
    username,
    passwd
  } = req.body;
  username = username.toLowerCase();
  let exists = await _user.default.exists({
    username: username,
    passwd: passwd
  });
  let session = req.session;

  if (exists) {
    let user_data = await getUserPublicData(username).then(data => {
      session.first_name = data.first_name;
      session.last_name = data.last_name;
    });
    session.username = username;
    session.logged = true;
    res.json({
      msg: "success"
    });
  } else {
    res.json({
      msg: "incorrect username or password"
    });
  }
});
app.post("/register", async (req, res) => {
  let {
    username,
    passwd,
    passwd2,
    first_name,
    last_name
  } = req.body;
  username = username.toLowerCase();
  let session = req.session;

  if (passwd != passwd2) {
    res.json({
      msg: "passwords do not match"
    });
  }

  if (username.length < 3) {
    res.json({
      msg: "username must be at least 3 characters"
    });
  } else {
    if (passwd.length < 6) {
      res.json({
        msg: "password must be at least 6 characters"
      });
    } else {
      const userExit = await _user.default.exists({
        username: username
      });

      if (!userExit) {
        let user = new _user.default({
          first_name: first_name,
          last_name: last_name,
          username: username,
          passwd: passwd,
          posts: [],
          followers: [],
          following: []
        });
        user.save();
        session.logged = true;
        session.username = username;
        session.first_name = first_name;
        session.last_name = last_name;
        res.json({
          msg: "success"
        });
      } else {
        res.json({
          msg: "username taken"
        });
      }
    }
  }
});
app.post("/post", async (req, res) => {
  let session = req.session;
  let post_content = req.body.post_content;
  let post_id = generateId(15);
  let post = new _post.default({
    post_content: post_content,
    post_author: session.username,
    post_author_name: session.first_name + " " + session.last_name,
    post_comments: [],
    post_date: Date.now(),
    post_likes: [],
    post_id: post_id
  });
  post.save();
  let user = await _user.default.findOne({
    username: session.username
  });
  user.posts.push(post_id);
  user.timeline.push(post_id);
  user.save();
  await _user.default.updateMany({
    username: {
      $in: user.followers
    }
  }, {
    $push: {
      timeline: post_id
    }
  });
  res.json({
    msg: "success",
    post_id: post_id
  });
});
app.post("/logged", async (req, res) => {
  if (req.session.username) {
    let user_data;
    await getUserPublicData(req.session.username).then(data => {
      user_data = data;
    });
    res.json({
      logged: req.session.logged,
      user_data: user_data
    });
  } else {
    res.json({
      logged: false
    });
  }
});
app.post("/userexists", async (req, res) => {
  const username = req.body.username;
  const userExit = await _user.default.exists({
    username: username
  });

  if (userExit) {
    const user_data = await getUserPublicData(username);
    res.json({
      msg: true,
      user_data: user_data
    });
  } else {
    res.json({
      msg: false
    });
  }
});
app.post("/postexists", async (req, res) => {
  const post_id = req.body.post_id;
  const postExit = await _post.default.exists({
    post_id: post_id
  });

  if (postExit) {
    let post_data = await _post.default.findOne({
      post_id: post_id
    });
    post_data = _objectSpread({}, post_data)._doc;
    delete post_data._id;
    res.json({
      msg: true,
      post_data: post_data
    });
  } else {
    res.json({
      msg: false
    });
  }
});
app.get("/logout", (req, res) => {
  req.session.logged = false;
  delete req.session.username;
  delete req.session.first_name;
  delete req.session.last_name;
  res.json({
    msg: "success"
  });
});
app.get("/get_current_user_data", async (req, res) => {
  if (req.session.username) {
    const user_data = await getUserPublicData(req.session.username);
    res.json(user_data);
  } else {
    res.json({
      logged: false
    });
  }
});
app.post("/follow", async (req, res) => {
  let {
    follower,
    following
  } = req.body;
  follower = await _user.default.findOne({
    username: follower
  });
  follower.following.push(following);
  follower.save();
  following = await _user.default.findOne({
    username: following
  });

  if (!following.followers.includes(follower.username)) {
    following.followers.push(follower.username);
  }

  following.save();
  res.send({
    msg: "success",
    new_count: following.followers.length
  });
});
app.post("/unfollow", async (req, res) => {
  let {
    follower,
    following
  } = req.body;
  follower = await _user.default.findOne({
    username: follower
  });
  follower.following = follower.following.filter(f => f !== following);
  follower.save();
  following = await _user.default.findOne({
    username: following
  });
  following.followers = following.followers.filter(f => f !== follower.username);
  following.save();
  await _user.default.updateOne({
    username: follower.username
  }, {
    $pullAll: {
      timeline: following.posts
    }
  });
  res.send({
    msg: "success",
    new_count: following.followers.length
  });
});
app.post("/like", async (req, res) => {
  let {
    liker,
    post_id
  } = req.body;
  let post = await _post.default.findOne({
    post_id: post_id
  });

  if (!post.post_likes.includes(liker)) {
    post.post_likes.push(liker);
  }

  post.save();
  res.send({
    msg: "success",
    new_count: post.post_likes.length
  });
});
app.post("/unlike", async (req, res) => {
  let {
    liker,
    post_id
  } = req.body;
  let post = await _post.default.findOne({
    post_id: post_id
  });
  post.post_likes = post.post_likes.filter(l => l !== liker);
  post.save();
  res.send({
    msg: "success",
    new_count: post.post_likes.length
  });
});
app.post("/comment", async (req, res) => {
  let session = req.session;
  let {
    comment_content,
    post_id
  } = req.body;
  let comment = {
    comment_post_id: post_id,
    comment_content: comment_content,
    comment_author: session.username,
    comment_author_name: session.first_name + " " + session.last_name,
    comment_date: Date.now(),
    comment_likes: []
  };
  let post = await _post.default.findOne({
    post_id: post_id
  });
  post.post_comments.push(comment);
  post.save();
  res.send({
    msg: "success",
    comment_data: {
      comment_post_id: post_id,
      comment_content: comment_content,
      comment_author: session.username,
      comment_author_name: session.first_name + " " + session.last_name,
      comment_date: Date.now(),
      comment_likes: []
    }
  });
});
app.post("/like_comment", async (req, res) => {
  let {
    comment_index,
    post_id
  } = req.body;
  let liker = req.session.username;
  let post = await _post.default.findOne({
    post_id: post_id
  });

  if (!post.post_comments[comment_index].comment_likes.includes(liker)) {
    post.post_comments[comment_index].comment_likes.push(liker);
  }

  post.save();
  res.send({
    msg: "success",
    new_count: post.post_comments[comment_index].comment_likes.length
  });
});
app.post("/unlike_comment", async (req, res) => {
  let {
    comment_index,
    post_id
  } = req.body;
  let liker = req.session.username;
  let post = await _post.default.findOne({
    post_id: post_id
  });
  post.post_comments[comment_index].comment_likes = post.post_comments[comment_index].comment_likes.filter(l => l !== liker);
  post.save();
  res.send({
    msg: "success",
    new_count: post.post_comments[comment_index].comment_likes.length
  });
});
app.post("/delete_post", async (req, res) => {
  let {
    post_id
  } = req.body;
  let post = await _post.default.findOne({
    post_id: post_id
  });
  let user = await _user.default.findOne({
    username: post.post_author
  });
  user.posts = user.posts.filter(p => p !== post_id);
  user.timeline = user.timeline.filter(p => p !== post_id);
  user.save();
  await _post.default.deleteOne({
    post_id: post_id
  });
  await _user.default.updateMany({
    username: {
      $in: user.followers
    }
  }, {
    $pullAll: {
      timeline: [post_id]
    }
  });
  res.send({
    msg: "success"
  });
});
app.post("/delete_comment", async (req, res) => {
  let {
    post_id,
    comment_index
  } = req.body;
  let post = await _post.default.findOne({
    post_id: post_id
  });
  post.post_comments = post.post_comments.filter((l, i) => i !== comment_index);
  post.save();
  res.send({
    msg: "success"
  });
});
app.post("/get_timeline", async (req, res) => {
  if (req.session.logged) {
    let {
      username
    } = req.body;
    let user = await _user.default.findOne({
      username: username
    });
    res.json({
      posts: user.timeline
    });
  }
});
app.post("/search", async (req, res) => {
  let query = req.body.query;

  if (query === "" || query === " ") {
    res.json({
      result: "No Results Found"
    });
  } else {
    let findQuery = `{ "$where": "function() { return (this.username.includes('${query.toLowerCase()}') || this.first_name.includes('${query.toLowerCase()}') || this.last_name.includes('${query.toLowerCase()}'))}" } `;
    let result = await _user.default.find(JSON.parse(findQuery));

    if (!result.length) {
      res.json({
        result: "No Results Found"
      });
    } else {
      res.json({
        result: result.map(u => u.username)
      });
    }
  }
});
app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});