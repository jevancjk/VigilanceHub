# VigilanceHub
VigilanceHub is a cybersecurity awareness training platform that caters to users of all backgrounds. It integrates engaging training topics, quizzes and a discussion forum for users to chat with each other. Fundamental topics such as phishing awareness, password security and data protection are some of the areas covered in the training materials.

## Setting Up
### Download Node.js to your root folder
* Followed from https://www.cybrosys.com/blog/how-to-install-nodejs-on-windows-linux

1. Go to nodejs.org and download the Node.js LTS (Long Term Support) version.
2. Once the installer is downloaded, run the executable/msi file and follow the installation instructions provided by the installer.

* All environment/PATH variables are added by default. Chocolatey, a Windows package manager will also be installed and Windows PowerShell will open. Do not touch anything in PowerShell, let everything install (may take about 15-30 minutes). When it is done, you may be asked to restart your computer. Do so.

3. After installation, open a command prompt or terminal and enter the following commands to verify that Node.js and npm (Node Package Manager) are installed: ```node -v``` and ```npm -v```. The output will just be a version number (e.g. ```10.7.0```).

### Install Visual Studio Code and Live Server extension
1. Download VSCode from https://code.visualstudio.com/download and select the operating system you are using. Run the executable file and follow the instructions. Accept the agreement by checking the radio button. In the next page you may check 'Create a desktop icon' if you wish. Leave the rest as default and install VSCode.
2. Open VSCode and click the Extensions option. (there are 5 icons on the top left below the blue icon, Extensions is the bottommost one). In the search bar, type 'Live Server'. The extension is by Ritwick Dey and its icon looks like a purple Wi-Fi signal. Click Install. Upon installing, you will see the extension name as 'Go Live' on the bottom right of the VSCode application. Clicking on it will open port 5500 by default which allows you to see your files live in a web browser.
3. You can install other extensions such as Python or C/C++ if you wish to do other stuff.

### Install packages via npm
In the command line of the root folder, enter the command
```
npm install express express-session express-mysql-session body-parser mysql cors path bcrypt nodemailer axios csv-parser
```
All packages will be added into ```package.json``` under ```dependencies```.

To view the packages, run the command ```type package.json``` for Windows or ```cat package.json``` for Linux.

### Install MySQL Workbench
1. Download MySQL Workbench from https://dev.mysql.com/downloads/workbench/ and follow the instructions.
2. If you are unable to connect to the MySQL server, here are some helpful links: https://www.youtube.com/watch?v=nCghoQcRbFI, https://stackoverflow.com/questions/7864276/cannot-connect-to-database-server-mysql-workbench.

For the creation of tables, run these SQL commands (you may edit the variable names to your preference):
```users``` table
```
CREATE TABLE users (
    userID INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(45) UNIQUE,
    email VARCHAR(255),
    password VARCHAR(255),
    avatar VARCHAR(255),
    emailConfirmed TINYINT(1),
    confirmationToken VARCHAR(255),
    tokenExpiry DATETIME,
    pre_training TINYINT,
    topic1 TINYINT,
    topic2 TINYINT,
    topic3 TINYINT,
    topic4 TINYINT,
    topic5 TINYINT,
    topic6 TINYINT,
    topic7 TINYINT,
    topic8 TINYINT,
    post_training TINYINT
)
```
```posts``` table
```
CREATE TABLE posts (
    postID INT AUTO_INCREMENT PRIMARY KEY,
    userID INT,  -- Foreign key to users table
    username VARCHAR(45),  -- Foreign key to users table
    postTitle VARCHAR(255),
    postText TEXT,
    postDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_userID_posts FOREIGN KEY (userID) REFERENCES users(userID),
    CONSTRAINT fk_username_posts FOREIGN KEY (username) REFERENCES users(username)
)
```
```comments``` table
```
CREATE TABLE comments (
    commentID INT AUTO_INCREMENT PRIMARY KEY,
    postID INT,  -- Foreign key to posts table
    userID INT,  -- Foreign key to users table
    username VARCHAR(45),  -- Foreign key to users table
    commentContent TEXT,
    commentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_postID_comments FOREIGN KEY (postID) REFERENCES posts(postID),
    CONSTRAINT fk_userID_comments FOREIGN KEY (userID) REFERENCES users(userID),
    CONSTRAINT fk_username_comments FOREIGN KEY (username) REFERENCES users(username)
)
```

### Run frontend and backend
VigilanceHub runs on a web server on a Node.js application, with the frontend and backend running on ports 5500 and 3000 respectively.

To run the frontend
1. Open Visual Studio Code by entering ```code .``` in the command line of the root folder.
2. Locate the 'Go Live' option at the bottom right of the application and click it. It should open up the directory of ```127.0.0.1:5500``` on the browser.

To run the backend, run this command in the root folder
```
node src/app.js
```
Command line will output ```Server running on http://127.0.0.1:3000```.

### Miscellaneous steps
To re-update the .exe file, run the command:
```
pyinstaller --onefile vigilanceHub.py --distpath .
```
* Re-run this code whenever there are changes to the source code.
