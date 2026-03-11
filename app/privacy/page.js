export const metadata = {
  title: 'Privacy Policy – FatafatDecor',
  description: 'Privacy Policy for FatafatDecor app and services',
}

export default function PrivacyPolicy() {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 800, margin: '0 auto', padding: '40px 24px', color: '#1a1a1a', lineHeight: 1.7 }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'linear-gradient(135deg, #F9A8D4, #EC4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 28
        }}>🎀</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#EC4899', margin: 0 }}>FatafatDecor</h1>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#374151', margin: '8px 0 0' }}>Privacy Policy</h2>
        <p style={{ color: '#6B7280', fontSize: 14, margin: '8px 0 0' }}>Last updated: March 2025</p>
      </div>

      <Section title="1. Introduction">
        Welcome to FatafatDecor ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application and website at <strong>fatafatdecor.ylo.co.in</strong>.
      </Section>

      <Section title="2. Information We Collect">
        <p>We collect the following types of information:</p>
        <ul>
          <li><strong>Account Information:</strong> Name, email address, phone number, and password when you register</li>
          <li><strong>Order Information:</strong> Delivery address, decoration preferences, and booking details</li>
          <li><strong>Payment Information:</strong> We process payments through Razorpay. We do not store your card or bank details — these are handled securely by Razorpay</li>
          <li><strong>Location Data:</strong> Delivery address coordinates to enable decoration services at your location</li>
          <li><strong>Photos:</strong> Room photos you voluntarily upload for AI-powered decoration suggestions</li>
          <li><strong>Usage Data:</strong> App activity, pages visited, features used — to improve our services</li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul>
          <li>Process and fulfill your decoration bookings</li>
          <li>Send order confirmations, updates, and delivery notifications</li>
          <li>Provide AI-powered decoration suggestions based on your room photos</li>
          <li>Process payments securely via Razorpay</li>
          <li>Improve our app features and user experience</li>
          <li>Provide customer support and resolve disputes</li>
          <li>Send promotional offers (only with your consent)</li>
        </ul>
      </Section>

      <Section title="4. Sharing Your Information">
        <p>We do not sell your personal data. We may share your information with:</p>
        <ul>
          <li><strong>Decorator Partners:</strong> Your delivery address and booking details are shared with our assigned decorator to complete your order</li>
          <li><strong>Payment Processor:</strong> Razorpay processes payments — governed by their <a href="https://razorpay.com/privacy/" style={{ color: '#EC4899' }}>Privacy Policy</a></li>
          <li><strong>Cloud Services:</strong> We use MongoDB Atlas for database storage and ImageKit for photo storage, both with industry-standard security</li>
          <li><strong>Legal Requirements:</strong> If required by law, court order, or government authority</li>
        </ul>
      </Section>

      <Section title="5. Data Storage & Security">
        Your data is stored on secure cloud servers (MongoDB Atlas). We use encryption, secure HTTPS connections, and industry best practices to protect your information. However, no method of transmission over the internet is 100% secure.
      </Section>

      <Section title="6. Photos & AI Processing">
        When you upload room photos for AI decoration suggestions, these images are processed by our AI system to generate decoration recommendations. Images are stored securely on ImageKit CDN and are only accessible to you and our internal systems. We do not use your photos for training AI models or share them publicly.
      </Section>

      <Section title="7. Your Rights">
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and data</li>
          <li>Opt out of promotional communications</li>
          <li>Withdraw consent at any time</li>
        </ul>
        <p>To exercise these rights, contact us at: <strong>support@fatafatdecor.com</strong></p>
      </Section>

      <Section title="8. Cookies">
        Our web app uses minimal cookies and local storage to keep you logged in and remember your preferences. We do not use tracking cookies for advertising purposes.
      </Section>

      <Section title="9. Children's Privacy">
        FatafatDecor is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.
      </Section>

      <Section title="10. Third-Party Services">
        <p>Our app integrates with:</p>
        <ul>
          <li><strong>Razorpay</strong> – Payment processing (<a href="https://razorpay.com/privacy/" style={{ color: '#EC4899' }}>Privacy Policy</a>)</li>
          <li><strong>Google Sign-In</strong> – Authentication (<a href="https://policies.google.com/privacy" style={{ color: '#EC4899' }}>Privacy Policy</a>)</li>
          <li><strong>ImageKit</strong> – Image storage & CDN</li>
          <li><strong>MongoDB Atlas</strong> – Database (MongoDB, Inc.)</li>
        </ul>
      </Section>

      <Section title="11. Changes to This Policy">
        We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this page or through in-app notification. Continued use of the app after changes constitutes acceptance.
      </Section>

      <Section title="12. Contact Us">
        <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
        <p>
          📧 <strong>Email:</strong> support@fatafatdecor.com<br />
          🌐 <strong>Website:</strong> https://fatafatdecor.ylo.co.in<br />
          📍 <strong>Business:</strong> FatafatDecor – Instant Decoration Services, India
        </p>
      </Section>

      <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 24, marginTop: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
        © 2025 FatafatDecor. All rights reserved.
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 12, borderLeft: '3px solid #EC4899', paddingLeft: 12 }}>
        {title}
      </h3>
      <div style={{ color: '#374151', fontSize: 15 }}>
        {typeof children === 'string' ? <p>{children}</p> : children}
      </div>
    </div>
  )
}
