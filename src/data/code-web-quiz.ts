export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
}

export interface QuizQuestionWithAnswer extends QuizQuestion {
  correctOptionIndex: number; // 0-based index
  correctAnswerText: string;
}

export const CODE_WEB_QUIZ_QUESTIONS: QuizQuestionWithAnswer[] = [
  {
    id: 1,
    question: 'What will be the output of this code?\nint x = 5;\nprintf("%d", x++);',
    options: ['5', '6', '4', 'Error'],
    correctOptionIndex: 0,
    correctAnswerText: '5',
  },
  {
    id: 2,
    question: 'What will be the output?\nint a = 10;\nint b = 3;\nprintf("%d", a % b);',
    options: ['3.33', '0', '1', '3'],
    correctOptionIndex: 2,
    correctAnswerText: '1',
  },
  {
    id: 3,
    question: 'Which condition checks whether x lies between 1 and 10, inclusive?',
    options: [
      'x >= 1 || x <= 10',
      'x > 1 && x > 10',
      'x == 1 && x == 10',
      'x >= 1 && x <= 10',
    ],
    correctOptionIndex: 3,
    correctAnswerText: 'x >= 1 && x <= 10',
  },
  {
    id: 4,
    question: 'How many times will this loop execute?\nfor(int i = 1; i <= 5; i++)',
    options: ['4', '5', '6', 'Infinite times'],
    correctOptionIndex: 1,
    correctAnswerText: '5',
  },
  {
    id: 5,
    question: 'What is the output?\nint x = 2;\nif(x > 3) printf("A");\nelse printf("B");',
    options: ['A', 'AB', 'No output', 'B'],
    correctOptionIndex: 3,
    correctAnswerText: 'B',
  },
  {
    id: 6,
    question: 'Which of the following correctly declares an integer array of size 5 in C?',
    options: ['int arr(5);', 'int arr[5];', 'array int[5];', 'int[5] arr;'],
    correctOptionIndex: 1,
    correctAnswerText: 'int arr[5];',
  },
  {
    id: 7,
    question: 'What is the output?\nint x = 3;\nprintf("%d", x * x);',
    options: ['6', '33', '9', '3'],
    correctOptionIndex: 2,
    correctAnswerText: '9',
  },
  {
    id: 8,
    question: 'What is the main purpose of a function in programming?',
    options: [
      'To store only images',
      'To replace all variables',
      'To reuse a block of code',
      'To increase screen brightness',
    ],
    correctOptionIndex: 2,
    correctAnswerText: 'To reuse a block of code',
  },
  {
    id: 9,
    question:
      'Which change fixes the error if a loop should print numbers 1 to 5 but currently prints 1 to 4?\nfor(int i = 1; i < 5; i++)',
    options: [
      'Change i++ to i--',
      'Remove the loop condition',
      'Change i = 1 to i = 0',
      'Change i < 5 to i <= 5',
    ],
    correctOptionIndex: 3,
    correctAnswerText: 'Change i < 5 to i <= 5',
  },
  {
    id: 10,
    question: 'What is the output?\nint a = 4;\nint b = 2;\nprintf("%d", a / b + 3);',
    options: ['7', '5', '3', '4'],
    correctOptionIndex: 1,
    correctAnswerText: '5',
  },
  {
    id: 11,
    question: 'Which data structure follows the LIFO principle?',
    options: ['Queue', 'Array', 'Stack', 'Linked list'],
    correctOptionIndex: 2,
    correctAnswerText: 'Stack',
  },
  {
    id: 12,
    question: 'What does the expression !(5 > 2) evaluate to?',
    options: ['True', 'False', 'Error', '5'],
    correctOptionIndex: 1,
    correctAnswerText: 'False',
  },
  {
    id: 13,
    question: 'Which HTML tag is used to create a clickable link to another webpage?',
    options: ['<link>', '<href>', '<a>', '<url>'],
    correctOptionIndex: 2,
    correctAnswerText: '<a>',
  },
  {
    id: 14,
    question: 'What is the main difference between HTML and CSS?',
    options: [
      'HTML styles content; CSS stores data',
      'CSS creates databases; HTML runs servers',
      'Both do exactly the same thing',
      'HTML structures content; CSS styles it',
    ],
    correctOptionIndex: 3,
    correctAnswerText: 'HTML structures content; CSS styles it',
  },
  {
    id: 15,
    question: 'Which CSS property changes the text color?',
    options: ['font-style', 'color', 'text-align', 'background-color'],
    correctOptionIndex: 1,
    correctAnswerText: 'color',
  },
  {
    id: 16,
    question: 'Which HTML attribute specifies the destination of a hyperlink?',
    options: ['src', 'alt', 'href', 'class'],
    correctOptionIndex: 2,
    correctAnswerText: 'href',
  },
  {
    id: 17,
    question: 'What does the CSS selector .card target?',
    options: [
      'All elements with class="card"',
      'The element with id="card"',
      'All <card> tags',
      'All elements named card',
    ],
    correctOptionIndex: 0,
    correctAnswerText: 'All elements with class="card"',
  },
  {
    id: 18,
    question: 'Which HTML element is commonly used to display an image?',
    options: ['<picture-src>', '<src>', '<image>', '<img>'],
    correctOptionIndex: 3,
    correctAnswerText: '<img>',
  },
  {
    id: 19,
    question: "What is the full form of SPARK in our society's name?",
    options: [
      "Society for Programming, Automation, Research and Knowledge",
      "Society for Programming, Algorithms, Research and Knowledge",
      "Society for Software, Automation, Robotics and Knowledge",
      "Society for Programming, Automation, Resources and Knowledge",
    ],
    correctOptionIndex: 0,
    correctAnswerText: 'Society for Programming, Automation, Research and Knowledge',
  },
  {
    id: 20,
    question:
      'A webpage looks correct on a laptop but overflows on a mobile screen. Which approach is most appropriate?',
    options: [
      'Increase every font size',
      'Remove all CSS',
      'Use responsive CSS with media queries',
      'Convert the webpage into a PDF',
    ],
    correctOptionIndex: 2,
    correctAnswerText: 'Use responsive CSS with media queries',
  },
];

// Strip answers for sending to candidate client
export const PUBLIC_QUIZ_QUESTIONS: QuizQuestion[] = CODE_WEB_QUIZ_QUESTIONS.map(
  ({ id, question, options }) => ({
    id,
    question,
    options,
  })
);
