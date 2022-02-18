import React, {Component} from "react";
import { Navigate } from 'react-router-dom';
import { Form, FormGroup, Input } from 'reactstrap';
class App extends Component{
    constructor(props){
        super(props)
        this.state = {current: "s"}
    }
    componentDidMount = ()=>{
        document.title = "Sign in"
    }
    componentDidUpdate = ()=>{
        document.title = this.state.current === "r" ? "Register" : "Sign in"
    }
    toggle = (e)=>{
        e.preventDefault()
        if(this.state.current === "s"){
            this.setState({current: "r"})
        }else{
            this.setState({current: "s"})
        }
    }
    render(){
        let loggedIn
        loggedIn = false
        if(!loggedIn){
            if(this.state.current === "s"){
                return (
                    <div id="container">
                        <Signin />
                        <div className="center">Don't have an account? <a className="link" href="#" onClick={this.toggle}>Register</a></div>
                    </div>
                )
            }
            else if(this.state.current === "r"){
                return (
                    <div id="container">
                        <Register />
                        <div className="center">Already have an account? <a className="link" href="#" onClick={this.toggle}>Sign in</a></div>
                    </div>
                )
            }
        }else{
            return(
                <Navigate to="/home" />
            )
        }
    }
}

class Signin extends Component{
    constructor(props){
        super(props)
        this.username = React.createRef()
        this.passwd = React.createRef()
        this.state = {msg: ""}
    }
    hideMsg = ()=>{
        this.setState({msg: ""})
    }
    writeMsg = (msg)=>{
        this.setState({msg: msg})
    }
    validate = (e)=>{
        e.preventDefault()
        if(this.username.current.value === "" || this.passwd.current.value === ""){
            this.writeMsg("Please fill all required fields")
            return
        }
        let options = {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "username": this.username.current.value,
                "passwd": this.passwd.current.value,
            }),
        }
        fetch("/signin", options)
        .then((res)=>res.json())
        .then((data)=>{
            if(data.msg !== "success"){
                this.setState({msg: data.msg})
            }else{
                window.location.href = "/home";
            }
        })
    }
    render(){
        return(
            <div>
                <h2 className="center">Sign in</h2>
                <Form action="/signin" method="POST" onSubmit={this.validate} className="form">
                <FormGroup>
                <Input
                    className="reg_input"
                    placeholder="Username"
                    autoComplete="off"
                    type="username"
                    name="username"
                    id="username"
                    innerRef={this.username}
                    onFocus={this.hideMsg}
                />
                </FormGroup>
                <FormGroup>
                <Input
                    className="reg_input"
                    placeholder="Password"
                    autoComplete="off"
                    type="password"
                    name="passwd"
                    id="passwd"
                    innerRef={this.passwd}
                    onFocus={this.hideMsg}
                />
                </FormGroup>
                <FormGroup className="center-text">
                    <Input 
                        className="submit"
                        type="submit"
                        value="Sign in"
                    />
                </FormGroup>
                <div id="msg" className="center">{this.state.msg}</div>
            </Form>
        </div>
        )
    }
}

class Register extends Component{
    constructor(props){
        super(props)
        this.first_name = React.createRef()
        this.last_name = React.createRef()
        this.username = React.createRef()
        this.passwd = React.createRef()
        this.passwd2 = React.createRef()
        this.state = {msg: ""}
    }
    validate = (e)=>{
        e.preventDefault()
        if(!(this.username.current.value === "" || this.passwd.current.value === "" || this.passwd2.current.value === "" || this.last_name.current.value === "" || this.first_name.current.value === "")){   
            if(!(this.passwd.current.value !== this.passwd2.current.value)){
                let options = {
                    method: "POST",
                    headers: {
                    "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "first_name": this.first_name.current.value,
                        "last_name": this.last_name.current.value,
                        "username": this.username.current.value,
                        "passwd": this.passwd.current.value,
                        "passwd2": this.passwd2.current.value
                    }),
                }
                fetch("/register", options)
                .then((res)=>res.json())
                .then((data)=>{
                    if(data.msg !== "success"){
                        this.setState({msg: data.msg})
                    }else{
                        window.location.href = "/home";
                    }
                })
            }else{
                this.writeMsg("Passwords do not match")
            }
        }else{
            this.writeMsg("Please fill all required fields")
        }
    }
    hideMsg = ()=>{
        this.setState({msg: ""})
    }
    writeMsg = (msg)=>{
        this.setState({msg: msg})
    }
    render(){
        return(
            <div>
                <h2 className="center">Register</h2>
                <Form action="/register" method="POST" onSubmit={this.validate}>
                    <div className="row mt-4">
                            <FormGroup className="col">
                                <Input className="reg_input" autoComplete="off" type="text" id="first_name" placeholder="First Name" innerRef={this.first_name} onFocus={this.hideMsg}/>
                            </FormGroup>
                            <FormGroup className="col">
                                <Input autoComplete="off" className="reg_input" type="text" id="last_name" placeholder="Last Name" innerRef={this.last_name} onFocus={this.hideMsg}/>
                            </FormGroup>
                    </div>

                    <FormGroup className="mb-4">
                        <Input className="reg_input" autoComplete="off" type="text" id="username" placeholder="Username" innerRef={this.username} onFocus={this.hideMsg}/>
                    </FormGroup>
                    <FormGroup className="mb-4 mt-4">
                        <Input className="reg_input" autoComplete="off" type="password" id="passwd" placeholder="Password" innerRef={this.passwd} onFocus={this.hideMsg}/>
                    </FormGroup>
                    <FormGroup className="mb-4 mt-4">
                        <Input className="reg_input" autoComplete="off" type="password" id="passwd2" placeholder="Password (again)"innerRef={this.passwd2} onFocus={this.hideMsg}/>
                    </FormGroup>
                    <FormGroup className="center-text">
                        <Input 
                            className="reg_input submit"
                            type="submit"
                            value="Register"
                        />
                    </FormGroup>
                    <div id="msg" className="center">{this.state.msg}</div>
                </Form>
            </div>
        )
    }
}
export default App