import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';
import { NavigationProps } from '../types';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps extends NavigationProps {}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Top section with image and text */}
        <View style={styles.topSection}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPbPygbuTWZKo9IYIC4vPncSEv3R8reBiAT5yQf9h1ICOzyDoaAO4s_vODxQNq0m6vOupDmpaYq2YVGYDe-sbGyHsBDXp7D5Pm9GVBSATleo_DDsDKtTgbm2OWZPdkehlJcdGWYWOuIcWfhZ00Y8cLckNLiZI6gIixof1Z3ec2Fx1fuSjW7evMRTJ0uG6eBZly27AN_E440ADvsEUHtum99ewvnqKOU4IwhLDykvpg0WqlEMjHeZP9l27aZQ6jiNq5rAnhNXOvtoQ',
              }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.textContainer}>
          <Text style={styles.mainTitle}>
            Fatigué de "Je ne sais pas, qu'est-ce que tu veux faire ?"
          </Text>
          <Text style={styles.subtitle}>
            Découvrez des idées de rendez-vous personnalisées et planifiez des moments inoubliables ensemble.
          </Text>
          </View>
        </View>

        {/* Bottom button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('ModeChoice')}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>Trouve ta sortie</Text>
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
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  imageContainer: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  heroImage: {
    width: '100%',
    height: height * 0.35,
    borderRadius: theme.borderRadius.lg,
  } as any,
  textContainer: {
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: theme.fonts.sizes['3xl'],
    fontWeight: '700' as any,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.textLight + '80', // 80% opacity
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '700' as any,
  },
});
