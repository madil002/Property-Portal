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

        bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
            if (err) {
                console.error(err.message);
                res.redirect('./');
            }
            else {
                let sqlquery = "INSERT INTO users (username, hashed_password, email, first_name, last_name) VALUES (?,?,?,?,?)";
                let newrecord = [req.body.username, hashedPassword, req.body.email, req.body.first, req.body.last];
                db.query(sqlquery, newrecord, (err, result) => {
                    if (err) {
                        return console.error(err.message);
                    }
                    else {
                        res.redirect('./');
                    }
                })
            }
          })
          
    }); 

    app.get('/login',function(req,res){
        res.render('login.ejs', appData)
    });
}