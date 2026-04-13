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

app.get("/dashboard", async (req, res) => {
    const courseDataSQL = `SELECT course.id as courseID,student.id AS stuID, course.title, award.classification, award.finalScore, student.awardID FROM course
    LEFT JOIN student 
    ON student.courseID = course.id
    LEFT JOIN award
    ON student.awardID = award.id `;
    const [stats] = await db.promise().query(courseDataSQL);


    //create an array to ensure only unique courses and also house
    // counts per course e.g. grades and no. of students 
    const studentStats = [];
    let globalStudentCount = 0;
    stats.forEach((stat) => {

        if (!studentStats[stat.courseID]) {
            studentStats[stat.courseID] = {
                id: stat.courseID,
                title: stat.title,
                totalStudents: 0,
                gradeFirst: 0,
                gradeTwoOne: 0,
                gradeTwoTwo: 0,
                gradeThird: 0,
                gradeFail: 0,
                allGradedScores: 0,
                gradedStudents: 0
            };
        }

        if (stat.stuID) {
            studentStats[stat.courseID].totalStudents++;
            if (stat.finalScore != null) {
                studentStats[stat.courseID].allGradedScores += parseFloat(stat.finalScore);
                studentStats[stat.courseID].gradedStudents++;
            }
            globalStudentCount++;
            if (stat.classification === 'First Class Honours (1st)') {
                studentStats[stat.courseID].gradeFirst++;
            }
            if (stat.classification === 'Upper Second Class (2:1)') {
                studentStats[stat.courseID].gradeTwoOne++;
            }
            if (stat.classification === 'Lower Second Class (2:2)') {
                studentStats[stat.courseID].gradeTwoTwo++;
            }
            if (stat.classification === 'Third Class Honours') {
                studentStats[stat.courseID].gradeThird++;
            }
            if (stat.classification === 'Fail') {
                studentStats[stat.courseID].gradeFail++;
            }

        }
    });
    //course also same as stat but labelled differently here for clarity. two loops to count 
    // both number of students and also number of classifications for each course
    studentStats.forEach((course) => {
        course.studentCountPercentage = ((course.totalStudents / globalStudentCount) * 100).toFixed(0);
        course.averageScore = (course.allGradedScores / course.gradedStudents).toFixed(2);

    });

    studentStats.forEach((course) => {
        if (course.totalStudents > 0) {
            course.firstPercentage = (((course.gradeFirst / course.totalStudents) * 100).toFixed(0));
            course.twoOnePercentage = (((course.gradeTwoOne / course.totalStudents) * 100).toFixed(0));
            course.twoTwoPercentage = (((course.gradeTwoTwo / course.totalStudents) * 100).toFixed(0));
            course.thirdPercentage = (((course.gradeThird / course.totalStudents) * 100).toFixed(0));
            course.failPercentage = (((course.gradeFail / course.totalStudents) * 100).toFixed(0));
        }
        else {
            course.firstPercentage = 0;
            course.twoOnePercentage = 0;
            course.twoTwoPercentage = 0;
            course.thirdPercentage = 0;
            course.failPercentage = 0;
        }

    });
    console.log(stats);
    console.log(studentStats);


    res.render("dashboard", { studentStats });
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.render("loggedout");

});

app.get("/studentmgmt", async (req, res) => {
    const studentssql = `SELECT student.id AS stuID, firstName, lastName, email, courseID, graduationYear, awardID, course.title, award.classification  FROM student
    INNER JOIN course 
    ON student.courseID = course.id
    LEFT JOIN award
    ON student.awardid = award.id `;
    const [students] = await db.promise().query(studentssql);
    res.render("studentmgmt", { students });
});

app.post("/addstudent", async (req, res) => {
    const addOfficerForm = { ...req.body };
    const insertStudentSQL = `INSERT INTO student (firstName, lastName, email, courseID, graduationYear)
VALUES (?, ?, ?, ?, ?)`
    const params = [
        addOfficerForm.studentFirstName, addOfficerForm.studentLastName,
        addOfficerForm.studentEmail,
        addOfficerForm.studentCourseName,
        addOfficerForm.graduationYear]
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

app.get("/deletestudent/:eid", async (req, res) => {
    //const adminId <---- Need to add in authorisation;
    const studentId = req.params.eid;
    const singlestudentSQL = `SELECT * FROM student WHERE id = ?`
    const [student] = await db.promise().query(singlestudentSQL, [studentId]);
    const coursesql = `SELECT * FROM course`
    const [courses] = await db.promise().query(coursesql);
    res.render("studentdelete", { student, courses });
})

app.post("/deletestudent/", async (req, res) => {
    //const adminId <---- Need to add in authorisation;
    const deleteStudentForm = { ...req.body };
    const deleteSingleStudent = `DELETE FROM student WHERE student.id = ? `
    const params = [deleteStudentForm.studentid];

    try {
        const [student] = await db.promise().query(deleteSingleStudent, [params]);

    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }

    res.send(`<h2> Student ${deleteStudentForm.studentid} succesfully deleted.
         </h2> `);
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
        addOfficerForm.officerPassword,

    ];


    console.log(req.body)
    try {
        const [insertOfficer] = await db.promise().query(insertOfficerSQL, params);


        const insertMngdCourseSQL = `INSERT INTO managedcourses (systemUserId, courseID) VALUES (?, ?)`
        const insertedOfficer = [insertOfficer.insertId,
        addOfficerForm.officerCourseName];

        const [insertMngdCourse] = await db.promise().query(insertMngdCourseSQL, insertedOfficer);


        res.send(`<H2> New officer succesfully added </h2> <br> 
                click <a href = "/officermgmtt"> here </a> to return to officer management `);
    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }

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


app.post("/editofficer", async (req, res) => {
    const updateOfficerForm = { ...req.body };
    const updatOfficerSQL = `UPDATE systemuser SET firstName = ?, lastName = ?, 
    email = ?, role = ?, password = ?
    WHERE id = ?`;
    const updateParams = [
        updateOfficerForm.officerFirstName,
        updateOfficerForm.officerLastName,
        updateOfficerForm.officerEmail,
        updateOfficerForm.officerRole,
        updateOfficerForm.officerPassword,
        updateOfficerForm.officerid];

    const updateCoursesParams = [
        updateOfficerForm.officerid,
        updateOfficerForm.courseName,
        updateOfficerForm.officerid];

    try {

        const [result] = await db.promise().query(updatOfficerSQL, updateParams);
        const deleteManagedCourses = `DELETE FROM managedcourses WHERE systemuserID = ? `
        await db.promise().query(deleteManagedCourses, updateOfficerForm.officerid);
        for (let courseid in updateOfficerForm.courseName) {
            const updateMngdCourseSQL = `INSERT INTO managedcourses (systemUserID, courseID) VALUES (?,?)`

            await db.promise().query(updateMngdCourseSQL, [updateOfficerForm.officerid, updateOfficerForm.courseName[courseid], updateOfficerForm.officerid]);
        }


        res.send(`<H2> Changes have been succesfully made. </h2> <br>User 
            ${updateOfficerForm.officerid} has been updated to reflect:
            <ul>
            <li> First Name: ${updateOfficerForm.officerFirstName}</li>
            <li> Last Name: ${updateOfficerForm.officerLastName}</li>
            <li> Email Address: ${updateOfficerForm.officerEmail}</li>
            <li> Role: ${updateOfficerForm.officerRole}</li>
            <li> CourseID: ${updateOfficerForm.courseName}</li>
            </ul> <br> 
                Please click <a href = "/officermgmt"> here </a> to return to officer
                management `)

    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }


});

app.get("/deleteofficer/:eid", async (req, res) => {
    //const adminId <---- Need to add in authorisation;
    const officerId = req.params.eid;
    const singleofficerSQL = `SELECT * FROM systemuser WHERE id = ?`
    const [officer] = await db.promise().query(singleofficerSQL, [officerId]);
    console.log(officer);
    res.render("officerdelete", { officer });
})

app.post("/deleteofficer/", async (req, res) => {

    //const adminId <---- Need to add in authorisation;
    const deleteOfficerForm = { ...req.body };
    const deleteSingleOfficer = `DELETE FROM systemuser WHERE systemuser.id = ? `
    const params = [deleteOfficerForm.officerid];

    const updateLegacyNameSQL = `UPDATE award SET legacyApprover = (SELECT CONCAT(firstName, ' ', lastName) 
    FROM systemuser WHERE id = ?), systemUserID = NULL WHERE award.systemUserID = ?`
    const updateParams = [deleteOfficerForm.officerid, deleteOfficerForm.officerid];

    try {
        const [legacyName] = await db.promise().query(updateLegacyNameSQL, updateParams);
        const [officer] = await db.promise().query(deleteSingleOfficer, [params]);

    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }

    res.send(`<h2> Officer ${deleteOfficerForm.officerid} succesfully deleted.
         </h2>  <br>
        Please click <a href="/officermgmt"> here </a> to return to officer management`);
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
        // cycles through original results and if module ID 
        // doesnt exist or where resit is true then add to new map
        const cleanedResults = [];
        results.forEach((result) => {
            if (!cleanedResults[result.moduleID] || result.resit === 1) {
                cleanedResults[result.moduleID] = result;
            }
        });


        //STEP 2 - calculate the final scores for each year and total
        let yearOneResults = 0;
        let yearTwoResults = 0;
        let yearThreeResults = 0;
        let yearOneFail = false;

        cleanedResults.forEach((result) => {
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

        //STEP 3 - Confirm classification based on final score, populate an array with both score and classificaiton
        function calcFinalClassification(y1isFail, y2, y3, TOTAL_CREDS) {

            let classification = [0,];

            if (!y1isFail) {
                classification[0] += (y2 / TOTAL_CREDS * 0.30) + (y3 / TOTAL_CREDS * 0.70);
            } else {
                classification[1] = "Fail";
                return classification;
            }

            if (classification[0] <= 39.99) {
                classification[1] = "Fail";
            }
            else if (classification[0] >= 40 && classification[0] <= 49.99) {
                classification[1] = "Third Class Honours";
            }
            else if (classification[0] >= 50 && classification[0] <= 59.99) {
                classification[1] = "Lower Second Class (2:2)";
            }
            else if (classification[0] >= 60 && classification[0] <= 69.99) {
                classification[1] = "Upper Second Class (2:1)";
            }
            else {
                classification[1] = "First Class Honours (1st)";
            }
            console.log(classification[1]);
            console.log(classification[0]);
            return classification;
        }

        console.log(studentClassification = calcFinalClassification(yearOneFail, yearTwoResults, yearThreeResults, TOTAL_CREDS));


    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }

    const insertClassificationSQL = `INSERT INTO award (finalScore, classification, classificationStatus, systemUserID) VALUES(?, ?, ?, ?)`
    const insertParams = [
        studentClassification[0],
        studentClassification[1],
        "In Progress",
        2,
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