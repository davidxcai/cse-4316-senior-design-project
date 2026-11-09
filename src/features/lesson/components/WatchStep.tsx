import SignVideo from "../../../components/signing/SignVideo";
import { signInfo } from "../../../domain/signContent";
import type { Item } from "../../../recognition";
import SignCaption from "./SignCaption";

/** Watch layout (no camera): reference video and caption only [S.7–S.11]. */
export default function WatchStep({ item }: { item: Item }) {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4">
      <SignVideo clip={signInfo(item).clip} className="w-full" />
      <SignCaption item={item} />
    </div>
  );
}
