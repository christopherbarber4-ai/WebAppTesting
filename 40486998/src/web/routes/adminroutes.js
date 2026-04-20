import express from "express";
const adminRouter = express.Router();
import services from "../middleware/services.js"
import db from "../middleware/db.js";

adminRouter.get("/officermgmt", services.checkAuth, async (req, res) => {
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
        res.render("admin/officermgmt", { courses, users, userAccessLevel, message });
    }
    else {
        res.redirect("/error");
    }
});

adminRouter.get("/officeradd", services.checkAuth, async (req, res) => {
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
        res.render("admin/officeradd", { courses, users, userAccessLevel, message });
    }
    else {
        res.redirect("/error");
    }
});

adminRouter.post("/addofficer", async (req, res) => {
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


adminRouter.get("/editofficer/:eid", services.checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    const message = req.session.message;
    req.session.message = null;

    if (userAccessLevel === "admin") {


        const officerId = req.params.eid;
        const singleofficerSQL = `SELECT * FROM systemuser WHERE id = ?`
        const [officer] = await db.promise().query(singleofficerSQL, [officerId]);
        const coursesql = `SELECT * FROM course`
        const [courses] = await db.promise().query(coursesql);

        res.render("admin/officerupdate", { officer, courses, userAccessLevel, message });
    }
    else {
        res.redirect("/error");

    }
});


adminRouter.post("/editofficer", services.checkAuth, async (req, res) => {
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

adminRouter.get("/deleteofficer/:eid", services.checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
    if (userAccessLevel === "admin") {
        const message = req.session.message;
        req.session.message = null;
        const officerId = req.params.eid;
        const singleofficerSQL = `SELECT * FROM systemuser WHERE id = ?`
        const [officer] = await db.promise().query(singleofficerSQL, [officerId]);
        console.log(officer);
        res.render("admin/officerdelete", { officer, userAccessLevel, message });
    }
    else {
        res.redirect("/error");
    }
})

adminRouter.post("/deleteofficer/", services.checkAuth, async (req, res) => {
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



adminRouter.get("/coursemgmt", services.checkAuth, async (req, res) => {
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

adminRouter.get("/courseadd", services.checkAuth, async (req, res) => {
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


            res.render("admin/courseadd", { courses, userAccessLevel, message });
        } catch (error) {
            res.status(500).json(error);
            console.log(error);
        }
    }
    else {
        res.redirect("/error");
    }
});

adminRouter.post("/addcourse", services.checkAuth, async (req, res) => {
    const userAccessLevel = req.session.userAccessLevel;
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

export default adminRouter;