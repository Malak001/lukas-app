import type { LanguageCode } from "./languages";

export const QUIZ_STRINGS: Record<
  LanguageCode,
  {
    whichMeans: string;
    next: string;
    finish: string;
    correctFeedback: string;
    incorrectFeedback: string;
    retry: string;
    allCorrect: string;
    someWrong: string;
    practice: string;
    completed: string;
  }
> = {
  en: {
    whichMeans: "Which phrase means:",
    next: "Next",
    finish: "Finish",
    correctFeedback: "Correct!",
    incorrectFeedback: "Incorrect. Correct answer:",
    retry: "Try again",
    allCorrect: "All correct! Lesson complete.",
    someWrong: "Some answers were wrong — try again.",
    practice: "Practice",
    completed: "Completed",
  },
  es: {
    whichMeans: "¿Qué frase significa:",
    next: "Siguiente",
    finish: "Terminar",
    correctFeedback: "¡Correcto!",
    incorrectFeedback: "Incorrecto. Respuesta correcta:",
    retry: "Intentar de nuevo",
    allCorrect: "¡Todo correcto! Lección completada.",
    someWrong: "Algunas respuestas fueron incorrectas — inténtalo de nuevo.",
    practice: "Práctica",
    completed: "Completada",
  },
  fr: {
    whichMeans: "Quelle phrase signifie :",
    next: "Suivant",
    finish: "Terminer",
    correctFeedback: "Correct !",
    incorrectFeedback: "Incorrect. Bonne réponse :",
    retry: "Réessayer",
    allCorrect: "Tout est correct ! Leçon terminée.",
    someWrong: "Certaines réponses étaient incorrectes — réessayez.",
    practice: "Entraînement",
    completed: "Terminée",
  },
  de: {
    whichMeans: "Welcher Ausdruck bedeutet:",
    next: "Weiter",
    finish: "Fertig",
    correctFeedback: "Richtig!",
    incorrectFeedback: "Falsch. Richtige Antwort:",
    retry: "Erneut versuchen",
    allCorrect: "Alles richtig! Lektion abgeschlossen.",
    someWrong: "Einige Antworten waren falsch — versuch's noch einmal.",
    practice: "Übung",
    completed: "Abgeschlossen",
  },
  ar: {
    whichMeans: "أي عبارة تعني:",
    next: "التالي",
    finish: "إنهاء",
    correctFeedback: "إجابة صحيحة!",
    incorrectFeedback: "إجابة خاطئة. الإجابة الصحيحة:",
    retry: "حاول مرة أخرى",
    allCorrect: "كل الإجابات صحيحة! اكتمل الدرس.",
    someWrong: "بعض الإجابات كانت خاطئة — حاول مرة أخرى.",
    practice: "تدريب",
    completed: "مكتمل",
  },
  zh: {
    whichMeans: "哪个短语的意思是:",
    next: "下一题",
    finish: "完成",
    correctFeedback: "正确！",
    incorrectFeedback: "不正确。正确答案：",
    retry: "再试一次",
    allCorrect: "全部正确！课程已完成。",
    someWrong: "有些答案不对——请再试一次。",
    practice: "练习",
    completed: "已完成",
  },
  pt: {
    whichMeans: "Qual frase significa:",
    next: "Próxima",
    finish: "Concluir",
    correctFeedback: "Correto!",
    incorrectFeedback: "Incorreto. Resposta correta:",
    retry: "Tentar novamente",
    allCorrect: "Tudo certo! Lição concluída.",
    someWrong: "Algumas respostas estavam erradas — tente novamente.",
    practice: "Prática",
    completed: "Concluída",
  },
  ja: {
    whichMeans: "どのフレーズが次の意味ですか:",
    next: "次へ",
    finish: "終了",
    correctFeedback: "正解！",
    incorrectFeedback: "不正解。正解は：",
    retry: "もう一度挑戦",
    allCorrect: "全部正解です！レッスン完了。",
    someWrong: "間違った答えがあります — もう一度挑戦してください。",
    practice: "練習",
    completed: "完了",
  },
};
