const express = require('express')
const cors = require("cors")

const app = express()

const usersRoutes = require('./routes/users.js')
const tournamentsRoutes = require('./routes/tournaments.js')
const connectionsRoutes = require('./routes/connnections.js')

app.use(express.json());
app.use(cors())

// Middleware: for logging
app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

// API Routes
app.use('/api/users', usersRoutes)
app.use('/api/tournaments', tournamentsRoutes)
app.use('/api/connections', connectionsRoutes)

app.listen(5000, () => {
    console.log(`Server started. Listening on port: ${process.env.PORT}`, { actor: "SERVER" })
})

