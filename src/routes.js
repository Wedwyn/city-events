import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { Model } from 'objection';
import knex from 'knex';
import fs from 'fs';
import flash from 'express-flash';
import multer from 'multer';
import methodOverride from 'method-override';
import ics from 'ics';
import path from 'path';
import { fileURLToPath } from 'url';
import { knexConfig } from '../knexfile.js';
import 'dotenv/config';
import passportStrategy from './helpers/passportStrategy.js';
import Event from './models/Event.js';
import User from './models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../dist/preview')));
app.use(
    session({
        secret: process.env.SESSION_KEY,
        resave: true,
        saveUninitialized: true,
    }),
);
app.use(passportStrategy.initialize());
app.use(passportStrategy.session());
app.use(methodOverride('_method'));
app.use(flash());

const mode = process.env.NODE_ENV || 'development';
// const mode = 'production';

Model.knex(knex(knexConfig[mode]));

// add authenticated check
app.use((req, res, next) => {
    if (req.isAuthenticated()) {
        res.locals.user = req.user;
        res.locals.isAuthenticated = true;
    } else {
        res.locals.isAuthenticated = false;
    }
    next();
});

// work with uploading images
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, path.join(__dirname, '../dist/preview'));
    },
    filename(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

const router = express.Router();
router
    // handling events
    .get('/', async (req, res) => {
        const events = await Event.query();
        res.render('events/index', { events });
    })
    .get('/events/new', async (req, res) => {
        if (req.isAuthenticated()) {
            res.render('events/new');
        } else {
            req.flash('info', 'У вас нет прав на это действие');
            res.redirect('/');
        }
    })
    .post('/events', upload.single('imageurl'), async (req, res) => {
        if (req.isAuthenticated()) {
            try {
                const event = {
                    name: req.body.name,
                    date: req.body.date,
                    price: Number(req.body.price),
                    description: req.body.description,
                    organizer: req.body.organizer,
                    address: req.body.address,
                    imageurl: req.file.filename,
                };
                await Event.query().insert(event);
                req.flash('success', 'Мероприятие успешно добавлено');
            } catch (err) {
                console.log(err);
                req.flash('error', 'Что-то пошло не так, попробуйте ещё раз');
                res.render('events/new');
            }
        }
        res.redirect('/');
    })
    .get('/events/:id/show', async (req, res) => {
        const { id } = req.params;
        const event = await Event.query().findById(id);
        res.render('events/show', { event });
    })
    .get('/events/:id/edit', async (req, res) => {
        if (req.isAuthenticated()) {
            const { id } = req.params;
            const event = await Event.query().findById(id);
            console.log(event);
            res.render('events/edit', { event });
        } else {
            req.flash('info', 'У вас нет прав на это действие');
            res.redirect('/');
        }
    })
    .delete('/events/:id', async (req, res) => {
        if (req.isAuthenticated()) {
            try {
                const { id } = req.params;
                req.flash('success', 'Мероприятие успешно удалено');
                await Event.query().deleteById(id);
            } catch (err) {
                console.log(err);
                req.flash('error', 'Что-то пошло не так, попробуйте ещё раз');
            }
        }
        res.redirect('/');
    })
    .patch('/events/:id', upload.single('imageurl'), async (req, res) => {
        if (req.isAuthenticated()) {
            try {
                const { id } = req.params;
                const event = await Event.query().findById(id);
                event.name = req.body.name;
                event.date = req.body.date;
                event.price = Number(req.body.price);
                event.description = req.body.description;
                event.organizer = req.body.organizer;
                event.address = req.body.address;
                if (req.file) {
                    if (event.imageurl) {
                        fs.unlinkSync(path.join(__dirname, '../dist/preview/', event.imageurl));
                    }
                    event.imageurl = req.file.filename;
                }
                await event.$query().update();
                req.flash('success', 'Мероприятие успешно изменено');
            } catch (err) {
                console.log(err);
                req.flash('error', 'Что-то пошло не так, попробуйте ещё раз');
            }
        }
        res.redirect('/');
    })
    .patch('/events/:id/going', async (req, res) => {
        const { id } = req.params;
        const event = await Event.query().findById(id);
        try {
            const cookieName = 'eventsVotes';
            const oldCookies = req.cookies[cookieName] || {};
            const newCookie = {
                ...oldCookies,
                [event.id]: true,
            };
            res.cookie(cookieName, newCookie, { maxAge: 60 * 24 * 60 * 60 * 1000, httpOnly: true });
            if (!oldCookies[event.id]) {
                event.number_of_going += 1;
                await event.$query().update();
                req.flash('success', 'Ваш голос добавлен');
            } else {
                req.flash('info', 'Вы уже проголосовали');
            }
        } catch (err) {
            console.log(err);
            req.flash('error', 'Что-то пошло не так, попробуйте ещё раз');
        }
        res.render('events/show', { event });
    })
    .get('/events/:id/calendar', async (req, res) => {
        const { id } = req.params;
        const event = await Event.query().findById(id);
        const year = Number(event.date.split('-')[0]);
        const month = Number(event.date.split('-')[1]);
        const day = Number(event.date.split('T')[0].split('-')[2]);
        const hours = Number(event.date.split('T')[1].split(':')[0]);
        const minutes = Number(event.date.split('T')[1].split(':')[1]);
        const calendarEvent = {
            start: [year, month, day, hours, minutes],
            title: event.name,
            description: event.description,
            location: event.address,
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
            organizer: { name: event.organizer },
        };
        const filename = `${__dirname}/../dist/calendar/${event.id}.ics`;
        try {
            await ics.createEvent(calendarEvent, (error, value) => {
                if (error) {
                    console.log(error);
                }
                fs.writeFileSync(filename, value);
            });
            await res.download(filename, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    fs.unlinkSync(filename);
                }
            });
        } catch (err) {
            console.log(err);
            req.flash('error', 'Что-то пошло не так, попробуйте ещё раз');
            res.redirect(`/events/${id}/show`);
        }
    })
    // handling session
    .get('/session/new', async (req, res) => {
        res.render('session/new');
    })
    .post(
        '/session',
        passportStrategy.authenticate('local', {
            failureRedirect: '/session/new',
            failureFlash: 'Неправильный логин или пароль',
        }),
        async (req, res) => {
            const user = await User.query().findOne({ username: req.body.username });
            req.flash('success', 'Вы успешно вошли в систему.');
            req.logIn(user, (err) => {
                if (err) {
                    req.flash('error', 'Что-то пошло не так, попробуйте ещё раз');
                    res.redirect('/');
                }
                res.locals.user = req.user;
                req.flash('success', 'Вы залогинены');
                res.redirect('/');
            });
        },
    )
    .delete('/session', async (req, res, next) => {
        req.logout((err) => {
            if (err) {
                return next(err);
            }
            req.flash('info', 'Вы разлогинены');
            return res.redirect('/');
        });
    });

app.use('/', router);

export default app;
