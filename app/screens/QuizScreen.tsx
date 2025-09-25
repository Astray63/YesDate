import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { theme } from '../utils/theme';
import { NavigationProps, QuizOption, QuizQuestion, RootStackParamList } from '../types';
import { getQuizQuestions } from '../utils/data';
import LoadingSpinner from '../components/LoadingSpinner';

interface QuizScreenProps extends NavigationProps {}

export default function QuizScreen({ navigation }: QuizScreenProps) {
  const route = useRoute();
  const city = (route.params as RootStackParamList['Quiz'])?.city;
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizQuestions();
  }, []);

  const loadQuizQuestions = async () => {
    try {
      const questions = await getQuizQuestions();
      setQuizQuestions(questions);
    } catch (error) {
      console.error('Error loading quiz questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;

  const handleOptionSelect = (option: QuizOption) => {
    setSelectedOption(option.id);
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option.value,
    }));
  };

  const handleNext = () => {
    if (!selectedOption) return;

    if (isLastQuestion) {
      // Navigate to Main tabs, specifically the SwipeDate screen with answers and roomId
      navigation.navigate('Main', {
        screen: 'SwipeDate',
        params: {
          quizAnswers: answers,
          city: city,
          roomId: global.currentRoomId || undefined
        }
      });
    } else {
      // Animate transition and go to next question
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedOption(null);
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner
          message="Chargement des questions du quiz..."
          showProgress={false}
          size="medium"
        />
      </SafeAreaView>
    );
  }

  if (quizQuestions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Impossible de charger les questions</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Question {currentQuestionIndex + 1} sur {quizQuestions.length}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Main Content */}
        <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
          <View style={styles.questionContainer}>
            <Text style={styles.questionTitle}>{currentQuestion.question}</Text>
            <Text style={styles.questionSubtitle}>
              {currentQuestion.category === 'mood' && 'Choisis l\'ambiance qui te correspond.'}
              {currentQuestion.category === 'activity_type' && 'Sélectionne ton type d\'activité favori.'}
              {currentQuestion.category === 'location' && 'Où aimerais-tu aller ?'}
              {currentQuestion.category === 'budget' && 'Quel est ton budget idéal ?'}
              {currentQuestion.category === 'duration' && 'Combien de temps as-tu ?'}
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === option.id;
              const isWideOption = currentQuestion.options.length === 5 && index === 4;
              
              return (
                <Pressable
                  key={option.id}
                  style={[
                    styles.optionCard,
                    isWideOption && styles.wideOptionCard,
                    isSelected && styles.selectedOptionCard,
                  ]}
                  onPress={() => handleOptionSelect(option)}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.optionLabel,
                    isSelected && styles.selectedOptionLabel,
                  ]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !selectedOption && styles.disabledButton,
            ]}
            onPress={handleNext}
            disabled={!selectedOption}
          >
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? 'Voir les résultats' : 'Suivant'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.textLight,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  questionTitle: {
    fontSize: theme.fonts.sizes['3xl'],
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  questionSubtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.mutedLight,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.md,
    maxWidth: 340,
  },
  optionCard: {
    width: 148,
    backgroundColor: theme.colors.cardLight,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    minHeight: 100,
  },
  wideOptionCard: {
    width: '100%',
  },
  selectedOptionCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '1A', // 10% opacity
    transform: [{ scale: 1.05 }],
  },
  optionEmoji: {
    fontSize: 32,
  },
  optionLabel: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  selectedOptionLabel: {
    color: theme.colors.primary,
  },
  bottomSection: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  disabledButton: {
    backgroundColor: theme.colors.mutedLight,
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: theme.fonts.sizes.md,
    fontWeight: '700' as any,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.mutedLight,
    textAlign: 'center',
  },
});
