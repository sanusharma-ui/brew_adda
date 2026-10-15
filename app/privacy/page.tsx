export const metadata = { title: "Privacy" };
export default function Privacy() {
  return (
    <main id="main" className="shell page-content legal">
      <p className="eyebrow">THE SMALL PRINT</p>
      <h1>
        Your <em>privacy.</em>
      </h1>
      <h2>Browsing the site</h2>
      <p>
        This website does not include analytics, advertising trackers, or a
        customer mailing list. The hosting provider may keep standard request
        logs. Illustrative coffee images load from Unsplash, which receives
        normal image request information, including your IP address. Typography
        loads from Google Fonts, whose servers receive standard font requests.
      </p>
      <h2>Owner access</h2>
      <p>
        The owner panel uses an essential, HTTP-only session cookie lasting up
        to eight hours. Menu and café details are saved in MongoDB. Logging out
        removes the session cookie from your browser.
      </p>
      <h2>Getting in touch</h2>
      <p>
        Email, phone, and map links open the services you choose to use. Their
        own privacy policies apply. Contact information will be available on our
        Visit page when configured.
      </p>
      <h2>About this concept</h2>
      <p>
        Lumea is a fictional café concept. Menu items, hours, and photography
        are illustrative until the owner replaces them with verified business
        details.
      </p>
    </main>
  );
}
