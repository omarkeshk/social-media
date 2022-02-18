import { faHome, faSearch, faSignOut, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect } from "react";
import { Link, useParams } from 'react-router-dom'
import Loading from "./Loading";
import Nomatch from "./Nomatch";
import Post from "./Post";
function Profile(){
    const { username } = useParams()
    const [exists, setExists] = useState(null)
    const [user_data, setUserData] = useState(null)
    const [current_user_data, setCurrentuserData] = useState(null)
    const [posts, setPosts] = useState([])
    const [first2, setFirst2] = useState(true)
    const [rendered_posts, setRenderedPosts] = useState([])
    const [following, setFollowing] = useState(false)
    const [first, setFirst] = useState(true)
    const [followers_count, setFollowersCount] = useState(0)
    const [last_req, setLastreq] = useState(false)
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
        if(first2){
            fetch("/get_current_user_data")
        .then((res)=>res.json())
        .then((data2)=>{
            if(data2.logged === false){
                setCurrentuserData(false)
            }else{
                setCurrentuserData(data2)
            }
        })
        let options = {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "username": username
            }),
        }
        fetch("/userexists", options)
        .then((res)=>res.json())
        .then((data)=>{
            if(data.msg === true){
                setFollowersCount(data.user_data.followers.length)
                setUserData(data.user_data)
                setExists(true)
                setPosts(data.user_data.posts.reverse())
            }else{
                setExists(false)
            }
        })
            setFirst2(false)
        }
        window.addEventListener('scroll', updateScrollPercentage)
        if(percent > 95){
            setRenderedPosts(posts.slice(0,rendered_posts.length+5).map((p, i)=> <Post post_id={p} key={"post_"+i} />))
        }
    }, [username, percent, user_data, posts])
    if(exists === true){
        document.title = `${user_data.first_name} ${user_data.last_name}'s Personal Page`
        let [follows_you, same_user, logged] = Array(4).fill(false)
        if(current_user_data){
            logged = true
            if(user_data.followers.includes(current_user_data.username) && first === true){
                setFollowing(true)
                setFirst(false)
            }else if(first === true){
                setFirst(false)
            }
            if(current_user_data.username === user_data.username){
                same_user = true
            }
            if(user_data.following.includes(current_user_data.username)){
                follows_you = true
            }
        }
        const follow = ()=>{
            if(last_req === false){
                setLastreq(new Date())
            }else{
                let current_date = new Date()
                if((current_date.getTime() - last_req.getTime()) < 1500){
                    return
                }
            }
            if(!logged){
                window.location.href = "/"
                return
            }
            fetch("/follow", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "follower": current_user_data.username,
                    "following": user_data.username
                }),
            })
            .then((res)=>res.json())
            .then((data)=>{
                if(data.msg === "success"){
                    setFollowersCount(data.new_count)
                    setFollowing(true)
                    setLastreq(new Date())
                }
            })
        }

        const unfollow = ()=>{
            if(last_req === false){
                setLastreq(new Date())
            }else{
                let current_date = new Date()
                if((current_date.getTime() - last_req.getTime()) < 1500){
                    return
                }
            }
            if(!logged){
                window.location.href = "/"
                return
            }
            fetch("/unfollow", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "follower": current_user_data.username,
                    "following": user_data.username
                }),
            })
            .then((res)=>res.json())
            .then((data)=>{
                if(data.msg === "success"){
                    setFollowersCount(data.new_count)
                    setFollowing(false)
                    setLastreq(new Date())
                }
            })
        }
        const logOut = ()=>{
            fetch("/logout")
            .then(()=>{window.location.href = "/"})
        }
        document.addEventListener("click", function(event){
            if (event.target === modal || event.target === modal1) {
                hideModal()
            }
        })
        let modal, modal1
        setTimeout(() => {
            modal = document.getElementById("myModal");                
            modal1 = document.getElementById("myModal1");                
        }, 1);
        const openModal = ()=>{
        modal.style.display = "block";
        }
        const openModal1 = ()=>{
            modal1.style.display = "block";
        }
        const hideModal = ()=>{
            modal.style.display = "none";                
            modal1.style.display = "none";                
        }
        return (
            <div id="profilepage" className="flex_center">
                    <div>
                        <div id="myModal" className="modal">
                            <div className="modal-content">{user_data.followers.map(l => {
                            return (
                                <div key={"follower_"+l} style={{textAlign: "center"}}>
                                    <a href={"/users/"+l}>{l}</a>
                                    <hr />
                                </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <div>
                        <div id="myModal1" className="modal">
                            <div className="modal-content">{user_data.following.map((l, i) => {
                            return (
                                <div key={"following_"+i} style={{textAlign: "center"}}>
                                    <a href={"/users/"+l}>{l}</a>
                                    <hr />
                                </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                <header>
                    <SearchForm />
                    <div id="header_icons">
                        <Link to={current_user_data ? "/users/"+current_user_data.username : "/"} onClick={() => setTimeout(() => {window.location.reload()},0)}>
                            <FontAwesomeIcon className="header_link" icon={faUser} />          
                        </Link> 
                        <FontAwesomeIcon  className="header_link" onClick={logOut} icon={faSignOut} />
                        <Link to="/home">
                            <FontAwesomeIcon className="header_link" icon={faHome} />
                        </Link>
                    </div>
                </header>
                <div id="profile" className="flex_center">
                    <div id="profile_data">
                        {same_user ? <h1>This is Your profile</h1>:<h1>This is {user_data.first_name} {user_data.last_name}'s profile</h1>}
                        <p id="followers" onClick={openModal}>Followers: {followers_count}</p>
                        <p id="following" onClick={openModal1}>Following: {user_data.following.length}</p>
                        {same_user ? "" : (!following || !logged) ? <button id="Follow" onClick={follow}>Follow</button> : <button id="Unfollow" onClick={unfollow}>Unfollow</button>}
                        {follows_you ? "Follows you" : ""}
                    </div>
                    <div id="posts">
                        {rendered_posts}
                    </div>
                </div>
            </div>
        )
    }else if(exists === false){
        return (
            <Nomatch />
        )
    }else{
        return(
            <Loading />
        )
    }
}

class SearchForm extends React.Component{
    constructor(props){
        super(props)
        this.search_input = React.createRef()
    }
    render(){
        return (
            <form id="search_form" method="GET" action="/search">
                <div className="input-group">
                    <div className="form-outline">
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
export default Profile