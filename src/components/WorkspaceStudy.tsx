import React, { useState, useMemo } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { StudyCard, StudyDifficulty } from '../types.ts';
import {
  GraduationCap,
  Sparkles,
  RotateCw,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  BookOpen,
  Award,
  HelpCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const WorkspaceStudy: React.FC = () => {
  const {
    activeConversation,
    studyDifficulty,
    setStudyDifficulty,
    addStudyCard,
    removeStudyCard,
    sendMessage,
    setCurrentMode,
  } = useChat();

  const [activeFilter, setActiveFilter] = useState<'all' | 'flashcard' | 'mcq' | 'quiz' | 'revision'>('all');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // MCQ quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showAddModal, setShowAddModal] = useState(false);

  // New card form state
  const [newType, setNewType] = useState<'flashcard' | 'mcq' | 'revision'>('flashcard');
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '', '', '']);
  const [newCorrectIdx, setNewCorrectIdx] = useState(0);
  const [newExplanation, setNewExplanation] = useState('');

  const studyCards: StudyCard[] = useMemo(() => {
    return activeConversation?.studyCards || [];
  }, [activeConversation]);

  const filteredCards = useMemo(() => {
    if (activeFilter === 'all') return studyCards;
    return studyCards.filter((c) => c.type === activeFilter);
  }, [studyCards, activeFilter]);

  const flashcardsOnly = useMemo(() => {
    return studyCards.filter((c) => c.type === 'flashcard');
  }, [studyCards]);

  const currentFlashcard = flashcardsOnly[flashcardIndex] || null;

  // Quiz calculations
  const quizCards = useMemo(() => {
    return studyCards.filter((c) => c.type === 'mcq' || c.type === 'quiz');
  }, [studyCards]);

  const quizScore = useMemo(() => {
    let score = 0;
    quizCards.forEach((card) => {
      if (
        typeof card.correctIndex === 'number' &&
        selectedAnswers[card.id] === card.correctIndex
      ) {
        score++;
      }
    });
    return score;
  }, [quizCards, selectedAnswers]);

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newType === 'flashcard' && (!newFront.trim() || !newBack.trim())) return;
    if (newType === 'mcq' && !newQuestion.trim()) return;
    if (newType === 'revision' && (!newFront.trim() || !newBack.trim())) return;

    const card: StudyCard = {
      id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: newType,
      difficulty: studyDifficulty,
      front: newFront.trim(),
      back: newBack.trim(),
      question: newQuestion.trim(),
      options: newType === 'mcq' ? newOptions.filter((o) => o.trim().length > 0) : undefined,
      correctIndex: newType === 'mcq' ? newCorrectIdx : undefined,
      explanation: newExplanation.trim() || undefined,
    };

    await addStudyCard(card);
    setShowAddModal(false);
    setNewFront('');
    setNewBack('');
    setNewQuestion('');
    setNewOptions(['', '', '', '']);
    setNewCorrectIdx(0);
    setNewExplanation('');
  };

  const handleGenerateStudyItems = (type: 'flashcards' | 'quiz' | 'revision') => {
    setCurrentMode('study');
    if (type === 'flashcards') {
      sendMessage(
        `Based on our conversation, please create 5 comprehensive flashcards formatted with Front and Back for revision at ${studyDifficulty.toUpperCase()} difficulty.`
      );
    } else if (type === 'quiz') {
      sendMessage(
        `Based on our conversation, generate a 5-question multiple choice quiz (MCQ) at ${studyDifficulty.toUpperCase()} difficulty with 4 choices each, marking the correct answer and providing explanations.`
      );
    } else {
      sendMessage(
        `Based on our conversation, create a high-yield Study Revision Sheet with key definitions, formulas, and bullet-point summaries at ${studyDifficulty.toUpperCase()} difficulty.`
      );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/60 dark:bg-[#080A12] scrollbar-thin">
      {/* Top Banner: Mode & Difficulty */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#06B6D4]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#7C3AED] dark:text-[#06B6D4]">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F5F7FF]">
                Study Mode 2.0
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#06B6D4] uppercase">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#9CA3AF] mt-0.5">
              Interactive flashcards, scored MCQs, quizzes, and high-yield revision summaries.
            </p>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#9CA3AF]">
            Difficulty:
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-[#171A2B] p-1 rounded-xl border border-slate-200 dark:border-[#1E2337]">
            {(['easy', 'medium', 'hard'] as StudyDifficulty[]).map((diff) => {
              const isSelected = studyDifficulty === diff;
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setStudyDifficulty(diff)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    isSelected
                      ? diff === 'easy'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : diff === 'medium'
                        ? 'bg-[#7C3AED] text-white shadow-xs'
                        : 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-500 dark:text-[#9CA3AF] hover:text-slate-800 dark:hover:text-[#F5F7FF]'
                  }`}
                >
                  {diff}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Generator Quick Action Buttons */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9CA3AF]">
          Automated Study Generation
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleGenerateStudyItems('flashcards')}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] hover:border-[#7C3AED]/60 hover:bg-[#7C3AED]/5 text-left text-xs font-semibold text-slate-800 dark:text-[#F5F7FF] transition-all cursor-pointer shadow-xs group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/15 text-[#7C3AED] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">Generate Flashcards</p>
              <p className="text-[11px] text-slate-400 font-normal">Extract high-yield facts & concepts</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleGenerateStudyItems('quiz')}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] hover:border-[#06B6D4]/60 hover:bg-[#06B6D4]/5 text-left text-xs font-semibold text-slate-800 dark:text-[#F5F7FF] transition-all cursor-pointer shadow-xs group"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-[#06B6D4] flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">Generate MCQ Quiz</p>
              <p className="text-[11px] text-slate-400 font-normal">Test comprehension with feedback</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleGenerateStudyItems('revision')}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] hover:border-emerald-500/60 hover:bg-emerald-500/5 text-left text-xs font-semibold text-slate-800 dark:text-[#F5F7FF] transition-all cursor-pointer shadow-xs group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">Generate Revision Sheet</p>
              <p className="text-[11px] text-slate-400 font-normal">Formulas, terms & key definitions</p>
            </div>
          </button>
        </div>
      </div>

      {/* Interactive Flashcard Player (if flashcards exist) */}
      {flashcardsOnly.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F7FF] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7C3AED]" />
              <span>Interactive Flashcard Deck ({flashcardIndex + 1} / {flashcardsOnly.length})</span>
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={flashcardIndex === 0}
                onClick={() => {
                  setIsFlipped(false);
                  setFlashcardIndex((prev) => Math.max(0, prev - 1));
                }}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1E2337] text-slate-600 dark:text-[#9CA3AF] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#171A2B]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={flashcardIndex >= flashcardsOnly.length - 1}
                onClick={() => {
                  setIsFlipped(false);
                  setFlashcardIndex((prev) => Math.min(flashcardsOnly.length - 1, prev + 1));
                }}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1E2337] text-slate-600 dark:text-[#9CA3AF] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#171A2B]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {currentFlashcard && (
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="cursor-pointer group min-h-[180px] sm:min-h-[220px] rounded-2xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] p-6 flex flex-col justify-between relative shadow-md transition-all hover:border-[#7C3AED]/50"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[#7C3AED] dark:text-[#06B6D4]">
                  {isFlipped ? 'Answer / Explanation' : 'Question / Concept'}
                </span>
                <span className="flex items-center gap-1 text-[11px] group-hover:text-[#7C3AED]">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Click to flip</span>
                </span>
              </div>

              <div className="my-auto py-4 text-center">
                <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-[#F5F7FF] leading-relaxed">
                  {isFlipped ? currentFlashcard.back : currentFlashcard.front}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="capitalize">Level: {currentFlashcard.difficulty || studyDifficulty}</span>
                <span>Deck: {flashcardIndex + 1} of {flashcardsOnly.length}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quizzes & MCQs Section */}
      {quizCards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F7FF] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#06B6D4]" />
              <span>Interactive Quiz ({quizScore} / {quizCards.length} correct)</span>
            </h3>
            <button
              type="button"
              onClick={() => setSelectedAnswers({})}
              className="text-xs text-[#06B6D4] hover:underline cursor-pointer"
            >
              Reset Quiz Answers
            </button>
          </div>

          <div className="space-y-4">
            {quizCards.map((quiz, qIdx) => {
              const selectedIdx = selectedAnswers[quiz.id];
              const isAnswered = typeof selectedIdx === 'number';
              const isCorrect = isAnswered && selectedIdx === quiz.correctIndex;

              return (
                <div
                  key={quiz.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-[#F5F7FF]">
                      <span className="text-[#06B6D4] mr-2">Q{qIdx + 1}.</span>
                      {quiz.question}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeStudyCard(quiz.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-md"
                      title="Remove question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Options */}
                  {quiz.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {quiz.options.map((opt, optIdx) => {
                        const isThisSelected = selectedIdx === optIdx;
                        const isThisCorrect = quiz.correctIndex === optIdx;

                        let styleClasses =
                          'border-slate-200 dark:border-[#1E2337] bg-slate-50 dark:bg-[#171A2B] text-slate-700 dark:text-[#F5F7FF] hover:border-[#7C3AED]/40';

                        if (isAnswered) {
                          if (isThisCorrect) {
                            styleClasses =
                              'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold ring-1 ring-emerald-500';
                          } else if (isThisSelected && !isCorrect) {
                            styleClasses =
                              'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold ring-1 ring-rose-500';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={isAnswered}
                            onClick={() =>
                              setSelectedAnswers((prev) => ({ ...prev, [quiz.id]: optIdx }))
                            }
                            className={`p-3 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between gap-2 transition-all cursor-pointer ${styleClasses}`}
                          >
                            <span>{opt}</span>
                            {isAnswered && isThisCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                            {isAnswered && isThisSelected && !isCorrect && (
                              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Explanation if answered */}
                  {isAnswered && quiz.explanation && (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#171A2B] text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#20253B]">
                      <span className="font-bold text-slate-900 dark:text-[#F5F7FF]">Explanation: </span>
                      {quiz.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs & Manual Add */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['all', 'flashcard', 'mcq', 'revision'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer ${
                activeFilter === tab
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-white dark:bg-[#171A2B] text-slate-600 dark:text-[#9CA3AF] border border-slate-200 dark:border-[#1E2337]'
              }`}
            >
              {tab === 'all' ? 'All Items' : tab}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-[#171A2B] text-white text-xs font-semibold border border-slate-700 hover:border-[#7C3AED] cursor-pointer transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>Add Custom Card</span>
        </button>
      </div>

      {/* Empty State when no study cards */}
      {studyCards.length === 0 && (
        <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-[#1E2337] space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] dark:text-[#06B6D4]">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-[#F5F7FF]">
            No Study Items Yet
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click "Generate Flashcards" or "Generate MCQ Quiz" above to turn your current conversation into interactive study material.
          </p>
        </div>
      )}

      {/* Manual Add Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div
            className="w-full max-w-lg p-6 rounded-2xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F7FF]">
              Create New Study Item
            </h3>

            <div className="flex items-center gap-2">
              {(['flashcard', 'mcq', 'revision'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewType(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize cursor-pointer ${
                    newType === t
                      ? 'bg-[#7C3AED] text-white'
                      : 'bg-slate-100 dark:bg-[#171A2B] text-slate-600 dark:text-[#9CA3AF]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateCard} className="space-y-3 text-xs">
              {newType === 'mcq' ? (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Question:
                    </label>
                    <input
                      type="text"
                      required
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="e.g. What is the time complexity of binary search?"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-slate-50 dark:bg-[#171A2B] text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      4 Options (Select radio for correct answer):
                    </label>
                    {newOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={newCorrectIdx === i}
                          onChange={() => setNewCorrectIdx(i)}
                          className="accent-[#7C3AED]"
                        />
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const copy = [...newOptions];
                            copy[i] = e.target.value;
                            setNewOptions(copy);
                          }}
                          placeholder={`Option ${i + 1}`}
                          className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-slate-50 dark:bg-[#171A2B]"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Explanation (optional):
                    </label>
                    <input
                      type="text"
                      value={newExplanation}
                      onChange={(e) => setNewExplanation(e.target.value)}
                      placeholder="Brief rationale for why this answer is correct"
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-slate-50 dark:bg-[#171A2B]"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Front (Prompt / Term):
                    </label>
                    <input
                      type="text"
                      required
                      value={newFront}
                      onChange={(e) => setNewFront(e.target.value)}
                      placeholder="e.g. Photosynthesis"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-slate-50 dark:bg-[#171A2B] text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Back (Definition / Summary):
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={newBack}
                      onChange={(e) => setNewBack(e.target.value)}
                      placeholder="e.g. Process by which plants convert light energy into chemical energy..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-slate-50 dark:bg-[#171A2B] text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#1E2337] text-slate-600 dark:text-[#9CA3AF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold cursor-pointer shadow-xs"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
