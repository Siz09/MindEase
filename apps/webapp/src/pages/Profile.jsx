'use client';

import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import '../styles/Profile.css';

export default function Profile() {
  const { currentUser } = useAuth();

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Profile</h1>
        </div>

        <div className="profile-card">
          <div className="profile-avatar-large">
            {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div className="profile-info">
            <h2>{currentUser?.email}</h2>
            <p className="profile-member-since">
              Member since {new Date(currentUser?.createdAt || Date.now()).toLocaleDateString()}
            </p>
          </div>

          <Link to="/settings" className="btn btn-primary">
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
