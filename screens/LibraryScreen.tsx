import React, { useEffect, useState } from 'react';
import { View, Image, FlatList, StyleSheet, TouchableOpacity, Text, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Title } from '../components/StyledComponents';
import { theme } from '../theme/theme';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

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

const libraryItems = [
  {
    id: '1',
    type: 'playlist',
    title: 'Liked Songs',
    subtitle: 'Playlist • 5 songs',
    image: 'https://misc.scdn.co/liked-songs/liked-songs-640.png',
  },
  {
    id: '2',
    type: 'album',
    title: '÷ (Divide)',
    subtitle: 'Album • Ed Sheeran',
    image: require('../assets/Ed Sheeran.jpg'),
  },
  {
    id: '3',
    type: 'album',
    title: 'Mundo',
    subtitle: 'Album • IV of Spades',
    image: require('../assets/Mundo.jpg'),
  },
  {
    id: '4',
    type: 'album',
    title: 'Multo',
    subtitle: 'Album • Cup of Joe',
    image: require('../assets/Cup of Joe.jpg'),
  },
  {
    id: '5',
    type: 'album',
    title: 'Isa Lang',
    subtitle: 'Album • Arthur Nery',
    image: require('../assets/Arthur Nery.jpg'),
  },
  {
    id: '6',
    type: 'album',
    title: 'After Hours',
    subtitle: 'Album • The Weeknd',
    image: require('../assets/The Weeknd.jpg'),
  },
  {
    id: '7',
    type: 'album',
    title: 'Fine Line',
    subtitle: 'Album • Harry Styles',
    image: require('../assets/Harry Styles.jpg'),
  },
  {
    id: '8',
    type: 'album',
    title: 'When We All Fall Asleep',
    subtitle: 'Album • Billie Eilish',
    image: require('../assets/Billie Eilish.jpg'),
  },
  {
    id: '9',
    type: 'album',
    title: 'Future Nostalgia',
    subtitle: 'Album • Dua Lipa',
    image: require('../assets/Dua Lipa.jpg'),
  },
  {
    id: '10',
    type: 'album',
    title: 'Hollywood\'s Bleeding',
    subtitle: 'Album • Post Malone',
    image: require('../assets/Post Malone.jpg'),
  }
];

const filters = [
  { id: 'all', label: 'All' },
  { id: 'playlists', label: 'Playlists' },
  { id: 'albums', label: 'Albums' },
];

const likedSongs = [
  { title: 'Thinking Out Loud', artist: 'Ed Sheeran' },
  { title: 'Mundo', artist: 'IV of Spades' },
  { title: 'Multo', artist: 'Cup of Joe' },
  { title: 'Isa Lang', artist: 'Arthur Nery' },
  { title: 'Rude', artist: 'Magic!' },
];

const BottomNav = ({ navigation }: { navigation: NavigationProp }) => (
  <View style={styles.bottomNav}>
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
      <Ionicons name="home" size={26} color={theme.colors.textSecondary} />
      <Text style={styles.navLabel}>Home</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Search')}>
      <Ionicons name="search" size={26} color={theme.colors.textSecondary} />
      <Text style={styles.navLabel}>Search</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Library')}>
      <Ionicons name="library" size={26} color={theme.colors.primary} />
      <Text style={styles.navLabelActive}>Your Library</Text>
    </TouchableOpacity>
  </View>
);

const LibraryScreen = () => {
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = React.useState('all');
  const [showSongsModal, setShowSongsModal] = React.useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ title: string; type: string } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalContent, setResultModalContent] = useState('');

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

  const handleProfilePress = () => {
    (navigation as any).navigate('Profile');
  };

  const handleItemOptions = (item: { title: string; type: string }) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title style={styles.headerTitle}>Your Library</Title>
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
      <View style={styles.filterRow}>
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterButton, selectedFilter === filter.id && styles.filterButtonActive]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text style={[styles.filterLabel, selectedFilter === filter.id && styles.filterLabelActive]}>{filter.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Filter items based on selected filter
  const filteredItems =
    selectedFilter === 'all'
      ? libraryItems
      : libraryItems.filter(item =>
          selectedFilter === 'playlists' ? item.type === 'playlist' : item.type === 'album'
        );

  const renderItemModal = () => (
    <Modal
      transparent={true}
      visible={showItemModal}
      animationType="fade"
      onRequestClose={() => setShowItemModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.songModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.songModalTitle}>{selectedItem?.title}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowItemModal(false)}
            >
              <Feather name="x" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.songModalOption}
            onPress={() => {
              setShowItemModal(false);
              setTimeout(() => {
                setResultModalContent(`${selectedItem?.title} added to queue!`);
                setShowResultModal(true);
              }, 200);
            }}
          >
            <Feather name="list" size={20} color={theme.colors.text} />
            <Text style={styles.songModalOptionText}>Add to Queue</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.songModalOption}
            onPress={() => {
              setShowItemModal(false);
              setTimeout(() => {
                setResultModalContent(`Downloading ${selectedItem?.title}...`);
                setShowResultModal(true);
              }, 200);
            }}
          >
            <Feather name="arrow-down-circle" size={20} color={theme.colors.text} />
            <Text style={styles.songModalOptionText}>Download</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.songModalOption}
            onPress={() => {
              setShowItemModal(false);
              setTimeout(() => {
                setResultModalContent(`Sharing ${selectedItem?.title}...`);
                setShowResultModal(true);
              }, 200);
            }}
          >
            <Feather name="share-2" size={20} color={theme.colors.text} />
            <Text style={styles.songModalOptionText}>Share</Text>
          </TouchableOpacity>

          {selectedItem?.type === 'playlist' && (
            <TouchableOpacity 
              style={styles.songModalOption}
              onPress={() => {
                setShowItemModal(false);
                setTimeout(() => {
                  setResultModalContent(`Editing ${selectedItem?.title}...`);
                  setShowResultModal(true);
                }, 200);
              }}
            >
              <Feather name="edit" size={20} color={theme.colors.text} />
              <Text style={styles.songModalOptionText}>Edit Playlist</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.songModalOption, styles.songModalOptionDanger]}
            onPress={() => {
              setShowItemModal(false);
              setTimeout(() => {
                setResultModalContent(`${selectedItem?.title} removed from library!`);
                setShowResultModal(true);
              }, 200);
            }}
          >
            <Feather name="trash-2" size={20} color="#F44336" />
            <Text style={[styles.songModalOptionText, styles.songModalOptionTextDanger]}>Remove from Library</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderResultModal = () => (
    <Modal
      transparent={true}
      visible={showResultModal}
      animationType="fade"
      onRequestClose={() => setShowResultModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{resultModalContent}</Text>
          <TouchableOpacity style={styles.modalButton} onPress={() => setShowResultModal(false)}>
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <FlatList
          data={filteredItems}
          keyExtractor={item => item.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 70, backgroundColor: theme.colors.background, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => setShowSongsModal(true)}
            >
              <Image 
                source={typeof item.image === 'string' ? { uri: item.image } : item.image} 
                style={styles.itemImage} 
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => handleItemOptions({ title: item.title, type: item.type })}
                style={styles.itemOptionsButton}
              >
                <Feather name="more-vertical" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
        <BottomNav navigation={navigation as NavigationProp} />
        {renderItemModal()}
        {renderResultModal()}
        {/* Liked Songs Modal */}
        <Modal
          transparent={true}
          visible={showSongsModal}
          animationType="fade"
          onRequestClose={() => setShowSongsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.coolModalContent}>
              <Feather name="music" size={40} color={theme.colors.primary} style={{ marginBottom: 10 }} />
              <Text style={styles.coolModalTitle}>Liked Songs</Text>
              {likedSongs.map((song, idx) => (
                <View key={idx} style={styles.songRowModal}>
                  <Feather name="music" size={18} color={theme.colors.accent} style={{ marginRight: 10 }} />
                  <View>
                    <Text style={styles.songTitleModal}>{song.title}</Text>
                    <Text style={styles.songArtistModal}>{song.artist}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.coolModalButton} onPress={() => setShowSongsModal(false)}>
                <Text style={styles.coolModalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

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
  filterRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterLabel: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  filterLabelActive: {
    color: theme.colors.background,
  },
  list: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 18,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    color: theme.colors.text,
    fontWeight: 'bold',
    fontSize: 17,
  },
  itemSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
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
  coolModalContent: {
    backgroundColor: theme.colors.surface,
    padding: 24,
    borderRadius: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  coolModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 18,
  },
  songRowModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  songTitleModal: {
    color: theme.colors.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  songArtistModal: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  coolModalButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 18,
  },
  coolModalButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileButton: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  profileImage: { width: '100%', height: '100%' },
  itemOptionsButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  songModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    width: '80%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  closeButton: {
    padding: 4,
  },
  songModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  songModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  songModalOptionDanger: {
    borderBottomWidth: 0,
  },
  songModalOptionText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
  },
  songModalOptionTextDanger: {
    color: '#F44336',
  },
});

export default LibraryScreen;