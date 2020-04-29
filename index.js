const mongoose = require("mongoose");
require("./config/db");

const express = require('express');
const exphbs = require("express-handlebars");
const path = require("path");
const router = require('./routes/index');
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mongoStore = require("connect-mongo")(session);
const bodyParser = require("body-parser");
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
const handlebars = require('handlebars');
const expressValidator = require("express-validator");
const flash = require("connect-flash");
const createError = require('http-errors');
const passport = require('passport');
require('./config/passport');

require('dotenv').config({
    path: 'variables.env'
})

const app = express();

// habilitar bodyparser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//express validator
app.use(expressValidator());

// habilitar handlebars como view
app.engine('handlebars',
    exphbs({
        handlebars: allowInsecurePrototypeAccess(handlebars),
        defaultLayout: 'layout',
        helpers: require('./helpers/handlebars')
    })
);

app.set('view engine','handlebars');

// static

app.use(express.static(path.join(__dirname,'public')));

app.use(cookieParser());

app.use(session({
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    store: new mongoStore({
        mongooseConnection: mongoose.connection
    })
}));


//passport
app.use(passport.initialize());
app.use(passport.session());

//alertas
app.use(flash());

//middleware
app.use((req,res,next) => {
    res.locals.mensajes = req.flash();
    next();
});


app.use('/',router());

// 404 pagina no existente
app.use((req,res,next) => {
    next(createError(404,'No encontrado'));
})

//Administracion de los errores
app.use((error,req,res,next)=> {
    res.locals.mensaje = error.message;
    const status = error.status || 500;
    res.locals.status = status;
    res.status(status);    
    res.render('error');
})

const host = '0.0.0.0';
const port = process.env.PORT;

app.listen(port,host,() => {
    console.log(`Server on port ${port}`)
});