import type { AntaraIdentity } from "@/lib/antara";

/**
 * Why this exists:
 * This component shows the identity and permission payload returned by Antara in a developer-friendly format.
 *
 * What Antara expects:
 * Identity fields and grants from the exchange response should be surfaced to users transparently.
 *
 * Alternatives:
 * Apps may map this response to an internal user model before rendering.
 */
export const IdentityCard = ({ identity }: { identity: AntaraIdentity }) => {
  return (
    <section className="panel">
      <h2>Your Antara identity</h2>
      <dl className="identityGrid">
        <div>
          <dt>Display name</dt>
          <dd>{identity.displayName}</dd>
        </div>
        <div>
          <dt>Slug</dt>
          <dd>{identity.slug}</dd>
        </div>
        <div>
          <dt>Trust level</dt>
          <dd>{identity.trustLevel}</dd>
        </div>
      </dl>

      <h3>Permissions granted</h3>
      <ul className="list">
        {identity.permissions.map((permission) => (
          <li key={permission}>{permission}</li>
        ))}
      </ul>

      <h3>This app can:</h3>
      <ul className="list">
        <li>✔ Identify you</li>
        <li>✔ Message you</li>
      </ul>
    </section>
  );
};
