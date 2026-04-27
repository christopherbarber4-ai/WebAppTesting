CREATE DATABASE IF NOT EXISTS hedclass;
USE hedclass;


CREATE TABLE SystemUser (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    firstName     VARCHAR(100)             NOT NULL,
    lastName      VARCHAR(100)             NOT NULL,
    email         VARCHAR(255)             NOT NULL UNIQUE,
    role          ENUM('admin', 'officer(view)', 'officer(edit)') NOT NULL,
    password      VARCHAR(255)             NOT NULL
);

CREATE TABLE Course (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(255)        NOT NULL
);

CREATE TABLE ManagedCourses (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    systemUserID  INT                 NOT NULL,
    courseID      INT                 NOT NULL,
    UNIQUE (systemUserID, courseID)
);

CREATE TABLE Modules (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    moduleName    VARCHAR(255)              NOT NULL,
    courseID      INT                       NOT NULL,
    creditValue   INT                       NOT NULL,
    year          ENUM('Y1', 'Y2', 'Y3')   NOT NULL
);

CREATE TABLE Award (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    finalScore            INT,
    classification        ENUM('First Class Honours (1st)', 'Upper Second Class (2:1)', 'Lower Second Class (2:2)', 'Third Class Honours','Fail') NOT NULL, 
    classificationStatus  ENUM('In Progress', 'Approved', 'Rejected') NOT NULL DEFAULT 'In Progress',
    legacyApprover         VARCHAR(255),
    systemUserID          INT,
    decision_summary      TEXT,
    manualOverrideReq     BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE TABLE Student (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    firstName           VARCHAR(100)    NOT NULL,
    lastName            VARCHAR(100)    NOT NULL,
    email               VARCHAR(255)    NOT NULL UNIQUE,
    courseID            INT             NOT NULL,
    graduationYear    ENUM('25/26', '26/27', '27/28') NOT NULL,
    awardID             INT             NULL
);

CREATE TABLE Results (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    studentId     INT             NOT NULL,
    courseId      INT             NOT NULL,
    moduleID      INT             NOT NULL,
    score         DECIMAL(5,2),
    resit         BOOLEAN          DEFAULT FALSE
);

CREATE TABLE ClassificationRules (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    classificationYear2Weight DECIMAL(5,2) DEFAULT 0.30,
    classificationYear3Weight DECIMAL(5,2) DEFAULT 0.70,
    resitMax          INT DEFAULT 40,
    failBoundary      DECIMAL(5,2) DEFAULT 39.99,
    thirdLower        DECIMAL(5,2) DEFAULT 40,
    thirdUpper        DECIMAL(5,2) DEFAULT 49.99,
    twoTwoLower       DECIMAL(5,2) DEFAULT 50,
    twoTwoUpper       DECIMAL(5,2) DEFAULT 59.99,
    twoOneLower       DECIMAL(5,2) DEFAULT 60,
    twoOneUpper       DECIMAL(5,2) DEFAULT 69.99,
    firstBoundary     DECIMAL(5,2) DEFAULT 70,
    courseID            INT NOT NULL
);

ALTER TABLE `ManagedCourses`
    ADD CONSTRAINT `fk_managedcourses_systemuser` FOREIGN KEY (`systemUserID`) REFERENCES `SystemUser`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT, 
    ADD CONSTRAINT `fk_managedcourses_course` FOREIGN KEY (`courseID`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `Modules`
    ADD CONSTRAINT `fk_modules_course` FOREIGN KEY (`courseID`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `Award`
    ADD CONSTRAINT `fk_award_systemuser` FOREIGN KEY (`systemUserID`) REFERENCES `SystemUser`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `Student`
    ADD CONSTRAINT `fk_student_course` FOREIGN KEY (`courseID`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    ADD CONSTRAINT `fk_student_award` FOREIGN KEY (`awardID`) REFERENCES `Award`(`id`);

ALTER TABLE `Results`
    ADD CONSTRAINT `fk_results_student` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
    ADD CONSTRAINT `fk_results_course` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    ADD CONSTRAINT `fk_results_module` FOREIGN KEY (`moduleID`) REFERENCES `Modules`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `ClassificationRules`
    ADD CONSTRAINT `fk_classificationrules_course` FOREIGN KEY (`courseID`) REFERENCES course(`id`) ON DELETE CASCADE;

USE hedclass;

INSERT INTO SystemUser (id, firstName, lastName, email, role, password) VALUES
(1, 'Margaret', 'Reid',      'margaret.reid@hedclass.ac.uk',    'admin',   '$2b$10$hashedpassword1'),
(2, 'David',    'Sloane',    'david.sloane@hedclass.ac.uk',     'admin',   '$2b$10$hashedpassword2'),
(3, 'Claire',   'Doherty',   'claire.doherty@hedclass.ac.uk',   'officer(view)', '$2b$10$hashedpassword3'),
(4, 'James',    'McKenna',   'james.mckenna@hedclass.ac.uk',    'officer(edit)', '$2b$10$hashedpassword4'),
(5, 'Niamh',    'Gallagher', 'niamh.gallagher@hedclass.ac.uk',  'officer', '$2b$10$hashedpassword5'),
(6, 'Chris',    'Barber',    'officer@test.com',                'officer(edit)', 'admin'),
(7, 'Noleen',   'Barber',    'test2@test.com',                  'officer(view)', 'admin'),
(8, 'John',     'Smith',     'admin@test.com',                  'admin', 'admin');

INSERT INTO Course (id, title) VALUES
(1, 'BSc Computer Science'),
(2, 'BSc Software Engineering'),
(3, 'BSc Cybersecurity'),
(4, 'BSc Data Science'),
(5, 'BSc Artificial Intelligence');

INSERT INTO ManagedCourses (id, systemUserID, courseID) VALUES
(1, 3, 1),
(2, 3, 2),
(3, 4, 3),
(4, 4, 4),
(5, 5, 5),
(6, 6, 1),
(7, 6, 2),
(8, 6, 3),
(9, 6, 4),
(10,6, 5);

-- BSc Computer Science (courseID = 1)
INSERT INTO Modules (id, moduleName, courseID, creditValue, year) VALUES
(1,  'Intro to Programming',         1, 20, 'Y1'),
(2,  'Web Technologies',             1, 20, 'Y1'),
(3,  'Databases',                    1, 20, 'Y1'),
(4,  'Computer Systems',             1, 20, 'Y1'),
(5,  'Maths for Computing',          1, 20, 'Y1'),
(6,  'Professional Skills',          1, 20, 'Y1'),
(7,  'Algorithms & Data Structures', 1, 20, 'Y2'),
(8,  'Software Engineering',         1, 20, 'Y2'),
(9,  'Operating Systems',            1, 20, 'Y2'),
(10, 'Networks',                     1, 20, 'Y2'),
(11, 'Human Computer Interaction',   1, 20, 'Y2'),
(12, 'Research Methods',             1, 20, 'Y2'),
(13, 'Distributed Systems',          1, 20, 'Y3'),
(14, 'Cloud Computing',              1, 20, 'Y3'),
(15, 'Machine Learning',             1, 20, 'Y3'),
(16, 'Security & Cryptography',      1, 20, 'Y3'),
(17, 'Dissertation',                 1, 40, 'Y3');

-- BSc Software Engineering (courseID = 2)
INSERT INTO Modules (id, moduleName, courseID, creditValue, year) VALUES
(18, 'Intro to Programming',         2, 20, 'Y1'),
(19, 'Web Development',              2, 20, 'Y1'),
(20, 'Databases',                    2, 20, 'Y1'),
(21, 'Systems Analysis',             2, 20, 'Y1'),
(22, 'Maths for Engineers',          2, 20, 'Y1'),
(23, 'Professional Skills',          2, 20, 'Y1'),
(24, 'Software Architecture',        2, 20, 'Y2'),
(25, 'Agile Development',            2, 20, 'Y2'),
(26, 'Testing & QA',                 2, 20, 'Y2'),
(27, 'DevOps & CI/CD',               2, 20, 'Y2'),
(28, 'Project Management',           2, 20, 'Y2'),
(29, 'UX & Design',                  2, 20, 'Y2'),
(30, 'Enterprise Systems',           2, 20, 'Y3'),
(31, 'Mobile Development',           2, 20, 'Y3'),
(32, 'Cloud Platforms',              2, 20, 'Y3'),
(33, 'Capstone Project Module',      2, 20, 'Y3'),
(34, 'Dissertation',                 2, 40, 'Y3');

-- BSc Cybersecurity (courseID = 3)
INSERT INTO Modules (id, moduleName, courseID, creditValue, year) VALUES
(35, 'Intro to Security',            3, 20, 'Y1'),
(36, 'Networking Fundamentals',      3, 20, 'Y1'),
(37, 'Operating Systems',            3, 20, 'Y1'),
(38, 'Programming Basics',           3, 20, 'Y1'),
(39, 'Digital Forensics Intro',      3, 20, 'Y1'),
(40, 'Professional Ethics',          3, 20, 'Y1'),
(41, 'Cryptography',                 3, 20, 'Y2'),
(42, 'Ethical Hacking',              3, 20, 'Y2'),
(43, 'Incident Response',            3, 20, 'Y2'),
(44, 'Secure Software Development',  3, 20, 'Y2'),
(45, 'Risk Management',              3, 20, 'Y2'),
(46, 'Cyber Law & Compliance',       3, 20, 'Y2'),
(47, 'Advanced Forensics',           3, 20, 'Y3'),
(48, 'Penetration Testing',          3, 20, 'Y3'),
(49, 'Threat Intelligence',          3, 20, 'Y3'),
(50, 'Security Architecture',        3, 20, 'Y3'),
(51, 'Dissertation',                 3, 40, 'Y3');

-- BSc Data Science (courseID = 4)
INSERT INTO Modules (id, moduleName, courseID, creditValue, year) VALUES
(52, 'Intro to Data Science',         4, 20, 'Y1'),
(53, 'Statistics & Probability',      4, 20, 'Y1'),
(54, 'Programming for Data',          4, 20, 'Y1'),
(55, 'Databases',                     4, 20, 'Y1'),
(56, 'Data Visualisation',            4, 20, 'Y1'),
(57, 'Research Skills',               4, 20, 'Y1'),
(58, 'Machine Learning Fundamentals', 4, 20, 'Y2'),
(59, 'Big Data Technologies',         4, 20, 'Y2'),
(60, 'Data Mining',                   4, 20, 'Y2'),
(61, 'Statistical Modelling',         4, 20, 'Y2'),
(62, 'Ethics in Data',                4, 20, 'Y2'),
(63, 'Business Intelligence',         4, 20, 'Y2'),
(64, 'Deep Learning',                 4, 20, 'Y3'),
(65, 'NLP',                           4, 20, 'Y3'),
(66, 'Data Engineering',              4, 20, 'Y3'),
(67, 'Applied Analytics',             4, 20, 'Y3'),
(68, 'Dissertation',                  4, 40, 'Y3');

-- BSc Artificial Intelligence (courseID = 5)
INSERT INTO Modules (id, moduleName, courseID, creditValue, year) VALUES
(69, 'Intro to AI',                  5, 20, 'Y1'),
(70, 'Programming Fundamentals',     5, 20, 'Y1'),
(71, 'Maths for AI',                 5, 20, 'Y1'),
(72, 'Logic & Reasoning',            5, 20, 'Y1'),
(73, 'Databases',                    5, 20, 'Y1'),
(74, 'Research Methods',             5, 20, 'Y1'),
(75, 'Machine Learning',             5, 20, 'Y2'),
(76, 'Neural Networks',              5, 20, 'Y2'),
(77, 'Computer Vision',              5, 20, 'Y2'),
(78, 'Robotics',                     5, 20, 'Y2'),
(79, 'Knowledge Representation',     5, 20, 'Y2'),
(80, 'AI Ethics',                    5, 20, 'Y2'),
(81, 'Reinforcement Learning',       5, 20, 'Y3'),
(82, 'Generative AI',                5, 20, 'Y3'),
(83, 'AI Systems Engineering',       5, 20, 'Y3'),
(84, 'Applied AI Project',           5, 20, 'Y3'),
(85, 'Dissertation',                 5, 40, 'Y3');


INSERT INTO Award (id, finalScore, classification, classificationStatus, systemUserID, decision_summary, manualOverrideReq) VALUES
(1,  76, 'First Class Honours (1st)',  'In Progress', 4, NULL, FALSE), 
(2,  71, 'First Class Honours (1st)',  'In Progress', 4, NULL, FALSE),
(3,  62, 'Upper Second Class (2:1)',   'In Progress', 4, NULL, FALSE),
(4,  54, 'Lower Second Class (2:2)',   'In Progress', 4, NULL, FALSE), 
(5,  73, 'First Class Honours (1st)',  'In Progress', 4, NULL, FALSE), 
(6,  63, 'Upper Second Class (2:1)',   'In Progress', 4, NULL, FALSE), 
(7,  61, 'Upper Second Class (2:1)',   'In Progress', 4, NULL, FALSE), 
(8,  0,  'Fail',                       'In Progress', 4, NULL, FALSE), 
(9,  78, 'First Class Honours (1st)',  'In Progress', 4, NULL, FALSE),
(10, 64, 'Upper Second Class (2:1)',   'In Progress', 4, NULL, FALSE), 
(11, 44, 'Third Class Honours',        'In Progress', 4, NULL, FALSE),
(12, 0,  'Fail',                       'In Progress', 4, NULL, FALSE), 
(13, 75, 'First Class Honours (1st)',  'In Progress', 4, NULL, FALSE), 
(14, 72, 'First Class Honours (1st)',  'In Progress', 4, NULL, FALSE), 
(15, 55, 'Lower Second Class (2:2)',   'In Progress', 4, NULL, FALSE), 
(16, 43, 'Third Class Honours',        'In Progress', 4, NULL, FALSE),
(17, 63, 'Upper Second Class (2:1)',   'In Progress', 4, NULL, FALSE),
(18, 56, 'Lower Second Class (2:2)',   'In Progress', 4, NULL, FALSE);


INSERT INTO Student (id, firstName, lastName, email, courseID, graduationYear, awardID) VALUES
(1,  'Aoife',   'Murphy',   'aoife.murphy@student.ac.uk',   1, '25/26', 1),
(2,  'Conor',   'Walsh',    'conor.walsh@student.ac.uk',    1, '25/26', 2),
(3,  'Sophie',  'Clarke',   'sophie.clarke@student.ac.uk',  1, '25/26', 3),
(4,  'Liam',    'OBrien',   'liam.obrien@student.ac.uk',    1, '25/26', 4),
(5,  'Emma',    'Stewart',  'emma.stewart@student.ac.uk',   2, '25/26', 5),
(6,  'Ryan',    'Brennan',  'ryan.brennan@student.ac.uk',   2, '25/26', 6),
(7,  'Chloe',   'Hughes',   'chloe.hughes@student.ac.uk',   2, '25/26', 7),
(8,  'Nathan',  'Fox',      'nathan.fox@student.ac.uk',     2, '25/26', 8),
(9,  'Isla',    'Campbell', 'isla.campbell@student.ac.uk',  3, '25/26', 9),
(10, 'Patrick', 'Doyle',    'patrick.doyle@student.ac.uk',  3, '25/26', 10),
(11, 'Niamh',   'Kelly',    'niamh.kelly@student.ac.uk',    3, '25/26', 11),
(12, 'Sean',    'Farrell',  'sean.farrell@student.ac.uk',   3, '25/26', 12),
(13, 'Megan',   'Quinn',    'megan.quinn@student.ac.uk',    4, '25/26', 13),
(14, 'Callum',  'Reid',     'callum.reid@student.ac.uk',    4, '25/26', 14),
(15, 'Ciara',   'Lynch',    'ciara.lynch@student.ac.uk',    4, '25/26', 15),
(16, 'Declan',  'Burns',    'declan.burns@student.ac.uk',   4, '25/26', 16),
(17, 'Ava',     'Sheridan', 'ava.sheridan@student.ac.uk',   5, '25/26', 17),
(18, 'Finn',    'McCarthy', 'finn.mccarthy@student.ac.uk',  5, '25/26', 18),
(19, 'Grace',   'Nolan',    'grace.nolan@student.ac.uk',    5, '25/26', NULL),
(20, 'Eoin',    'Daly',     'eoin.daly@student.ac.uk',      5, '25/26', NULL);

-- AOIFE MURPHY (studentID=1, courseID=1) - First Class Honours (1st)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(1, 1, 1,  72, FALSE), (1, 1, 2,  68, FALSE), (1, 1, 3,  75, FALSE),
(1, 1, 4,  70, FALSE), (1, 1, 5,  65, FALSE), (1, 1, 6,  71, FALSE),
(1, 1, 7,  74, FALSE), (1, 1, 8,  72, FALSE), (1, 1, 9,  78, FALSE),
(1, 1, 10, 70, FALSE), (1, 1, 11, 75, FALSE), (1, 1, 12, 73, FALSE),
(1, 1, 13, 76, FALSE), (1, 1, 14, 72, FALSE), (1, 1, 15, 80, FALSE),
(1, 1, 16, 74, FALSE), (1, 1, 17, 78, FALSE);

-- CONOR WALSH (studentID=2, courseID=1) - First Class Honours (1st)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(2, 1, 1,  71, FALSE), (2, 1, 2,  69, FALSE), (2, 1, 3,  73, FALSE),
(2, 1, 4,  70, FALSE), (2, 1, 5,  68, FALSE), (2, 1, 6,  72, FALSE),
(2, 1, 7,  74, FALSE), (2, 1, 8,  70, FALSE), (2, 1, 9,  72, FALSE),
(2, 1, 10, 68, FALSE), (2, 1, 11, 71, FALSE), (2, 1, 12, 73, FALSE),
(2, 1, 13, 72, FALSE), (2, 1, 14, 70, FALSE), (2, 1, 15, 74, FALSE),
(2, 1, 16, 71, FALSE), (2, 1, 17, 73, FALSE);

-- SOPHIE CLARKE (studentID=3, courseID=1) - Upper Second Class (2:1)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(3, 1, 1,  62, FALSE), (3, 1, 2,  60, FALSE), (3, 1, 3,  64, FALSE),
(3, 1, 4,  61, FALSE), (3, 1, 5,  63, FALSE), (3, 1, 6,  60, FALSE),
(3, 1, 7,  65, FALSE), (3, 1, 8,  62, FALSE), (3, 1, 9,  67, FALSE),
(3, 1, 10, 63, FALSE), (3, 1, 11, 64, FALSE), (3, 1, 12, 66, FALSE),
(3, 1, 13, 63, FALSE), (3, 1, 14, 61, FALSE), (3, 1, 15, 65, FALSE),
(3, 1, 16, 62, FALSE), (3, 1, 17, 64, FALSE);

-- LIAM OBRIEN (studentID=4, courseID=1) - Lower Second Class (2:2)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(4, 1, 1,  52, FALSE), (4, 1, 2,  50, FALSE), (4, 1, 3,  54, FALSE),
(4, 1, 4,  51, FALSE), (4, 1, 5,  53, FALSE), (4, 1, 6,  50, FALSE),
(4, 1, 7,  55, FALSE), (4, 1, 8,  52, FALSE), (4, 1, 9,  57, FALSE),
(4, 1, 10, 53, FALSE), (4, 1, 11, 54, FALSE), (4, 1, 12, 56, FALSE),
(4, 1, 13, 55, FALSE), (4, 1, 14, 52, FALSE), (4, 1, 15, 58, FALSE),
(4, 1, 16, 54, FALSE), (4, 1, 17, 56, FALSE);

-- EMMA STEWART (studentID=5, courseID=2) - First Class Honours (1st)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(5, 2, 18, 74, FALSE), (5, 2, 19, 72, FALSE), (5, 2, 20, 75, FALSE),
(5, 2, 21, 71, FALSE), (5, 2, 22, 73, FALSE), (5, 2, 23, 70, FALSE),
(5, 2, 24, 76, FALSE), (5, 2, 25, 73, FALSE), (5, 2, 26, 75, FALSE),
(5, 2, 27, 71, FALSE), (5, 2, 28, 74, FALSE), (5, 2, 29, 72, FALSE),
(5, 2, 30, 75, FALSE), (5, 2, 31, 72, FALSE), (5, 2, 32, 74, FALSE),
(5, 2, 33, 71, FALSE), (5, 2, 34, 76, FALSE);

-- RYAN BRENNAN (studentID=6, courseID=2) - Upper Second Class (2:1)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(6, 2, 18, 63, FALSE), (6, 2, 19, 61, FALSE), (6, 2, 20, 65, FALSE),
(6, 2, 21, 62, FALSE), (6, 2, 22, 60, FALSE), (6, 2, 23, 64, FALSE),
(6, 2, 24, 66, FALSE), (6, 2, 25, 63, FALSE), (6, 2, 26, 61, FALSE),
(6, 2, 27, 65, FALSE), (6, 2, 28, 62, FALSE), (6, 2, 29, 64, FALSE),
(6, 2, 30, 65, FALSE), (6, 2, 31, 62, FALSE), (6, 2, 32, 64, FALSE),
(6, 2, 33, 61, FALSE), (6, 2, 34, 65, FALSE);

-- CHLOE HUGHES (studentID=7, courseID=2) - Upper Second Class (2:1)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(7, 2, 18, 61, FALSE), (7, 2, 19, 63, FALSE), (7, 2, 20, 60, FALSE),
(7, 2, 21, 62, FALSE), (7, 2, 22, 61, FALSE), (7, 2, 23, 63, FALSE),
(7, 2, 24, 64, FALSE), (7, 2, 25, 61, FALSE), (7, 2, 26, 63, FALSE),
(7, 2, 27, 60, FALSE), (7, 2, 28, 62, FALSE), (7, 2, 29, 64, FALSE),
(7, 2, 30, 62, FALSE), (7, 2, 31, 60, FALSE), (7, 2, 32, 63, FALSE),
(7, 2, 33, 61, FALSE), (7, 2, 34, 62, FALSE);

-- NATHAN FOX (studentID=8, courseID=2) - Fail (Y1 failures)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(8, 2, 18, 35, FALSE), (8, 2, 19, 38, FALSE), (8, 2, 20, 32, FALSE),
(8, 2, 21, 36, FALSE), (8, 2, 22, 39, FALSE), (8, 2, 23, 34, FALSE),
(8, 2, 24, 55, FALSE), (8, 2, 25, 52, FALSE), (8, 2, 26, 54, FALSE),
(8, 2, 27, 51, FALSE), (8, 2, 28, 53, FALSE), (8, 2, 29, 55, FALSE),
(8, 2, 30, 54, FALSE), (8, 2, 31, 52, FALSE), (8, 2, 32, 55, FALSE),
(8, 2, 33, 53, FALSE), (8, 2, 34, 51, FALSE);

-- ISLA CAMPBELL (studentID=9, courseID=3) - First Class Honours (1st)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(9, 3, 35, 78, FALSE), (9, 3, 36, 75, FALSE), (9, 3, 37, 80, FALSE),
(9, 3, 38, 72, FALSE), (9, 3, 39, 76, FALSE), (9, 3, 40, 74, FALSE),
(9, 3, 41, 82, FALSE), (9, 3, 42, 78, FALSE), (9, 3, 43, 75, FALSE),
(9, 3, 44, 80, FALSE), (9, 3, 45, 77, FALSE), (9, 3, 46, 79, FALSE),
(9, 3, 47, 84, FALSE), (9, 3, 48, 80, FALSE), (9, 3, 49, 78, FALSE),
(9, 3, 50, 82, FALSE), (9, 3, 51, 85, FALSE);

-- PATRICK DOYLE (studentID=10, courseID=3) - Upper Second Class (2:1)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(10, 3, 35, 64, FALSE), (10, 3, 36, 62, FALSE), (10, 3, 37, 66, FALSE),
(10, 3, 38, 63, FALSE), (10, 3, 39, 61, FALSE), (10, 3, 40, 65, FALSE),
(10, 3, 41, 67, FALSE), (10, 3, 42, 64, FALSE), (10, 3, 43, 62, FALSE),
(10, 3, 44, 66, FALSE), (10, 3, 45, 63, FALSE), (10, 3, 46, 65, FALSE),
(10, 3, 47, 66, FALSE), (10, 3, 48, 63, FALSE), (10, 3, 49, 65, FALSE),
(10, 3, 50, 62, FALSE), (10, 3, 51, 66, FALSE);

-- NIAMH KELLY (studentID=11, courseID=3) - Third Class Honours
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(11, 3, 35, 44, FALSE), (11, 3, 36, 42, FALSE), (11, 3, 37, 46, FALSE),
(11, 3, 38, 43, FALSE), (11, 3, 39, 41, FALSE), (11, 3, 40, 45, FALSE),
(11, 3, 41, 46, FALSE), (11, 3, 42, 44, FALSE), (11, 3, 43, 42, FALSE),
(11, 3, 44, 46, FALSE), (11, 3, 45, 43, FALSE), (11, 3, 46, 45, FALSE),
(11, 3, 47, 45, FALSE), (11, 3, 48, 43, FALSE), (11, 3, 49, 46, FALSE),
(11, 3, 50, 44, FALSE), (11, 3, 51, 42, FALSE);

-- SEAN FARRELL (studentID=12, courseID=3) - Fail (Y1 failures)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(12, 3, 35, 38, FALSE), (12, 3, 36, 35, FALSE), (12, 3, 37, 39, FALSE),
(12, 3, 38, 36, FALSE), (12, 3, 39, 34, FALSE), (12, 3, 40, 37, FALSE),
(12, 3, 41, 55, FALSE), (12, 3, 42, 52, FALSE), (12, 3, 43, 54, FALSE),
(12, 3, 44, 51, FALSE), (12, 3, 45, 53, FALSE), (12, 3, 46, 55, FALSE),
(12, 3, 47, 54, FALSE), (12, 3, 48, 52, FALSE), (12, 3, 49, 55, FALSE),
(12, 3, 50, 53, FALSE), (12, 3, 51, 51, FALSE);

-- MEGAN QUINN (studentID=13, courseID=4) - First Class Honours (1st)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(13, 4, 52, 76, FALSE), (13, 4, 53, 73, FALSE), (13, 4, 54, 78, FALSE),
(13, 4, 55, 74, FALSE), (13, 4, 56, 71, FALSE), (13, 4, 57, 75, FALSE),
(13, 4, 58, 79, FALSE), (13, 4, 59, 76, FALSE), (13, 4, 60, 73, FALSE),
(13, 4, 61, 78, FALSE), (13, 4, 62, 74, FALSE), (13, 4, 63, 77, FALSE),
(13, 4, 64, 78, FALSE), (13, 4, 65, 75, FALSE), (13, 4, 66, 77, FALSE),
(13, 4, 67, 74, FALSE), (13, 4, 68, 78, FALSE);

-- CALLUM REID (studentID=14, courseID=4) - First Class Honours (1st)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(14, 4, 52, 72, FALSE), (14, 4, 53, 70, FALSE), (14, 4, 54, 74, FALSE),
(14, 4, 55, 71, FALSE), (14, 4, 56, 73, FALSE), (14, 4, 57, 70, FALSE),
(14, 4, 58, 75, FALSE), (14, 4, 59, 72, FALSE), (14, 4, 60, 74, FALSE),
(14, 4, 61, 70, FALSE), (14, 4, 62, 73, FALSE), (14, 4, 63, 71, FALSE),
(14, 4, 64, 74, FALSE), (14, 4, 65, 71, FALSE), (14, 4, 66, 73, FALSE),
(14, 4, 67, 70, FALSE), (14, 4, 68, 75, FALSE);

-- CIARA LYNCH (studentID=15, courseID=4) - Lower Second Class (2:2)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(15, 4, 52, 53, FALSE), (15, 4, 53, 55, FALSE), (15, 4, 54, 51, FALSE),
(15, 4, 55, 54, FALSE), (15, 4, 56, 52, FALSE), (15, 4, 57, 50, FALSE),
(15, 4, 58, 56, FALSE), (15, 4, 59, 53, FALSE), (15, 4, 60, 55, FALSE),
(15, 4, 61, 51, FALSE), (15, 4, 62, 54, FALSE), (15, 4, 63, 52, FALSE),
(15, 4, 64, 57, FALSE), (15, 4, 65, 54, FALSE), (15, 4, 66, 56, FALSE),
(15, 4, 67, 53, FALSE), (15, 4, 68, 55, FALSE);

-- DECLAN BURNS (studentID=16, courseID=4) - Third Class Honours
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(16, 4, 52, 43, FALSE), (16, 4, 53, 46, FALSE), (16, 4, 54, 41, FALSE),
(16, 4, 55, 44, FALSE), (16, 4, 56, 42, FALSE), (16, 4, 57, 45, FALSE),
(16, 4, 58, 44, FALSE), (16, 4, 59, 46, FALSE), (16, 4, 60, 43, FALSE),
(16, 4, 61, 41, FALSE), (16, 4, 62, 45, FALSE), (16, 4, 63, 43, FALSE),
(16, 4, 64, 44, FALSE), (16, 4, 65, 46, FALSE), (16, 4, 66, 42, FALSE),
(16, 4, 67, 45, FALSE), (16, 4, 68, 43, FALSE);

-- AVA SHERIDAN (studentID=17, courseID=5) - Upper Second Class (2:1)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(17, 5, 69, 63, FALSE), (17, 5, 70, 65, FALSE), (17, 5, 71, 61, FALSE),
(17, 5, 72, 64, FALSE), (17, 5, 73, 62, FALSE), (17, 5, 74, 60, FALSE),
(17, 5, 75, 66, FALSE), (17, 5, 76, 63, FALSE), (17, 5, 77, 65, FALSE),
(17, 5, 78, 61, FALSE), (17, 5, 79, 64, FALSE), (17, 5, 80, 62, FALSE),
(17, 5, 81, 65, FALSE), (17, 5, 82, 63, FALSE), (17, 5, 83, 61, FALSE),
(17, 5, 84, 64, FALSE), (17, 5, 85, 64, FALSE);

-- FINN MCCARTHY (studentID=18, courseID=5) - Lower Second Class (2:2)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(18, 5, 69, 55, FALSE), (18, 5, 70, 57, FALSE), (18, 5, 71, 53, FALSE),
(18, 5, 72, 56, FALSE), (18, 5, 73, 54, FALSE), (18, 5, 74, 52, FALSE),
(18, 5, 75, 58, FALSE), (18, 5, 76, 55, FALSE), (18, 5, 77, 57, FALSE),
(18, 5, 78, 53, FALSE), (18, 5, 79, 56, FALSE), (18, 5, 80, 54, FALSE),
(18, 5, 81, 57, FALSE), (18, 5, 82, 55, FALSE), (18, 5, 83, 53, FALSE),
(18, 5, 84, 56, FALSE), (18, 5, 85, 56, FALSE);

-- GRACE NOLAN (studentID=19, courseID=5) - Lower Second Class (2:2)
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(19, 5, 69, 53, FALSE), (19, 5, 70, 55, FALSE), (19, 5, 71, 51, FALSE),
(19, 5, 72, 54, FALSE), (19, 5, 73, 52, FALSE), (19, 5, 74, 50, FALSE),
(19, 5, 75, 56, FALSE), (19, 5, 76, 53, FALSE), (19, 5, 77, 55, FALSE),
(19, 5, 78, 51, FALSE), (19, 5, 79, 54, FALSE), (19, 5, 80, 52, FALSE),
(19, 5, 81, 55, FALSE), (19, 5, 82, 53, FALSE), (19, 5, 83, 51, FALSE),
(19, 5, 84, 54, FALSE), (19, 5, 85, 52, FALSE);

-- EOIN DALY (studentID=20, courseID=5) - Third Class Honours
INSERT INTO Results (studentId, courseId, moduleID, score, resit) VALUES
(20, 5, 69, 44, FALSE), (20, 5, 70, 46, FALSE), (20, 5, 71, 42, FALSE),
(20, 5, 72, 48, FALSE), (20, 5, 73, 45, FALSE), (20, 5, 74, 43, FALSE),
(20, 5, 75, 46, FALSE), (20, 5, 76, 44, FALSE), (20, 5, 77, 48, FALSE),
(20, 5, 78, 42, FALSE), (20, 5, 79, 45, FALSE), (20, 5, 80, 47, FALSE),
(20, 5, 81, 46, FALSE), (20, 5, 82, 44, FALSE), (20, 5, 83, 48, FALSE),
(20, 5, 84, 45, FALSE), (20, 5, 85, 43, FALSE);

INSERT INTO ClassificationRules (classificationYear2Weight, classificationYear3Weight, resitMax,
failBoundary, thirdLower, thirdUpper, twoTwoLower, twoTwoUpper, twoOneLower, twoOneUpper, firstBoundary, courseID) VALUES
(0.30, 0.70, 40, 39.99, 40, 49.99, 50, 59.99, 60, 69.99, 70, 1),
(0.30, 0.70, 40, 39.99, 40, 49.99, 50, 59.99, 60, 69.99, 70, 2),
(0.30, 0.70, 40, 39.99, 40, 49.99, 50, 59.99, 60, 69.99, 70, 3),
(0.30, 0.70, 40, 39.99, 40, 49.99, 50, 59.99, 60, 69.99, 70, 4),
(0.30, 0.70, 40, 39.99, 40, 49.99, 50, 59.99, 60, 69.99, 70, 5);