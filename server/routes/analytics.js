const express = require('express');
const router = express.Router();

// Mock Data
const engagementMetrics = {
  totalEngagements: 1524,
  topPlatform: 'Instagram',
  averageEngagementRate: '7.5%',
};

const postPerformance = [
  { id: 1, platform: 'Instagram', impressions: 2000, clicks: 150, engagementRate: '10%' },
  { id: 2, platform: 'Twitter', impressions: 1500, clicks: 70, engagementRate: '4.6%' },
];

// GET /api/analytics/dashboard - Engagement Summary
router.get('/api/analytics/dashboard', (req, res) => {
  res.json(engagementMetrics);
});

// GET /api/analytics/posts - Post Performance List
router.get('/api/analytics/posts', (req, res) => {
  res.json(postPerformance);
});

module.exports = router;