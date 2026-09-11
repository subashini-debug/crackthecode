/**
 * Challenge generation for Crack the Code.
 * Each set contains 30 Round-1 MCQs, 15 Round-2 coding challenges,
 * 10 Round-3 power challenges, and 5 decoding stages in Round 4.
 */
const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You generate content for a live high-school technology event called "Crack the Code".
Return STRICT JSON ONLY. Never include markdown or commentary.

Required shape:
{
  "round1": [30 items],
  "round2": [15 items],
  "round3PowerChallenges": [10 items],
  "round4": {
    "stage1": {"instructions": "...", "cipherText": "...", "answer": "..."},
    "stage2": {"instructions": "...", "cipherText": "...", "answer": "..."},
    "stage3": {"instructions": "...", "cipherText": "...", "answer": "..."},
    "stage4": {"instructions": "...", "cipherText": "...", "answer": "..."},
    "stage5": {"instructions": "...", "cipherText": "...", "answer": "..."},
    "finalCode": "4 digit string",
    "finalInstructions": "..."
  }
}

Round 1: exactly 30 medium-difficulty AI/ML/computer-science MCQs. Each item:
{"id":"r1q1","question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"correct":"A","points":10}
Cover AI vs ML, supervised/unsupervised learning, classification, regression, datasets, overfitting, evaluation, computer vision, NLP, generative AI, neural-network basics, data leakage, inference, recommendations, and responsible use. No advanced math.

Round 2: exactly 15 Python code-completion/debugging challenges. Each:
{"id":"r2q1","title":"...","prompt":"...","codeTemplate":"...","acceptedAnswers":["..."],"expectedOutput":"... or null","points":20}
Mix conditions, comparisons, loops, strings, lists, dictionaries, debugging, and small solutions. Accepted answers must match what a simple exact/contains checker can recognize.

Round 3: exactly 10 short facilitator power challenges. Each:
{"id":"p1","prompt":"...","answer":"..."}
Keep them answerable in about 30 seconds.

Round 4: exactly 5 independent decoding stages plus a final 4-digit code. Use different methods across A1Z26, Caesar, binary ASCII, Morse, hexadecimal ASCII, or similarly clear school-level ciphers. Every stage must have a correct answer and the ciphertext must actually decode to it. Do not reveal answers or finalCode in participant-visible instructions. finalInstructions may explain how stage answers are combined, but must not reveal finalCode.

Make every set distinct: different questions/scenarios/code/ciphertext/final code. Return one set only.`;

async function callGemini(apiKey, userPrompt) {
  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: { temperature: 0.9, responseMimeType: 'application/json' }
    })
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  return JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim());
}

function validateChallengeSet(set) {
  if (!set || !Array.isArray(set.round1) || set.round1.length !== 30 ||
      !Array.isArray(set.round2) || set.round2.length !== 15 ||
      !Array.isArray(set.round3PowerChallenges) || set.round3PowerChallenges.length !== 10 ||
      !set.round4 || !set.round4.stage1 || !set.round4.stage2 || !set.round4.stage3 ||
      !set.round4.stage4 || !set.round4.stage5 || !set.round4.finalCode) {
    throw new Error('Generated challenge set has an invalid question/stage count or shape');
  }
  set.round1.forEach((q, i) => {
    if (!q.question || !q.options || !['A','B','C','D'].includes(String(q.correct).toUpperCase())) {
      throw new Error(`Invalid Round 1 question ${i + 1}`);
    }
    q.id = `r1q${i + 1}`; q.points = Number(q.points) || 10;
  });
  set.round2.forEach((q, i) => {
    if (!q.title || !q.codeTemplate || !Array.isArray(q.acceptedAnswers)) {
      throw new Error(`Invalid Round 2 challenge ${i + 1}`);
    }
    q.id = `r2q${i + 1}`; q.points = Number(q.points) || 20;
  });
  set.round3PowerChallenges.forEach((q, i) => {
    if (!q.prompt || q.answer === undefined) throw new Error(`Invalid Round 3 challenge ${i + 1}`);
    q.id = `p${i + 1}`;
  });
  for (let i = 1; i <= 5; i++) {
    const stage = set.round4[`stage${i}`];
    if (!stage.instructions || !stage.cipherText || stage.answer === undefined) {
      throw new Error(`Invalid Round 4 stage ${i}`);
    }
  }
  if (!/^\d{4}$/.test(String(set.round4.finalCode))) throw new Error('Round 4 finalCode must be four digits');
  if (String(set.round4.finalInstructions || '').includes(String(set.round4.finalCode))) throw new Error('Round 4 finalInstructions must not reveal finalCode');
  return set;
}

async function generateChallengeSets(apiKey, count = 5) {
  const sets = [];
  for (let i = 0; i < count; i++) {
    const parsed = await callGemini(apiKey,
      `Generate challenge SET #${i + 1} of ${count}. Make it meaningfully distinct from the other sets and validate every cipher yourself.`);
    sets.push({
      id: `set-${i + 1}`,
      label: `Set ${i + 1}`,
      source: 'gemini',
      ...validateChallengeSet(parsed)
    });
  }
  return sets;
}

function fallbackSets(count = 5) {
  const words = ['PLAN', 'DATA', 'CODE', 'BYTE', 'LOGIC'];
  const finalCodes = ['4486', '7432', '2699', '9353', '5627'];
  const phrases = ['THE FIRST DIGIT IS 4', 'THE FIRST DIGIT IS 7', 'THE FIRST DIGIT IS 2', 'THE FIRST DIGIT IS 9', 'THE FIRST DIGIT IS 5'];
  const caesars = ['WKH ILUVW GLJLW LV 4', 'WKH ILUVW GLJLW LV 7', 'WKH ILUVW GLJLW LV 2', 'WKH ILUVW GLJLW LV 9', 'WKH ILUVW GLJLW LV 5'];
  const binaries = [
    ['01010011 01000101 01000011 01001111 01001110 01000100 00100000 01000100 01001001 01000111 01001001 01010100 00100000 01001001 01010011 00100000 00110100','SECOND DIGIT IS 4'],
    ['01010011 01000101 01000011 01001111 01001110 01000100 00100000 01000100 01001001 01000111 01001001 01010100 00100000 01001001 01010011 00100000 00110100','SECOND DIGIT IS 4'],
    ['01010011 01000101 01000011 01001111 01001110 01000100 00100000 01000100 01001001 01000111 01001001 01010100 00100000 01001001 01010011 00100000 00111001','SECOND DIGIT IS 9'],
    ['01010011 01000101 01000011 01001111 01001110 01000100 00100000 01000100 01001001 01000111 01001001 01010100 00100000 01001001 01010011 00100000 00110011','SECOND DIGIT IS 3'],
    ['01010011 01000101 01000011 01001111 01001110 01000100 00100000 01000100 01001001 01000111 01001001 01010100 00100000 01001001 01010011 00100000 00110110','SECOND DIGIT IS 6']
  ];
  const morse = [['- .... .. .-. -..  -.. .. --. .. -  .. ...  8','THIRD DIGIT IS 8'],['- .... .. .-. -..  -.. .. --. .. -  .. ...  3','THIRD DIGIT IS 3'],['- .... .. .-. -..  -.. .. --. .. -  .. ...  6','THIRD DIGIT IS 6'],['- .... .. .-. -..  -.. .. --. .. -  .. ...  5','THIRD DIGIT IS 5'],['- .... .. .-. -..  -.. .. --. .. -  .. ...  2','THIRD DIGIT IS 2']];
  const hex = [['46 4f 55 52 54 48 20 44 49 47 49 54 20 49 53 20 36','FOURTH DIGIT IS 6'],['46 4f 55 52 54 48 20 44 49 47 49 54 20 49 53 20 32','FOURTH DIGIT IS 2'],['46 4f 55 52 54 48 20 44 49 47 49 54 20 49 53 20 39','FOURTH DIGIT IS 9'],['46 4f 55 52 54 48 20 44 49 47 49 54 20 49 53 20 33','FOURTH DIGIT IS 3'],['46 4f 55 52 54 48 20 44 49 47 49 54 20 49 53 20 37','FOURTH DIGIT IS 7']];
  const out=[];
  for(let i=0;i<count;i++){
    const k=i%5;
    const round1 = FALLBACK_R1.map((q,j)=>({...q,id:`r1q${j+1}`}));
    const round2 = FALLBACK_R2.map((q,j)=>({...q,id:`r2q${j+1}`}));
    const round3 = FALLBACK_R3.map((q,j)=>({...q,id:`p${j+1}`}));
    const r4={
      stage1:{instructions:'Decode using A=1, B=2, C=3 ... Z=26.',cipherText:words[k].split('').map(c=>c.charCodeAt(0)-64).join('-'),answer:words[k]},
      stage2:{instructions:'Each letter was shifted 3 places forward. Shift letters back by 3 to decode.',cipherText:caesars[k],answer:phrases[k]},
      stage3:{instructions:'Convert each 8-bit binary group to its ASCII character.',cipherText:binaries[k][0],answer:binaries[k][1]},
      stage4:{instructions:'Decode the Morse code. Letters are separated by spaces.',cipherText:morse[k][0],answer:morse[k][1]},
      stage5:{instructions:'Convert each hexadecimal ASCII byte to its character.',cipherText:hex[k][0],answer:hex[k][1]},
      finalCode:finalCodes[k],
      finalInstructions:'Stage 2 reveals digit 1, Stage 3 reveals digit 2, Stage 4 reveals digit 3, and Stage 5 reveals digit 4. Concatenate those four digits in order to unlock the vault.'
    };
    out.push({id:`set-${i+1}`,label:`Set ${i+1} (offline fallback)`,source:'fallback',round1,round2,round3PowerChallenges:round3,round4:r4});
  }
  return out;
}

// Stable offline bank. Keeping it in code guarantees the event still works if Gemini
// is unavailable or no API key is configured.
const FALLBACK_R1 = [
  {
    "id": "r1q1",
    "question": "A photo app learns from images labeled cat or dog and predicts the label for a new photo. Which learning type is used?",
    "options": {
      "A": "Unsupervised learning",
      "B": "Supervised learning",
      "C": "Reinforcement learning",
      "D": "Random search"
    },
    "correct": "B",
    "points": 10
  },
  {
    "id": "r1q2",
    "question": "Which task is a classification problem?",
    "options": {
      "A": "Predicting a house price",
      "B": "Predicting tomorrow's temperature",
      "C": "Predicting whether a message is spam",
      "D": "Predicting a student's exact height"
    },
    "correct": "C",
    "points": 10
  },
  {
    "id": "r1q3",
    "question": "Which task is a regression problem?",
    "options": {
      "A": "Predicting whether a transaction is fraud",
      "B": "Grouping customers by similarity",
      "C": "Predicting a car's resale price",
      "D": "Recognizing a handwritten digit"
    },
    "correct": "C",
    "points": 10
  },
  {
    "id": "r1q4",
    "question": "A model is excellent on its training examples but performs poorly on new examples. What is the likely issue?",
    "options": {
      "A": "Overfitting",
      "B": "Underfitting",
      "C": "Tokenization",
      "D": "Clustering"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q5",
    "question": "Why do we keep a test set separate from training data?",
    "options": {
      "A": "To make the dataset smaller",
      "B": "To evaluate performance on unseen data",
      "C": "To remove all noise",
      "D": "To increase the number of labels"
    },
    "correct": "B",
    "points": 10
  },
  {
    "id": "r1q6",
    "question": "Which is an example of unsupervised learning?",
    "options": {
      "A": "Predicting exam scores from labeled records",
      "B": "Detecting spam using labeled emails",
      "C": "Grouping songs by listening patterns without labels",
      "D": "Predicting a labeled image category"
    },
    "correct": "C",
    "points": 10
  },
  {
    "id": "r1q7",
    "question": "Which field focuses on enabling computers to work with human language?",
    "options": {
      "A": "NLP",
      "B": "CAD",
      "C": "GPS",
      "D": "BIOS"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q8",
    "question": "Which is primarily a computer-vision task?",
    "options": {
      "A": "Summarizing an article",
      "B": "Detecting objects in a photograph",
      "C": "Sorting numbers",
      "D": "Compiling Python code"
    },
    "correct": "B",
    "points": 10
  },
  {
    "id": "r1q9",
    "question": "In a neural network, weights mainly control what?",
    "options": {
      "A": "Connections' influence on the calculation",
      "B": "The monitor brightness",
      "C": "The file size",
      "D": "The internet speed"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q10",
    "question": "What is the main purpose of a loss function during model training?",
    "options": {
      "A": "Measure how wrong a prediction is",
      "B": "Store images",
      "C": "Increase screen resolution",
      "D": "Choose a programming language"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q11",
    "question": "A classifier predicts 'not spam' for an email that really is spam. This is a...",
    "options": {
      "A": "False positive",
      "B": "False negative",
      "C": "True positive",
      "D": "True negative"
    },
    "correct": "B",
    "points": 10
  },
  {
    "id": "r1q12",
    "question": "A classifier predicts 'spam' for an email that really is not spam. This is a...",
    "options": {
      "A": "False positive",
      "B": "False negative",
      "C": "True positive",
      "D": "True negative"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q13",
    "question": "What is a feature in a machine-learning dataset?",
    "options": {
      "A": "An input variable used by the model",
      "B": "Only the final prediction",
      "C": "The computer's brand",
      "D": "A test score that must be 100"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q14",
    "question": "What is a label in supervised learning?",
    "options": {
      "A": "The known target/output for an example",
      "B": "The GPU model",
      "C": "A random password",
      "D": "The training duration"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q15",
    "question": "Why can a very small training dataset be a problem?",
    "options": {
      "A": "It may not represent enough variation",
      "B": "It always prevents overfitting",
      "C": "It makes every model perfect",
      "D": "It removes the need for testing"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q16",
    "question": "What does generative AI primarily do?",
    "options": {
      "A": "Only sort existing files",
      "B": "Generate new content such as text or images",
      "C": "Only measure CPU temperature",
      "D": "Only label spreadsheets"
    },
    "correct": "B",
    "points": 10
  },
  {
    "id": "r1q17",
    "question": "What is tokenization in NLP?",
    "options": {
      "A": "Breaking text into smaller units such as words or subwords",
      "B": "Encrypting a hard drive",
      "C": "Compressing a video",
      "D": "Converting a monitor to touch input"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q18",
    "question": "Which method is commonly used to reduce overfitting?",
    "options": {
      "A": "Using validation data and regularization",
      "B": "Memorizing the test set",
      "C": "Removing all test examples",
      "D": "Always increasing model complexity"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q19",
    "question": "A model has high training error and high test error. This most strongly suggests...",
    "options": {
      "A": "Underfitting",
      "B": "Perfect generalization",
      "C": "Data leakage",
      "D": "Overfitting only"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q20",
    "question": "What is data leakage?",
    "options": {
      "A": "Training information accidentally contains information that should only be available later",
      "B": "A slow keyboard",
      "C": "A missing monitor cable",
      "D": "A type of clustering"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q21",
    "question": "Which example best represents reinforcement learning?",
    "options": {
      "A": "An agent learns actions using rewards and penalties",
      "B": "A model groups unlabeled photos",
      "C": "A classifier learns from labeled emails",
      "D": "A calculator adds numbers"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q22",
    "question": "What does an epoch usually mean in model training?",
    "options": {
      "A": "One complete pass through the training dataset",
      "B": "One CPU instruction",
      "C": "One test question",
      "D": "One network cable"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q23",
    "question": "If accuracy is 95%, what does that generally mean?",
    "options": {
      "A": "95% of evaluated predictions were correct",
      "B": "The model has 95 layers",
      "C": "The training set has 95 rows",
      "D": "The model uses 95 features exactly"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q24",
    "question": "Why should training and test examples be representative of the same problem?",
    "options": {
      "A": "So test performance reflects real-world generalization",
      "B": "So the model can see the answers early",
      "C": "So no labels are needed",
      "D": "So the model never needs validation"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q25",
    "question": "Which is an example of a feature for predicting house prices?",
    "options": {
      "A": "Number of bedrooms",
      "B": "The model's final score",
      "C": "The future selling price itself",
      "D": "The test-set accuracy"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q26",
    "question": "A chatbot converts English sentences into another language. Which area is most directly involved?",
    "options": {
      "A": "NLP",
      "B": "Computer vision",
      "C": "Robotics hardware only",
      "D": "Database indexing only"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q27",
    "question": "What happens during inference?",
    "options": {
      "A": "A trained model is used to make predictions on input data",
      "B": "The training dataset is always deleted",
      "C": "The model is automatically retrained from scratch",
      "D": "The CPU is replaced"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q28",
    "question": "Which statement about training and testing is best?",
    "options": {
      "A": "A test set should influence model fitting",
      "B": "A test set should be kept unseen during model development",
      "C": "Testing replaces training",
      "D": "Training data can never have labels"
    },
    "correct": "B",
    "points": 10
  },
  {
    "id": "r1q29",
    "question": "Why might two models with similar accuracy still have different usefulness?",
    "options": {
      "A": "Their errors may affect different classes or situations",
      "B": "Accuracy is always meaningless",
      "C": "One model must be random",
      "D": "Models cannot make errors"
    },
    "correct": "A",
    "points": 10
  },
  {
    "id": "r1q30",
    "question": "Which scenario most clearly uses a recommendation system?",
    "options": {
      "A": "Suggesting movies based on viewing behavior",
      "B": "Converting decimal to binary",
      "C": "Measuring screen size",
      "D": "Compiling source code"
    },
    "correct": "A",
    "points": 10
  }
];
const FALLBACK_R2 = [
  {
    "id": "r2q1",
    "title": "Even or Odd",
    "prompt": "Complete the condition so the program prints Even for an even integer.",
    "codeTemplate": "n = int(input())\nif ____:\n    print(\"Even\")\nelse:\n    print(\"Odd\")",
    "acceptedAnswers": [
      "n % 2 == 0",
      "n%2==0"
    ],
    "expectedOutput": null,
    "points": 20
  },
  {
    "id": "r2q2",
    "title": "Largest of Two",
    "prompt": "Complete both blanks so the larger input is printed.",
    "codeTemplate": "a = int(input())\nb = int(input())\nif a > b:\n    print(____)\nelse:\n    print(____)",
    "acceptedAnswers": [
      "a\nb",
      "a\nb",
      "a, b"
    ],
    "expectedOutput": null,
    "points": 20
  },
  {
    "id": "r2q3",
    "title": "Print 1 to 5",
    "prompt": "Complete range so the output is 1, 2, 3, 4, 5 on separate lines.",
    "codeTemplate": "for i in range(____):\n    print(i)",
    "acceptedAnswers": [
      "1, 6",
      "1,6"
    ],
    "expectedOutput": "1 2 3 4 5",
    "points": 20
  },
  {
    "id": "r2q4",
    "title": "Sum a List",
    "prompt": "Fix the update line so the sum becomes 100.",
    "codeTemplate": "numbers = [10, 20, 30, 40]\ntotal = 0\nfor i in numbers:\n    ____\nprint(total)",
    "acceptedAnswers": [
      "total = total + i",
      "total=total+i",
      "total += i"
    ],
    "expectedOutput": "100",
    "points": 20
  },
  {
    "id": "r2q5",
    "title": "Count Positives",
    "prompt": "Fill the blank to count positive values.",
    "codeTemplate": "numbers = [-2, 5, 0, 7, -1, 4]\ncount = 0\nfor n in numbers:\n    if n > 0:\n        ____\nprint(count)",
    "acceptedAnswers": [
      "count += 1",
      "count=count+1"
    ],
    "expectedOutput": "3",
    "points": 20
  },
  {
    "id": "r2q6",
    "title": "String Length",
    "prompt": "Complete the expression to print the number of characters in name.",
    "codeTemplate": "name = input()\nprint(____)",
    "acceptedAnswers": [
      "len(name)"
    ],
    "expectedOutput": null,
    "points": 20
  },
  {
    "id": "r2q7",
    "title": "Divisible by 3",
    "prompt": "Complete the condition.",
    "codeTemplate": "n = int(input())\nif ____:\n    print(\"Yes\")\nelse:\n    print(\"No\")",
    "acceptedAnswers": [
      "n % 3 == 0",
      "n%3==0"
    ],
    "expectedOutput": null,
    "points": 20
  },
  {
    "id": "r2q8",
    "title": "List Maximum",
    "prompt": "Complete the expression to print the largest value.",
    "codeTemplate": "values = [12, 4, 19, 7]\nprint(____)",
    "acceptedAnswers": [
      "max(values)"
    ],
    "expectedOutput": "19",
    "points": 20
  },
  {
    "id": "r2q9",
    "title": "Reverse a String",
    "prompt": "Complete the slice to reverse text.",
    "codeTemplate": "text = input()\nprint(____)",
    "acceptedAnswers": [
      "text[::-1]"
    ],
    "expectedOutput": null,
    "points": 20
  },
  {
    "id": "r2q10",
    "title": "Count Vowels",
    "prompt": "Fix the condition so each vowel increases count.",
    "codeTemplate": "text = \"education\"\ncount = 0\nfor ch in text:\n    if ch in \"aeiou\":\n        ____\nprint(count)",
    "acceptedAnswers": [
      "count += 1",
      "count=count+1"
    ],
    "expectedOutput": "5",
    "points": 20
  },
  {
    "id": "r2q11",
    "title": "Multiplication Table",
    "prompt": "Complete the range so 5 through 50 are printed in steps of 5.",
    "codeTemplate": "for i in range(5, ____, 5):\n    print(i)",
    "acceptedAnswers": [
      "51",
      "51)"
    ],
    "expectedOutput": "5 10 15 20 25 30 35 40 45 50",
    "points": 20
  },
  {
    "id": "r2q12",
    "title": "Debug Comparison",
    "prompt": "Fix the comparison so the message is printed when score is at least 50.",
    "codeTemplate": "score = 72\nif ____:\n    print(\"Pass\")",
    "acceptedAnswers": [
      "score >= 50",
      "score>=50"
    ],
    "expectedOutput": "Pass",
    "points": 20
  },
  {
    "id": "r2q13",
    "title": "Dictionary Lookup",
    "prompt": "Complete the key expression to print the value for name Alice.",
    "codeTemplate": "marks = {\"Alice\": 92, \"Bob\": 81}\nprint(marks[____])",
    "acceptedAnswers": [
      "\"Alice\"",
      "'Alice'"
    ],
    "expectedOutput": "92",
    "points": 20
  },
  {
    "id": "r2q14",
    "title": "Write a Small Solution",
    "prompt": "Write code that counts how many numbers in [3, 8, 12, 5, 20, 7] are greater than 10.",
    "codeTemplate": "numbers = [3, 8, 12, 5, 20, 7]\n# write your solution here",
    "acceptedAnswers": [
      "count = 0\nfor n in numbers:\n    if n > 10:\n        count += 1\nprint(count)",
      "print(sum(1 for n in numbers if n > 10))"
    ],
    "expectedOutput": "2",
    "points": 20
  }
,
  {
    "id": "r2q15",
    "title": "Find the Minimum",
    "prompt": "Complete the expression to print the smallest value.",
    "codeTemplate": "values = [14, 6, 21, 9]\nprint(____)",
    "acceptedAnswers": [
      "min(values)"
    ],
    "expectedOutput": "6",
    "points": 20
  }
];
const FALLBACK_R3 = [
  {
    "id": "p1",
    "prompt": "Name one supervised-learning example.",
    "answer": "spam classification"
  },
  {
    "id": "p2",
    "prompt": "What does GPU stand for?",
    "answer": "graphics processing unit"
  },
  {
    "id": "p3",
    "prompt": "What symbol starts a Python comment?",
    "answer": "#"
  },
  {
    "id": "p4",
    "prompt": "What does NLP stand for?",
    "answer": "natural language processing"
  },
  {
    "id": "p5",
    "prompt": "True or False: overfitting usually means strong training performance but weaker performance on unseen data.",
    "answer": "false"
  },
  {
    "id": "p6",
    "prompt": "What is 2 ** 5 in Python?",
    "answer": "32"
  },
  {
    "id": "p7",
    "prompt": "What data structure uses key-value pairs in Python?",
    "answer": "dictionary"
  },
  {
    "id": "p8",
    "prompt": "What does CPU stand for?",
    "answer": "central processing unit"
  },
  {
    "id": "p9",
    "prompt": "What is the output type of a Python condition such as 5 > 2?",
    "answer": "boolean"
  },
  {
    "id": "p10",
    "prompt": "Name the AI field that deals mainly with images and video.",
    "answer": "computer vision"
  }
];

module.exports = { generateChallengeSets, fallbackSets, validateChallengeSet };
