module.exports = function(app, appData) {

    // Handle our routes
    app.get('/',function(req,res){
        res.render('index.ejs', appData)
    });

    app.get('/about',function(req,res){
        res.render('about.ejs', appData)
    });
}