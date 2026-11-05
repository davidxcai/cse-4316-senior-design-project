// Titles from curriculum.md "Unit lesson plans".
const UNITS = [
  { title: "Introducing Oneself" },
  { title: "Exchanging Personal Information" },
  { title: "Discussing Living Situations" },
  { title: "Talking About Family" },
  { title: "Telling About Activities" },
  { title: "Storytelling", optional: true },
];

export default function CurriculumSection() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold">Curriculum</h2>
      <ul className="list rounded-box bg-base-100 shadow-sm">
        {UNITS.map((u, i) => (
          <li key={u.title} className="list-row items-center">
            <span className="text-2xl font-bold tabular-nums text-primary">{String(i + 1).padStart(2, "0")}</span>
            <span className="list-col-grow font-semibold">{u.title}</span>
            {u.optional && <span className="badge badge-outline">optional</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
