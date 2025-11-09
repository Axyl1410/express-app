import { Resend } from "resend";

import { assertValue } from "./utils";

const key = assertValue(process.env.RESEND_SECRET, "RESEND_SECRET is not set");

export const resend = new Resend(key);
