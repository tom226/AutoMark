const express = require('express');
const cors = require('cors');

const contentRoutes = require('./routes/content');
const competitorRoutes = require('./routes/competitors');
const analyticsRoutes = require('./routes/analytics');
const campaignRoutes = require('./routes/campaigns');
const scheduler = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(contentRoutes);
app.use(competitorRoutes);
app.use(analyticsRoutes);
app.use(campaignRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});