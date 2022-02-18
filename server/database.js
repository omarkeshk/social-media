import dotenv from "dotenv"
dotenv.config()
import mongoose from "mongoose"
const SERVER = process.env.dbserver
const DATABASE = process.env.dbname

class Database {
  constructor() {
    this._connect()
  }
  
_connect() {
     mongoose.connect(`mongodb://${SERVER}/${DATABASE}`)
       .then(() => {
         console.log('Database connection successful')
       })
       .catch(err => {
            console.log(err)
            console.error('Database connection error')
       })
  }
}

export default Database