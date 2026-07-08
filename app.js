import express from "express";
import session from "express-session";
import userRoutes from "./routes/userRoutes.js";
import { attachToast } from "./middlewares/toastMiddleware.js";
const app = express();
app.set("view engine","ejs");
app.set("views", "./views");
app.use(express.json());
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie:{
        maxAge: 1000 * 60 * 60,
    },
}));
app.use((req, res, next) => {
    res.header(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
    );
    next();
});
app.use(attachToast)
app.use("/",userRoutes);

export default app;