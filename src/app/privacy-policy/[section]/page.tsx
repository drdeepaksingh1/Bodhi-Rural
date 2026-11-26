import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Copy } from '../../bodhimart/language';

const policies = {
  bodhifarm: {
    name: 'BodhiFarm',
    purpose: ['We use your information to review farmer applications, manage farms and field assignments, and maintain production and payment records.', 'हम आपकी जानकारी का उपयोग किसान आवेदन की समीक्षा, फार्म और फील्ड कार्य के प्रबंधन तथा उत्पादन और भुगतान रिकॉर्ड रखने के लिए करते हैं।'],
    data: ['Depending on your role, this can include contact and account details, farm and location details, applications, production records, field reports, and payment statements.', 'आपकी भूमिका के अनुसार इसमें संपर्क और खाते की जानकारी, फार्म और स्थान का विवरण, आवेदन, उत्पादन रिकॉर्ड, फील्ड रिपोर्ट और भुगतान विवरण शामिल हो सकते हैं।'],
    access: ['Farmers and authorized team members can access records within their assigned roles. Service providers process information needed to host the service and support account access.', 'किसान और अधिकृत टीम सदस्य अपनी भूमिका के अनुसार रिकॉर्ड देख सकते हैं। सेवा प्रदाता होस्टिंग और खाते तक पहुँच के लिए ज़रूरी जानकारी संसाधित करते हैं।'],
  },
  bodhimart: {
    name: 'BodhiMart',
    purpose: ['We use your information to verify accounts, review sellers, fulfil orders, manage stock and delivery assignments, and support customers.', 'हम आपकी जानकारी का उपयोग खाता सत्यापन, विक्रेता समीक्षा, ऑर्डर पूरा करने, स्टॉक और डिलीवरी प्रबंधन तथा ग्राहक सहायता के लिए करते हैं।'],
    data: ['Depending on your role, this can include contact and account details, addresses, seller application and tax details, shop coordinates, listings, order history, and manual payment references.', 'आपकी भूमिका के अनुसार इसमें संपर्क और खाते की जानकारी, पते, विक्रेता आवेदन और कर विवरण, दुकान का स्थान, उत्पाद लिस्टिंग, ऑर्डर इतिहास और भुगतान संदर्भ शामिल हो सकते हैं।'],
    access: ['Order and application information is available to authorized roles as needed to provide the service. The Android app asks for location access when a seller captures the shop location during registration.', 'सेवा देने के लिए अधिकृत भूमिकाओं को ज़रूरत के अनुसार ऑर्डर और आवेदन की जानकारी मिलती है। विक्रेता पंजीकरण में दुकान का स्थान दर्ज करते समय Android ऐप लोकेशन की अनुमति माँगता है।'],
  },
} as const;

type Section = keyof typeof policies;

export default async function SectionPrivacyPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section !== 'bodhifarm' && section !== 'bodhimart') notFound();
  const policy = policies[section as Section];

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-5 py-10 text-gray-800">
      <h1 className="text-3xl font-bold text-green-950">
        <Copy en={policy.name + ' Privacy Policy'} hi={policy.name + ' गोपनीयता नीति'} />
      </h1>
      <p><Copy en="Bodhi Rural Livelihood & Agri Private Limited operates this service on the web and in the Bodhi Rural Android app." hi="बोधि रूरल लाइवलीहुड एंड एग्री प्राइवेट लिमिटेड यह सेवा वेबसाइट और बोधि रूरल Android ऐप पर संचालित करती है।" /></p>
      <h2 className="text-xl font-semibold"><Copy en="Information we handle" hi="हम कौन-सी जानकारी उपयोग करते हैं" /></h2>
      <p><Copy en={policy.data[0]} hi={policy.data[1]} /></p>
      <h2 className="text-xl font-semibold"><Copy en="Use and access" hi="उपयोग और पहुँच" /></h2>
      <p><Copy en={policy.purpose[0]} hi={policy.purpose[1]} /></p>
      <p><Copy en={policy.access[0]} hi={policy.access[1]} /></p>
      <h2 className="text-xl font-semibold"><Copy en="Retention and deletion" hi="रिकॉर्ड रखना और खाता हटाना" /></h2>
      <p><Copy en="You may request deletion of your account and associated personal information. We may retain records needed for legal obligations, accounting, or dispute resolution." hi="आप अपना खाता और उससे जुड़ी निजी जानकारी हटाने का अनुरोध कर सकते हैं। कानूनी दायित्व, लेखांकन या विवाद समाधान के लिए आवश्यक रिकॉर्ड रखे जा सकते हैं।" /></p>
      <Link href={'/account-deletion?section=' + section} className="inline-flex min-h-11 items-center rounded-lg bg-green-800 px-4 py-2 font-semibold text-white">
        <Copy en="Request account deletion" hi="खाता हटाने का अनुरोध करें" />
      </Link>
      <p><Copy en="Privacy contact" hi="गोपनीयता संबंधी संपर्क" />{' '}<a className="text-green-800 underline" href="mailto:bodhirural@gmail.com">bodhirural@gmail.com</a></p>
    </main>
  );
}
