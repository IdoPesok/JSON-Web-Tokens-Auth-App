const express = require("express")
const router = express.Router()


router.get("/", (req, res) => {
    res.render("index/landing")
})

router.get("*", (req, res) => {
    res.render("errors/404.ejs")
})


module.exports = router
