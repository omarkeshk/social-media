import dotenv from "dotenv"
dotenv.config()
import express from "express";
import bodyParser from "body-parser"
import rateLimit from 'express-rate-limit'
import session from "express-session"
import Database from "./database.js";
import User from "./models/user.js"
import Post from "./models/post.js"
const PORT = process.env.PORT || 3001;
const app = express();
const SESSION_SECRET = process.env.session_secret
const connect = new Database()

app.set('trust proxy', true)
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: SESSION_SECRET
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  rateLimit({
    windowMs: 15000,
    max: 200,
    message: {msg: "failed"},
    headers: true,
  })
)



const getUserPublicData = async (username)=>{
  let data = await User.findOne({username: username})
  if(data){
    data = ({...data}._doc); 
    data.logged = true
    delete data.passwd
    delete data._id
    delete data.ip
    delete data.timeline
    return data
  }
  return false
}


const generateId=(num)=>{
  let res = ""
  for(let i=0;i<=num;i++){
    res += Math.floor(Math.random() * 10)
  }
  return res
}
app.post("/signin", async (req, res)=>{
  let { username, passwd} = req.body
  username = username.toLowerCase()
  let exists = await User.exists({username: username, passwd: passwd})
  let session = req.session
  if(exists){
    let user_data = await getUserPublicData(username)
    .then((data)=>{
      session.first_name = data.first_name
      session.last_name = data.last_name
    }) 
    session.username = username
    session.logged = true
    res.json({msg: "success"})
  }else{
    res.json({msg: "incorrect username or password"})
  }
})

app.post("/register", async (req, res)=>{
  let {username, passwd, passwd2, first_name, last_name } = req.body
  username = username.toLowerCase()
  let session = req.session
  if(passwd != passwd2){
    res.json({msg: "passwords do not match"})
  }
  if(username.length < 3){
    res.json({msg: "username must be at least 3 characters"})
  }else{
    if(passwd.length < 6){
      res.json({msg: "password must be at least 6 characters"})
    }else{
      const userExit = await User.exists({username: username});
      if(!userExit){
          let user = new User({
            first_name: first_name,
            last_name: last_name,
            username: username,
            passwd: passwd,
            posts: [],
            followers: [],
            following: []
          })
          user.save()
          session.logged = true
          session.username = username
          session.first_name = first_name
          session.last_name = last_name
          res.json({msg:"success"})
        }else{
        res.json({msg: "username taken"})
      }
    }
  }

})

app.post("/post", async (req, res)=>{
  let session = req.session
  let post_content = req.body.post_content
  let post_id = generateId(15)
  let post = new Post({
    post_content: post_content,
    post_author: session.username,
    post_author_name: session.first_name + " " + session.last_name,
    post_comments: [],
    post_date: Date.now(),
    post_likes: [],
    post_id: post_id

  })
  post.save()
  let user = await User.findOne({username: session.username})
  user.posts.push(post_id)
  user.timeline.push(post_id)
  user.save()
  await User.updateMany({username: {$in: user.followers}}, {$push:{timeline: post_id}});
  res.json({msg: "success", post_id: post_id})
})

app.post("/logged", async(req, res)=>{
  if(req.session.username){
    let user_data
    await getUserPublicData(req.session.username)
    .then((data)=>{
      user_data = data
    })
    res.json({logged: req.session.logged, user_data: user_data})  
  }else{
    res.json({logged: false})
  }
  })

app.post("/userexists", async(req,res)=>{
  const username = req.body.username
  const userExit = await User.exists({username: username});
  if(userExit){
    const user_data = await getUserPublicData(username)
    res.json({msg: true, user_data: user_data})
  }else{
    res.json({msg: false})
  }
})

app.post("/postexists", async(req,res)=>{
  const post_id = req.body.post_id
  const postExit = await Post.exists({post_id: post_id});
  if(postExit){
    let post_data = await Post.findOne({post_id: post_id})
    post_data = ({...post_data}._doc); 
    delete post_data._id
    res.json({msg: true, post_data: post_data})
  }else{
    res.json({msg: false})
  }
})

app.get("/logout", (req,res)=>{
  req.session.logged = false
  delete req.session.username
  delete req.session.first_name
  delete req.session.last_name
  res.json({msg: "success"})
})

app.get("/get_current_user_data", async(req,res)=>{
  if(req.session.username){
    const user_data = await getUserPublicData(req.session.username)
    res.json(user_data)
  }else{
    res.json({logged: false})
  }  
})


app.post("/follow", async(req,res)=>{
  let { follower, following } = req.body
  follower = await User.findOne({username: follower})
  follower.following.push(following)
  follower.save()

  following = await User.findOne({username: following})
  if(!following.followers.includes(follower.username)){
    following.followers.push(follower.username)
  }
  following.save()

  res.send({msg: "success", new_count: following.followers.length})
})

app.post("/unfollow", async(req,res)=>{
  let { follower, following } = req.body
  
  follower = await User.findOne({username: follower})
  follower.following = follower.following.filter(f => f !== following)
  follower.save()

  following = await User.findOne({username: following})
  following.followers = following.followers.filter(f => f !== follower.username)
  following.save()
  await User.updateOne({username: follower.username}, {$pullAll:{timeline: following.posts}})
  res.send({msg: "success", new_count: following.followers.length})
})


app.post("/like", async(req, res)=>{
  let { liker, post_id } = req.body
  let post = await Post.findOne({post_id: post_id})
  if(!post.post_likes.includes(liker)){
    post.post_likes.push(liker)
  }
  post.save()
  res.send({msg: "success", new_count: post.post_likes.length})
})


app.post("/unlike", async(req, res)=>{
  let { liker, post_id } = req.body
  let post = await Post.findOne({post_id: post_id})
  post.post_likes = post.post_likes.filter(l => l !== liker)
  post.save()
  res.send({msg: "success", new_count: post.post_likes.length})
})


app.post("/comment", async(req, res)=>{
  let session = req.session
  let { comment_content, post_id } = req.body
  let comment = {
    comment_post_id: post_id,
    comment_content: comment_content,
    comment_author: session.username,
    comment_author_name: session.first_name + " " + session.last_name,
    comment_date: Date.now(),
    comment_likes: []
  }
  let post = await Post.findOne({post_id: post_id})
  post.post_comments.push(comment)
  post.save()
  res.send({msg: "success", comment_data: {
    comment_post_id: post_id,
    comment_content: comment_content,
    comment_author: session.username,
    comment_author_name: session.first_name + " " + session.last_name,
    comment_date: Date.now(),
    comment_likes: []
  }})
})

app.post("/like_comment", async(req, res)=>{
  let { comment_index, post_id } = req.body
  let liker = req.session.username
  let post = await Post.findOne({post_id: post_id})
  if(!post.post_comments[comment_index].comment_likes.includes(liker)){
    post.post_comments[comment_index].comment_likes.push(liker)
  }
  post.save()
  res.send({msg: "success", new_count: post.post_comments[comment_index].comment_likes.length})
})


app.post("/unlike_comment", async(req, res)=>{
  let { comment_index, post_id } = req.body
  let liker = req.session.username
  let post = await Post.findOne({post_id: post_id})
  post.post_comments[comment_index].comment_likes = post.post_comments[comment_index].comment_likes.filter(l => l !== liker)
  post.save()
  res.send({msg: "success", new_count: post.post_comments[comment_index].comment_likes.length})
})



app.post("/delete_post", async(req, res)=>{
  let { post_id } = req.body
  let post = await Post.findOne({post_id: post_id})
  let user = await User.findOne({username: post.post_author})
  user.posts = user.posts.filter(p => p !== post_id)
  user.timeline = user.timeline.filter(p => p !== post_id)
  user.save()
  await Post.deleteOne({post_id: post_id})
  await User.updateMany({username: {$in: user.followers}}, {$pullAll:{timeline: [post_id]}});
  res.json({msg: "success"})
})

app.post("/delete_comment", async(req, res)=>{
  let { post_id, comment_index } = req.body
  console.log(comment_index)
  let post = await Post.findOne({post_id: post_id})
  post.post_comments = post.post_comments.filter((l, i) => i !== comment_index)
  post.save()
  console.log("finished")
  res.json({msg: "success"})
})

app.post("/get_timeline", async(req, res)=>{
  if(req.session.logged){
    let { username } = req.body
    let user = await User.findOne({username: username})
    res.json({posts: user.timeline})
  }
})


app.post("/search", async(req, res)=>{
  let query = req.body.query
  if(query === "" || query === " "){
    res.json({result: "No Results Found"})
  }else{
    let findQuery = `{ "$where": "function() { return (this.username.includes('${query.toLowerCase()}') || this.first_name.includes('${query.toLowerCase()}') || this.last_name.includes('${query.toLowerCase()}'))}" } `
    let result = await User.find(JSON.parse(findQuery));
    if(!result.length){
      res.json({result: "No Results Found"})
    }else{
      res.json({result: result.map(u =>u.username)})
    }  
  }
})

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`)
});