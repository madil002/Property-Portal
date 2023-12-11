const bcrypt = require('bcryptjs');
const saltRounds = 10;

module.exports = function (app, appData) {

    const redirectLogin = (req, res, next) => {
        if (!req.session.userId) {
            res.redirect('/login')
        } else {
            next();
        }
    }

    // Routes
    app.get('/', function (req, res) {
        res.render('index.ejs', appData)
    });

    app.get('/about', function (req, res) {
        res.render('about.ejs', appData)
    });

    app.get('/register', function (req, res) {
        res.render('register.ejs', appData)
    });

    //Need to add server side validation for the form fields
    app.post('/registered', function (req, res) {
        const plainPassword = req.body.password;

        let checkForDupe = "SELECT * FROM users WHERE username = ? OR email = ?";
        db.query(checkForDupe, [req.body.username, req.body.email], function (err, result) {
            if (err) {
                console.error(err.message);
                res.redirect('./register');
            } else if (result.length > 0) {
                res.render('register.ejs', Object.assign({}, appData, { error: "Username or email already exists. Please try again." }));
            } else {
                bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
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

    app.get('/login', function (req, res) {
        res.render('login.ejs', appData)
    });

    app.post('/loggedin', function (req, res) {
        // Need to add:
        // if logged in already redirect to dashboard
        // direct to dashboard after successful login
        let username = req.body.username;
        let password = req.body.password;

        db.query(`SELECT id, hashed_password FROM users WHERE username = '${username}'`, (err, result) => {
            if (err) {
                console.error(err.message);
                res.redirect('/login');
            }
            else if (result.length == 0) {
                res.render('login.ejs', Object.assign({}, appData, { error: "Invalid user" }));
            }
            else {
                let user = result[0]
                bcrypt.compare(password, user.hashed_password, function (err, result) {
                    if (err) {
                        console.error(err.message);
                        res.redirect('/login');
                    }
                    else if (result == false) {
                        res.render('login.ejs', Object.assign({}, appData, { error: "Invalid password." }));
                    }
                    else if (result == true) {
                        req.session.userId = user.id;
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
            // Need to revamp this
            res.send('you are now logged out. <a href=' + './' + '>Home</a>');
        })

    })

    app.get('/dashboard', redirectLogin, function (req, res) {
        res.send("Placeholder");
    });

    app.get('/properties', function (req, res) {
        let sqlquery = "SELECT * from properties JOIN users ON properties.user_id = users.id";

        db.query(sqlquery, function (err, result) {
            if (err) {
                console.error(err.message);
                res.redirect("./"); //NEED TO REVAMP
            } else {
                res.render('properties.ejs', Object.assign({}, appData, { properties: result }));
            }
        })
    });

    app.get('/search', function (req, res) {
        res.render("search.ejs", appData);
    });
    app.get('/search-result', function (req, res) {
        let type = req.query.type ? req.query.type : null;
        let city = req.query.city ? req.query.city : null;
        let price = req.query.price ? parseInt(req.query.price) : null;
        let bedrooms = req.query.bedrooms ? parseInt(req.query.bedrooms) : null;
        let bathrooms = req.query.bathrooms ? parseInt(req.query.bathrooms) : null;

        let sqlquery = `SELECT * FROM properties JOIN users ON properties.user_id = users.id
                    WHERE (? IS NULL OR type = ?) 
                    AND (? IS NULL OR city LIKE ?) 
                    AND (? IS NULL OR price <= ?) 
                    AND (? IS NULL OR bedrooms >= ?) 
                    AND (? IS NULL OR bathrooms >= ?)`;

        db.query(sqlquery, [type, type, city, '%' + city + '%', price, price, bedrooms, bedrooms, bathrooms, bathrooms], function(err,result){
            if (err) {
                console.error(err.message);
                res.redirect("./"); //NEED TO REVAMP
            } else {
                if(result.length == 0){
                    res.render('search.ejs', Object.assign({}, appData, { error: "No matching properties found" }));
                } else {
                    res.render('properties.ejs', Object.assign({}, appData, { properties: result }));
                }
            }
        })
    })

    app.get('/listproperty', redirectLogin, function (req, res){
        res.render("listproperty.ejs", appData);
    });
    app.post('/property-added', function(req,res){
        let price = req.body.price;
        let street = req.body.street;
        let city = req.body.city;
        let postcode = req.body.postcode;
        let bedrooms = parseInt(req.body.bedrooms);
        let bathrooms = parseInt(req.body.bathrooms);
        let desc = req.body.description;
        let type = req.body.type;

        let sqlquery = "INSERT INTO properties (price, street, city, postcode, bedrooms, bathrooms, description, type, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        db.query(sqlquery, [price, street, city, postcode, bedrooms, bathrooms, desc, type, req.session.userId], function (err, result) {
            if (err) {
                console.error(err.message);
                res.redirect("./"); //NEED TO REVAMP
            } else {
                res.render('listproperty.ejs', Object.assign({}, appData, { success: "Successfully listed property!" }));
            }
        });
    });
    app.get('/api', function(req,res){
        let sqlquery = `SELECT * FROM properties JOIN users ON properties.user_id = users.id`

        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            res.json(result); 
        });

    })
}