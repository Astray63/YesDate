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
import { authService, supabase } from '../services/supabase';

interface QuizScreenProps extends NavigationProps {}

export default function QuizScreen({ navigation }: QuizScreenProps) {
  const route = useRoute();
  const params = route.params as RootStackParamList['Quiz'] || {};
  const city = params.city;
  const roomId = params.roomId;
  const isCoupleMode = params.isCoupleMode || false;
  
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [loading, setLoading] = useState(true);
  const [waitingForPartner, setWaitingForPartner] = useState(false);
  const [partnerName, setPartnerName] = useState<string>('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [waitingForPartnerToJoin, setWaitingForPartnerToJoin] = useState(false);
  const [bothPartnersReady, setBothPartnersReady] = useState(false);

  useEffect(() => {
    // Check if both partners are ready for couple mode
    const checkPartnersReady = async () => {
      if (isCoupleMode && roomId) {
        try {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            // Get room details to check if both partners are present
            const { data: room } = await supabase
              .from('rooms')
              .select('*')
              .eq('id', roomId)
              .single();

            if (room) {
              // Check if both creator and member are present
              if (room.creator_id && room.member_id && room.status === 'active') {
                setBothPartnersReady(true);
              } else if (room.creator_id === currentUser.id && !room.member_id) {
                // Creator is waiting for member to join
                setWaitingForPartnerToJoin(true);
                
                // Start polling to check when member joins
                const checkInterval = setInterval(async () => {
                  const { data: updatedRoom } = await supabase
                    .from('rooms')
                    .select('*')
                    .eq('id', roomId)
                    .single();
                  
                  if (updatedRoom && updatedRoom.member_id && updatedRoom.status === 'active') {
                    clearInterval(checkInterval);
                    setWaitingForPartnerToJoin(false);
                    setBothPartnersReady(true);
                  }
                }, 2000); // Check every 2 seconds
                
                // Cleanup interval when component unmounts
                return () => clearInterval(checkInterval);
              } else if (room.member_id === currentUser.id && room.creator_id) {
                // Member is ready, creator should already be there
                setBothPartnersReady(true);
              }
            }
          }
        } catch (error) {
          console.error('Error checking partners readiness:', error);
          // Fallback - allow quiz to proceed
          setBothPartnersReady(true);
        }
      } else {
        // Solo mode - ready to start
        setBothPartnersReady(true);
      }
    };

    checkPartnersReady();
    loadQuizQuestions();
  }, [isCoupleMode, roomId]);

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

  const handleNext = async () => {
    if (!selectedOption) return;

    if (isLastQuestion) {
      // Save quiz answers
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser && roomId && isCoupleMode) {
          await authService.saveQuizResponses(roomId, currentUser.id, answers);
          
          // Check if both partners have completed the quiz
          setCheckingStatus(true);
          const quizStatus = await authService.getRoomQuizResponses(roomId);
          
          if (quizStatus.bothCompleted) {
            // Both partners completed - navigate to swipe
            navigation.navigate('Main', {
              screen: 'SwipeDate',
              params: {
                quizAnswers: answers,
                city: city,
                roomId: roomId,
                isCoupleMode: true
              }
            });
          } else {
            // Only one partner completed - show waiting screen
            // Get partner name for personalized message
            if (quizStatus.user1Response?.user_id === currentUser.id && quizStatus.user2Response?.profiles) {
              setPartnerName(quizStatus.user2Response.profiles.full_name || 'ton partenaire');
            } else if (quizStatus.user2Response?.user_id === currentUser.id && quizStatus.user1Response?.profiles) {
              setPartnerName(quizStatus.user1Response.profiles.full_name || 'ton partenaire');
            } else {
              setPartnerName('ton partenaire');
            }
            
            setWaitingForPartner(true);
            
            // Start polling to check when partner completes
            const checkInterval = setInterval(async () => {
              const status = await authService.getRoomQuizResponses(roomId);
              if (status.bothCompleted) {
                clearInterval(checkInterval);
                navigation.navigate('Main', {
                  screen: 'SwipeDate',
                  params: {
                    quizAnswers: answers,
                    city: city,
                    roomId: roomId,
                    isCoupleMode: true
                  }
                });
              }
            }, 3000); // Check every 3 seconds
            
            // Cleanup interval when component unmounts
            return () => clearInterval(checkInterval);
          }
        } else {
          // Solo mode or no room - navigate directly
          navigation.navigate('Main', {
            screen: 'SwipeDate',
            params: {
              quizAnswers: answers,
              city: city,
              roomId: roomId,
              isCoupleMode: isCoupleMode
            }
          });
        }
      } catch (error) {
        console.error('Error saving quiz responses:', error);
        // Fallback - navigate anyway
        navigation.navigate('Main', {
          screen: 'SwipeDate',
          params: {
            quizAnswers: answers,
            city: city,
            roomId: roomId,
            isCoupleMode: isCoupleMode
          }
        });
      } finally {
        setCheckingStatus(false);
      }
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
          quizMode={true}
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

  // Show waiting screen if partner hasn't completed quiz yet
  if (waitingForPartner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.waitingContainer}>
          <View style={styles.waitingContent}>
            <Text style={styles.waitingEmoji}>⏳</Text>
            <Text style={styles.waitingTitle}>En attente de {partnerName}</Text>
            <Text style={styles.waitingSubtitle}>
              {partnerName === 'ton partenaire' 
                ? 'Ton partenaire est en train de répondre au quiz' 
                : `${partnerName} est en train de répondre au quiz`}
            </Text>
            <Text style={styles.waitingDescription}>
              Nous générons des suggestions parfaites pour vous deux dès que {partnerName === 'ton partenaire' ? 'il/elle' : partnerName.split(' ')[0]} aura terminé !
            </Text>
            
            <View style={styles.waitingAnimationContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
            
            <Text style={styles.waitingTip}>
              💡 Conseil : Profites de ce moment pour imaginer quelle surprise tu aimerais lui faire !
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show waiting screen if partner needs to join before starting quiz
  if (waitingForPartnerToJoin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.waitingContainer}>
          <View style={styles.waitingContent}>
            <Text style={styles.waitingEmoji}>👥</Text>
            <Text style={styles.waitingTitle}>En attente de votre partenaire</Text>
            <Text style={styles.waitingSubtitle}>
              Partagez le code de la room avec votre partenaire pour qu'il/elle puisse vous rejoindre
            </Text>
            <Text style={styles.waitingDescription}>
              Le quiz commencera automatiquement dès que votre partenaire aura rejoint la room !
            </Text>
            
            <View style={styles.waitingAnimationContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
            
            <Text style={styles.waitingTip}>
              💡 Conseil : Vous pouvez déjà commencer à réfléchir à vos préférences pour votre prochaine date !
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Don't show quiz until both partners are ready in couple mode
  if (isCoupleMode && !bothPartnersReady) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner
          quizMode={true}
          showProgress={false}
          size="medium"
        />
      </SafeAreaView>
    );
  }

  // Show checking status if verifying partner's completion
  if (checkingStatus) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner
          quizMode={true}
          showProgress={false}
          size="medium"
        />
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
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
  },
  waitingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    maxWidth: 400,
  },
  waitingEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  waitingTitle: {
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  waitingSubtitle: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.mutedLight,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  waitingDescription: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  waitingAnimationContainer: {
    marginVertical: theme.spacing.xl,
  },
  waitingTip: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
    backgroundColor: theme.colors.primary + '15',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
});
