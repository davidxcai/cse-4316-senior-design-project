import { IconAlertTriangle, IconRotate } from "@tabler/icons-react";
import { useRef } from "react";
import { useResetProgress } from "../hooks/useResetProgress";

export default function ResetProgress() {
  const dialog = useRef<HTMLDialogElement>(null);
  const { mutate, isPending, isError, reset } = useResetProgress();

  const open = () => {
    reset();
    dialog.current?.showModal();
  };
  const confirm = () => mutate(undefined, { onSuccess: () => dialog.current?.close() });

  return (
    <>
      <div>
        <button type="button" className="btn btn-error btn-outline" onClick={open}>
          <IconRotate size={20} aria-hidden />
          Reset progress
        </button>
      </div>
      <dialog
        ref={dialog}
        className="modal"
        aria-labelledby="reset-progress-title"
        onCancel={(e) => isPending && e.preventDefault()}
      >
        <div className="modal-box flex flex-col gap-4">
          <h3 id="reset-progress-title" className="flex items-center gap-2 text-lg font-bold">
            <IconAlertTriangle size={20} aria-hidden />
            Reset all progress?
          </h3>
          {isError && (
            <div role="alert" className="alert alert-error alert-soft py-2">
              <IconAlertTriangle size={20} aria-hidden />
              <span>Couldn't reset</span>
            </div>
          )}
          <div className="modal-action">
            <button type="button" className="btn" disabled={isPending} onClick={() => dialog.current?.close()}>
              Cancel
            </button>
            <button type="button" className="btn btn-error" disabled={isPending} onClick={confirm}>
              {isPending ? <span className="loading loading-spinner loading-sm" /> : <IconRotate size={20} aria-hidden />}
              Reset
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button disabled={isPending} aria-label="Close">
            close
          </button>
        </form>
      </dialog>
    </>
  );
}
