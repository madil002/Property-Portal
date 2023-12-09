const bcrypt = require('bcryptjs');
const saltRounds = 10;

module.exports = function(app, appData) {

    const redirectLogin = (req, res , next) => {
        if (!req.session.userId){
            res.redirect('/login')
        }else{
            next();
        }
    }

    // Routes
    app.get('/',function(req,res){
        res.render('index.ejs', appData)
    });

    app.get('/about',function(req,res){
        res.render('about.ejs', appData)
    });

    app.get('/register',function(req,res){
        res.render('register.ejs', appData)
    });

    //Need to add server side validation for the form fields
    app.post('/registered', function (req,res) {
        const plainPassword = req.body.password;

        let checkForDupe = "SELECT * FROM users WHERE username = ? OR email = ?";
        db.query(checkForDupe, [req.body.username, req.body.email], function(err, result){
            if (err) {
                console.error(err.message);
                res.redirect('./register');
            } else if (result.length > 0){
                res.render('register.ejs', Object.assign({}, appData, { error: "Username or email already exists. Please try again." }));
            } else{
                bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
                    if (err) {
                        console.error(err.message);
                        res.redirect('./register');
                    }
                    else {
                        let sqlquery = "INSERT INTO users (username, hashed_password, email, first_name, last_name) VALUES (?,?,?,?,?)";
                        let newrecord = [req.body.username, hashedPassword, req.body.email, req.body.first, req.body.last];
                        db.query(sqlquery, newrecord, (err, result) => {
                            if (err) {
                                console.error(err.message);
                                res.redirect('./');
                            }
                            else {
                                res.render('register.ejs', Object.assign({}, appData, { success: "Registration successful!" }));
                            }
                        })
                    }
                  })
            }
        })
    }); 

    app.get('/login',function(req,res){
        res.render('login.ejs', appData)
    });

    app.post('/loggedin',function(req,res){
        // Need to add:
        // if logged in already redirect to dashboard
        // direct to dashboard after successful login
        let username = req.body.username;
        let password = req.body.password;

        db.query(`SELECT hashed_password FROM users WHERE username = '${username}'`, (err, result) => {
            if (err){
                console.error(err.message);
                res.redirect('/login');
            }
            else if (result.length == 0) {
                res.render('login.ejs', Object.assign({}, appData, { error: "Invalid user" }));
            }
            else {
                let hashedPassword = result[0].hashed_password
                bcrypt.compare(password, hashedPassword, function (err, result){
                    if (err){
                        console.error(err.message);
                        res.redirect('/login');
                    }
                    else if (result == false){
                        res.render('login.ejs', Object.assign({}, appData, { error: "Invalid password." }));
                    }
                    else if (result == true){
                        req.session.userId = username;
                        res.render('login.ejs', Object.assign({}, appData, { success: "Successfully Logged in! " }));
                    }
                })
            }
        })
    })

    app.get('/loggedout', redirectLogin, function (req, res) {
        req.session.destroy(err => {
            if (err) {
                return res.redirect('./')
            }
            res.send('you are now logged out. <a href=' + './' + '>Home</a>');
        })

    })

    app.get('/dashboard', redirectLogin, function(req,res){
        res.send("Placeholder");
    });
}