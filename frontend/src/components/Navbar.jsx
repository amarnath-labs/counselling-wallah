import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <Link className="brand" to="/">
          <div className="mark" />
          Counselling Wallah
        </Link>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/exams">Find Colleges</Link>
          <Link to="/exams">Exams</Link>
          <Link to="/compare">Compare</Link>
          <Link to="/pricing">Pricing</Link>
        </div>

        <div className="nav-cta">
          <Link className="btn btn-ghost btn-sm" to="/login">
            Login
          </Link>
          <Link className="btn btn-primary btn-sm" to="/exams">
            Find My College
          </Link>
        </div>
      </div>
    </nav>
  );
}
