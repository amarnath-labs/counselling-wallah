import { Link } from 'react-router-dom';

export default function CollegeCounsellingSEO() {
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
          TruMarg College Counselling
        </p>

        <h1
          style={{
            fontSize: 'clamp(34px, 5vw, 56px)',
            lineHeight: 1.1,
            marginBottom: '20px',
            color: '#172554',
          }}
        >
          College Counselling & Admission Guidance
        </h1>

        <p
          style={{
            fontSize: '18px',
            lineHeight: 1.7,
            color: '#475569',
          }}
        >
          Understand college options, counselling rounds,
          previous cutoffs, branches and admission
          possibilities with TruMarg.
        </p>

        <div
          style={{
            marginTop: '28px',
            display: 'flex',
            gap: '14px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/exams"
            style={{
              padding: '14px 24px',
              borderRadius: '10px',
              background: '#172554',
              color: '#ffffff',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Find My Colleges →
          </Link>

          <Link
            to="/college-predictor"
            style={{
              padding: '14px 24px',
              borderRadius: '10px',
              color: '#172554',
              border: '1px solid #cbd5e1',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            College Predictor 2026
          </Link>
        </div>
      </section>

      <section
        style={{
          marginTop: '72px',
          display: 'grid',
          gap: '24px',
        }}
      >
        <h2 style={{ color: '#172554', fontSize: '30px' }}>
          College Counselling Made Easier
        </h2>

        <p style={{ lineHeight: 1.8, color: '#475569' }}>
          College counselling involves understanding your
          rank, category, available colleges, branches,
          counselling rounds and previous admission
          cutoffs. TruMarg brings these pieces together to
          help students explore their options.
        </p>

        <h2
          style={{
            color: '#172554',
            fontSize: '30px',
            marginTop: '24px',
          }}
        >
          Use Your Rank to Explore College Options
        </h2>

        <p style={{ lineHeight: 1.8, color: '#475569' }}>
          Use the TruMarg college prediction flow to explore
          possible colleges and branches using your
          admission details and available historical
          counselling data.
        </p>
      </section>
    </main>
  );
}