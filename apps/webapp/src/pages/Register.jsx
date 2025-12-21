'use client';

import RegisterForm from '../components/RegisterForm';
import RegisterWelcome from '../components/RegisterWelcome';
import '../styles/Auth.css';

const Register = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-content">
          <RegisterWelcome />
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default Register;
