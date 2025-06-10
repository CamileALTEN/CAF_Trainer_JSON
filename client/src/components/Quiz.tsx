import React, { useState } from 'react';
import { IQuiz } from '../api/modules';
import { saveQuizResult } from '../api/quiz';
import './Quiz.css';

interface Props {
  quiz: IQuiz;
  onSuccess: () => void;
  passed: boolean;
  moduleId: string;
  itemId: string;
  username?: string;
}

export default function Quiz({ quiz, onSuccess, passed, moduleId, itemId, username }: Props) {
  const [answers, setAnswers] = useState<number[][]>(
    quiz.questions.map(() => [])
  );
  const [result, setResult] = useState<'ok' | 'fail' | null>(null);
  const [showCorr, setShowCorr] = useState(false);

  const toggle = (qi: number, opt: number, checked: boolean) => {
    setAnswers(prev => {
      const arr = prev.map(a => [...a]);
      const set = new Set(arr[qi]);
      checked ? set.add(opt) : set.delete(opt);
      arr[qi] = Array.from(set);
      return arr;
    });
  };

  const submit = async () => {
    let good = 0;
    quiz.questions.forEach((q, i) => {
      const ans = [...answers[i]].sort().join(',');
      const corr = [...q.correct].sort().join(',');
      if (ans === corr) good++;
    });
    const score = (good / quiz.questions.length) * 100;
    try {
      await saveQuizResult({ username: username || 'anon', moduleId, itemId, answers, score });
    } catch {
      /* ignore */
    }
    setShowCorr(true);
    if (score >= 80) {
      setResult('ok');
      onSuccess();
    } else {
      setResult('fail');
    }
  };

  return (
    <div className="quiz">
      <h3>Quiz</h3>
      {quiz.questions.map((q, qi) => (
        <div key={qi} className="quiz-question">
          <p>{q.question}</p>
          {q.options.map((o, oi) => (
            <label
              key={oi}
              className={`quiz-option${
                showCorr || passed
                  ? q.correct.includes(oi)
                    ? ' correct'
                    : answers[qi].includes(oi)
                      ? ' wrong'
                      : ''
                  : ''
              }`}
            >
              <input
                type="checkbox"
                checked={answers[qi].includes(oi)}
                onChange={e => toggle(qi, oi, e.target.checked)}
                disabled={passed || showCorr}
              />{' '}
              {o}
            </label>
          ))}
          {showCorr &&
            [...answers[qi]].sort().join(',') !== [...q.correct].sort().join(',') && (
              <p className="quiz-correction">
                Correction : {q.correct.map(idx => q.options[idx]).join(', ')}
              </p>
            )}
        </div>
      ))}
      {result === 'ok' && <p className="quiz-result success">Bravo ! Quiz réussi.</p>}
      {result === 'fail' && (
        <div className="quiz-popup">
          <p>Quiz échoué… réessayez !</p>
          <button onClick={() => setResult(null)}>Fermer</button>
        </div>
      )}
      {!passed && (
        <button className="quiz-submit" onClick={submit}>
          Valider le quiz
        </button>
      )}
    </div>
  );
}
