import type { LanguageCode } from "./languages";

export const SELF_INTRO_STRINGS: Record<
  LanguageCode,
  {
    heading: string;
    instructions: string;
    placeholder: string;
    wordsLabel: string;
    tooLong: string;
    submitBtn: string;
    grading: string;
    mistakesHeading: string;
    noMistakesHeading: string;
    originalLabel: string;
    correctionLabel: string;
    continueBtn: string;
    alreadyDoneMsg: string;
    writeAgainBtn: string;
  }
> = {
  en: {
    heading: "Introduce yourself",
    instructions:
      "Write a short paragraph introducing yourself — your name, where you're from, why you're learning, your hobbies. Up to 100 words.",
    placeholder: "Write your introduction here...",
    wordsLabel: "words",
    tooLong: "Please shorten your paragraph to 100 words or fewer.",
    submitBtn: "Submit",
    grading: "Reviewing…",
    mistakesHeading: "Things to fix",
    noMistakesHeading: "No mistakes found! Great job.",
    originalLabel: "You wrote",
    correctionLabel: "Better",
    continueBtn: "Continue",
    alreadyDoneMsg: "You've already completed this step.",
    writeAgainBtn: "Write a new one",
  },
  es: {
    heading: "Preséntate",
    instructions:
      "Escribe un párrafo breve para presentarte — tu nombre, de dónde eres, por qué estás aprendiendo, tus pasatiempos. Hasta 100 palabras.",
    placeholder: "Escribe tu presentación aquí...",
    wordsLabel: "palabras",
    tooLong: "Por favor acorta tu párrafo a 100 palabras o menos.",
    submitBtn: "Enviar",
    grading: "Revisando…",
    mistakesHeading: "Cosas para corregir",
    noMistakesHeading: "¡No se encontraron errores! Buen trabajo.",
    originalLabel: "Escribiste",
    correctionLabel: "Mejor",
    continueBtn: "Continuar",
    alreadyDoneMsg: "Ya completaste este paso.",
    writeAgainBtn: "Escribir uno nuevo",
  },
  fr: {
    heading: "Présente-toi",
    instructions:
      "Écris un court paragraphe pour te présenter — ton nom, d'où tu viens, pourquoi tu apprends, tes loisirs. Jusqu'à 100 mots.",
    placeholder: "Écris ta présentation ici...",
    wordsLabel: "mots",
    tooLong: "Merci de raccourcir ton paragraphe à 100 mots maximum.",
    submitBtn: "Envoyer",
    grading: "Vérification en cours…",
    mistakesHeading: "À corriger",
    noMistakesHeading: "Aucune erreur trouvée ! Bravo.",
    originalLabel: "Tu as écrit",
    correctionLabel: "Mieux",
    continueBtn: "Continuer",
    alreadyDoneMsg: "Tu as déjà terminé cette étape.",
    writeAgainBtn: "En écrire un nouveau",
  },
  de: {
    heading: "Stell dich vor",
    instructions:
      "Schreib einen kurzen Absatz, um dich vorzustellen — deinen Namen, woher du kommst, warum du lernst, deine Hobbys. Bis zu 100 Wörter.",
    placeholder: "Schreib deine Vorstellung hier...",
    wordsLabel: "Wörter",
    tooLong: "Bitte kürze deinen Absatz auf 100 Wörter oder weniger.",
    submitBtn: "Absenden",
    grading: "Wird überprüft…",
    mistakesHeading: "Zu korrigieren",
    noMistakesHeading: "Keine Fehler gefunden! Gut gemacht.",
    originalLabel: "Du hast geschrieben",
    correctionLabel: "Besser",
    continueBtn: "Weiter",
    alreadyDoneMsg: "Du hast diesen Schritt bereits abgeschlossen.",
    writeAgainBtn: "Neu schreiben",
  },
  ar: {
    heading: "عرّف بنفسك",
    instructions:
      "اكتب فقرة قصيرة تعرّف فيها بنفسك — اسمك، من أين أنت، لماذا تتعلم، هواياتك. بحد أقصى 100 كلمة.",
    placeholder: "اكتب تعريفك هنا...",
    wordsLabel: "كلمة",
    tooLong: "الرجاء اختصار فقرتك إلى 100 كلمة أو أقل.",
    submitBtn: "إرسال",
    grading: "جارٍ المراجعة…",
    mistakesHeading: "أشياء يجب تصحيحها",
    noMistakesHeading: "لم يتم العثور على أخطاء! عمل رائع.",
    originalLabel: "لقد كتبت",
    correctionLabel: "الأصح",
    continueBtn: "متابعة",
    alreadyDoneMsg: "لقد أكملت هذه الخطوة بالفعل.",
    writeAgainBtn: "اكتب فقرة جديدة",
  },
  zh: {
    heading: "自我介绍",
    instructions:
      "写一段简短的自我介绍——你的名字、你来自哪里、你为什么学习、你的爱好。最多100字。",
    placeholder: "在这里写下你的自我介绍...",
    wordsLabel: "字",
    tooLong: "请将段落缩短到100字以内。",
    submitBtn: "提交",
    grading: "正在检查…",
    mistakesHeading: "需要修改的地方",
    noMistakesHeading: "没有发现错误！做得很好。",
    originalLabel: "你写的是",
    correctionLabel: "更好的说法",
    continueBtn: "继续",
    alreadyDoneMsg: "你已经完成了这一步。",
    writeAgainBtn: "重新写一篇",
  },
  pt: {
    heading: "Apresente-se",
    instructions:
      "Escreva um parágrafo curto se apresentando — seu nome, de onde você é, por que está aprendendo, seus hobbies. Até 100 palavras.",
    placeholder: "Escreva sua apresentação aqui...",
    wordsLabel: "palavras",
    tooLong: "Por favor, reduza seu parágrafo para 100 palavras ou menos.",
    submitBtn: "Enviar",
    grading: "Revisando…",
    mistakesHeading: "Pontos a corrigir",
    noMistakesHeading: "Nenhum erro encontrado! Muito bem.",
    originalLabel: "Você escreveu",
    correctionLabel: "Melhor",
    continueBtn: "Continuar",
    alreadyDoneMsg: "Você já concluiu esta etapa.",
    writeAgainBtn: "Escrever uma nova",
  },
  ja: {
    heading: "自己紹介をしよう",
    instructions:
      "名前、出身地、学んでいる理由、趣味など、自己紹介の短い段落を書いてください。100語まで。",
    placeholder: "ここに自己紹介を書いてください...",
    wordsLabel: "語",
    tooLong: "段落を100語以内に短くしてください。",
    submitBtn: "送信",
    grading: "確認中…",
    mistakesHeading: "修正すべき点",
    noMistakesHeading: "間違いは見つかりませんでした！よくできました。",
    originalLabel: "あなたが書いた文",
    correctionLabel: "より良い表現",
    continueBtn: "続ける",
    alreadyDoneMsg: "このステップはすでに完了しています。",
    writeAgainBtn: "新しく書く",
  },
};
