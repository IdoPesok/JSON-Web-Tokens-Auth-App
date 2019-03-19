const express = require("express")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const indexRoutes = require("../routes/index")
const authRoutes = require("../routes/auth")
const config = require("../config/index")
const flash = require("connect-flash")
const session = require("express-session")


module.exports = (app) => {

    app.set("view engine", "ejs")
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(express.static('public'))
    app.use(cookieParser(config.secret))
    app.use(session({ secret: config.secret, resave: false, saveUninitialized: true, cookie: { maxAge: 60000 }}))
    app.use(flash())

    app.use((req, res, next) => {
        if (req.signedCookies["auth_token"]) {
            res.locals.auth = true
        } else {
            res.locals.auth = false
        }
        
        res.locals.error = req.flash("error")
        res.locals.success = req.flash("success")

        next()
    })

    app.use(authRoutes)
    app.use(indexRoutes)

    app.listen(3000, () => {
        console.log("server is up and running on port 3000")
    })

}
