import { Router } from 'express';

const router = Router();

interface QuizAnswers {
  mood?: string;
  activity_type?: string;
  location?: string;
  budget?: string;
  duration?: string;
}

// Generate date ideas based on quiz answers
router.post('/generate', async (req: any, res: any) => {
  try {
    const { quizAnswers }: { quizAnswers: QuizAnswers } = req.body;

    // Mock OpenRouter API call
    // In real implementation, you would call OpenRouter API here
    const generatedDates = await mockGenerateDatesWithAI(quizAnswers);

    res.json({
      success: true,
      dates: generatedDates,
    });
  } catch (error) {
    console.error('Error generating dates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate date ideas',
    });
  }
});

// Mock AI generation function
async function mockGenerateDatesWithAI(answers: QuizAnswers) {
  // This would be replaced with actual OpenRouter API call
  const baseDates = [
    {
      id: `generated-${Date.now()}-1`,
      title: 'Romantic Picnic under the Stars',
      description: 'Based on your mood and preferences, enjoy a cozy evening outdoors with your favorite snacks and drinks while stargazing together.',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-EMaMd5j7PMY-Kbk9YYHP8YhaR54UeJC2Kwz_wYOm6J6eYR_KRE2CBdQLIX7G0iAYoZE_g81HGh_I--AaPvGDN92j1oqE3onoCZrg9IdD5Ybogq3sIIteqXwOwOL7gkcQV7QyBvOAWHK8u_2cHATbCnYYT82b4a_w16TSoZ8zcoMPfvf9e8OGIhqjoK8pS5E_6h-PQMV4ujI2CZkjk9VRi7sY0HrkTfBTRgTS4MKnsLNfxn9hQvF46ZPZk6z-QpKS6AzQAL2kUHA',
      duration: answers.duration === 'short' ? '30 min' : answers.duration === 'medium' ? '2 hours' : '4 hours',
      category: answers.activity_type || 'romantic',
      cost: answers.budget || 'budget',
      location_type: answers.location || 'nature',
      generated_by: 'ai' as const,
      created_at: new Date().toISOString(),
    },
    {
      id: `generated-${Date.now()}-2`,
      title: 'Cooking Adventure Together',
      description: 'Perfect for your current mood! Try cooking a new cuisine together and discover flavors from around the world.',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2jwZA2c7GEjxuI2k6arLDI2uTmyLOEJOs45x8urdXDGZct1VDSplhr4aabykYsM2iuDzuLvGh2BUK52_34RWBIrNmHUdost7Spkc9QwvHDZ9-lKMnUeI3dJkbwrry0YBwfhL51qwimM77hO8VsDrLkR8c3KSCVpx6F1XSmp8heegUJ4tuzr_E5dkmslfBgW5xnwRGW3_AsTIFGVi_gsLNZqrSdzJ8UGFEg4qq4Z2dQA8nLuDC8_eldalaNFWvcAK_4e9AsuWHQGo',
      duration: answers.duration === 'short' ? '1 hour' : '3 hours',
      category: 'food',
      cost: answers.budget || 'moderate',
      location_type: 'home',
      generated_by: 'ai' as const,
      created_at: new Date().toISOString(),
    },
    {
      id: `generated-${Date.now()}-3`,
      title: 'Adventure Hiking Trail',
      description: 'Get your hearts pumping with a scenic hike! Perfect for exploring nature and creating unforgettable memories together.',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrVjawXYkbqoAn8QmrZC_xeU8q4zCRnSBz77JYfNgOzvKgI5mjulo28DsgyELWJ-pD19kds_Tl8WKxSrTt8qAQdR5B4iJz5l76RFPbLUuVd-DWsD2O31C4ykg2dzjWIiAf2NvSXzhmt-qcHDM_VivBzyN1TOd4gEF7MOWCQHrlaf2epJxH5dFF-0LaWm-Q4OnPv_okjG1v3O4Np_81YeILiOKFTZfEoIs6mnRb2zj_DiN5Em5TUnQuZ9JcdT90IOgclvSsQP2IaW0',
      duration: answers.duration === 'short' ? '2 hours' : '5 hours',
      category: 'adventure',
      cost: 'free',
      location_type: 'nature',
      generated_by: 'ai' as const,
      created_at: new Date().toISOString(),
    },
  ];

  // Filter and customize based on answers
  return baseDates.filter(date => {
    if (answers.location && date.location_type !== answers.location && answers.location !== 'anywhere') {
      return false;
    }
    if (answers.activity_type && date.category !== answers.activity_type) {
      return false;
    }
    return true;
  });
}

export { router as generateDateIdeas };