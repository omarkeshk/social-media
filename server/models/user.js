import mongoose from "mongoose"

let User = new mongoose.Schema({
  first_name: String,
  last_name: String,
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  passwd: String,
  posts: Array,
  following: Array,
  followers: Array,
  timeline: Array,
  ip: String
})

export default mongoose.model('User', User)