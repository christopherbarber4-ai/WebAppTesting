import express from "express";
const app = express(); // instatiate express
import sessions from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import db from "./middleware/db.js";
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





    app.listen(PORT, () => {
        console.log(`Server is live! http://localhost:${PORT}`);
    });
