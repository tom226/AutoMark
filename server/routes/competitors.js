const express = require('express');
const router = express.Router();

// Mock Response Data
const competitorInsights = [
  { id: 1, insight: 'Competitor A is gaining traction on Twitter.' },
  { id: 2, insight: 'Competitor B launched a new campaign on Facebook.' },
];

// POST /api/competitors/analyze - Trigger Competitor Analysis
router.post('/api/competitors/analyze', (req, res) => {
  // Typically, trigger the competitor analysis service here
  res.status(202).send('Competitor analysis triggered successfully');
});

// GET /api/competitors/insights - List Competitor Insights
router.get('/api/competitors/insights', (req, res) => {
  res.json(competitorInsights);
});

module.exports = router;