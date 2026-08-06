import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

// Get all admin users (excluding residents)
export const getAllAdminUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '', sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    
    const offset = (page - 1) * limit;
    
    const whereClause = {
      role: { [Op.in]: ['admin', 'captain', 'secretary', 'staff'] }
    };
    
    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]