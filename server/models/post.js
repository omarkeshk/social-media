import mongoose from "mongoose"

let Post = new mongoose.Schema({
    post_content: String,
    post_author: String,
    post_author_name: String,
    post_comments: [{
        comment_post_id: String,
        comment_content: String,
        comment_author: String,
        comment_author_name: String,
        comment_date: Date,
        comment_likes: Array
      }],
    post_date: Date,
    post_likes: Array,
    post_id: String
})

export default mongoose.model('Post', Post)