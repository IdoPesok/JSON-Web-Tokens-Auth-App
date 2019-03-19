const express = require("express")
const router = express.Router()
const User = require("../models/user")
const config = require("../config/index")
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const middleware = require("../middleware")


router.get("/login", middleware.isLoggedOut, (req, res) => {
    res.render("auth/login")
})

router.get("/register", middleware.isLoggedOut, (req, res) => {
    res.render("auth/register")
})

router.post("/register", middleware.isLoggedOut, (req, res) => {
    var newUser = getUserFromRequest(req)

    checkIfEmailExists(newUser.email)
        .then(() => {
            req.flash("error", "Could not create you account because a user with this email already exists. Please try again.")
            return res.redirect("/register")
        })
        .catch(() => {
            checkIfUsernameExists(newUser.username)
                .then(() => {
                    req.flash("error", "Could not create you account because a user with this username already exists. Please try again.")
                    return res.redirect("/register")
                })
                .catch(() => {
                    User.create(newUser, (err, createdUser) => {
                        if (err) {
                            req.flash("error", "Could not create your user due to an unknown error. Please try again later.")
                            return res.redirect("/register")
                        }

                        const token = jwt.sign({ id: createdUser._id }, config.secret, {
                            expiresIn: 1800 // 30 minutes
                        })

                        req.flash("success", "You have been successfully registerd!")
                        res.cookie('auth_token', token, { maxAge: 1800000, httpOnly: true, signed: true })
                        res.redirect("/")
                    })
                })
        })
})

router.post("/login", middleware.isLoggedOut, (req, res) => {
    var username = req.body.email
    var password = req.body.password

    User.findOne({ email: req.body.email }, (err, foundUser) => {
        if (err || foundUser == null) {
            req.flash("error", "Username is incorrect. Please try again.")
            return res.redirect("/login")
        }
        if (!bcrypt.compareSync(password, foundUser.password)) {
            req.flash("error", "Password is incorrect. Please try again.")
            return res.redirect("/login")
        }

        const token = jwt.sign({ id: foundUser._id }, config.secret, {
            expiresIn: 1800 // 30 minutes
        })

        req.flash("success", "You have been successfully logged in!")
        res.cookie('auth_token', token, { maxAge: 1800000, httpOnly: true, signed: true })
        res.redirect("/")
    })
})

router.get("/logout", middleware.isLoggedIn, (req, res) => {
    req.flash("success", "You have been successfully logged out!")
    res.clearCookie("auth_token", { signed: true });
    res.redirect("/")
})

router.get("/account", middleware.isLoggedIn, (req, res) => {
    getLoggedInUser(req, (foundUser) => {
        res.render("auth/account", { currentUser: foundUser })
    })
})

router.get("/update_username", middleware.isLoggedIn, (req, res) => {
    getLoggedInUser(req, (foundUser) => {
        res.render("auth/update_username", { currentUser: foundUser })
    })
})

router.post("/update_username", middleware.isLoggedIn, (req, res) => {
    checkIfUsernameExists(req.body.username)
        .then(() => {
            req.flash("error", "Could not change your username because that username is already taken.")
            res.redirect("/update_username")
        })
        .catch(() => {
            getLoggedInUser(req, (foundUser) => {
                foundUser.username = req.body.username
                foundUser.save()
                req.flash("success", "We have successfully changed your username to " + req.body.username)
                res.redirect("/account")
            })
        })
})

router.get("/update_email", middleware.isLoggedIn, (req, res) => {
    getLoggedInUser(req, (foundUser) => {
        res.render("auth/update_email", { currentUser: foundUser })
    })
})

router.post("/update_email", middleware.isLoggedIn, (req, res) => {
    checkIfEmailExists(req.body.email)
        .then(() => {
            req.flash("error", "Could not change your email because that email is already taken.")
            res.redirect("/update_email")
        })
        .catch(() => {
            getLoggedInUser(req, (foundUser) => {
                foundUser.email = req.body.email
                foundUser.save()
                req.flash("success", "We have successfully changed your username to " + req.body.email)
                res.redirect("/account")
            })
        })
})

router.get("/update_password", middleware.isLoggedIn, (req, res) => {
    getLoggedInUser(req, (foundUser) => {
        res.render("auth/update_password", { currentUser: foundUser })
    })
})

router.post("/update_password", middleware.isLoggedIn, (req, res) => {
    var oldPassword = req.body.old_password
    var newPassword = req.body.new_password

    getLoggedInUser(req, (foundUser) => {
        if (!bcrypt.compareSync(oldPassword, foundUser.password)) {
            req.flash("error", "Password is incorrect. Please try again.")
            return res.redirect("/update_password")
        }

        const token = jwt.sign({ id: foundUser._id }, config.secret, {
            expiresIn: 1800 // 30 minutes
        })

        var hashedPwd = bcrypt.hashSync(newPassword, 8);
        foundUser.password = hashedPwd
        foundUser.save()
        req.flash("success", "We have successfully changed your password")
        res.redirect("/account")
    })
})


function getLoggedInUser(req, completion) {
    const token = req.signedCookies['auth_token']

    jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
            res.clearCookie("auth_token", { signed: true });
            return res.redirect("/login")
        }

        User.findById(decoded.id, (err, foundUser) => {
            if (err) {
                return res.send("UNKNOWN ERROR")
            }

            completion(foundUser)
        })
    })
}

function getUserFromRequest(req) {
    var hashedPwd = bcrypt.hashSync(req.body.password, 8);
    var user = {
        username: req.body.username,
        email: req.body.email,
        password: hashedPwd
    }

    return user
}

function checkIfUsernameExists(username) {
    return new Promise((resolve, reject) => {
        User.findOne({ username: username }, (err, foundUser) => {
            if (foundUser != null) {
                resolve()
            } else {
                reject()
            }
        })
    })
}

function checkIfEmailExists(email) {
    return new Promise((resolve, reject) => {
        User.findOne({ email: email }, (err, foundUser) => {
            if (foundUser != null) {
                resolve()
            } else {
                reject()
            }
        })
    })
}


module.exports = router
