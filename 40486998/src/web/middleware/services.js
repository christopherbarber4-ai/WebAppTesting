const checkAuth = function checkAuth(req, res, next) {
    if (req.session.authen) {

        next();
    } else {
        res.redirect("/error");
    }
}

export default {checkAuth};