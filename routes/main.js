module.exports = function(app, appData) {

    // Handle our routes
    app.get('/',function(req,res){
        res.render('index.ejs', appData)
    });
}