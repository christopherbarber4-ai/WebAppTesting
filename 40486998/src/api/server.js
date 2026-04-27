import express from "express";
const server = express();
const PORT = 4000;
import db from "../web/middleware/db.js";
import services from "../web/middleware/services.js"

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
server.use(express.urlencoded({ extended: true }));

//endpoint for all students
server.get('/students/', async (req, res) => {

    const studentSQL = `SELECT * FROM student`;
    let [rowsData] = await db.promise().query(studentSQL);

    const result = {
        data: rowsData,
        info: "request successful"
    }

    res.json(result);
});


//endpoint for specific students
server.get('/students/:rowid', async (req, res) => {

    const stuid = req.params.rowid;
    const studentSQL = `SELECT * FROM student WHERE id = ?`;
    let [rowsData] = await db.promise().query(studentSQL, [stuid]);
    rowsData = rowsData[0] || [];
    const result = {
        data: rowsData,
        info: "request successful"
    }

    res.json(result);
});


//endpoint for all courses
server.get('/courses/', async (req, res) => {

    const courseSQL = `SELECT * FROM course`;
    let [rowsData] = await db.promise().query(courseSQL);

    const result = {
        data: rowsData,
        info: "request successful"
    }

    res.json(result);
});

//endpoint for specific courses
server.get('/courses/:rowid', async (req, res) => {

    const courseId = req.params.rowid;
    const courseSQL = `SELECT * FROM course WHERE id = ?`;
    let [rowsData] = await db.promise().query(courseSQL, [courseId]);
    rowsData = rowsData[0] || [];
    const result = {
        data: rowsData,
        info: "request successful"
    }

    res.json(result);
});

//endpoint for POST student

server.post("/students/add", async (req, res) => {
    const addStudentForm = { ...req.body };
    const insertStudentSQL = `INSERT INTO student (firstName, lastName, email, courseID, graduationYear)
VALUES (?, ?, ?, ?, ?)`
    const params = [

        addStudentForm.firstName, addStudentForm.lastName,
        addStudentForm.email,
        addStudentForm.courseID,
        addStudentForm.graduationYear]
        ;

    try {
        const [result] = await db.promise().query(insertStudentSQL, params);
        const respObj = {
            id: result.insertId,
            message: `${addStudentForm.firstName} added to student table.`,
        }
        res.json(respObj);

    } catch (err) {
        res.json({ error: err.message });
    }
});

//endpoint for POST officer


server.post("/systemuser/add", async (req, res) => {
    const addOfficerForm = { ...req.body };
    const insertOfficerSQL = `INSERT INTO systemuser (firstName, lastName, email, role, password)
VALUES (?, ?, ?, ?, ?)`

    const params = [
        addOfficerForm.officerFirstName, addOfficerForm.officerLastName,
        addOfficerForm.officerEmail,
        addOfficerForm.officerRole,
        addOfficerForm.officerPassword,

    ];

    try {
        const [result] = await db.promise().query(insertOfficerSQL, params);
        const respObj = {
            id: result.insertId,
            message: `${addOfficerForm.officerFirstName} added to system user table.`,
        }
        res.json(respObj);

    } catch (err) {
        res.json({ error: err.message });
    }
});



//PATCH Route to demonstrate UPDATING records - in this cases, system users.

server.patch("/updatesystemuser", async (req, res) => {

    const fData = { ...req.body };

    const patchSQL = `UPDATE systemuser SET role = ? WHERE id = ? `

    const params = [
        fData.officerRole,
        fData.id
    ];


    try {


        const [result] = await db.promise().query(patchSQL, params);
        const respObj = {
            id: fData.id,
            message: `Role updated to ${fData.officerRole}`,
        }
        res.json(respObj);


    } catch (err) {
        res.json({
            error: err.message
        });
    }

})



//OFFICER MANAGEMENT ROUTE UPDATED WTIH REST API STRUCTURE
server.get("/officermgmt2", async (req, res) => {

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


    const jsonresults = {
        data: users,
        info: "request successful"
    }

    res.json(jsonresults);

});


//GET student route - used in the application route is /apitest
server.get("/studentmgmt", async (req, res) => {

    const studentssql = `SELECT student.id AS stuID, firstName, lastName, email, student.courseID, graduationYear, 
        awardID, course.title, award.classification, award.manualOverrideReq, award.systemUserID FROM student
    INNER JOIN course 
    ON student.courseID = course.id
    INNER JOIN managedcourses ON course.id = managedcourses.courseID
    LEFT JOIN award
    ON student.awardid = award.id`

    const [students] = await db.promise().query(studentssql)

    const jsonStudents = {
        data: students,
        info: "request succesful"
    }

    res.json(jsonStudents);


});


server.listen(PORT, () => {
    console.log(`API started on port ${PORT}`);
});