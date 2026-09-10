import { Link } from 'react-router-dom';

export default function CareerGuidanceSEO() {
  return (
    <main
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '56px 24px 80px',
      }}
    >
      <section
        style={{
          textAlign: 'center',
          maxWidth: '820px',
          margin: '0 auto',
        }}
      >
        <p
          style={{
            fontWeight: 700,
            color: '#f97316',
            marginBottom: '12px',
          }}
        >
          TruMarg Career Guidance
        </p>

        <h1
          style={{
            fontSize: 'clamp(34px, 5vw, 56px)',
            lineHeight: 1.1,
            marginBottom: '20px',
            color: '#172554',
          }}
        >
          Career Guidance for Students
        </h1>

        <p
          style={{
            fontSize: '18px',
            lineHeight: 1.7,
            color: '#475569',
          }}
        >
          Explore career paths based on your interests,
          strengths, preferences and academic journey.
          TruMarg helps students understand suitable
          career directions through a structured career
          discovery experience.
        </p>

        <Link
          to="/career-discovery"
          style={{
            display: 'inline-flex',
            marginTop: '28px',
            padding: '14px 24px',
            borderRadius: '10px',
            background: '#172554',
            color: '#ffffff',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Start Career Assessment →
        </Link>
      </section>

      <section
        style={{
          marginTop: '72px',
          display: 'grid',
          gap: '24px',
        }}
      >
        <h2
          style={{
            color: '#172554',
            fontSize: '30px',
          }}
        >
          How TruMarg Career Guidance Helps
        </h2>

        <p style={{ lineHeight: 1.8, color: '#475569' }}>
          Career decisions should not depend only on one
          interest or one subject. TruMarg career discovery
          is designed to help students explore their
          interests, strengths, working preferences and
          possible career directions together.
        </p>

        <h2
          style={{
            color: '#172554',
            fontSize: '30px',
            marginTop: '24px',
          }}
        >
          Career Assessment for Students
        </h2>

        <p style={{ lineHeight: 1.8, color: '#475569' }}>
          The assessment experience helps students think
          systematically about what kind of activities,
          subjects, environments and career paths may suit
          them.
        </p>
      </section>
    </main>
  );
}