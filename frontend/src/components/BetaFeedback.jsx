import {
  useState,
} from 'react';

import {
  useLocation,
} from 'react-router-dom';

import {
  submitFeedback,
} from '../services/feedbackService';

export default function BetaFeedback() {
  const location = useLocation();

  const [open, setOpen] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [category, setCategory] =
    useState('feedback');

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState('');

  const [error, setError] =
    useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanMessage =
      message.trim();

    if (!cleanMessage) {
      setError(
        'Please enter your feedback.'
      );
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await submitFeedback({
        category,
        message: cleanMessage,
        page: location.pathname,
      });

      setMessage('');

      setSuccess(
        'Thanks! Your feedback has been submitted.'
      );
    } catch (err) {
      setError(
        err?.message ||
        'Unable to submit feedback.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="beta-feedback-button"
        onClick={() =>
          setOpen(true)
        }
      >
        Feedback
      </button>

      {open && (
        <div
          className="beta-feedback-overlay"
          onClick={() =>
            setOpen(false)
          }
        >
          <div
            className="beta-feedback-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="beta-feedback-header">
              <div>
                <strong>
                  Counselling Wallah Beta
                </strong>

                <p>
                  Help us improve your experience.
                </p>
              </div>

              <button
                type="button"
                className="beta-feedback-close"
                onClick={() =>
                  setOpen(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Feedback type
              </label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
              >
                <option value="feedback">
                  General feedback
                </option>

                <option value="bug">
                  Report a bug
                </option>

                <option value="recommendation">
                  Recommendation issue
                </option>

                <option value="payment">
                  Payment issue
                </option>

                <option value="ui">
                  UI / mobile issue
                </option>
              </select>

              <label>
                Message
              </label>

              <textarea
                rows="5"
                value={message}
                placeholder="Tell us what happened or what we can improve..."
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
              />

              {error && (
                <div className="beta-feedback-error">
                  {error}
                </div>
              )}

              {success && (
                <div className="beta-feedback-success">
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="beta-feedback-submit"
                disabled={loading}
              >
                {loading
                  ? 'Sending...'
                  : 'Send Feedback'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
