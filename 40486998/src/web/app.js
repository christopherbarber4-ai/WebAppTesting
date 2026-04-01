import express from "express";
const app = express(); // instatiate express
import mysql from "mysql2"; // import mysql modulees
import sessions from "express-session";

const PORT = 3000;

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));


app.get("/", (req,res) =>{

    res.render("login");
})


app.listen(PORT, () =>{
    console.log(`Server is live! http://localhost:${PORT}`);
})