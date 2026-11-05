# Recognition: what can be judged

`isRecognizable(item)` is the source of truth. Call it at runtime instead of copying the lists below, because
they change whenever the model is retrained. This file explains what it returns today and what will change.

Status as of 2026-11-05 (sign model `unit12_hands`, 100 classes; handshape model from `ml/handshape/train_hs.py`).

## Recognizable now

| Curriculum | Items |
| --- | --- |
| Unit 1–2 signs | All of them except **ASL** (1.1, 1.4, 2.1, 2.3) |
| Unit 3–5 signs that happen to be in the model | DOG (3.1), TWINS (4.1), THEY, MY, YOUR (4.3), EAT, BREAKFAST, LUNCH, DINNER (5.3), MECHANIC (5.4) |
| Letters | **A–Z**. J and Z use a rule-based motion check (a stopgap); the rest use the handshape model |
| Numbers | **0–9** (0 is scored with the O handshape) |

These signs have two variants, and either one is accepted: DEAF, SAME, WOMAN, WANT, MOVIE, SWIM, RUN.

## Not recognizable, and what would change that

**Numbers 10 and up** (1.3: 10–15, 2.2: 16–29, 3.4: 30–66, 4.4: 67–100). Not planned for M1. These are
movement signs with no multi-signer dataset. Exceptions: ASL Citizen has ELEVEN and HUNDRED, which could be added on
request. Skip Produce for the rest.

**Unit 3–5 signs in ASL Citizen but not trained yet.** These need a retrain (about an hour of extraction and
training). Ask, and name which units to cover first.
- 3.1 LIVE, HOUSE, CITY, ALONE, ROOMMATE, CAT, DORM (as DORMITORY)
- 3.2 BATHROOM, LIBRARY, OFFICE, DOOR, WINDOW, LEFT, RIGHT
- 3.3 CAR, BUS, WALK, TRAIN, DRIVE, WORK, SCHOOL, BIKE (as BICYCLE)
- 4.1 FAMILY, MOTHER, FATHER, PARENTS, SISTER, BROTHER, BABY
- 4.2 GRANDMOTHER, GRANDFATHER, AUNT, UNCLE, COUSIN, MARRIED (as MARRY), DIVORCED (DIVORCE), DIED (DIE)
- 4.3 ME, YOU, HE, WE, HIS, OUR. I = ME, SHE = HE and HER = HIS are the same signs in ASL and would be aliased.
- 5.1 all: MONDAY–SUNDAY, TODAY, TOMORROW, YESTERDAY, WEEK, MORNING, AFTERNOON, NIGHT
- 5.2 CLEAN, WASH, SHOP, FINISH, NOT-YET
- 5.3 SLEEP, STUDY, EXERCISE, ALWAYS, SOMETIMES, NEVER
- 5.4 WORK, DOCTOR, NURSE, LAWYER, BOSS

**Not in any dataset we have.** These stay unrecognizable for M1, so skip Produce:
- ASL (2.1)
- APARTMENT (3.1)
- CLASSROOM, UPSTAIRS (3.2)
- OLDER, YOUNGER (4.1). The base signs OLD and YOUNG exist, but the comparatives are different signs.
- DISHES, LAUNDRY (5.2)
- JOB (5.4)
- Unit 6 story vocabulary (depends on the story)

## Accuracy

Signs (held-out signers, judged per lesson with `allowed` = lesson signs):

- 89% of correct attempts accepted
- 0.3% of other lesson signs, and 1.5% of never-seen signs, wrongly accepted as the target
- Weakest: COOK, READ, TRAVEL, PLEASE, BLUE (about 62–69%), mostly by rejection, which reads as "try again"
- Reproduce with `ml/eval_lessons.py`. The thresholds live in `decide.ts`.

Letters and digits (handshape model):

- Digits 0–4 and 6–9, on 144 ASL Citizen clips from held-out fluent signers in a digit lesson: 99.3% correct.
  1–4 are trained on ASL Citizen only, because ASL-HG shows them palm out and fluent signers sign them palm in.
- 5 comes from ASL-HG only and has no fluent-signer check.
- Letters, on held-out ASL-HG signers (stills, not webcam): 92% when compared against every class. The weak pairs
  are R/U, N/M and I/J (76–84%). These numbers come from 10 signers, not from fluent webcam video, so treat them
  as optimistic.
- Pairs that are the same handshape (V/2, W/6, O/0) are kept apart only because a lesson allows letters or digits,
  not both. Don't mix letters and digits in one `allowed` list.
- The rejection thresholds for letters and digits are untuned starting values.
