// import React, { useState, useEffect } from 'react';
// import {
//   View, Text, TouchableOpacity, StyleSheet, StatusBar,
//   SafeAreaView, FlatList, Alert, TextInput, ActivityIndicator, Linking,
// } from 'react-native';
// import { useNavigation, DrawerActions, useFocusEffect } from '@react-navigation/native';
// import { Colors } from '../theme/colors';
// import apiService from '../services/apiService';

// interface Contact {
//   _id?: string;
//   id?: string;
//   name: string;
//   relation?: string;
//   phone: string;
//   initial?: string;
//   color?: string;
// }

// const COLORS = ['#5B8DEF', '#FF9500', '#AF52DE', '#00C853', '#FF5722', '#2196F3', '#009688', '#FF6F00'];

// export default function ContactsScreen() {
//   const [contacts, setContacts] = useState<Contact[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const nav = useNavigation();

//   // Fetch contacts when screen comes into focus
//   useFocusEffect(
//     React.useCallback(() => {
//       fetchContacts();
//     }, [])
//   );

//   const fetchContacts = async () => {
//     try {
//       setIsLoading(true);
//       setError(null);
//       const response = await apiService.getContacts();
//       const contactsList = Array.isArray(response) ? response : response?.data || [];
      
//       // Add UI properties to contacts
//       const enrichedContacts = contactsList.map((contact, index) => ({
//         ...contact,
//         id: contact._id || `contact-${index}`,
//         initial: (contact.name || 'C').charAt(0).toUpperCase(),
//         color: COLORS[index % COLORS.length],
//       }));
      
//       setContacts(enrichedContacts);
//     } catch (err: any) {
//       console.error('Error fetching contacts:', err);
//       setError('Failed to load contacts');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleCall = (phoneNumber: string, contactName: string) => {
//     try {
//       const url = `tel:${phoneNumber}`;
//       Linking.openURL(url).catch((err) => {
//         console.error('Failed to call:', err);
//         Alert.alert('Error', 'Could not initiate call');
//       });
//     } catch (error) {
//       console.error('Error calling contact:', error);
//       Alert.alert('Error', 'Failed to call contact');
//     }
//   };

//   const handleDeleteContact = async (contactId: string, contactName: string) => {
//     Alert.alert('Delete Contact', `Remove ${contactName} from emergency contacts?`, [
//       { text: 'Cancel', onPress: () => {}, style: 'cancel' },
//       {
//         text: 'Delete',
//         onPress: async () => {
//           try {
//             await apiService.deleteContact(contactId);
//             setContacts(contacts.filter(c => (c._id || c.id) !== contactId));
//             Alert.alert('Success', `${contactName} removed from emergency contacts`);
//           } catch (error) {
//             console.error('Error deleting contact:', error);
//             Alert.alert('Error', 'Failed to delete contact');
//           }
//         },
//         style: 'destructive',
//       },
//     ]);
//   };

//   const renderContact = ({ item }: { item: Contact }) => (
//     <View style={[styles.card, { borderLeftColor: item.color, borderLeftWidth: 4 }]}>
//       <View style={[styles.avatarWrap, { backgroundColor: item.color + '20' }]}>
//         <View style={[styles.avatar, { backgroundColor: item.color }]}>
//           <Text style={styles.avatarLetter}>{item.initial}</Text>
//         </View>
//         <View style={styles.onlineDot} />
//       </View>
//       <View style={styles.cardInfo}>
//         <Text style={styles.cardName}>{item.name}</Text>
//         {item.relation && (
//           <View style={styles.relationRow}>
//             <View style={[styles.relationBadge, { backgroundColor: item.color + '20' }]}>
//               <Text style={[styles.relationText, { color: item.color }]}>{item.relation}</Text>
//             </View>
//           </View>
//         )}
//         <Text style={styles.cardPhone}>{item.phone}</Text>
//       </View>
//       <View style={styles.cardActions}>
//         <TouchableOpacity
//           style={[styles.callBtn, { backgroundColor: Colors.green + '15' }]}
//           onPress={() => handleCall(item.phone, item.name)}>
//           <Text style={[styles.callBtnText, { color: Colors.green }]}>📞</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={styles.deleteBtnSmall}
//           onPress={() => handleDeleteContact(item._id || item.id || '', item.name)}>
//           <Text style={styles.deleteBtnText}>✕</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.headerBg1} />
//         <View style={styles.headerBg2} />
//         <TouchableOpacity
//           style={styles.menuBtn}
//           onPress={() => nav.dispatch(DrawerActions.openDrawer())}>
//           <View style={styles.line} />
//           <View style={[styles.line, styles.lineShort]} />
//           <View style={styles.line} />
//         </TouchableOpacity>
//         <View style={styles.headerCenter}>
//           <Text style={styles.headerTitle}>Emergency Contacts</Text>
//           <Text style={styles.headerSub}>{contacts.length} trusted contacts added</Text>
//         </View>
//         <TouchableOpacity
//           style={styles.addIconBtn}
//           onPress={() => nav.navigate('AddContact' as never)}>
//           <Text style={styles.addIconText}>+</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Info Banner */}
//       <View style={styles.banner}>
//         <View style={styles.bannerIcon}>
//           <Text style={styles.bannerIconText}>!</Text>
//         </View>
//         <Text style={styles.bannerText}>
//           These contacts will receive your live location when you send an SOS alert
//         </Text>
//       </View>

//       {isLoading ? (
//         <View style={styles.centerContainer}>
//           <ActivityIndicator size="large" color={Colors.primary} />
//           <Text style={styles.loadingText}>Loading contacts...</Text>
//         </View>
//       ) : error ? (
//         <View style={styles.centerContainer}>
//           <Text style={styles.errorText}>{error}</Text>
//           <TouchableOpacity style={styles.retryBtn} onPress={fetchContacts}>
//             <Text style={styles.retryText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       ) : contacts.length === 0 ? (
//         <View style={styles.centerContainer}>
//           <Text style={styles.emptyText}>No emergency contacts yet</Text>
//           <Text style={styles.emptySubText}>Add contacts to get started</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={contacts}
//           keyExtractor={item => item.id || item._id || ''}
//           renderItem={renderContact}
//           contentContainerStyle={styles.list}
//           ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
//           showsVerticalScrollIndicator={false}
//           ListFooterComponent={<View style={{ height: 16 }} />}
//           refreshing={isLoading}
//           onRefresh={fetchContacts}
//         />
//       )}

//       {/* Add Button */}
//       {!isLoading && !error && (
//         <View style={styles.footer}>
//           <TouchableOpacity
//             style={styles.addBtn}
//             onPress={() => nav.navigate('AddContact' as never)}>
//             <Text style={styles.addBtnPlus}>+</Text>
//             <Text style={styles.addBtnText}>Add Emergency Contact</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }

//   const renderContact = ({ item }: { item: Contact }) => (
//     <View style={[styles.card, { borderLeftColor: item.color, borderLeftWidth: 4 }]}>
//       <View style={[styles.avatarWrap, { backgroundColor: item.color + '20' }]}>
//         <View style={[styles.avatar, { backgroundColor: item.color }]}>
//           <Text style={styles.avatarLetter}>{item.initial}</Text>
//         </View>
//         <View style={styles.onlineDot} />
//       </View>
//       <View style={styles.cardInfo}>
//         <Text style={styles.cardName}>{item.name}</Text>
//         {item.relation && (
//           <View style={styles.relationRow}>
//             <View style={[styles.relationBadge, { backgroundColor: item.color + '20' }]}>
//               <Text style={[styles.relationText, { color: item.color }]}>{item.relation}</Text>
//             </View>
//           </View>
//         )}
//         <Text style={styles.cardPhone}>{item.phone}</Text>
//       </View>
//       <View style={styles.cardActions}>
//         <TouchableOpacity
//           style={[styles.callBtn, { backgroundColor: Colors.green + '15' }]}
//           onPress={() => handleCall(item.phone, item.name)}>
//           <Text style={[styles.callBtnText, { color: Colors.green }]}>📞</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={styles.deleteBtnSmall}
//           onPress={() => handleDeleteContact(item._id || item.id || '', item.name)}>
//           <Text style={styles.deleteBtnText}>✕</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.headerBg1} />
//         <View style={styles.headerBg2} />
//         <TouchableOpacity
//           style={styles.menuBtn}
//           onPress={() => nav.dispatch(DrawerActions.openDrawer())}>
//           <View style={styles.line} />
//           <View style={[styles.line, styles.lineShort]} />
//           <View style={styles.line} />
//         </TouchableOpacity>
//         <View style={styles.headerCenter}>
//           <Text style={styles.headerTitle}>Emergency Contacts</Text>
//           <Text style={styles.headerSub}>{contacts.length} trusted contacts added</Text>
//         </View>
//         <TouchableOpacity
//           style={styles.addIconBtn}
//           onPress={() => Alert.alert('Add Contact', 'Feature coming soon!')}>
//           <Text style={styles.addIconText}>+</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Info Banner */}
//       <View style={styles.banner}>
//         <View style={styles.bannerIcon}>
//           <Text style={styles.bannerIconText}>!</Text>
//         </View>
//         <Text style={styles.bannerText}>
//           These contacts will receive your live location when you send an SOS alert
//         </Text>
//       </View>

//       <FlatList
//         data={contacts}
//         keyExtractor={item => item.id || item._id || ''}
//         renderItem={renderContact}
//         contentContainerStyle={styles.list}
//         ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
//         showsVerticalScrollIndicator={false}
//         ListFooterComponent={<View style={{ height: 16 }} />}
//         refreshing={isLoading}
//         onRefresh={fetchContacts}
//       />

//       {/* Add Button */}
//       {!isLoading && !error && (
//         <View style={styles.footer}>
//           <TouchableOpacity
//             style={styles.addBtn}
//             onPress={() => nav.navigate('AddContact' as never)}>
//             <Text style={styles.addBtnPlus}>+</Text>
//             <Text style={styles.addBtnText}>Add Emergency Contact</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: Colors.background },

//   // Header
//   header: {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: Colors.primary,
//     paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
//     overflow: 'hidden',
//   },
//   headerBg1: {
//     position: 'absolute', width: 160, height: 160, borderRadius: 80,
//     backgroundColor: 'rgba(255,255,255,0.07)', top: -70, right: -30,
//   },
//   headerBg2: {
//     position: 'absolute', width: 100, height: 100, borderRadius: 50,
//     backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: 60,
//   },
//   menuBtn: { padding: 6, justifyContent: 'center', zIndex: 1 },
//   line: { width: 22, height: 2.5, backgroundColor: '#fff', borderRadius: 2, marginVertical: 2 },
//   lineShort: { width: 14 },
//   headerCenter: { flex: 1, paddingLeft: 12, zIndex: 1 },
//   headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
//   headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
//   addIconBtn: {
//     width: 36, height: 36, borderRadius: 18,
//     backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center',
//     justifyContent: 'center', zIndex: 1,
//   },
//   addIconText: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 28, marginTop: -2 },

//   // Banner
//   banner: {
//     flexDirection: 'row', alignItems: 'center',
//     marginHorizontal: 16, marginTop: 14, marginBottom: 4,
//     backgroundColor: Colors.blueLight, borderRadius: 12,
//     padding: 12, gap: 10,
//   },
//   bannerIcon: {
//     width: 24, height: 24, borderRadius: 12,
//     backgroundColor: Colors.blue, alignItems: 'center', justifyContent: 'center',
//   },
//   bannerIconText: { color: '#fff', fontSize: 13, fontWeight: '800' },
//   bannerText: { flex: 1, fontSize: 12, color: Colors.blue, lineHeight: 17, fontWeight: '500' },

//   // List
//   list: { paddingHorizontal: 16, paddingTop: 14 },
//   card: {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#fff', borderRadius: 18,
//     padding: 14,
//     shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
//   },
//   avatarWrap: {
//     width: 58, height: 58, borderRadius: 29,
//     alignItems: 'center', justifyContent: 'center', marginRight: 14,
//   },
//   avatar: {
//     width: 50, height: 50, borderRadius: 25,
//     alignItems: 'center', justifyContent: 'center',
//   },
//   avatarLetter: { color: '#fff', fontSize: 20, fontWeight: '800' },
//   onlineDot: {
//     position: 'absolute', bottom: 2, right: 2,
//     width: 13, height: 13, borderRadius: 7,
//     backgroundColor: Colors.green, borderWidth: 2, borderColor: '#fff',
//   },
//   cardInfo: { flex: 1 },
//   cardName: { fontSize: 15, fontWeight: '700', color: Colors.textDark, marginBottom: 4 },
//   relationRow: { flexDirection: 'row', marginBottom: 4 },
//   relationBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
//   relationText: { fontSize: 11, fontWeight: '700' },
//   cardPhone: { fontSize: 12, color: Colors.textMedium, fontWeight: '500' },
//   cardActions: { gap: 6 },
//   callBtn: {
//     borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
//     alignItems: 'center',
//   },
//   callBtnText: { fontSize: 16, fontWeight: '700' },
//   deleteBtnSmall: {
//     borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
//     backgroundColor: '#FEE', alignItems: 'center',
//   },
//   deleteBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   loadingText: {
//     fontSize: 14,
//     color: Colors.textMedium,
//     marginTop: 12,
//   },
//   errorText: {
//     fontSize: 14,
//     color: Colors.primary,
//     textAlign: 'center',
//     marginBottom: 16,
//   },
//   retryBtn: {
//     backgroundColor: Colors.primary,
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 8,
//   },
//   retryText: {
//     color: '#fff',
//     fontWeight: '600',
//   },
//   emptyText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: Colors.textDark,
//     marginBottom: 8,
//   },
//   emptySubText: {
//     fontSize: 13,
//     color: Colors.textMedium,
//   },

//   // Footer
//   footer: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 8 },
//   addBtn: {
//     flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
//     backgroundColor: Colors.primary, borderRadius: 16, height: 54, gap: 8,
//     shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
//   },
//   addBtnPlus: { color: '#fff', fontSize: 22, fontWeight: '300', lineHeight: 26 },
//   addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
// });


import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation, DrawerActions, useFocusEffect } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { apiService } from '../services/apiService';

interface Contact {
  _id?: string;
  id?: string;
  name: string;
  relation?: string;
  phone: string;
  initial?: string;
  color?: string;
}

const COLORS = ['#5B8DEF', '#FF9500', '#AF52DE', '#00C853', '#FF5722', '#2196F3', '#009688', '#FF6F00'];

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nav = useNavigation<any>();

  useFocusEffect(
    React.useCallback(() => {
      fetchContacts();
    }, [])
  );

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.getContacts();
      const contactsList = Array.isArray(response)
        ? response
        : response?.data || [];

      const enrichedContacts = contactsList.map((contact: any, index: number) => ({
        ...contact,
        id: contact._id || `contact-${index}`,
        initial: (contact.name || 'C').charAt(0).toUpperCase(),
        color: COLORS[index % COLORS.length],
      }));

      setContacts(enrichedContacts);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() =>
      Alert.alert('Error', 'Could not initiate call')
    );
  };

  const handleDeleteContact = (contactId: string, contactName: string) => {
    Alert.alert('Delete Contact', `Remove ${contactName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.deleteContact(contactId);
            setContacts(prev => prev.filter(c => (c._id || c.id) !== contactId));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete contact');
          }
        },
      },
    ]);
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <View style={[styles.card, { borderLeftColor: item.color, borderLeftWidth: 4 }]}>
      <View style={[styles.avatarWrap, { backgroundColor: item.color + '20' }]}>
        <View style={[styles.avatar, { backgroundColor: item.color }]}>
          <Text style={styles.avatarLetter}>{item.initial}</Text>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>

        {item.relation && (
          <View style={styles.relationRow}>
            <View style={[styles.relationBadge, { backgroundColor: item.color + '20' }]}>
              <Text style={[styles.relationText, { color: item.color }]}>
                {item.relation}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.cardPhone}>{item.phone}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.callBtn, { backgroundColor: Colors.green + '15' }]}
          onPress={() => handleCall(item.phone)}>
          <Text style={[styles.callBtnText, { color: Colors.green }]}>📞</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtnSmall}
          onPress={() => handleDeleteContact(item._id || item.id || '', item.name)}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => nav.dispatch(DrawerActions.openDrawer())}>
          <View style={styles.line} />
          <View style={[styles.line, styles.lineShort]} />
          <View style={styles.line} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
          <Text style={styles.headerSub}>
            {contacts.length} trusted contacts added
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addIconBtn}
          onPress={() => nav.navigate('AddContact')}>
          <Text style={styles.addIconText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchContacts}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : contacts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No emergency contacts yet</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id || item._id || ''}
          renderItem={renderContact}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={fetchContacts}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  menuBtn: { padding: 6 },

  line: {
    width: 22,
    height: 2.5,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginVertical: 2,
  },

  lineShort: { width: 14 },

  headerCenter: { flex: 1, paddingLeft: 12 },

  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },

  headerSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },

  addIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addIconText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },

  list: { padding: 16 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
  },

  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarLetter: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },

  cardInfo: { flex: 1 },

  cardName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },

  relationRow: { marginBottom: 4 },

  relationBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  relationText: {
    fontSize: 11,
    fontWeight: '700',
  },

  cardPhone: {
    fontSize: 12,
  },

  cardActions: { gap: 6 },

  callBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },

  callBtnText: { fontSize: 16 },

  deleteBtnSmall: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FEE',
    alignItems: 'center',
  },

  deleteBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorText: {
    marginBottom: 16,
    color: Colors.primary,
  },

  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },

  retryText: {
    color: '#fff',
  },

  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
});