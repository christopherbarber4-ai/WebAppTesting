# cbarber7062assessment


To run the application, please follow the below steps:

-Ensure the database seeding file (found under src > seeder Folder) has been loaded into MySQL
-Ensure that the database is running. The database is called hedclass. The connection to the database has been set up using a Mac, using default MAMP values and a PORT of 8889. 
    The key log in details can be found under src > web > db.js
-Ensure that all required dependencies are installed:
    axios
    csv
    ejs
    express
    express-session
    mysql12
    nodemon
    concurrently
-To get the web application up and running, app.js must be executed (found at src > web > app.js). The package.json includes nodemon and a command has been included so you 
    should be able to use nodemon from any folder using:
    npx nodemon app.js
-When reviewing the API that has been built a script has been created which should enable both the app.js and the server.js to run at the same time. Please use "npm start" to ensure both
    are running. 
    This should activate the application to run on port 3000 and the server to run on 4000.
    As described in the report, the API routes can all be tested using Thunder Client. However one route has been set up to be rendered in the browser.
    This can be found at(http://localhost:3000/apitest). You will need to be logged in as an officer to access this.
-Login credentials are:
    •	Repo address: https://gitlab.eeecs.qub.ac.uk/40486998/cbarber7062assessment
    •	Login for officer role: officer@test.com (officer(edit)). Password: admin
    •	Login for admin role: admin@test.com (admin). Password: admin 
