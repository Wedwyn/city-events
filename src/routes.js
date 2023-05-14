import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { Model } from 'objection';
import knex from 'knex';
import User from './models/User.js';
import { knexConfig } from '../knexfile.js';
import 'dotenv/config';
import passportStrategy from './helpers/passportStrategy.js';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    session({
        secret: process.env.SESSION_KEY,
        resave: true,
        saveUninitialized: true,
    }),
);
app.use(passportStrategy.initialize());
app.use(passportStrategy.session());

const mode = process.env.NODE_ENV || 'development';
// const mode = 'production';

Model.knex(knex(knexConfig[mode]));

app.use((req, res, next) => {
    if (req.isAuthenticated()) {
        res.locals.user = req.user;
        res.locals.isAuthenticated = true;
    } else {
        res.locals.isAuthenticated = false;
    }
    next();
});

const sessionRouter = express.Router();

sessionRouter
    .get('/session/new', async (req, res) => {
        res.render('session/new');
    })
    .post('/session', (req, res, next) => {
        passportStrategy.authenticate('local', (err1, user, info) => {
            if (err1) {
                console.log('errror first');
                console.log(err1);
                next(err1);
            }
            if (!user) {
                console.log('error second');
                console.log(info.message);
                res.redirect('/session/new');
            }
            req.logIn(user, (err2) => {
                if (err2) {
                    console.log('error third');
                    console.log(err2);
                    return next(err2);
                }
                // console.log('--------------user------------');
                // console.log(req.user);
                res.locals.user = req.user;
                res.locals.isAuthenticated = true;
                return res.redirect('/');
            });
        })(req, res, next);
    })
    .get('/', async (req, res) => {
        console.log('-----------auth-------------');
        console.log(req.isAuthenticated());
        console.log(res.locals.isAuthenticated);
        res.render('events/index', { events: [1, 2, 3, 4, 5] });
    })
    .get('/users/new', async (req, res) => {
        console.log('----------auth---------');
        console.log(req.isAuthenticated());
        res.render('users/new');
    })
    .post('/users', async (req, res) => {
        console.log(req.body);
        await User.query().insert(req.body);
        res.redirect('/');
    })
    .get('/session/delete', (req, res, next) => {
        req.logout((err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/');
        });
    // res.redirect('/');
    });

// app.use('/', indexRouter);
// app.use('/', userRouter);
app.use('/', sessionRouter);

export default app;
