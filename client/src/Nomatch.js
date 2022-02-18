import React, {Component} from "react";

class Nomatch extends Component{
    render(){
        return(
            <div>
                <h1 style={{color: "white"}}>Error: 404<br /> Page not found</h1>
                <a href="/home">back to homepage</a>
            </div>
        )
    }
}

export default Nomatch