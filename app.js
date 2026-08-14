import express from "express";
import session from "express-session";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { attachToast } from "./middlewares/toastMiddleware.js";
import passport from "./config/passport.js";
import { attachCategories } from "./middlewares/headerMiddleware.js";
const app = express();
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  }),
);

app.use(passport.initialize());

app.use((req, res, next) => {
  res.header("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});
app.use(attachToast);
app.use(attachCategories);
app.use("/", userRoutes);
app.use("/admin", adminRoutes);

export default app;
