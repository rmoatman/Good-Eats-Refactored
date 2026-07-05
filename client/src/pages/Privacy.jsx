export default function Privacy() {
  return (
    <section className="main info-page">
      <h2 className="results__header">Privacy &amp; Security</h2>

      <h3>What we store</h3>
      <p>
        If you create an account, we store your email address, a securely hashed
        password (we never store your password in plain text), and the data you
        create in the app — your saved favorites and shopping list. That's it.
      </p>

      <h3>How your account is protected</h3>
      <p>
        Passwords are hashed before they're saved. Signed-in requests are
        authorized with a token, and shopping-list and favorites data are only
        accessible to your own account.
      </p>

      <h3>Third-party services</h3>
      <p>
        Recipe results come from a third-party recipe API and restaurant results
        from a location service. Your search terms are sent to those providers to
        return results. We don't sell your data or share it for advertising.
      </p>

      <h3>Your data</h3>
      <p>
        You can remove favorites and clear your shopping list at any time. To
        delete your account or request removal of your data, contact us using the
        email link in the footer.
      </p>
    </section>
  );
}
