import express from "express";
const app = express(); // instatiate express
import mysql from "mysql2"; // import mysql modulees
import sessions from "express-session";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); //middleware to ensure I can access static files e.g. css
const PORT = 3000;
const oneHour = 10000 * 60 * 60 * 1; // variable for cookie timeout

app.use(sessions({ // creates a session object on the node server
    secret: 'cbarberproject',
    saveUninitialized: true,
    cookie: { maxAge: oneHour },
    resave: false
}));



app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {

    res.render("login");
})

app.post("/login", async (req, res) => {
    const userEmail = req.body.userEmail;
    const userPass = req.body.password;

    if (userPass === "123") { //update this so that there are 2 routes - 1 for class officer and 1 for class admin. default landing for class officer
        res.render("landing");
    } else {
        res.redirect("/");
    }


});


app.get("/landing", (req, res) => {

    res.render("landing");
})


app.get("/logout", (req, res) => {
        req.session.destroy();
    res.render("loggedout");

})

app.listen(PORT, () => {
    console.log(`Server is live! http://localhost:${PORT}`);
})