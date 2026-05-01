import { Resend } from "resend";
import { v } from "convex/values";
import { action } from "./_generated/server";

export const sendApprovedEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (_ctx, args) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || "Miguel Cedillo <outreach@voxmedia.com.mx>",
      to: [args.to],
      subject: args.subject,
      html: args.html,
      replyTo: process.env.RESEND_REPLY_TO || "miguel@voxmedia.com.mx",
    });

    return result;
  },
});

