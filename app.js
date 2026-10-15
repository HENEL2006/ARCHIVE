import express from "express";
import session from "express-session";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { attachToast } from "./middlewares/toastMiddleware.js";
import passport from "./config/passport.js";
import { attachCategories } from "./middlewares/headerMiddleware.js";
import { optimizeImage } from "./utils/imageHelper.js";
import compression from "compression";

const app = express();

app.use(compression());

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.json());
app.use(
  express.static("public", {
    maxAge: "7d",
    etag: true,
    lastModified: true,
  }),
);
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
  res.locals.optimizeImage = optimizeImage;
  next();
});
app.use(attachToast);
app.use(attachCategories);
app.use("/", userRoutes);
app.use("/admin", adminRoutes);

// 404 Catch-All Handler
app.use((req, res) => {
  res.status(404);

  // If request expects JSON (API or AJAX)
  if (req.xhr || (req.headers.accept && req.headers.accept.includes("application/json"))) {
    return res.json({
      success: false,
      message: "Resource not found (404)",
    });
  }

  // Render EJS 404 page
  return res.render("user/404", {
    requestedUrl: req.originalUrl,
    activePage: "",
  });
});

// Centralized 500 Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error("Internal Error:", err);
  const status = err.status || 500;
  res.status(status);

  if (req.xhr || (req.headers.accept && req.headers.accept.includes("application/json"))) {
    return res.json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
    });
  }

  return res.render("user/404", {
    requestedUrl: req.originalUrl,
    activePage: "",
  });
});

export default app;
