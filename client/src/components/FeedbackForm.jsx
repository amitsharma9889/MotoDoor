import { useState } from 'react';
import api, { errMsg } from '../api';

export default function FeedbackForm({ booking, onDone }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  if (booking.feedback?.rating)
    return (
      <div className="card">
        <h3 className="font-bold">Your feedback</h3>
        <p className="mt-1 text-ember">{'★'.repeat(booking.feedback.rating)}{'☆'.repeat(5 - booking.feedback.rating)}</p>
        {booking.feedback.comment && <p className="mt-1 text-sm text-ink/70">{booking.feedback.comment}</p>}
      </div>
    );

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setError('Pick a star rating');
    try { const { data } = await api.post(`/bookings/${booking._id}/feedback`, { rating, comment }); onDone(data); }
    catch (err) { setError(errMsg(err)); }
  };

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h3 className="text-lg font-bold">How was the service?</h3>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}
            className={`text-3xl leading-none ${n <= rating ? 'text-ember' : 'text-forest/20'}`}>★</button>
        ))}
      </div>
      <textarea className="input" rows={3} placeholder="Tell us what went well or what we can improve" value={comment} onChange={(e) => setComment(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-dark">Submit feedback</button>
    </form>
  );
}
