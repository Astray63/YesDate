import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Easing,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { X, Info, Heart, Filter, Search, ChevronDown } from 'lucide-react-native';

import { theme } from '../utils/theme';
import { NavigationProps, DateIdea } from '../types';
import { getPersonalizedDateIdeas, ProgressCallback, getImageUrl } from '../utils/data';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Budget = 'low' | 'moderate' | 'high' | 'luxury' | 'any';
type Distance = '5km' | '10km' | '25km' | '50km' | 'unlimited';
type Mood = 'romantic' | 'fun' | 'relaxed' | 'adventurous' | 'any';
type Category = 'food' | 'nature' | 'culture' | 'sport' | 'any';
type Sort = 'trending' | 'nearby' | 'new';

type Filters = {
  budget: Budget;
  distance: Distance;
  mood: Mood;
  category: Category;
  sort: Sort;
  search: string;
};

const DEFAULT_FILTERS: Filters = {
  budget: 'any',
  distance: '25km',
  mood: 'any',
  category: 'any',
  sort: 'trending',
  search: '',
};

const STORAGE_KEYS = {
  filters: 'yesdate_filters_v1',
  likes: 'yesdate_likes_v1',
  dislikesSession: 'yesdate_dislikes_session_v1',
  deckIndex: 'yesdate_deck_index_v1',
};

interface DatesScreenProps extends NavigationProps {
  route: {
    params?: {
      quizAnswers?: { [key: string]: string };
      city?: string;
    };
  };
}

export default function DatesScreen({ navigation, route }: DatesScreenProps) {
  const { width, height } = useWindowDimensions();
  const CARD_WIDTH = Math.min(width * 0.92, 420);
  const CARD_HEIGHT = Math.min(height * 0.78, 720);
  const SWIPE_THRESHOLD_X = Math.min(width * 0.28, 220);
  const SWIPE_THRESHOLD_Y = Math.min(height * 0.18, 160);

  // Data/Deck
  const [dates, setDates] = useState<DateIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Chargement...');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEmpty, setShowEmpty] = useState(false);

  // Details sheet
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selected, setSelected] = useState<DateIdea | null>(null);

  // Undo
  const actionHistory = useRef<{ id: string; direction: 'left' | 'right' }[]>([]);

  // Animated values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Next card preview
  const nextTranslateX = useRef(new Animated.Value(0)).current;
  const nextScale = useRef(new Animated.Value(0.96)).current;
  const nextOpacity = useRef(new Animated.Value(0.75)).current;

  // Badges opacity
  const likeOpacity = useRef(new Animated.Value(0)).current;
  const nopeOpacity = useRef(new Animated.Value(0)).current;

  // Details bottom sheet animation
  const sheetY = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const current = dates[currentIndex];
  const next = dates[currentIndex + 1];
  const isLastCard = currentIndex >= dates.length - 1;

  // Preload next image to keep 60fps feel on swipe
  useEffect(() => {
    if (next?.image_url) {
      Image.prefetch(next.image_url).catch(() => {});
    }
  }, [currentIndex, dates]);

  // Load persisted filters and deck position
  useEffect(() => {
    (async () => {
      try {
        const savedFiltersRaw = await AsyncStorage.getItem(STORAGE_KEYS.filters);
        if (savedFiltersRaw) {
          const saved: Filters = JSON.parse(savedFiltersRaw);
          setFilters(prev => ({ ...prev, ...saved }));
        }
        const savedIndexRaw = await AsyncStorage.getItem(STORAGE_KEYS.deckIndex);
        if (savedIndexRaw) {
          const idx = Number(savedIndexRaw);
          if (!Number.isNaN(idx)) setCurrentIndex(idx);
        }
      } catch {}
    })();
  }, []);

  // Load ideas
  useEffect(() => {
    loadIdeas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Empty state when finished
  useEffect(() => {
    if (!loading && currentIndex >= dates.length) {
      setShowEmpty(true);
    } else {
      setShowEmpty(false);
    }
  }, [loading, dates.length, currentIndex]);

  const onProgress: ProgressCallback = (message, progress) => {
    setLoadingMessage(message);
  };

  const loadIdeas = async () => {
    try {
      setLoading(true);
      setLoadingMessage('Initialisation...');
      const quizAnswers = route?.params?.quizAnswers || {};
      const city = route?.params?.city;

      const results = await getPersonalizedDateIdeas(quizAnswers, city, onProgress);

      // Basic local filter pass (mood/category/budget/location search)
      const filtered = results.filter((item) => {
        if (filters.mood !== 'any' && item.category !== filters.mood) return false;
        if (filters.category !== 'any' && item.category !== filters.category) return false;
        if (filters.budget !== 'any' && item.cost !== filters.budget) return false;
        if (filters.search) {
          const s = filters.search.toLowerCase();
          const hit =
            item.title?.toLowerCase().includes(s) ||
            item.description?.toLowerCase().includes(s) ||
            item.area?.toLowerCase().includes(s);
          if (!hit) return false;
        }
        return true;
      });

      setDates(filtered);
      if (filtered.length === 0) setShowEmpty(true);
      // Reset deck position for new data
      setCurrentIndex(0);
      await AsyncStorage.setItem(STORAGE_KEYS.deckIndex, '0');
    } catch (e) {
      setDates([]);
      setShowEmpty(true);
    } finally {
      setLoading(false);
    }
  };

  // Filters persistence
  const saveFilters = async (f: Filters) => {
    setFilters(f);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(f));
    } catch {}
  };

  // Swipe helpers
  const resetCard = () => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(rotate, { toValue: 0, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(nextTranslateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(nextScale, { toValue: 0.96, useNativeDriver: true }),
      Animated.spring(nextOpacity, { toValue: 0.75, useNativeDriver: true }),
      Animated.timing(likeOpacity, { toValue: 0, duration: 100, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(nopeOpacity, { toValue: 0, duration: 100, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  };

  const advanceDeck = async () => {
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.deckIndex, String(nextIdx));
    } catch {}
    translateX.setValue(0);
    translateY.setValue(0);
    rotate.setValue(0);
    scale.setValue(1);
    likeOpacity.setValue(0);
    nopeOpacity.setValue(0);
    nextTranslateX.setValue(0);
    nextScale.setValue(0.96);
    nextOpacity.setValue(0.75);
  };

  const persistAction = async (id: string, direction: 'left' | 'right') => {
    try {
      if (direction === 'right') {
        const raw = (await AsyncStorage.getItem(STORAGE_KEYS.likes)) || '[]';
        const likes: string[] = JSON.parse(raw);
        if (!likes.includes(id)) likes.push(id);
        await AsyncStorage.setItem(STORAGE_KEYS.likes, JSON.stringify(likes));
      } else {
        const raw = (await AsyncStorage.getItem(STORAGE_KEYS.dislikesSession)) || '[]';
        const list: string[] = JSON.parse(raw);
        if (!list.includes(id)) list.push(id);
        await AsyncStorage.setItem(STORAGE_KEYS.dislikesSession, JSON.stringify(list));
      }
    } catch {}
  };

  const undoLast = async () => {
    const last = actionHistory.current.pop();
    if (!last) return;
    // Move index back one step
    const idx = Math.max(currentIndex - 1, 0);
    setCurrentIndex(idx);
    await AsyncStorage.setItem(STORAGE_KEYS.deckIndex, String(idx));
    // Remove persistence for that action best-effort
    try {
      if (last.direction === 'right') {
        const raw = (await AsyncStorage.getItem(STORAGE_KEYS.likes)) || '[]';
        const likes: string[] = JSON.parse(raw);
        await AsyncStorage.setItem(
          STORAGE_KEYS.likes,
          JSON.stringify(likes.filter((x) => x !== last.id))
        );
      } else {
        const raw = (await AsyncStorage.getItem(STORAGE_KEYS.dislikesSession)) || '[]';
        const list: string[] = JSON.parse(raw);
        await AsyncStorage.setItem(
          STORAGE_KEYS.dislikesSession,
          JSON.stringify(list.filter((x) => x !== last.id))
        );
      }
    } catch {}
  };

  const performSwipe = async (direction: 'left' | 'right') => {
    if (!current) return;
    if (direction === 'right') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: direction === 'right' ? width : -width,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: direction === 'right' ? 1 : -1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(direction === 'right' ? likeOpacity : nopeOpacity, {
        toValue: 1,
        duration: 120,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      actionHistory.current.push({ id: current.id, direction });
      await persistAction(current.id, direction);
      if (isLastCard) {
        // leave index at last to show empty state below
        setCurrentIndex(dates.length);
      } else {
        await advanceDeck();
      }
    });
  };

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, translationY } = event.nativeEvent;

    translateX.setValue(translationX);
    translateY.setValue(translationY);

    const r = translationX / width;
    rotate.setValue(r);

    const s = 1 - Math.min(Math.abs(translationX) / width, 0.1);
    scale.setValue(Math.max(s, 0.9));

    // adjust next card preview
    const p = Math.min(Math.abs(translationX) / width, 1);
    nextOpacity.setValue(0.75 + p * 0.25);
    nextScale.setValue(0.96 + p * 0.04);
    nextTranslateX.setValue(translationX * 0.08);

    // badges
    likeOpacity.setValue(translationX > 0 ? Math.min(translationX / SWIPE_THRESHOLD_X, 1) : 0);
    nopeOpacity.setValue(translationX < 0 ? Math.min(-translationX / SWIPE_THRESHOLD_X, 1) : 0);
  };

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY, velocityX } = event.nativeEvent;

      // Up swipe to open details
      if (-translationY > SWIPE_THRESHOLD_Y && Math.abs(translationX) < SWIPE_THRESHOLD_X) {
        openDetails(current);
        resetCard();
        return;
      }

      if (Math.abs(translationX) > SWIPE_THRESHOLD_X || Math.abs(velocityX) > 900) {
        performSwipe(translationX > 0 ? 'right' : 'left');
      } else {
        resetCard();
      }
    }
  };

  const openDetails = (idea?: DateIdea | null) => {
    if (!idea) return;
    setSelected(idea);
    setDetailsVisible(true);

    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(sheetY, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const closeDetails = () => {
    Animated.parallel([
      Animated.timing(sheetY, { toValue: height, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setDetailsVisible(false);
      setSelected(null);
    });
  };

  // UI helpers
  const Badge = ({ label, color, rotation = -18, opacity }: { label: string; color: string; rotation?: number; opacity: Animated.AnimatedInterpolation<number> | Animated.Value }) => (
    <Animated.View
      style={[
        styles.badge,
        {
          borderColor: color,
          transform: [{ rotate: `${rotation}deg` }],
          opacity,
        },
      ]}
      accessible accessibilityLabel={label}
    >
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </Animated.View>
  );

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-14deg', '0deg', '14deg'],
  });

  // Filters Bar
  const [filtersOpen, setFiltersOpen] = useState(false);
  const applyFilter = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    saveFilters(next);
  };

  const debouncedSetSearch = useRef<NodeJS.Timeout | null>(null);
  const onSearchChange = (text: string) => {
    if (debouncedSetSearch.current) clearTimeout(debouncedSetSearch.current);
    debouncedSetSearch.current = setTimeout(() => {
      applyFilter({ search: text });
    }, 300);
  };

  const FilterChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const TopFilters = () => {
    return (
      <View style={styles.filtersContainer}>
        <View style={styles.filterHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Filter size={18} color={theme.colors.mutedLight} />
            <Text style={styles.filtersTitle}>Filtres</Text>
          </View>
          <TouchableOpacity onPress={() => setFiltersOpen((s) => !s)} style={styles.collapseBtn}>
            <ChevronDown size={18} color={theme.colors.mutedLight} style={{ transform: [{ rotate: filtersOpen ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <Search size={18} color={theme.colors.mutedLight} />
          <TextInput
            accessibilityLabel="Rechercher"
            placeholder="Rechercher une idée, un lieu..."
            placeholderTextColor={theme.colors.mutedLight}
            style={styles.searchInput}
            defaultValue={filters.search}
            onChangeText={onSearchChange}
          />
        </View>

        {filtersOpen && (
          <View style={{ gap: 10 }}>
            <View style={styles.chipsRow}>
              {(['any', 'low', 'moderate', 'high', 'luxury'] as Budget[]).map((b) => (
                <FilterChip key={b} label={b === 'any' ? 'Budget' : b} active={filters.budget === b} onPress={() => applyFilter({ budget: b })} />
              ))}
            </View>
            <View style={styles.chipsRow}>
              {(['any', 'romantic', 'fun', 'relaxed', 'adventurous'] as Mood[]).map((m) => (
                <FilterChip key={m} label={m === 'any' ? 'Humeur' : m} active={filters.mood === m} onPress={() => applyFilter({ mood: m })} />
              ))}
            </View>
            <View style={styles.chipsRow}>
              {(['any', 'food', 'nature', 'culture', 'sport'] as Category[]).map((c) => (
                <FilterChip key={c} label={c === 'any' ? 'Catégorie' : c} active={filters.category === c} onPress={() => applyFilter({ category: c })} />
              ))}
            </View>
            <View style={styles.chipsRow}>
              {(['5km', '10km', '25km', '50km', 'unlimited'] as Distance[]).map((d) => (
                <FilterChip key={d} label={d} active={filters.distance === d} onPress={() => applyFilter({ distance: d })} />
              ))}
            </View>
            <View style={styles.chipsRow}>
              {(['trending', 'nearby', 'new'] as Sort[]).map((s) => (
                <FilterChip key={s} label={s} active={filters.sort === s} onPress={() => applyFilter({ sort: s })} />
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  // Card visuals with image (fallback to tinted background), gradient overlay, and loading placeholder
  const CardVisual = ({ idea }: { idea: DateIdea }) => {
    const bg = useMemo(() => {
      const map: Record<string, string> = {
        romantic: '#ff6b9d',
        fun: '#ffd93d',
        relaxed: '#6bcf7f',
        adventurous: '#ff8c42',
        food: '#ff6b6b',
        nature: '#4ecdc4',
        culture: '#a8e6cf',
        sport: '#ff8b94',
      };
      return (map[idea.category] || theme.colors.primary) + '30';
    }, [idea.category]);

    const [loaded, setLoaded] = useState(false);
    const uri = idea.image_url || getImageUrl(idea.category, idea.title, 0);

    return (
      <View style={[styles.visual, { backgroundColor: bg }]}>
        {uri ? (
          <>
            <Image
              source={{ uri }}
              style={styles.visualImage}
              resizeMode="cover"
              onLoadEnd={() => setLoaded(true)}
            />
            {!loaded && (
              <View style={styles.imageLoading}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            )}
          </>
        ) : null}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={styles.visualGradient}
        />
      </View>
    );
  };

  // Loading skeleton
  const Skeleton = () => {
    return (
      <View style={{ alignItems: 'center', gap: 14, paddingTop: 8, flex: 1, justifyContent: 'center' }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.cardBase, { width: CARD_WIDTH - i * 14, height: CARD_HEIGHT - i * 10, opacity: 0.5, backgroundColor: theme.colors.cardLight }]} />
        ))}
        <Text style={{ color: theme.colors.mutedLight }}>{loadingMessage}</Text>
      </View>
    );
  };

  // Empty state
  const EmptyState = () => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>Aucune idée ne correspond à vos filtres</Text>
      <Text style={styles.emptySubtitle}>Essayez d'assouplir vos critères ou de réinitialiser les filtres.</Text>
      <TouchableOpacity
        onPress={() => {
          saveFilters(DEFAULT_FILTERS);
          setTimeout(loadIdeas, 50);
        }}
        style={styles.resetBtn}
      >
        <Text style={styles.resetBtnText}>Réinitialiser les filtres</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={loadIdeas} style={[styles.resetBtn, { backgroundColor: theme.colors.cardLight, borderWidth: 1, borderColor: theme.colors.borderLight }]}>
        <Text style={[styles.resetBtnText, { color: theme.colors.textLight }]}>Recharger</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dates</Text>
        <TouchableOpacity
          accessibilityLabel="Ouvrir les filtres"
          onPress={() => setFiltersOpen((s) => !s)}
          style={styles.headerBtn}
        >
          <Filter size={20} color={theme.colors.textLight} />
        </TouchableOpacity>
      </View>

      <TopFilters />

      <View style={styles.deckWrap}>
        {loading ? (
          <Skeleton />
        ) : showEmpty ? (
          <EmptyState />
        ) : current ? (
          <>
            {/* Next preview */}
            {next && (
              <Animated.View
                style={[
                  styles.cardBase,
                  {
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                    opacity: nextOpacity,
                    transform: [{ translateX: nextTranslateX }, { scale: nextScale }, { translateY: -18 }],
                    backgroundColor: theme.colors.cardLight,
                  },
                ]}
              >
                <View style={styles.cardContent}>
                  <CardVisual idea={next} />
                  <View style={styles.cardBottom}>
                    <Text numberOfLines={2} style={styles.cardTitle}>{next.title}</Text>
                    <Text numberOfLines={2} style={styles.cardDesc}>{next.description}</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Current */}
            <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
              <Animated.View
                style={[
                  styles.cardBase,
                  {
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                    transform: [{ translateX }, { translateY }, { rotate: rotateInterpolate }, { scale }],
                    backgroundColor: theme.colors.cardLight,
                  },
                ]}
              >
                {/* Badges */}
                <View pointerEvents="none" style={styles.badgesRow}>
                  <Badge label="LIKE" color="#28c76f" rotation={-16} opacity={likeOpacity} />
                  <Badge label="NOPE" color="#ff4458" rotation={16} opacity={nopeOpacity} />
                </View>

                <Pressable style={styles.cardContent} onPress={() => openDetails(current)} accessible accessibilityLabel="Ouvrir les détails">
                  <CardVisual idea={current} />
                  <View style={styles.cardBottom}>
                    <Text numberOfLines={2} style={styles.cardTitle}>{current.title}</Text>
                    <Text numberOfLines={3} style={styles.cardDesc}>{current.description}</Text>
                    <View style={styles.tagsRow}>
                      {current.category ? (
                        <View style={styles.tag}><Text style={styles.tagText}>{current.category}</Text></View>
                      ) : null}
                      {current.cost ? (
                        <View style={styles.tagAlt}><Text style={styles.tagAltText}>{current.cost}</Text></View>
                      ) : null}
                      {current.location_type ? (
                        <View style={styles.tag}><Text style={styles.tagText}>{current.location_type}</Text></View>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            </PanGestureHandler>
          </>
        ) : null}
      </View>

      {/* Bottom actions */}
      {!loading && !showEmpty && current && (
        <View style={styles.actions}>
          <TouchableOpacity
            accessibilityLabel="Refuser"
            onPress={() => performSwipe('left')}
            style={[styles.actionBtn, styles.btnSmall, { backgroundColor: '#fff' }]}
          >
            <X size={22} color="#ff4458" />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="Infos"
            onPress={() => openDetails(current)}
            style={[styles.actionBtn, styles.btnMedium, { backgroundColor: theme.colors.cardLight, borderWidth: 1, borderColor: theme.colors.borderLight }]}
          >
            <Info size={22} color={theme.colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="Aimer"
            onPress={() => performSwipe('right')}
            style={[styles.actionBtn, styles.btnLarge, { backgroundColor: theme.colors.primary }]}
          >
            <Heart size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Undo */}
      {!loading && actionHistory.current.length > 0 && !detailsVisible && (
        <View style={styles.undoBar}>
          <TouchableOpacity accessibilityLabel="Annuler la dernière action" onPress={undoLast}>
            <Text style={styles.undoText}>Annuler la dernière action</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Details Bottom Sheet */}
      {detailsVisible && (
        <>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          >
            <TouchableOpacity style={{ flex: 1 }} onPress={closeDetails} accessibilityLabel="Fermer les détails" />
          </Animated.View>
          <Animated.View
            style={[
              styles.sheet,
              {
                height: Math.min(height * 0.86, 720),
                transform: [{ translateY: sheetY }],
              },
            ]}
          >
            <View style={styles.sheetGrab} />
            {selected ? (
              <View style={styles.sheetContent}>
                {/* Images carousel */}
                <View style={styles.carouselWrap}>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselContent}
                  >
                    {[0, 1, 2].map((i) => (
                      <Image
                        key={i}
                        source={{ uri: getImageUrl(selected.category || 'romantic', selected.title, i) }}
                        style={styles.carouselImage}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                </View>

                <Text style={styles.sheetTitle}>{selected.title}</Text>
                <Text style={styles.sheetDesc}>{selected.description}</Text>

                <View style={styles.sheetTags}>
                  {selected.category ? (
                    <View style={styles.tag}><Text style={styles.tagText}>{selected.category}</Text></View>
                  ) : null}
                  {selected.cost ? (
                    <View style={styles.tagAlt}><Text style={styles.tagAltText}>{selected.cost}</Text></View>
                  ) : null}
                  {selected.location_type ? (
                    <View style={styles.tag}><Text style={styles.tagText}>{selected.location_type}</Text></View>
                  ) : null}
                  {selected.area ? (
                    <View style={styles.tag}><Text style={styles.tagText}>{selected.area}</Text></View>
                  ) : null}
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <TouchableOpacity style={[styles.cta, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.ctaText}>Enregistrer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.cta, { backgroundColor: theme.colors.cardLight, borderWidth: 1, borderColor: theme.colors.borderLight }]}>
                    <Text style={[styles.ctaText, { color: theme.colors.textLight }]}>Partager</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.cta, { backgroundColor: theme.colors.cardLight, borderWidth: 1, borderColor: theme.colors.borderLight }]}>
                    <Text style={[styles.ctaText, { color: theme.colors.textLight }]}>Ajouter au planning</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            )}
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.backgroundLight },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.textLight,
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: '700' as any,
  },
  headerBtn: {
    position: 'absolute',
    right: theme.spacing.md,
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.cardLight,
    ...theme.shadows.sm,
  },

  filtersContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: 10,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filtersTitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.mutedLight,
    fontWeight: '600' as any,
  },
  collapseBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.cardLight,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.cardLight,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textLight,
    fontSize: theme.fonts.sizes.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: theme.colors.cardLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  chipActive: {
    backgroundColor: theme.colors.primary + '18',
    borderColor: theme.colors.primary + '66',
  },
  chipText: {
    color: theme.colors.textLight,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '500' as any,
  },
  chipTextActive: {
    color: theme.colors.primary,
    fontWeight: '700' as any,
  },

  deckWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: theme.spacing.md,
  },
  cardBase: {
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.lg,
    position: 'absolute',
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    backgroundColor: theme.colors.cardLight,
  },
  visual: {
    height: '56%',
    width: '100%',
    position: 'relative',
  },
  visualImage: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%',
    height: '100%',
  },
  visualGradient: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 140,
  },
  imageLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight + '66',
  },
  cardBottom: {
    flex: 1,
    padding: theme.spacing.md,
    gap: 6,
    backgroundColor: theme.colors.cardLight,
  },
  cardTitle: {
    color: theme.colors.textLight,
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: '700' as any,
  },
  cardDesc: {
    color: theme.colors.mutedLight,
    fontSize: theme.fonts.sizes.md,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textLight,
    fontWeight: '600' as any,
  },
  tagAlt: {
    backgroundColor: theme.colors.primary + '18',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: theme.colors.primary + '66',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagAltText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.primary,
    fontWeight: '700' as any,
  },

  badgesRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  badgeText: {
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: '800' as any,
    letterSpacing: 2,
  },

  actions: {
    paddingVertical: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  btnSmall: { width: 56, height: 56, borderRadius: 28 },
  btnMedium: { width: 64, height: 64, borderRadius: 32 },
  btnLarge: { width: 76, height: 76, borderRadius: 38 },

  undoBar: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: theme.colors.cardLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  undoText: {
    color: theme.colors.textLight,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600' as any,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000066',
  },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: theme.colors.cardLight,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    ...theme.shadows.lg,
  },
  sheetGrab: {
    width: 46, height: 5, borderRadius: 2.5,
    backgroundColor: theme.colors.borderLight,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  carouselWrap: {
    height: 180,
    marginHorizontal: -theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  carouselContent: {
    alignItems: 'center',
  },
  carouselImage: {
    width: '100%',
    height: 180,
  },
  sheetTitle: {
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: '800' as any,
    color: theme.colors.textLight,
    marginTop: theme.spacing.sm,
  },
  sheetDesc: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.mutedLight,
    lineHeight: 22,
    marginTop: 8,
  },
  sheetTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  cta: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
  },
  ctaText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '700' as any,
    color: '#fff',
  },

  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: 12,
  },
  emptyTitle: {
    color: theme.colors.textLight,
    fontSize: theme.fonts.sizes.xl,
    fontWeight: '800' as any,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: theme.colors.mutedLight,
    fontSize: theme.fonts.sizes.md,
    textAlign: 'center',
  },
  resetBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: theme.borderRadius.full,
  },
  resetBtnText: {
    color: '#fff',
    fontWeight: '700' as any,
  },
});