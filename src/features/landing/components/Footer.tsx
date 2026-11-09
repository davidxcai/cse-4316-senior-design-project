import { IconHandStop } from "@tabler/icons-react";

export default function Footer() {
  return (
    <footer className="footer footer-center bg-base-200 p-6">
      <div className="flex items-center gap-2">
        <IconHandStop size={24} />
        <span className="font-bold">signify</span>
        <span>{new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
