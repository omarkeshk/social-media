import React from "react"
import ReactDOM from "react-dom"
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import "./index.css"
import App from "./App"
import NoMatch from "./Nomatch"
import Home from "./Home"
import 'bootstrap/dist/css/bootstrap.css'
import Profile from "./Profile"
import Post from "./Post"
import Search from "./Search"

ReactDOM.render(
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/home" element={<Home />} />
      <Route path="/users/:username" element={<Profile />}/>
      <Route path="/posts/:post_id" element={<Post />}/>
      <Route path="/search" element={<Search />}/>
      <Route path="*" element={<NoMatch />} />
    </Routes>
  </Router>,
  document.getElementById("app")
);