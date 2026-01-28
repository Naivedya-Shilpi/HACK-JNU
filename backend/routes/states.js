import express from 'express';
import { INDIAN_STATES_DATA } from '../data/states.js';

const router = express.Router();

// GET /api/states - Get all states and union territories
router.get('/', (req, res) => {
  try {
    res.json({
      states: INDIAN_STATES_DATA.states,
      unionTerritories: INDIAN_STATES_DATA.unionTerritories,
      total: INDIAN_STATES_DATA.states.length + INDIAN_STATES_DATA.unionTerritories.length
    });
  } catch (error) {
    req.app.locals.logger.error('Get states error:', error);
    res.status(500).json({ error: 'Failed to retrieve states data' });
  }
});

// GET /api/states/:id - Get specific state/UT details
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const state = INDIAN_STATES_DATA.states.find(s => s.id === id.toUpperCase());
    const ut = INDIAN_STATES_DATA.unionTerritories.find(u => u.id === id.toUpperCase());
    
    const result = state || ut;
    
    if (!result) {
      return res.status(404).json({ error: 'State or Union Territory not found' });
    }

    res.json(result);
  } catch (error) {
    req.app.locals.logger.error('Get state details error:', error);
    res.status(500).json({ error: 'Failed to retrieve state details' });
  }
});

// GET /api/states/search/:query - Search states by name
router.get('/search/:query', (req, res) => {
  try {
    const { query } = req.params;
    const searchTerm = query.toLowerCase();
    
    const matchingStates = INDIAN_STATES_DATA.states.filter(state => 
      state.name.toLowerCase().includes(searchTerm) ||
      state.capital.toLowerCase().includes(searchTerm)
    );
    
    const matchingUTs = INDIAN_STATES_DATA.unionTerritories.filter(ut => 
      ut.name.toLowerCase().includes(searchTerm) ||
      ut.capital.toLowerCase().includes(searchTerm)
    );

    res.json({
      states: matchingStates,
      unionTerritories: matchingUTs,
      total: matchingStates.length + matchingUTs.length
    });
  } catch (error) {
    req.app.locals.logger.error('Search states error:', error);
    res.status(500).json({ error: 'Failed to search states' });
  }
});

export default router;
