'use strict';

const express = require('express');
const passport = require('passport');
const router = express.Router();

/**
 * GET /auth/discord
 * Initiates the Discord OAuth2 login flow.
 */
router.get('/discord', passport.authenticate('discord'));

/**
 * GET /auth/callback
 * Discord redirect back to the app after authorization.
 */
router.get('/callback', (req, res, next) => {
  passport.authenticate('discord', (err, user, info) => {
    if (err) {
      console.error('[AUTH] Passport auth error:', err);
      return res.redirect('/?error=auth_error');
    }
    if (!user) {
      console.warn('[AUTH] No user found in callback:', info);
      return res.redirect('/?error=no_user');
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('[AUTH] Session login error:', err);
        return res.redirect('/?error=session_error');
      }
      console.log(`[AUTH] Successfully logged in: ${user.username} (${user.id})`);
      return res.redirect('/');
    });
  })(req, res, next);
});

/**
 * GET /auth/logout
 * Destroys the session and logs the user out.
 */
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

/**
 * GET /api/user
 * Returns the current authenticated user's profile.
 */
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        global_name: req.user.global_name,
        avatar: req.user.avatar,
        avatarURL: `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
      }
    });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

module.exports = router;
