import React, { Component, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Loading from "./Loading";
import Post from "./Post";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSignOut, faUser, faSearch } from '@fortawesome/free-solid-svg-icons'
class Home extends Component{
    constructor(props){
        super(props)
        this.state = {
            logged: "yet",
            posts_loaded: 0,
            timeline: []
        }
    }
    async componentDidMount(){
        let lastScrollTop = 0
        window.addEventListener("scroll", function(){
            let st = window.pageYOffset || document.documentElement.scrollTop;
            if (st > lastScrollTop){
                document.getElementsByTagName("header")[0].classList.add("hidden")
            }else{
                document.getElementsByTagName("header")[0].classList.remove("hidden")
            }
            lastScrollTop = st <= 0 ? 0 : st
         }, false);
        document.title = "Homepage"
        await fetch("/logged", {method:"POST"})
        .then((res)=>res.json())
        .then((data)=>{
            if(data.logged){
                this.setState({logged: data.logged, username: data.user_data.username, first_name: data.user_data.first_name, last_name: data.user_data.last_name})
            }else{
                window.location.href = "/"
            }
        })
        fetch("/get_timeline", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "username": this.state.username
            }),
        })
        .then((res)=>res.json())
        .then((data)=>{
            this.setState({timeline: data.posts.reverse()})
        })
    }
    logOut = (e)=>{
        e.preventDefault()
        fetch("/logout")
        .then(()=>{window.location.href = "/"})
    }
    render(){
        if(this.state.logged === true){
            return (
                <div id="homepage">
                    <header>
                        <SearchForm />
                        <div id="header_icons">
                            <Link to={"/users/"+this.state.username}>
                                <FontAwesomeIcon className="header_link" icon={faUser} />          
                            </Link> 
                            <FontAwesomeIcon  className="header_link" onClick={this.logOut} href="/" icon={faSignOut} />
                        </div>
                    </header>
                    <div id="timeline_container">
                        <PostForm />
                        <Timeline timeline={this.state.timeline} />
                    </div>
                </div>
            )
        }else if(this.state.logged === "yet"){
            return <Loading />
        }else{
            return <Navigate to="/" />
        }
    }
}

class SearchForm extends Component{
    constructor(props){
        super(props)
        this.search_input = React.createRef()
    }
    render(){
        return (
            <form id="search_form" method="GET" action="/search">
                <div className="input-group">
                    <div className="form-outline" id="search_outline">
                        <input id="search_input" type="search" className="form-control"name="query" placeholder="Search" autoComplete="off" ref={this.search_input} />
                    </div>
                    <button id="search-button" type="submit" className="btn btn-primary search_btn">
                        <FontAwesomeIcon icon={faSearch} />
                    </button>
                </div>
            </form>
            )
    }
}
class PostForm extends Component{
    constructor(props){
        super(props)
        this.post_content = React.createRef()
        this.state = {
            last_req: false
        }
    }
    validate = (e)=>{
        e.preventDefault()
        if(this.state.last_req === false){
            this.setState({last_req: new Date()})
        }else{
            let current_date = new Date()
            if((current_date.getTime() - this.state.last_req.getTime()) < 5000){
                return
            }
        }
        if(this.post_content.current.value === ""){
            return
        }
        let options = {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "post_content": this.post_content.current.value
            }),
        }
        this.post_content.current.value = ""
        fetch("/post", options)
        .then((res)=>res.json())
        .then((data)=>{
            window.location.href = `/posts/${data.post_id}`
            this.setState({last_req: new Date()})
        })
    }
    render(){
        return (
            <div id="post_form">
                <form action="post" method="POST" onSubmit={this.validate}>
                    <div id="post_form_inner">
                        <textarea  placeholder="Write your post here" autoComplete="off" id="post_input" ref={this.post_content} rows="4"></textarea>
                        <input type="submit" value="Post" id="post_submit"/>
                    </div>
                </form>
            </div>
        )
    }
}

function Timeline(props){
    const [timeline, setTimeline] = useState([])
    const[percent, setPercent]= useState(100)
    const updateScrollPercentage = function() {
        const heightOfWindow = window.innerHeight,
        contentScrolled = window.pageYOffset,
        bodyHeight = document.body.offsetHeight
        let percentage
        
        if(bodyHeight - contentScrolled <= heightOfWindow) {
            percentage = 100
        }
        else {
            const total = bodyHeight - heightOfWindow,
            got = contentScrolled
            percentage = parseInt((got/total) * 100)
        }
        setPercent(percentage)
    }
    useEffect(()=>{
        window.addEventListener('scroll', updateScrollPercentage)
        if(percent > 95){
            setTimeline(props.timeline.slice(0,timeline.length+5).map((p, i)=> <Post post_id={p} key={"post_"+i} />))
        }
    }, [props, percent])
        return (
            <div id="timeline">
                {timeline}
                {timeline.length === props.timeline.length ? <h2>There's nothing more to see</h2> : ""}
            </div>
        )
}
export default Home