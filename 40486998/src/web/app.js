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
const TOTAL_CREDS = 120;

let userAccessLevel = "";

//SESSIONS SET UP

app.use(sessions({ // creates a session object on the node server
    secret: 'cbarberproject',
    saveUninitialized: true,
    cookie: { maxAge: oneHour },
    resave: false
}));

function checkAuth(req, res, next) {
    if (req.session.authen) {

        next();
    } else {
        res.redirect("/error");
    }
}

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

app.get("/login", (req, res) => {
    res.render("login");
})

app.post("/login", async (req, res) => {
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



app.get("/landing", async (req, res) => {
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

app.get("/dashboard", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(view)" || userAccessLevel === "officer(edit)") {

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
            console.log(stat.title, "finalScore:", stat.finalScore, "awardID:", stat.awardID);
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
            console.log(course.title, "gradedStudents:", course.gradedStudents, "allGradedScores:", course.allGradedScores);
            course.studentCountPercentage = ((course.totalStudents / globalStudentCount) * 100).toFixed(0);
            if (course.gradedStudents > 0) {
                course.averageScore = (course.allGradedScores / course.gradedStudents).toFixed(2);
            } else {
                course.averageScore = "N/A";
            }


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
        console.log(studentStats)

        res.render("dashboard", { studentStats: studentStats.filter(Boolean), userAccessLevel });
    } else {
        res.redirect("/error");
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.render("loggedout");


});

app.get("/error", (req, res) => {
    res.render("error");
});

app.get("/studentmgmt", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(view)" || userAccessLevel === "officer(edit)") {
        const message = req.session.message;
        req.session.message = null;
        const studentssql = `SELECT student.id AS stuID, firstName, lastName, email, courseID, graduationYear, 
        awardID, course.title, award.classification, award.manualOverrideReq, award.systemUserID FROM student
    INNER JOIN course 
    ON student.courseID = course.id
    LEFT JOIN award
    ON student.awardid = award.id `;
        const [students] = await db.promise().query(studentssql);
        res.render("studentmgmt", { students, userAccessLevel, message });
        console.log(students[0]);

    } else {
        res.redirect("/error");

    }
});

app.get("/studentadd", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(edit)") {
        const message = req.session.message;
        req.session.message = null;

        const studentssql = `SELECT student.id AS stuID, firstName, lastName, email, courseID, graduationYear, awardID, course.title, award.classification  FROM student
    INNER JOIN course 
    ON student.courseID = course.id
    LEFT JOIN award
    ON student.awardid = award.id `;
        const [students] = await db.promise().query(studentssql);
        res.render("studentadd", { userAccessLevel, message, students });

    } else {
        res.redirect("/error");

    }
});

app.post("/addstudent", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(edit)") {
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
            req.session.message = `Student ${addStudentForm.studentFirstName} ${addStudentForm.studentLastName} successfully added`;
            res.redirect("/studentmgmt");
        } catch (error) {
            res.status(500).json(error);
            console.log(error);
        }
    }
    else {
        res.redirect("/error");
    }

});


app.get("/editstudent/:eid", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(edit)") {
        const studentId = req.params.eid;
        const singlestudentSQL = `SELECT * FROM student WHERE id = ?`
        const [student] = await db.promise().query(singlestudentSQL, [studentId]);
        const coursesql = `SELECT * FROM course`
        const [courses] = await db.promise().query(coursesql);
        res.render("studentupdate", { student, courses, userAccessLevel });
    } else {
        res.redirect("/error");
    }
});

app.post("/editstudent", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
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
        req.session.message = `Student ${updatestudentForm.studentFirstName} ${updatestudentForm.studentLastName} successfully updated`;
        res.redirect("/studentmgmt");

    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }


});

app.get("/deletestudent/:eid", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(edit)") {
        const studentId = req.params.eid;
        const singlestudentSQL = `SELECT * FROM student WHERE id = ?`
        const [student] = await db.promise().query(singlestudentSQL, [studentId]);
        const coursesql = `SELECT * FROM course`
        const [courses] = await db.promise().query(coursesql);
        res.render("studentdelete", { student, courses, userAccessLevel });
    }
    else {
        res.redirect("/error");
    }
});

app.post("/deletestudent/", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(edit)") {
        const deleteStudentForm = { ...req.body };
        const deleteSingleStudent = `DELETE FROM student WHERE student.id = ? `
        const params = [deleteStudentForm.studentid];

        try {
            const [student] = await db.promise().query(deleteSingleStudent, [params]);

        } catch (error) {
            res.status(500).json(error);
            console.log(error);
        }
    }
    else {
        res.redirect("/error");
    }
    req.session.message = `Student ${deleteStudentForm.studentFirstName} ${deleteStudentForm.studentLastName} successfully deleted`;
    res.redirect("/studentmgmt");
});


app.get("/officermgmt", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "admin") {
        const message = req.session.message;
        req.session.message = null;

        const userSQL = `SELECT systemuser.id, systemuser.firstName, systemuser.lastName, 
            systemuser.email, systemuser.role, course.title AS courseTitle
            FROM systemuser
            LEFT JOIN managedcourses ON systemuser.id = managedcourses.systemUserID
            LEFT JOIN course ON managedcourses.courseID = course.id`;
        const [results] = await db.promise().query(userSQL);

        const users = [];
        results.forEach((user) => {
            if (!users[user.id]) {
                users[user.id] = {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    courses: []
                };
            }
            if (user.courseTitle) users[user.id].courses.push(user.courseTitle);
        });

        const coursesql = `SELECT * FROM course`
        const [courses] = await db.promise().query(coursesql);
        res.render("officermgmt", { courses, users, userAccessLevel, message });
    }
    else {
        res.redirect("/error");
    }
});

app.post("/addofficer", async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "admin") {
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


            req.session.message = `Officer ${addOfficerForm.officerFirstName} ${addOfficerForm.officerLastName} successfully added`;
            res.redirect("/officermgmt");
        } catch (error) {
            res.status(500).json(error);
            console.log(error);
        }
    }
    else {
        res.redirect("/error");
    }

});


app.get("/editofficer/:eid", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;

    if (userAccessLevel === "admin") {


        const officerId = req.params.eid;
        const singleofficerSQL = `SELECT * FROM systemuser WHERE id = ?`
        const [officer] = await db.promise().query(singleofficerSQL, [officerId]);
        const coursesql = `SELECT * FROM course`
        const [courses] = await db.promise().query(coursesql);

        res.render("officerupdate", { officer, courses, userAccessLevel });
    }
    else {
        res.redirect("/error");

    }
});


app.post("/editofficer", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "admin") {
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


            req.session.message = `Officer ${updateOfficerForm.officerFirstName} ${updateOfficerForm.officerLastName} successfully updated`;
            res.redirect("/officermgmt");


        } catch (error) {
            res.status(500).json(error);
            console.log(error);
        }
    }
    else {
        res.redirect("/error");

    }



});

app.get("/deleteofficer/:eid", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "admin") {
        const message = req.session.message;
        req.session.message = null;
        const officerId = req.params.eid;
        const singleofficerSQL = `SELECT * FROM systemuser WHERE id = ?`
        const [officer] = await db.promise().query(singleofficerSQL, [officerId]);
        console.log(officer);
        res.render("officerdelete", { officer, userAccessLevel, message });
    }
    else {
        res.redirect("/error");
    }
})

app.post("/deleteofficer/", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "admin") {
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
    }
    else {
        res.redirect("/error");
    }

    req.session.message = `Officer ${deleteOfficerForm.officerFirstName} ${deleteOfficerForm.officerLastName} successfully added`;
    res.redirect("/officermgmt");
});



app.get("/coursemgmt", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "admin") {
        const message = req.session.message || null;
        req.session.message = null;
        const coursesql = `SELECT course.id, course.title, 
            classificationrules.classificationYear2Weight, classificationrules.classificationYear3Weight, 
            classificationrules.resitMax,
            classificationrules.failBoundary,classificationrules.thirdLower, classificationrules.thirdUpper, classificationrules.twoTwoLower,
            classificationrules.twoTwoUpper, classificationrules.twoOneLower, classificationrules.twoOneUpper, classificationrules.firstBoundary
            FROM course
            LEFT JOIN classificationrules ON course.id = classificationrules.courseID`;

        try {
            const [courses] = await db.promise().query(coursesql);
            console.log(courses[0]);


            res.render("coursemgmt", { courses, userAccessLevel, message });
        } catch (error) {
            res.status(500).json(error);
            console.log(error);
        }
    }
    else {
        res.redirect("/error");
    }
});

app.post("/addcourse", checkAuth, async (req, res) => {
    if (userAccessLevel === "admin") {
        const addCourseForm = { ...req.body };
        const insertCourseSQL = `INSERT INTO course (title)
VALUES (?)`
        const params = [
            addCourseForm.courseTitle];

        try {
            const [result] = await db.promise().query(insertCourseSQL, params)

            const insertedCourse = [result.insertId];

            const insertRulesSQL = `INSERT INTO classificationrules 
            (classificationYear2Weight, classificationYear3Weight,resitMax,failBoundary,thirdLower,thirdUpper,twoTwoLower, twoTwoUpper,twoOneLower,twoOneUpper,firstBoundary, courseID) 
            VALUES (0.30,0.70,40,39.99,40,49.99,50,59.99,60,69.99,70, ?)`;
            await db.promise().query(insertRulesSQL, [insertedCourse]);




            req.session.message = `Course ${addCourseForm.courseTitle} successfully added`;
            res.redirect("/coursemgmt");
        } catch (error) {
            res.status(500).json(error);
            console.log(error);
        }
    }
    else {
        res.redirect("/error");
    }

});

//logic for auto classification

//VIEW ALL RESULTS

app.get("/viewresults/:eid", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(view)" || userAccessLevel === "officer(edit)") {

        const message = req.session.message;
        req.session.message = null;

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



        const studentSQL = `SELECT student.id, firstName, lastName, courseID 
    FROM student WHERE student.id = ?`;
        const [student] = await db.promise().query(studentSQL, [studentId]);



        res.render("viewresults", { totalResults, courses, award, student, userAccessLevel, message });

    }



    else {
        res.redirect("/error");
    }
});

app.get("/resultadd/:eid", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(edit)") {

        const message = req.session.message;
        req.session.message = null;

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



        const studentSQL = `SELECT student.id, firstName, lastName, courseID 
    FROM student WHERE student.id = ?`;
        const [student] = await db.promise().query(studentSQL, [studentId]);


        res.render("resultadd", { totalResults, courses, award, student, userAccessLevel, message });

    }

    else {
        res.redirect("/error");
    }
});



app.post("/addresult", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(edit)") {
        const addResultForm = { ...req.body };

        const checkExistingScoreSQL = `SELECT * FROM results WHERE studentId = ? AND moduleID = ?`;

        const [existingScore] = await db.promise().query(checkExistingScoreSQL, 
            [addResultForm.studentId,addResultForm.studentModule])

            //if there is an existing sore and the form is not being submitted as a resit then return to view results

        if (existingScore.length > 0 && addResultForm.isResit == 0) {
            req.session.message = `Error - A score already exists for this module. Score not added`
            res.redirect(`/viewresults/${addResultForm.studentId}`);
            return;
        }

        //if a resit and adding a score then delete the old one first.
        try {
            if (addResultForm.isResit == 1) {
                const deleteOldScoreSQL = `DELETE FROM results WHERE studentId = ? AND moduleID = ?`
                const [deleteScore] = await db.promise().query(deleteOldScoreSQL, 
                    [addResultForm.studentId, addResultForm.studentModule
                ]);
                console.log("deleted rows:", deleteScore.affectedRows);

                const insertResitScoreSQL = `INSERT INTO results (studentId, courseId, moduleID, score, resit) 
        VALUES (?,?,?,?,?)`;
                const insertedResitScore = await db.promise().query(insertResitScoreSQL, [
                    addResultForm.studentId,
                    addResultForm.courseId,
                    addResultForm.studentModule,
                    addResultForm.moduleScore,
                    addResultForm.isResit
                ]);
            } else { //standard insert for new module score and non resit
                const insertResultSQL = `INSERT INTO results (studentId, courseId, moduleID, score, resit) 
    VALUES (?,?,?,?,?)`;
                const params =
                    [addResultForm.studentId,
                    addResultForm.courseId,
                    addResultForm.studentModule,
                    addResultForm.moduleScore,
                    addResultForm.isResit
                    ];
                const [result] = await db.promise().query(insertResultSQL, params)
            }
            req.session.message = `Result for StudentID: ${addResultForm.studentId} for ModuleID:  ${addResultForm.studentModule} successfully added`;
            res.redirect(`/viewresults/${addResultForm.studentId}`);
            console.log(req.body)
        } catch (error) {
            res.status(500).json(error);
            console.log(error);
        }
    }

    else {
        res.redirect("/error");
    }

});

app.get("/editclassification/:eid", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(edit)") {
        const studentId = req.params.eid;
        const studentssql = `SELECT student.id, student.firstName, student.lastName,
            award.id AS awardID, award.finalScore, award.classification, 
            award.classificationStatus, award.decision_summary, award.manualOverrideReq
            FROM student
            INNER JOIN award ON student.awardID = award.id
            WHERE student.id = ?`;
        const [student] = await db.promise().query(studentssql, [studentId]);
        res.render("editclassification", { student, userAccessLevel });
    } else {
        res.redirect("/error");
    }
});

app.post("/editclassification", checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(edit)") {
        const editClassificationform = { ...req.body };
        let manualOverride;
        if (editClassificationform.classification !== editClassificationform.originalClassification) {
            manualOverride = 1;
        } else {
            manualOverride = 0;
        }
        const updateAwardSQL = `UPDATE award SET 
            classification = ?, 
            classificationStatus = ?,
            decision_summary = ?,
            manualOverrideReq = ?
            WHERE id = ?`;
        const updateAwardParams = [
            editClassificationform.classification,
            editClassificationform.classificationStatus,
            editClassificationform.decisionSummary,
            manualOverride,
            editClassificationform.awardID
        ];

        try {
            await db.promise().query(updateAwardSQL, updateAwardParams);
            req.session.message = `Classification for Student ${editClassificationform.studentFirstName} ${editClassificationform.studentLastName} successfully updated`;
            res.redirect(`/viewresults/${editClassificationform.studentId}`);
        } catch (error) {
            res.status(500).json(error);
            console.log(error);
        }
    } else {
        res.redirect("/error");
    }
});


app.post("/addclassification/", checkAuth, async (req, res) => {
    const message = req.session.message;
    req.session.message = null;
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(edit)") {
        let studentClassification;
        const classificationForm = { ...req.body };
        const studentId = [classificationForm.studentId];
        const resultsSQL = `SELECT * FROM results
    INNER JOIN student 
    ON results.studentId = student.id
    INNER JOIN modules 
    ON results.moduleID = modules.id WHERE student.id = ?`;

        const classificatonRulesSQL = `SELECT * FROM classificationRules`



        try {

            const [results] = await db.promise().query(resultsSQL, [studentId]);
            console.log(results.length);

            if (results.length !== 17) { //17 modules including dissertation 6 modules y1,y2 and 5 y3.
                req.session.message = `Error, Student must have 17 completed Module results before being able to 
            calculate the overall course classification. Current number of Module results awarded: ${results.length}.`
                res.redirect(`/viewresults/${studentId}`);
            }




            //STEP 1 - ensure where resits, the resit result is taken forwards.
            // cycles through original results and if module ID 
            // doesnt exist or where resit is true then add to new array
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

            const [rules] = await db.promise().query(classificatonRulesSQL);
            const standardRules = rules[0];


            let classificationYear2Weight = standardRules.classificationYear2Weight;
            let classificationYear3Weight = standardRules.classificationYear3Weight;
            let classificationFail = standardRules.failBoundary;
            let classificationThirdLower = standardRules.thirdLower;
            let classificationThirdHigher = standardRules.thirdUpper;
            let classificationTwoTwoLower = standardRules.twoTwoLower;
            let classificationTwoTwoHigher = standardRules.twoTwoUpper;
            let classificationTwoOneLower = standardRules.twoOneLower;
            let classificationTwoOneHigher = standardRules.twoOneUpper;
            let classificationFirst = standardRules.firstBoundary;

            //STEP 3 - Confirm classification based on final score, populate an array with both score and classificaiton
            function calcFinalClassification(y1isFail, y2, y3, TOTAL_CREDS) {

                let classification = [0,];

                if (!y1isFail) {
                    classification[0] += (y2 / TOTAL_CREDS * classificationYear2Weight) + (y3 / TOTAL_CREDS * classificationYear3Weight);
                } else {
                    classification[1] = "Fail";
                    return classification;
                }

                if (classification[0] <= classificationFail) {
                    classification[1] = "Fail";
                }
                else if (classification[0] >= classificationThirdLower && classification[0] <= classificationThirdHigher) {
                    classification[1] = "Third Class Honours";
                }
                else if (classification[0] >= classificationTwoTwoLower && classification[0] <= classificationTwoTwoHigher) {
                    classification[1] = "Lower Second Class (2:2)";
                }
                else if (classification[0] >= classificationTwoOneLower && classification[0] <= classificationTwoOneHigher) {
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


            req.session.message = `Classification for Student ${classificationForm.studentId} succesfully added`;
            res.redirect(`viewresults/${classificationForm.studentId}`);


        } catch (error) {
            res.status(500).json(error);
            console.log(error);
        }
    }
    else {
        res.redirect("/error");
    }




});




app.listen(PORT, () => {
    console.log(`Server is live! http://localhost:${PORT}`);
});