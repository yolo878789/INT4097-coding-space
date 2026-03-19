const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const authService = require('../services/auth.service');
const userService = require('../services/user.service');
const { statusCodes } = require('../constants');

/**
 * Register a new user
 */
exports.register = catchAsync(async (req, res) => {
  const { email, password, name } = req.body;
  
  // Check if user already exists
  const existingUser = await userService.findUserByEmail(email);
  if (existingUser) {
    throw new AppError('User already exists with this email', statusCodes.CONFLICT);
  }
  
  // Create user
  const user = await userService.createUser({
    email,
    password,
    name
  });
  
  // Generate tokens
  const tokens = await authService.generateTokens(user);
  
  // Remove password from output
  user.password = undefined;
  
  res.status(statusCodes.CREATED).json({
    status: 'success',
    message: 'User registered successfully',
    data: {
      user,
      tokens
    }
  });
});

/**
 * Login user
 */
exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  
  // Check if user exists
  const user = await userService.findUserByEmail(email, '+password');
  if (!user) {
    throw new AppError('Invalid email or password', statusCodes.UNAUTHORIZED);
  }
  
  // Check password
  const isPasswordValid = await userService.comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', statusCodes.UNAUTHORIZED);
  }
  
  // Generate tokens
  const tokens = await authService.generateTokens(user);
  
  // Remove password from output
  user.password = undefined;
  
  res.status(statusCodes.OK).json({
    status: 'success',
    message: 'Logged in successfully',
    data: {
      user,
      tokens
    }
  });
});

/**
 * Logout user
 */
exports.logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (refreshToken) {
    await authService.invalidateRefreshToken(refreshToken);
  }
  
  res.status(statusCodes.OK).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

/**
 * Refresh access token
 */
exports.refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new AppError('Refresh token is required', statusCodes.BAD_REQUEST);
  }
  
  const tokens = await authService.refreshAccessToken(refreshToken);
  
  res.status(statusCodes.OK).json({
    status: 'success',
    data: tokens
  });
});

/**
 * Forgot password
 */
exports.forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  
  const user = await userService.findUserByEmail(email);
  if (user) {
    const resetToken = await authService.createPasswordResetToken(user);
    await authService.sendPasswordResetEmail(email, resetToken);
  }
  
  // Always return success to prevent email enumeration
  res.status(statusCodes.OK).json({
    status: 'success',
    message: 'If a user with that email exists, a password reset link has been sent'
  });
});

/**
 * Reset password
 */
exports.resetPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  
  await authService.resetPassword(token, password);
  
  res.status(statusCodes.OK).json({
    status: 'success',
    message: 'Password has been reset successfully'
  });
});