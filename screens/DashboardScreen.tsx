import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Image, FlatList, StyleSheet, TouchableOpacity, Text, Alert, Modal, Animated, InteractionManager, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Title, Subtitle } from '../components/StyledComponents';
import { theme } from '../theme/theme';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { Audio } from 'expo-av';
import * as SQLite from 'expo-sqlite';

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

const AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
const LOCAL_THINKING_OUT_LOUD = require('../assets/thinking_out_loud.mp3');
const PLAYLIST_IMAGE = require('../assets/mc.png');
const MUNDO_MP3 = require('../assets/Mundo.mp3');
const MULTO_MP3 = require('../assets/Multo.mp3');
const ISA_LANG_MP3 = require('../assets/IsaLang.mp3');
const RUDE_MP3 = require('../assets/Rude.mp3');

const playlist = {
  image: PLAYLIST_IMAGE, // Main playlist image
  title: 'MicCloud',
  subtitle: 'Group 4',
  artists: [
    { id: '1', image: require('../assets/Ed Sheeran.jpg') },
    { id: '2', image: require('../assets/Arthur Nery.jpg') },
    { id: '3', image: require('../assets/Mundo.jpg') },
  ],
  description: 'With Ed Sheeran, IV of Spades, Cup of Joem and Arthur Nery and more.',
  creator: 'You',
  saves: 517948,
  duration: '3h 5m',
  songs: [
    { id: '1', title: 'Thinking out Loud', artist: 'Ed Sheeran', image: require('../assets/Ed Sheeran.jpg'), url: LOCAL_THINKING_OUT_LOUD },
    { id: '2', title: 'Mundo', artist: 'IV of Spades', image: require('../assets/Mundo.jpg'), url: MUNDO_MP3 },
    { id: '3', title: "Multo", artist: 'Cup of Joe', image: require('../assets/Cup of Joe.jpg'), url: MULTO_MP3 },
    { id: '4', title: 'Isa Lang', artist: 'Arthur Nery', image: require('../assets/Arthur Nery.jpg'), url: ISA_LANG_MP3 }, 
    { id: '5', title: 'Rude', artist: 'Maroon 5', image: require('../assets/Maroon 5.jpg'), url: RUDE_MP3 }
  ],
};

const BottomNav = React.memo(({ navigation }: { navigation: NavigationProp }) => (
  <View style={styles.bottomNav}>
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
      <Ionicons name="home" size={26} color={theme.colors.primary} />
      <Text style={styles.navLabelActive}>Home</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Search')}>
      <Ionicons name="search" size={26} color={theme.colors.textSecondary} />
      <Text style={styles.navLabel}>Search</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Library')}>
      <Ionicons name="library" size={26} color={theme.colors.textSecondary} />
      <Text style={styles.navLabel}>Your Library</Text>
    </TouchableOpacity>
  </View>
));

const db = SQLite.openDatabaseSync('spotify.db');

const DashboardScreen = ({ navigation }: { navigation: NavigationProp }) => {
  // Keep track of if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  
  // Music player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [currentSong, setCurrentSong] = useState<{ url: any, title: string } | null>(null);
  const sound = useRef<Audio.Sound | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; message: string; type: 'success' | 'info' | 'error' }>({ title: '', message: '', type: 'info' });
  const [modalOpacity, setModalOpacity] = useState(0);
  const [showSongModal, setShowSongModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState<{ title: string; artist: string } | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{ type: string; title: string } | null>(null);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [dashboardModalOptions, setDashboardModalOptions] = useState<{ title: string, options: { icon: string, label: string, onPress: () => void, color?: string }[] } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalContent, setResultModalContent] = useState('');
  const [showHashInfo, setShowHashInfo] = useState(false);
  const [hashInfo, setHashInfo] = useState<{
    password: string;
    salt: string;
    hash: string;
    verification: boolean;
  } | null>(null);
  const [user, setUser] = useState<any>(null);

  // Set isMounted to false when component unmounts and cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (sound.current) {
        sound.current.unloadAsync().catch(err => console.error('Error unloading sound:', err));
        sound.current = null;
      }
    };
  }, []);

  // Request audio permissions when component mounts
  useEffect(() => {
    (async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to get audio permissions');
      }
    })();
  }, []);

  useEffect(() => {
    // Get the first user from database (for demo purposes)
    const loadUser = async () => {
      try {
        const users = await db.getAllAsync('SELECT * FROM users');
        if (users && users.length > 0) {
          setUser(users[0]);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const loadAndPlay = useCallback(async (url?: any) => {
    try {
      if (sound.current) {
        await sound.current.unloadAsync();
        sound.current = null;
      }
      
      sound.current = new Audio.Sound();
      
      // url can be a string (remote) or a number (local require)
      const audioSource = url || (currentSong && currentSong.url);
      if (!audioSource) {
        throw new Error('No audio source provided');
      }

      console.log('Loading audio source:', audioSource);
      
      // For local files, we need to handle them differently
      if (typeof audioSource === 'number') {
        console.log('Loading local file...');
        await sound.current.loadAsync(audioSource);
      } else {
        console.log('Loading remote URL...');
        await sound.current.loadAsync({ uri: audioSource });
      }
      
      // Simpler status update handler
      let lastUpdateTime = 0;
      sound.current.setOnPlaybackStatusUpdate((status) => {
        // Skip updates after unmounting
        if (!isMounted.current) return;
        
        const now = Date.now();
        if (now - lastUpdateTime < 500 && status.isLoaded && !('didJustFinish' in status && status.didJustFinish)) {
          return; // Skip frequent updates
        }
        
        lastUpdateTime = now;
        console.log('Playback status:', status);
        
        if (status.isLoaded) {
          if ('didJustFinish' in status && status.didJustFinish) {
            setIsPlaying(false);
          }
          
          setStatus(status);
        }
      });
      
      console.log('Starting playback...');
      await sound.current.playAsync();
      setIsPlaying(true);
    } catch (error: any) {
      console.error('Detailed error:', error);
      Alert.alert(
        'Error Playing Audio',
        `Failed to play audio: ${error?.message || 'Unknown error'}`
      );
      setIsPlaying(false);
    }
  }, [currentSong, isMounted]);

  const pause = useCallback(async () => {
    if (sound.current) {
      await sound.current.pauseAsync();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(async () => {
    if (!isPlaying) {
      if (currentSong) {
        await loadAndPlay(currentSong.url);
      } else {
        // Play the first song by default
        setCurrentSong({ url: playlist.songs[0].url, title: playlist.songs[0].title });
        await loadAndPlay(playlist.songs[0].url);
      }
    } else {
      await pause();
    }
  }, [isPlaying, currentSong, loadAndPlay, pause]);

  const showCustomAlert = (title: string, message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setModalContent({ title, message, type });
    setShowModal(true);
    
    setTimeout(() => {
      if (isMounted.current) {
        setModalOpacity(1);
      }
    }, 10);
  };

  const hideModal = () => {
    setModalOpacity(0);
    setTimeout(() => {
      if (isMounted.current) {
        setShowModal(false);
      }
    }, 200);
  };

  const renderModal = () => (
    <Modal
      transparent
      visible={showModal}
      animationType="fade"
      onRequestClose={hideModal}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={hideModal}
      >
        <View 
          style={[
            styles.modalContent,
            { opacity: modalOpacity },
            modalContent.type === 'success' && styles.successModal,
            modalContent.type === 'error' && styles.errorModal,
          ]}
        >
          <Text style={styles.modalTitle}>{modalContent.title}</Text>
          <Text style={styles.modalMessage}>{modalContent.message}</Text>
          <TouchableOpacity 
            style={[
              styles.modalButton,
              modalContent.type === 'success' && styles.successButton,
              modalContent.type === 'error' && styles.errorButton,
            ]} 
            onPress={hideModal}
          >
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const handleActionPress = useCallback((type: string, title: string) => {
    // Use InteractionManager to ensure touch feedback completes before showing modal
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        setSelectedAction({ type, title });
        setShowActionModal(true);
      });
    });
  }, []);

  const handleSongOptions = useCallback((song: { title: string; artist: string }) => {
    // Use requestAnimationFrame to defer state updates until after rendering
    requestAnimationFrame(() => {
      setSelectedSong(song);
      setShowSongModal(true);
    });
  }, []);

  const renderSongModal = () => (
    <Modal
      transparent={true}
      visible={showSongModal}
      animationType="fade"
      onRequestClose={() => setShowSongModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.songModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.songModalTitle}>{selectedSong?.title}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowSongModal(false)}
            >
              <Feather name="x" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.songModalArtist}>{selectedSong?.artist}</Text>
          
          <TouchableOpacity 
            style={styles.songModalOption}
            onPress={() => {
              setShowSongModal(false);
              setTimeout(() => {
                setResultModalContent(`${selectedSong?.title} added to queue!`);
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
              setShowSongModal(false);
              setTimeout(() => {
                setResultModalContent(`${selectedSong?.title} added to your playlist!`);
                setShowResultModal(true);
              }, 200);
            }}
          >
            <Feather name="plus" size={20} color={theme.colors.text} />
            <Text style={styles.songModalOptionText}>Add to Playlist</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.songModalOption}
            onPress={() => {
              setShowSongModal(false);
              setTimeout(() => {
                setResultModalContent(`Downloading ${selectedSong?.title}...`);
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
              setShowSongModal(false);
              setTimeout(() => {
                setResultModalContent(`Sharing ${selectedSong?.title}...`);
                setShowResultModal(true);
              }, 200);
            }}
          >
            <Feather name="share-2" size={20} color={theme.colors.text} />
            <Text style={styles.songModalOptionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.songModalOption, styles.songModalOptionDanger]}
            onPress={() => {
              setShowSongModal(false);
              setTimeout(() => {
                setResultModalContent(`${selectedSong?.title} removed from playlist!`);
                setShowResultModal(true);
              }, 200);
            }}
          >
            <Feather name="trash-2" size={20} color="#F44336" />
            <Text style={[styles.songModalOptionText, styles.songModalOptionTextDanger]}>Remove from Playlist</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderActionModal = () => (
    <Modal
      transparent={true}
      visible={showActionModal}
      animationType="fade"
      onRequestClose={() => setShowActionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.songModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.songModalTitle}>{selectedAction?.title}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowActionModal(false)}
            >
              <Feather name="x" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {selectedAction?.type === 'add' && (
            <>
              <TouchableOpacity 
                style={styles.songModalOption}
                onPress={() => {
                  Alert.alert('Added to Library', 'Playlist added to your library!');
                  setShowActionModal(false);
                }}
              >
                <Feather name="plus" size={20} color={theme.colors.text} />
                <Text style={styles.songModalOptionText}>Add to Library</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.songModalOption}
                onPress={() => {
                  Alert.alert('Added to Queue', 'Playlist added to queue!');
                  setShowActionModal(false);
                }}
              >
                <Feather name="list" size={20} color={theme.colors.text} />
                <Text style={styles.songModalOptionText}>Add to Queue</Text>
              </TouchableOpacity>
            </>
          )}

          {selectedAction?.type === 'download' && (
            <>
              <TouchableOpacity 
                style={styles.songModalOption}
                onPress={() => {
                  Alert.alert('Download Started', 'Downloading playlist...');
                  setShowActionModal(false);
                }}
              >
                <Feather name="arrow-down-circle" size={20} color={theme.colors.text} />
                <Text style={styles.songModalOptionText}>Download All</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.songModalOption}
                onPress={() => {
                  Alert.alert('Download Settings', 'Opening download settings...');
                  setShowActionModal(false);
                }}
              >
                <Feather name="settings" size={20} color={theme.colors.text} />
                <Text style={styles.songModalOptionText}>Download Settings</Text>
              </TouchableOpacity>
            </>
          )}

          {selectedAction?.type === 'more' && (
            <>
              <TouchableOpacity 
                style={styles.songModalOption}
                onPress={() => {
                  Alert.alert('Share', 'Sharing playlist...');
                  setShowActionModal(false);
                }}
              >
                <Feather name="share-2" size={20} color={theme.colors.text} />
                <Text style={styles.songModalOptionText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.songModalOption}
                onPress={() => {
                  Alert.alert('Edit', 'Editing playlist...');
                  setShowActionModal(false);
                }}
              >
                <Feather name="edit" size={20} color={theme.colors.text} />
                <Text style={styles.songModalOptionText}>Edit Playlist</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.songModalOption, styles.songModalOptionDanger]}
                onPress={() => {
                  Alert.alert('Delete', 'Playlist deleted!');
                  setShowActionModal(false);
                }}
              >
                <Feather name="trash-2" size={20} color="#F44336" />
                <Text style={[styles.songModalOptionText, styles.songModalOptionTextDanger]}>Delete Playlist</Text>
              </TouchableOpacity>
            </>
          )}

          {selectedAction?.type === 'shuffle' && (
            <>
              <TouchableOpacity 
                style={styles.songModalOption}
                onPress={() => {
                  Alert.alert('Shuffle', 'Playlist shuffled!');
                  setShowActionModal(false);
                }}
              >
                <Feather name="shuffle" size={20} color={theme.colors.text} />
                <Text style={styles.songModalOptionText}>Shuffle All</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.songModalOption}
                onPress={() => {
                  Alert.alert('Play', 'Playing shuffled playlist...');
                  setShowActionModal(false);
                }}
              >
                <Feather name="play" size={20} color={theme.colors.text} />
                <Text style={styles.songModalOptionText}>Play Shuffled</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Memoize the action modal to prevent unnecessary re-renders
  const actionModal = React.useMemo(() => renderActionModal(), [selectedAction]);

  // Create callback handlers at the top level (not inside other hooks)
  const handleShufflePress = useCallback(() => {
    handleActionPress('shuffle', 'Shuffle');
  }, [handleActionPress]);
  
  const handlePlayButtonPress = useCallback(() => {
    if (currentSong) {
      togglePlay();
    } else {
      setCurrentSong({ url: playlist.songs[0].url, title: playlist.songs[0].title });
      loadAndPlay(playlist.songs[0].url);
    }
  }, [currentSong, togglePlay, loadAndPlay]);

  // Memoize the header component to prevent flickering
  const HeaderComponent = React.useMemo(() => (
    <View style={styles.headerSection}>
      <Image 
        source={typeof playlist.image === 'string' ? { uri: playlist.image } : playlist.image} 
        style={styles.playlistImage} 
      />
      <Text style={styles.radioText}>{playlist.subtitle}</Text>
      <Title style={styles.headerTitle}>{playlist.title}</Title>
      <View style={styles.artistRow}>
        {playlist.artists.map(artist => (
          <Image key={artist.id} source={artist.image} style={styles.artistCircle} />
        ))}
      </View>
      <Text style={styles.description}>{playlist.description}</Text>
      <View style={styles.creatorRow}>
        <Image source={require('../assets/mc.png')} style={styles.creatorLogo} />
        <Text style={styles.madeFor}>Made for <Text style={styles.creatorName}>{playlist.creator}</Text></Text>
      </View>
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>{playlist.saves.toLocaleString()} saves</Text>
        <Text style={styles.statsDot}>•</Text>
        <Text style={styles.statsText}>{playlist.duration}</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionIcon, styles.actionIconActive]}
          activeOpacity={0.7}
          onPress={() => handleDashboardIconPress('add')}
        >
          <Feather name="plus" size={22} color="#FF6B6B" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionIcon, styles.actionIconActive]}
          activeOpacity={0.7}
          onPress={() => handleDashboardIconPress('download')}
        >
          <Feather name="arrow-down-circle" size={22} color="#4ECDC4" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionIcon, styles.actionIconActive]}
          activeOpacity={0.7}
          onPress={() => handleDashboardIconPress('more')}
        >
          <Feather name="more-horizontal" size={22} color="#FFD93D" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.shuffleIcon}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          delayPressIn={0}
          onPress={() => handleDashboardIconPress('shuffle')}
        >
          <Feather name="shuffle" size={22} color="#6C5CE7" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.playButton}
          activeOpacity={0.7}
          onPress={handlePlayButtonPress}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color={theme.colors.background} />
        </TouchableOpacity>
      </View>
      {status && (
        <Text style={{ color: theme.colors.textSecondary, marginTop: 8, fontSize: 13 }}>
          {isPlaying ? 'Playing...' : 'Paused'} {currentSong ? `- ${currentSong.title}` : ''} {status.positionMillis ? `(${Math.floor((status.positionMillis || 0) / 1000)} / ${Math.floor((status.durationMillis || 0) / 1000)} sec)` : ''}
        </Text>
      )}
      {actionModal}
    </View>
  ), [playlist, isPlaying, currentSong, status, handleActionPress, handleShufflePress, handlePlayButtonPress, actionModal]);

  // Memoize the song modal to prevent unnecessary re-renders
  const songModal = React.useMemo(() => renderSongModal(), [selectedSong, showSongModal]);

  // Replace handleActionPress and handleShufflePress
  const handleDashboardIconPress = useCallback((type: string) => {
    let modalOptions;
    if (type === 'add') {
      modalOptions = {
        title: 'Add to Library',
        options: [
          { icon: 'plus', label: 'Add to Library', onPress: () => Alert.alert('Added to Library!') },
          { icon: 'list', label: 'Add to Queue', onPress: () => Alert.alert('Added to Queue!') },
        ]
      };
    } else if (type === 'download') {
      modalOptions = {
        title: 'Download',
        options: [
          { icon: 'arrow-down-circle', label: 'Download All', onPress: () => Alert.alert('Download Started!') },
          { icon: 'settings', label: 'Download Settings', onPress: () => Alert.alert('Download Settings!') },
        ]
      };
    } else if (type === 'more') {
      modalOptions = {
        title: 'More Options',
        options: [
          { icon: 'share-2', label: 'Share', onPress: () => Alert.alert('Sharing playlist...') },
          { icon: 'edit', label: 'Edit Playlist', onPress: () => Alert.alert('Editing playlist...') },
          { icon: 'trash-2', label: 'Delete Playlist', onPress: () => Alert.alert('Playlist deleted!'), color: '#F44336' },
        ]
      };
    } else if (type === 'shuffle') {
      modalOptions = {
        title: 'Shuffle',
        options: [
          { icon: 'shuffle', label: 'Shuffle All', onPress: () => Alert.alert('Playlist shuffled!') },
          { icon: 'play', label: 'Play Shuffled', onPress: () => Alert.alert('Playing shuffled playlist...') },
        ]
      };
    }
    if (modalOptions) {
      setDashboardModalOptions(modalOptions);
      setShowDashboardModal(true);
    }
  }, []);

  // Add a new renderDashboardModal function
  const renderDashboardModal = () => (
    <Modal
      transparent={true}
      visible={showDashboardModal}
      animationType="fade"
      onRequestClose={() => setShowDashboardModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.songModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.songModalTitle}>{dashboardModalOptions?.title}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowDashboardModal(false)}
            >
              <Feather name="x" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {dashboardModalOptions?.options.map((opt, idx) => (
            <TouchableOpacity 
              key={idx}
              style={styles.songModalOption}
              onPress={() => {
                setShowDashboardModal(false);
                setTimeout(() => {
                  setResultModalContent(opt.label + ' successful!');
                  setShowResultModal(true);
                }, 200);
              }}
            >
              <Feather name={opt.icon as any} size={20} color={opt.color || theme.colors.text} />
              <Text style={[styles.songModalOptionText, opt.color ? { color: opt.color } : null]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  // Add a new renderResultModal function
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

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>No user data found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <FlatList
          data={playlist.songs}
          keyExtractor={item => item.id}
          style={styles.songList}
          contentContainerStyle={{ paddingBottom: 70, backgroundColor: theme.colors.background, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={HeaderComponent}
          renderItem={({ item }) => (
            <View style={styles.songRow}>
              <TouchableOpacity 
                style={styles.songRowContent}
                onPress={() => {
                  setCurrentSong({ url: item.url, title: item.title });
                  loadAndPlay(item.url);
                }}
              >
                <Image source={item.image} style={styles.songImage} />
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{item.title}</Text>
                  <Text style={styles.songArtist}>{item.artist}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleSongOptions({ title: item.title, artist: item.artist })}
                style={styles.songOptionsButton}
              >
                <Feather name="more-vertical" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        />
        <BottomNav navigation={navigation} />
        {renderDashboardModal()}
        {songModal}
        {renderResultModal()}
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
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 10,
    backgroundColor: theme.colors.background,
  },
  playlistImage: {
    width: 260,
    height: 260,
    borderRadius: 16,
    marginBottom: 10,
  },
  radioText: {
    color: theme.colors.textSecondary,
    fontSize: 18,
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  artistRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  artistCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: theme.colors.background,
    marginHorizontal: -10,
    zIndex: 1,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 2,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  madeFor: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  creatorName: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statsText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  statsDot: {
    color: theme.colors.textSecondary,
    fontSize: 18,
    marginHorizontal: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionIconActive: {
    backgroundColor: theme.colors.surface,
    transform: [{ scale: 1.1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  shuffleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    transform: [{ scale: 1.1 }],
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  songList: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 18,
  },
  songRowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  songImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: theme.colors.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  songArtist: {
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
    // No absolute positioning
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
  successModal: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  errorModal: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  errorButton: {
    backgroundColor: '#F44336',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  creatorLogo: {
    width: 18,
    height: 18,
    marginRight: 6,
    borderRadius: 4,
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
  songModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    width: '80%',
    maxWidth: 400,
  },
  songModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  songModalArtist: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
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
  songOptionsButton: {
    padding: 8,
    marginLeft: 8,
  },
  hashInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  hashInfoButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  hashInfoContainer: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginVertical: 16,
  },
  hashInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  hashInfoLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  hashInfoValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 10,
  },
  value: {
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 10,
  },
  code: {
    fontSize: 14,
    color: theme.colors.primary,
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  text: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  explanation: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    fontStyle: 'italic',
  },
});

export default DashboardScreen; 