module.exports = function(app, appData) {

    // Handle our routes
    app.get('/',function(req,res){
        res.render('index.ejs', appData)
    });

    app.get('/about',function(req,res){
        res.render('about.ejs', appData)
    });

    app.get('/register',function(req,res){
        res.render('register.ejs', appData)
    });

    app.get('/login',function(req,res){
        res.render('login.ejs', appData)
    });
}