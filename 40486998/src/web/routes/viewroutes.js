import express from "express";
const viewRouter = express.Router();
import services from "../middleware/services.js"
import db from "../middleware/db.js"



viewRouter.get("/", (req, res) => {
    res.render("login");
})

viewRouter.get("/login", (req, res) => {
    res.render("login");
})

viewRouter.post("/login", async (req, res) => {
    const userEmail = req.body.userEmail;
    const userPass = req.body.userPassword;
    const checkLoginSQL = `SELECT * FROM systemuser WHERE email = ?`

    try {
        const [rows] = await db.promise().query(checkLoginSQL, [userEmail])
        if (rows.length > 0 && rows[0].password === userPass) {
            rows[0].password == userPass;
            req.session.authen = rows[0].id;
            req.session.userAccessLevel = rows[0].role;

            res.redirect("/landing");
        } else {
            res.redirect("/error");
        }
    } catch (error) {
        res.status(500).send(error);
    }

});



viewRouter.get("/landing", async (req, res) => {
    if (req.session.authen) {
        const uID = req.session.authen;
        const checkLogin = `SELECT * FROM systemuser WHERE id = ?`
        const [rows] = await db.promise().query(checkLogin, [uID])
        const userData = rows[0];
        const userAccessLevel = req.session.userAccessLevel;
        res.render("landing", { userData, userAccessLevel });
    

    } else {
        res.redirect("/error");
    }

})




viewRouter.get("/error", (req, res) => {
    res.render("error");
});

viewRouter.get("/logout", (req, res) => {
    req.session.destroy();
    res.render("loggedout");


});


export default viewRouter;