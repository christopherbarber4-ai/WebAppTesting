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

const RESITMAX = 40;
const YEARONEPASS = 4800;

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

    /* if (req.session.authen) { //update this so that there are 2 routes - 1 for class student and 1 for class admin. default landing for class student
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

});

app.get("/studentmgmt", async (req, res) => {
    const studentssql = `SELECT * FROM student
    INNER JOIN course 
    ON student.courseid = course.id
    INNER JOIN award
    ON student.awardid = award.id `;
    const [students] = await db.promise().query(studentssql);



    res.render("studentmgmt", { students });
});

app.post("/addstudent", async (req, res) => {
    const addStudentForm = { ...req.body };
    const insertStudentSQL = `INSERT INTO student (firstName, lastName, email, courseID, graduationYear)
VALUES (?, ?, ?, ?, ?)`
    const params = [
        addStudentForm.studentFirstName, addStudentForm.studentLastName,
        addStudentForm.studentEmail,
        addStudentForm.studentCourseName,
        addStudentForm.graduationYear]
        ;

    try {
        const [result] = await db.promise().query(insertStudentSQL, params)
        console.log(result);
        res.send(`<H2> New user succesfully added </h2> <br> 
                click <a href = "/studentmgmt"> here </a> to return to student management `);
    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }

});

// get request when selecting edit from the Student Management page
app.get("/editstudent/:eid", async (req, res) => {
    //const adminId <---- Need to add in authorisation;
    const studentId = req.params.eid;

    const singleStudentSQL = `SELECT * FROM student
    INNER JOIN course 
    ON student.courseid = course.id
    INNER JOIN award
    ON student.awardid = award.id WHERE student.id = ? `;
    const [studentParams] = await db.promise().query(singleStudentSQL, [studentId]);
    res.render("studentupdate", { studentParams });
});

app.get("/officermgmt", async (req, res) => {
    const userSQL = `SELECT * FROM systemuser`
    const [users] = await db.promise().query(userSQL);
    const coursesql = `SELECT * FROM course`
    const [courses] = await db.promise().query(coursesql);
    res.render("officermgmt", { courses, users });
});


app.get("/coursemgmt", async (req, res) => {
    const coursesql = `SELECT * FROM course
    INNER JOIN Modules
    ON course.id = Modules.courseid WHERE course.title = ?`;
    const params = "BSc Computer Science";
    const [courses] = await db.promise().query(coursesql, [params]);
    console.log(courses[0]);
    res.render("coursemgmt", { courses });
});


app.post("/addstudent", async (req, res) => {
    const addStudentForm = { ...req.body };
    const insertstudentSQL = `INSERT INTO systemuser (firstName, lastName, email, role, password)
VALUES (?, ?, ?, ?, ?)`
    const params = [
        addStudentForm.studentFirstName, addStudentForm.studentLastName,
        addStudentForm.studentEmail,
        addStudentForm.studentRole,
        addStudentForm.studentPassword];

    try {
        const [result] = await db.promise().query(insertstudentSQL, params)
        console.log(result);
        res.send(`<H2> New user succesfully added </h2> <br> 
                click <a href = "/studentmgmt"> here </a> to return to user management `);
    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }

});

app.get("/editstudent/:eid", async (req, res) => {
    //const adminId <---- Need to add in authorisation;
    const studentId = req.params.eid;
    const singlestudentSQL = `SELECT * FROM systemuser WHERE id = ?`
    const [student] = await db.promise().query(singlestudentSQL, [studentId]);
    const coursesql = `SELECT * FROM course`
    const [courses] = await db.promise().query(coursesql);

    res.render("studentupdate", { student, courses });
});

app.post("/editstudent", async (req, res) => {
    const updatestudentForm = { ...req.body };
    const updateSQL = `UPDATE SystemUser SET firstName = ?, lastName = ?, 
    email = ?, role = ?
    WHERE id = ?`;
    const updateParams = [updatestudentForm.studentFirstName,
    updatestudentForm.studentLastName,
    updatestudentForm.studentEmail,
    updatestudentForm.studentRole,
    updatestudentForm.studentid]

    try {
        const [result] = await db.promise().query(updateSQL, updateParams);
        console.log(result);
        res.send(`<H2> Changes have been succesfully made. </h2> <br>User 
            ${updatestudentForm.studentid} has been updated to reflect:
            <ul>
            <li> First Name: ${updatestudentForm.studentFirstName}</li>
            <li> Last Name: ${updatestudentForm.studentLastName}</li>
            <li> Email Address: ${updatestudentForm.studentEmail}</li>
            <li> Role: ${updatestudentForm.studentRole}</li>
            </ul> <br> 
                Please click <a href = "/studentmgmt"> here </a> to return to user
                management `)

    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }


});

//logic for auto classification

//VIEW ALL RESULTS
app.get("/resultsmgmt", async (req, res) => {
    const resultsSQL = `SELECT * FROM results
    INNER JOIN student 
    ON results.studentId = student.id
    INNER JOIN modules 
    ON results.moduleID = modules.id`
    const [totalResults] = await db.promise().query(resultsSQL);
    console.log(totalResults);

    res.render("resultsmgmt", { totalResults });
});

app.get("/updateresults/:eid", async (req, res) => {
    const studentId = req.params.eid;
    const resultsSQL = `SELECT * FROM results
    INNER JOIN student 
    ON results.studentId = student.id
    INNER JOIN modules 
    ON results.moduleID = modules.id WHERE student.id = ?`;
    const [totalResults] = await db.promise().query(resultsSQL, [studentId]);


    const coursesql = `SELECT modules.id AS moduleID, modules.moduleName, modules.creditValue, modules.year
            FROM student
            INNER JOIN course ON student.courseID = course.id
            INNER JOIN modules ON modules.courseID = course.id
            WHERE student.id = ?`;

    const [courses] = await db.promise().query(coursesql, [studentId]);
    console.log(courses[0])
    console.log(totalResults)
    res.render("studentresults", { totalResults, courses });
});

app.post("/addresult", async (req, res) => {
    const addResultForm = { ...req.body };
    const insertResultSQL = `INSERT INTO results (studentId, courseId, moduleID, score, resit) 
    VALUES (?,?,?,?,?)`;
    const params =
        [addResultForm.studentId,
        addResultForm.courseId,
        addResultForm.studentModule,
        addResultForm.moduleScore,
        addResultForm.isResit
        ];


    try {
        const [result] = await db.promise().query(insertResultSQL, params)
        console.log(result);
        console.log(req.body)
        console.log(result)

        res.send(`<H2> New result succesfully added </h2> <br>
            Student ${addResultForm.studentId} has been updated
                click <a href = "/studentmgmt"> here </a> to return to student management `);
    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }

});

app.post("/updateClassification", async (req, res) => {

    const calcYearScore = function (scores) {
        return number * number;
    };


    const studentResultsSql = `SELECT * FROM Results
    INNER JOIN student
    ON results.studentId = student.id 
    INNER JOIN modules
    ON results.moduleID = modules.id

    WHERE student.id = ? `;
    const params = 1;

    try {
        const [results] = await db.promise().query(studentResultsSql, params)
        console.log(results)
        console.log(results.length);


        let yearOneResults = [];
        let yearTwoResults = [];
        let yearThreeResults = [];

        const cleanedResults = new Map();
        results.forEach((result) => {
            if (!cleanedResults.has(result.moduleID) || result.resit === 1) {
                cleanedResults.set(result.moduleID, result);
            }
        });
        const singleResults = Array.from(cleanedResults.values());

        singleResults.forEach((result) => {
            if (result.resit === 1 && result.score > 40) {
                result.score = RESITMAX;
            } else {
                result.score = result.score;
            }
            switch (result.year) {
                case "Y1":
                    if (result.score < 40) {
                        yearOneResults.push("FAIL");
                    } else {
                        yearOneResults.push(result.score * result.creditValue);
                    }
                    break;
                case "Y2":
                    yearTwoResults.push(result.score * result.creditValue);
                    break;
                case "Y3":
                    yearThreeResults.push(result.score * result.creditValue);
                    break;

            }
        });
        console.log(yearOneResults);
        console.log(yearTwoResults);
        console.log(yearThreeResults);
        let yearOneFail = false;

        if (yearOneResults.includes("FAIL")) {
            yearOneFail = true;
        }


        if (!yearOneFail) {
            let yearTwoSum = 0;
            yearTwoResults.forEach((result) =>
                yearTwoSum += result);
            let yearTwoFinal = (yearTwoSum / 120) * 0.30;
            console.log(yearTwoFinal);

            let yearThreeSum = 0;
            yearThreeResults.forEach((result) =>
                yearThreeSum += result);
            let yearThreeFinal = (yearThreeSum / 120) * 0.70;
            console.log(yearThreeFinal);

            let finalClassification = yearTwoFinal + yearThreeFinal;
            console.log(finalClassification);
            res.send(`<h2> Classification achieved: ${finalClassification}</h2>`);
        }
        else {
            console.log("Student did not pass y1");
        }


    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }



});




app.listen(PORT, () => {
    console.log(`Server is live! http://localhost:${PORT}`);
});