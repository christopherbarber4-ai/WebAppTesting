import express from "express";
const server = express();
const PORT = 4000;
import db from "../web/middleware/db.js";


//end point for all students
server.get('/students/', async (req, res) => {

    const studentSQL = `SELECT * FROM student`;
    let [rowsData] = await db.promise().query(studentSQL);

    const result = {
        data: rowsData,
        info: "request successful"
    }

    res.json(result);
});

server.listen(PORT, () => {
    console.log(`API started on port ${PORT}`);
});

//end point for specific students
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


//end point for all courses
server.get('/students/', async (req, res) => {

    const studentSQL = `SELECT * FROM student`;
    let [rowsData] = await db.promise().query(studentSQL);

    const result = {
        data: rowsData,
        info: "request successful"
    }

    res.json(result);
});

server.listen(PORT, () => {
    console.log(`API started on port ${PORT}`);
});

//end point for specific students
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

server.listen(PORT, () => {
    console.log(`API started on port ${PORT}`);
});