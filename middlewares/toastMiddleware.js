export const attachToast = (req, res, next) => {
    res.locals.toast = req.session.toast || null;
    req.session.toast = null;

    next();
};