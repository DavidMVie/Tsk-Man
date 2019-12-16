const express = require('express');
const cookieParser = require('cookie-parser');

require('./db/mongoose');

const taskRouter = require('./routers/taskRouter');
const userRouter = require('./routers/userRouter');

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}))
app.use(express.static('public'))
app.use(cookieParser());
app.use(taskRouter);
app.use(userRouter);
const port = process.env.PORT;

app.listen(port, () => {
  console.log('Ole cloth ears is listening on port ', + port);
})