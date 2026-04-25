import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <p className="footer-eyebrow">CamConnect</p>
          <h2>Meet new people without the clutter.</h2>
          <p>
            Fast video chat, a cleaner social layer, and an easy way to keep the conversation
            going after you connect.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <h3>Explore</h3>
            <Link href="/">Home</Link>
            <Link href="/chat">Start Chat</Link>
            <Link href="/feed">Feed</Link>
            <Link href="/messages">Messages</Link>
          </div>
          <div>
            <h3>Support</h3>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>{year} CamConnect. Built for fast, human conversations.</p>
      </div>
    </footer>
  );
}
