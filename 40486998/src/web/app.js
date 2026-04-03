import express from "express";
const app = express(); // instatiate express
import mysql from "mysql2"; // import mysql modulees
import sessions from "express-session";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); //middleware to ensure I can access static files e.g. css
app.use(express.static(path.join(__dirname, '/public')));

const PORT = 3000;
const oneHour = 10000 * 60 * 60 * 1; // variable for cookie timeout

const users = [{
    uName: "christopher.barber4@gmail.com",
    passW: "123",
},
{
    uName: "noleen.robinson@hotmail.com",
    passW: "2234",
}];

//SESSIONS SET UP

app.use(sessions({ // creates a session object on the node server
    secret: 'cbarberproject',
    saveUninitialized: true,
    cookie: { maxAge: oneHour },
    resave: false
}));

//DB SET UP


const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root', // 'root' if MAMP Mac OS
    database: 'hedclass',  //DB name
    port: '8889', //8889 if MAMP Mac OS
});

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    res.render("login");
})

app.post("/login", async (req, res) => {
    const userEmail = req.body.userEmail;
    const userPass = req.body.password;
    req.session.authen = userEmail;

    res.redirect("/landing");

    /* if (req.session.authen) { //update this so that there are 2 routes - 1 for class officer and 1 for class admin. default landing for class officer
         res.render("landing", {students});
     } else {
         res.redirect("/");
     }
 */

});

app.get("/landing", async (req, res) => {

    res.render("landing");
})

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.render("loggedout");

})

app.get("/studentmgmt", async (req, res) => {
    const studentssql = `SELECT * FROM student
  
    INNER JOIN course 
    ON student.courseid = course.id `;
    const [students] = await db.promise().query(studentssql);
    console.log(students[0]);
    res.render("studentmgmt", { students });
})

app.get("/coursemgmt", async (req, res) => {
    const coursesql = `SELECT * FROM course
    INNER JOIN Modules
    ON course.id = Modules.courseid WHERE course.title = ?`;
    const params = "BSc Computer Science";
    const [courses] = await db.promise().query(coursesql, [params]);
    console.log(courses[0]);
    res.render("coursemgmt", { courses });
});

app.get("/officermgmt", async (req, res) => {
    const userSQL = `SELECT * FROM systemuser`
    const [users] = await db.promise().query(userSQL);
    const coursesql = `SELECT * FROM course`
    const [courses] = await db.promise().query(coursesql);
    res.render("officermgmt", { courses, users });
});

app.post("/addofficer", async (req, res) => {
    const addOfficerForm = { ...req.body };
    const insertOfficerSQL = `INSERT INTO systemuser (firstName, lastName, email, role, password)
VALUES (?, ?, ?, ?, ?)`
    const params = [
    addOfficerForm.officerFirstName, addOfficerForm.officerLastName,
    addOfficerForm.officerEmail,
    addOfficerForm.officerRole,
    addOfficerForm.officerPassword];

    try {
        const [result] = await db.promise().query(insertOfficerSQL, params)
        console.log(result);
            res.send(`<H2> New user succesfully added </h2> <br> 
                click <a href = "/officermgmt"> here </a> to return to user management `);
    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }

});

app.get("/editofficer/:eid", async (req, res) =>{
    //const adminId <---- Need to add in authorisation;
    const officerId = req.params.eid;
    const singleOfficerSQL = `SELECT * FROM systemuser WHERE id = ?`
    const [officer] = await db.promise().query(singleOfficerSQL,[officerId]);
    const coursesql = `SELECT * FROM course`
    const [courses] = await db.promise().query(coursesql);

    res.render("officerupdate", {officer, courses});


});





app.listen(PORT, () => {
    console.log(`Server is live! http://localhost:${PORT}`);
});