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

const RESIT_MAX = 40;
const YEARONEPASS = 4800;
const TOTAL_CREDS = 120;

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

app.get("/Dashboard", async (req, res) => {

    res.render("dashboard");
})

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.render("loggedout");

});

app.get("/studentmgmt", async (req, res) => {
    const studentssql = `SELECT student.id AS stuID, firstName, lastName, email, courseID, graduationYear, awardID, course.title, award.classification  FROM student
    INNER JOIN course 
    ON student.courseID = course.id
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
        res.send(`<H2> New student succesfully added </h2> <br> 
                click <a href = "/studentmgmt"> here </a> to return to student management `);
    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }

});


app.get("/editstudent/:eid", async (req, res) => {
    //const adminId <---- Need to add in authorisation;
    const studentId = req.params.eid;
    const singlestudentSQL = `SELECT * FROM student WHERE id = ?`
    const [student] = await db.promise().query(singlestudentSQL, [studentId]);
    const coursesql = `SELECT * FROM course`
    const [courses] = await db.promise().query(coursesql);

    res.render("studentupdate", { student, courses });
});

app.post("/editstudent", async (req, res) => {
    const updatestudentForm = { ...req.body };
    const updateSQL = `UPDATE student SET firstName = ?, lastName = ?, 
    email = ?, graduationYear = ?
    WHERE id = ?`;
    const updateParams = [updatestudentForm.studentFirstName,
    updatestudentForm.studentLastName,
    updatestudentForm.studentEmail,
    updatestudentForm.studentGradYr,
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
            <li> Graduation Year: ${updatestudentForm.studentGradYr}</li>
            </ul> <br> 
                Please click <a href = "/studentmgmt"> here </a> to return to user
                management `)

    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }


});



app.get("/officermgmt", async (req, res) => {
    const userSQL = `SELECT * FROM systemuser`
    const [users] = await db.promise().query(userSQL);
    const coursesql = `SELECT * FROM course`
    const [courses] = await db.promise().query(coursesql);
    res.render("officermgmt", { courses, users });
});

app.get("/editofficer/:eid", async (req, res) => {
    //const adminId <---- Need to add in authorisation;
    const officerId = req.params.eid;
    const singleofficerSQL = `SELECT * FROM systemuser WHERE id = ?`
    const [officer] = await db.promise().query(singleofficerSQL, [officerId]);
    const coursesql = `SELECT * FROM course`
    const [courses] = await db.promise().query(coursesql);

    res.render("officerupdate", { officer, courses });
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




//logic for auto classification

//VIEW ALL RESULTS

app.get("/viewresults/:eid", async (req, res) => {
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

    const awardSQL = `SELECT * FROM student 
    INNER JOIN award
    ON student.awardID = award.id
    WHERE student.id = ?`

    const [award] = await db.promise().query(awardSQL, [studentId])

    res.render("viewresults", { totalResults, courses, award });
    console.log(award);
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


app.post("/addclassification/", async (req, res) => {
    const classificationForm = { ...req.body };
    const studentId = [classificationForm.studentId];
    const resultsSQL = `SELECT * FROM results
    INNER JOIN student 
    ON results.studentId = student.id
    INNER JOIN modules 
    ON results.moduleID = modules.id WHERE student.id = ?`;
    let studentClassification;

    try {
        const [results] = await db.promise().query(resultsSQL, [studentId]);

        //STEP 1 - ensure where resits, the resit result is taken forwards.
        const cleanedResults = new Map();
        results.forEach((result) => {
            if (!cleanedResults.has(result.moduleID) || result.resit === 1) {
                cleanedResults.set(result.moduleID, result);
            }
        });
        const singleResults = Array.from(cleanedResults.values());

        //STEP 2 - calculate the final scores for each year and total
        let yearOneResults = 0;
        let yearTwoResults = 0;
        let yearThreeResults = 0;
        let yearOneFail = false;

        singleResults.forEach((result) => {
            if (result.resit === 1 && result.score > 40) {
                result.score = RESIT_MAX;
            } else {
                result.score = result.score;
            }
            switch (result.year) {
                case "Y1":
                    if (result.score < 40) {
                        yearOneFail = true;
                    } else {
                        yearOneResults += (parseFloat(result.score) * result.creditValue);
                    }
                    break;
                case "Y2":
                    yearTwoResults += (parseFloat(result.score) * result.creditValue);
                    break;
                case "Y3":
                    yearThreeResults += (parseFloat(result.score) * result.creditValue);
                    break;

            }
        });

        //STEP 3 - Confirm classification based on final score.
        function calcFinalClassification(y1isFail, y2, y3, TOTAL_CREDS) {
            let finalScore = 0;
            let classification = "";

            if (!y1isFail) {
                finalScore += (y2 / TOTAL_CREDS * 0.30) + (y3 / TOTAL_CREDS * 0.70);
            } else {
                classification = "Fail";
                return classification;
            }

            if (finalScore <= 39.99) {
                classification = "Fail";
            }
            else if (finalScore >= 40 && finalScore <= 49.99) {
                classification = "Third Class Honours";
            }
            else if (finalScore >= 50 && finalScore <= 59.99) {
                classification = "Lower Second Class (2:2)";
            }
            else if (finalScore >= 60 && finalScore <= 69.99) {
                classification = "Upper Second Class (2:1)";
            }
            else {
                classification = "First Class Honours (1st)";
            }
            console.log(classification);
            console.log(finalScore);
            return classification;
        }

        studentClassification = calcFinalClassification(yearOneFail, yearTwoResults, yearThreeResults, TOTAL_CREDS);

    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }

    const insertClassificationSQL = `INSERT INTO award (classification, classificationStatus, systemUserID) VALUES(?, ?, ?)`
    const insertParams = [
        studentClassification,
        "In Progress",
        3,
    ];

    try {
        const [classificationresult] = await db.promise().query(insertClassificationSQL, insertParams)

        const updateStudentSQL = `UPDATE student SET awardID = ? WHERE id = ?`;

        const updateStudentParams = [classificationresult.insertId,
        classificationForm.studentId];

        const [updatestudentaward] = await db.promise().query(updateStudentSQL, updateStudentParams);

        res.send(`<H2> New classification succesfully added </h2> <br>
            Student ${classificationForm.studentId} has been updated with a ${studentClassification}
                click <a href = "/studentmgmt"> here </a> to return to student management `);

    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }




});




app.listen(PORT, () => {
    console.log(`Server is live! http://localhost:${PORT}`);
});