import { resend } from "../config/resend";
import { EMAIL_SENDER, NODE_ENV } from "../constant/env";
import { EmailDto } from "../dto/email-dto";

const getFromEmail = () =>
    NODE_ENV === "development" ? "onboarding@resend.dev" : EMAIL_SENDER;
  
  const getToEmail = (to: string) =>
    NODE_ENV === "development" ? "delivered@resend.dev" : to;
export const sendMail = async (
    request: EmailDto
) => {
    return await resend.emails.send({
        from: getFromEmail(),
        to: getToEmail(request.to),
        subject: request.subject,
        text: request.text,
        html: request.html
    });
} 