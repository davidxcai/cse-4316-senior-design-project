import { useState, type KeyboardEvent } from "react";
import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import { useAuth } from "../../../hooks/useAuth";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import ProfileAvatar from "./ProfileAvatar";
import SaveError from "./SaveError";

export default function ProfileHeader() {
  const { user } = useAuth();
  const { mutate, isPending, isError, reset } = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  if (!user) return null;

  const trimmed = draft.trim();
  const edit = () => {
    reset();
    setDraft(user.name);
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const save = () => {
    if (!trimmed || isPending) return;
    if (trimmed === user.name) return cancel();
    // success closes the editor; on error it closes too, so the old name shows again
    mutate({ name: trimmed }, { onSettled: cancel });
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") save();
    else if (e.key === "Escape") cancel();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <ProfileAvatar name={user.name} />
        {editing ? (
          <>
            <input
              className="input flex-1"
              value={draft}
              maxLength={50}
              autoFocus
              disabled={isPending}
              aria-label="Name"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button type="button" className="btn btn-ghost btn-square" aria-label="Save" disabled={!trimmed || isPending} onClick={save}>
              {isPending ? <span className="loading loading-spinner loading-sm" /> : <IconCheck size={20} />}
            </button>
            <button type="button" className="btn btn-ghost btn-square" aria-label="Cancel" disabled={isPending} onClick={cancel}>
              <IconX size={20} />
            </button>
          </>
        ) : (
          <>
            <h1 className="flex-1 truncate text-2xl font-bold">{user.name}</h1>
            <button type="button" className="btn btn-ghost btn-square" aria-label="Edit name" onClick={edit}>
              <IconPencil size={20} />
            </button>
          </>
        )}
      </div>
      {isError && <SaveError />}
    </div>
  );
}
