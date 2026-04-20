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

viewRouter.get("/dashboard", services.checkAuth, async (req, res) => {
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

        res.render("officer/dashboard", { studentStats: studentStats.filter(Boolean), userAccessLevel });
    } else {
        res.redirect("/error");
    }
});

viewRouter.get("/viewresults/:eid", services.checkAuth, async (req, res) => {
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



        res.render("officer/viewresults", { totalResults, courses, award, student, userAccessLevel, message });

    }



    else {
        res.redirect("/error");
    }
});



viewRouter.get("/studentmgmt", services.checkAuth, async (req, res) => {
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
        res.render("officer/studentmgmt", { students, userAccessLevel, message });
        console.log(students[0]);

    } else {
        res.redirect("/error");

    }
});



viewRouter.get("/error", (req, res) => {
    res.render("error");
});

viewRouter.get("/logout", (req, res) => {
    req.session.destroy();
    res.render("loggedout");


});


export default viewRouter;