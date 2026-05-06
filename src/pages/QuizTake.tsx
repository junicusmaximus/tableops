import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useCourse, useSubmitQuiz, useQuizAttempts } from '@/hooks/useKnowledge';
import { toast } from 'sonner';

export default function QuizTake() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { data } = useCourse(courseId);
  const { data: attempts = [] } = useQuizAttempts(courseId);
  const submit = useSubmitQuiz();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);

  const questions = data?.questions || [];
  const course = data?.course;
  const lastAttempt = attempts[0];

  const handleSubmit = async () => {
    let score = 0; let total = 0;
    const detail: any[] = [];
    for (const q of questions) {
      total += q.points;
      const ans = answers[q.id];
      let correct = false;
      if (q.question_type === 'multiple_choice' || q.question_type === 'ox') correct = ans === q.correct_answer;
      else if (q.question_type === 'short_answer') correct = (ans || '').toString().trim() === (q.correct_answer || '').toString().trim();
      else if (q.question_type === 'checklist') {
        const checked: string[] = ans || [];
        correct = checked.length === (q.options as string[]).length;
      }
      if (correct) score += q.points;
      detail.push({ qid: q.id, ans, correct });
    }
    const passed = course ? score >= (course.pass_threshold * total / 100) : false;
    try {
      await submit.mutateAsync({ courseId: courseId!, answers: detail, score, totalPoints: total, passed });
      setResult({ score, total, passed });
      toast.success('퀴즈가 제출되었습니다.');
    } catch (e: any) { toast.error(e.message); }
  };

  if (!course) return <div className="container py-6"><p className="text-sm text-muted-foreground">로딩 중...</p></div>;
  if (questions.length === 0) {
    return (
      <div className="container max-w-3xl py-6 space-y-4">
        <Button variant="ghost" size="sm" asChild><Link to="/knowledge"><ArrowLeft className="w-4 h-4 mr-1" />목록으로</Link></Button>
        <Card><CardContent className="p-8 text-center text-muted-foreground">이 교육에는 퀴즈 문항이 없습니다.</CardContent></Card>
      </div>
    );
  }

  if (result) {
    return (
      <div className="container max-w-2xl py-6 space-y-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2">
            {result.passed ? <CheckCircle2 className="text-emerald-500" /> : <XCircle className="text-destructive" />}
            {result.passed ? '합격' : '불합격'}
          </CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold">{result.score} / {result.total}점</p>
            <p className="text-sm text-muted-foreground">합격 기준: {course.pass_threshold}점</p>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/knowledge')}>목록으로</Button>
              {!result.passed && course.allow_quiz_retry && <Button variant="outline" onClick={() => { setResult(null); setAnswers({}); }}>재응시</Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-6 space-y-4">
      <Button variant="ghost" size="sm" asChild><Link to="/knowledge"><ArrowLeft className="w-4 h-4 mr-1" />목록으로</Link></Button>
      <Card>
        <CardHeader>
          <CardTitle>{course.title}</CardTitle>
          <p className="text-sm text-muted-foreground">합격 기준 {course.pass_threshold}점 · 총 {questions.length}문항</p>
          {lastAttempt && <p className="text-xs text-muted-foreground">최근 응시: {lastAttempt.score}/{lastAttempt.total_points}점 ({lastAttempt.passed ? '합격' : '불합격'})</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="space-y-2 pb-4 border-b border-border last:border-0">
              <p className="text-sm font-medium">{i + 1}. {q.question} <Badge variant="outline" className="ml-1 text-xs">{q.points}점</Badge></p>
              {q.question_type === 'multiple_choice' && (
                <div className="space-y-1.5 pl-3">
                  {(q.options as string[]).map((o, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name={q.id} checked={answers[q.id] === idx} onChange={() => setAnswers({ ...answers, [q.id]: idx })} />{o}
                    </label>
                  ))}
                </div>
              )}
              {q.question_type === 'ox' && (
                <div className="flex gap-3 pl-3">
                  <label className="flex items-center gap-1.5"><input type="radio" name={q.id} checked={answers[q.id] === 0} onChange={() => setAnswers({ ...answers, [q.id]: 0 })} />O</label>
                  <label className="flex items-center gap-1.5"><input type="radio" name={q.id} checked={answers[q.id] === 1} onChange={() => setAnswers({ ...answers, [q.id]: 1 })} />X</label>
                </div>
              )}
              {q.question_type === 'short_answer' && (
                <Input value={answers[q.id] || ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} />
              )}
              {q.question_type === 'checklist' && (
                <div className="space-y-1.5 pl-3">
                  {(q.options as string[]).map((o, idx) => {
                    const cur: string[] = answers[q.id] || [];
                    return (
                      <label key={idx} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={cur.includes(o)} onCheckedChange={c =>
                          setAnswers({ ...answers, [q.id]: c ? [...cur, o] : cur.filter(x => x !== o) })
                        } />{o}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          <Button onClick={handleSubmit} disabled={submit.isPending} className="w-full">제출하기</Button>
        </CardContent>
      </Card>
    </div>
  );
}
