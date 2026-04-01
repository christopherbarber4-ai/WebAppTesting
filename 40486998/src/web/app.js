import express from "express";
const app = express(); // instatiate express
import mysql from "mysql2"; // import mysql modulees
import sessions from "express-session";

const PORT = 3000;

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {

    res.render("login");
})

app.post("/login", async (req, res) => {
    const userEmail = req.body.userEmail;
    const userPass = req.body.password;

    if (userPass === "123") {
        res.send(`<h2> ${userEmail} tried to login </h2>
        
        <a href= "http://localhost:3000"> Back to login `);
    } else {

        res.redirect("/");
    }


});




app.get("/landing", (req, res) => {

    res.render("landing");
})


app.listen(PORT, () => {
    console.log(`Server is live! http://localhost:${PORT}`);
})