import { Copy } from './language';

export const applicationTermsVersion = '2026-11-27-v1';

export function ApplicationTerms({ role }: { role: 'seller' | 'delivery' }) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-green-200 bg-green-50 p-4">
      <legend className="px-2 text-base font-bold text-green-950">
        <Copy en="Application terms and agreement" hi="आवेदन की शर्तें और सहमति" />
      </legend>
      <ul className="list-disc space-y-2 pl-5 text-sm text-slate-800">
        <li><Copy en="I confirm that my application information is accurate and will report any changes to BodhiMart." hi="मैं पुष्टि करता/करती हूँ कि मेरे आवेदन की जानकारी सही है और किसी बदलाव की सूचना BodhiMart को दूँगा/दूँगी।" /></li>
        <li><Copy en="BodhiMart reviews applications and may request documents or clarification before approving access." hi="BodhiMart आवेदन की समीक्षा करता है और अनुमति देने से पहले दस्तावेज़ या स्पष्टीकरण माँग सकता है।" /></li>
        <li>{role === 'seller'
          ? <Copy en="If approved, I will keep product descriptions, prices and stock accurate, sell only products I am authorised to sell, and promptly report fulfilment problems." hi="स्वीकृति मिलने पर मैं उत्पाद विवरण, मूल्य और स्टॉक सही रखूँगा/रखूँगी, केवल अधिकृत उत्पाद बेचूँगा/बेचूँगी और ऑर्डर की समस्या तुरंत बताऊँगा/बताऊँगी।" />
          : <Copy en="If approved, I will handle orders safely, keep customer information confidential and report pickup or delivery problems promptly." hi="स्वीकृति मिलने पर मैं ऑर्डर सुरक्षित ढंग से सँभालूँगा/सँभालूँगी, ग्राहक की जानकारी गोपनीय रखूँगा/रखूँगी और पिकअप या डिलीवरी की समस्या तुरंत बताऊँगा/बताऊँगी।" />}</li>
        <li><Copy en="Submitting this application requests approval. Any commercial or payout terms will be provided separately before activation." hi="इस आवेदन को जमा करने से स्वीकृति का अनुरोध किया जाता है। व्यावसायिक या भुगतान की शर्तें सक्रिय करने से पहले अलग से दी जाएँगी।" /></li>
      </ul>
      <p className="text-xs text-slate-600"><Copy en="Agreement version" hi="सहमति संस्करण" /> {applicationTermsVersion}</p>
      <label className="flex items-start gap-3 font-semibold text-green-950">
        <input className="m-0 mt-1 h-5 w-5 shrink-0" style={{ width: 20, padding: 0, margin: '2px 0 0' }} type="checkbox" name="application_terms" value={applicationTermsVersion} required />
        <Copy en="I have read and agree to the application terms." hi="मैंने आवेदन की शर्तें पढ़ ली हैं और उनसे सहमत हूँ।" />
      </label>
    </fieldset>
  );
}
