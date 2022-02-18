import { faArrowRight, faHeart, faTrash, faHome, faSearch, faSignOut, faUser } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from 'react-router-dom'
import Loading from "./Loading";
import Nomatch from "./Nomatch";


function formatDate(date){
    date = new Date(date)
    let current_date = new Date()
    let diff = Math.round((current_date.getTime() - date.getTime()) /1000)
    if(diff < 0){
        diff = Math.abs(diff)
    }
    let unit = "second"
    if(diff >= 60){
        Math.round()
        diff = Math.round(diff / 60)
        unit = "minute"
        if(diff >= 60){
            diff = Math.round(diff / 60)
            unit = "hour"
            if(diff >= 24){
                diff = Math.round(diff / 24)
                unit = "day"
                if(diff >= 30){
                    diff = Math.round(diff / 30)
                    unit = "month"
                    if(diff >= 12){
                        diff = Math.round(diff / 12)
                        unit = "year"
                    }
                }
            }
        }
    }
    return diff === 1 ? `${diff} ${unit} ago` : `${diff} ${unit}s ago`
}
function Post(props){
    const comment_input = useRef()
    let { post_id } = useParams()
    let post_page = true
    if(post_id === undefined){
        post_id = props.post_id
        post_page = false
    }
    const [exists, setExists] = useState(null)
    const [post_data, setPostData] = useState(null)
    const [current_user_data, setCurrentuserData] = useState({logged: false})
    const [liked, setLiked] = useState(false)
    const [first, setFirst] = useState(true)
    const [likeCount, setLikeCount] = useState(0)
    const [comments, setComments] = useState(null)
    const [post_deleted, setPostDeleted] = useState(false)
    const [last_req, setLastreq] = useState(false)
    useEffect(async()=>{
        let options = {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "post_id": post_id
            }),
        }
        if(first){
            await fetch("/get_current_user_data")
            .then((res)=>res.json())
            .then((data2)=>{
                if(data2.logged === false){
                    setCurrentuserData(false)
                }else{
                    setCurrentuserData(data2)
                }
            })
            // fetch("/logged", {method: "POST"})
            // .then((res)=>res.json())
            // .then((data)=>{
            //     if(data.logged){
            //         setCurrentuserData(data)
            //     }else{
            //         setCurrentuserData(false)
            //     }
            // })
            fetch("/postexists", options)
            .then((res)=>res.json())
            .then((data)=>{
                if(data.msg === true){
                    setPostData(data.post_data)
                    // setComments(data.post_data.post_comments.map((comment, index) => <Comment key={"comment_"+index} comment_data={comment} current_user_data={current_user_data}/>))
                    setComments(data.post_data.post_comments)
                    setLikeCount(data.post_data.post_likes.length)
                    setExists(data.msg)
                }else{
                    setExists(false)
                }
            })
        }
        if(post_page){
            document.title = "Post"
        }
        
    },[post_id, first, post_page])

    const like = ()=>{
        if(last_req === false){
            setLastreq(new Date())
        }else{
            let current_date = new Date()
            if((current_date.getTime() - last_req.getTime()) < 1500){
                return
            }
        }
        if(!current_user_data.logged){
            window.location.href = "/"
            return
        }
        fetch("/like", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "liker": current_user_data.username,
                "post_id": post_id
            }),
        })
        .then((res)=>res.json())
        .then((data)=>{
            setFirst(false)
            setLiked(true)
            setLikeCount(data.new_count)
            setLastreq(new Date())
        })
    }
    
    const unlike = ()=>{
        if(last_req === false){
            setLastreq(new Date())
        }else{
            let current_date = new Date()
            if((current_date.getTime() - last_req.getTime()) < 1500){
                return
            }
        }
        if(!current_user_data.logged){
            window.location.href = "/"
            return
        }
        fetch("/unlike", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "liker": current_user_data.username,
                "post_id": post_id
            }),
        })
        .then((res)=>res.json())
        .then((data)=>{
            setFirst(false)
            setLiked(false)
            setLikeCount(data.new_count)
            setLastreq(new Date())
        })
    }
    const submitComment = (e)=>{
        e.preventDefault()
        if(!current_user_data.logged){
            window.location.href = "/"
            return
        }
        if(comment_input.current.value === ""){
            return
        }
        fetch("/comment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "post_id": post_id,
                "comment_content": comment_input.current.value
            })
        })
        .then((res)=>res.json())
        .then((data)=>{
            setComments([<Comment key={"comment_"+comments.length} comment_index={comments.length} comment_data={data.comment_data} current_user_data={current_user_data}/>, ...comments])
            comment_input.current.value = ""
        })
    }
    const deletePost = ()=>{
        if(last_req === false){
            setLastreq(new Date())
        }else{
            let current_date = new Date()
            if((current_date.getTime() - last_req.getTime()) < 1500){
                return
            }
        }
        fetch("/delete_post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "post_id": post_id,
            })
        })
        .then(()=>{
            if(post_page){
                window.location.href = "/home"
            }else{
                setPostDeleted(true)
            }
        })
    }
    const logOut = ()=>{
        fetch("/logout")
        .then(()=>{window.location.href = "/"})
    }
    if(exists === true){
        if(first === true){
            setComments(comments.map((comment, index) => <Comment key={"comment_"+index} comment_index={index} comment_data={comment} current_user_data={current_user_data}/>))
            if(current_user_data.logged && first === true && post_data.post_likes.includes(current_user_data.username) && liked === false){
                setLiked(true)
            }
            setFirst(false)
        }
        if(post_deleted){
            return ""
        }else{
            document.addEventListener("click", function(event){
                if (event.target === modal) {
                    hideModal()
                }
            })
            let modal
            setTimeout(() => {
                modal = document.getElementById(`modal_${post_id}`);                
            }, 1);
            const openModal = ()=>{
            modal.style.display = "block";
            }
            const hideModal = ()=>{
                modal.style.display = "none";                
            }

            if(post_page){
                return (
                    <div>
                        <div id={"modal_"+post_id} className="modal"><div className="modal-content">{post_data.post_likes.map(l => {
                            return (
                                <div key={"post_"+post_id+"_liker_"+l} style={{textAlign: "center"}}>
                                    <a href={"/users/"+l}>{l}</a>
                                    <hr />
                                </div>
                            )
                        })}
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
                        <div id="post_container">
                        <div className="post">
                            <div className="post_top">
                                <div className="post_left">
                                    <Link to={"/users/"+post_data.post_author} className="no_decoration">
                                        <div className="post_author" >{post_data.post_author_name}</div>
                                    </Link>
                                    <div className="post_date">{formatDate(post_data.post_date)}</div>
                                </div>
                                <div className="post_right">
                                    {current_user_data.logged ? (current_user_data.username === post_data.post_author ? <FontAwesomeIcon icon={faTrash} className="delete" onClick={deletePost}/> : "") : ""}
                                </div>
                            </div>
                            <div className="post_content">{post_data.post_content}</div>
                            {/* <p>Post ID: {post_data.post_id}</p> */}
                            <div className="like_container">
                                {liked ? <FontAwesomeIcon onClick={unlike} className="red" icon={faHeart}/> : <FontAwesomeIcon onClick={like} className="white" icon={faHeart}/>}
                                <span className="like_count" onClick={openModal}> {likeCount}</span>
                            </div>
                            <form className="comment_form">
                                <textarea rows="2" placeholder="Enter comment" className="comment_input" ref={comment_input}>

                                </textarea>
                                {/* <input type="text" autoComplete="off" placeholder="Enter comment" className="comment_input" ref={comment_input}/> */}
                                <button className="comment_submit" onClick={submitComment} type="submit"><FontAwesomeIcon icon={faArrowRight} /></button>
                            </form>
                            <div className="comments">
                                {comments}
                            </div>
                        </div>
                        </div>
                    </div>
                    )
            }
            return (
                <div className="post">
                        <div id={"modal_"+post_id} className="modal"><div className="modal-content">{post_data.post_likes.map(l => {
                            return (
                                <div key={l} style={{textAlign: "center"}}>
                                    <a href={"/users/"+l}>{l}</a>
                                    <hr style={{color: "black"}}/>
                                </div>
                            )
                        })}</div></div>
                        <div className="post_top">
                        <div className="post_left">
                            <Link to={"/users/"+post_data.post_author} className="no_decoration">
                                <div className="post_author" >{post_data.post_author_name}</div>
                            </Link>
                            <div className="post_date">{formatDate(post_data.post_date)}</div>
                        </div>
                        <div className="post_right">
                            {current_user_data.logged ? (current_user_data.username === post_data.post_author ? <FontAwesomeIcon icon={faTrash} className="delete" onClick={deletePost}/> : "") : ""}
                        </div>
                    </div>
                    <div className="post_content">{post_data.post_content}</div>
                    {/* <p>Post ID: {post_data.post_id}</p> */}
                    <div className="like_container">
                        {liked ? <FontAwesomeIcon onClick={unlike} className="red" icon={faHeart}/> : <FontAwesomeIcon onClick={like} className="white" icon={faHeart}/>}
                        <span className="like_count" onClick={openModal}> {likeCount}</span>
                    </div>
                    <form className="comment_form">
                    <textarea rows="2" placeholder="Enter comment" className="comment_input" ref={comment_input}>

                    </textarea>
                    <button className="comment_submit" onClick={submitComment} type="submit"><FontAwesomeIcon icon={faArrowRight} /></button>
                    </form>
                    <div className="comments">
                        {comments}
                    </div>
                </div>
            
                )
        }
    }else if(exists === false){
        return <Nomatch />
    }else{
        return(
            <Loading />
        )
    }
}

function Comment(props){
    const [liked, setLiked] = useState(false)
    const [first, setFirst] = useState(true)
    const [likeCount, setLikeCount] = useState(0)
    const [comment_deleted, setCommentDeleted]= useState(false)
    const [last_req, setLastreq] = useState(false)
    const like = ()=>{
        if(last_req === false){
            setLastreq(new Date())
        }else{
            let current_date = new Date()
            if((current_date.getTime() - last_req.getTime()) < 1500){
                return
            }
        }
        if(!props.current_user_data.logged){
            window.location.href = "/"
            return
        }
        fetch("/like_comment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "post_id": props.comment_data.comment_post_id,
                "comment_index": props.comment_index
            })
        })
        .then((res)=>res.json())
        .then((data)=>{
            setLikeCount(data.new_count)
            setLiked(true)
            setLastreq(new Date())
        })
    }
    const unlike = ()=>{
        if(last_req === false){
            setLastreq(new Date())
        }else{
            let current_date = new Date()
            if((current_date.getTime() - last_req.getTime()) < 1500){
                return
            }
        }
        if(!props.current_user_data.logged){
            window.location.href = "/"
            return
        }
        fetch("/unlike_comment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "post_id": props.comment_data.comment_post_id,
                "comment_index": props.comment_index
            })
        })
        .then((res)=>res.json())
        .then((data)=>{
            setLikeCount(data.new_count)
            setLiked(false)
            setLastreq(new Date())
        })
    }
    useEffect(()=>{
        if(props.current_user_data){
            if(props.comment_data.comment_likes.includes(props.current_user_data.username) && first === true){
                setLiked(true)
                setFirst(false)
                setLikeCount(props.comment_data.comment_likes.length)
            }else if(first === true){
                setLikeCount(props.comment_data.comment_likes.length)
                setFirst(false)
            }
        }
    }, [first, props.comment_data.comment_likes, props.current_user_data])
    let { comment_content, comment_author, comment_author_name, comment_date, comment_likes} = props.comment_data
    const deleteComment = ()=>{
        fetch("/delete_comment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "post_id": props.comment_data.comment_post_id,
                "comment_index": props.comment_index
            })
        })
        .then(()=>{
            window.location.reload()
            setCommentDeleted(true)
        })
    }
    if(comment_deleted){
        return ""
    }else{
        document.addEventListener("click", function(event){
            if (event.target === modal) {
                hideModal()
            }
        })
        let modal
        setTimeout(() => {
            modal = document.getElementById(`modal_${props.comment_data.comment_post_id}_${props.comment_index}`);                
        }, 1);
        const openModal = ()=>{
        modal.style.display = "block";
        }
        const hideModal = ()=>{
            modal.style.display = "none";                
        }
        const reload = ()=>{
            setTimeout(() => {
                window.location.reload()                
            }, 1);
        }
        return (
            <div className="comment">
                <div id={"modal_"+props.comment_data.comment_post_id+"_"+props.comment_index} className="modal"><div className="modal-content">{comment_likes.map(l => {
                    return (
                        <div key={"post_"+props.comment_data.comment_post_id+"_comment_"+props.comment_index+"liker_"+l} style={{textAlign: "center"}}>
                            <a href={"/users/"+l}>{l}</a>
                            <hr style={{color: "white"}}/>
                        </div>
                    )
                })}
                </div>
                </div>
                <hr />
                <div className="post_top">
                    <div className="post_left">
                        <Link to={"/users/"+comment_author} className="no_decoration" onClick={reload}>
                            <div className="comment_author">{comment_author_name}</div>
                        </Link>
                        <div className="comment_date">{formatDate(comment_date)}</div>
                        </div>
                        <div className="post_right">
                            {props.current_user_data.logged ? (props.current_user_data.username === comment_author ? <FontAwesomeIcon icon={faTrash} className="delete" onClick={deleteComment}/>: ""): ""}
                        </div>
                    </div>
                <div className="comment_content">{comment_content}</div>
                <div className="comment_like_container">
                    {liked ? <FontAwesomeIcon icon={faHeart} className="red" onClick={unlike} /> : <FontAwesomeIcon icon={faHeart} className="white" onClick={like} />}            
                    <span className="like_count" onClick={openModal}> {likeCount}</span>
                </div>
            </div>
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

export default Post