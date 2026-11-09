import type { Clip } from "../../domain/signContent";
import type { Item } from "../../recognition";

/** The one sign the landing demo teaches and checks. */
export const HELLO: Item = { kind: "sign", gloss: "HELLO" };

// TODO: fluent-signer HELLO clip (YouTube video id + start/end seconds). null renders a skeleton frame.
export const HELLO_CLIP: Clip | null = null;
