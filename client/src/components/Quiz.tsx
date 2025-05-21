import React, { useState } from 'react';
import { IQuiz } from '../api/modules';
import './Quiz.css';

interface Props {
  quiz: IQuiz;
  onSuccess: () => void;
  passed: boolean;
}

export default function Quiz({ quiz, onSuccess, passed }: Props) {
  const [answers, setAnswers] = useState<number[][]>(
    quiz.questions.map(() => [])
  );
  const [result, setResult] = useState<'ok' | 'fail' | null>(null);

  const toggle = (qi: number, opt: number, checked: boolean) => {
    setAnswers(prev => {
      const arr = prev.map(a => [...a]);
      const set = new Set(arr[qi]);
      checked ? set.add(opt) : set.delete(opt);
      arr[qi] = Array.from(set);
      return arr;
    });
  };

  const submit = () => {
    let good = 0;
    quiz.questions.forEach((q, i) => {
      const ans = [...answers[i]].sort().join(',');
      const corr = [...q.correct].sort().join(',');
      if (ans === corr) good++;
    });
    const score = (good / quiz.questions.length) * 100;
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
            <label key={oi} className="quiz-option">
              <input
                type="checkbox"
                checked={answers[qi].includes(oi)}
                onChange={e => toggle(qi, oi, e.target.checked)}
                disabled={passed}
              />{' '}
              {o}
            </label>
          ))}
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
