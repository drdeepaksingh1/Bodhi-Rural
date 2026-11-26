import React, { useState } from 'react';
import { Alert, Image, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const site = 'https://www.brlps.co.in';
const farm = ['Farmer', 'Field Team', 'Management'];
const mart = ['Buyer', 'Seller', 'Delivery Partner'];
const hindi = {
  'Farmer': 'किसान', 'Field Team': 'फील्ड टीम', 'Management': 'प्रबंधन',
  'Buyer': 'खरीदार', 'Seller': 'विक्रेता', 'Delivery Partner': 'डिलीवरी पार्टनर',
  'Back': 'वापस', 'Choose your sign-in': 'लॉग इन का प्रकार चुनें',
  'Sign in on Bodhi Rural': 'बोधि रूरल पर लॉग इन करें',
  'Browse products': 'उत्पाद देखें', 'Create a buyer account': 'खरीदार खाता बनाएँ',
  'Apply to sell': 'विक्रेता बनने के लिए आवेदन करें', 'Apply as a farmer': 'किसान के रूप में आवेदन करें',
  'Check application status': 'आवेदन की स्थिति देखें',
  'Delivery partner sign-in is in development.': 'डिलीवरी पार्टनर लॉग इन अभी तैयार किया जा रहा है।',
};
const actions = {
  Farmer: [['Sign in on Bodhi Rural', '/login?redirect=%2Fbodhifarm'], ['Apply as a farmer', '/farmer/register']],
  'Field Team': [['Sign in on Bodhi Rural', '/login?redirect=%2Fbodhifarm']],
  Management: [['Sign in on Bodhi Rural', '/login?redirect=%2Fdashboard']],
  Buyer: [['Sign in on Bodhi Rural', '/login?account=buyer&redirect=%2Fbodhimart%2Fproducts'],
    ['Create a buyer account', '/bodhimart/register'], ['Browse products', '/bodhimart/products']],
  Seller: [['Sign in on Bodhi Rural', '/login?account=seller&redirect=%2Fbodhimart%2Fseller%2Fdashboard'],
    ['Apply to sell', '/bodhimart/seller/register'], ['Check application status', '/bodhimart/seller/status']],
};

export default function App() {
  const [lang, setLang] = useState('en');
  const [section, setSection] = useState(null);
  const [role, setRole] = useState(null);
  const label = (value) => lang === 'hi' ? hindi[value] || value : value;

  async function open(path) {
    try {
      await Linking.openURL(site + path);
    } catch {
      Alert.alert(lang === 'hi' ? 'पेज नहीं खुल सका' : 'Could not open the page');
    }
  }

  function button(title, onPress, secondary = false) {
    return (
      <Pressable key={title} accessibilityRole="button" onPress={onPress}
        style={[styles.button, secondary && styles.secondary]}>
        <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label(title)}</Text>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {section && button('Back', () => role ? setRole(null) : setSection(null), true)}
        <Image accessibilityLabel="Bodhi Rural" resizeMode="contain" style={styles.logo}
          source={{ uri: site + '/branding/bodhi-rural-logo.png' }} />
        <Text accessibilityRole="header" style={styles.title}>{section || 'Bodhi Rural'}</Text>
        <View style={styles.languages}>
          {['en', 'hi'].map((value) => (
            <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === lang }}
              onPress={() => setLang(value)} style={[styles.language, value === lang && styles.selected]}>
              <Text style={styles.secondaryText}>{value === 'en' ? 'English' : 'हिन्दी'}</Text>
            </Pressable>
          ))}
        </View>
        {!section && ['BodhiFarm', 'BodhiMart'].map((name) => button(name, () => setSection(name)))}
        {section && !role && <>
          <Text style={styles.heading}>{label('Choose your sign-in')}</Text>
          {(section === 'BodhiFarm' ? farm : mart).map((name) => button(name, () => setRole(name)))}
        </>}
        {role && <>
          <Text accessibilityRole="header" style={styles.heading}>{label(role)}</Text>
          {role === 'Delivery Partner'
            ? <Text style={styles.note}>{label('Delivery partner sign-in is in development.')}</Text>
            : actions[role].map(([title, path], index) => button(title, () => open(path), index > 0))}
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#faf6eb' },
  content: { padding: 24, paddingTop: 42, gap: 14, width: '100%', maxWidth: 560, alignSelf: 'center' },
  logo: { alignSelf: 'center', width: 220, height: 84 },
  title: { color: '#124531', fontWeight: 'bold', fontSize: 34, textAlign: 'center' },
  heading: { color: '#124531', fontWeight: 'bold', fontSize: 23, textAlign: 'center', marginTop: 12 },
  languages: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10 },
  language: { paddingHorizontal: 18, minHeight: 48, justifyContent: 'center', borderRadius: 16, backgroundColor: '#fff' },
  selected: { backgroundColor: '#f9d781' },
  button: { minHeight: 72, backgroundColor: '#124531', borderRadius: 18, justifyContent: 'center', alignItems: 'center', padding: 16 },
  secondary: { minHeight: 52, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5b337' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18, textAlign: 'center' },
  secondaryText: { color: '#124531', fontWeight: 'bold', textAlign: 'center' },
  note: { color: '#124531', fontSize: 16, textAlign: 'center', padding: 16 },
});
