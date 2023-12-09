const bcrypt = require('bcryptjs');
const saltRounds = 10;

module.exports = function(app, appData) {

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

    app.post('/registered', function (req,res) {
        const plainPassword = req.body.password;

        let checkForDupe = "SELECT * FROM users WHERE username = ? OR email = ?";
        db.query(checkForDupe, [req.body.username, req.body.email], function(err, result){
            if (err) {
                console.error(err.message);
                res.redirect('./register');
            } else if (result.length > 0){
                let newData = Object.assign({}, appData, { error: "Username or email already exists. Please try again." });
                res.render('register.ejs', newData);
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
                                res.redirect('./');
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
}