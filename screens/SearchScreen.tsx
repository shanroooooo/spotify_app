import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Dimensions, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Title } from '../components/StyledComponents';
import { theme } from '../theme/theme';
import { Ionicons, Feather } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Navigation types

type RootStackParamList = {
  Dashboard: undefined;
  Home: undefined;
  Search: undefined;
  Library: undefined;
  Player: undefined;
  Login: undefined;
  Register: undefined;
  Profile: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const user = {
  name: 'Shan Robert Mabale',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
};

// Sample songs for demonstration
const allSongs = [
  // Pop songs
  { id: '1', title: 'Shape of You', artist: 'Ed Sheeran', image: require('../assets/Ed Sheeran.jpg'), genre: 'Pop' },
  { id: '2', title: 'Rude', artist: 'Maroon 5', image: require('../assets/Maroon 5.jpg'), genre: 'Pop' },
  { id: '3', title: 'Photograph', artist: 'Ed Sheeran', image: require('../assets/Ed Sheeran.jpg'), genre: 'Pop' },
  { id: '4', title: 'Mundo', artist: 'IV of Spades', image: require('../assets/Mundo.jpg'), genre: 'Pop' },
  { id: '5', title: 'Galway Girl', artist: 'Ed Sheeran', image: require('../assets/Ed Sheeran.jpg'), genre: 'Pop' },
  
  // OPM songs
  { id: '6', title: 'Panaginip', artist: 'Iluna', image: require('../assets/Iluna.jpg'), genre: 'OPM' },
  { id: '7', title: 'Multo', artist: 'Cup of Joe', image: require('../assets/Cup of Joe.jpg'), genre: 'OPM' },
  { id: '8', title: 'Isa Lang', artist: 'Arthur Nery', image: require('../assets/Arthur Nery.jpg'), genre: 'OPM' },
  
  // Jazz songs
  { id: '9', title: 'Take Five', artist: 'Dave Brubeck', image: require('../assets/Dave Brubeck.jpg'), genre: 'Jazz' },
  { id: '10', title: 'So What', artist: 'Miles Davis', image: require('../assets/Miles Davis.jpg'), genre: 'Jazz' },
  { id: '11', title: 'What a Wonderful World', artist: 'Louis Armstrong', image: require('../assets/Louis Armstrong.jpg'), genre: 'Jazz' },
  
  // Indie songs
  { id: '12', title: 'Motion Sickness', artist: 'Phoebe Bridgers', image: require('../assets/Phoebe Bridgers.jpg'), genre: 'Indie' },
  { id: '13', title: 'Kyoto', artist: 'Phoebe Bridgers', image: require('../assets/Phoebe Bridgers.jpg'), genre: 'Indie' },
  
  // Popular Music songs
  { id: '14', title: 'Blinding Lights', artist: 'The Weeknd', image: require('../assets/The Weeknd.jpg'), genre: 'Popular Music' },
  { id: '15', title: 'Dance Monkey', artist: 'Tones and I', image: require('../assets/Dance monkey.jpg'), genre: 'Popular Music' },
  { id: '16', title: 'Bad Guy', artist: 'Billie Eilish', image: require('../assets/Billie Eilish.jpg'), genre: 'Popular Music' },
  { id: '17', title: 'Watermelon Sugar', artist: 'Harry Styles', image: require('../assets/Harry Styles.jpg'), genre: 'Popular Music' },
  
  // Discover songs (mix of different genres)
  { id: '18', title: 'Circles', artist: 'Post Malone', image: require('../assets/Post Malone.jpg'), genre: 'Discover' },
  { id: '19', title: "Don't Start Now", artist: 'Dua Lipa', image: require('../assets/Dua Lipa.jpg'), genre: 'Discover' },
  { id: '20', title: 'Adore You', artist: 'Harry Styles', image: require('../assets/Harry Styles.jpg'), genre: 'Discover' },
  { id: '21', title: 'The Box', artist: 'Roddy Ricch', image: require('../assets/Rody Ritch.jpg'), genre: 'Discover' },
];

// Add sample podcasts
const allPodcasts = [
  { id: 'p1', title: 'The Daily Tech', artist: 'Tech Insights', image: require('../assets/Tech Insights.jpg'), genre: 'Podcasts' },
  { id: 'p2', title: 'Science Today', artist: 'Science Network', image: require('../assets/Science Network.jpg'), genre: 'Podcasts' },
  { id: 'p3', title: 'Business Talk', artist: 'Business Daily', image: require('../assets/Business Daily.jpg'), genre: 'Podcasts' },
  { id: 'p4', title: 'Health & Wellness', artist: 'Wellness Podcast', image: require('../assets/Wellness Podcast.jpg'), genre: 'Podcasts' },
  { id: 'p5', title: 'True Crime Stories', artist: 'Crime Network', image: require('../assets/Podcast Cover.jpg'), genre: 'Podcasts' },
];

const sampleSongs = {
  Pop: allSongs.filter(song => song.genre === 'Pop'),
  OPM: allSongs.filter(song => song.genre === 'OPM'),
  Jazz: allSongs.filter(song => song.genre === 'Jazz'),
  Indie: allSongs.filter(song => song.genre === 'Indie'),
  Podcasts: allPodcasts,
  'Popular Music': [
    { id: 'pm1', title: 'Blinding Lights', artist: 'The Weeknd', image: require('../assets/The Weeknd.jpg'), genre: 'Popular Music' },
    { id: 'pm2', title: 'Dance Monkey', artist: 'Tones and I', image: require('../assets/Dance monkey.jpg'), genre: 'Popular Music' },
    { id: 'pm3', title: 'Bad Guy', artist: 'Billie Eilish', image: require('../assets/Billie Eilish.jpg'), genre: 'Popular Music' },
    { id: 'pm4', title: 'Watermelon Sugar', artist: 'Harry Styles', image: require('../assets/Harry Styles.jpg'), genre: 'Popular Music' },
    { id: 'pm5', title: 'Circles', artist: 'Post Malone', image: require('../assets/Post Malone.jpg'), genre: 'Popular Music' },
    { id: 'pm6', title: "Don't Start Now", artist: 'Dua Lipa', image: require('../assets/Dua Lipa.jpg'), genre: 'Popular Music' },
    { id: 'pm7', title: 'Adore You', artist: 'Harry Styles', image: require('../assets/Harry Styles.jpg'), genre: 'Popular Music' },
    { id: 'pm8', title: 'The Box', artist: 'Roddy Ricch', image: require('../assets/Rody Ritch.jpg'), genre: 'Popular Music' },
  ],
  Discover: allSongs.filter(song => song.genre === 'Discover'),
};

const genres = [
  { id: '1', label: 'Pop', color: '#E13300', icon: 'musical-notes' },
  { id: '2', label: 'OPM', color: '#7358FF', icon: 'headset' },
  { id: '3', label: 'Podcasts', color: '#1E3264', icon: 'mic' },
  { id: '4', label: 'Popular Music', color: '#E8115B', icon: 'radio' },
  { id: '5', label: 'Indie', color: '#148A08', icon: 'leaf' },
  { id: '6', label: 'Discover', color: '#B49BC8', icon: 'compass' },
  { id: '7', label: 'Jazz', color: '#F59B23', icon: 'musical-note' },
];

const BottomNav = ({ navigation }: { navigation: NavigationProp }) => (
  <View style={styles.bottomNav}>
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
      <Ionicons name="home" size={26} color={theme.colors.textSecondary} />
      <Text style={styles.navLabel}>Home</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Search')}>
      <Ionicons name="search" size={26} color={theme.colors.primary} />
      <Text style={styles.navLabelActive}>Search</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Library')}>
      <Ionicons name="library" size={26} color={theme.colors.textSecondary} />
      <Text style={styles.navLabel}>Your Library</Text>
    </TouchableOpacity>
  </View>
);
//Browse part nani 
const SearchScreen = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<typeof genres[0] | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const savedImage = await AsyncStorage.getItem('profile_image');
      if (savedImage) setProfileImage(savedImage);
    })();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const updated = await AsyncStorage.getItem('profile_image_updated');
      if (updated === 'true') {
        const newImage = await AsyncStorage.getItem('profile_image');
        if (newImage) setProfileImage(newImage);
        await AsyncStorage.removeItem('profile_image_updated');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    // Only show results if search text is at least 2 characters
    setShowSearchResults(text.length >= 2);
  };

  const handleGenrePress = (genre: typeof genres[0]) => {
    setSelectedGenre(genre);
    setShowGenreModal(true);
  };

  const handleProfilePress = () => {
    (navigation as any).navigate('Profile');
  };

  const filteredSongs = allSongs.filter(song => 
    song.title.toLowerCase().includes(search.toLowerCase()) ||
    song.artist.toLowerCase().includes(search.toLowerCase())
  );

  const renderGenreModal = () => (
    <Modal
      visible={showGenreModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowGenreModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedGenre?.label}</Text>
            <TouchableOpacity onPress={() => setShowGenreModal(false)}>
              <Feather name="x" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
        
          <FlatList
            data={selectedGenre ? sampleSongs[selectedGenre.label as keyof typeof sampleSongs] || [] : []}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  styles.songItem,
                  selectedGenre?.label === 'Podcasts' && styles.podcastItem
                ]}
                onPress={() => {
                  Alert.alert('Playing', `${item.title} by ${item.artist}`);
                }}
              >
                <Image 
                  source={item.image} 
                  style={[
                    styles.songImage,
                    selectedGenre?.label === 'Podcasts' && styles.podcastImage
                  ]} 
                />
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{item.title}</Text>
                  <Text style={styles.songArtist}>{item.artist}</Text>
                  {selectedGenre?.label === 'Podcasts' && (
                    <Text style={styles.podcastDuration}>45 min</Text>
                  )}
                </View>
                <Feather 
                  name={selectedGenre?.label === 'Podcasts' ? 'headphones' : 'play'} 
                  size={20} 
                  color={theme.colors.primary} 
                />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderSearchResults = () => (
    <View style={styles.searchResultsContainer}>
      <FlatList
        data={filteredSongs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.songItem}
            onPress={() => {
              Alert.alert('Playing', `${item.title} by ${item.artist}`);
            }}
          >
            <Image source={item.image} style={styles.songImage} />
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>{item.title}</Text>
              <Text style={styles.songArtist}>{item.artist}</Text>
            </View>
            <Feather name="play" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No songs found</Text>
          </View>
        )}
      />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title style={styles.headerTitle}>Search</Title>
        <TouchableOpacity
          onPress={handleProfilePress}
          style={styles.profileButton}
        >
          <Image
            source={profileImage ? { uri: profileImage } : require('../assets/mc.png')}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.searchBarWrapper}>
        <Feather name="search" size={20} color={theme.colors.textSecondary} style={{ marginLeft: 12, marginRight: 8 }} />
        <TextInput
          style={styles.searchBar}
          placeholder="Artists, songs, or podcasts"
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              setSearch('');
              setShowSearchResults(false);
            }}
            style={styles.clearButton}
          >
            <Feather name="x" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {!showSearchResults && <Text style={styles.browseAll}>Browse All</Text>}
      {search.length === 1 && (
        <Text style={styles.searchHint}>Type at least 2 characters to search</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {renderHeader()}
        {showSearchResults ? (
          renderSearchResults()
        ) : (
          <FlatList
            data={genres}
            keyExtractor={item => item.id}
            numColumns={2}
            style={styles.list}
            contentContainerStyle={{ paddingBottom: 70, backgroundColor: theme.colors.background, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.genreCard, { backgroundColor: item.color }]}
                activeOpacity={0.8}
                onPress={() => handleGenrePress(item)}
              >
                <Ionicons name={item.icon as any} size={32} color="#fff" style={{ marginBottom: 10 }} />
                <Text style={styles.genreLabel}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        )}
        {renderGenreModal()}
        <BottomNav navigation={navigation as NavigationProp} />
      </View>
    </SafeAreaView>
  );
};

const CARD_MARGIN = 12;
const CARD_WIDTH = (width - 18 * 2 - CARD_MARGIN * 2) / 2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerSection: {
    paddingTop: 32,
    paddingBottom: 10,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    marginBottom: 18,
    height: 44,
    paddingRight: 8,
  },
  searchBar: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    minWidth: 100,
  },
  browseAll: {
    color: theme.colors.text,
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
    marginLeft: 2,
  },
  list: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  genreCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.7,
    borderRadius: 16,
    margin: CARD_MARGIN,
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  genreLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
    paddingVertical: 8,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  navLabelActive: {
    color: theme.colors.primary,
    fontSize: 12,
    marginTop: 2,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  songImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 12,
  },
  searchResultsContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
    marginRight: 8,
  },
  searchHint: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  podcastItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginVertical: 4,
    padding: 12,
  },
  podcastImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  podcastDuration: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  profileButton: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  profileImage: { width: '100%', height: '100%' },
});

export default SearchScreen;