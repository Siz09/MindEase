import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../utils/api';
import '../styles/Mindfulness.css'; // Ensure we have styles

const GuidedProgramPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [program, setProgram] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [textInput, setTextInput] = useState('');
  const [scaleInput, setScaleInput] = useState(null);
  const [choiceInput, setChoiceInput] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // 1. Fetch program details
        const progRes = await api.get(`/api/guided-programs/${id}`);
        setProgram(progRes.data.program);

        // 2. Fetch steps
        const stepsRes = await api.get(`/api/guided-programs/${id}/steps`);
        setSteps(stepsRes.data.steps);

        // 3. Start session
        const sessionRes = await api.post(`/api/guided-programs/${id}/start`);
        setSession(sessionRes.data.session);
      } catch (error) {
        console.error('Error initializing program:', error);
        toast.error('Failed to start exercise');
        navigate('/mindfulness');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      init();
    }
  }, [id, navigate]);

  const currentStep = steps[currentStepIndex];

  const handleNext = async () => {
    if (!session || !currentStep) return;

    // Validate input if needed
    if (currentStep.inputType === 'text' && !textInput.trim()) {
      toast.warning('Please enter your thoughts');
      return;
    }
    if (currentStep.inputType === 'scale' && scaleInput === null) {
      toast.warning('Please select a rating');
      return;
    }
    if (currentStep.inputType === 'choice' && !choiceInput) {
      toast.warning('Please select an option');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare response payload
      let responseValue = null;
      if (currentStep.inputType === 'text') responseValue = textInput;
      else if (currentStep.inputType === 'scale') responseValue = scaleInput;
      else if (currentStep.inputType === 'choice') responseValue = choiceInput;

      const payload = {
        stepNumber: currentStep.stepNumber,
        response: { value: responseValue },
      };

      const res = await api.post(`/api/guided-programs/session/${session.id}/step`, payload);
      const updatedSession = res.data.session;
      setSession(updatedSession);

      if (updatedSession.status === 'completed') {
        toast.success('Exercise completed!');
        navigate('/mindfulness');
      } else {
        // Move to next step locally
        setCurrentStepIndex((prev) => prev + 1);
        // Reset inputs
        setTextInput('');
        setScaleInput(null);
        setChoiceInput(null);
      }
    } catch (error) {
      console.error('Error submitting step:', error);
      toast.error('Failed to save progress');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else {
      if (window.confirm('Exit exercise? Progress will be lost.')) {
        navigate('/mindfulness');
      }
    }
  };

  if (loading) {
    return (
      <div className="mindfulness-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading exercise...</p>
        </div>
      </div>
    );
  }

  if (!program || !currentStep) return null;

  // Calculate progress
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="mindfulness-container guided-program-player">
      {/* Header */}
      <div className="player-header">
        <button onClick={handleBack} className="btn-icon">
          ←
        </button>
        <div className="progress-container">
          <div className="progress-label">
            {program.name} • Step {currentStepIndex + 1}/{steps.length}
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <button onClick={() => navigate('/mindfulness')} className="btn-icon">
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="step-content">
        <h2 className="step-title">{currentStep.title}</h2>
        <p className="step-prompt">{currentStep.promptText}</p>

        {/* Input Areas */}
        <div className="step-input-area">
          {currentStep.inputType === 'text' && (
            <textarea
              className="form-control"
              rows="6"
              placeholder="Type your answer here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          )}

          {currentStep.inputType === 'scale' && (
            <div className="scale-input">
              <div className="scale-options">
                {[...Array(10)].map((_, i) => {
                  const val = i + 1;
                  return (
                    <button
                      key={val}
                      className={`scale-btn ${scaleInput === val ? 'active' : ''}`}
                      onClick={() => setScaleInput(val)}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
              <div className="scale-labels">
                <span>Mild</span>
                <span>Intense</span>
              </div>
            </div>
          )}

          {currentStep.inputType === 'choice' && currentStep.inputOptions?.options && (
            <div className="choice-input">
              {currentStep.inputOptions.options.map((option) => (
                <button
                  key={option}
                  className={`choice-btn ${choiceInput === option ? 'active' : ''}`}
                  onClick={() => setChoiceInput(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="player-footer">
        <button className="btn btn-primary next-btn" onClick={handleNext} disabled={submitting}>
          {submitting ? 'Saving...' : currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default GuidedProgramPlayer;
