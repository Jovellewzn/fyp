const express = require('express');
const cors = require("cors");
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');

const app = express()

const usersRoutes = require('./routes/users.js')
const tournamentsRoutes = require('./routes/tournaments.js')
const connectionsRoutes = require('./routes/connnections.js')
const discussionsRoutes = require('./routes/discussions.js')    
const matchesRoutes = require('./routes/matches.js')    
const postsRoutes = require('./routes/posts.js')
const commentsRoutes = require('./routes/comments.js')

app.use(express.json());

const corsOptions = {
    origin: true,
    credentials: true,
    optionsSuccessStatus: 200,
}
app.use(cors(corsOptions));
app.use(cookieParser());

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
app.use('/api/posts', postsRoutes)
app.use('/api/comments', commentsRoutes)
app.use(express.static(__dirname + '/uploads'))

app.listen(5000, () => {
    console.log(`Server started. Listening on port: ${process.env.PORT}`, { actor: "SERVER" })
})

