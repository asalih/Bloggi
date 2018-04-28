module.exports = {
    init: function(app){
        app.get('/who', function (req, res) {
            res.send('hello world')
        });
        
        app.get("/contact", function (req, res) {
            res.send('contact intercepted')
        });
    }
}