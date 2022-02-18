import { faHome, faSearch, faSignOut, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom"
function Search(){
    const [searchParams, setSearchParams] = useSearchParams();
    const [result, setResult] = useState("yet");
    const [current_user_data, setCurrentuserData] = useState({logged: false})
        useEffect(() => {
            fetch("/get_current_user_data")
            .then((res)=>res.json())
            .then((data2)=>{
                if(data2.logged === false){
                    setCurrentuserData(false)
                }else{
                    setCurrentuserData(data2)
                }
            })
            fetch("/search", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "query": searchParams.get("query")
                }),
            })
            .then((res)=>res.json())
            .then((data)=>{
                if(data.result !== "No Results Found"){
                    setResult(data.result.map(item => {
                        return (
                            <p key={item}><a href={"/users/"+item}>{item}</a></p>
                        )
                    }))
                }else{
                    setResult(
                        <div className="white">
                            <h1>No Results Found For '{searchParams.get("query")}'</h1>
                        </div>
                        )
                }
            })
        }, [searchParams, setSearchParams]);
        const logOut = ()=>{
            fetch("/logout")
            .then(()=>{window.location.href = "/"})
        }
        if(result === "yet"){
            return ""
        }else{
            return (
                <div>
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
                    <div id="results" style={{padding: "6rem"}}>
                        {result}
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


export default Search