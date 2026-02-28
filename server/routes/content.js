const express = require('express');
const router = express.Router();

// Mock Database Interaction
const contentQueue = [
  { id: 1, content: 'Sample Content 1', status: 'pending' },
  { id: 2, content: 'Sample Content 2', status: 'pending' },
];

// GET /api/content - List Content Queue
router.get('/api/content', (req, res) => {
  res.json(contentQueue);
});

// POST /api/content/generate - Trigger AI Content Generation
router.post('/api/content/generate', (req, res) => {
  const newContent = { id: contentQueue.length + 1, content: req.body.content, status: 'pending' };
  contentQueue.push(newContent);
  res.status(201).json(newContent);
});

// PUT /api/content/:id/approve - Approve Content
router.put('/api/content/:id/approve', (req, res) => {
  const content = contentQueue.find((c) => c.id === parseInt(req.params.id));
  if (!content) {
    return res.status(404).send('Content not found');
  }
  content.status = 'approved';
  res.json(content);
});

// DELETE /api/content/:id - Delete Content
router.delete('/api/content/:id', (req, res) => {
  const index = contentQueue.findIndex((c) => c.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).send('Content not found');
  }
  const deletedContent = contentQueue.splice(index, 1);
  res.json(deletedContent);
});

module.exports = router;