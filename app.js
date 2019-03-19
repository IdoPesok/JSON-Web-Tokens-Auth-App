const express = require("express")
const app = express()
const mongoose = require("mongoose")


require("./config/app")(app)
require("./config/mongoose")(mongoose)
