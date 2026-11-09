/**
 * Culture notes [S.24–26], keyed by lesson id. From curriculum.md's "Culture" column.
 * Every note is a draft (`draft: true`) until the team has reviewed it. Lessons without an entry skip the step.
 */

export type CultureNote = {
  title: string;
  body: string;
  /** one quiz question [S.25]: 4 choices, `answer` is the index of the correct one */
  question: { prompt: string; choices: string[]; answer: number };
  /** not reviewed yet; flip to `false` (widen the type) once a reviewer signs off */
  draft: true;
};

export const CULTURE_NOTES: Record<string, CultureNote> = {
  "1.1": {
    title: "Getting someone's attention",
    body:
      "To get a Deaf person's attention, wave your hand where they can see it. " +
      "If you are close by, a light tap on the shoulder or upper arm is common and polite. " +
      "To get the attention of a whole room, someone may flick the lights on and off. " +
      "Tapping on a table or stomping lightly on the floor also works, because people can feel the vibration. " +
      "Shouting or clapping behind someone doesn't help, and grabbing them or waving right in their face is rude.",
    question: {
      prompt: "A Deaf friend is sitting next to you, looking the other way. What do you do?",
      choices: ["Tap their shoulder lightly", "Call their name loudly", "Clap behind them", "Whistle loudly"],
      answer: 0,
    },
    draft: true,
  },
  "1.2": {
    title: "Name signs",
    body:
      "A name sign is a sign that stands for a person, so their name doesn't have to be fingerspelled every time. " +
      "Name signs are given by members of the Deaf community, often Deaf friends or family. People don't pick their own. " +
      "Many name signs use the first letter of the person's name with a movement or location. " +
      "Others describe something about the person. " +
      "ASL learners usually fingerspell their name until a Deaf person gives them a name sign.",
    question: {
      prompt: "Who usually gives a person their name sign?",
      choices: ["A member of the Deaf community", "The person picks their own", "Their ASL textbook", "Anyone who learns their name"],
      answer: 0,
    },
    draft: true,
  },
  "1.4": {
    title: "Andrew Foster",
    body:
      "Andrew Foster (1925–1987) was a Deaf African American educator. " +
      "He lost his hearing at age 11 and in 1954 became the first African American to graduate from Gallaudet University. " +
      "In 1956 he founded the Christian Mission for Deaf Africans, and in 1957 he opened a school for Deaf children in Accra, Ghana. " +
      "Over the next 30 years he helped found more than 30 schools for Deaf children in 13 African countries. " +
      "He is often called the father of Deaf education in Africa.",
    question: {
      prompt: "Where did Andrew Foster found schools for Deaf children?",
      choices: ["Africa", "South America", "Europe", "East Asia"],
      answer: 0,
    },
    draft: true,
  },
};
