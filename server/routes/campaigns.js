const express = require('express');
const router = express.Router();

// Mock Data
const campaigns = [
  { id: 1, name: 'New Year Sale', platforms: ['Facebook', 'Twitter'], budget: 5000, startDate: '2026-01-01', endDate: '2026-01-31', status: 'active' },
  { id: 2, name: 'Summer Discount', platforms: ['Instagram'], budget: 3000, startDate: '2026-06-01', endDate: '2026-06-30', status: 'planned' },
];

// GET /api/campaigns - List Campaigns
router.get('/api/campaigns', (req, res) => {
  res.json(campaigns);
});

// POST /api/campaigns - Create New Campaign
router.post('/api/campaigns', (req, res) => {
  const newCampaign = { id: campaigns.length + 1, ...req.body };
  campaigns.push(newCampaign);
  res.status(201).json(newCampaign);
});

// PUT /api/campaigns/:id - Update Campaign
router.put('/api/campaigns/:id', (req, res) => {
  const campaign = campaigns.find((c) => c.id === parseInt(req.params.id));
  if (!campaign) {
    return res.status(404).send('Campaign not found');
  }
  Object.assign(campaign, req.body);
  res.json(campaign);
});

// DELETE /api/campaigns/:id - Delete Campaign
router.delete('/api/campaigns/:id', (req, res) => {
  const index = campaigns.findIndex((c) => c.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).send('Campaign not found');
  }
  const deletedCampaign = campaigns.splice(index, 1);
  res.json(deletedCampaign);
});

module.exports = router;