const bcrypt = require('bcryptjs');
const saltRounds = 10;
const { check, validationResult } = require('express-validator');

module.exports = function (app, appData) {

    const redirectLogin = (req, res, next) => {
        if (!req.session.userId) {
            res.redirect('./login')
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
        if (req.session.userId){
            res.render('index.ejs', Object.assign({}, appData, { error: "You are already logged in!" }));
        } else {
        res.render('register.ejs', appData)
        }
    });

    //Need to add server side validation for the form fields
    app.post('/registered',
    [check('email').isEmail().withMessage('Invalid email format'),
    check('username').isLength({ min: 4 }).withMessage('Username must be at least 4 characters long').matches(/^[a-zA-Z0-9]+$/).withMessage('Username must contain only alphabetic characters'),
    check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long').matches(/\d/).withMessage('Password must contain a number'),
    check('first').not().isEmpty().withMessage('First name is required'),
    check('last').not().isEmpty().withMessage('Last name is required')], function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const reason = errors.array().map(err => err.msg);
            res.render('register.ejs', Object.assign({}, appData, { error : reason }));
        }
        else {
            const plainPassword = req.sanitize(req.body.password);

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
                            let newrecord = [req.sanitize(req.body.username), hashedPassword, req.sanitize(req.body.email), req.sanitize(req.body.first), req.sanitize(req.body.last)];
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
        }
    });

    app.get('/login', function (req, res) {
        if (req.session.userId){
            res.render('index.ejs', Object.assign({}, appData, { error: "You are already logged in!" }));
        } else {
        res.render('login.ejs', appData)
        }
    });

    app.post('/loggedin', [
        check('username').not().isEmpty().withMessage('Username is required'),
        check('password').not().isEmpty().withMessage('Password is required')], function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const reason = errors.array().map(err => err.msg);
            res.render('login.ejs', Object.assign({}, appData, { error : reason }));
        } else {
            let username = req.sanitize(req.body.username);
            let password = req.sanitize(req.body.password);

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
                            res.render('index.ejs', Object.assign({}, appData, { success: "Successfully Logged in! " }));
                        }
                    })
                }
            })
        }
    })

    app.get('/loggedout', redirectLogin, function (req, res) {
        req.session.destroy(err => {
            if (err) {
                return res.redirect('./')
            }
            res.render('index.ejs', Object.assign({}, appData, { success: "Successfully logged out!" }));
        })

    })

    app.get('/dashboard', redirectLogin, function (req, res) {
        let sqlquery = "SELECT * FROM properties WHERE user_id = ?";
        db.query(sqlquery, [req.session.userId], function(err, results) {
            if (err) {
                console.error(err.message);
                res.redirect('./');
            } else {
                res.render('properties.ejs', Object.assign({}, appData, { properties: results, showDelete : true, showContactDetails : false }));
            }
        })
    });
    app.post('/delete-property', function(req, res){
        let propertyID = req.body.propertyId;
        let sqlquery = "DELETE FROM properties WHERE id = ? AND user_id = ?";
        db.query(sqlquery, [propertyID, req.session.userId], function(err, result) {
            if (err) {
                console.error(err.message);
                res.redirect('./')
            }
            res.redirect('./dashboard');
        });
    })

    app.get('/properties', function (req, res) {
        let sqlquery = "SELECT * FROM property_user_view";

        db.query(sqlquery, function (err, result) {
            if (err) {
                console.error(err.message);
                res.redirect("./"); //NEED TO REVAMP
            } else {
                res.render('properties.ejs', Object.assign({}, appData, { properties: result, showDelete : false, showContactDetails : true }));
            }
        })
    });

    app.get('/search', function (req, res) {
        res.render("search.ejs", appData);
    });
    app.get('/search-result', [
        check('type').optional({ checkFalsy: true }).isString().withMessage('Type must be a string'),
        check('city').optional({ checkFalsy: true }).matches(/^[a-zA-Z\s]+$/).withMessage('City must contain only alphabetic characters'),
        check('price').optional({ checkFalsy: true }).isNumeric().withMessage('Price must be a number'),
        check('bedrooms').optional({ checkFalsy: true }).isInt().withMessage('Bedrooms must be an integer'),
        check('bathrooms').optional({ checkFalsy: true }).isInt().withMessage('Bathrooms must be an integer')
    ], function (req, res) {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const reason = errors.array().map(err => err.msg);
            res.render('search.ejs', Object.assign({}, appData, { error: reason }));
        } else {
            let type = req.query.type ? req.sanitize(req.query.type) : null;
            let city = req.query.city ? req.sanitize(req.query.city) : null;
            let price = req.query.price ? parseInt(req.sanitize(req.query.price)) : null;
            let bedrooms = req.query.bedrooms ? parseInt(req.sanitize(req.query.bedrooms)) : null;
            let bathrooms = req.query.bathrooms ? parseInt(req.sanitize(req.query.bathrooms)) : null;

            let sqlquery = "CALL SearchProperties(?, ?, ?, ?, ?)";

            db.query(sqlquery, [type, city, price, bedrooms , bathrooms], function (err, result) {
                if (err) {
                    console.error(err.message);
                    res.redirect("./"); //NEED TO REVAMP
                } else {
                    if (result[0].length == 0) {
                        res.render('search.ejs', Object.assign({}, appData, { error: "No matching properties found" }));
                    } else {
                        res.render('properties.ejs', Object.assign({}, appData, { properties: result[0], showDelete : false, showContactDetails : true }));
                    }
                }
            })
        }

    })

    app.get('/listproperty', redirectLogin, function (req, res){
        res.render("listproperty.ejs", appData);
    });
    app.post('/property-added', [
        check('price').isNumeric().withMessage('Price must be a number'),
        check('street').not().isEmpty().withMessage('Street is required'),
        check('city').not().isEmpty().withMessage('City is required'),
        check('postcode').matches(/^[0-9a-zA-Z]+$/).withMessage('Invalid postcode format'),
        check('bedrooms').isInt().withMessage('Bedrooms must be an integer'),
        check('bathrooms').isInt().withMessage('Bathrooms must be an integer'),
        check('description').not().isEmpty().withMessage('Description is required'),
        check('type').not().isEmpty().withMessage('Type is required')
    ], function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const reason = errors.array().map(err => err.msg);
            res.render('listproperty.ejs', Object.assign({}, appData, { error : reason }));
        } else {
            let price = req.sanitize(req.body.price);
            let street = req.sanitize(req.body.street);
            let city = req.sanitize(req.body.city);
            let postcode = req.sanitize(req.body.postcode);
            let bedrooms = req.sanitize(parseInt(req.body.bedrooms));
            let bathrooms = req.sanitize(parseInt(req.body.bathrooms));
            let desc = req.sanitize(req.body.description);
            let type = req.sanitize(req.body.type);

            let sqlquery = "CALL AddProperty(?, ?, ?, ?, ?, ?, ?, ?, ?)";
            db.query(sqlquery, [price, street, city, postcode, bedrooms, bathrooms, desc, type, req.session.userId], function (err, result) {
                if (err) {
                    console.error(err.message);
                    res.redirect("./"); //NEED TO REVAMP
                } else {
                    res.render('listproperty.ejs', Object.assign({}, appData, { success: "Successfully listed property!" }));
                }
            });
        }
    });
    app.get('/api', function(req,res){
        let sqlquery = `SELECT * FROM property_user_view`

        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            res.json(result); 
        });

    })
    app.get('/more-properties', function(req,res){
        const request = require('request');
        let url = `https://api.bridgedataoutput.com/api/v2/test/listings?access_token=6baca547742c6f96a6ff71b138424f21`;
        
        request(url, function(err, response, body){
            if (err) {
                console.log('error:', error);
                res.redirect('./');
            } else {
                try {
                    var propertiesData = JSON.parse(body);
                    if (propertiesData && propertiesData.bundle) {
                        var properties = propertiesData.bundle.map(p => ({
                            price: p.ListPrice,
                            street: p.StreetAddress,
                            city: p.City,
                            postcode: p.PostalCode,
                            type: p.PropertyType,
                            bedrooms: p.BedroomsTotal,
                            bathrooms: p.BathroomsTotalInteger,
                            description: p.PublicRemarks,
                            first_name: 'N/A', // Placeholder
                            email: 'N/A' // Placeholder
                        }));
                        res.render('properties.ejs', { appName: 'More Properties', properties: properties, showDelete : false, showContactDetails : false });
                    } else {
                        res.render('properties.ejs', { appName: 'More Properties', properties: [], showDelete : false, showContactDetails : false });
                    }
                } catch (parseError) {
                    console.error('Error:', parseError);
                    res.redirect('./');
                }
            }
        })
    })
}