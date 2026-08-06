import { Op, fn, col, literal } from 'sequelize';
import Resident from '../models/resident.js';
import Request from '../models/request.js';
import Complaint from '../models/complaint.js';
import Announcement from '../models/announcement.js';

// Get dashboard KPIs
export const getDashboardKPIs = async (req, res) => {
  try {
    const totalResidents = await Resident.count();
    const activeResidents = await Resident.count({ where: { verificationStatus: 'approved' } });
    const pendingRequests = await Request.count({ where: { status: 'pending' } });
    const approvedRequests = await Request.count({ where: { status: 'approved' } });
    const pendingVerifications = await Resident.count({ where: { verificationStatus: 'pending' } });
    const resolvedComplaints = await Complaint.count({ where: { status: 'resolved' } });
    const activeAnnouncements = await Announcement.count({ where: { status: 'Active' } });

    // Calculate monthly growth rate
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const lastMonthCount = await Resident.count({
      where: {
        createdAt: { [Op.between]: [lastMonth, thisMonth] }
      }
    });
    
    const thisMonthCount = await Resident.count({
      where: {
        createdAt: { [Op.gte]: thisMonth }
      }
    });
    
    const growthRate = lastMonthCount > 0 
      ? ((thisMonthCount - lastMonthCount) / lastMonthCount * 100).toFixed(1)
      : 100;

    res.json({
      success: true,
      data: {
        totalResidents,
        activeResidents,
        pendingRequests,
        approvedRequests,
        pendingVerifications,
        resolvedComplaints,
        activeAnnouncements,
        monthlyGrowthRate: parseFloat(growthRate)
      }
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get resident registration trend (last 12 months)
export const getRegistrationTrend = async (req, res) => {
  try {
    const months = [];
    const counts = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const count = await Resident.count({
        where: {
          createdAt: { [Op.between]: [monthStart, monthEnd] }
        }
      });
      
      months.push(monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      counts.push(count);
    }

    res.json({
      success: true,
      data: { months, counts }
    });
  } catch (error) {
    console.error('Error fetching registration trend:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get document request analytics
export const getDocumentRequestAnalytics = async (req, res) => {
  try {
    const documents = await Request.findAll({
      attributes: [
        'documentType',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['documentType']
    });

    const types = documents.map(d => d.documentType);
    const counts = documents.map(d => parseInt(d.get('count')));

    res.json({
      success: true,
      data: { types, counts }
    });
  } catch (error) {
    console.error('Error fetching document analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get request status distribution
export const getRequestStatusDistribution = async (req, res) => {
  try {
    const statuses = await Request.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status']
    });

    const labels = statuses.map(s => s.status);
    const counts = statuses.map(s => parseInt(s.get('count')));

    res.json({
      success: true,
      data: { labels, counts }
    });
  } catch (error) {
    console.error('Error fetching status distribution:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get complaint analytics
export const getComplaintAnalytics = async (req, res) => {
  try {
    const complaints = await Complaint.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status']
    });

    const labels = complaints.map(c => c.status);
    const counts = complaints.map(c => parseInt(c.get('count')));

    res.json({
      success: true,
      data: { labels, counts }
    });
  } catch (error) {
    console.error('Error fetching complaint analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get resident demographics
export const getResidentDemographics = async (req, res) => {
  try {
    // Gender distribution
    const genderDist = await Resident.findAll({
      attributes: [
        'gender',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['gender']
    });

    const genders = genderDist.map(g => g.gender);
    const genderCounts = genderDist.map(g => parseInt(g.get('count')));

    // Age groups
    const residents = await Resident.findAll({
      attributes: ['birthDate']
    });

    const ageGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56-65': 0,
      '65+': 0
    };

    residents.forEach(r => {
      if (r.birthDate) {
        const age = new Date().getFullYear() - new Date(r.birthDate).getFullYear();
        if (age >= 18 && age <= 25) ageGroups['18-25']++;
        else if (age >= 26 && age <= 35) ageGroups['26-35']++;
        else if (age >= 36 && age <= 45) ageGroups['36-45']++;
        else if (age >= 46 && age <= 55) ageGroups['46-55']++;
        else if (age >= 56 && age <= 65) ageGroups['56-65']++;
        else if (age > 65) ageGroups['65+']++;
      }
    });

    res.json({
      success: true,
      data: {
        gender: { labels: genders, counts: genderCounts },
        age: {
          labels: Object.keys(ageGroups),
          counts: Object.values(ageGroups)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching demographics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get monthly system activity
export const getMonthlyActivity = async (req, res) => {
  try {
    const months = [];
    const registrations = [];
    const requests = [];
    const complaints = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const regCount = await Resident.count({
        where: { createdAt: { [Op.between]: [monthStart, monthEnd] } }
      });
      
      const reqCount = await Request.count({
        where: { createdAt: { [Op.between]: [monthStart, monthEnd] } }
      });
      
      const compCount = await Complaint.count({
        where: { createdAt: { [Op.between]: [monthStart, monthEnd] } }
      });
      
      months.push(monthStart.toLocaleDateString('en-US', { month: 'short' }));
      registrations.push(regCount);
      requests.push(reqCount);
      complaints.push(compCount);
    }

    res.json({
      success: true,
      data: { months, registrations, requests, complaints }
    });
  } catch (error) {
    console.error('Error fetching monthly activity:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get verification progress
export const getVerificationProgress = async (req, res) => {
  try {
    const total = await Resident.count();
    const verified = await Resident.count({ where: { verificationStatus: 'approved' } });
    const percentage = total > 0 ? ((verified / total) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        total,
        verified,
        percentage: parseFloat(percentage)
      }
    });
  } catch (error) {
    console.error('Error fetching verification progress:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get quick statistics
export const getQuickStatistics = async (req, res) => {
  try {
    // Most requested document
    const mostRequested = await Request.findAll({
      attributes: [
        'documentType',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['documentType'],
      order: [[literal('count'), 'DESC']],
      limit: 1
    });

    // Average processing time (days)
    const completedRequests = await Request.findAll({
      where: {
        status: { [Op.in]: ['approved', 'completed'] },
        updatedAt: { [Op.ne]: null }
      },
      attributes: ['createdAt', 'updatedAt']
    });

    let avgProcessingTime = 0;
    if (completedRequests.length > 0) {
      const totalDays = completedRequests.reduce((sum, req) => {
        const days = Math.floor((new Date(req.updatedAt) - new Date(req.createdAt)) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgProcessingTime = (totalDays / completedRequests.length).toFixed(1);
    }

    // Resolution rate
    const totalComplaints = await Complaint.count();
    const resolvedComplaints = await Complaint.count({ where: { status: 'resolved' } });
    const resolutionRate = totalComplaints > 0 
      ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1)
      : 0;

    // Approval rate
    const totalRequests = await Request.count();
    const approvedRequests = await Request.count({ where: { status: { [Op.in]: ['approved', 'completed'] } } });
    const approvalRate = totalRequests > 0
      ? ((approvedRequests / totalRequests) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        mostRequestedDocument: mostRequested[0]?.documentType || 'N/A',
        avgProcessingTime: parseFloat(avgProcessingTime),
        resolutionRate: parseFloat(resolutionRate),
        approvalRate: parseFloat(approvalRate)
      }
    });
  } catch (error) {
    console.error('Error fetching quick statistics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
