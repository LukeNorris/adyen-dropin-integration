import express from 'express'
import colors from 'colors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.set('view engine', 'ejs')

app.use(express.static('public'))


const PORT = process.env.PORT || 5000
app.listen(PORT, console.log(`server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold))