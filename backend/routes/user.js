import express from 'express';

const router = express.Router();

// POST /api/user/profile - Save/update user profile
router.post('/profile', async (req, res) => {
  try {
    const { userProfile } = req.body;
    const logger = req.app.locals.logger;

    if (!userProfile) {
      return res.status(400).json({ error: 'User profile is required' });
    }

    // In a real application, this would save to database
    // For now, we'll just validate and return the profile
    const validatedProfile = {
      businessOwnerName: userProfile.businessOwnerName || '',
      businessName: userProfile.businessName || '',
      businessType: userProfile.businessType || '',
      msmeCategory: userProfile.msmeCategory || '',
      city: userProfile.city || '',
      state: userProfile.state || '',
      email: userProfile.email || '',
      mobileNumber: userProfile.mobileNumber || '',
      gstNumber: userProfile.gstNumber || '',
      registrationDate: userProfile.registrationDate || '',
      picture: userProfile.picture || '',
      updatedAt: new Date().toISOString()
    };

    logger.info(`User profile updated for: ${validatedProfile.businessOwnerName}`);

    res.json({
      message: 'Profile updated successfully',
      profile: validatedProfile
    });

  } catch (error) {
    req.app.locals.logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/user/profile/:email - Get user profile by email
router.get('/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // In a real application, this would fetch from database
    // For now, return a default profile structure
    const defaultProfile = {
      businessOwnerName: '',
      businessName: '',
      businessType: '',
      msmeCategory: '',
      city: '',
      state: '',
      email: email,
      mobileNumber: '',
      gstNumber: '',
      registrationDate: '',
      picture: ''
    };

    res.json({
      profile: defaultProfile,
      exists: false
    });

  } catch (error) {
    req.app.locals.logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

export default router;
