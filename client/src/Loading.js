import React, { Component } from "react";

class Loading extends Component{
    render(){
        return(
            <div style={{height: "100vh", display: "flex", justifyContent: "center", alignItems: "center"}}>
                <div className="lds-ring">
                    <div>
                    </div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        )
    }
}

export default Loading