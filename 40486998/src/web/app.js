import express from "express";
const app = express(); // instatiate express
import sessions from "express-session";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); //middleware to ensure I can access static files e.g. css
app.use(express.static(path.join(__dirname, '/public')));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;
//SESSIONS SET UP
const oneHour = 10000 * 60 * 60 * 1; // variable for cookie timeout
app.use(sessions({ // creates a session object on the node server
    secret: 'cbarberproject',
    saveUninitialized: true,
    cookie: { maxAge: oneHour },
    resave: false
}));

import viewRoutes from "./routes/viewroutes.js";
import editRoutes from "./routes/editroutes.js";
import adminRoutes from "./routes/adminroutes.js";




app.use("/", viewRoutes);
app.use("/", editRoutes);
app.use("/", adminRoutes);

/*
import fs from "fs";
import { stringify } from "csv-stringify";

export async function exportCoursesToCSV() {
    const filename = "courses_export.csv";
    const writableStream = fs.createWriteStream(filename);
    const stringifier = stringify({
        header: true, columns: [
            "title",
            "totalStudents",
            "gradeFirst",
            "gradeTwoOne",
            "gradeTwoTwo",
            "gradeThird",
            "gradeFail",
            "allGradedScores",
            "gradedStudents",
            "studentCountPercentage",
            "averageScore",
            "firstPercentage",
            "twoOnePercentage",
            "twoTwoPercentage",
            "thirdPercentage",
            "failPercentage"]
    });
    stringifier.pipe(writableStream);

    const [rows] = await db.promise().query(`SELECT course.id as courseID,student.id AS stuID, course.title, award.classification, award.finalScore, student.awardID FROM course
    LEFT JOIN student 
    ON student.courseID = course.id
    LEFT JOIN award
    ON student.awardID = award.id `);

    rows.forEach((row) => {
        stringifier.write(row);
    });

    stringifier.end();

    return new Promise((resolve, reject) => {
        writableStream.on("finish", () => {
            console.log("CSV export complete");
            resolve(filename);
        });
        writableStream.on("error", reject);
    });
}

exportCoursesToCSV();

*/


app.listen(PORT, () => {
    console.log(`Server is live! http://localhost:${PORT}`);
});
