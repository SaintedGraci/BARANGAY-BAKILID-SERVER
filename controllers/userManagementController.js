import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

// Get all admin users (System Administrator only)
export const getAllAdminUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10, sort = 'newest' } = req.query;
    
    const where = {
      role: { [Op.ne]: 'resident' } // Exclude residents
    };

    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { fullName: { [Op.like]: `%${search}%` } }
      ];
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const order = sort === 'oldest' ? [['createdAt', 'ASC']] : [['createdAt', 'DESC']];
    
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await User.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset,
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: {
        users: rows,
        total: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching admin users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create admin user (System Administrator only)
export const createAdminUser = async (req, res) => {
  try {
    const { fullName, username, email, contactNumber, password, role, status = 'active' } = req.body;

    // Validate role - cannot create system_admin
    if (role === 'admin' || role === 'system_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot create System Administrator accounts from this interface' 
      });
    }

    // Validate role is one of allowed roles
    const allowedRoles = ['captain', 'secretary', 'staff'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be captain, secretary, or staff' 
      });
    }

    // Check if username exists
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    // Check if email exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      fullName,
      username,
      email,
      contactNumber,
      password: hashedPassword,
      role,
      status,
      isVerified: true // Admin accounts are verified by default
    });

    // Log action
    logger.info(`Admin user created: ${username} (${role}) by ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (error) {
    logger.error('Error creating admin user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update admin user (System Administrator only)
export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, username, email, contactNumber, role, status } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Cannot edit system admin role
    if (user.role === 'admin' && req.user.id === parseInt(id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot edit your own System Administrator account' 
      });
    }

    // Validate role - cannot assign system_admin
    if (role === 'admin' || role === 'system_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot assign System Administrator role' 
      });
    }

    // Check username uniqueness
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ where: { username, id: { [Op.ne]: id } } });
      if (existingUsername) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
      }
    }

    // Check email uniqueness
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email, id: { [Op.ne]: id } } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
    }

    // Update user
    await user.update({
      fullName: fullName || user.fullName,
      username: username || user.username,
      email: email || user.email,
      contactNumber: contactNumber || user.contactNumber,
      role: role || user.role,
      status: status || user.status
    });

    logger.info(`Admin user updated: ${user.username} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    logger.error('Error updating admin user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete admin user (System Administrator only)
export const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Cannot delete self
    if (req.user.id === parseInt(id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    // Cannot delete system admin
    if (user.role === 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot delete System Administrator account' 
      });
    }

    const deletedUsername = user.username;
    await user.destroy();

    logger.info(`Admin user deleted: ${deletedUsername} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting admin user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update user status (System Administrator only)
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Cannot deactivate self
    if (req.user.id === parseInt(id) && status === 'inactive') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot deactivate your own account' 
      });
    }

    await user.update({ status });

    logger.info(`User status updated: ${user.username} set to ${status} by ${req.user.username}`);

    res.json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    logger.error('Error updating user status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reset user password (System Administrator only)
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    logger.info(`Password reset for user: ${user.username} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
