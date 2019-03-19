middleware = {}

middleware.isLoggedOut = (req, res, next) => {
    if (req.signedCookies["auth_token"]) {
        req.flash("error", "You must be logged out to do that")
        res.redirect("/")
    } else {
        next()
    }
}

middleware.isLoggedIn = (req, res, next) => {
    if (req.signedCookies["auth_token"]) {
        next()
    } else {
        req.flash("error", "You must be logged in to do that")
        res.redirect("/login")
    }
}

module.exports = middleware
