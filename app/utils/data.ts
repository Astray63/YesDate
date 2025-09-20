import { QuizQuestion } from '../types';

export const quizQuestions: QuizQuestion[] = [
  {
    id: '1',
    question: 'Comment te sens-tu aujourd\'hui ?',
    category: 'mood',
    options: [
      { id: '1a', label: 'Heureux', emoji: '😊', value: 'happy' },
      { id: '1b', label: 'Excité', emoji: '🥳', value: 'excited' },
      { id: '1c', label: 'Relaxé', emoji: '😌', value: 'relaxed' },
      { id: '1d', label: 'Curieux', emoji: '🧐', value: 'curious' },
      { id: '1e', label: 'Amoureux', emoji: '🥰', value: 'romantic' },
    ],
  },
  {
    id: '2',
    question: 'Quel type d\'activité préfères-tu ?',
    category: 'activity_type',
    options: [
      { id: '2a', label: 'Aventure', emoji: '🏔️', value: 'adventure' },
      { id: '2b', label: 'Détente', emoji: '🧘‍♀️', value: 'relaxation' },
      { id: '2c', label: 'Culture', emoji: '🎭', value: 'culture' },
      { id: '2d', label: 'Gastronomie', emoji: '🍽️', value: 'food' },
      { id: '2e', label: 'Sport', emoji: '⚽', value: 'sport' },
    ],
  },
  {
    id: '3',
    question: 'Où préfères-tu sortir ?',
    category: 'location',
    options: [
      { id: '3a', label: 'À la maison', emoji: '🏠', value: 'home' },
      { id: '3b', label: 'En ville', emoji: '🏙️', value: 'city' },
      { id: '3c', label: 'Dans la nature', emoji: '🌲', value: 'nature' },
      { id: '3d', label: 'Près de l\'eau', emoji: '🌊', value: 'water' },
      { id: '3e', label: 'Peu importe', emoji: '🤷‍♀️', value: 'anywhere' },
    ],
  },
  {
    id: '4',
    question: 'Quel budget pour cette sortie ?',
    category: 'budget',
    options: [
      { id: '4a', label: 'Gratuit', emoji: '💚', value: 'free' },
      { id: '4b', label: 'Économique', emoji: '💛', value: 'budget' },
      { id: '4c', label: 'Modéré', emoji: '🧡', value: 'moderate' },
      { id: '4d', label: 'Premium', emoji: '💜', value: 'premium' },
      { id: '4e', label: 'Peu importe', emoji: '💝', value: 'any' },
    ],
  },
  {
    id: '5',
    question: 'Combien de temps avez-vous ?',
    category: 'duration',
    options: [
      { id: '5a', label: '30 min', emoji: '⏰', value: 'short' },
      { id: '5b', label: '1-2 heures', emoji: '🕐', value: 'medium' },
      { id: '5c', label: 'Demi-journée', emoji: '🕕', value: 'half_day' },
      { id: '5d', label: 'Journée entière', emoji: '🌅', value: 'full_day' },
      { id: '5e', label: 'Weekend', emoji: '📅', value: 'weekend' },
    ],
  },
];

export const sampleDateIdeas = [
  {
    id: '1',
    title: 'Pique-nique aux étoiles',
    description: 'Trouvez un endroit loin des lumières de la ville, étendez une couverture et profitez du ciel nocturne avec votre partenaire. Emportez des collations et des boissons pour une soirée romantique sous les étoiles.',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-EMaMd5j7PMY-Kbk9YYHP8YhaR54UeJC2Kwz_wYOm6J6eYR_KRE2CBdQLIX7G0iAYoZE_g81HGh_I--AaPvGDN92j1oqE3onoCZrg9IdD5Ybogq3sIIteqXwOwOL7gkcQV7QyBvOAWHK8u_2cHATbCnYYT82b4a_w16TSoZ8zcoMPfvf9e8OGIhqjoK8pS5E_6h-PQMV4ujI2CZkjk9VRi7sY0HrkTfBTRgTS4MKnsLNfxn9hQvF46ZPZk6z-QpKS6AzQAL2kUHA',
    duration: '1h 30min',
    category: 'romantic',
    cost: 'budget',
    location_type: 'nature',
    generated_by: 'ai' as const,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Cours de cuisine',
    description: 'Apprenez à cuisiner un nouveau plat ensemble dans un cours de cuisine local. Une excellente façon de créer des souvenirs délicieux et d\'apprendre quelque chose de nouveau.',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2jwZA2c7GEjxuI2k6arLDI2uTmyLOEJOs45x8urdXDGZct1VDSplhr4aabykYsM2iuDzuLvGh2BUK52_34RWBIrNmHUdost7Spkc9QwvHDZ9-lKMnUeI3dJkbwrry0YBwfhL51qwimM77hO8VsDrLkR8c3KSCVpx6F1XSmp8heegUJ4tuzr_E5dkmslfBgW5xnwRGW3_AsTIFGVi_gsLNZqrSdzJ8UGFEg4qq4Z2dQA8nLuDC8_eldalaNFWvcAK_4e9AsuWHQGo',
    duration: '2h 30min',
    category: 'food',
    cost: 'moderate',
    location_type: 'city',
    generated_by: 'ai' as const,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Randonnée en montagne',
    description: 'Profitez de la nature et de vues imprenables lors d\'une randonnée en montagne. Emportez un pique-nique et prenez le temps d\'admirer les paysages ensemble.',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrVjawXYkbqoAn8QmrZC_xeU8q4zCRnSBz77JYfNgOzvKgI5mjulo28DsgyELWJ-pD19kds_Tl8WKxSrTt8qAQdR5B4iJz5l76RFPbLUuVd-DWsD2O31C4ykg2dzjWIiAf2NvSXzhmt-qcHDM_VivBzyN1TOd4gEF7MOWCQHrlaf2epJxH5dFF-0LaWm-Q4OnPv_okjG1v3O4Np_81YeILiOKFTZfEoIs6mnRb2zj_DiN5Em5TUnQuZ9JcdT90IOgclvSsQP2IaW0',
    duration: '4h',
    category: 'adventure',
    cost: 'free',
    location_type: 'nature',
    generated_by: 'community' as const,
    created_at: new Date().toISOString(),
  },
];

export const achievements = [
  {
    id: '1',
    title: 'Completed 10 dates',
    description: 'Date Night Champion',
    icon: '🏆',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmctUTMPKkJjXaehUZH_352kjkfIVVEIQo7jgkl7AAicKKCQMj2pRwLClX3Xl3hJPRHAhN9dgLLpCTfu6cqu0Rc9dPOpaIvTPBkqeDmKzTawFWm-8QdPBEqpEPlZE8-31cN9GKU07eapbnK5N47qkKW83IXIQL322fNKDGwvLrwZnnN_9E3OTgET2ORc8WTgS1cGr499dHCTagJaJZXLtLy-1awVV5pg2D5uBF6vWbO5G40KaYOakXpJb7FW2zICRJoZxfjANh2lQ',
    category: 'dates',
    points: 100,
  },
  {
    id: '2',
    title: 'Tried 5 outdoor activities',
    description: 'Adventure Seekers',
    icon: '🥾',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCC-20oAGCI5-pWKJFGU_wIChEoYeBnHURQDkD3BRVLdYkllc8YfTkjPqZR91wGQYx4ncclpLbN2_k6cdQTX9eA_xeRb6ANOb759Ehm5eHJS3sZf1h08cfCJk6h9NY4p1vlizd2jWaRKRUDDem_hjNRr8-9wAFDVUrHYB5NjVv8BrygmrJhT8_vaQ-1IzbGLQmjjnxfOnSJWxRSpGbqgtkTjx-gwZO5pgdd0b5bUuBDVAUnRv4plhPAxv8yiKkhkJbIe-zzi79rC-k',
    category: 'adventure',
    points: 75,
  },
  {
    id: '3',
    title: 'Tried 5 new cuisines',
    description: 'Foodie Explorers',
    icon: '🍜',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4s2xWkHMBFDhdyeLVIn3bPYfcg_aM-d5RnVqKqiPdffgxP2FVxn7N-QETgKQGLWlhzDD00NxlKvpw4LYUTAj2uw-_AROH8Q20JYAkyGdDbgrSIPG5uiF6uysaWunAqOxERDBJJ94_3XEoCNGHbE-TPRPo7dcc2agPrEGxQenlRExzaP2AmLNKL-VZykAedcnpG708a4nf28aHmS5MSbV8N9sknlcM1v_6PAfg1fkFPXVhmJsAr65PdDT3Ny-3CZb0mJw8rSDWIWM',
    category: 'food',
    points: 60,
  },
];