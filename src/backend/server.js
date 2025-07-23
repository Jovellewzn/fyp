const express = require('express')
const cors = require("cors")

const app = express()

const usersRoutes = require('./routes/users.js')
const tournamentsRoutes = require('./routes/tournament_participant.js')
const connectionsRoutes = require('./routes/connnections.js')
const discussionsRoutes = require('./routes/discussions.js')    
const matchesRoutes = require('./routes/matches.js')    

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
app.use('/api/discussions', discussionsRoutes)
app.use('/api/matches', matchesRoutes)

app.listen(5000, () => {
    console.log(`Server started. Listening on port: ${process.env.PORT}`, { actor: "SERVER" })
})

