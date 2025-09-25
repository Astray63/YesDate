import * as Font from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  Cinzel_400Regular,
  Cinzel_600SemiBold,
} from '@expo-google-fonts/cinzel';
import {
  Fredoka_400Regular,
  Fredoka_600SemiBold,
} from '@expo-google-fonts/fredoka';
import {
  Quicksand_400Regular,
  Quicksand_600SemiBold,
} from '@expo-google-fonts/quicksand';

export const useFonts = () => {
  return Font.useFonts({
    'Playfair Display': PlayfairDisplay_400Regular,
    'Playfair Display Bold': PlayfairDisplay_700Bold,
    'Cinzel': Cinzel_400Regular,
    'Cinzel SemiBold': Cinzel_600SemiBold,
    'Fredoka': Fredoka_400Regular,
    'Fredoka SemiBold': Fredoka_600SemiBold,
    'Quicksand': Quicksand_400Regular,
    'Quicksand SemiBold': Quicksand_600SemiBold,
  });
};