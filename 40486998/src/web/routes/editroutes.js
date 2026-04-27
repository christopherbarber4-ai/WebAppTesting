import express from "express";
const editRouter = express.Router();
import services from "../middleware/services.js";
import db from "../middleware/db.js";
import fs from "fs";
import { stringify } from "csv-stringify";
import axios from "axios";


//values to help with readabillity for classification calculation
const RESIT_MAX = 40;
const TOTAL_CREDS = 120;



//fairly complicated in order to generate useful dashboard info
//step 1 - course data adn left join student/award = using courseID
//step 2 - create studentStats array with unique course objects then go through each record and update counts, total students, firsts etc.
//step 3 - go through the array of course objects and add in % of students and average score    
//step 4 - go through array and calculate %'s this time of each classification
editRouter.get("/dashboard", services.checkAuth, async (req, res) => {
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

            //if courseIf doesnt exist, create object with these keys and values.
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

            //if each stat has at least one student on it, count
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
        //two loops to count 
        // both number of students and also number of classifications for each course
        studentStats.forEach((course) => {
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


        res.render("officer/dashboard", { studentStats: studentStats.filter(Boolean), userAccessLevel }); // Boolean - only passes studenStats that are not null
    } else {
        res.redirect("/error");
    }
});

editRouter.get("/exportData", services.checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(view)" || userAccessLevel === "officer(edit)") {

        const courseDataSQL = `SELECT course.id as courseID,student.id AS stuID, course.title, award.classification, award.finalScore, student.awardID FROM course
    LEFT JOIN student 
    ON student.courseID = course.id
    LEFT JOIN award
    ON student.awardID = award.id `;
        const [stats] = await db.promise().query(courseDataSQL);

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

        //set up key stats for export and ensure no empty objects in array
        const exportData = studentStats.filter(Boolean);

        //specific columns to show
        const columns = [
            "title", "totalStudents", "studentCountPercentage", "averageScore",
            "gradeFirst", "firstPercentage", "gradeTwoOne", "twoOnePercentage",
            "gradeTwoTwo", "twoTwoPercentage", "gradeThird", "thirdPercentage",
            "gradeFail", "failPercentage"
        ];

        //converts array of course objects into (csv formatted) string. stringify is from the csv package
        stringify(exportData, { header: true, columns: columns }, (err, output) => { // header - column name as first row of csv
            if (err) {
                console.log(err);
                return;
            }
            fs.writeFile("exportDashboard.csv", output, "utf-8", (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("data exported");
                }

            })
        });
    } else {
        res.redirect("/error");
    }
});

//checks where where student id and systemuser id match across student and managed courses. session.authen being the system user id
editRouter.get("/viewresults/:eid", services.checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(view)" || userAccessLevel === "officer(edit)") {

        const message = req.session.message;
        req.session.message = null;

        const studentId = req.params.eid;


        const managedStudentCheckSQL = `SELECT student.id FROM student
        INNER JOIN managedcourses ON student.courseID = managedcourses.courseID
        WHERE student.id = ? AND managedcourses.systemUserID = ?`;
        const [managedStudents] = await db.promise().query(managedStudentCheckSQL,
            [studentId, req.session.authen]);
        if (managedStudents.length === 0) {
            return res.redirect("/error");
        }

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


//'As' alias included as multiple tables have id and student id was being overwritten.
editRouter.get("/studentmgmt", services.checkAuth, async (req, res) => {

    const userAccessLevel = req.session.userAccessLevel;

    if (userAccessLevel === "officer(view)" || userAccessLevel === "officer(edit)") {
        const message = req.session.message;
        req.session.message = null;
        const studentssql = `SELECT student.id AS stuID, firstName, lastName, email, student.courseID, graduationYear, 
        awardID, course.title, award.classification, award.manualOverrideReq, award.systemUserID FROM student
    INNER JOIN course 
    ON student.courseID = course.id
    INNER JOIN managedcourses ON course.id = managedcourses.courseID
    LEFT JOIN award
    ON student.awardid = award.id
    WHERE managedcourses.systemUserID= ? `;
        const [students] = await db.promise().query(studentssql, [req.session.authen]);

        res.render("officer/studentmgmt", { students, userAccessLevel, message });


    } else {
        res.redirect("/error");

    }
});

editRouter.get("/studentadd", services.checkAuth, async (req, res) => {
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

        const coursesql = `SELECT * FROM course`
        const [courses] = await db.promise().query(coursesql);

        res.render("officer/studentadd", { userAccessLevel, message, students, courses });

    } else {
        res.redirect("/error");

    }
});

editRouter.post("/addstudent", services.checkAuth, async (req, res) => {
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


editRouter.get("/editstudent/:eid", services.checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(edit)") {
        const studentId = req.params.eid;

        const managedStudentCheckSQL = `SELECT student.id FROM student
        INNER JOIN managedcourses ON student.courseID = managedcourses.courseID
        WHERE student.id = ? AND managedcourses.systemUserID = ?`;
        const [managedStudents] = await db.promise().query(managedStudentCheckSQL,
            [studentId, req.session.authen]);
        if (managedStudents.length === 0) {
            return res.redirect("/error");
        }

        const singlestudentSQL = `SELECT * FROM student WHERE id = ?`
        const [student] = await db.promise().query(singlestudentSQL, [studentId]);
        const coursesql = `SELECT * FROM course`
        const [courses] = await db.promise().query(coursesql);
        res.render("officer/studentupdate", { student, courses, userAccessLevel });
    } else {
        res.redirect("/error");
    }
});

editRouter.post("/editstudent", services.checkAuth, async (req, res) => {
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

        req.session.message = `Student ${updatestudentForm.studentFirstName} ${updatestudentForm.studentLastName} successfully updated`;
        res.redirect("/studentmgmt");

    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }


});

editRouter.get("/deletestudent/:eid", services.checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    const studentId = req.params.eid;
    if (userAccessLevel === "officer(edit)") {

        const managedStudentCheckSQL = `SELECT student.id FROM student
        INNER JOIN managedcourses ON student.courseID = managedcourses.courseID
        WHERE student.id = ? AND managedcourses.systemUserID = ?`;
        const [managedStudents] = await db.promise().query(managedStudentCheckSQL,
            [studentId, req.session.authen]);
        if (managedStudents.length === 0) {
            return res.redirect("/error");
        }

        const singlestudentSQL = `SELECT * FROM student WHERE id = ?`
        const [student] = await db.promise().query(singlestudentSQL, [studentId]);
        const coursesql = `SELECT * FROM course`
        const [courses] = await db.promise().query(coursesql);
        res.render("officer/studentdelete", { student, courses, userAccessLevel });
    }
    else {
        res.redirect("/error");
    }
});

editRouter.post("/deletestudent/", services.checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    const deleteStudentForm = { ...req.body };
    if (userAccessLevel === "officer(edit)") {

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


editRouter.get("/resultadd/:eid", services.checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(edit)") {

        const message = req.session.message;
        req.session.message = null;

        const studentId = req.params.eid;

        const managedStudentCheckSQL = `SELECT student.id FROM student
        INNER JOIN managedcourses ON student.courseID = managedcourses.courseID
        WHERE student.id = ? AND managedcourses.systemUserID = ?`;
        const [managedStudents] = await db.promise().query(managedStudentCheckSQL,
            [studentId, req.session.authen]);
        if (managedStudents.length === 0) {
            return res.redirect("/error");
        }

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


        res.render("officer/resultadd", { totalResults, courses, award, student, userAccessLevel, message });

    }

    else {
        res.redirect("/error");
    }
});



editRouter.post("/addresult", services.checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    const message = req.session.message;
    req.session.message = null;
    if (userAccessLevel === "officer(edit)") {
        const addResultForm = { ...req.body };

        const checkExistingScoreSQL = `SELECT * FROM results WHERE studentId = ? AND moduleID = ?`;

        const [existingScore] = await db.promise().query(checkExistingScoreSQL,
            [addResultForm.studentId, addResultForm.studentModule])

        //if there is an existing score and the form is not being submitted as a 'resit' then return to view results

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
            res.redirect(`/resultadd/${addResultForm.studentId}`);

        } catch (error) {
            res.status(500).json(error);
            console.log(error);
        }
    }

    else {
        res.redirect("/error");
    }

});

editRouter.get("/editclassification/:eid", services.checkAuth, async (req, res) => {
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
        res.render("officer/editclassification", { student, userAccessLevel });
    } else {
        res.redirect("/error");
    }
});

editRouter.post("/editclassification", services.checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(edit)") {
        const editClassificationform = { ...req.body };
        let manualOverride;
        if (editClassificationform.classification !== editClassificationform.currentClassification) {
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


editRouter.post("/addclassification/", services.checkAuth, async (req, res) => {
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

        const classificatonRulesSQL = `SELECT * FROM classificationRules
        INNER JOIN student on classificationrules.courseID = student.courseID
        WHERE student.id = ?`



        try {

            const [results] = await db.promise().query(resultsSQL, [studentId]);


            if (results.length !== 17) { //17 modules including dissertation 6 modules y1,y2 and 5 y3.
                req.session.message = `Error, Student must have 17 completed Module results before being able to 
            calculate the overall course classification. Current number of Module results awarded: ${results.length}.`
                return res.redirect(`/viewresults/${studentId}`);
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

            const [rules] = await db.promise().query(classificatonRulesSQL, [studentId]);




            let classificationYear2Weight = rules[0].classificationYear2Weight;
            let classificationYear3Weight = rules[0].classificationYear3Weight;
            let classificationFail = rules[0].failBoundary;
            let classificationThirdLower = rules[0].thirdLower;
            let classificationThirdHigher = rules[0].thirdUpper;
            let classificationTwoTwoLower = rules[0].twoTwoLower;
            let classificationTwoTwoHigher = rules[0].twoTwoUpper;
            let classificationTwoOneLower = rules[0].twoOneLower;
            let classificationTwoOneHigher = rules[0].twoOneUpper;
            let classificationFirst = rules[0].firstBoundary;

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
                else if (classification[0] >= classificationFirst) {
                    classification[1] = "First Class Honours (1st)";
                }
                console.log(classification[0], classification[1]);

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
            req.session.authen,
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


editRouter.get("/coursemgmt", services.checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "admin" || userAccessLevel === "officer(edit)") {
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



            res.render("officer/coursemgmt", { courses, userAccessLevel, message });
        } catch (error) {
            res.status(500).json(error);
            console.log(error);
        }
    }
    else {
        res.redirect("/error");
    }
});


editRouter.get("/editcourse/:eid", services.checkAuth, async (req, res) => {


    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "admin" || userAccessLevel === "officer(edit)") {
        const message = req.session.message || null;
        req.session.message = null;

        const courseId = req.params.eid;
        const coursesql = `SELECT course.id, course.title, 
            classificationrules.classificationYear2Weight, classificationrules.classificationYear3Weight, 
            classificationrules.resitMax,
            classificationrules.failBoundary,classificationrules.thirdLower, classificationrules.thirdUpper, classificationrules.twoTwoLower,
            classificationrules.twoTwoUpper, classificationrules.twoOneLower, classificationrules.twoOneUpper, classificationrules.firstBoundary
            FROM course
            LEFT JOIN classificationrules ON course.id = classificationrules.courseID
            WHERE course.id = ?`;

        try {
            const [courses] = await db.promise().query(coursesql, [courseId]);



            res.render("officer/courseedit", { courses, userAccessLevel, message });

        } catch (error) {
            res.status(500).json(error);
            console.log(error);
        }
    }
    else {
        res.redirect("/error");
    }

});

editRouter.post("/editcourse", services.checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    const editCourseForm = { ...req.body };
    const updateSQL = `UPDATE classificationrules SET 
    classificationYear2Weight = ?, classificationYear3Weight = ?, resitMax = ?, failBoundary = ?, thirdLower = ?, thirdUpper = ?, twoTwoLower = ?, twoTwoUpper = ?, twoOneLower = ?,  twoOneUpper = ?, firstBoundary = ?
    WHERE courseID = ?`;
    const updateParams = [
        editCourseForm.year2Weight,
        editCourseForm.year3Weight,
        editCourseForm.resitMax,
        editCourseForm.failBoundary,
        editCourseForm.thirdLower,
        editCourseForm.thirdUpper,
        editCourseForm.twoTwoLower,
        editCourseForm.twoTwoUpper,
        editCourseForm.twoOneLower,
        editCourseForm.twoOneUpper,
        editCourseForm.firstBoundary,
        editCourseForm.courseId
    ]

    try {
        const [result] = await db.promise().query(updateSQL, updateParams);
        console.log(result);

        req.session.message = `Course ${editCourseForm.courseTitle} successfully updated`;
        res.redirect("/coursemgmt");

    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }


});


//ONE ROUTE ONLY TO DEMONSTRATE SERVER SIDE RENDERING OF THE API ROUTES I HAVE MADE
editRouter.get('/apitest', services.checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "officer(edit)") {
        try {
            const ep = `http://localhost:4000/studentmgmt`;
            const rows = await axios.get(ep);
            const data = rows.data.data;

            res.render('officer/apitest', { data, userAccessLevel });
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    }
    else {
        res.redirect("/error");
    }
});




export default editRouter;