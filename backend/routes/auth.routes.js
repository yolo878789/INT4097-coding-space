const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validateMiddleware = require('../middleware/validation.middleware');

const router = express.Router();

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
      .withMessage('Password must contain at least one letter and one number'),
    body('name').notEmpty().withMessage('Name is required'),
    validateMiddleware
  ],
  authController.register
);

/**
 * @route POST /api/v1/auth/login
 * @desc Login user
 * @access Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validateMiddleware
  ],
  authController.login
);

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authMiddleware.protect, authController.logout);

/**
 * @route POST /api/v1/auth/refresh-token
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post(
  '/forgot-password',
  [body('email').isEmail(), validateMiddleware],
  authController.forgotPassword
);

/**
 * @route PATCH /api/v1/auth/reset-password/:token
 * @desc Reset password
 * @access Public
 */
router.patch(
  '/reset-password/:token',
  [
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    validateMiddleware
  ],
  authController.resetPassword
);

module.exports = router;